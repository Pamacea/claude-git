/**
 * State Storage
 * Load and save Aureus state (tracked repos, hooks, etc.)
 */
export interface RepositoryInfo {
    name: string;
    path: string;
    branch?: string | null;
    hasHooks?: boolean;
    remotes?: Record<string, string> | null;
}
export interface ActiveHooks {
    [repoPath: string]: {
        [hookName: string]: boolean;
    };
}
export interface StateConfig {
    workingDir?: string;
    lastScan?: string;
}
export interface GitFlowMasterState {
    repositories: RepositoryInfo[];
    activeHooks: ActiveHooks;
    lastSync?: string | null;
    config?: StateConfig;
}
/**
 * Get default state
 */
export declare function getDefaultState(): GitFlowMasterState;
/**
 * Load state from file
 */
export declare function loadState(): Promise<GitFlowMasterState>;
/**
 * Save state to file
 */
export declare function saveState(state: Partial<GitFlowMasterState>): Promise<void>;
/**
 * Reset state to defaults
 */
export declare function resetState(): Promise<void>;
/**
 * Get state file path
 */
export declare function getStateFilePath(): string;
/**
 * Check if state file exists
 */
export declare function stateExists(): Promise<boolean>;
/**
 * Add a repository to tracked repos
 */
export declare function addRepository(repo: RepositoryInfo): Promise<void>;
/**
 * Remove a repository from tracked repos
 */
export declare function removeRepository(repoPath: string): Promise<void>;
/**
 * Update hooks status for a repository
 */
export declare function updateHooksStatus(repoPath: string, hooks: {
    [hookName: string]: boolean;
}): Promise<void>;
/**
 * Get hooks status for a repository
 */
export declare function getHooksStatus(repoPath: string): Promise<{
    [hookName: string]: boolean;
} | null>;
