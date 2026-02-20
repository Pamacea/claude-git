/**
 * Git Command Executor
 * Secure async git command execution using spawn (no shell)
 */
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
export declare function execGit(args: string[], options?: ExecOptions): Promise<string>;
/**
 * Execute any command securely using spawn (shell: false)
 * Prevents command injection by avoiding shell interpretation
 */
export declare function execSecure(command: string, args: string[], options?: ExecOptions): Promise<string>;
/**
 * Check if a file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Get current git repository path from cwd
 * Traverses up to find .git directory
 */
export declare function getCurrentRepoPath(): Promise<string>;
