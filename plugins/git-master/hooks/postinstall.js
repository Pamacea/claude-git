#!/usr/bin/env node

/**
 * Git Flow Master - Post-Install Script
 * Runs after plugin installation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  🚀 Git Flow Master - Installation                        ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Create data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('✓ Created data directory:', DATA_DIR);
}

// Create default config
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
    commit: {
      types: {
        feat: { description: 'A new feature', emoji: '✨', semverBump: 'MINOR' },
        fix: { description: 'A bug fix', emoji: '🐛', semverBump: 'PATCH' },
        docs: { description: 'Documentation only', emoji: '📝', semverBump: 'PATCH' },
        style: { description: 'Code style changes', emoji: '🎨', semverBump: 'PATCH' },
        refactor: { description: 'Code refactoring', emoji: '♻️', semverBump: 'PATCH' },
        perf: { description: 'Performance improvements', emoji: '⚡', semverBump: 'PATCH' },
        test: { description: 'Adding or updating tests', emoji: '✅', semverBump: 'PATCH' },
        build: { description: 'Build system or dependencies', emoji: '📦', semverBump: 'PATCH' },
        ci: { description: 'CI/CD configuration', emoji: '🔧', semverBump: 'PATCH' },
        chore: { description: 'Other changes', emoji: '🔨', semverBump: 'PATCH' },
        revert: { description: 'Reverts a previous commit', emoji: '⏪', semverBump: 'PATCH' }
      },
      scopes: {},
      rules: {
        subjectMinLength: 3,
        subjectMaxLength: 80,
        bodyLineLength: 100
      }
    },
    hooks: {
      preCommit: {
        enabled: true,
        lint: true,
        typecheck: true,
        test: false,
        secretScan: true
      },
      commitMsg: {
        enabled: true,
        validate: true,
        enforceConventional: true
      }
    },
    branch: {
      mainBranch: 'main',
      developBranch: 'develop'
    }
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  console.log('✓ Created default config:', CONFIG_FILE);
}

// Create default state
if (!fs.existsSync(STATE_FILE)) {
  const defaultState = {
    repositories: [],
    activeHooks: {},
    lastSync: null
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2));
  console.log('✓ Created default state:', STATE_FILE);
}

// Install web dependencies
const webDir = path.join(__dirname, '..', 'web');
if (fs.existsSync(webDir)) {
  console.log('');
  console.log('📦 Installing web interface dependencies...');
  try {
    execSync('npm install', { cwd: webDir, stdio: 'inherit' });
    console.log('✓ Web dependencies installed');
  } catch (error) {
    console.log('⚠ Failed to install web dependencies. Run manually:');
    console.log('  cd ' + webDir);
    console.log('  npm install');
  }
}

// Install MCP dependencies
const mcpDir = path.join(__dirname, '..', 'mcp');
if (fs.existsSync(mcpDir)) {
  console.log('');
  console.log('📦 Installing MCP server dependencies...');
  try {
    execSync('npm install', { cwd: mcpDir, stdio: 'inherit' });
    console.log('✓ MCP dependencies installed');
  } catch (error) {
    console.log('⚠ Failed to install MCP dependencies. Run manually:');
    console.log('  cd ' + mcpDir);
    console.log('  npm install');
  }
}

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ✓ Installation complete!                                  ║');
console.log('║                                                            ║');
console.log('║  Web Interface: http://localhost:3747                      ║');
console.log('║  MCP Server:    Available for Claude Code                  ║');
console.log('║                                                            ║');
console.log('║  Quick Start:                                              ║');
console.log('║  1. Open Claude Code                                       ║');
console.log('║  2. Server starts automatically                            ║');
console.log('║  3. MCP tools available natively                           ║');
console.log('║  4. Use /smart-commit or MCP tools to commit               ║');
console.log('║                                                            ║');
console.log('║  MCP Tools Available:                                      ║');
console.log('║  - git_smart_commit                                        ║');
console.log('║  - git_get_status                                          ║');
console.log('║  - git_get_log                                             ║');
console.log('║  - git_analyze_commits                                     ║');
console.log('║  - git_create_release                                      ║');
console.log('║  - And more...                                             ║');
console.log('║                                                            ║');
console.log('║  Manual start:                                             ║');
console.log('║  Windows: start-web.bat                                    ║');
console.log('║  Linux/Mac: ./start-web.sh                                 ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
