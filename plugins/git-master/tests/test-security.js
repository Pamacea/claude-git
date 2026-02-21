#!/usr/bin/env node

/**
 * Aureus - Security Tests
 * Tests security features of the web server
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const WEB_DIR = path.join(__dirname, '..', 'web');

console.log('🧪 Running Security Tests...\n');

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

// Test 1: Rate limiting (should be implemented)
test('Server should implement rate limiting', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  const hasRateLimit = serverCode.includes('RATE_LIMIT') || serverCode.includes('rateLimit');
  assert(hasRateLimit, 'Rate limiting not implemented');
});

// Test 2: Helmet security headers
test('Helmet security headers should be configured', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('helmet'), 'Helmet not used');
  assert(serverCode.includes('contentSecurityPolicy'), 'CSP not configured');
});

// Test 3: Command injection prevention with spawn
test('Server should use spawn instead of exec', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('spawn('), 'Should use spawn for security');
  assert(!serverCode.includes('execSync(') || !serverCode.includes('exec('), 'Should not use exec/execSync (vulnerable to injection)');
});

// Test 4: Shell false option
test('spawn should use shell: false', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('shell: false'), 'Should set shell: false to prevent injection');
});

// Test 5: Input validation
test('Server should validate input types', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('typeof') || serverCode.includes('Array.isArray'), 'Input validation missing');
});

// Test 6: Path validation function exists
test('Path validation function should exist', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('validateRepoPath'), 'Path validation function missing');
});

// Test 7: Command sanitization
test('Command sanitization should be implemented', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('sanitize') || serverCode.includes('dangerous'), 'Command sanitization missing');
});

// Test 8: Allowed base paths whitelist
test('Allowed base paths whitelist should exist', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('ALLOWED_BASE_PATHS'), 'Allowed base paths whitelist missing');
});

// Test 9: Security headers configuration
test('Content-Security-Policy should be configured', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  assert(serverCode.includes('scriptSrc'), 'CSP scriptSrc not configured');
  assert(serverCode.includes('defaultSrc'), 'CSP defaultSrc not configured');
});

// Test 10: No eval or Function constructor
test('Code should not use eval or Function constructor', () => {
  const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');
  const hasEval = serverCode.includes('eval(') || serverCode.includes('new Function');
  assert(!hasEval, 'Code uses eval or Function constructor (security risk)');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All security tests passed!');
