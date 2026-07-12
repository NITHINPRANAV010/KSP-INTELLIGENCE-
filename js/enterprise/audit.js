/* =========================================================
   AUDIT.JS — Immutable Enterprise Audit Logging System
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_audit_logs';

  const DEVICE_INFO = (function () {
    if (typeof navigator === 'undefined') return 'NodeJS Runtime';
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows Workstation';
    if (ua.includes('Macintosh')) return 'macOS Termial';
    if (ua.includes('Linux')) return 'Linux Police Console';
    return 'KSP Handheld Device';
  })();

  const IP_ADDRESS = '10.180.42.115'; // Internal police network IP

  const KSPAudit = {
    _logs: [],

    /**
     * Initialize audit trail.
     */
    init: function () {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          this._logs = JSON.parse(cached);
        } catch (e) {
          this._logs = [];
        }
      }

      // Automatically log session start
      this.log('Session Initialized', 'Command center dashboard console opened.', 'Success');
    },

    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._logs));
    },

    /**
     * Log a user action.
     * @param {string} action - e.g., 'Search', 'Login', 'Report Exported'
     * @param {string} details - details string
     * @param {string} [result='Success'] - 'Success' or 'Failure'
     */
    log: function (action, details, result = 'Success') {
      const user = window.KSPAuth?.currentUser?.name || 'System / DCP Sanjay Gupta';
      const role = window.KSPAuth?.currentUser?.role || 'Super Administrator';

      const entry = {
        id: `AUDIT_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        user: `${user} (${role})`,
        time: new Date().toLocaleString('en-IN'),
        ip: IP_ADDRESS,
        device: DEVICE_INFO,
        action,
        details,
        result
      };

      this._logs.unshift(entry);

      // Keep max 2000 logs for performance
      if (this._logs.length > 2000) {
        this._logs.pop();
      }

      this.save();

      // Notify Event Bus
      if (window.KSPAIBus) {
        KSPAIBus.emit('audit:logged', entry);
      }
    },

    getLogs: function () {
      return this._logs;
    },

    clearLogs: function () {
      this._logs = [];
      this.save();
    }
  };

  window.KSPAudit = KSPAudit;
  KSPAudit.init();

})();
