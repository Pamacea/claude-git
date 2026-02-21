/**
 * Aureus v0.8.1 - Premium UI Features
 * Theme Toggle, Sidebar Management, Status API Integration
 */

// ============================================================================
// THEME MANAGER
// ============================================================================

const ThemeManager = {
  STORAGE_KEY: 'aureus-theme',

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

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

    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
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
  backdropHandler: null,
  keydownHandler: null,

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

    this.backdropHandler = (e) => {
      const sidebar = document.getElementById('sidebar');
      const settingsBtn = document.getElementById('settingsBtn');
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && settingsBtn && !settingsBtn.contains(e.target)) {
          this.close();
        }
      }
    };
    document.addEventListener('click', this.backdropHandler);

    this.keydownHandler = (e) => {
      const sidebar = document.getElementById('sidebar');
      if (e.key === 'Escape' &&
          sidebar &&
          sidebar.classList.contains('open') &&
          !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
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

  destroy() {
    if (this.backdropHandler) {
      document.removeEventListener('click', this.backdropHandler);
      this.backdropHandler = null;
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }
};

// ============================================================================
// STATUS MANAGER
// ============================================================================

const StatusManager = {
  statusCheckInterval: null,
  CHECK_INTERVAL: 30000,

  async init() {
    await this.checkStatus();

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
    const statusBadge = document.getElementById('statusBadge');
    if (!statusBadge) return;

    const statusText = statusBadge.querySelector('.status-text');
    if (!statusText) return;

    if (status === 'online') {
      statusBadge.classList.add('online');
      statusBadge.classList.remove('offline');
      statusText.textContent = 'Online';
    } else {
      statusBadge.classList.add('offline');
      statusBadge.classList.remove('online');
      statusText.textContent = 'Offline';
    }
  },

  updateStatistics(stats) {
    const updateElement = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    updateElement('repoCount', stats.repositories || 0);
    updateElement('hooksCount', stats.hooksInstalled || 0);

    const uptime = stats.uptime || 0;
    updateElement('uptimeValue', this.formatUptime(uptime));

    updateElement('statTotalRepos', stats.repositories || 0);
    updateElement('statTotalHooks', stats.hooksInstalled || 0);
    updateElement('statCompliance', '0%');
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
// GLOBAL FUNCTIONS
// ============================================================================

async function saveConfig() {
  try {
    const projectNameInput = document.getElementById('configProjectName');
    const commitTypeInput = document.getElementById('configCommitType');

    const projectName = Sanitizer.sanitize(projectNameInput?.value || '');
    const commitType = Sanitizer.sanitize(commitTypeInput?.value || 'PATCH');

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
      Toast.success('Configuration saved successfully!');
      SidebarManager.close();
    } else {
      Toast.error('Failed to save configuration');
    }
  } catch (error) {
    console.error('Save config error:', error);
    Toast.error('Error saving configuration');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  SidebarManager.init();
  StatusManager.init();
});

window.addEventListener('beforeunload', () => {
  StatusManager.destroy();
  SidebarManager.destroy();
});
