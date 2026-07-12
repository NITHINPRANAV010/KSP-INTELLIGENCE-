/* =========================================================
   AUTH.JS — Role-Based Access Control (RBAC) System
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  // Predefined Roles and Permission mapping
  const ROLE_PERMISSIONS = {
    'Super Administrator': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
      'VIEW_NETWORK', 'VIEW_OFFENDERS', 'VIEW_PREDICTION', 'VIEW_PATROL',
      'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS', 'DISMISS_ALERTS',
      'VIEW_SETTINGS', 'EDIT_SETTINGS', 'EDIT_DATABASE', 'CASE_CREATE',
      'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_UPLOAD', 'EVIDENCE_VIEW',
      'VIEW_SYSTEM_HEALTH', 'VIEW_AUDIT_LOGS'
    ],
    'State Police Commissioner': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
      'VIEW_NETWORK', 'VIEW_OFFENDERS', 'VIEW_PREDICTION', 'VIEW_PATROL',
      'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS', 'DISMISS_ALERTS',
      'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW', 'VIEW_SYSTEM_HEALTH'
    ],
    'SCRB Officer': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
      'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS',
      'CASE_CREATE', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW'
    ],
    'District SP': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
      'VIEW_PREDICTION', 'VIEW_PATROL', 'VIEW_REPORTS', 'EXPORT_REPORTS',
      'VIEW_ALERTS', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW'
    ],
    'Circle Inspector': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
      'VIEW_PREDICTION', 'VIEW_PATROL', 'VIEW_ALERTS',
      'CASE_CREATE', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_UPLOAD', 'EVIDENCE_VIEW'
    ],
    'Investigation Officer': [
      'VIEW_DASHBOARD', 'VIEW_MAP', 'VIEW_ALERTS',
      'CASE_UPDATE', 'EVIDENCE_UPLOAD', 'EVIDENCE_VIEW'
    ],
    'Intelligence Analyst': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
      'VIEW_NETWORK', 'VIEW_OFFENDERS', 'VIEW_PREDICTION',
      'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS'
    ],
    'Crime Analyst': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
      'VIEW_PREDICTION', 'VIEW_REPORTS', 'EXPORT_REPORTS'
    ],
    'Read Only Auditor': [
      'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
      'VIEW_REPORTS', 'EVIDENCE_VIEW'
    ]
  };

  const ROLES = Object.keys(ROLE_PERMISSIONS);

  // Fallback storage key
  const AUTH_STORAGE_KEY = 'ksp_current_auth';

  const KSPAuth = {
    currentUser: null,

    /**
     * Initialize Auth system. Loads session or default role.
     */
    init: function () {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          this.currentUser = JSON.parse(cached);
        } catch (e) {
          this.currentUser = this.getDefaultUser();
        }
      } else {
        this.currentUser = this.getDefaultUser();
      }

      this.applyRBAC();
      this.renderRoleIndicator();
    },

    getDefaultUser: function () {
      return {
        username: 'sgupta_ksp',
        name: 'Sanjay Gupta',
        badge: 'DCP-9812',
        role: 'Super Administrator',
        district: 'Bengaluru Urban'
      };
    },

    /**
     * Returns true if user has the specified permission.
     */
    hasPermission: function (permission) {
      if (!this.currentUser) return false;
      const userPermissions = ROLE_PERMISSIONS[this.currentUser.role] || [];
      return userPermissions.includes(permission);
    },

    /**
     * Change current user's role.
     */
    switchRole: function (roleName) {
      if (!ROLES.includes(roleName)) return;
      this.currentUser.role = roleName;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));

      // Trigger audit log entry
      if (window.KSPAudit) {
        KSPAudit.log('Role Switched', `User switched active role to: ${roleName}`, 'Success');
      }

      // Dispatch event to redraw page components
      window.dispatchEvent(new CustomEvent('ksp_auth_changed', { detail: this.currentUser }));

      // Reload page to re-render all elements matching current permissions
      window.location.reload();
    },

    /**
     * Scans DOM for elements requiring permissions and handles hide/disable logic.
     */
    applyRBAC: function () {
      const elements = document.querySelectorAll('[data-permission]');
      elements.forEach(el => {
        const required = el.getAttribute('data-permission');
        if (!this.hasPermission(required)) {
          const action = el.getAttribute('data-rbac-action') || 'hide';
          if (action === 'disable') {
            el.setAttribute('disabled', 'true');
            el.classList.add('disabled-rbac');
            el.style.opacity = '0.5';
            el.style.pointerEvents = 'none';
            el.title = `Access Denied: Requires ${required} permission.`;
          } else {
            el.style.display = 'none';
          }
        }
      });

      // RBAC for side navigation items depending on current active role
      const navMapping = {
        'index.html': 'VIEW_DASHBOARD',
        'investigation.html': 'VIEW_NETWORK',
        'heatmap.html': 'VIEW_MAP',
        'analytics.html': 'VIEW_ANALYTICS',
        'timeline.html': 'VIEW_TIMELINE',
        'network.html': 'VIEW_NETWORK',
        'offenders.html': 'VIEW_OFFENDERS',
        'predictive.html': 'VIEW_PREDICTION',
        'patrol.html': 'VIEW_PATROL',
        'reports.html': 'VIEW_REPORTS',
        'alerts.html': 'VIEW_ALERTS',
        'settings.html': 'VIEW_SETTINGS'
      };

      document.querySelectorAll('.sidebar-nav a.nav-item').forEach(el => {
        const href = el.getAttribute('href') || '';
        const page = href.split('/').pop() || 'index.html';
        const requiredPerm = navMapping[page];
        if (requiredPerm && !this.hasPermission(requiredPerm)) {
          el.style.display = 'none';
        }
      });
    },

    /**
     * Renders a interactive, premium Role Selection selector in the top navbar profile card.
     */
    renderRoleIndicator: function () {
      const profileContainer = document.querySelector('.topnav-profile');
      if (!profileContainer) return;

      // Remove existing role label
      const subLabel = profileContainer.querySelector('.profile-rank');
      if (subLabel) {
        subLabel.textContent = `${this.currentUser.badge} · ${this.currentUser.role}`;
      }

      // Add a hidden role changer popup dropdown menu
      let dropdown = document.getElementById('ksp-role-dropdown');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'ksp-role-dropdown';
        dropdown.style.cssText = `
          position: absolute; top: var(--topnav-height); right: 24px;
          background: var(--card-bg); border: 1px solid var(--border-accent);
          border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
          padding: 8px 0; z-index: 9999; display: none; width: 220px;
          font-family: var(--font-sans); font-size: 0.75rem;
        `;

        let html = '<div style="padding:4px 12px;font-weight:700;color:var(--text-muted);border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px">Select active Command Role</div>';
        ROLES.forEach(r => {
          const isSelected = r === this.currentUser.role;
          html += `
            <div class="ksp-role-option" style="
              padding: 8px 16px; cursor: pointer; display: flex; align-items: center;
              color: ${isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)'};
              font-weight: ${isSelected ? '700' : 'normal'};
              background: ${isSelected ? 'rgba(59,130,246,0.08)' : 'transparent'};
            " onclick="window.KSPAuth.switchRole('${r}')">
              <span>${r}</span>
              ${isSelected ? '<span style="margin-left:auto">✓</span>' : ''}
            </div>
          `;
        });
        dropdown.innerHTML = html;
        document.body.appendChild(dropdown);

        // Bind toggle trigger
        profileContainer.style.cursor = 'pointer';
        profileContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          const disp = dropdown.style.display;
          dropdown.style.display = disp === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
          dropdown.style.display = 'none';
        });
      }
    }
  };

  window.KSPAuth = KSPAuth;

  // Run automatically on load
  document.addEventListener('DOMContentLoaded', () => {
    KSPAuth.init();
  });

})();
