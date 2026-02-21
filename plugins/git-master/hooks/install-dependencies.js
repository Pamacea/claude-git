#!/usr/bin/env node

/**
 * Aureus - Install Dependencies
 * Ensures npm dependencies are installed for both web server and MCP server
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PLUGIN_ROOT = path.join(__dirname, '..');
const WEB_DIR = path.join(PLUGIN_ROOT, 'web');
const MCP_DIR = path.join(PLUGIN_ROOT, 'mcp');

const WEB_NODE_MODULES = path.join(WEB_DIR, 'node_modules');
const MCP_NODE_MODULES = path.join(MCP_DIR, 'node_modules');

const WEB_PACKAGE_JSON = path.join(WEB_DIR, 'package.json');
const MCP_PACKAGE_JSON = path.join(MCP_DIR, 'package.json');

/**
 * Check if node_modules exists and has dependencies
 */
function isNodeModulesInstalled(dir, mainDependency) {
  try {
    const nodeModulesPath = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      return false;
    }

    const depPath = path.join(nodeModulesPath, mainDependency);
    return fs.existsSync(depPath);
  } catch {
    return false;
  }
}

/**
 * Install npm dependencies using spawn for better cross-platform support
 */
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

/**
 * Main execution
 */
async function main() {
  let allInstalled = true;

  // Install web dependencies
  if (fs.existsSync(WEB_PACKAGE_JSON)) {
    if (!isNodeModulesInstalled(WEB_DIR, 'express')) {
      try {
        await installDependencies(WEB_DIR, 'Web Interface');
      } catch (error) {
        console.error(`✗ Failed to install web dependencies:`, error.message);
        allInstalled = false;
      }
    } else {
      console.log('✓ Web dependencies already installed');
    }
  } else {
    console.log('⚠ No web package.json found, skipping web dependencies');
  }

  // Install MCP dependencies
  if (fs.existsSync(MCP_PACKAGE_JSON)) {
    if (!isNodeModulesInstalled(MCP_DIR, '@modelcontextprotocol')) {
      try {
        await installDependencies(MCP_DIR, 'MCP Server');
      } catch (error) {
        console.error(`✗ Failed to install MCP dependencies:`, error.message);
        allInstalled = false;
      }
    } else {
      console.log('✓ MCP dependencies already installed');
    }
  } else {
    console.log('⚠ No MCP package.json found, skipping MCP dependencies');
  }

  if (allInstalled) {
    console.log('✓ All dependencies installed successfully');
    process.exit(0);
  } else {
    console.error('✗ Some dependencies failed to install');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('✗ Installation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { isNodeModulesInstalled, installDependencies };
