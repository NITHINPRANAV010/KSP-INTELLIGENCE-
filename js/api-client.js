/* =========================================================
   API-CLIENT.JS — Enterprise FastAPI Integrations Engine
   KSP AI Crime Intelligence Command Center — Phase 6
   ========================================================= */

(function () {
  'use strict';

  const BACKEND_URL = 'http://localhost:8000/api';
  const WS_URL = 'ws://localhost:8000/ws';

  const KSPAPIClient = {
    isOnline: false,
    ws: null,
    jwtToken: null,

    init: function () {
      this.jwtToken = localStorage.getItem('ksp_auth_token') || '';
      this.renderConnectionIndicator();
      this.checkBackendHealth();
    },

    /**
     * Check if FastAPI backend is online and pingable.
     */
    checkBackendHealth: function () {
      const headers = this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {};

      fetch(`${BACKEND_URL}/me`, { headers })
        .then(res => {
          if (res.ok) {
            this.isOnline = true;
            this.updateIndicator(true);
            this.connectWebSocket();
            this.overrideDatabaseAPI();
          } else {
            // Unauthenticated or login required, but backend is online
            this.isOnline = true;
            this.updateIndicator(true, 'Live (Auth Required)');
            this.overrideDatabaseAPI();
          }
        })
        .catch(err => {
          this.isOnline = false;
          this.updateIndicator(false);
          console.warn('FastAPI backend offline. Falling back to local offline mock database sandbox.');
        });
    },

    /**
     * Overrides frontend data operations with async API calls
     */
    overrideDatabaseAPI: function () {
      if (!window.KSPDatabase) return;
      console.log('API-CLIENT: Intercepting KSPDatabase operations. Syncing live PostgreSQL datasets...');

      // Pre-download crimes from backend to override index databases
      const headers = this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {};
      
      this.showSpinner(true);
      fetch(`${BACKEND_URL}/crimes?limit=10500`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Map keys from python snake_case to frontend camelCase
            const mapped = data.map(i => ({
              id: i.id,
              caseNumber: i.case_number,
              crimeType: i.crime_type,
              category: i.category,
              district: i.district,
              policeStation: i.police_station,
              lat: i.lat,
              lng: i.lng,
              date: i.date,
              time: i.time,
              severity: i.severity,
              status: i.status,
              weather: i.weather || 'Clear',
              landmark: i.landmark || 'Crossroads',
              vehicleInfo: i.vehicle_info || 'N/A',
              phoneNumber: i.phone_number || '',
              knownAssociates: i.known_associates || 'None',
              crimeMethod: i.crime_method || '',
              socioEconomic: {
                unemploymentRate: i.unemployment_rate || 5.0,
                literacyRate: i.literacy_rate || 80.0,
                populationDensity: i.population_density || 'Medium Density'
              },
              suspect: i.suspect ? {
                name: i.suspect.name,
                age: i.suspect.age,
                gender: i.suspect.gender,
                repeatOffender: i.suspect.is_repeat_offender
              } : null
            }));

            // Sync to local databases in memory
            window.KSPDatabase.incidents = mapped;
            console.log(`API-CLIENT: Successfully seeded ${mapped.length} live records from PostgreSQL!`);

            // If on main page, retrigger counters and charts recalculations
            if (window.KSPCounters) {
              if (typeof KSPCounters.initKPICards  === 'function') KSPCounters.initKPICards();
              if (typeof KSPCounters.initCounters   === 'function') KSPCounters.initCounters();
              if (typeof KSPCounters.initSparklines === 'function') KSPCounters.initSparklines();
            }
            if (window.KSPCharts && typeof KSPCharts.initTrendChart === 'function') {
              // Retrigger charts refresh if canvas found
              const canvases = document.querySelectorAll('canvas');
              canvases.forEach(c => {
                const chart = Chart.getChart(c);
                if (chart) chart.update();
              });
            }
          }
          this.showSpinner(false);
        })
        .catch(err => {
          this.showSpinner(false);
          console.error('API-CLIENT: Failed to download live crimes', err);
        });

      // Intercept KSPDatabase.addIncident
      const originalAddIncident = KSPDatabase.addIncident;
      KSPDatabase.addIncident = function (inc) {
        // First add locally
        originalAddIncident.call(KSPDatabase, inc);

        // Map payload to snake case
        const payload = {
          id: inc.id,
          case_number: inc.caseNumber,
          crime_type: inc.crimeType,
          category: inc.category || 'theft',
          district: inc.district,
          police_station: inc.policeStation,
          lat: inc.lat,
          lng: inc.lng,
          date: inc.date,
          time: inc.time,
          severity: inc.severity,
          status: inc.status,
          weather: inc.weather || 'Clear',
          landmark: inc.landmark || 'Street Corner',
          vehicle_info: inc.vehicleInfo || 'N/A',
          phone_number: inc.phoneNumber || '',
          known_associates: inc.knownAssociates || 'None',
          crime_method: inc.crimeMethod || '',
          unemployment_rate: inc.socioEconomic?.unemploymentRate || 5.0,
          literacy_rate: inc.socioEconomic?.literacyRate || 80.0,
          population_density: inc.socioEconomic?.populationDensity || 'Medium Density'
        };

        fetch(`${BACKEND_URL}/crimes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('ksp_auth_token') || ''}`
          },
          body: JSON.stringify(payload)
        })
        .then(res => {
          if (res.ok) console.log(`API-CLIENT: New case ${inc.id} synchronized to PostgreSQL database.`);
        })
        .catch(e => console.error('API-CLIENT: Sync case post failed', e));
      };

      // Intercept Case Comments and Status Updates
      if (window.KSPCases) {
        KSPCases.updateStatus = function (caseId, status) {
          // Fallback local update
          const c = this.getCaseDetails(caseId);
          if (c) c.status = status;

          fetch(`${BACKEND_URL}/cases/${caseId}/assign?officer_name=${encodeURIComponent(c.assignedOfficer)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('ksp_auth_token') || ''}` }
          });
          return true;
        };
      }
    },

    /**
     * Establishes real-time push alert sockets
     */
    connectWebSocket: function () {
      try {
        this.ws = new WebSocket(WS_URL);
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('API-CLIENT: Real-time broadcast packet received:', data);
          
          if (data.event === 'alert:new' && data.alert) {
            // Trigger command notification
            if (window.showToast) {
              window.showToast(`🚨 REALTIME ALERT: ${data.alert.description}`, 'warning', 6000);
            }
            if (window.KSPNotifications) {
              KSPNotifications.create(data.alert.description, 'crime', 'high');
            }
          }
        };

        this.ws.onerror = (err) => {
          console.warn('API-CLIENT: WebSocket connection warning.', err);
        };
      } catch (e) {
        console.warn('API-CLIENT: WebSocket connection error.', e);
      }
    },

    /**
     * Display current live indicator on the page
     */
    renderConnectionIndicator: function () {
      const topnavActions = document.querySelector('.topnav-actions');
      if (!topnavActions) return;

      let ind = document.getElementById('ksp-connection-indicator');
      if (!ind) {
        ind = document.createElement('div');
        ind.id = 'ksp-connection-indicator';
        ind.style.cssText = `
          display: flex; align-items: center; gap: 6px;
          font-family: var(--font-sans); font-size: 0.7rem; font-weight: 700;
          padding: 4px 8px; border-radius: var(--radius-sm); margin-right: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
        `;
        topnavActions.insertBefore(ind, topnavActions.firstChild);
      }
      this.updateIndicator(false);
    },

    updateIndicator: function (online, text = null) {
      const ind = document.getElementById('ksp-connection-indicator');
      if (!ind) return;

      if (online) {
        ind.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:var(--success)"></span> <span style="color:var(--text-primary)">${text || 'Live (FastAPI)'}</span>`;
        ind.style.borderColor = 'rgba(34,197,94,0.3)';
        ind.style.background = 'rgba(34,197,94,0.04)';
      } else {
        ind.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:var(--text-muted)"></span> <span style="color:var(--text-muted)">Sandbox (Local)</span>`;
        ind.style.borderColor = 'rgba(255,255,255,0.05)';
        ind.style.background = 'rgba(255,255,255,0.01)';
      }
    },

    showSpinner: function (show) {
      let spinner = document.getElementById('ksp-api-spinner');
      if (!spinner && show) {
        spinner = document.createElement('div');
        spinner.id = 'ksp-api-spinner';
        spinner.style.cssText = `
          position: fixed; top: 12px; right: 340px; z-index: 99999;
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent-blue); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        `;
        document.body.appendChild(spinner);
      }
      if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
      }
    }
  };

  window.KSPAPIClient = KSPAPIClient;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    KSPAPIClient.init();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      KSPAPIClient.init();
    });
  }

})();
