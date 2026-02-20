/**
 * Git Validation Utilities
 * Path validation, sanitization, and security checks
 */
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
// Security: Allowed base paths for repository access
export const ALLOWED_BASE_PATHS = [
    os.homedir(),
    process.cwd(),
    path.join(os.homedir(), 'Projects'),
    path.join(os.homedir(), 'projects'),
    path.join(os.homedir(), 'workspace'),
    path.join(os.homedir(), 'Workspace'),
    path.join(os.homedir(), 'git'),
    path.join(os.homedir(), 'GitHub'),
    'C:\\Users',
    'D:\\Projects',
    '/home',
    '/Users',
    '/workspace',
    '/projects',
].filter(Boolean);
/**
 * Validate repository path to prevent traversal attacks
 * Ensures path is within allowed directories and is a git repo
 */
export async function validateRepoPath(repoPath) {
    if (!repoPath || typeof repoPath !== 'string') {
        throw new Error('Repository path is required and must be a string');
    }
    // Normalize and resolve the path
    const resolved = path.resolve(repoPath);
    // Check for null bytes (path truncation attack)
    if (resolved.includes('\0')) {
        throw new Error('Invalid path: contains null bytes');
    }
    // Check against allowed base paths
    const isAllowed = ALLOWED_BASE_PATHS.some((allowed) => {
        const normalizedAllowed = path.resolve(allowed);
        const relative = path.relative(normalizedAllowed, resolved);
        // Check if the relative path doesn't start with '..' (directory traversal)
        return !relative.startsWith('..');
    });
    if (!isAllowed) {
        throw new Error('Access denied: path outside allowed directories');
    }
    // Additional check for path traversal attempts
    if (repoPath.includes('..') || repoPath.includes('~')) {
        throw new Error('Path traversal detected');
    }
    // Verify it's a git repository
    const gitDir = path.join(resolved, '.git');
    try {
        const stat = await fs.stat(gitDir);
        if (!stat.isDirectory()) {
            throw new Error('Not a git repository');
        }
    }
    catch {
        throw new Error('Not a git repository or path does not exist');
    }
    return resolved;
}
/**
 * Sanitize file path (for git add and other operations)
 * Removes dangerous characters to prevent command injection
 */
export function sanitizeFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('File path must be a non-empty string');
    }
    // Remove null bytes
    let sanitized = filePath.replace(/\0/g, '');
    // Remove dangerous shell characters (safe since we use shell: false)
    // But keep characters that are valid in file paths
    const dangerousChars = /[;&|<>$`]/g;
    sanitized = sanitized.replace(dangerousChars, '');
    // Prevent absolute paths that could escape (for git operations)
    if (path.isAbsolute(sanitized)) {
        // Only allow if within cwd
        const resolved = path.resolve(sanitized);
        if (!resolved.startsWith(process.cwd())) {
            throw new Error('Absolute paths must be within current working directory');
        }
    }
    // Prevent parent directory traversal
    if (sanitized.includes('..')) {
        const resolved = path.resolve(sanitized);
        if (!resolved.startsWith(process.cwd())) {
            throw new Error('Path traversal not allowed');
        }
    }
    return sanitized;
}
/**
 * Sanitize commit message
 * Removes control characters and limits length
 */
export function sanitizeCommitMessage(message) {
    if (!message || typeof message !== 'string') {
        throw new Error('Commit message must be a non-empty string');
    }
    // Remove null bytes and control characters except newline and tab
    let sanitized = message.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // Limit length (Git can handle longer messages but we cap for safety)
    if (sanitized.length > 5000) {
        throw new Error('Commit message too long (max 5000 characters)');
    }
    return sanitized.trim();
}
/**
 * Validate version string (semver format)
 */
export function validateVersion(version) {
    if (!version || typeof version !== 'string') {
        return false;
    }
    // Strict semver pattern (without 'v' prefix)
    const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverPattern.test(version);
}
/**
 * Validate version with optional 'v' prefix
 */
export function validateVersionWithPrefix(version) {
    if (!version || typeof version !== 'string') {
        return false;
    }
    // Remove 'v' prefix if present
    const withoutPrefix = version.startsWith('v') ? version.slice(1) : version;
    return validateVersion(withoutPrefix);
}
