/* =========================================================
   NOTIFICATIONS.JS — Live Intelligence Notification Engine
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_notifications_vault';

  const KSPNotifications = {
    _items: [],

    init: function () {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          this._items = JSON.parse(cached);
        } catch (e) {
          this._items = [];
        }
      } else {
        // Seed default initial notifications
        this._items = [
          {
            id: 'n_init_1',
            title: 'Critical Anomaly Detected',
            message: 'Vehicle theft spike in Majestic precinct exceeds 2.5σ baseline threshold.',
            category: 'anomaly',
            priority: 'critical',
            read: false,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          },
          {
            id: 'n_init_2',
            title: 'AI Prediction Generated',
            message: '7-day forecast for Bengaluru Urban compiled. R² fit score 88%.',
            category: 'prediction',
            priority: 'medium',
            read: false,
            timestamp: '10 min ago'
          },
          {
            id: 'n_init_3',
            title: 'New Case Assignment',
            message: 'You have been assigned as lead investigator on Case CR-7841.',
            category: 'case',
            priority: 'high',
            read: true,
            timestamp: '1 hr ago'
          }
        ];
        this.save();
      }

      this.updateNavbarBadge();
      this.bindAIBusEvents();
      this.renderNotificationCenter();
    },

    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
      this.updateNavbarBadge();
    },

    /**
     * Create and broadcast a new live notification.
     * @param {string} title
     * @param {string} message
     * @param {string} category - 'crime', 'anomaly', 'case', 'evidence', 'prediction', 'hotspot', 'report'
     * @param {string} priority - 'critical' | 'high' | 'medium' | 'low'
     */
    create: function (title, message, category = 'crime', priority = 'medium') {
      const item = {
        id: `notif_${Date.now()}`,
        title,
        message,
        category,
        priority,
        read: false,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      this._items.unshift(item);
      this.save();

      // Show native UI Toast (requires app.js window.showToast)
      if (window.showToast) {
        window.showToast(`${title} — ${message}`, priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : 'info', 5000);
      }

      // Refresh UI if notification center is open
      this.refreshNotificationDropdown();

      return item;
    },

    getNotifications: function () {
      return this._items;
    },

    markAllAsRead: function () {
      this._items.forEach(i => i.read = true);
      this.save();
      this.refreshNotificationDropdown();
    },

    markAsRead: function (id) {
      const item = this._items.find(i => i.id === id);
      if (item) {
        item.read = true;
        this.save();
        this.refreshNotificationDropdown();
      }
    },

    clearAll: function () {
      this._items = [];
      this.save();
      this.refreshNotificationDropdown();
    },

    updateNavbarBadge: function () {
      const unreadCount = this._items.filter(i => !i.read).length;
      const badges = document.querySelectorAll('.notif-badge, .nav-badge');
      badges.forEach(b => {
        b.textContent = unreadCount;
        b.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
      });
    },

    /**
     * Set up listeners on the central AI bus to trigger notifications on AI events.
     */
    bindAIBusEvents: function () {
      if (!window.KSPAIBus) return;

      KSPAIBus.on('anomaly:detected', (result) => {
        result.anomalies.slice(0, 2).forEach(a => {
          this.create(
            `AI Alert: ${a.type.toUpperCase()}`,
            a.description.replace(/\*\*/g, ''),
            'anomaly',
            a.severity === 'critical' ? 'critical' : 'high'
          );
        });
      });

      KSPAIBus.on('hotspot:emerging', (data) => {
        this.create(
          'Emerging Hotspot Warning',
          `${data.count} new criminal hotspots showing growth exceeding 30%.`,
          'hotspot',
          'high'
        );
      });

      KSPAIBus.on('report:ready', (data) => {
        this.create(
          'AI Report Compiled',
          `Format [${data.type.toUpperCase()}] report is ready for command review.`,
          'report',
          'medium'
        );
      });
    },

    /**
     * Renders a premium interactive notification dropdown menu.
     */
    renderNotificationCenter: function () {
      const trigger = document.getElementById('notif-btn') || document.querySelector('.topnav-btn');
      if (!trigger) return;

      let center = document.getElementById('ksp-notification-center');
      if (!center) {
        center = document.createElement('div');
        center.id = 'ksp-notification-center';
        center.style.cssText = `
          position: absolute; top: var(--topnav-height); right: 80px;
          background: var(--card-bg); border: 1px solid var(--border-accent);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
          width: 320px; z-index: 9999; display: none;
          max-height: 480px; display: none; flex-direction: column;
          font-family: var(--font-sans); overflow: hidden;
        `;

        const headerHtml = `
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; background: rgba(255,255,255,0.01)">
            <span style="font-weight: 700; color: var(--text-primary); font-size: 0.875rem">Alert Center</span>
            <button id="ksp-notif-read-all" style="background:none;border:none;color:var(--accent-blue);font-size:0.7rem;cursor:pointer;margin-left:auto;font-weight:600">Mark all read</button>
          </div>
          <div id="ksp-notif-list" style="overflow-y:auto; flex:1; max-height: 380px"></div>
          <div style="padding: 8px; border-top: 1px solid var(--border); text-align: center; background: rgba(255,255,255,0.01)">
            <button id="ksp-notif-clear-all" style="background:none;border:none;color:var(--text-muted);font-size:0.7rem;cursor:pointer">Clear all alerts</button>
          </div>
        `;
        center.innerHTML = headerHtml;
        document.body.appendChild(center);

        // Bind open click
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const disp = center.style.display;
          center.style.display = disp === 'flex' ? 'none' : 'flex';
          this.refreshNotificationDropdown();
        });

        document.addEventListener('click', () => {
          center.style.display = 'none';
        });

        center.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        document.getElementById('ksp-notif-read-all')?.addEventListener('click', () => this.markAllAsRead());
        document.getElementById('ksp-notif-clear-all')?.addEventListener('click', () => this.clearAll());
      }
    },

    refreshNotificationDropdown: function () {
      const container = document.getElementById('ksp-notif-list');
      if (!container) return;

      if (this._items.length === 0) {
        container.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem">
            No active alerts or tasks in queue.
          </div>
        `;
        return;
      }

      const priorityColors = {
        critical: 'var(--critical)',
        high: 'var(--warning)',
        medium: 'var(--accent-blue)',
        low: 'var(--success)'
      };

      container.innerHTML = this._items.map(item => `
        <div class="notif-item-row" style="
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
          background: ${item.read ? 'transparent' : 'rgba(59,130,246,0.03)'};
          cursor: pointer; display: flex; flex-direction: column; gap: 4px;
          transition: background 0.2s;
        " onclick="window.KSPNotifications.markAsRead('${item.id}')">
          <div style="display: flex; align-items: center; gap: 8px">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${priorityColors[item.priority] || 'var(--text-muted)'}"></span>
            <span style="font-weight: 600; color: ${item.read ? 'var(--text-secondary)' : 'var(--text-primary)'}; font-size: 0.8rem">${item.title}</span>
            <span style="margin-left: auto; color: var(--text-muted); font-size: 0.65rem">${item.timestamp}</span>
          </div>
          <div style="color: var(--text-secondary); font-size: 0.75rem; line-height: 1.4; padding-left: 14px">${item.message}</div>
        </div>
      `).join('');
    }
  };

  window.KSPNotifications = KSPNotifications;

  document.addEventListener('DOMContentLoaded', () => {
    KSPNotifications.init();
  });

})();
