#!/usr/bin/env node

/**
 * Aureus - Install Hooks Script
 * Installs Git hooks for a repository (cross-platform)
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

async function installHooks(repoPath) {
  const hooksDir = path.join(repoPath, '.git', 'hooks');
  const pluginDir = path.join(__dirname, '..');
  const pluginHooksDir = path.join(pluginDir, 'hooks');

  await fs.mkdir(hooksDir, { recursive: true });

  const hooks = ['pre-commit', 'commit-msg', 'post-release'];
  const installed = [];

  for (const hook of hooks) {
    let source, target;

    if (isWindows) {
      // On Windows, use PowerShell hooks
      source = path.join(pluginHooksDir, `${hook}.ps1`);
      target = path.join(hooksDir, hook);

      if (await fileExists(source)) {
        // Create wrapper script that calls PowerShell
        const wrapper = `#!/bin/sh
# Aureus - ${hook} hook (Windows)
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${source}" $@
`;
        await fs.writeFile(target, wrapper, { mode: 0o755 });
        installed.push(hook);
      }
    } else {
      // On Unix, use bash hooks
      source = path.join(pluginHooksDir, `${hook}.sh`);
      target = path.join(hooksDir, hook);

      if (await fileExists(source)) {
        let content = await fs.readFile(source, 'utf-8');
        // Ensure shebang
        if (!content.startsWith('#!')) {
          content = '#!/bin/bash\n' + content;
        }
        await fs.writeFile(target, content, { mode: 0o755 });
        installed.push(hook);
      }
    }
  }

  return installed;
}

async function uninstallHooks(repoPath) {
  const hooksDir = path.join(repoPath, '.git', 'hooks');
  const hooks = ['pre-commit', 'commit-msg', 'post-release'];
  const uninstalled = [];

  for (const hook of hooks) {
    const target = path.join(hooksDir, hook);
    if (await fileExists(target)) {
      await fs.unlink(target);
      uninstalled.push(hook);
    }
  }

  return uninstalled;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// CLI
const [command, repoPath] = process.argv.slice(2);

if (!command || !repoPath) {
  console.log('Usage:');
  console.log('  node install-hooks.js install <repo-path>');
  console.log('  node install-hooks.js uninstall <repo-path>');
  process.exit(1);
}

(async () => {
  try {
    if (command === 'install') {
      const installed = await installHooks(path.resolve(repoPath));
      console.log(`✓ Installed hooks: ${installed.join(', ')}`);
    } else if (command === 'uninstall') {
      const uninstalled = await uninstallHooks(path.resolve(repoPath));
      console.log(`✓ Uninstalled hooks: ${uninstalled.join(', ')}`);
    } else {
      console.log('Unknown command:', command);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
