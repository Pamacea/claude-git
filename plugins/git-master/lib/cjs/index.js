/**
 * Git Flow Master - Shared Utilities Library (CommonJS)
 * Barrel export for all modules - for use in .js files
 */

// Git utilities
const {
  execGit,
  execSecure,
  fileExists,
  getCurrentRepoPath,
} = require('./git/executor.cjs');

const {
  validateRepoPath,
  sanitizeFilePath,
  sanitizeCommitMessage,
  validateVersion,
  validateVersionWithPrefix,
  ALLOWED_BASE_PATHS,
} = require('./git/validation.cjs');

// Convention utilities
const {
  parseCommitMessage,
  generateCommitMessage,
  parseVersion,
  bumpVersion,
  getVersionSuggestions,
  validateCommitMessage,
} = require('./convention/parser.cjs');

// Storage utilities
const {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigFilePath,
  configExists,
  getDefaultConfig,
} = require('./storage/config.cjs');

const {
  loadState,
  saveState,
  resetState,
  getStateFilePath,
  stateExists,
  addRepository,
  removeRepository,
  updateHooksStatus,
  getHooksStatus,
  getDefaultState,
} = require('./storage/state.cjs');

module.exports = {
  // Git utilities
  execGit,
  execSecure,
  fileExists,
  getCurrentRepoPath,
  validateRepoPath,
  sanitizeFilePath,
  sanitizeCommitMessage,
  validateVersion,
  validateVersionWithPrefix,
  ALLOWED_BASE_PATHS,

  // Convention utilities
  parseCommitMessage,
  generateCommitMessage,
  parseVersion,
  bumpVersion,
  getVersionSuggestions,
  validateCommitMessage,

  // Storage utilities
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigFilePath,
  configExists,
  getDefaultConfig,
  loadState,
  saveState,
  resetState,
  getStateFilePath,
  stateExists,
  addRepository,
  removeRepository,
  updateHooksStatus,
  getHooksStatus,
  getDefaultState,
};
