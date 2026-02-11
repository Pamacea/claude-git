#!/usr/bin/env node

/**
 * Git Flow Master - Web Interface Server (SECURED)
 * Local HTTP server for managing Git conventions, hooks, and repositories
 *
 * Security Features:
 * - Command injection prevention (spawn instead of execSync)
 * - Path traversal prevention (whitelist + validation)
 * - Rate limiting
 * - Security headers (Helmet)
 * - Input sanitization
 * - Error message sanitization
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();
const PORT = 3747; // Git Flow

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

// Allowed base paths for repository access (whitelist)
const ALLOWED_BASE_PATHS = [
  os.homedir(),
  '/home',
  '/Users',
  '/workspace',
  '/projects',
  'C:\\Users',
  'D:\\Projects',
  process.cwd()
].filter(Boolean);

// Rate limiting configuration
const RATE_LIMITS = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// CSRF tokens
const CSRF_TOKENS = new Map();
const CSRF_TOKEN_EXPIRY_MS = 3600000; // 1 hour

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: false, // localhost doesn't need HSTS
}));

// Body parser with limits
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb
app.use(express.static('public'));

// Rate limiting middleware
function rateLimitMiddleware(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!RATE_LIMITS.has(clientIp)) {
    RATE_LIMITS.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  const limit = RATE_LIMITS.get(clientIp);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }

  limit.count++;

  if (limit.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}

app.use('/api/', rateLimitMiddleware);

// CSRF token generation
function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  CSRF_TOKENS.set(token, { createdAt: Date.now() });
  return token;
}

function validateCSRFToken(token) {
  if (!token) return false;
  const stored = CSRF_TOKENS.get(token);
  if (!stored) return false;
  if (Date.now() - stored.createdAt > CSRF_TOKEN_EXPIRY_MS) {
    CSRF_TOKENS.delete(token);
    return false;
  }
  return true;
}

// Clean up expired CSRF tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of CSRF_TOKENS.entries()) {
    if (now - data.createdAt > CSRF_TOKEN_EXPIRY_MS) {
      CSRF_TOKENS.delete(token);
    }
  }
}, 300000); // Every 5 minutes

// Clean up rate limits periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of RATE_LIMITS.entries()) {
    if (now > data.resetTime) {
      RATE_LIMITS.delete(ip);
    }
  }
}, 60000); // Every minute

// ============================================================================
// DATA DIRECTORY
// ============================================================================

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Secure command execution using spawn instead of execSync
 * Prevents shell injection attacks
 */
function execSecure(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024, // 1MB max
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 1024 * 1024) {
        proc.kill();
        reject(new Error('Output exceeded maximum size'));
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (error) => {
      reject(new Error(`Command failed: ${sanitizeErrorMessage(error.message)}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}: ${sanitizeErrorMessage(stderr)}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Validate repository path against whitelist
 * Prevents path traversal attacks
 */
async function validateRepoPath(repoPath) {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  // Check for null bytes
  if (repoPath.includes('\0')) {
    throw new Error('Invalid path: null bytes not allowed');
  }

  // Normalize and resolve path
  const normalizedPath = path.normalize(path.resolve(repoPath));

  // Check if path is within allowed directories
  const isAllowed = ALLOWED_BASE_PATHS.some(allowedPath => {
    const normalizedAllowed = path.normalize(path.resolve(allowedPath));
    return normalizedPath.startsWith(normalizedAllowed);
  });

  if (!isAllowed) {
    throw new Error('Access denied: path outside allowed directories');
  }

  // Verify .git directory exists
  const gitDir = path.join(normalizedPath, '.git');
  try {
    const stat = await fs.stat(gitDir);
    if (!stat.isDirectory()) {
      throw new Error('Not a git repository');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Not a git repository');
    }
    throw error;
  }

  return normalizedPath;
}

/**
 * Validate directory path for scanning
 */
async function validateScanPath(dirPath) {
  if (!dirPath || typeof dirPath !== 'string') {
    return os.homedir(); // Default to home
  }

  // Check for null bytes
  if (dirPath.includes('\0')) {
    throw new Error('Invalid path: null bytes not allowed');
  }

  // Normalize path
  const normalizedPath = path.normalize(path.resolve(dirPath));

  // Check if path is within allowed directories
  const isAllowed = ALLOWED_BASE_PATHS.some(allowedPath => {
    const normalizedAllowed = path.normalize(path.resolve(allowedPath));
    return normalizedPath.startsWith(normalizedAllowed);
  });

  if (!isAllowed) {
    throw new Error('Access denied: path outside allowed directories');
  }

  return normalizedPath;
}

/**
 * Sanitize commit message
 */
function sanitizeCommitMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }

  // Remove null bytes and control characters except newlines
  let sanitized = message.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > 5000) {
    throw new Error('Message too long (max 5000 characters)');
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /`[^`]*`/g, // Backticks (shell command substitution)
    /\$\([^)]*\)/g, // $(...) command substitution
    /\$\{[^}]*\}/g, // ${...} variable expansion
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Message contains forbidden patterns');
    }
  }

  return sanitized;
}

/**
 * Sanitize file path
 */
function sanitizeFilePath(filePath) {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }

  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');

  // Check for path traversal
  if (sanitized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  // Limit length
  if (sanitized.length > 4096) {
    throw new Error('File path too long');
  }

  return sanitized;
}

/**
 * Sanitize version string
 */
function sanitizeVersion(version) {
  if (typeof version !== 'string') {
    throw new Error('Version must be a string');
  }

  // Only allow semver-like strings
  const validPattern = /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  if (!validPattern.test(version)) {
    throw new Error('Invalid version format');
  }

  return version;
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message) {
  if (typeof message !== 'string') return 'An error occurred';

  // Remove file paths
  let sanitized = message.replace(/\/[^\s:]+/g, '[path]');

  // Remove user names
  sanitized = sanitized.replace(/\/Users\/[^/\s]+/g, '/Users/[user]');
  sanitized = sanitized.replace(/\/home\/[^/\s]+/g, '/home/[user]');
  sanitized = sanitized.replace(/C:\\Users\\[^\\s]+/g, 'C:\\Users\\[user]');

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }

  return sanitized;
}

/**
 * Hash sensitive data for logging
 */
function hashForLog(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex').substring(0, 8);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'hooks'), { recursive: true });

    // Default config
    if (!(await fileExists(CONFIG_FILE))) {
      const defaultConfig = require('../.git-flow-config.json');
      await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    // Default state
    if (!(await fileExists(STATE_FILE))) {
      await fs.writeFile(STATE_FILE, JSON.stringify({
        repositories: [],
        activeHooks: {},
        lastSync: null
      }, null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize:', sanitizeErrorMessage(error.message));
    process.exit(1);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function git(cwd) {
  return {
    status: async () => {
      const result = await execSecure('git', ['status', '--porcelain'], { cwd });
      return result.trim().split('\n').filter(Boolean);
    },
    branch: async () => {
      const result = await execSecure('git', ['branch', '--show-current'], { cwd });
      return result.trim();
    },
    branches: async () => {
      const result = await execSecure('git', ['branch', '-a'], { cwd });
      return result.trim().split('\n').map(b => b.replace('*', '').trim());
    },
    log: async (n = 20) => {
      const result = await execSecure('git', ['log', '--oneline', `-${n}`], { cwd });
      return result.trim().split('\n');
    },
    remotes: async () => {
      const result = await execSecure('git', ['remote', '-v'], { cwd });
      const lines = result.trim().split('\n');
      const remotes = {};
      lines.forEach(line => {
        const [name, url] = line.split(/\s+/);
        remotes[name] = url;
      });
      return remotes;
    },
    tags: async () => {
      const result = await execSecure('git', ['tag', '--sort=-version:refname'], { cwd });
      return result.trim().split('\n').filter(Boolean);
    },
    config: async () => {
      const result = await execSecure('git', ['config', '--list'], { cwd });
      const config = {};
      result.trim().split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        config[key] = valueParts.join('=');
      });
      return config;
    },
    isRepo: async () => {
      try {
        await execSecure('git', ['rev-parse', '--git-dir'], { cwd });
        return true;
      } catch {
        return false;
      }
    }
  };
}

// ============================================================================
// API ROUTES
// ============================================================================

// Get CSRF token
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  res.json({ token });
});

// Get config
app.get('/api/config', async (req, res) => {
  try {
    const config = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf-8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Update config (requires CSRF)
app.put('/api/config', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    // Validate config structure
    const config = req.body;
    if (typeof config !== 'object' || config === null) {
      return res.status(400).json({ error: 'Invalid config format' });
    }

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Get state
app.get('/api/state', async (req, res) => {
  try {
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Update state (requires CSRF)
app.put('/api/state', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    // Validate state structure
    const state = req.body;
    if (typeof state !== 'object' || state === null) {
      return res.status(400).json({ error: 'Invalid state format' });
    }

    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Scan directory for git repositories
app.get('/api/scan', async (req, res) => {
  try {
    const dir = await validateScanPath(req.query.dir);
    const depth = Math.min(Math.max(parseInt(req.query.depth) || 2, 1), 5); // 1-5
    const repos = [];

    async function scanDir(currentDir, currentDepth) {
      if (currentDepth > depth) return;

      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;

          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            const gitDir = path.join(fullPath, '.git');
            if (await fileExists(gitDir)) {
              try {
                const validatedPath = await validateRepoPath(fullPath);
                const gitApi = git(validatedPath);
                const branch = await gitApi.branch();
                const remotes = await gitApi.remotes();
                const tags = await gitApi.tags();
                const log = await gitApi.log(10);
                const repoConfig = await gitApi.config();

                repos.push({
                  path: validatedPath,
                  name: path.basename(validatedPath),
                  branch,
                  remotes,
                  tags,
                  recentCommits: log,
                  config: {
                    'remote.origin.url': repoConfig['remote.origin.url'] || '',
                    'user.name': repoConfig['user.name'] || '',
                    'user.email': repoConfig['user.email'] || ''
                  },
                  tracked: true,
                  lastScan: new Date().toISOString()
                });
              } catch (repoError) {
                console.error(`Failed to scan repo ${hashForLog(fullPath)}:`, sanitizeErrorMessage(repoError.message));
              }
            } else {
              await scanDir(fullPath, currentDepth + 1);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await scanDir(dir, 0);
    res.json({ repositories: repos });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Get repository details
app.get('/api/repo', async (req, res) => {
  try {
    const repoPath = req.query.path;
    if (!repoPath) {
      return res.status(400).json({ error: 'path parameter required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const gitApi = git(validatedPath);

    const [
      branch,
      branches,
      status,
      log,
      remotes,
      tags,
      repoConfig
    ] = await Promise.all([
      gitApi.branch(),
      gitApi.branches(),
      gitApi.status(),
      gitApi.log(50),
      gitApi.remotes(),
      gitApi.tags(),
      gitApi.config()
    ]);

    res.json({
      path: validatedPath,
      name: path.basename(validatedPath),
      branch,
      branches,
      status,
      commits: log,
      remotes,
      tags,
      config: repoConfig
    });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Install hooks for repository (requires CSRF)
app.post('/api/repo/hooks/install', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    const { path: repoPath } = req.body;
    const validatedPath = await validateRepoPath(repoPath);
    const hooksDir = path.join(validatedPath, '.git', 'hooks');

    await fs.mkdir(hooksDir, { recursive: true });

    const pluginHooksDir = path.join(__dirname, '..', 'hooks');
    const hooks = ['pre-commit', 'commit-msg', 'post-release'];
    const isWindows = process.platform === 'win32';
    const hookExtension = isWindows ? '.ps1' : '.sh';

    const installedHooks = [];

    for (const hook of hooks) {
      const source = path.join(pluginHooksDir, `${hook}${hookExtension}`);
      const target = path.join(hooksDir, hook);

      if (await fileExists(source)) {
        let content = await fs.readFile(source, 'utf-8');

        if (isWindows) {
          // PowerShell hook - create wrapper that calls PowerShell
          const ps1Target = path.join(hooksDir, `${hook}.ps1`);
          await fs.writeFile(ps1Target, content, { mode: 0o644 });

          // Create batch wrapper for Git to call
          const batchWrapper = `@echo off
powershell -ExecutionPolicy Bypass -File "${ps1Target}" %*
`;
          await fs.writeFile(target, batchWrapper, { mode: 0o755 });
        } else {
          // Unix shell hook
          // Add shebang if missing
          if (!content.startsWith('#!')) {
            content = '#!/bin/bash\n' + content;
          }
          await fs.writeFile(target, content, { mode: 0o755 });
        }

        installedHooks.push(hook);
      }
    }

    // Update state
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    if (!state.activeHooks[validatedPath]) {
      state.activeHooks[validatedPath] = {};
    }
    installedHooks.forEach(h => {
      state.activeHooks[validatedPath][h] = true;
    });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));

    res.json({ success: true, hooks: installedHooks, platform: isWindows ? 'windows' : 'unix' });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Uninstall hooks for repository (requires CSRF)
app.post('/api/repo/hooks/uninstall', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    const { path: repoPath } = req.body;
    const validatedPath = await validateRepoPath(repoPath);
    const hooksDir = path.join(validatedPath, '.git', 'hooks');

    const hooks = ['pre-commit', 'commit-msg', 'post-release'];
    const isWindows = process.platform === 'win32';

    for (const hook of hooks) {
      const target = path.join(hooksDir, hook);
      if (await fileExists(target)) {
        await fs.unlink(target);
      }
      // Also remove PowerShell script on Windows
      if (isWindows) {
        const ps1Target = path.join(hooksDir, `${hook}.ps1`);
        if (await fileExists(ps1Target)) {
          await fs.unlink(ps1Target);
        }
      }
    }

    // Update state
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf-8'));
    if (state.activeHooks[validatedPath]) {
      hooks.forEach(h => {
        delete state.activeHooks[validatedPath][h];
      });
      if (Object.keys(state.activeHooks[validatedPath]).length === 0) {
        delete state.activeHooks[validatedPath];
      }
    }
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Commit with conventions (requires CSRF)
app.post('/api/repo/commit', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    const { path: repoPath, message, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const sanitizedMessage = sanitizeCommitMessage(message);

    // Stage files if specified
    if (files && Array.isArray(files) && files.length > 0) {
      const sanitizedFiles = files.map(f => sanitizeFilePath(f));
      await execSecure('git', ['add', ...sanitizedFiles], { cwd: validatedPath });
    }

    // Commit with sanitized message
    await execSecure('git', ['commit', '-m', sanitizedMessage], { cwd: validatedPath });

    res.json({ success: true, message: sanitizedMessage });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Generate release (requires CSRF)
app.post('/api/repo/release', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    const { path: repoPath, version, autoTag = true } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Version is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const sanitizedVersion = sanitizeVersion(version);
    const gitApi = git(validatedPath);
    const tags = await gitApi.tags();

    if (tags.includes(sanitizedVersion)) {
      return res.status(400).json({ error: `Tag already exists` });
    }

    // Get commits since last tag
    const lastTag = tags[0] || '';
    const commits = await execSecure('git', ['log', `${lastTag}..HEAD`, '--pretty=format:%s'], { cwd: validatedPath });

    // Categorize commits
    const categorized = {
      feat: [],
      fix: [],
      docs: [],
      others: []
    };

    commits.trim().split('\n').forEach(commit => {
      if (commit.startsWith('feat:')) categorized.feat.push(commit);
      else if (commit.startsWith('fix:')) categorized.fix.push(commit);
      else if (commit.startsWith('docs:')) categorized.docs.push(commit);
      else categorized.others.push(commit);
    });

    // Generate changelog
    const changelog = {
      version: sanitizedVersion,
      date: new Date().toISOString().split('T')[0],
      commits: categorized
    };

    // Create tag if auto-tag is enabled
    if (autoTag) {
      await execSecure('git', ['tag', '-a', sanitizedVersion, '-m', `Release ${sanitizedVersion}`], { cwd: validatedPath });
    }

    res.json({ success: true, changelog, tagCreated: autoTag });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Validate commit message (Versioned Release Convention)
app.post('/api/validate/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sanitizedMessage = sanitizeCommitMessage(message);
    const subject = sanitizedMessage.split('\n')[0];

    // Versioned Release Convention Pattern
    // Format: TYPE: PROJECT NAME - vVERSION
    const pattern = /^(RELEASE|UPDATE|PATCH): [A-Za-z0-9_ -]+ - v[0-9]+\.[0-9]+\.[0-9]+/;

    const errors = [];
    const warnings = [];

    if (!pattern.test(subject)) {
      errors.push('Message must follow Versioned Release Convention: TYPE: PROJECT NAME - vVERSION');
      errors.push('Valid types: RELEASE, UPDATE, PATCH');
      errors.push('Example: UPDATE: My Project - v1.1.0');
    }

    if (subject.length > 100) {
      errors.push('Subject line must be 100 characters or less');
    }

    // Extract info if valid
    let parsed = null;
    if (pattern.test(subject)) {
      const typeMatch = subject.match(/^(RELEASE|UPDATE|PATCH)/);
      const versionMatch = subject.match(/v[0-9]+\.[0-9]+\.[0-9]+/);
      const projectMatch = subject.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v/);

      parsed = {
        type: typeMatch ? typeMatch[1] : null,
        version: versionMatch ? versionMatch[0] : null,
        project: projectMatch ? projectMatch[2].trim() : null
      };

      // Check for body
      const bodyLines = sanitizedMessage.split('\n').slice(2).filter(l => l.trim());
      if (bodyLines.length === 0) {
        warnings.push('Consider adding change description in the body');
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
      parsed
    });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Get commit type suggestions (Versioned Release Convention)
app.get('/api/suggest/types', (req, res) => {
  const types = {
    RELEASE: {
      description: 'Major release - Breaking changes, new major version',
      emoji: '🚀',
      semver: 'MAJOR',
      format: 'RELEASE: {project} - v{version}',
      example: 'RELEASE: My Project - v2.0.0'
    },
    UPDATE: {
      description: 'Minor update - New features, enhancements',
      emoji: '✨',
      semver: 'MINOR',
      format: 'UPDATE: {project} - v{version}',
      example: 'UPDATE: My Project - v1.1.0'
    },
    PATCH: {
      description: 'Patch - Bug fixes, small improvements',
      emoji: '🔧',
      semver: 'PATCH',
      format: 'PATCH: {project} - v{version}',
      example: 'PATCH: My Project - v1.0.1'
    }
  };
  res.json(types);
});

// Get last commit info for amend
app.get('/api/repo/last-commit', async (req, res) => {
  try {
    const repoPath = req.query.path;
    if (!repoPath) {
      return res.status(400).json({ error: 'path parameter required' });
    }

    const validatedPath = await validateRepoPath(repoPath);

    // Get last commit message
    const lastMsg = await execSecure('git', ['log', '-1', '--pretty=%B'], { cwd: validatedPath });
    const lastSubject = await execSecure('git', ['log', '-1', '--pretty=%s'], { cwd: validatedPath });
    const lastHash = await execSecure('git', ['log', '-1', '--pretty=%H'], { cwd: validatedPath });
    const lastDate = await execSecure('git', ['log', '-1', '--pretty=%aI'], { cwd: validatedPath });

    // Parse version from last commit
    const versionMatch = lastSubject.match(/v[0-9]+\.[0-9]+\.[0-9]+/);
    const typeMatch = lastSubject.match(/^(RELEASE|UPDATE|PATCH)/);
    const projectMatch = lastSubject.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v/);

    res.json({
      hash: lastHash.trim(),
      subject: lastSubject.trim(),
      message: lastMsg.trim(),
      date: lastDate.trim(),
      parsed: {
        type: typeMatch ? typeMatch[1] : null,
        version: versionMatch ? versionMatch[0] : null,
        project: projectMatch ? projectMatch[2].trim() : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Amend last commit (requires CSRF)
app.post('/api/repo/amend', async (req, res) => {
  try {
    // CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }

    const { path: repoPath, message, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const sanitizedMessage = sanitizeCommitMessage(message);

    // Stage files if specified
    if (files && Array.isArray(files) && files.length > 0) {
      const sanitizedFiles = files.map(f => sanitizeFilePath(f));
      await execSecure('git', ['add', ...sanitizedFiles], { cwd: validatedPath });
    }

    // Amend commit
    await execSecure('git', ['commit', '--amend', '-m', sanitizedMessage], { cwd: validatedPath });

    // Get new commit info
    const newHash = await execSecure('git', ['log', '-1', '--pretty=%H'], { cwd: validatedPath });

    res.json({
      success: true,
      message: sanitizedMessage,
      newHash: newHash.trim()
    });
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// Get suggested version for next commit
app.get('/api/suggest/version', async (req, res) => {
  try {
    const repoPath = req.query.path;
    if (!repoPath) {
      return res.status(400).json({ error: 'path parameter required' });
    }

    const validatedPath = await validateRepoPath(repoPath);

    // Get last tag
    let lastTag = '';
    try {
      lastTag = await execSecure('git', ['describe', '--tags', '--abbrev=0'], { cwd: validatedPath });
      lastTag = lastTag.trim();
    } catch {
      // No tags yet
    }

    // Get last commit
    const lastSubject = await execSecure('git', ['log', '-1', '--pretty=%s'], { cwd: validatedPath });

    // Parse versions
    const tagVersion = lastTag ? lastTag.replace('v', '').split('.').map(Number) : [0, 0, 0];
    const commitVersionMatch = lastSubject.match(/v([0-9]+)\.([0-9]+)\.([0-9]+)/);
    const commitVersion = commitVersionMatch
      ? [parseInt(commitVersionMatch[1]), parseInt(commitVersionMatch[2]), parseInt(commitVersionMatch[3])]
      : tagVersion;

    // Generate suggestions
    const suggestions = {
      RELEASE: `v${tagVersion[0] + 1}.0.0`,
      UPDATE: `v${tagVersion[0]}.${tagVersion[1] + 1}.0`,
      PATCH: `v${tagVersion[0]}.${tagVersion[1]}.${tagVersion[2] + 1}`,
      current: {
        tag: lastTag || 'none',
        lastCommit: commitVersionMatch ? `v${commitVersion.join('.')}` : 'none'
      }
    };

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: sanitizeErrorMessage(error.message) });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

init().then(() => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Git Flow Master - Web Interface (SECURED)             ║
║                                                            ║
║  Interface: http://localhost:${PORT}                       ║
║  API:        http://localhost:${PORT}/api                  ║
║                                                            ║
║  Security Features Enabled:                                ║
║  ✓ Command injection prevention                            ║
║  ✓ Path traversal prevention                               ║
║  ✓ Rate limiting (100 req/min)                             ║
║  ✓ CSRF protection                                         ║
║  ✓ Security headers (Helmet)                               ║
║  ✓ Input sanitization                                      ║
║                                                            ║
║  Press Ctrl+C to stop                                      ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}).catch(error => {
  console.error('Failed to start server:', sanitizeErrorMessage(error.message));
  process.exit(1);
});
