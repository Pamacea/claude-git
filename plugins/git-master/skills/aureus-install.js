#!/usr/bin/env node

/**
 * Aureus - Install Cached Dependencies
 * Installs npm dependencies in the cached plugin directory
 * Usage: node skills/aureus-install.js
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PLUGIN_NAME = 'aureus';
const PLUGIN_SUBDIR = 'git-master';

async function findCachedPlugin() {
  const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', PLUGIN_NAME, PLUGIN_SUBDIR);

  try {
    if (!fs.existsSync(cacheDir)) {
      return null;
    }

    // Find version directory (e.g., 0.8.1)
    const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
    const versionDir = entries.find(e => e.isDirectory() && /^\d+\.\d+\.\d+$/.test(e.name));

    if (!versionDir) {
      return null;
    }

    return path.join(cacheDir, versionDir.name);
  } catch (error) {
    console.error('✗ Error finding cached plugin:', error.message);
    return null;
  }
}

function installDependencies(dir, name) {
  console.log(`📦 Installing ${name} dependencies...`);

  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: false,
      windowsHide: true
    });

    proc.on('error', (err) => {
      console.error(`✗ Failed to install ${name}:`, err.message);
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${name} dependencies installed`);
        resolve(true);
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('📦 Installing Aureus dependencies...');
  console.log('');

  const pluginRoot = await findCachedPlugin();

  if (!pluginRoot) {
    console.error('✗ Could not find Aureus plugin in cache');
    console.error('');
    console.error('Make sure you have installed Aureus via /plugin first');
    console.error('Run: /plugin');
    console.error('Then select: git-master (Aureus)');
    process.exit(1);
  }

  console.log(`✓ Found cached plugin: ${pluginRoot}`);
  console.log('');

  const webDir = path.join(pluginRoot, 'web');
  const mcpDir = path.join(pluginRoot, 'mcp');

  let allInstalled = true;

  // Install web dependencies
  if (fs.existsSync(path.join(webDir, 'package.json'))) {
    try {
      await installDependencies(webDir, 'Web Interface');
    } catch (error) {
      console.error(`✗ Failed to install web dependencies:`, error.message);
      allInstalled = false;
    }
  } else {
    console.log('⚠ No web package.json found, skipping');
  }

  console.log('');

  // Install MCP dependencies
  if (fs.existsSync(path.join(mcpDir, 'package.json'))) {
    try {
      await installDependencies(mcpDir, 'MCP Server');
    } catch (error) {
      console.error(`✗ Failed to install MCP dependencies:`, error.message);
      allInstalled = false;
    }
  } else {
    console.log('⚠ No MCP package.json found, skipping');
  }

  console.log('');

  if (allInstalled) {
    console.log('✓ All dependencies installed successfully');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart Claude Code, OR');
    console.log('2. Visit http://localhost:3747 (server should auto-start)');
    console.log('');
    console.log('If server still doesn\'t start, check:');
    console.log('- ~/.git-flow-master/server.log');
    console.log('- Run: curl http://localhost:3747/api/status');
    process.exit(0);
  } else {
    console.error('✗ Some dependencies failed to install');
    console.error('');
    console.error('Troubleshooting:');
    console.error('- Check internet connection');
    console.error('- Run: npm config get registry');
    console.error('- Run: npm ping');
    console.error('- See TROUBLESHOOTING.md');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('✗ Installation failed:', error.message);
  process.exit(1);
});
