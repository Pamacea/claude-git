#!/usr/bin/env node

/**
 * Aureus - Post Git Operation Hook (Node.js Wrapper)
 * Cross-platform wrapper that detects OS and calls appropriate script
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Read JSON input from stdin
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const command = data.tool_input?.command;

    // Check if this is a git command - exit immediately if not
    if (!command || !command.startsWith('git ')) {
      process.exit(0);
    }

    // Detect platform and call appropriate script
    const platform = process.platform;
    const scriptDir = __dirname;

    let scriptCmd;
    if (platform === 'win32') {
      // Windows: Use PowerShell script
      const ps1Script = path.join(scriptDir, 'post-git-operation.ps1');
      if (fs.existsSync(ps1Script)) {
        scriptCmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Script}"`;
      } else {
        // Fallback to cmd wrapper
        const cmdScript = path.join(scriptDir, 'post-git-operation.cmd');
        if (fs.existsSync(cmdScript)) {
          scriptCmd = `"${cmdScript}"`;
        }
      }
    } else {
      // Unix/Linux/macOS: Use Bash script
      const shScript = path.join(scriptDir, 'post-git-operation.sh');
      if (fs.existsSync(shScript)) {
        scriptCmd = `bash "${shScript}"`;
      }
    }

    if (scriptCmd) {
      // Pass input to the script via stdin
      execSync(scriptCmd, {
        input: input,
        stdio: ['pipe', 'inherit', 'inherit']
      });
    }

    process.exit(0);
  } catch (error) {
    // Script failed - log but don't block
    // Post hooks shouldn't prevent commands from running
    console.error('Post-git-operation hook error:', error.message);
    process.exit(0);
  }
});
