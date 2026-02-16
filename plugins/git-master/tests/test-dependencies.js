#!/usr/bin/env node

/**
 * Git Flow Master - Dependencies Installation Test
 * Tests that npm dependencies are correctly installed
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WEB_DIR = path.join(__dirname, '..', 'web');
const NODE_MODULES = path.join(WEB_DIR, 'node_modules');

console.log('🧪 Running Dependency Installation Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// Test 1: package.json exists
test('package.json should exist', () => {
  const packageJson = path.join(WEB_DIR, 'package.json');
  assert(fs.existsSync(packageJson), 'package.json not found');
  const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
  assert(content.dependencies, 'dependencies field missing');
  assert(content.dependencies.express, 'express dependency missing');
  assert(content.dependencies.helmet, 'helmet dependency missing');
});

// Test 2: node_modules directory exists
test('node_modules directory should exist', () => {
  assert(fs.existsSync(NODE_MODULES), 'node_modules directory not found');
});

// Test 3: express should be installed
test('express module should be installed', () => {
  const expressPath = path.join(NODE_MODULES, 'express');
  assert(fs.existsSync(expressPath), 'express module not found');
  const packageJson = path.join(expressPath, 'package.json');
  assert(fs.existsSync(packageJson), 'express/package.json not found');
});

// Test 4: helmet should be installed
test('helmet module should be installed', () => {
  const helmetPath = path.join(NODE_MODULES, 'helmet');
  assert(fs.existsSync(helmetPath), 'helmet module not found');
  const packageJson = path.join(helmetPath, 'package.json');
  assert(fs.existsSync(packageJson), 'helmet/package.json not found');
});

// Test 5: server.js should be able to require dependencies
test('server.js should load dependencies', () => {
  const serverPath = path.join(WEB_DIR, 'server.js');
  assert(fs.existsSync(serverPath), 'server.js not found');

  // Try to load dependencies
  try {
    const express = require(path.join(NODE_MODULES, 'express'));
    const helmet = require(path.join(NODE_MODULES, 'helmet'));
    assert(typeof express === 'function', 'express not a function');
    assert(typeof helmet === 'function', 'helmet not a function');
  } catch (error) {
    throw new Error(`Failed to load dependencies: ${error.message}`);
  }
});

// Test 6: install-dependencies.js should work
test('install-dependencies.js should exist and work', () => {
  const installScript = path.join(__dirname, '..', 'hooks', 'install-dependencies.js');
  assert(fs.existsSync(installScript), 'install-dependencies.js not found');

  // Run the script
  try {
    execSync(`node "${installScript}"`, { stdio: 'pipe' });
  } catch (error) {
    throw new Error(`install-dependencies.js failed: ${error.message}`);
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All dependency tests passed!');
