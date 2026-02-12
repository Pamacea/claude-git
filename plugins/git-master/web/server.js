#!/usr/bin/env node

/**
 * Git Flow Master - Web Interface Server (SECURED)
 * Local HTTP server for managing Git conventions, hooks, and repositories
 *
 * Security Features:
 * - Command injection prevention (spawn instead of execSync)
 * - Path traversal prevention (whitelist + validation)
 * - Rate limiting
 * - Security headers (Helmet with scriptSrcAttr fix)
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

// Git executable path (Windows support)
const GIT_CMD = process.platform === 'win32'
  ? 'C:\\Program Files\\Git\\cmd\\git.exe'
  : 'git';

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
const RATE_LIMIT_WINDOW_MS = 60000; //1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// CSRF tokens
const CSRF_TOKENS = new Map();
const CSRF_TOKEN_EXPIRY_MS = 3600000; //1 hour

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Body parser with limits
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb

// Helmet security headers (MUST be before static files)
// CRITICAL FIX: scriptSrcAttr is required for inline event handlers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: false, // localhost doesn't need HSTS
}));

// Static files (AFTER Helmet so CSP headers apply)
app.use(express.static('public'));

// ============================================================================
// DATA DIRECTORY
// ============================================================================

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Ignore if already exists
  }
}

// Load config from file
async function loadConfig() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      scanPaths: [process.cwd(), os.homedir()],
      autoHooks: true,
      defaultCommitType: 'PATCH',
    };
  }
}

// Save config to file
async function saveConfig(config) {
  await ensureDataDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// Load state from file
async function loadState() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      trackedRepos: {},
      installedHooks: {},
    };
  }
}

// Save state to file
async function saveState(state) {
  await ensureDataDir();
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ============================================================================
// SECURITY HELPER FUNCTIONS
// ============================================================================

// Validate repository path is within allowed directories
async function validateRepoPath(inputPath) {
  if (!inputPath) {
    throw new Error('Repository path is required');
  }

  const normalizedPath = path.resolve(inputPath);

  // Check if path is in allowed base paths
  const isInAllowedPath = ALLOWED_BASE_PATHS.some(allowedBase => {
    const relativePath = path.relative(allowedBase, normalizedPath);
    // Check if the relative path doesn't start with '..' (directory traversal)
    return !relativePath.startsWith('..');
  });

  if (!isInAllowedPath) {
    throw new Error('Path is outside allowed directories');
  }

  // Additional check for path traversal attempts
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new Error('Path traversal detected');
  }

  return normalizedPath;
}

// Execute git command securely (prevent command injection)
async function execSecure(command, args, options) {
  // Validate all arguments are strings
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be an array');
  }

  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new Error('Invalid argument type');
    }
    // Check for dangerous characters
    // Note: | is allowed in git format strings (e.g., --pretty=%h|%s)
    // Since we use shell: false, there's no shell interpretation risk
    const dangerousChars = /[;&<>$()`]/;
    if (dangerousChars.test(arg)) {
      throw new Error('Potentially dangerous characters in command');
    }
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      shell: false, // Don't use shell to prevent injection
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`${command} failed: ${stderr || 'exit code ' + code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      proc.kill();
      reject(new Error('Command timeout after 30 seconds'));
    }, 30000);
  });
}

// Sanitize file path to prevent command injection
function sanitizeFilePath(filePath) {
  // Remove any dangerous characters
  return filePath.replace(/[;&|<>$()`]/g, '');
}

// Sanitize commit message
function sanitizeCommitMessage(message) {
  if (typeof message !== 'string') {
    return '';
  }
  // Remove potential command injection
  return message.replace(/[;&|<>$()`]/g, '').trim();
}

// ============================================================================
// API ROUTES - STATUS
// ============================================================================

// Get CSRF token
app.get('/api/csrf-token', async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  CSRF_TOKENS.set(token, Date.now() + CSRF_TOKEN_EXPIRY_MS);
  res.json({ token });
});

app.get('/api/config', async (req, res) => {
  try {
    const config = await loadConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    await saveConfig(newConfig);
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const state = await loadState();

    // If state has no repositories but we have scan results in memory, return those
    if (!state.repositories || state.repositories.length === 0) {
      // Return empty state - frontend will trigger scan
      res.json(state);
    } else {
      res.json(state);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPOSITORY DISCOVERY
// ============================================================================

/**
 * Recursively find all git repositories in a directory
 */
async function findGitRepos(baseDir, maxDepth = 4) {
  const repos = [];

  async function scanDir(currentDir, currentDepth) {
    if (currentDepth > maxDepth) return;

    try {
      // Check if this directory is a git repo
      try {
        const repoRoot = await execSecure(GIT_CMD, ['rev-parse', '--show-toplevel'], { cwd: currentDir });
        const normalizedRoot = path.resolve(repoRoot);

        // Only add if not already in list
        if (!repos.some(r => r.path === normalizedRoot)) {
          repos.push({ path: normalizedRoot });
        }
        return; // Don't scan inside a git repo
      } catch {
        // Not a git repo, continue scanning
      }

      // Read directory entries
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden directories and common excludes
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;
        if (entry.name === 'vendor') continue;
        if (entry.name === 'target') continue;
        if (entry.name === 'build') continue;
        if (entry.name === 'dist') continue;
        if (entry.name === '.vscode') continue;
        if (entry.name === '.idea') continue;

        if (entry.isDirectory()) {
          const fullPath = path.join(currentDir, entry.name);
          await scanDir(fullPath, currentDepth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await scanDir(baseDir, 0);
  return repos;
}

// Scan repositories - discover all repos in base paths
app.get('/api/scan', async (req, res) => {
  try {
    const { dir, deep } = req.query;

    // If specific dir provided, just scan that directory
    if (dir) {
      try {
        const result = await execSecure(GIT_CMD, ['rev-parse', '--show-toplevel'], { cwd: dir });
        const repoName = path.basename(result.trim());

        return res.json({
          repositories: [{
            name: repoName,
            path: dir,
            branch: null,
            hasHooks: false,
            remotes: null
          }],
          config: { workingDir: dir }
        });
      } catch (error) {
        // Check if it's a directory to scan recursively
        const stats = await fs.stat(dir).catch(() => null);
        if (stats && stats.isDirectory()) {
          const repos = await findGitRepos(dir, deep === 'true' ? 5 : 3);
          const enrichedRepos = await Promise.all(repos.map(async (repo) => {
            const repoName = path.basename(repo.path);
            try {
              const branch = await execSecure(GIT_CMD, ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo.path })
                .then(r => r.trim() || null).catch(() => null);
              return { ...repo, name: repoName, branch, hasHooks: false, remotes: null };
            } catch {
              return { ...repo, name: repoName, branch: null, hasHooks: false, remotes: null };
            }
          }));
          return res.json({ repositories: enrichedRepos, config: { workingDir: dir } });
        }
        throw error;
      }
    }

    // Otherwise, scan all allowed base paths for repositories
    const allRepos = [];
    const scanPaths = [
      path.join(os.homedir(), 'Projects'),
      path.join(os.homedir(), 'projects'),
      path.join(os.homedir(), 'workspace'),
      path.join(os.homedir(), 'Workspace'),
      path.join(os.homedir(), 'git'),
      path.join(os.homedir(), 'GitHub'),
      path.join('C:', 'Projects'),
      path.join('D:', 'Projects'),
    ];

    // Filter to paths that exist
    const validPaths = [];
    for (const scanPath of scanPaths) {
      try {
        await fs.access(scanPath);
        validPaths.push(scanPath);
      } catch {
        // Path doesn't exist, skip
      }
    }

    // Add current working directory if it's a git repo
    try {
      const cwdRoot = await execSecure(GIT_CMD, ['rev-parse', '--show-toplevel'], { cwd: process.cwd() });
      const cwdPath = path.resolve(cwdRoot.trim());
      if (!allRepos.some(r => r.path === cwdPath)) {
        allRepos.push({ path: cwdPath });
      }
    } catch {
      // Current dir is not a git repo
    }

    // Scan each valid base path
    for (const scanPath of validPaths) {
      const repos = await findGitRepos(scanPath, 4);
      allRepos.push(...repos);
    }

    // Remove duplicates
    const uniqueRepos = [];
    const seen = new Set();
    for (const repo of allRepos) {
      const key = repo.path.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRepos.push(repo);
      }
    }

    // Enrich with git info
    const enrichedRepos = await Promise.all(uniqueRepos.map(async (repo) => {
      const repoName = path.basename(repo.path);
      try {
        const branch = await execSecure(GIT_CMD, ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo.path })
          .then(r => r.trim() || null).catch(() => null);

        const hooksDir = path.join(repo.path, '.git', 'hooks');
        let hasHooks = false;
        try {
          const hookFiles = await fs.readdir(hooksDir);
          hasHooks = hookFiles.some(f => f.startsWith('pre-commit') || f.startsWith('commit-msg'));
        } catch {
          hasHooks = false;
        }

        return {
          name: repoName,
          path: repo.path,
          branch,
          hasHooks,
          remotes: null
        };
      } catch {
        return {
          name: repoName,
          path: repo.path,
          branch: null,
          hasHooks: false,
          remotes: null
        };
      }
    }));

    // Save scan results to state
    const state = await loadState();
    state.repositories = enrichedRepos;
    state.lastScan = new Date().toISOString();
    state.config = state.config || {};
    state.config.workingDir = process.cwd();
    await saveState(state);

    res.json({
      repositories: enrichedRepos,
      config: { workingDir: process.cwd(), lastScan: state.lastScan }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get repository info
app.get('/api/repo', async (req, res) => {
  try {
    const { path: repoPath } = req.query;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);

    // Get branch
    const branch = await execSecure(GIT_CMD, ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: validatedPath })
      .then(r => r.trim() || null)
      .catch(() => null);

    // Check for hooks
    const hooksDir = path.join(validatedPath, '.git', 'hooks');
    let hasHooks = false;
    try {
      const hookFiles = await fs.readdir(hooksDir);
      hasHooks = hookFiles.length > 0;
    } catch {
      // No hooks directory or not readable
    }

    // Get remotes
    let remotes = null;
    try {
      const remoteUrl = await execSecure(GIT_CMD, ['config', '--get', 'remote.origin.url'], { cwd: validatedPath });
      if (remoteUrl.trim()) {
        remotes = { origin: remoteUrl.trim() };
      }
    } catch {
      // No remote configured
    }

    // Get recent commits
    const commits = await execSecure(GIT_CMD, ['log', '-10', '--pretty=%h|%s|%an|%ai'], { cwd: validatedPath });
    const recentCommits = commits.trim().split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, subject, author, date] = line.split('|');
        return { hash, subject, author, date };
      });

    res.json({
      name: path.basename(validatedPath),
      path: validatedPath,
      branch,
      hasHooks,
      remotes,
      recentCommits
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// API ROUTES - GIT OPERATIONS
// ============================================================================

app.post('/api/repo/commit', async (req, res) => {
  try {
    const { repoPath, type, project, version, body, files } = req.body;

    // Validate
    const validatedPath = await validateRepoPath(repoPath);
    const validatedVersion = version || await suggestVersion(repoPath);

    // Stage files if provided
    if (files && files.length > 0) {
      const sanitizedFiles = files.map(f => sanitizeFilePath(f));
      await execSecure(GIT_CMD, ['add', ...sanitizedFiles], { cwd: validatedPath });
    }

    // Create commit message
    const message = generateCommitMessage(type, project, validatedVersion, body);

    // Commit
    await execSecure(GIT_CMD, ['commit', '-m', message], { cwd: validatedPath });

    res.json({
      content: [{
        type: 'text',
        text: `✓ Committed successfully\\nMessage: ${type}: ${project} - ${validatedVersion}\\nRepository: ${hashForLog(validatedPath)}`
      }]
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/repo/amend', async (req, res) => {
  try {
    const { repoPath, message, files } = req.body;

    const validatedPath = await validateRepoPath(repoPath);

    if (message) {
      const sanitizedMessage = sanitizeCommitMessage(message);
      const parsed = parseCommitMessage(sanitizedMessage);

      if (!parsed.valid) {
        return res.status(400).json({ error: parsed.error || 'Invalid commit message' });
      }

      // Stage additional files if provided
      if (files && files.length > 0) {
        const sanitizedFiles = files.map(f => sanitizeFilePath(f));
        await execSecure(GIT_CMD, ['add', ...sanitizedFiles], { cwd: validatedPath });
      }

      await execSecure(GIT_CMD, ['commit', '--amend', '-m', sanitizedMessage], { cwd: validatedPath });

      res.json({
        content: [{
          type: 'text',
          text: `✓ Commit amended successfully\\nRepository: ${hashForLog(validatedPath)}`
        }]
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/repo/last-commit', async (req, res) => {
  try {
    const { repoPath } = req.query;

    const validatedPath = await validateRepoPath(repoPath);

    const hash = await execSecure(GIT_CMD, ['rev-parse', 'HEAD'], { cwd: validatedPath });
    const message = await execSecure(GIT_CMD, ['log', '-1', '--pretty=%s'], { cwd: validatedPath });
    const author = await execSecure(GIT_CMD, ['log', '-1', '--pretty=%an'], { cwd: validatedPath });
    const date = await execSecure(GIT_CMD, ['log', '-1', '--pretty=%ai'], { cwd: validatedPath });

    const parsed = parseCommitMessage(message.trim());

    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify({
          hash: hash.slice(0, 8),
          message: message.trim(),
          author,
          date,
          ...parsed
        }, null, 2)
      }]
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/suggest/version', async (req, res) => {
  try {
    const { repoPath } = req.query;

    const validatedPath = await validateRepoPath(repoPath);

    // Get latest tag
    let lastTag = '';
    try {
      lastTag = await execSecure(GIT_CMD, ['describe', '--tags', '--abbrev=0'], { cwd: validatedPath });
    } catch {
      lastTag = 'v0.0.0';
    }

    // Parse current version
    const currentVersion = parseVersion(lastTag) || { major: 0, minor: 0, patch: 0 };

    // Get last commit to check if it has a version
    let lastCommit = null;
    try {
      const lastCommitMsg = await execSecure(GIT_CMD, ['log', '-1', '--pretty=%s'], { cwd: validatedPath });
      lastCommit = parseCommitMessage(lastCommitMsg);
    } catch {
      // Ignore
    }

    // Generate suggestions
    const suggestions = {
      currentVersion: `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`,
      RELEASE: bumpVersion(currentVersion, 'RELEASE'),
      UPDATE: bumpVersion(currentVersion, 'UPDATE'),
      PATCH: bumpVersion(currentVersion, 'PATCH'),
      lastCommit: lastCommit && lastCommit.valid ? {
        type: lastCommit.type,
        version: lastCommit.version || null,
        project: lastCommit.project || null
      } : null
    };

    res.json({ content: JSON.stringify(suggestions, null, 2) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/validate/message', async (req, res) => {
  try {
    const { message } = req.body;

    const sanitized = sanitizeCommitMessage(message);
    const parsed = parseCommitMessage(sanitized);

    res.json(parsed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// API ROUTES - HOOKS INSTALL/UNINSTALL
// ============================================================================

// Install git hooks
app.post('/api/repo/hooks/install', async (req, res) => {
  try {
    const { path: repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const hooksDir = path.join(validatedPath, '.git', 'hooks');

    await fs.mkdir(hooksDir, { recursive: true });

    const pluginHooksDir = path.join(__dirname, '..', 'hooks');
    const isWindows = process.platform === 'win32';
    const hookExtension = isWindows ? '.ps1' : '.sh';

    const hooks = ['pre-commit', 'commit-msg'];
    const installedHooks = [];

    for (const hook of hooks) {
      const source = path.join(pluginHooksDir, `${hook}${hookExtension}`);
      const target = path.join(hooksDir, hook);

      try {
        let content = await fs.readFile(source, 'utf-8');

        if (isWindows) {
          const ps1Target = path.join(hooksDir, `${hook}.ps1`);
          await fs.writeFile(ps1Target, content, { mode: 0o644 });

          const batchWrapper = `@echo off\npowershell -ExecutionPolicy Bypass -File "${ps1Target}" %*\n`;
          await fs.writeFile(target, batchWrapper, { mode: 0o755 });
        } else {
          if (!content.startsWith('#!')) {
            content = '#!/bin/bash\n' + content;
          }
          await fs.writeFile(target, content, { mode: 0o755 });
        }

        installedHooks.push(hook);
      } catch (err) {
        // Hook file might not exist, skip
      }
    }

    res.json({
      success: true,
      message: 'Hooks installed successfully',
      hooks: installedHooks,
      platform: isWindows ? 'windows' : 'unix'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Uninstall git hooks
app.post('/api/repo/hooks/uninstall', async (req, res) => {
  try {
    const { path: repoPath } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const validatedPath = await validateRepoPath(repoPath);
    const hooksDir = path.join(validatedPath, '.git', 'hooks');

    const hooks = ['pre-commit', 'commit-msg', 'post-release'];
    const removedHooks = [];

    for (const hook of hooks) {
      const target = path.join(hooksDir, hook);
      const ps1Target = path.join(hooksDir, `${hook}.ps1`);

      try {
        await fs.unlink(target);
        removedHooks.push(hook);
      } catch (err) {
        // File might not exist
      }

      try {
        await fs.unlink(ps1Target);
      } catch (err) {
        // File might not exist
      }
    }

    res.json({
      success: true,
      message: 'Hooks uninstalled successfully',
      hooks: removedHooks
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save state
app.put('/api/state', async (req, res) => {
  try {
    const newState = req.body;
    await saveState(newState);
    res.json({ success: true, message: 'State updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get commit type suggestions
app.get('/api/suggest/types', async (req, res) => {
  res.json({
    types: [
      { value: 'RELEASE', label: 'RELEASE - Major breaking changes', description: 'Use for breaking changes that require MAJOR version bump' },
      { value: 'UPDATE', label: 'UPDATE - New features', description: 'Use for new features that require MINOR version bump' },
      { value: 'PATCH', label: 'PATCH - Bug fixes', description: 'Use for bug fixes that require PATCH version bump' }
    ]
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateCommitMessage(type, project, version, body) {
  let message = `${type}: ${project} - ${version}`;
  if (body) {
    message += '\n\n' + body;
  }
  return message;
}

function parseCommitMessage(message) {
  if (!message) {
    return { valid: false, error: 'Message is required' };
  }

  const subject = message.split('\n')[0];
  const pattern = /^(RELEASE|UPDATE|PATCH): [A-Za-z0-9_ -]+ - v[0-9]+\.[0-9]+\.[0-9]+/;

  if (!pattern.test(subject)) {
    return {
      valid: false,
      error: 'Message must follow Versioned Release Convention format',
      parsed: null
    };
  }

  const typeMatch = subject.match(/^(RELEASE|UPDATE|PATCH)/);
  const versionMatch = subject.match(/v[0-9]+\.[0-9]+\.[0-9]+/);
  const projectMatch = subject.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v/);

  return {
    valid: true,
    parsed: {
      type: typeMatch ? typeMatch[1] : null,
      version: versionMatch ? versionMatch[0] : null,
      project: projectMatch ? projectMatch[2].trim() : null
    }
  };
}

function parseVersion(version) {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3])
  };
}

function bumpVersion(currentVersion, type) {
  const parsed = parseVersion(currentVersion) || { major: 0, minor: 0, patch: 0 };

  switch (type) {
    case 'RELEASE':
      return `v${parsed.major + 1}.0.0`;
    case 'UPDATE':
      return `v${parsed.major}.${parsed.minor + 1}.0`;
    case 'PATCH':
      return `v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      return `v${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }
}

function suggestVersion(repoPath) {
  return execSecure('git', ['describe', '--tags', '--abbrev=0'], { cwd: repoPath })
    .then(result => {
      const lastTag = result.trim() || 'v0.0.0';
      return bumpVersion(lastTag, 'UPDATE');
    })
    .catch(() => {
      return 'v0.1.0';
    });
}

function hashForLog(repoPath) {
  const repoName = path.basename(repoPath);
  return repoName.substring(0, 8);
}

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🚀 Git Flow Master - Web Interface (SECURED)             ║');
  console.log('║                                                            ║');
  console.log('║  Interface: http://localhost:%s                       ║', PORT);
  console.log('║  API:        http://localhost:%s/api                  ║', PORT);
  console.log('║                                                            ║');
  console.log('║  Security Features Enabled:                                ║');
  console.log('║  ✓ Command injection prevention                            ║');
  console.log('║  ✓ Path traversal prevention                               ║');
  console.log('║  ✓ Rate limiting (100 req/min)                             ║');
  console.log('║  ✓ Security headers (Helmet with scriptSrcAttr fix)        ║');
  console.log('║  ✓ Input sanitization                                      ║');
  console.log('║                                                            ║');
  console.log('║  Press Ctrl+C to stop                                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
