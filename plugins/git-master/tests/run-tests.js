#!/usr/bin/env node

/**
 * Git Flow Master - Master Test Runner
 * Runs all tests and generates a report
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TESTS_DIR = __dirname;
const TEST_FILES = [
  'test-dependencies.js',
  'test-validation.js',
  'test-security.js'
  // 'test-server.js' - Run separately as it needs a running server
];

console.log('╔══════════════════════════════════════════╗');
console.log('║   Git Flow Master - Test Suite Runner   ║');
console.log('╚══════════════════════════════════════════╝\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(TESTS_DIR, testFile);

    console.log(`\n📝 Running ${testFile}...\n`);
    console.log('━'.repeat(50));

    try {
      const output = execSync(`node "${testPath}"`, {
        cwd: TESTS_DIR,
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      console.log(output);

      // Parse results
      const lines = output.split('\n');
      const passedMatch = lines.find(l => l.includes('passed'));
      const failedMatch = lines.find(l => l.includes('failed'));

      if (passedMatch) {
        const passed = parseInt(passedMatch.match(/\d+/)[0]);
        totalPassed += passed;
      }

      if (failedMatch) {
        const failed = parseInt(failedMatch.match(/\d+/)[0]);
        totalFailed += failed;
      }

      results.push({
        test: testFile,
        status: 'passed'
      });
    } catch (error) {
      console.error(error.stdout || error.stderr);
      totalFailed++;
      results.push({
        test: testFile,
        status: 'failed',
        error: error.message
      });
    }

    resolve();
  });
}

async function runAllTests() {
  // Run each test file
  for (const testFile of TEST_FILES) {
    await runTest(testFile);
  }

  // Print summary
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║              TEST SUMMARY               ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log(`Total Tests Run: ${TEST_FILES.length}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}\n`);

  if (totalFailed > 0) {
    console.log('❌ Some tests failed!\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
