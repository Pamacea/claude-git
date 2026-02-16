#!/usr/bin/env node

/**
 * Git Flow Master - Install Dependencies
 * Ensures npm dependencies are installed for the web server
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const WEB_DIR = path.join(__dirname, '..', 'web');
const NODE_MODULES_CHECK = path.join(WEB_DIR, 'node_modules');
const PACKAGE_JSON = path.join(WEB_DIR, 'package.json');

/**
 * Check if node_modules exists and has dependencies
 */
function isNodeModulesInstalled() {
  try {
    // Check if node_modules directory exists
    if (!fs.existsSync(NODE_MODULES_CHECK)) {
      return false;
    }

    // Check if express is installed (main dependency)
    const expressPath = path.join(NODE_MODULES_CHECK, 'express');
    return fs.existsSync(expressPath);
  } catch {
    return false;
  }
}

/**
 * Install npm dependencies
 */
function installDependencies() {
  console.log('📦 Installing Git Flow Master web dependencies...');

  try {
    // Run npm install in web directory
    const result = execSync('npm install', {
      cwd: WEB_DIR,
      stdio: 'inherit',
      windowsHide: true
    });

    console.log('✓ Dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('✗ Failed to install dependencies:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  // Check if package.json exists
  if (!fs.existsSync(PACKAGE_JSON)) {
    console.error('✗ package.json not found in', WEB_DIR);
    process.exit(1);
  }

  // Check if dependencies are already installed
  if (isNodeModulesInstalled()) {
    console.log('✓ Dependencies already installed');
    process.exit(0);
  }

  // Install dependencies
  const success = installDependencies();

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { isNodeModulesInstalled, installDependencies };
