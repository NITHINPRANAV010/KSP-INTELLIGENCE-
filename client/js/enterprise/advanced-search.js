/* =========================================================
   ADVANCED-SEARCH.JS — Enterprise Autocomplete Search Engine
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'ksp_search_history_vault';
  const SAVED_SEARCHES_KEY = 'ksp_saved_searches';

  const DEFAULT_SAVED_SEARCHES = [
    { title: 'Bengaluru Active Cybercrime Cases', query: 'Bengaluru Urban Cybercrime Active' },
    { title: 'Wanted Offenders in Mysuru', query: 'Mysuru Wanted' },
    { title: 'Critical Narcotics Incidents', query: 'Narcotics critical' }
  ];

  const KSPAdvancedSearch = {
    history: [],
    savedSearches: [],

    init: function () {
      const cachedHistory = localStorage.getItem(STORAGE_KEY);
      if (cachedHistory) {
        try { this.history = JSON.parse(cachedHistory); } catch (e) { this.history = []; }
      }

      const cachedSaved = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (cachedSaved) {
        try { this.savedSearches = JSON.parse(cachedSaved); } catch (e) { this.savedSearches = DEFAULT_SAVED_SEARCHES; }
      } else {
        this.savedSearches = DEFAULT_SAVED_SEARCHES;
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(this.savedSearches));
      }

      this.bindSearchInputs();
      this.renderSearchOverlay();
    },

    saveHistory: function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
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
      const incidents = KSPDatabase.getIncidents();
      const offenders = KSPDatabase.getOffenders();
      const reports = window.KSPReportGenerator ? [
        KSPReportGenerator.generate('executive'),
        KSPReportGenerator.generate('district'),
        KSPReportGenerator.generate('trend')
      ] : [];

      const matchedIncidents = incidents.filter(i => 
        i.id.toLowerCase().includes(query) ||
        i.caseNumber.toLowerCase().includes(query) ||
        i.crimeType.toLowerCase().includes(query) ||
        i.district.toLowerCase().includes(query) ||
        i.policeStation.toLowerCase().includes(query) ||
        i.assignedOfficer.toLowerCase().includes(query) ||
        i.status.toLowerCase().includes(query) ||
        (i.vehicleInfo && i.vehicleInfo.toLowerCase().includes(query)) ||
        (i.phoneNumber && i.phoneNumber.toLowerCase().includes(query)) ||
        (i.evidence && i.evidence.some(ev => ev.toLowerCase().includes(query)))
      ).slice(0, 5);

      const matchedOffenders = offenders.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.name.toLowerCase().includes(query) ||
        o.district.toLowerCase().includes(query) ||
        o.crimes.some(c => c.toLowerCase().includes(query))
      ).slice(0, 3);

      const matchedReports = reports.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.reportId.toLowerCase().includes(query)
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
      const searchInputs = document.querySelectorAll('.topnav-search input, #global-search');
      const overlay = document.getElementById('ksp-search-overlay');

      searchInputs.forEach(input => {
        input.addEventListener('focus', () => {
          if (overlay) {
            overlay.style.display = 'block';
            this.refreshOverlayContent(input.value);
          }
        });

        input.addEventListener('input', () => {
          this.refreshOverlayContent(input.value);
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query !== '') {
              this.addHistory(query);
              // Navigate search query direct to investigation workspace
              window.location.href = `${window.location.pathname.includes('/pages/') ? '' : 'pages/'}investigation.html?q=${encodeURIComponent(query)}`;
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
          const firstInput = document.querySelector('.topnav-search input, #global-search');
          if (firstInput) firstInput.focus();
        }
      });
    },

    /**
     * Renders autocomplete/results overlay.
     */
    renderSearchOverlay: function () {
      const topNav = document.getElementById('topnav');
      if (!topNav) return;

      let overlay = document.getElementById('ksp-search-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ksp-search-overlay';
        overlay.style.cssText = `
          position: absolute; top: var(--topnav-height); left: 240px;
          background: var(--card-bg); border: 1px solid var(--border-accent);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
          width: 520px; max-height: 460px; z-index: 9999; display: none;
          font-family: var(--font-sans); overflow-y: auto; padding: 12px;
        `;
        document.body.appendChild(overlay);
      }
    },

    refreshOverlayContent: function (val) {
      const overlay = document.getElementById('ksp-search-overlay');
      if (!overlay) return;

      const query = val.trim();
      const relativePath = window.location.pathname.includes('/pages/') ? '' : 'pages/';

      if (query.length === 0) {
        // Render Recent and Saved presets
        let html = `
          <div style="margin-bottom:12px">
            <div style="font-weight:700;color:var(--text-muted);font-size:0.65rem;text-transform:uppercase;margin-bottom:6px">Recent Searches</div>
            ${this.history.length === 0 ? '<div style="color:var(--text-muted);font-size:0.75rem">No search history.</div>' : ''}
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${this.history.map(h => `<button class="chip" onclick="window.KSPAdvancedSearch.setSearchValue('${h}')" style="cursor:pointer;background:rgba(255,255,255,0.05);font-size:0.7rem">${h}</button>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-weight:700;color:var(--text-muted);font-size:0.65rem;text-transform:uppercase;margin-bottom:6px">Saved Queries</div>
            ${this.savedSearches.map(s => `
              <div style="padding:6px 8px;cursor:pointer;border-radius:var(--radius-sm);display:flex;align-items:center;background:rgba(59,130,246,0.03);margin-bottom:4px" onclick="window.KSPAdvancedSearch.setSearchValue('${s.query}')">
                <span style="font-weight:600;color:var(--text-primary);font-size:0.75rem">${s.title}</span>
                <span style="margin-left:auto;color:var(--text-muted);font-size:0.7rem">${s.query}</span>
              </div>
            `).join('')}
          </div>
        `;
        overlay.innerHTML = html;
        return;
      }

      // Render autocomplete results
      const res = this.queryDatabase(query);
      const totalMatches = res.incidents.length + res.offenders.length + res.reports.length;

      if (totalMatches === 0) {
        overlay.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.75rem">No results matched "${query}"</div>`;
        return;
      }

      let html = `<div style="display:flex;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.04);padding-bottom:4px">
        <span style="font-weight:700;color:var(--text-primary);font-size:0.8rem">Search Results</span>
        <button onclick="window.KSPAdvancedSearch.saveQueryPreset('${query}')" style="background:none;border:none;color:var(--accent-blue);font-size:0.65rem;font-weight:600;cursor:pointer;margin-left:auto">+ Save query</button>
      </div>`;

      if (res.offenders.length > 0) {
        html += `<div style="margin-bottom:10px">
          <div style="font-weight:700;color:var(--text-muted);font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">Repeat Offenders</div>`;
        res.offenders.forEach(o => {
          html += `
            <a href="${relativePath}offenders.html" style="text-decoration:none;display:flex;align-items:center;padding:6px;border-radius:4px;background:rgba(255,255,255,0.01);margin-bottom:3px">
              <span style="font-weight:600;color:var(--text-primary);font-size:0.75rem">${o.name}</span>
              <span style="margin-left:8px;font-size:0.65rem;color:var(--text-muted);background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:2px">${o.id}</span>
              <span style="margin-left:auto;color:var(--text-muted);font-size:0.7rem">${o.district}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      if (res.incidents.length > 0) {
        html += `<div style="margin-bottom:10px">
          <div style="font-weight:700;color:var(--text-muted);font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">Cases & Incidents</div>`;
        res.incidents.forEach(i => {
          html += `
            <a href="${relativePath}investigation.html?q=${i.id}" style="text-decoration:none;display:flex;align-items:center;padding:6px;border-radius:4px;background:rgba(255,255,255,0.01);margin-bottom:3px">
              <span style="font-weight:600;color:var(--accent-blue);font-size:0.75rem;font-family:monospace">${i.id}</span>
              <span style="margin-left:8px;font-weight:600;color:var(--text-primary);font-size:0.75rem">${i.crimeType}</span>
              <span style="margin-left:auto;color:var(--text-muted);font-size:0.7rem">${i.policeStation}, ${i.district}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      if (res.reports.length > 0) {
        html += `<div style="margin-bottom:6px">
          <div style="font-weight:700;color:var(--text-muted);font-size:0.65rem;text-transform:uppercase;margin-bottom:4px">AI Reports</div>`;
        res.reports.forEach(r => {
          html += `
            <a href="${relativePath}reports.html?type=${r.type}" style="text-decoration:none;display:flex;align-items:center;padding:6px;border-radius:4px;background:rgba(255,255,255,0.01);margin-bottom:3px">
              <span style="font-weight:600;color:var(--text-primary);font-size:0.75rem">${r.title}</span>
              <span style="margin-left:auto;color:var(--text-muted);font-size:0.7rem">${r.reportId}</span>
            </a>
          `;
        });
        html += `</div>`;
      }

      overlay.innerHTML = html;
    },

    setSearchValue: function (text) {
      const inputs = document.querySelectorAll('.topnav-search input, #global-search');
      inputs.forEach(i => i.value = text);
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

  document.addEventListener('DOMContentLoaded', () => {
    KSPAdvancedSearch.init();
  });

})();
