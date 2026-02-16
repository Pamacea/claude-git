#!/usr/bin/env node

/**
 * Git Flow Master - Commit Message Validation Tests
 * Tests commit message validation logic
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load server.js to test validation functions
const WEB_DIR = path.join(__dirname, '..', 'web');
const serverCode = fs.readFileSync(path.join(WEB_DIR, 'server.js'), 'utf-8');

// Extract parseCommitMessage function
const parseMatch = serverCode.match(/function parseCommitMessage\(message\) \{[\s\S]*?\n\}/);
const parseFunction = parseMatch ? parseMatch[0] : null;
assert(parseFunction, 'Could not extract parseCommitMessage function');

eval(parseFunction);

console.log('🧪 Running Commit Message Validation Tests...\n');

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

// Test 1: Valid PATCH message
test('PATCH message should be valid', () => {
  const result = parseCommitMessage('PATCH: My Project - v1.0.1');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.type, 'PATCH');
  assert.strictEqual(result.parsed.version, 'v1.0.1');
  assert.strictEqual(result.parsed.project, 'My Project');
});

// Test 2: Valid UPDATE message
test('UPDATE message should be valid', () => {
  const result = parseCommitMessage('UPDATE: My Project - v1.1.0');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.type, 'UPDATE');
  assert.strictEqual(result.parsed.version, 'v1.1.0');
  assert.strictEqual(result.parsed.project, 'My Project');
});

// Test 3: Valid RELEASE message
test('RELEASE message should be valid', () => {
  const result = parseCommitMessage('RELEASE: My Project - v2.0.0');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.type, 'RELEASE');
  assert.strictEqual(result.parsed.version, 'v2.0.0');
  assert.strictEqual(result.parsed.project, 'My Project');
});

// Test 4: Message with body should be valid
test('Message with body should be valid', () => {
  const message = 'PATCH: My Project - v1.0.1\n\n- Fixed bug\n- Improved performance';
  const result = parseCommitMessage(message);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.type, 'PATCH');
});

// Test 5: Message without type should be invalid
test('Message without type should be invalid', () => {
  const result = parseCommitMessage('My Project - v1.0.1');
  assert.strictEqual(result.valid, false);
  assert(result.error, 'Error message missing');
});

// Test 6: Message without version should be invalid
test('Message without version should be invalid', () => {
  const result = parseCommitMessage('PATCH: My Project');
  assert.strictEqual(result.valid, false);
  assert(result.error, 'Error message missing');
});

// Test 7: Message with invalid type should be invalid
test('Message with invalid type should be invalid', () => {
  const result = parseCommitMessage('INVALID: My Project - v1.0.1');
  assert.strictEqual(result.valid, false);
});

// Test 8: Message with malformed version should be invalid
test('Message with malformed version should be invalid', () => {
  const result = parseCommitMessage('PATCH: My Project - 1.0.1');
  assert.strictEqual(result.valid, false);
});

// Test 9: Empty message should be invalid
test('Empty message should be invalid', () => {
  const result = parseCommitMessage('');
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Message is required');
});

// Test 10: Message with special characters in project name
test('Message with special characters in project name should be valid', () => {
  const result = parseCommitMessage('PATCH: My-Project_Name 123 - v1.0.1');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.project, 'My-Project_Name 123');
});

// Test 11: Message with multi-line body
test('Message with multi-line body should be valid', () => {
  const message = `UPDATE: My App - v1.2.0

- Added new feature
- Fixed bug
- Improved docs`;
  const result = parseCommitMessage(message);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.parsed.type, 'UPDATE');
  assert.strictEqual(result.parsed.version, 'v1.2.0');
});

// Test 12: Case sensitivity of type
test('Type should be case-sensitive (uppercase only)', () => {
  const result = parseCommitMessage('patch: My Project - v1.0.1');
  assert.strictEqual(result.valid, false);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All commit message validation tests passed!');
