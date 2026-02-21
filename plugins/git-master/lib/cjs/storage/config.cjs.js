/**
 * Configuration Storage (CommonJS)
 * Load and save Aureus configuration
 */

const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

/**
 * Get default configuration
 */
function getDefaultConfig() {
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
async function loadConfig() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);

    // Merge with defaults to ensure all properties exist
    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default
      return getDefaultConfig();
    }
    console.error('Failed to load config:', error.message);
    return getDefaultConfig();
  }
}

/**
 * Save configuration to file
 */
async function saveConfig(config) {
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
async function resetConfig() {
  await saveConfig(getDefaultConfig());
}

/**
 * Get config file path
 */
function getConfigFilePath() {
  return CONFIG_FILE;
}

/**
 * Check if config file exists
 */
async function configExists() {
  try {
    await fs.access(CONFIG_FILE);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigFilePath,
  configExists,
  getDefaultConfig,
};
