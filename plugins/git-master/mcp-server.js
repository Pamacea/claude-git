#!/usr/bin/env node

/**
 * Git Flow Master - MCP Server
 * Provides Git operations via Model Context Protocol (MCP)
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Allowed base paths for security
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

/**
 * Execute git command securely
 */
function execGit(cwd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd,
      encoding: 'utf-8',
      timeout: 30000
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`git ${args.join(' ')}: ${stderr || stdout}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Validate repository path
 */
async function validateRepoPath(repoPath) {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  const normalizedPath = path.normalize(path.resolve(repoPath));

  const isAllowed = ALLOWED_BASE_PATHS.some(allowedPath => {
    const normalizedAllowed = path.normalize(path.resolve(allowedPath));
    return normalizedPath.startsWith(normalizedAllowed);
  });

  if (!isAllowed) {
    throw new Error('Access denied: path outside allowed directories');
  }

  const gitDir = path.join(normalizedPath, '.git');
  try {
    const stat = await fs.stat(gitDir);
    if (!stat.isDirectory()) {
      throw new Error('Not a git repository');
    }
  } catch {
    throw new Error('Not a git repository');
  }

  return normalizedPath;
}

/**
 * Get current git repository path
 */
async function getCurrentRepoPath() {
  try {
    // Start from current working directory
    let currentDir = process.cwd();
    let lastDir = '';

    while (currentDir !== lastDir) {
      const gitDir = path.join(currentDir, '.git');
      try {
        const stat = await fs.stat(gitDir);
        if (stat.isDirectory()) {
          return currentDir;
        }
      } catch {}

      lastDir = currentDir;
      currentDir = path.dirname(currentDir);
    }

    throw new Error('Not in a git repository');
  } catch {
    throw new Error('Not in a git repository');
  }
}

// ============================================================================
// MCP SERVER
// ============================================================================

async function main() {
  const stdin = process.stdin;
  const stdout = process.stdout;

  // Send server info
  sendResponse({
    jsonrpc: '2.0',
    method: 'initialize',
    result: {
      name: 'git-flow-master',
      version: '0.5.0',
      capabilities: {
        tools: {}
      }
    }
  });

  // Handle incoming messages
  let buffer = '';
  stdin.on('data', (chunk) => {
    buffer += chunk.toString();

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        handleMessage(message).catch(err => {
          sendError(err);
        });
      } catch (err) {
        sendError(err);
      }
    }
  });

  async function handleMessage(message) {
    const { id, method, params } = message;

    switch (method) {
      case 'tools/list':
        sendResponse({ id, result: { tools: getToolsList() } });
        break;

      case 'tools/call':
        await handleToolCall(id, params);
        break;

      case 'initialize':
        sendResponse({
          id,
          result: {
            name: 'git-flow-master',
            version: '0.5.0',
            capabilities: { tools: {} }
          }
        });
        break;

      default:
        sendError(new Error(`Unknown method: ${method}`), id);
    }
  }

  async function handleToolCall(id, params) {
    const { name, arguments: args } = params;

    try {
      let result;
      switch (name) {
        case 'git_get_status':
          result = await gitGetStatus(args?.path);
          break;
        case 'git_get_log':
          result = await gitGetLog(args?.path, args?.limit);
          break;
        case 'git_get_branch':
          result = await gitGetBranch(args?.path);
          break;
        case 'git_get_diff':
          result = await gitGetDiff(args?.path, args?.cached);
          break;
        case 'git_get_last_commit':
          result = await gitGetLastCommit(args?.path);
          break;
        case 'git_validate_message':
          result = await gitValidateMessage(args?.message);
          break;
        case 'git_generate_message':
          result = await gitGenerateMessage(args?.type, args?.project, args?.version, args?.description);
          break;
        case 'git_get_tags':
          result = await gitGetTags(args?.path);
          break;
        case 'git_suggest_version':
          result = await gitSuggestVersion(args?.path);
          break;
        case 'git_amend_commit':
          result = await gitAmendCommit(args?.path, args?.message);
          break;
        case 'git_versioned_commit':
          result = await gitVersionedCommit(args?.path, args?.type, args?.project, args?.version, args?.description, args?.files);
          break;
        case 'git_create_release':
          result = await gitCreateRelease(args?.path, args?.version, args?.autoTag);
          break;
        case 'git_analyze_commits':
          result = await gitAnalyzeCommits(args?.path);
          break;
        case 'git_install_hooks':
          result = await gitInstallHooks(args?.path);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      sendResponse({ id, result });
    } catch (err) {
      sendError(err, id);
    }
  }

  function sendResponse(data) {
    stdout.write(JSON.stringify(data) + '\n');
  }

  function sendError(err, id = null) {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: err.message || 'Unknown error'
      }
    });
  }
}

// ============================================================================
// MCP TOOLS
// ============================================================================

function getToolsList() {
  return [
    {
      name: 'git_get_status',
      description: 'Get the current git status of the repository',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository (uses current directory if not specified)' }
        }
      }
    },
    {
      name: 'git_get_log',
      description: 'Get git commit history',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' },
          limit: { type: 'number', description: 'Number of commits to return (default: 20)' }
        }
      }
    },
    {
      name: 'git_get_branch',
      description: 'Get the current git branch name',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
      }
    },
    {
      name: 'git_get_diff',
      description: 'Get git diff of changes',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' },
          cached: { type: 'boolean', description: 'Show staged changes only' }
        }
      }
    },
    {
      name: 'git_get_last_commit',
      description: 'Get information about the last commit',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
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
          description: { type: 'string', description: 'Optional description' }
        },
        required: ['type', 'project', 'version']
      }
    },
    {
      name: 'git_get_tags',
      description: 'Get all git tags sorted by version',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
      }
    },
    {
      name: 'git_suggest_version',
      description: 'Get suggested next version numbers based on last tag',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
      }
    },
    {
      name: 'git_amend_commit',
      description: 'Amend the last commit with a new message',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' },
          message: { type: 'string', description: 'New commit message' }
        },
        required: ['message']
      }
    },
    {
      name: 'git_versioned_commit',
      description: 'Create a commit with Versioned Release Convention format',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' },
          type: { type: 'string', enum: ['RELEASE', 'UPDATE', 'PATCH'], description: 'Commit type' },
          project: { type: 'string', description: 'Project name' },
          version: { type: 'string', description: 'Version (e.g., v1.0.0)' },
          description: { type: 'string', description: 'Optional description' },
          files: { type: 'array', items: { type: 'string' }, description: 'Files to stage before commit' }
        },
        required: ['type', 'project', 'version']
      }
    },
    {
      name: 'git_create_release',
      description: 'Create a release with tag and changelog',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' },
          version: { type: 'string', description: 'Version tag (e.g., v1.0.0)' },
          autoTag: { type: 'boolean', description: 'Auto-create git tag' }
        },
        required: ['version']
      }
    },
    {
      name: 'git_analyze_commits',
      description: 'Analyze commits since last tag to determine version bump',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
      }
    },
    {
      name: 'git_install_hooks',
      description: 'Install git hooks for Versioned Release Convention',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to git repository' }
        }
      }
    }
  ];
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

async function gitGetStatus(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const status = await execGit(path, ['status', '--porcelain']);
  return {
    path,
    status: status.split('\n').filter(Boolean)
  };
}

async function gitGetLog(repoPath, limit = 20) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const log = await execGit(path, ['log', '--oneline', `-${limit}`]);
  return {
    path,
    commits: log.split('\n').filter(Boolean)
  };
}

async function gitGetBranch(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const branch = await execGit(path, ['branch', '--show-current']);
  return { path, branch };
}

async function gitGetDiff(repoPath, cached = false) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const args = ['diff'];
  if (cached) args.push('--staged');
  const diff = await execGit(path, args);
  return { path, diff };
}

async function gitGetLastCommit(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const [hash, subject, message, date] = await Promise.all([
    execGit(path, ['log', '-1', '--pretty=%H']),
    execGit(path, ['log', '-1', '--pretty=%s']),
    execGit(path, ['log', '-1', '--pretty=%B']),
    execGit(path, ['log', '-1', '--pretty=%aI'])
  ]);

  // Parse version and type
  const versionMatch = subject.match(/v[0-9]+\.[0-9]+\.[0-9]+/);
  const typeMatch = subject.match(/^(RELEASE|UPDATE|PATCH)/);
  const projectMatch = subject.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - v/);

  return {
    path,
    hash: hash.trim(),
    subject: subject.trim(),
    message: message.trim(),
    date: date.trim(),
    parsed: {
      type: typeMatch ? typeMatch[1] : null,
      version: versionMatch ? versionMatch[0] : null,
      project: projectMatch ? projectMatch[2].trim() : null
    }
  };
}

async function gitValidateMessage({ message }) {
  if (!message) {
    return { valid: false, errors: ['Message is required'] };
  }

  const subject = message.split('\n')[0];
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

    const bodyLines = message.split('\n').slice(2).filter(l => l.trim());
    if (bodyLines.length === 0) {
      warnings.push('Consider adding change description in the body');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed
  };
}

async function gitGenerateMessage(type, project, version, description) {
  let message = `${type}: ${project} - ${version}`;
  if (description) {
    message += `\n\n${description}`;
  }
  return { message };
}

async function gitGetTags(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const tags = await execGit(path, ['tag', '--sort=-version:refname']);
  return {
    path,
    tags: tags.split('\n').filter(Boolean)
  };
}

async function gitSuggestVersion(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();

  // Get last tag
  let lastTag = '';
  try {
    lastTag = await execGit(path, ['describe', '--tags', '--abbrev=0']);
    lastTag = lastTag.trim();
  } catch {
    // No tags yet
  }

  // Get last commit
  const lastSubject = await execGit(path, ['log', '-1', '--pretty=%s']);

  // Parse versions
  const tagVersion = lastTag ? lastTag.replace('v', '').split('.').map(Number) : [0, 0, 0];
  const commitVersionMatch = lastSubject.match(/v([0-9]+)\.([0-9]+)\.([0-9]+)/);
  const commitVersion = commitVersionMatch
    ? [parseInt(commitVersionMatch[1]), parseInt(commitVersionMatch[2]), parseInt(commitVersionMatch[3])]
    : tagVersion;

  return {
    path,
    suggestions: {
      RELEASE: `v${tagVersion[0] + 1}.0.0`,
      UPDATE: `v${tagVersion[0]}.${tagVersion[1] + 1}.0`,
      PATCH: `v${tagVersion[0]}.${tagVersion[1]}.${tagVersion[2] + 1}`,
      current: {
        tag: lastTag || 'none',
        lastCommit: commitVersionMatch ? `v${commitVersion.join('.')}` : 'none'
      }
    }
  };
}

async function gitAmendCommit(repoPath, message) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  await execGit(path, ['commit', '--amend', '-m', message]);

  const newHash = await execGit(path, ['log', '-1', '--pretty=%H']);
  return {
    path,
    success: true,
    message,
    newHash: newHash.trim()
  };
}

async function gitVersionedCommit(repoPath, type, project, version, description, files) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();

  // Stage files if specified
  if (files && Array.isArray(files) && files.length > 0) {
    await execGit(path, ['add', ...files]);
  }

  // Build commit message
  let message = `${type}: ${project} - ${version}`;
  if (description) {
    message += '\n\n' + description;
  }

  await execGit(path, ['commit', '-m', message]);

  return {
    path,
    success: true,
    type,
    project,
    version,
    message
  };
}

async function gitCreateRelease(repoPath, version, autoTag = true) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();

  // Get tags
  const tagsResult = await execGit(path, ['tag', '--sort=-version:refname']);
  const tags = tagsResult.split('\n').filter(Boolean);

  if (tags.includes(version)) {
    throw new Error(`Tag ${version} already exists`);
  }

  const lastTag = tags[0] || '';

  // Get commits since last tag
  const commits = await execGit(path, ['log', `${lastTag}..HEAD`, '--pretty=format:%s']);

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

  const changelog = {
    version,
    date: new Date().toISOString().split('T')[0],
    commits: categorized
  };

  // Create tag if auto-tag is enabled
  if (autoTag) {
    await execGit(path, ['tag', '-a', version, '-m', `Release ${version}`]);
  }

  return {
    path,
    success: true,
    changelog,
    tagCreated: autoTag
  };
}

async function gitAnalyzeCommits(repoPath) {
  const path = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();

  // Get last tag
  let lastTag = '';
  try {
    lastTag = await execGit(path, ['describe', '--tags', '--abbrev=0']);
    lastTag = lastTag.trim();
  } catch {
    // No tags yet, use first commit
    lastTag = '';
  }

  // Get commits since last tag
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const commits = await execGit(path, ['log', range, '--pretty=format:%s']);

  const commitList = commits.trim().split('\n').filter(Boolean);

  const hasRelease = commitList.some(c => c.startsWith('RELEASE:'));
  const hasUpdate = commitList.some(c => c.startsWith('UPDATE:'));

  let suggestedBump = 'PATCH';
  if (hasRelease) {
    suggestedBump = 'MAJOR';
  } else if (hasUpdate) {
    suggestedBump = 'MINOR';
  }

  return {
    path,
    lastTag: lastTag || 'none',
    commitCount: commitList.length,
    hasBreakingChanges: hasRelease,
    hasNewFeatures: hasUpdate,
    suggestedBump,
    commits: commitList.slice(0, 10)
  };
}

async function gitInstallHooks(repoPath) {
  const repoPath = repoPath ? await validateRepoPath(repoPath) : await getCurrentRepoPath();
  const hooksDir = path.join(repoPath, '.git', 'hooks');

  await fs.mkdir(hooksDir, { recursive: true });

  const pluginHooksDir = path.join(__dirname, 'hooks');
  const hooks = ['pre-commit', 'commit-msg', 'post-release'];
  const isWindows = process.platform === 'win32';
  const hookExtension = isWindows ? '.ps1' : '.sh';

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

  return {
    path,
    success: true,
    hooks: installedHooks,
    platform: isWindows ? 'windows' : 'unix'
  };
}

// ============================================================================
// START SERVER
// ============================================================================

main().catch(err => {
  console.error('MCP Server error:', err);
  process.exit(1);
});
