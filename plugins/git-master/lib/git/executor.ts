/**
 * Git Command Executor
 * Secure async git command execution using spawn (no shell)
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Execute git command securely using spawn (shell: false)
 * Prevents command injection by avoiding shell interpretation
 */
export async function execGit(
  args: string[],
  options: ExecOptions = {}
): Promise<string> {
  return execSecure('git', args, options);
}

/**
 * Execute any command securely using spawn (shell: false)
 * Prevents command injection by avoiding shell interpretation
 */
export async function execSecure(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<string> {
  // Validate inputs
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be an array');
  }

  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new Error('Invalid argument type: all arguments must be strings');
    }
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      shell: false, // Critical: no shell to prevent injection
      windowsHide: true,
      timeout: options.timeout || 30000,
    });

    let stdout = '';
    let stderr = '';

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`${command} failed with exit code ${code}: ${stderr.slice(0, 200)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Command execution error: ${err.message}`));
    });
  });
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current git repository path from cwd
 * Traverses up to find .git directory
 */
export async function getCurrentRepoPath(): Promise<string> {
  let currentDir = process.cwd();
  let lastDir = '';

  while (currentDir !== lastDir) {
    const gitDir = path.join(currentDir, '.git');
    try {
      const stat = await fs.stat(gitDir);
      if (stat.isDirectory()) {
        return currentDir;
      }
    } catch {
      // Not a git directory, continue
    }

    lastDir = currentDir;
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Not in a git repository');
}
