/**
 * Aureus - Toast Notification System
 * Replaces alert() with non-blocking, accessible notifications
 */

const Toast = {
  CONTAINER_ID: 'toast-container',
  container: null,
  toasts: [],

  init() {
    // Create container if it doesn't exist
    if (!document.getElementById(this.CONTAINER_ID)) {
      this.container = document.createElement('div');
      this.container.id = this.CONTAINER_ID;
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById(this.CONTAINER_ID);
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();

    // Sanitize message
    const sanitizedMessage = this.sanitize(message);

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = sanitizedMessage;

    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  },

  dismiss(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300); // Match animation duration
  },

  sanitize(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  },

  error(message, duration) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};
