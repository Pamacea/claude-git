/**
 * Versioned Release Convention Parser
 * Parse and generate versioned commit messages
 */
export interface CommitMessage {
    valid: boolean;
    convention?: 'versioned-release' | 'conventional';
    type?: 'RELEASE' | 'UPDATE' | 'PATCH' | string;
    project?: string;
    version?: string;
    body?: string | null;
    scope?: string | null;
    breaking?: boolean;
    description?: string;
    fullMessage?: string;
    error?: string;
}
export interface ParsedVersion {
    major: number;
    minor: number;
    patch: number;
}
export type CommitType = 'RELEASE' | 'UPDATE' | 'PATCH';
/**
 * Parse Versioned Release Convention commit message
 * Format: TYPE: PROJECT NAME - vVERSION
 * Example: UPDATE: My Project - v1.2.0
 */
export declare function parseCommitMessage(message: string): CommitMessage;
/**
 * Generate Versioned Release Convention commit message
 * Format: TYPE: PROJECT - vVERSION
 */
export declare function generateCommitMessage(type: CommitType, project: string, version: string, body?: string | null, description?: string | null): string;
/**
 * Parse semantic version string
 * Accepts formats: "1.2.3", "v1.2.3"
 */
export declare function parseVersion(version: string): ParsedVersion | null;
/**
 * Bump version by commit type
 * RELEASE -> major, UPDATE -> minor, PATCH -> patch
 */
export declare function bumpVersion(version: string | ParsedVersion, type: CommitType): string;
/**
 * Get all version suggestions for a given base version
 */
export declare function getVersionSuggestions(baseVersion: string): {
    currentVersion: string;
    RELEASE: string;
    UPDATE: string;
    PATCH: string;
};
/**
 * Validate commit message against Versioned Release Convention
 */
export declare function validateCommitMessage(message: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    parsed?: CommitMessage;
};
