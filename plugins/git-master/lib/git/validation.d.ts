/**
 * Git Validation Utilities
 * Path validation, sanitization, and security checks
 */
export declare const ALLOWED_BASE_PATHS: string[];
/**
 * Validate repository path to prevent traversal attacks
 * Ensures path is within allowed directories and is a git repo
 */
export declare function validateRepoPath(repoPath: string): Promise<string>;
/**
 * Sanitize file path (for git add and other operations)
 * Removes dangerous characters to prevent command injection
 */
export declare function sanitizeFilePath(filePath: string): string;
/**
 * Sanitize commit message
 * Removes control characters and limits length
 */
export declare function sanitizeCommitMessage(message: string): string;
/**
 * Validate version string (semver format)
 */
export declare function validateVersion(version: string): boolean;
/**
 * Validate version with optional 'v' prefix
 */
export declare function validateVersionWithPrefix(version: string): boolean;
