/**
 * Configuration Storage
 * Load and save Git Flow Master configuration
 */
export interface CommitTypeConfig {
    description: string;
    emoji: string;
    semverBump: 'MAJOR' | 'MINOR' | 'PATCH';
    format: string;
}
export interface CommitRulesConfig {
    subjectMinLength: number;
    subjectMaxLength: number;
    bodyLineLength: number;
    requireVersion: boolean;
    requireProjectName: boolean;
    versionPattern: string;
    projectNameMaxLength: number;
}
export interface AmendConfig {
    enabled: boolean;
    maxAmends: number;
    requireSameDay: boolean;
    autoIncrementPatch: boolean;
    keepVersion: boolean;
    allowedForTypes: string[];
}
export interface CommitConfig {
    convention: string;
    types: {
        RELEASE: CommitTypeConfig;
        UPDATE: CommitTypeConfig;
        PATCH: CommitTypeConfig;
    };
    rules: CommitRulesConfig;
    amend: AmendConfig;
}
export interface HooksConfig {
    preCommit: {
        enabled: boolean;
        lint: boolean;
        typecheck: boolean;
        test: boolean;
        secretScan: boolean;
    };
    commitMsg: {
        enabled: boolean;
        validate: boolean;
        enforceVersionedFormat: boolean;
        allowAmend: boolean;
    };
}
export interface BranchConfig {
    mainBranch: string;
    developBranch: string;
}
export interface GitFlowMasterConfig {
    projectName: string;
    commit: CommitConfig;
    hooks: HooksConfig;
    branch: BranchConfig;
}
/**
 * Get default configuration
 */
export declare function getDefaultConfig(): GitFlowMasterConfig;
/**
 * Load configuration from file
 */
export declare function loadConfig(): Promise<GitFlowMasterConfig>;
/**
 * Save configuration to file
 */
export declare function saveConfig(config: Partial<GitFlowMasterConfig>): Promise<void>;
/**
 * Reset configuration to defaults
 */
export declare function resetConfig(): Promise<void>;
/**
 * Get config file path
 */
export declare function getConfigFilePath(): string;
/**
 * Check if config file exists
 */
export declare function configExists(): Promise<boolean>;
