// Aureus - Web Interface App (SECURED)
//
// Versioned Release Convention:
// - RELEASE: Project Name - v1.0.0 (Major)
// - UPDATE: Project Name - v1.1.0 (Minor)
// - PATCH: Project Name - v1.0.1 (Patch)
//
// Security Features:
// - XSS prevention via sanitization
// - CSRF token handling for state-changing requests
// - Input validation
// - Safe error handling

const API_BASE = 'http://localhost:3747/api';

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

const Sanitizer = {
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return text.replace(/[&<>"'`=/]/g, m => map[m]);
  },

  sanitize(input) {
    if (typeof input !== 'string') return '';
    return this.escapeHtml(input);
  },

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitize(key);
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitize(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    return sanitized;
  }
};

const Validator = {
  isValidPath(path) {
    if (typeof path !== 'string') return false;
    if (path.includes('\0') || path.includes('..')) return false;
    if (path.length > 4096) return false;
    return true;
  },

  isValidType(type) {
    return ['RELEASE', 'UPDATE', 'PATCH'].includes(type);
  },

  isValidVersion(version) {
    return /^v\d+\.\d+\.\d+$/.test(version);
  },

  isValidProjectName(name) {
    if (typeof name !== 'string') return false;
    if (name.length < 1 || name.length > 50) return false;
    return /^[A-Za-z0-9_ -]+$/.test(name);
  },

  isValidDescription(desc) {
    if (typeof desc !== 'string') return false;
    if (desc.length > 5000) return false;
    return true;
  }
};

// ============================================================================
// CSRF TOKEN MANAGER
// ============================================================================

const CSRFManager = {
  token: null,
  tokenPromise: null,

  async getToken() {
    if (this.token) return this.token;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = this.fetchToken();
    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  },

  async fetchToken() {
    try {
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to get CSRF token');
      const data = await response.json();
      this.token = data.token;
      return this.token;
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      throw error;
    }
  },

  clearToken() {
    this.token = null;
  }
};

// ============================================================================
// VERSION UTILITIES
// ============================================================================

const VersionUtils = {
  parse(version) {
    const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  },

  bumpMajor(parsed) {
    return `v${parsed.major + 1}.0.0`;
  },

  bumpMinor(parsed) {
    return `v${parsed.major}.${parsed.minor + 1}.0`;
  },

  bumpPatch(parsed) {
    return `v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  },

  compare(a, b) {
    const pa = this.parse(a);
    const pb = this.parse(b);
    if (!pa || !pb) return 0;
    if (pa.major !== pb.major) return pa.major - pb.major;
    if (pa.minor !== pb.minor) return pa.minor - pb.minor;
    return pa.patch - pb.patch;
  }
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================

function gitFlowApp() {
  return {
    // State
    currentView: 'dashboard',
    isOnline: true,
    scanDir: '',
    repositories: [],
    config: {},
    commitTypes: {},
    recentCommits: [],
    error: null,
    hasLoadedState: false,  // Track if state has been loaded

    // UI State
    showCommitModal: false,
    showAmendModal: false,
    selectedRepo: '',
    activeHooks: {},
    rawConfig: '',
    lastCommit: null,
    suggestedVersions: null,

    // Loading States
    isScanning: false,
    isLoading: false,

    // Commit Form (Versioned Release Convention)
    commitForm: {
      type: 'UPDATE',
      project: '',
      version: '',
      description: ''
    },

    // Amend Form
    amendForm: {
      message: '',
      files: []
    },

    // Init
    async init() {
      await this.loadConfig();

      // Set up watchers BEFORE loading state
      this.$watch('config', () => this.updateRawConfig());
      this.$watch('hasLoadedState', () => Alpine.nextTick(() => this.updateUIForState()));
      // Watch repositories array for changes (deep watch for array content)
      this.$watch('repositories', () => Alpine.nextTick(() => this.updateUIForState()), { deep: true });

      // Load existing state to show repositories (no scan)
      await this.loadState();
      await this.loadCommitTypes();

      // Initial status poll
      this.pollStatus();

      // Poll status every 30 seconds
      setInterval(() => this.pollStatus(), 30000);
    },

    // Poll status endpoint
    async pollStatus() {
      try {
        const status = await this.api('/status');
        this.updateStats(status);
      } catch (error) {
        console.error('Failed to poll status:', error);
        // Silently fail - stats will update on next successful poll
      }
    },

    // Update UI stats from status endpoint
    updateStats(status) {
      if (!status || !status.statistics) return;

      const stats = status.statistics;

      // Update repo count
      const repoCountEl = document.getElementById('repoCount');
      if (repoCountEl) {
        repoCountEl.textContent = stats.repositories || 0;
      }

      // Update hooks count
      const hooksCountEl = document.getElementById('hooksCount');
      if (hooksCountEl) {
        hooksCountEl.textContent = stats.hooksInstalled || 0;
      }

      // Update uptime
      const uptimeEl = document.getElementById('uptimeValue');
      if (uptimeEl) {
        uptimeEl.textContent = this.formatUptime(stats.uptime || 0);
      }

      // Update status badge
      const statusBadgeEl = document.getElementById('statusBadge');
      if (statusBadgeEl) {
        const statusText = statusBadgeEl.querySelector('.status-text');
        if (statusText) {
          statusText.textContent = (status.status || 'unknown').charAt(0).toUpperCase() + (status.status || 'unknown').slice(1);
        }
        // Update badge class based on status
        statusBadgeEl.className = 'status-badge ' +
          (status.status === 'online' ? 'status-online' : 'status-offline');
      }
    },

    // Format uptime seconds to human-readable format
    formatUptime(seconds) {
      if (typeof seconds !== 'number' || seconds < 0) return '0s';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    },

    safeDisplay(text) {
      return Sanitizer.sanitize(text);
    },

    // API Calls with CSRF protection
    async api(endpoint, options = {}) {
      try {
        const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
          (options.method || 'GET').toUpperCase()
        );

        const headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };

        if (needsCsrf) {
          try {
            const csrfToken = await CSRFManager.getToken();
            headers['X-CSRF-Token'] = csrfToken;
          } catch (csrfError) {
            this.error = 'Security error. Please refresh the page.';
            throw new Error('CSRF token unavailable');
          }
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers,
          credentials: 'same-origin',
          ...options
        });

        if (response.status === 403) {
          const data = await response.json().catch(() => ({}));
          if (data.error && data.error.includes('CSRF')) {
            CSRFManager.clearToken();
            const newToken = await CSRFManager.getToken();
            headers['X-CSRF-Token'] = newToken;
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
              headers,
              credentials: 'same-origin',
              ...options
            });
            if (!retryResponse.ok) throw new Error(`API error: ${retryResponse.status}`);
            return await retryResponse.json();
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        this.isOnline = true;
        return await response.json();
      } catch (error) {
        console.error('API error:', error);
        this.isOnline = false;
        throw error;
      }
    },

    // Load Config
    async loadConfig() {
      try {
        this.config = await this.api('/config');
        this.updateRawConfig();
        // Set project name from config if available
        if (this.config.projectName) {
          this.commitForm.project = this.config.projectName;
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        this.error = 'Failed to load configuration';
      }
    },

    // Load State
    async loadState() {
      try {
        const state = await this.api('/state');
        this.repositories = state.repositories || [];
        this.activeHooks = state.activeHooks || {};
        this.hasLoadedState = true;
        // Note: updateUIForState() is called via the watcher on hasLoadedState
      } catch (error) {
        console.error('Failed to load state:', error);
        this.hasLoadedState = true;
        // Note: updateUIForState() is called via the watcher on hasLoadedState
      }
    },

    // Update UI based on state
    updateUIForState() {
      const emptyState = document.getElementById('emptyState');
      const reposContainer = document.getElementById('reposContainer');

      if (!emptyState || !reposContainer) return;

      if (this.repositories.length === 0 && this.hasLoadedState) {
        emptyState.style.display = 'block';
        reposContainer.style.display = 'none';
      } else if (this.repositories.length > 0) {
        emptyState.style.display = 'none';
        reposContainer.style.display = 'block';
        this.renderRepositories();
      }
    },

    // Render repository cards
    renderRepositories() {
      const container = document.getElementById('reposContainer');
      if (!container) return;

      container.innerHTML = this.repositories.map((repo, index) => {
        const hasHooks = this.hasHooks(repo.path);

        return `
          <div class="card" style="animation-delay: ${index * 0.05}s;">
            <div class="repo-card-header">
              <div class="repo-card-header-left">
                <svg class="repo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/>
                </svg>
                <div>
                  <div class="repo-name">${this.safeDisplay(repo.name)}</div>
                  <div class="repo-path">${this.safeDisplay(repo.path)}</div>
                </div>
              </div>
              <div class="repo-card-header-right">
                <span class="repo-branch">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="6" y1="3" x2="6" y2="15"/>
                    <circle cx="18" cy="6" r="3"/>
                    <circle cx="6" cy="18" r="3"/>
                    <path d="M18 9a9 9 0 0 1-9 9"/>
                  </svg>
                  ${this.safeDisplay(repo.branch || 'main')}
                </span>
                <span class="repo-status ${hasHooks ? 'status-enabled' : 'status-disabled'}">
                  ${hasHooks ? '🪝 Hooks Active' : '⚠ No Hooks'}
                </span>
              </div>
            </div>
            <div class="repo-card-content">
              <div class="repo-stats">
                ${repo.recentCommits && repo.recentCommits.length > 0 ? `
                  <span class="repo-stat">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    ${repo.recentCommits.length} commits
                  </span>
                ` : ''}
              </div>
              <div class="repo-actions">
                <button class="repo-action-btn repo-action-view" onclick="window.viewRepo && window.viewRepo('${this.safeDisplay(repo.path)}')">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
                <button class="repo-action-btn ${hasHooks ? 'repo-action-danger' : 'repo-action-primary'}"
                        onclick="window.toggleHooks && window.toggleHooks('${this.safeDisplay(repo.path)}')">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    ${hasHooks
                      ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>'
                      : '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'
                    }
                  </svg>
                  ${hasHooks ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Store repos globally for button handlers
      window.currentRepos = this.repositories;
      window.viewRepo = (path) => {
        const repo = this.repositories.find(r => r.path === path);
        if (repo) {
          alert(`Repository: ${repo.name}\nBranch: ${repo.branch || 'N/A'}\nPath: ${repo.path}`);
        }
      };
      window.toggleHooks = (path) => {
        const repo = this.repositories.find(r => r.path === path);
        if (repo) {
          this.toggleHooks(repo).then(() => this.renderRepositories());
        }
      };
    },

    // Load Commit Types
    async loadCommitTypes() {
      try {
        this.commitTypes = await this.api('/suggest/types');
      } catch (error) {
        console.error('Failed to load commit types:', error);
      }
    },

    // Update Raw Config
    updateRawConfig() {
      try {
        this.rawConfig = JSON.stringify(this.config, null, 2);
      } catch (e) {
        this.rawConfig = '{}';
      }
    },

    // Scan Repositories
    async scanRepositories() {
      if (this.scanDir && !Validator.isValidPath(this.scanDir)) {
        this.error = 'Invalid directory path';
        return;
      }

      try {
        const scanPath = this.scanDir || this.getDefaultScanDir();
        const result = await this.api(`/scan?dir=${encodeURIComponent(scanPath)}&depth=2`);
        this.repositories = result.repositories || [];

        this.repositories = this.repositories.map(repo => ({
          ...repo,
          name: Sanitizer.sanitize(repo.name || ''),
          path: repo.path,
          branch: Sanitizer.sanitize(repo.branch || '')
        }));

        await this.api('/state', {
          method: 'PUT',
          body: JSON.stringify({
            repositories: this.repositories,
            activeHooks: this.activeHooks,
            lastSync: new Date().toISOString()
          })
        });

        this.loadRecentCommits();
        this.pollStatus(); // Update stats after scan
        this.error = null;
      } catch (error) {
        console.error('Failed to scan repositories:', error);
        this.error = 'Failed to scan repositories';
      }
    },

    getDefaultScanDir() {
      const platform = navigator.platform.toLowerCase();
      if (platform.includes('win')) return 'C:\\Users';
      if (platform.includes('mac')) return '/Users';
      return '/home';
    },

    // Load Recent Commits
    async loadRecentCommits() {
      this.recentCommits = [];
      for (const repo of this.repositories.slice(0, 5)) {
        if (repo.recentCommits) {
          repo.recentCommits.forEach(commit => {
            const parsed = this.parseCommit(commit);
            if (parsed) {
              this.recentCommits.push({
                ...parsed,
                repo: Sanitizer.sanitize(repo.name)
              });
            }
          });
        }
      }
      this.recentCommits.sort((a, b) => new Date(b.time) - new Date(a.time));
      this.recentCommits = this.recentCommits.slice(0, 20);
    },

    // Parse Commit Message (Versioned Release Convention)
    parseCommit(message) {
      if (typeof message !== 'string') return null;

      // Versioned Release Pattern
      const match = message.match(/^(RELEASE|UPDATE|PATCH): ([A-Za-z0-9_ -]+) - (v[0-9]+\.[0-9]+\.[0-9]+)/);
      if (match) {
        return {
          type: match[1],
          project: Sanitizer.sanitize(match[2].trim()),
          version: match[3],
          hash: Sanitizer.sanitize(message.split(' ')[0]),
          time: new Date().toISOString()
        };
      }

      return {
        type: 'other',
        project: '',
        version: '',
        message: Sanitizer.sanitize(message),
        hash: Sanitizer.sanitize(message.split(' ')[0]),
        time: new Date().toISOString()
      };
    },

    // Has Hooks
    hasHooks(repoPath) {
      return this.activeHooks[repoPath] && Object.keys(this.activeHooks[repoPath]).length > 0;
    },

    // Toggle Hooks
    async toggleHooks(repo) {
      const repoPath = repo.path;
      if (!Validator.isValidPath(repoPath)) {
        this.error = 'Invalid repository path';
        return;
      }

      const hasHooks = this.hasHooks(repoPath);

      try {
        if (hasHooks) {
          await this.api('/repo/hooks/uninstall', {
            method: 'POST',
            body: JSON.stringify({ path: repoPath })
          });
          delete this.activeHooks[repoPath];
        } else {
          const result = await this.api('/repo/hooks/install', {
            method: 'POST',
            body: JSON.stringify({ path: repoPath })
          });
          this.activeHooks[repoPath] = {};
          result.hooks.forEach(h => {
            this.activeHooks[repoPath][h] = true;
          });
        }

        await this.api('/state', {
          method: 'PUT',
          body: JSON.stringify({
            repositories: this.repositories,
            activeHooks: this.activeHooks,
            lastSync: new Date().toISOString()
          })
        });

        this.error = null;
        this.pollStatus(); // Update stats after toggling hooks
        this.renderRepositories(); // Re-render cards to update hook status
      } catch (error) {
        console.error('Failed to toggle hooks:', error);
        this.error = 'Failed to toggle hooks';
      }
    },

    // View Repo
    async viewRepo(repo) {
      if (!Validator.isValidPath(repo.path)) {
        this.error = 'Invalid repository path';
        return;
      }

      try {
        const details = await this.api(`/repo?path=${encodeURIComponent(repo.path)}`);
        alert(`Repository: ${this.safeDisplay(repo.name)}\nBranch: ${this.safeDisplay(details.branch)}\nCommits: ${details.commits.length}`);
      } catch (error) {
        console.error('Failed to load repository details:', error);
        this.error = 'Failed to load repository details';
      }
    },

    // Load suggested versions
    async loadSuggestedVersions() {
      if (!this.selectedRepo || !Validator.isValidPath(this.selectedRepo)) return;

      try {
        this.suggestedVersions = await this.api(`/suggest/version?path=${encodeURIComponent(this.selectedRepo)}`);

        // Auto-fill if we have current version
        if (this.suggestedVersions && this.suggestedVersions.lastCommit) {
          this.commitForm.version = this.suggestedVersions.UPDATE;
        }
      } catch (error) {
        console.error('Failed to load suggested versions:', error);
      }
    },

    // Load last commit for amend
    async loadLastCommit() {
      if (!this.selectedRepo || !Validator.isValidPath(this.selectedRepo)) return;

      try {
        this.lastCommit = await this.api(`/repo/last-commit?path=${encodeURIComponent(this.selectedRepo)}`);

        // Pre-fill amend form
        if (this.lastCommit) {
          this.amendForm.message = this.lastCommit.message;
        }
      } catch (error) {
        console.error('Failed to load last commit:', error);
      }
    },

    // Open Commit Modal
    async openCommitModal() {
      await this.loadSuggestedVersions();
      this.showCommitModal = true;
    },

    // Open Amend Modal
    async openAmendModal() {
      await this.loadLastCommit();
      this.showAmendModal = true;
    },

    // Generate Commit Message (Versioned Release Convention)
    generateCommitMessage() {
      if (!Validator.isValidType(this.commitForm.type)) {
        throw new Error('Invalid commit type');
      }

      if (!Validator.isValidProjectName(this.commitForm.project)) {
        throw new Error('Invalid project name (1-50 alphanumeric characters)');
      }

      if (!Validator.isValidVersion(this.commitForm.version)) {
        throw new Error('Invalid version format (use vX.Y.Z)');
      }

      let message = `${this.commitForm.type}: ${this.commitForm.project} - ${this.commitForm.version}`;

      // Add description in body if provided
      if (this.commitForm.description) {
        message += `\n\n${Sanitizer.sanitize(this.commitForm.description)}`;
      }

      return message;
    },

    // Get suggested version for type
    getSuggestedVersion(type) {
      if (!this.suggestedVersions) return '';
      switch (type) {
        case 'RELEASE': return this.suggestedVersions.RELEASE;
        case 'UPDATE': return this.suggestedVersions.UPDATE;
        case 'PATCH': return this.suggestedVersions.PATCH;
        default: return '';
      }
    },

    // On type change, update suggested version
    onTypeChange() {
      this.commitForm.version = this.getSuggestedVersion(this.commitForm.type);
    },

    // Check if can commit
    get canCommit() {
      return this.selectedRepo &&
        Validator.isValidPath(this.selectedRepo) &&
        Validator.isValidType(this.commitForm.type) &&
        Validator.isValidProjectName(this.commitForm.project) &&
        Validator.isValidVersion(this.commitForm.version);
    },

    // Create Commit
    async createCommit() {
      if (!this.canCommit) {
        this.error = 'Please fill all required fields correctly';
        return;
      }

      try {
        const message = this.generateCommitMessage();

        await this.api('/repo/commit', {
          method: 'POST',
          body: JSON.stringify({
            path: this.selectedRepo,
            message: message
          })
        });

        this.showCommitModal = false;

        // Reset form
        this.commitForm = {
          type: 'UPDATE',
          project: this.config.projectName || '',
          version: '',
          description: ''
        };

        await this.scanRepositories();
        this.error = null;
      } catch (error) {
        console.error('Failed to create commit:', error);
        this.error = error.message || 'Failed to create commit';
      }
    },

    // Update stats after commit changes
    async updateStatsAfterCommit() {
      await this.pollStatus();
    },

    // Amend Commit
    async amendCommit() {
      if (!this.amendForm.message) {
        this.error = 'Message is required';
        return;
      }

      try {
        const result = await this.api('/repo/amend', {
          method: 'POST',
          body: JSON.stringify({
            path: this.selectedRepo,
            message: this.amendForm.message
          })
        });

        this.showAmendModal = false;

        // Reset form
        this.amendForm = {
          message: '',
          files: []
        };

        await this.scanRepositories();
        this.error = null;
      } catch (error) {
        console.error('Failed to amend commit:', error);
        this.error = error.message || 'Failed to amend commit';
      }
    },

    // Save Config
    async saveConfig() {
      try {
        try {
          const parsed = JSON.parse(this.rawConfig);
          if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Invalid config format');
          }
          this.config = Sanitizer.sanitizeObject(parsed);
        } catch (e) {
          this.error = 'Invalid JSON format in configuration';
          return;
        }

        await this.api('/config', {
          method: 'PUT',
          body: JSON.stringify(this.config)
        });

        this.error = null;
      } catch (error) {
        console.error('Failed to save config:', error);
        this.error = 'Failed to save configuration';
      }
    },

    // Save Conventions
    async saveConventions() {
      await this.saveConfig();
    },

    // Clear Error
    clearError() {
      this.error = null;
    },

    // Computed Properties
    get activeHooksCount() {
      return Object.values(this.activeHooks).reduce((count, hooks) => {
        return count + Object.keys(hooks).length;
      }, 0);
    },

    get totalCommits() {
      return this.repositories.reduce((total, repo) => {
        return total + (repo.recentCommits?.length || 0);
      }, 0);
    },

    get conventionCompliance() {
      let compliant = 0;
      let total = 0;

      this.recentCommits.forEach(commit => {
        total++;
        if (commit.type !== 'other') {
          compliant++;
        }
      });

      return total > 0 ? Math.round((compliant / total) * 100) : 0;
    },

    // Scan All Repositories (called by button)
    async scanAllRepos() {
      if (this.isScanning) return; // Prevent double-click

      try {
        this.isScanning = true;
        this.error = null;

        const result = await this.api('/scan');
        this.repositories = result.repositories || [];

        this.repositories = this.repositories.map(repo => ({
          ...repo,
          name: Sanitizer.sanitize(repo.name || ''),
          path: repo.path,
          branch: Sanitizer.sanitize(repo.branch || '')
        }));

        await this.api('/state', {
          method: 'PUT',
          body: JSON.stringify({
            repositories: this.repositories,
            activeHooks: this.activeHooks,
            lastSync: new Date().toISOString()
          })
        });

        this.hasLoadedState = true;
        this.loadRecentCommits();
        this.error = null;

        // Note: updateUIForState() is called via the watcher on repositories

        // Update stats after scan
        this.pollStatus();

        // Show toast
        if (typeof Toast !== 'undefined') {
          Toast.success(`Scanned ${this.repositories.length} repositories`);
        }
      } catch (error) {
        console.error('Failed to scan repositories:', error);
        this.error = 'Failed to scan repositories';
        if (typeof Toast !== 'undefined') {
          Toast.error('Failed to scan repositories');
        }
      } finally {
        this.isScanning = false;
      }
    },

    // Load Current Repository (called by button)
    async loadCurrentRepo() {
      if (this.isLoading) return; // Prevent double-click

      try {
        this.isLoading = true;
        this.error = null;

        // Get current working directory from server
        const cwdData = await this.api('/cwd');
        const cwd = cwdData.cwd;

        // Scan current directory
        const result = await this.api(`/scan?dir=${encodeURIComponent(cwd)}`);

        if (result.repositories && result.repositories.length > 0) {
          this.repositories = result.repositories.map(repo => ({
            ...repo,
            name: Sanitizer.sanitize(repo.name || ''),
            path: repo.path,
            branch: Sanitizer.sanitize(repo.branch || '')
          }));

          await this.api('/state', {
            method: 'PUT',
            body: JSON.stringify({
              repositories: this.repositories,
              activeHooks: this.activeHooks,
              lastSync: new Date().toISOString()
            })
          });

          this.hasLoadedState = true;
          this.error = null;
          // Note: updateUIForState() is called via the watcher on repositories
          this.pollStatus(); // Update stats after loading repo

          if (typeof Toast !== 'undefined') {
            Toast.success(`Loaded: ${this.repositories[0].name}`);
          }
        } else {
          if (typeof Toast !== 'undefined') {
            Toast.error('No git repository found in current directory');
          }
        }
      } catch (error) {
        console.error('Failed to load current repo:', error);
        this.error = 'Failed to load repository';
        if (typeof Toast !== 'undefined') {
          Toast.error('Failed to load repository');
        }
      } finally {
        this.isLoading = false;
      }
    }
  };
}

// Initialize Alpine
document.addEventListener('alpine:init', () => {
  Alpine.data('gitFlowApp', gitFlowApp);
});
