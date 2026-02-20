/**
 * Configuration Storage
 * Load and save Git Flow Master configuration
 */

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

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
export function getDefaultConfig(): GitFlowMasterConfig {
  return {
    projectName: 'My Project',
    commit: {
      convention: 'versioned-release',
      types: {
        RELEASE: {
          description: 'Major release - Breaking changes, new major version',
          emoji: '🚀',
          semverBump: 'MAJOR',
          format: 'RELEASE: {project} - v{version}',
        },
        UPDATE: {
          description: 'Minor update - New features, enhancements',
          emoji: '✨',
          semverBump: 'MINOR',
          format: 'UPDATE: {project} - v{version}',
        },
        PATCH: {
          description: 'Patch - Bug fixes, small improvements',
          emoji: '🔧',
          semverBump: 'PATCH',
          format: 'PATCH: {project} - v{version}',
        },
      },
      rules: {
        subjectMinLength: 10,
        subjectMaxLength: 100,
        bodyLineLength: 100,
        requireVersion: true,
        requireProjectName: true,
        versionPattern: 'v\\d+\\.\\d+\\.\\d+',
        projectNameMaxLength: 50,
      },
      amend: {
        enabled: true,
        maxAmends: 10,
        requireSameDay: true,
        autoIncrementPatch: false,
        keepVersion: true,
        allowedForTypes: ['PATCH', 'UPDATE'],
      },
    },
    hooks: {
      preCommit: {
        enabled: true,
        lint: true,
        typecheck: true,
        test: false,
        secretScan: true,
      },
      commitMsg: {
        enabled: true,
        validate: true,
        enforceVersionedFormat: true,
        allowAmend: true,
      },
    },
    branch: {
      mainBranch: 'main',
      developBranch: 'develop',
    },
  };
}

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<GitFlowMasterConfig> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as Partial<GitFlowMasterConfig>;

    // Merge with defaults to ensure all properties exist
    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, return default
      return getDefaultConfig();
    }
    console.error('Failed to load config:', (error as Error).message);
    return getDefaultConfig();
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Partial<GitFlowMasterConfig>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Load existing config to merge
  const existing = await loadConfig();
  const merged = { ...existing, ...config };

  // Set secure file permissions (0o600 = owner read/write only)
  const content = JSON.stringify(merged, null, 2);
  await fs.writeFile(CONFIG_FILE, content, { mode: 0o600 });
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(): Promise<void> {
  await saveConfig(getDefaultConfig());
}

/**
 * Get config file path
 */
export function getConfigFilePath(): string {
  return CONFIG_FILE;
}

/**
 * Check if config file exists
 */
export async function configExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_FILE);
    return true;
  } catch {
    return false;
  }
}
