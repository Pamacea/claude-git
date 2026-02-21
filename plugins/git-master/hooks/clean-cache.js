#!/usr/bin/env node

/**
 * Aureus - Clean Plugin Cache
 * Removes old plugin versions from Claude's cache to prevent conflicts
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const CLAUDE_CACHE = path.join(os.homedir(), '.claude', 'plugins', 'cache');

console.log('🧹 Cleaning Aureus plugin cache...');

// Directories to clean (old/conflicting plugins)
const OLD_PLUGINS = [
  'claude-git/git-master',
  'git-master/git-master'
];

async function cleanCache() {
  try {
    if (!fs.existsSync(CLAUDE_CACHE)) {
      console.log('✓ Cache directory does not exist, nothing to clean');
      return;
    }

    let cleaned = 0;

    for (const oldPlugin of OLD_PLUGINS) {
      const oldPath = path.join(CLAUDE_CACHE, oldPlugin);

      if (fs.existsSync(oldPath)) {
        try {
          fs.rmSync(oldPath, { recursive: true, force: true });
          console.log(`✓ Removed: ${oldPlugin}`);
          cleaned++;
        } catch (error) {
          console.log(`⚠ Could not remove ${oldPlugin}: ${error.message}`);
        }
      }
    }

    if (cleaned === 0) {
      console.log('✓ No old plugins found in cache');
    } else {
      console.log(`✓ Cleaned ${cleaned} old plugin(s) from cache`);
    }

    console.log('');
    console.log('Next steps:');
    console.log('1. Run: /plugin');
    console.log('2. Select: Remove aureus');
    console.log('3. Run: /plugin');
    console.log('4. Select: git-master (Aureus)');
    console.log('');
    console.log('The plugin will install with fresh dependencies.');
  } catch (error) {
    console.error('✗ Failed to clean cache:', error.message);
    process.exit(1);
  }
}

cleanCache();
