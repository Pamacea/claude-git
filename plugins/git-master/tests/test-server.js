#!/usr/bin/env node

/**
 * Aureus - Server Tests
 * Tests the web server functionality
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const WEB_DIR = path.join(__dirname, '..', 'web');
const SERVER_PORT = 3748; // Use different port for tests
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

let server;
let serverProcess;

console.log('🧪 Running Server Tests...\n');

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

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

before(async function() {
  console.log('🚀 Starting test server...\n');

  // Start server on test port
  const { spawn } = require('child_process');

  serverProcess = spawn('node', ['server.js'], {
    cwd: WEB_DIR,
    env: { ...process.env, PORT: SERVER_PORT },
    stdio: 'pipe',
    windowsHide: true
  });

  serverProcess.stdout.on('data', (data) => {
    // Suppress output during tests
  });

  serverProcess.stderr.on('data', (data) => {
    // Suppress errors during tests
  });

  // Wait for server to start
  await sleep(2000);
});

after(function() {
  console.log('\n🛑 Stopping test server...');

  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

// Test 1: Server should respond to HTTP requests
testAsync('Server should respond to HTTP requests', async () => {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/config`, (res) => {
      assert.strictEqual(res.statusCode, 200, 'Server not responding');
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          assert(config, 'Response is not JSON');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
});

// Test 2: API /api/config should return config
testAsync('GET /api/config should return configuration', async () => {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/config`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          assert(config, 'Config is null');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
});

// Test 3: API /api/state should return state
testAsync('GET /api/state should return state', async () => {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/state`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const state = JSON.parse(data);
          assert(state, 'State is null');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
});

// Test 4: API /api/csrf-token should return token
testAsync('GET /api/csrf-token should return CSRF token', async () => {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/csrf-token`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const { token } = JSON.parse(data);
          assert(token, 'Token is missing');
          assert.strictEqual(typeof token, 'string', 'Token is not a string');
          assert(token.length > 0, 'Token is empty');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
});

// Test 5: API /api/suggest/types should return types
testAsync('GET /api/suggest/types should return commit types', async () => {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/api/suggest/types`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const { types } = JSON.parse(data);
          assert(Array.isArray(types), 'Types is not an array');
          assert(types.length > 0, 'Types array is empty');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
});

// Test 6: POST /api/validate/message should validate messages
testAsync('POST /api/validate/message should validate commit messages', async () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: 'PATCH: My Project - v1.0.1'
    });

    const options = {
      hostname: 'localhost',
      port: SERVER_PORT,
      path: '/api/validate/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          assert.strictEqual(result.valid, true, 'Valid message rejected');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All server tests passed!');
