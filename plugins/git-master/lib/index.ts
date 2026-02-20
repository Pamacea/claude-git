/**
 * Git Flow Master - Shared Utilities Library
 * Barrel export for all modules
 */

// Git utilities
export {
  execGit,
  execSecure,
  fileExists,
  getCurrentRepoPath,
  type ExecOptions,
  type ExecResult,
} from './git/executor.js';

export {
  validateRepoPath,
  sanitizeFilePath,
  sanitizeCommitMessage,
  validateVersion,
  validateVersionWithPrefix,
  ALLOWED_BASE_PATHS,
} from './git/validation.js';

// Convention utilities
export {
  parseCommitMessage,
  generateCommitMessage,
  parseVersion,
  bumpVersion,
  getVersionSuggestions,
  validateCommitMessage,
  type CommitMessage,
  type ParsedVersion,
  type CommitType,
} from './convention/parser.js';

// Storage utilities
export {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigFilePath,
  configExists,
  getDefaultConfig,
  type GitFlowMasterConfig,
  type CommitTypeConfig,
  type CommitRulesConfig,
  type AmendConfig,
  type CommitConfig,
  type HooksConfig,
  type BranchConfig,
} from './storage/config.js';

export {
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
  type GitFlowMasterState,
  type RepositoryInfo,
  type ActiveHooks,
  type StateConfig,
} from './storage/state.js';
