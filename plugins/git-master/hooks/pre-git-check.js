#!/usr/bin/env node

/**
 * Aureus - Pre Git Commit Check Hook (Node.js Wrapper)
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
      const ps1Script = path.join(scriptDir, 'pre-git-check.ps1');
      if (fs.existsSync(ps1Script)) {
        scriptCmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Script}"`;
      } else {
        // Fallback to cmd wrapper
        const cmdScript = path.join(scriptDir, 'pre-git-check.cmd');
        if (fs.existsSync(cmdScript)) {
          scriptCmd = `"${cmdScript}"`;
        }
      }
    } else {
      // Unix/Linux/macOS: Use Bash script
      const shScript = path.join(scriptDir, 'pre-git-check.sh');
      if (fs.existsSync(shScript)) {
        scriptCmd = `bash "${shScript}"`;
      }
    }

    if (scriptCmd) {
      // Pass input to the script via stdin
      const result = execSync(scriptCmd, {
        input: input,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      process.exit(0);
    } else {
      // No script found, exit silently
      process.exit(0);
    }
  } catch (error) {
    // Script failed or returned non-zero exit code
    if (error.status !== undefined) {
      process.exit(error.status);
    }
    // Other error - exit silently
    process.exit(0);
  }
});
