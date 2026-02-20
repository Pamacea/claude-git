/**
 * Git Flow Master v0.7.0 - Premium UI Features
 * Theme Toggle, Sidebar Management, Status API Integration
 */

// ============================================================================
// THEME MANAGER
// ============================================================================

const ThemeManager = {
  STORAGE_KEY: 'git-flow-master-theme',

  init() {
    // Load saved theme or use system preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Setup toggle button
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
  },

  toggle() {
    const current = this.getTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);

    // Update icons
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  },

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
};

// ============================================================================
// SIDEBAR MANAGER
// ============================================================================

const SidebarManager = {
  init() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.open());
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => this.close());
    }

    // Close on backdrop click
    document.addEventListener('click', (e) => {
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !settingsBtn.contains(e.target)) {
          this.close();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
        this.close();
      }
    });
  },

  open() {
    const sidebar = document.getElementById('sidebar');
    const settingsBtn = document.getElementById('settingsBtn');

    if (sidebar) sidebar.classList.add('open');
    if (settingsBtn) settingsBtn.classList.add('active');
  },

  close() {
    const sidebar = document.getElementById('sidebar');
    const settingsBtn = document.getElementById('settingsBtn');

    if (sidebar) sidebar.classList.remove('open');
    if (settingsBtn) settingsBtn.classList.remove('active');
  },

  toggle() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }
};

// ============================================================================
// STATUS MANAGER
// ============================================================================

const StatusManager = {
  statusCheckInterval: null,
  CHECK_INTERVAL: 30000, // 30 seconds

  async init() {
    // Initial status check
    await this.checkStatus();

    // Setup auto-refresh
    this.statusCheckInterval = setInterval(() => {
      this.checkStatus();
    }, this.CHECK_INTERVAL);
  },

  async checkStatus() {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const data = await response.json();

      this.updateStatusIndicator(data.status);
      this.updateStatistics(data.statistics || {});
    } catch (error) {
      console.error('Status check failed:', error);
      this.updateStatusIndicator('offline');
    }
  },

  updateStatusIndicator(status) {
    const statusDot = document.getElementById('statusDot');

    if (!statusDot) return;

    if (status === 'online') {
      statusDot.classList.add('connected');
    } else {
      statusDot.classList.remove('connected');
    }
  },

  updateStatistics(stats) {
    // Update stat cards
    const updateElement = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    updateElement('repoCount', stats.repositories || 0);
    updateElement('hooksCount', stats.hooksInstalled || 0);
    updateElement('commitsCount', stats.recentCommits || 0);

    // Format uptime
    const uptime = stats.uptime || 0;
    updateElement('uptimeValue', this.formatUptime(uptime));

    // Update sidebar stats
    updateElement('statTotalRepos', stats.repositories || 0);
    updateElement('statTotalHooks', stats.hooksInstalled || 0);
    updateElement('statCompliance', '0%'); // Will be calculated later
  },

  formatUptime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  },

  destroy() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }
};

// ============================================================================
// GLOBAL FUNCTIONS (for HTML onclick handlers)
// ============================================================================

// Quick Actions
async function scanAllRepos() {
  try {
    const response = await fetch(`${API_BASE}/scan-repos`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      alert(`Scanned ${data.count} repositories successfully!`);
      // Refresh state after scan
      if (typeof refreshState === 'function') {
        await refreshState();
      }
    } else {
      alert('Failed to scan repositories');
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('Error scanning repositories');
  }
}

async function loadCurrentRepo() {
  try {
    const response = await fetch(`${API_BASE}/load-current-repo`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      alert(`Loaded repository: ${data.repo}`);
      if (typeof refreshState === 'function') {
        await refreshState();
      }
    } else {
      alert(data.error || 'Failed to load repository');
    }
  } catch (error) {
    console.error('Load repo error:', error);
    alert('Error loading repository');
  }
}

async function refreshState() {
  try {
    // Trigger Alpine data refresh
    if (window.Alpine) {
      const app = Alpine.store('gitFlowApp');
      if (app && typeof app.loadState === 'function') {
        await app.loadState();
      }
    }

    // Refresh status
    await StatusManager.checkStatus();
  } catch (error) {
    console.error('Refresh error:', error);
  }
}

async function saveConfig() {
  try {
    const projectName = document.getElementById('configProjectName')?.value;
    const commitType = document.getElementById('configCommitType')?.value;

    const response = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectName,
        defaultCommitType: commitType
      })
    });

    if (response.ok) {
      alert('Configuration saved successfully!');
      SidebarManager.close();
    } else {
      alert('Failed to save configuration');
    }
  } catch (error) {
    console.error('Save config error:', error);
    alert('Error saving configuration');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  ThemeManager.init();
  SidebarManager.init();
  StatusManager.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  StatusManager.destroy();
});
