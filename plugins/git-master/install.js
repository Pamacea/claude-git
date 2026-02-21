#!/usr/bin/env node

/**
 * Aureus - Installation Script
 * Installs dependencies for MCP server and web interface
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const PLUGIN_ROOT = __dirname;
const MCP_DIR = path.join(PLUGIN_ROOT, 'mcp');
const WEB_DIR = path.join(PLUGIN_ROOT, 'web');

console.log('📦 Aureus - Installing dependencies...\n');

/**
 * Run npm install in a directory
 */
async function npmInstall(dir, name) {
  console.log(`Installing ${name} dependencies...`);

  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: false
    });

    proc.on('error', (err) => {
      console.error(`✗ Failed to install ${name}:`, err.message);
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${name} dependencies installed\n`);
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

/**
 * Check if npm is available
 */
function checkNpm() {
  const result = spawnSync('npm', ['--version'], {
    stdio: 'pipe',
    shell: false
  });
  return result.status === 0;
}

/**
 * Main installation
 */
async function main() {
  try {
    if (!checkNpm()) {
      console.error('✗ npm is not installed or not in PATH');
      process.exit(1);
    }

    // Install MCP server dependencies
    await npmInstall(MCP_DIR, 'MCP Server');

    // Install web interface dependencies
    await npmInstall(WEB_DIR, 'Web Interface');

    console.log('✓ Aureus installation complete!');
    console.log('\nYou can now use Aureus with Claude Code.');
    console.log('\nAvailable commands:');
    console.log('  /versioned-commit  - Create a versioned commit');
    console.log('  /amend-commit     - Amend the last commit');
    console.log('  /suggest-version  - Get version suggestions');
    console.log('  /auto-release     - Create a release');

  } catch (error) {
    console.error('\n✗ Installation failed:', error.message);
    process.exit(1);
  }
}

main();
