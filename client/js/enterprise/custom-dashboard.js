/* =========================================================
   CUSTOM-DASHBOARD.JS — Grid Widgets Drag/Hide/Resize Manager
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_dashboard_layout_presets';

  const DEFAULT_LAYOUTS = {
    standard: {
      map: { width: '100%', height: '360px', order: 1, visible: true },
      charts: { width: '100%', height: 'auto', order: 2, visible: true },
      insights: { width: '100%', height: 'auto', order: 3, visible: true }
    },
    operational: {
      map: { width: '150%', height: '520px', order: 1, visible: true },
      charts: { width: '80%', height: 'auto', order: 3, visible: true },
      insights: { width: '100%', height: 'auto', order: 2, visible: true }
    },
    analytical: {
      map: { width: '70%', height: '300px', order: 3, visible: true },
      charts: { width: '150%', height: 'auto', order: 1, visible: true },
      insights: { width: '100%', height: 'auto', order: 2, visible: true }
    }
  };

  const KSPDashboardCustomizer = {
    currentLayoutName: 'standard',
    layoutState: {},

    init: function () {
      // Only run if on dashboard
      const isDashboard = document.getElementById('dashboard-map') || document.querySelector('.main-3col');
      if (!isDashboard) return;

      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          this.layoutState = JSON.parse(cached);
        } catch (e) {
          this.layoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUTS.standard));
        }
      } else {
        this.layoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUTS.standard));
      }

      this.renderControls();
      this.applyLayout();
    },

    save: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layoutState));
      if (window.KSPAudit) {
        KSPAudit.log('Dashboard Layout Saved', `Saved custom layout: ${this.currentLayoutName}`, 'Success');
      }
      if (window.showToast) {
        showToast('Dashboard layout saved successfully.', 'success');
      }
    },

    applyLayout: function () {
      const main3col = document.querySelector('.main-3col');
      if (!main3col) return;

      // Map columns depending on state widths
      const items = Array.from(main3col.children);
      if (items.length < 3) return;

      const [mapCard, chartCard, insightCard] = items;

      // Assign orders
      mapCard.style.order = this.layoutState.map.order;
      chartCard.style.order = this.layoutState.charts.order;
      insightCard.style.order = this.layoutState.insights.order;

      // Assign visibility
      mapCard.style.display = this.layoutState.map.visible ? 'flex' : 'none';
      chartCard.style.display = this.layoutState.charts.visible ? 'flex' : 'none';
      insightCard.style.display = this.layoutState.insights.visible ? 'flex' : 'none';

      // Re-trigger Leaflet map resize if size changed
      if (window.KSPMap && window.KSPMap.instance) {
        setTimeout(() => window.KSPMap.instance.invalidateSize(), 300);
      }

      // Re-trigger charts resize
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(c => {
        const chart = Chart.getChart(c);
        if (chart) {
          setTimeout(() => chart.resize(), 300);
        }
      });
    },

    loadPreset: function (presetName) {
      if (!DEFAULT_LAYOUTS[presetName]) return;
      this.currentLayoutName = presetName;
      this.layoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUTS[presetName]));
      this.applyLayout();
      this.save();
    },

    toggleWidget: function (widgetId) {
      if (!this.layoutState[widgetId]) return;
      this.layoutState[widgetId].visible = !this.layoutState[widgetId].visible;
      this.applyLayout();
      this.save();
    },

    /**
     * Renders a layout customize toolbar at the top of the dashboard main content.
     */
    renderControls: function () {
      const pageHeader = document.querySelector('.page-header');
      if (!pageHeader) return;

      let customizerBar = document.getElementById('ksp-customizer-bar');
      if (!customizerBar) {
        customizerBar = document.createElement('div');
        customizerBar.id = 'ksp-customizer-bar';
        customizerBar.style.cssText = `
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding: 8px 16px; background: rgba(59,130,246,0.04);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          margin-bottom: var(--space-lg); font-family: var(--font-sans);
          font-size: 0.75rem; color: var(--text-secondary);
        `;

        let html = `
          <div style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-primary)">
            <i data-lucide="layout" style="width:14px;height:14px;color:var(--accent-blue)"></i>
            <span>Console Layout:</span>
          </div>
          <button class="chip" onclick="window.KSPDashboardCustomizer.loadPreset('standard')" style="cursor:pointer;background:rgba(255,255,255,0.05)">Standard Preset</button>
          <button class="chip" onclick="window.KSPDashboardCustomizer.loadPreset('operational')" style="cursor:pointer;background:rgba(255,255,255,0.05)">Operational Focus</button>
          <button class="chip" onclick="window.KSPDashboardCustomizer.loadPreset('analytical')" style="cursor:pointer;background:rgba(255,255,255,0.05)">Analytic Focus</button>
          <div style="width:1px;height:14px;background:var(--border);margin:0 4px"></div>
          <div style="display:flex;align-items:center;gap:4px">
            <span style="color:var(--text-muted)">Toggle Widgets:</span>
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer;margin-left:4px">
              <input type="checkbox" id="ksp-chk-map" checked onclick="window.KSPDashboardCustomizer.toggleWidget('map')"> Map
            </label>
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer;margin-left:6px">
              <input type="checkbox" id="ksp-chk-charts" checked onclick="window.KSPDashboardCustomizer.toggleWidget('charts')"> Charts
            </label>
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer;margin-left:6px">
              <input type="checkbox" id="ksp-chk-insights" checked onclick="window.KSPDashboardCustomizer.toggleWidget('insights')"> AI Insights
            </label>
          </div>
        `;
        customizerBar.innerHTML = html;
        pageHeader.after(customizerBar);

        // Bind checkbox default states
        document.getElementById('ksp-chk-map').checked = this.layoutState.map.visible;
        document.getElementById('ksp-chk-charts').checked = this.layoutState.charts.visible;
        document.getElementById('ksp-chk-insights').checked = this.layoutState.insights.visible;

        if (window.lucide) lucide.createIcons({ nodes: [customizerBar] });
      }
    }
  };

  window.KSPDashboardCustomizer = KSPDashboardCustomizer;

  // Run automatically on load
  document.addEventListener('DOMContentLoaded', () => {
    KSPDashboardCustomizer.init();
  });

})();
