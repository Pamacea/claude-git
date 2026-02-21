/**
 * State Storage
 * Load and save Aureus state (tracked repos, hooks, etc.)
 */
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
const DATA_DIR = path.join(os.homedir(), '.git-flow-master');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
/**
 * Get default state
 */
export function getDefaultState() {
    return {
        repositories: [],
        activeHooks: {},
        lastSync: null,
    };
}
/**
 * Load state from file
 */
export async function loadState() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const content = await fs.readFile(STATE_FILE, 'utf-8');
        const state = JSON.parse(content);
        // Merge with defaults to ensure all properties exist
        return {
            repositories: state.repositories || [],
            activeHooks: state.activeHooks || {},
            lastSync: state.lastSync || null,
            config: state.config || {},
        };
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return default
            return getDefaultState();
        }
        console.error('Failed to load state:', error.message);
        return getDefaultState();
    }
}
/**
 * Save state to file
 */
export async function saveState(state) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Load existing state to merge
    const existing = await loadState();
    const merged = {
        repositories: state.repositories !== undefined ? state.repositories : existing.repositories,
        activeHooks: state.activeHooks !== undefined ? state.activeHooks : existing.activeHooks,
        lastSync: state.lastSync !== undefined ? state.lastSync : existing.lastSync,
        config: state.config !== undefined ? state.config : existing.config,
    };
    // Set secure file permissions (0o600 = owner read/write only)
    const content = JSON.stringify(merged, null, 2);
    await fs.writeFile(STATE_FILE, content, { mode: 0o600 });
}
/**
 * Reset state to defaults
 */
export async function resetState() {
    await saveState(getDefaultState());
}
/**
 * Get state file path
 */
export function getStateFilePath() {
    return STATE_FILE;
}
/**
 * Check if state file exists
 */
export async function stateExists() {
    try {
        await fs.access(STATE_FILE);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Add a repository to tracked repos
 */
export async function addRepository(repo) {
    const state = await loadState();
    // Check if repo already exists
    const existingIndex = state.repositories.findIndex((r) => r.path === repo.path);
    if (existingIndex >= 0) {
        // Update existing repo
        state.repositories[existingIndex] = repo;
    }
    else {
        // Add new repo
        state.repositories.push(repo);
    }
    await saveState(state);
}
/**
 * Remove a repository from tracked repos
 */
export async function removeRepository(repoPath) {
    const state = await loadState();
    state.repositories = state.repositories.filter((r) => r.path !== repoPath);
    // Also remove hooks for this repo
    delete state.activeHooks[repoPath];
    await saveState(state);
}
/**
 * Update hooks status for a repository
 */
export async function updateHooksStatus(repoPath, hooks) {
    const state = await loadState();
    if (!state.activeHooks[repoPath]) {
        state.activeHooks[repoPath] = {};
    }
    state.activeHooks[repoPath] = { ...state.activeHooks[repoPath], ...hooks };
    await saveState(state);
}
/**
 * Get hooks status for a repository
 */
export async function getHooksStatus(repoPath) {
    const state = await loadState();
    return state.activeHooks[repoPath] || null;
}
