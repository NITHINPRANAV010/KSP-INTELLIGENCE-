/* =========================================================
   ADVANCED-SEARCH.JS — Enterprise Autocomplete Search Engine
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_search_history_vault';
  const SAVED_SEARCHES_KEY = 'ksp_saved_searches';

  const DEFAULT_HISTORY = [
    'Bengaluru Cybercrime',
    'Ravi Kumar M.',
    'CR-00001',
    'Vehicle Theft Ring'
  ];

  const DEFAULT_SAVED_SEARCHES = [
    { title: 'Bengaluru Active Cybercrime Cases', query: 'Bengaluru Urban Cybercrime Active' },
    { title: 'Wanted Offenders in Mysuru', query: 'Mysuru Wanted' },
    { title: 'Critical Narcotics Incidents', query: 'Narcotics critical' }
  ];

  /**
   * Smart Router — maps query keywords to the most relevant feature page
   * and prevents 404 errors by checking directory depth.
   */
  function getSmartTargetRoute(query) {
    const q = query.toLowerCase().trim();
    const path = window.location.pathname.toLowerCase();
    const inPages = path.includes('/pages/') || path.endsWith('/pages');
    const prefix = inPages ? '' : 'pages/';

    // 1. Offender / Suspect queries
    const offenderKeywords = ['offender', 'suspect', 'ravi', 'arjun', 'rafiq', 'suresh', 'priya', 'deepak', 'wanted', 'recidivism'];
    if (offenderKeywords.some(k => q.includes(k))) {
      return `${prefix}offenders.html?q=${encodeURIComponent(query)}`;
    }

    // 2. Report queries
    if (q.includes('report') || q.includes('brief') || q.includes('pdf') || q.includes('executive')) {
      return `${prefix}reports.html?q=${encodeURIComponent(query)}`;
    }

    // 3. Heatmap / Spatial Map queries
    if (q.includes('heatmap') || q.includes('heat map') || q.includes('spatial') || q.includes('cluster')) {
      return `${prefix}heatmap.html?q=${encodeURIComponent(query)}`;
    }

    // 4. Patrol Deployment queries
    if (q.includes('patrol') || q.includes('naka') || q.includes('deploy') || q.includes('checkpoint')) {
      return `${prefix}patrol.html?q=${encodeURIComponent(query)}`;
    }

    // 5. Analytics & Trend queries
    if (q.includes('analytics') || q.includes('chart') || q.includes('graph') || q.includes('trend') || q.includes('stats')) {
      return `${prefix}analytics.html?q=${encodeURIComponent(query)}`;
    }

    // 6. District Intelligence queries
    const districtKeywords = ['district', 'mysuru', 'belagavi', 'kalaburagi', 'hubballi', 'dharwad', 'udupi', 'tumakuru', 'davanagere'];
    if (districtKeywords.some(k => q.includes(k))) {
      return `${prefix}district.html?q=${encodeURIComponent(query)}`;
    }

    // Default: AI Investigation Workspace
    return `${prefix}investigation.html?q=${encodeURIComponent(query)}`;
  }

  const KSPAdvancedSearch = {
    history: [],
    savedSearches: [],
    isInitialized: false,

    init: function () {
      if (this.isInitialized) return;
      this.isInitialized = true;

      const cachedHistory = localStorage.getItem(STORAGE_KEY);
      if (cachedHistory) {
        try { this.history = JSON.parse(cachedHistory); } catch (e) { this.history = DEFAULT_HISTORY; }
      } else {
        this.history = DEFAULT_HISTORY;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
      }

      const cachedSaved = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (cachedSaved) {
        try { this.savedSearches = JSON.parse(cachedSaved); } catch (e) { this.savedSearches = DEFAULT_SAVED_SEARCHES; }
      } else {
        this.savedSearches = DEFAULT_SAVED_SEARCHES;
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(this.savedSearches));
      }

      this.renderSearchOverlay();
      this.bindSearchInputs();
    },

    saveHistory: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    },

    /**
     * Clear all search history entries completely.
     */
    clearSearchHistory: function () {
      this.history = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      if (window.showToast) {
        showToast('🗑️ Search history cleared successfully.', 'info');
      }
      const activeInput = document.querySelector('.topnav-search input:focus, #global-search:focus, #offender-search:focus') || document.querySelector('.topnav-search input, #global-search, #offender-search');
      if (activeInput) activeInput.value = '';
      this.refreshOverlayContent('');
    },

    /**
     * Add search keyword to history.
     */
    addHistory: function (query) {
      if (!query || query.trim() === '') return;
      const clean = query.trim();
      this.history = this.history.filter(h => h.toLowerCase() !== clean.toLowerCase());
      this.history.unshift(clean);
      if (this.history.length > 8) this.history.pop();
      this.saveHistory();

      if (window.KSPAudit) {
        KSPAudit.log('Search Executed', `User searched for: "${clean}"`, 'Success');
      }
    },

    saveSearchPreset: function (title, query) {
      this.savedSearches.push({ title, query });
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(this.savedSearches));
      if (window.showToast) {
        showToast('Search query saved successfully.', 'success');
      }
    },

    /**
     * Executes fuzzy search against entire database and returns filtered arrays.
     */
    queryDatabase: function (text) {
      const query = text.toLowerCase().trim();
      const incidents = (window.KSPDatabase && typeof KSPDatabase.getIncidents === 'function') ? KSPDatabase.getIncidents() : (window.KSPDatabase?.incidents || []);
      const offenders = (window.KSPDatabase && typeof KSPDatabase.getOffenders === 'function') ? KSPDatabase.getOffenders() : [];
      const reports = window.KSPReportGenerator ? [
        KSPReportGenerator.generate('executive'),
        KSPReportGenerator.generate('district'),
        KSPReportGenerator.generate('trend')
      ] : [];

      const matchedIncidents = incidents.filter(i => 
        (i.id && i.id.toLowerCase().includes(query)) ||
        (i.caseNumber && i.caseNumber.toLowerCase().includes(query)) ||
        (i.crimeType && i.crimeType.toLowerCase().includes(query)) ||
        (i.district && i.district.toLowerCase().includes(query)) ||
        (i.policeStation && i.policeStation.toLowerCase().includes(query)) ||
        (i.assignedOfficer && i.assignedOfficer.toLowerCase().includes(query)) ||
        (i.status && i.status.toLowerCase().includes(query)) ||
        (i.vehicleInfo && i.vehicleInfo.toLowerCase().includes(query)) ||
        (i.phoneNumber && i.phoneNumber.toLowerCase().includes(query)) ||
        (i.evidence && Array.isArray(i.evidence) && i.evidence.some(ev => ev.toLowerCase().includes(query)))
      ).slice(0, 5);

      const matchedOffenders = offenders.filter(o => 
        (o.id && o.id.toLowerCase().includes(query)) ||
        (o.name && o.name.toLowerCase().includes(query)) ||
        (o.district && o.district.toLowerCase().includes(query)) ||
        (o.crimes && Array.isArray(o.crimes) && o.crimes.some(c => c.toLowerCase().includes(query)))
      ).slice(0, 3);

      const matchedReports = reports.filter(r =>
        (r.title && r.title.toLowerCase().includes(query)) ||
        (r.reportId && r.reportId.toLowerCase().includes(query))
      ).slice(0, 2);

      return {
        incidents: matchedIncidents,
        offenders: matchedOffenders,
        reports: matchedReports
      };
    },

    /**
     * Binds keyboard shortcuts (Ctrl+K focus) and popup visibility triggers.
     */
    bindSearchInputs: function () {
      const searchInputs = document.querySelectorAll('.topnav-search input, #global-search, #offender-search');
      const overlay = document.getElementById('ksp-search-overlay');

      searchInputs.forEach(input => {
        const parent = input.parentNode;
        if (parent && parent.classList.contains('topnav-search') && !parent.querySelector('.search-clear-btn')) {
          const clearBtn = document.createElement('span');
          clearBtn.className = 'search-clear-btn';
          clearBtn.innerHTML = '&times;';
          clearBtn.title = 'Clear search input & history';
          clearBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;color:#ef4444;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:50%;width:18px;height:18px;display:none;align-items:center;justify-content:center;font-size:0.75rem;font-weight:bold;z-index:10';
          clearBtn.onclick = (e) => {
            e.stopPropagation();
            input.value = '';
            clearBtn.style.display = 'none';
            this.refreshOverlayContent('');
            input.focus();
          };
          parent.style.position = 'relative';
          parent.appendChild(clearBtn);

          input.addEventListener('input', () => {
            clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
          });
        }

        const positionOverlay = () => {
          if (!overlay) return;
          const rect = input.getBoundingClientRect();
          overlay.style.position = 'fixed';
          overlay.style.top = (rect.bottom + 6) + 'px';
          overlay.style.left = rect.left + 'px';
          overlay.style.width = Math.max(440, rect.width) + 'px';
        };

        input.addEventListener('focus', () => {
          if (overlay) {
            positionOverlay();
            overlay.style.display = 'block';
            this.refreshOverlayContent(input.value);
          }
        });

        input.addEventListener('input', () => {
          if (overlay) {
            positionOverlay();
            overlay.style.display = 'block';
            this.refreshOverlayContent(input.value);
          }
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            input.value = '';
            if (overlay) overlay.style.display = 'none';
            input.blur();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const query = input.value.trim();
            if (query !== '') {
              this.addHistory(query);
              const targetUrl = getSmartTargetRoute(query);
              window.location.href = targetUrl;
            }
          }
        });
      });

      // Close when clicking away
      document.addEventListener('click', (e) => {
        if (overlay && !overlay.contains(e.target) && !e.target.closest('.topnav-search')) {
          overlay.style.display = 'none';
        }
      });

      // Ctrl + K keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          const firstInput = document.querySelector('.topnav-search input, #global-search, #offender-search');
          if (firstInput) firstInput.focus();
        }
      });
    },

    /**
     * Renders autocomplete/results overlay.
     */
    renderSearchOverlay: function () {
      let overlay = document.getElementById('ksp-search-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ksp-search-overlay';
        overlay.style.cssText = `
          position: fixed; top: 60px; left: 240px;
          background: #0f172a; border: 1px solid rgba(59,130,246,0.35);
          border-radius: 8px; box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          width: 480px; max-height: 460px; z-index: 99999; display: none;
          font-family: system-ui, -apple-system, sans-serif; overflow-y: auto; padding: 14px;
        `;
        document.body.appendChild(overlay);
      }
    },

    refreshOverlayContent: function (val) {
      const overlay = document.getElementById('ksp-search-overlay');
      if (!overlay) return;

      const query = val.trim();
      const inPages = window.location.pathname.toLowerCase().includes('/pages/') || window.location.pathname.toLowerCase().endsWith('/pages');
      const prefix = inPages ? '' : 'pages/';

      if (query.length === 0) {
        // Render Recent and Saved presets with ALWAYS VISIBLE Clear History button
        let html = `
          <div style="margin-bottom:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08)">
              <span style="font-weight:700;color:#94a3b8;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em">Recent Search History</span>
              <button onclick="window.KSPAdvancedSearch.clearSearchHistory()" style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:#ef4444;font-size:0.68rem;font-weight:700;padding:3px 10px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
                🗑️ Clear Search History
              </button>
            </div>
            ${this.history.length === 0 ? '<div style="color:#64748b;font-size:0.75rem;font-style:italic;padding:4px 0">Search history is empty.</div>' : ''}
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${this.history.map(h => `<button class="chip" onclick="window.KSPAdvancedSearch.setSearchValue('${h.replace(/'/g, "\\'")}')" style="cursor:pointer;background:rgba(255,255,255,0.05);font-size:0.72rem;color:#f8fafc;border:1px solid rgba(255,255,255,0.12);padding:4px 10px;border-radius:4px">${h}</button>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-weight:700;color:#94a3b8;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Saved Queries</div>
            ${this.savedSearches.map(s => `
              <div style="padding:7px 10px;cursor:pointer;border-radius:4px;display:flex;align-items:center;background:rgba(59,130,246,0.05);margin-bottom:4px;border:1px solid rgba(59,130,246,0.15)" onclick="window.KSPAdvancedSearch.setSearchValue('${s.query.replace(/'/g, "\\'")}')">
                <span style="font-weight:600;color:#f8fafc;font-size:0.75rem">${s.title}</span>
                <span style="margin-left:auto;color:#94a3b8;font-size:0.7rem">${s.query}</span>
              </div>
            `).join('')}
          </div>
        `;
        overlay.innerHTML = html;
        return;
      }

      // Render autocomplete results with Clear History button in top header
      const res = this.queryDatabase(query);
      const totalMatches = res.incidents.length + res.offenders.length + res.reports.length;

      if (totalMatches === 0) {
        overlay.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">
            <span style="font-size:0.75rem;color:#94a3b8">No results matched "${query.replace(/</g,'&lt;')}"</span>
            <button onclick="window.KSPAdvancedSearch.clearSearchHistory()" style="background:none;border:none;color:#ef4444;font-size:0.65rem;font-weight:700;cursor:pointer">🗑️ Clear History</button>
          </div>`;
        return;
      }

      let html = `<div style="display:flex;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px">
        <span style="font-weight:700;color:#f8fafc;font-size:0.8rem">Search Results</span>
        <button onclick="window.KSPAdvancedSearch.clearSearchHistory()" style="background:none;border:none;color:#ef4444;font-size:0.65rem;font-weight:700;cursor:pointer;margin-left:auto;margin-right:12px">🗑️ Clear History</button>
        <button onclick="window.KSPAdvancedSearch.saveQueryPreset('${query.replace(/'/g, "\\'")}')" style="background:none;border:none;color:#3b82f6;font-size:0.65rem;font-weight:700;cursor:pointer">+ Save query</button>
      </div>`;

      if (res.offenders.length > 0) {
        html += `<div style="margin-bottom:10px">
          <div style="font-weight:700;color:#94a3b8;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">Repeat Offenders</div>`;
        res.offenders.forEach(o => {
          html += `
            <a href="${prefix}offenders.html?q=${encodeURIComponent(o.name)}" style="text-decoration:none;display:flex;align-items:center;padding:6px 8px;border-radius:4px;background:rgba(255,255,255,0.02);margin-bottom:3px">
              <span style="font-weight:600;color:#f8fafc;font-size:0.75rem">${o.name}</span>
              <span style="margin-left:8px;font-size:0.65rem;color:#94a3b8;background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:2px">${o.id}</span>
              <span style="margin-left:auto;color:#94a3b8;font-size:0.7rem">${o.district}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      if (res.incidents.length > 0) {
        html += `<div style="margin-bottom:10px">
          <div style="font-weight:700;color:#94a3b8;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">Cases & Incidents</div>`;
        res.incidents.forEach(i => {
          html += `
            <a href="${prefix}investigation.html?q=${encodeURIComponent(i.id)}" style="text-decoration:none;display:flex;align-items:center;padding:6px 8px;border-radius:4px;background:rgba(255,255,255,0.02);margin-bottom:3px">
              <span style="font-weight:600;color:#3b82f6;font-size:0.75rem;font-family:monospace">${i.id}</span>
              <span style="margin-left:8px;font-weight:600;color:#f8fafc;font-size:0.75rem">${i.crimeType}</span>
              <span style="margin-left:auto;color:#94a3b8;font-size:0.7rem">${i.policeStation}, ${i.district}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      if (res.reports.length > 0) {
        html += `<div style="margin-bottom:6px">
          <div style="font-weight:700;color:#94a3b8;font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">AI Reports</div>`;
        res.reports.forEach(r => {
          html += `
            <a href="${prefix}reports.html?type=${r.type}" style="text-decoration:none;display:flex;align-items:center;padding:6px 8px;border-radius:4px;background:rgba(255,255,255,0.02);margin-bottom:3px">
              <span style="font-weight:600;color:#f8fafc;font-size:0.75rem">${r.title}</span>
              <span style="margin-left:auto;color:#94a3b8;font-size:0.7rem">${r.reportId}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      overlay.innerHTML = html;
    },

    setSearchValue: function (text) {
      const inputs = document.querySelectorAll('.topnav-search input, #global-search, #offender-search');
      inputs.forEach(i => {
        i.value = text;
        const clearBtn = i.parentNode?.querySelector('.search-clear-btn');
        if (clearBtn) clearBtn.style.display = text ? 'flex' : 'none';
      });
      this.refreshOverlayContent(text);
    },

    saveQueryPreset: function (query) {
      const title = prompt('Enter a descriptive title for this query preset:', `Query: ${query}`);
      if (title) {
        this.saveSearchPreset(title, query);
        this.refreshOverlayContent(query);
      }
    }
  };

  window.KSPAdvancedSearch = KSPAdvancedSearch;

  // Immediate Initialization (Works even when dynamically injected after DOMContentLoaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KSPAdvancedSearch.init());
  } else {
    KSPAdvancedSearch.init();
  }

})();
