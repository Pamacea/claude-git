/**
 * Versioned Release Convention Parser
 * Parse and generate versioned commit messages
 */
/**
 * Parse Versioned Release Convention commit message
 * Format: TYPE: PROJECT NAME - vVERSION
 * Example: UPDATE: My Project - v1.2.0
 */
export function parseCommitMessage(message) {
    if (!message) {
        return { valid: false, error: 'Message is required' };
    }
    // Versioned Release Convention Pattern: TYPE: PROJECT NAME - vVERSION
    const versionedPattern = /^(RELEASE|UPDATE|PATCH):\s*([A-Za-z0-9_ -]+?)\s*-\s*(v[0-9]+\.[0-9]+\.[0-9]+)([\s\S]*)$/;
    const match = message.match(versionedPattern);
    if (match) {
        return {
            valid: true,
            convention: 'versioned-release',
            type: match[1],
            project: match[2].trim(),
            version: match[3],
            body: match[4].trim() || null,
            fullMessage: message,
        };
    }
    // Legacy Conventional Commits support (for backward compatibility)
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?:\s*(.+)/;
    const legacyMatch = message.match(conventionalPattern);
    if (legacyMatch) {
        return {
            valid: true,
            convention: 'conventional',
            type: legacyMatch[1],
            scope: legacyMatch[2] ? legacyMatch[2].slice(1, -1) : null,
            breaking: message.includes('!'),
            description: legacyMatch[3],
            fullMessage: message,
        };
    }
    return {
        valid: false,
        error: 'Does not match Versioned Release Convention or Conventional Commits format',
    };
}
/**
 * Generate Versioned Release Convention commit message
 * Format: TYPE: PROJECT - vVERSION
 */
export function generateCommitMessage(type, project, version, body, description = null) {
    // Versioned Release Convention format
    let message = `${type}: ${project} - ${version}`;
    // Add body/description if provided
    const bodyContent = description || body;
    if (bodyContent) {
        message += `\n\n${bodyContent}`;
    }
    return message;
}
/**
 * Parse semantic version string
 * Accepts formats: "1.2.3", "v1.2.3"
 */
export function parseVersion(version) {
    const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!match)
        return null;
    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
    };
}
/**
 * Bump version by commit type
 * RELEASE -> major, UPDATE -> minor, PATCH -> patch
 */
export function bumpVersion(version, type) {
    let parsed;
    if (typeof version === 'string') {
        parsed = parseVersion(version) || { major: 0, minor: 0, patch: 0 };
    }
    else {
        parsed = version;
    }
    switch (type) {
        case 'RELEASE':
            return `v${parsed.major + 1}.0.0`;
        case 'UPDATE':
            return `v${parsed.major}.${parsed.minor + 1}.0`;
        case 'PATCH':
        default:
            return `v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
}
/**
 * Get all version suggestions for a given base version
 */
export function getVersionSuggestions(baseVersion) {
    const parsed = parseVersion(baseVersion) || { major: 0, minor: 0, patch: 0 };
    return {
        currentVersion: `v${parsed.major}.${parsed.minor}.${parsed.patch}`,
        RELEASE: bumpVersion(parsed, 'RELEASE'),
        UPDATE: bumpVersion(parsed, 'UPDATE'),
        PATCH: bumpVersion(parsed, 'PATCH'),
    };
}
/**
 * Validate commit message against Versioned Release Convention
 */
export function validateCommitMessage(message) {
    const errors = [];
    const warnings = [];
    if (!message) {
        errors.push('Message is required');
        return { valid: false, errors, warnings };
    }
    const subject = message.split('\n')[0];
    // Check subject length
    if (subject.length > 100) {
        errors.push('Subject line must be 100 characters or less');
    }
    // Parse the message
    const parsed = parseCommitMessage(message);
    if (!parsed.valid) {
        errors.push(parsed.error || 'Invalid commit message format');
        errors.push('Message must follow Versioned Release Convention: TYPE: PROJECT NAME - vVERSION');
        errors.push('Valid types: RELEASE, UPDATE, PATCH');
        errors.push('Example: UPDATE: My Project - v1.1.0');
        return { valid: false, errors, warnings };
    }
    // Check for body if convention is versioned-release
    if (parsed.convention === 'versioned-release' && !parsed.body) {
        warnings.push('Consider adding change description in the body');
    }
    return {
        valid: true,
        errors: [],
        warnings,
        parsed,
    };
}
