#!/usr/bin/env node

/**
 * Git Flow Master - MCP Server (SECURED)
 * Model Context Protocol server for Claude Code integration
 *
 * Security fixes applied:
 * - Command injection prevention via spawn
 * - Path traversal prevention
 * - Input validation with schema
 * - Rate limiting
 * - Proper error handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

// Import shared utilities from lib/
import {
  execSecure,
  validateRepoPath,
  sanitizeFilePath,
  sanitizeCommitMessage,
  parseCommitMessage,
  generateCommitMessage,
  parseVersion,
  bumpVersion,
  validateVersion,
  loadConfig,
  saveConfig,
  loadState,
  saveState,
  fileExists,
  ALLOWED_BASE_PATHS,
} from '../lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

// Rate limiting check
function checkRateLimit(clientId = 'default') {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData.count = 0;
    clientData.windowStart = now;
  }

  // Check limit
  if (clientData.count >= RATE_LIMIT_MAX) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Increment count
  clientData.count++;
  rateLimitMap.set(clientId, clientData);
}

// Hash sensitive data for logging
function hashForLog(data) {
  if (!data) return '[null]';
  return crypto.createHash('sha256').update(String(data)).digest('hex').slice(0, 8);
}

// ============ MCP SERVER ============

const server = new Server(
  {
    name: 'git-flow-master',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Versioned Release Convention Tools
      {
        name: 'git_versioned_commit',
        description: 'Create a commit using Versioned Release Convention (RELEASE/UPDATE/PATCH: Project - v1.0.0)',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            files: { type: 'array', items: { type: 'string' }, description: 'Files to stage (optional)' },
            type: { type: 'string', enum: ['RELEASE', 'UPDATE', 'PATCH'], description: 'Commit type: RELEASE (major), UPDATE (minor), or PATCH' },
            project: { type: 'string', description: 'Project name (1-50 characters)' },
            version: { type: 'string', description: 'Version in format vX.Y.Z (e.g., v1.0.0)' },
            body: { type: 'string', description: 'Commit body with changes description (optional)' }
          },
          required: ['repoPath', 'type', 'project', 'version']
        }
      },
      {
        name: 'git_amend_commit',
        description: 'Amend the last commit (keeps same version for small fixes)',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            message: { type: 'string', description: 'New commit message (must follow Versioned Release Convention)' },
            files: { type: 'array', items: { type: 'string' }, description: 'Additional files to stage (optional)' }
          },
          required: ['repoPath', 'message']
        }
      },
      {
        name: 'git_suggest_version',
        description: 'Get suggested version numbers based on latest tags',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_validate_message',
        description: 'Validate a commit message against Versioned Release Convention',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Commit message to validate' }
          },
          required: ['message']
        }
      },
      {
        name: 'git_generate_message',
        description: 'Generate a Versioned Release Convention commit message',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['RELEASE', 'UPDATE', 'PATCH'], description: 'Commit type' },
            project: { type: 'string', description: 'Project name' },
            version: { type: 'string', description: 'Version (e.g., v1.0.0)' },
            body: { type: 'string', description: 'Commit body (optional)' }
          },
          required: ['type', 'project', 'version']
        }
      },
      {
        name: 'git_get_last_commit',
        description: 'Get the last commit details for amending',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },

      // Repository Tools
      {
        name: 'git_get_status',
        description: 'Get repository status (branch, staged, unstaged files)',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_get_log',
        description: 'Get recent commit history',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            limit: { type: 'number', description: 'Number of commits to fetch (default: 20, max: 100)' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_get_branch',
        description: 'Get current branch and all branches',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_get_diff',
        description: 'Get diff of staged or unstaged changes',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            staged: { type: 'boolean', description: 'Get staged diff (default: true)' }
          },
          required: ['repoPath']
        }
      },

      // Release Tools
      {
        name: 'git_create_release',
        description: 'Create a release with version bump and CHANGELOG',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            version: { type: 'string', description: 'Version (e.g., 1.3.0) or auto to detect' },
            createTag: { type: 'boolean', description: 'Create git tag (default: true)' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_get_tags',
        description: 'Get all tags sorted by version',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            limit: { type: 'number', description: 'Number of tags to fetch (default: 10, max: 50)' }
          },
          required: ['repoPath']
        }
      },

      // Config Tools
      {
        name: 'git_get_config',
        description: 'Get Git Flow Master configuration',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'git_update_config',
        description: 'Update Git Flow Master configuration',
        inputSchema: {
          type: 'object',
          properties: {
            config: { type: 'object', description: 'Configuration object to merge' }
          },
          required: ['config']
        }
      },

      // Hooks Tools
      {
        name: 'git_install_hooks',
        description: 'Install Git hooks for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_uninstall_hooks',
        description: 'Uninstall Git hooks from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_get_tracked_repos',
        description: 'Get all tracked repositories and their hook status',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Analysis Tools
      {
        name: 'git_analyze_commits',
        description: 'Analyze commits for SemVer bump recommendation',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            since: { type: 'string', description: 'Since tag or commit (optional)' }
          },
          required: ['repoPath']
        }
      },
      {
        name: 'git_suggest_type',
        description: 'Suggest commit type based on file changes',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: { type: 'string', description: 'Repository path' },
            files: { type: 'array', items: { type: 'string' }, description: 'Changed files' }
          },
          required: ['repoPath', 'files']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Rate limiting
    checkRateLimit();

    switch (name) {
      // Versioned Release Convention Tools
      case 'git_versioned_commit': {
        const { repoPath, files, type, project, version, body } = args;

        // Validate inputs
        const validatedPath = await validateRepoPath(repoPath);

        // Validate type
        if (!['RELEASE', 'UPDATE', 'PATCH'].includes(type)) {
          throw new Error('Invalid commit type. Must be RELEASE, UPDATE, or PATCH');
        }

        // Validate project name
        if (!project || project.length < 1 || project.length > 50) {
          throw new Error('Project name must be 1-50 characters');
        }
        if (!/^[A-Za-z0-9_ -]+$/.test(project)) {
          throw new Error('Project name can only contain letters, numbers, spaces, underscores, and hyphens');
        }

        // Validate version format
        if (!/^v\d+\.\d+\.\d+$/.test(version)) {
          throw new Error('Version must be in format vX.Y.Z (e.g., v1.0.0)');
        }

        const sanitizedBody = body ? sanitizeCommitMessage(body) : '';
        const message = generateCommitMessage(type, project, version, sanitizedBody);

        // Stage files if provided
        if (files && files.length > 0) {
          const sanitizedFiles = files.map(f => sanitizeFilePath(f));
          await execSecure('git', ['add', ...sanitizedFiles], { cwd: validatedPath });
        }

        // Commit
        await execSecure('git', ['commit', '-m', message], { cwd: validatedPath });

        return {
          content: [{
            type: 'text',
            text: `✓ Committed successfully\nMessage: ${type}: ${project} - ${version}\nRepository: ${hashForLog(validatedPath)}`
          }]
        };
      }

      case 'git_amend_commit': {
        const { repoPath, message, files } = args;

        // Validate inputs
        const validatedPath = await validateRepoPath(repoPath);
        const sanitizedMessage = sanitizeCommitMessage(message);

        // Validate message follows convention
        const parsed = parseCommitMessage(sanitizedMessage);
        if (!parsed.valid) {
          throw new Error(`Invalid commit message: ${parsed.error}`);
        }

        // Stage additional files if provided
        if (files && files.length > 0) {
          const sanitizedFiles = files.map(f => sanitizeFilePath(f));
          await execSecure('git', ['add', ...sanitizedFiles], { cwd: validatedPath });
        }

        // Amend commit
        await execSecure('git', ['commit', '--amend', '-m', sanitizedMessage], { cwd: validatedPath });

        return {
          content: [{
            type: 'text',
            text: `✓ Commit amended successfully\nRepository: ${hashForLog(validatedPath)}`
          }]
        };
      }

      case 'git_suggest_version': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        // Get latest tag
        let lastTag = '';
        try {
          lastTag = await execSecure('git', ['describe', '--tags', '--abbrev=0'], { cwd: validatedPath });
        } catch {
          lastTag = 'v0.0.0';
        }

        // Parse current version
        const currentVersion = parseVersion(lastTag) || { major: 0, minor: 0, patch: 0 };

        // Get last commit to check if it has a version
        let lastCommit = null;
        try {
          const lastCommitMsg = await execSecure('git', ['log', '-1', '--pretty=%s'], { cwd: validatedPath });
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

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(suggestions, null, 2)
          }]
        };
      }

      case 'git_get_last_commit': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const hash = await execSecure('git', ['rev-parse', 'HEAD'], { cwd: validatedPath });
        const message = await execSecure('git', ['log', '-1', '--pretty=%B'], { cwd: validatedPath });
        const author = await execSecure('git', ['log', '-1', '--pretty=%an'], { cwd: validatedPath });
        const date = await execSecure('git', ['log', '-1', '--pretty=%ai'], { cwd: validatedPath });

        const parsed = parseCommitMessage(message.trim());

        return {
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
        };
      }

      case 'git_validate_message': {
        const { message } = args;
        const sanitized = sanitizeCommitMessage(message);
        const result = parseCommitMessage(sanitized);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case 'git_generate_message': {
        const { type, project, version, body } = args;

        // Validate inputs
        if (!['RELEASE', 'UPDATE', 'PATCH'].includes(type)) {
          throw new Error('Invalid commit type. Must be RELEASE, UPDATE, or PATCH');
        }

        if (!project || project.length < 1 || project.length > 50) {
          throw new Error('Project name must be 1-50 characters');
        }

        if (!/^v\d+\.\d+\.\d+$/.test(version)) {
          throw new Error('Version must be in format vX.Y.Z (e.g., v1.0.0)');
        }

        const sanitizedBody = body ? sanitizeCommitMessage(body) : '';
        const message = generateCommitMessage(type, project, version, sanitizedBody);

        return {
          content: [{
            type: 'text',
            text: message
          }]
        };
      }

      // Repository Tools
      case 'git_get_status': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const branch = await execSecure('git', ['branch', '--show-current'], { cwd: validatedPath });
        const status = await execSecure('git', ['status', '--porcelain'], { cwd: validatedPath });
        const lines = status ? status.split('\n').filter(Boolean) : [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              branch,
              files: lines.map(line => ({
                status: line.substring(0, 2).trim(),
                file: line.substring(3)
              })),
              clean: lines.length === 0
            }, null, 2)
          }]
        };
      }

      case 'git_get_log': {
        const { repoPath, limit = 20 } = args;
        const validatedPath = await validateRepoPath(repoPath);

        // Clamp limit
        const safeLimit = Math.min(Math.max(1, limit), 100);

        const log = await execSecure('git', [
          'log',
          '--pretty=format:%H|%s|%an|%ar',
          `-${safeLimit}`
        ], { cwd: validatedPath });

        const commits = log ? log.split('\n').map(line => {
          const [hash, message, author, date] = line.split('|');
          const parsed = parseCommitMessage(message);
          return {
            hash: hash.slice(0, 8), // Only show short hash
            message: message.slice(0, 100), // Truncate for safety
            author,
            date,
            ...parsed
          };
        }) : [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(commits, null, 2)
          }]
        };
      }

      case 'git_get_branch': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const current = await execSecure('git', ['branch', '--show-current'], { cwd: validatedPath });
        const all = await execSecure('git', ['branch', '-a'], { cwd: validatedPath });
        const branches = all ? all.split('\n').map(b => b.replace('*', '').trim()).filter(Boolean) : [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ current, branches }, null, 2)
          }]
        };
      }

      case 'git_get_diff': {
        const { repoPath, staged = true } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const diff = await execSecure('git', [
          'diff',
          ...(staged ? ['--staged'] : [])
        ], { cwd: validatedPath });

        return {
          content: [{
            type: 'text',
            text: diff || 'No changes'
          }]
        };
      }

      // Release Tools
      case 'git_create_release': {
        const { repoPath, version = 'auto', createTag = true } = args;
        const validatedPath = await validateRepoPath(repoPath);

        let newVersion = version;

        if (version === 'auto') {
          let lastTag = '';
          try {
            lastTag = await execSecure('git', ['describe', '--tags', '--abbrev=0'], { cwd: validatedPath });
          } catch {
            lastTag = '';
          }

          const commits = await execSecure('git', [
            'log',
            lastTag ? `${lastTag}..HEAD` : 'HEAD',
            '--pretty=format:%s'
          ], { cwd: validatedPath });

          // Analyze for version bump
          let bump = 'patch';
          if (commits.includes('BREAKING CHANGE') || commits.includes('!:')) {
            bump = 'major';
          } else if (commits.match(/^feat:/m)) {
            bump = 'minor';
          }

          // Get current version
          const currentVersion = lastTag.replace('v', '') || '0.0.0';
          const [major, minor, patch] = currentVersion.split('.').map(n => parseInt(n, 10) || 0);

          switch (bump) {
            case 'major': newVersion = `${major + 1}.0.0`; break;
            case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
            default: newVersion = `${major}.${minor}.${patch + 1}`;
          }
        }

        // Validate version format
        if (!validateVersion(newVersion)) {
          throw new Error('Invalid version format');
        }

        const tagName = `v${newVersion}`;

        if (createTag) {
          await execSecure('git', ['tag', '-a', tagName, '-m', `Release ${newVersion}`], { cwd: validatedPath });
        }

        return {
          content: [{
            type: 'text',
            text: `✓ Release ${newVersion} created\nTag: ${tagName}\nRepository: ${hashForLog(validatedPath)}`
          }]
        };
      }

      case 'git_get_tags': {
        const { repoPath, limit = 10 } = args;
        const validatedPath = await validateRepoPath(repoPath);

        // Clamp limit
        const safeLimit = Math.min(Math.max(1, limit), 50);

        const tags = await execSecure('git', [
          'tag',
          '--sort=-version:refname',
          '-n',
          String(safeLimit)
        ], { cwd: validatedPath });

        const tagList = tags ? tags.split('\n').filter(Boolean) : [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tagList, null, 2)
          }]
        };
      }

      // Config Tools
      case 'git_get_config': {
        const config = await loadConfig();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(config, null, 2)
          }]
        };
      }

      case 'git_update_config': {
        const { config } = args;

        // Validate config structure (basic check)
        if (!config || typeof config !== 'object') {
          throw new Error('Config must be an object');
        }

        // Prevent prototype pollution
        const cleanConfig = JSON.parse(JSON.stringify(config));

        const current = await loadConfig();
        const updated = { ...current, ...cleanConfig };
        await saveConfig(updated);

        return {
          content: [{
            type: 'text',
            text: '✓ Configuration updated'
          }]
        };
      }

      // Hooks Tools
      case 'git_install_hooks': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const hooksDir = path.join(validatedPath, '.git', 'hooks');
        const pluginHooksDir = path.join(__dirname, '..', 'hooks');

        await fs.mkdir(hooksDir, { recursive: true });

        const hooks = ['pre-commit', 'commit-msg', 'post-release'];
        const installed = [];

        for (const hook of hooks) {
          const source = path.join(pluginHooksDir, `${hook}.sh`);
          if (await fileExists(source)) {
            const target = path.join(hooksDir, hook);
            await fs.copyFile(source, target);
            await fs.chmod(target, 0o755);
            installed.push(hook);
          }
        }

        // Update state
        const state = await loadState();
        if (!state.activeHooks[validatedPath]) {
          state.activeHooks[validatedPath] = {};
        }
        installed.forEach(h => state.activeHooks[validatedPath][h] = true);
        await saveState(state);

        return {
          content: [{
            type: 'text',
            text: `✓ Hooks installed: ${installed.join(', ')}\nRepository: ${hashForLog(validatedPath)}`
          }]
        };
      }

      case 'git_uninstall_hooks': {
        const { repoPath } = args;
        const validatedPath = await validateRepoPath(repoPath);

        const hooksDir = path.join(validatedPath, '.git', 'hooks');
        const hooks = ['pre-commit', 'commit-msg', 'post-release'];

        for (const hook of hooks) {
          const target = path.join(hooksDir, hook);
          if (await fileExists(target)) {
            await fs.unlink(target);
          }
        }

        // Update state
        const state = await loadState();
        delete state.activeHooks[validatedPath];
        await saveState(state);

        return {
          content: [{
            type: 'text',
            text: `✓ Hooks uninstalled\nRepository: ${hashForLog(validatedPath)}`
          }]
        };
      }

      case 'git_get_tracked_repos': {
        const state = await loadState();
        // Hash paths for privacy
        const safeState = {
          repositories: state.repositories.map(r => ({
            name: path.basename(r.path || r),
            hasHooks: Object.keys(state.activeHooks[r.path] || {}).length > 0
          })),
          lastSync: state.lastSync
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(safeState, null, 2)
          }]
        };
      }

      // Analysis Tools
      case 'git_analyze_commits': {
        const { repoPath, since } = args;
        const validatedPath = await validateRepoPath(repoPath);

        let lastTag = '';
        try {
          lastTag = since || await execSecure('git', ['describe', '--tags', '--abbrev=0'], { cwd: validatedPath });
        } catch {
          lastTag = '';
        }

        const commits = await execSecure('git', [
          'log',
          lastTag ? `${lastTag}..HEAD` : 'HEAD',
          '--pretty=format:%s'
        ], { cwd: validatedPath });

        const lines = commits ? commits.split('\n') : [];

        const analysis = {
          total: lines.length,
          RELEASE: 0,
          UPDATE: 0,
          PATCH: 0,
          conventional: 0,  // Legacy
          others: 0,
          recommendedBump: 'PATCH',
          convention: 'versioned-release'
        };

        lines.forEach(commit => {
          const parsed = parseCommitMessage(commit);
          if (parsed.valid) {
            if (parsed.convention === 'versioned-release') {
              analysis[parsed.type]++;
            } else {
              analysis.conventional++;
            }
          } else {
            analysis.others++;
          }
        });

        // Determine recommended bump based on Versioned Release Convention
        if (analysis.RELEASE > 0) {
          analysis.recommendedBump = 'RELEASE';
        } else if (analysis.UPDATE > 0) {
          analysis.recommendedBump = 'UPDATE';
        } else {
          analysis.recommendedBump = 'PATCH';
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }]
        };
      }

      case 'git_suggest_type': {
        const { repoPath, files } = args;
        const validatedPath = await validateRepoPath(repoPath);

        // Sanitize file paths
        const sanitizedFiles = files.map(f => sanitizeFilePath(f));

        // Analyze file patterns for Versioned Release Convention
        let suggestedType = 'UPDATE'; // Default to UPDATE for new features
        let confidence = 'low';
        const reasons = [];

        for (const file of sanitizedFiles) {
          const lowerFile = file.toLowerCase();

          // Test files usually indicate PATCH (bug fixes in tests)
          if (lowerFile.includes('test') || lowerFile.includes('__tests__') || lowerFile.includes('.test.') || lowerFile.includes('.spec.')) {
            suggestedType = 'PATCH';
            confidence = 'medium';
            reasons.push('Test file changes typically indicate PATCH');
          }

          // Documentation changes
          if (lowerFile.endsWith('.md') || lowerFile.startsWith('docs/') || lowerFile.includes('readme')) {
            suggestedType = 'PATCH';
            confidence = 'medium';
            reasons.push('Documentation changes are PATCH');
          }

          // CI/CD configuration
          if (lowerFile.includes('.github/') || lowerFile.includes('.gitlab-ci') || lowerFile.includes('jenkinsfile') || lowerFile.includes('dockerfile')) {
            suggestedType = 'PATCH';
            confidence = 'medium';
            reasons.push('CI/CD and build changes are PATCH');
          }

          // Dependency updates
          if (lowerFile.includes('package.json') || lowerFile.includes('cargo.toml') || lowerFile.includes('requirements.txt') || lowerFile.includes('go.mod')) {
            suggestedType = 'PATCH';
            confidence = 'medium';
            reasons.push('Dependency changes are PATCH unless breaking');
          }

          // New features
          if (lowerFile.includes('feature') || lowerFile.includes('new') || lowerFile.includes('add')) {
            suggestedType = 'UPDATE';
            confidence = 'medium';
            reasons.push('New features are UPDATE');
          }

          // Breaking changes
          if (lowerFile.includes('breaking') || lowerFile.includes('remove') || lowerFile.includes('delete')) {
            suggestedType = 'RELEASE';
            confidence = 'high';
            reasons.push('Breaking changes are RELEASE');
          }

          // Bug fixes
          if (lowerFile.includes('fix') || lowerFile.includes('bug') || lowerFile.includes('patch')) {
            suggestedType = 'PATCH';
            confidence = 'high';
            reasons.push('Bug fixes are PATCH');
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              type: suggestedType,
              confidence,
              reasons: reasons.length > 0 ? reasons : ['Could not determine type from file patterns'],
              convention: 'versioned-release',
              note: 'RELEASE for breaking changes, UPDATE for features, PATCH for fixes'
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Sanitize error message (don't leak internal paths)
    const safeMessage = error.message
      .replace(/\/[^\s]+/g, '[path]')
      .replace(/\\[^\s]+/g, '[path]')
      .slice(0, 200);

    return {
      content: [{
        type: 'text',
        text: `Error: ${safeMessage}`
      }],
      isError: true
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'git-flow://config',
        name: 'Git Flow Master Configuration',
        mimeType: 'application/json',
        description: 'Current configuration for Versioned Release Convention (RELEASE/UPDATE/PATCH)'
      },
      {
        uri: 'git-flow://conventions',
        name: 'Versioned Release Convention Reference',
        mimeType: 'text/markdown',
        description: 'Complete reference for Versioned Release Convention, SemVer, and amend workflow'
      }
    ]
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'git-flow://config': {
      const config = await loadConfig();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2)
        }]
      };
    }

    case 'git-flow://conventions': {
      const conventionsPath = path.join(__dirname, '..', 'docs', 'GIT_CONVENTIONS.md');
      if (await fileExists(conventionsPath)) {
        const content = await fs.readFile(conventionsPath, 'utf-8');
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: content
          }]
        };
      }
      throw new Error('Conventions document not found');
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Git Flow Master MCP Server running (secured)');
}

main().catch(console.error);
