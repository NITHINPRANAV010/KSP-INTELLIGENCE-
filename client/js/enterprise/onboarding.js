/* =========================================================
   ONBOARDING.JS — Help Documentation & Shortcuts System
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const KSPHelp = {
    init: function () {
      this.bindShortcuts();
      this.renderHelpButton();
    },

    bindShortcuts: function () {
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+H : Help overlay
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
          e.preventDefault();
          this.toggleHelpModal();
        }

        // Ctrl+Shift+U : Toggle Role changer dropdown
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'u') {
          e.preventDefault();
          const dropdown = document.getElementById('ksp-role-dropdown');
          if (dropdown) {
            const disp = dropdown.style.display;
            dropdown.style.display = disp === 'block' ? 'none' : 'block';
          }
        }
      });
    },

    renderHelpButton: function () {
      const topnavActions = document.querySelector('.topnav-actions');
      if (!topnavActions) return;

      const helpBtn = document.createElement('button');
      helpBtn.className = 'topnav-btn';
      helpBtn.setAttribute('data-tooltip', 'Help & Keyboard Shortcuts (Ctrl+Shift+H)');
      helpBtn.innerHTML = '<i data-lucide="help-circle" style="width:16px;height:16px"></i>';
      
      topnavActions.insertBefore(helpBtn, topnavActions.firstChild);
      if (window.lucide) lucide.createIcons({ nodes: [topnavActions] });

      helpBtn.addEventListener('click', () => {
        this.toggleHelpModal();
      });
    },

    toggleHelpModal: function () {
      let modal = document.getElementById('ksp-help-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ksp-help-modal';
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); z-index: 99999; display: flex;
          align-items: center; justify-content: center;
          font-family: var(--font-sans); padding: 24px;
        `;

        modal.innerHTML = `
          <div style="background:var(--card-bg); border: 1px solid var(--border-accent); border-radius:var(--radius-lg); width:580px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--shadow-xl);">
            <div style="padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; background:rgba(255,255,255,0.01)">
              <span style="font-weight:700; color:var(--text-primary); font-size:1rem; display:flex; align-items:center; gap:6px">
                <i data-lucide="help-circle" style="width:18px;height:18px;color:var(--accent-blue)"></i> Help Center & System Documentation
              </span>
              <button id="ksp-help-close" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer;margin-left:auto">&times;</button>
            </div>
            
            <div style="padding:20px; overflow-y:auto; flex:1; font-size:0.8rem; line-height:1.6; color:var(--text-secondary)">
              <h3 style="margin-top:0;color:var(--text-primary)">⌨️ Keyboard Command Shortcuts</h3>
              <div style="display:grid; grid-template-columns:140px 1fr; gap:8px; background:rgba(255,255,255,0.02); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border); margin-bottom:16px">
                <div><kbd style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:3px;font-family:monospace">Ctrl + K</kbd></div>
                <div>Focus Global Enterprise Search bar</div>
                
                <div><kbd style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:3px;font-family:monospace">Ctrl + Shift + A</kbd></div>
                <div>Toggle interactive AI Copilot helper</div>

                <div><kbd style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:3px;font-family:monospace">Ctrl + Shift + H</kbd></div>
                <div>Toggle this System Documentation Panel</div>

                <div><kbd style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:3px;font-family:monospace">Ctrl + Shift + U</kbd></div>
                <div>Toggle Navbar Role-Based Access Control dropdown</div>
              </div>

              <h3 style="color:var(--text-primary)">👮 Role Permissions (RBAC)</h3>
              <p>Verify accessibility guidelines inside settings. Switch user roles using the Profile menu at the top-right. Super Admin has access to system logs, while analysts focus on predictions, and auditors view read-only profiles.</p>

              <h3 style="color:var(--text-primary)">📊 Dynamic Heatmap Boundaries</h3>
              <p>Inside the Heatmap page, use the <strong>Boundaries</strong> tab to draw convex hull polygons representing localized emerging hotspots computed by the AI cluster engine.</p>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Bind close
        document.getElementById('ksp-help-close')?.addEventListener('click', () => {
          modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.style.display = 'none';
        });

        if (window.lucide) lucide.createIcons({ nodes: [modal] });
      }

      modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
  };

  window.KSPHelp = KSPHelp;

  document.addEventListener('DOMContentLoaded', () => {
    KSPHelp.init();
  });

})();
