/* =========================================================
   SYSTEM-HEALTH.JS — Admin Node Monitoring & Health Metrics
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  const KSPSystemHealth = {
    getMetrics: function () {
      const dbSize = KSPDatabase.getIncidents().length;
      const offendersCount = KSPDatabase.getOffenders().length;
      
      return {
        databaseStatus: 'Nominal',
        databaseRecords: dbSize,
        databaseOffenders: offendersCount,
        apiHealth: '100% (All endpoints responsive)',
        systemLoad: {
          cpu: '14.2%',
          memory: '38.6%',
          storage: '42.1 MB / 512 MB (Local Sandbox)'
        },
        activeEngines: {
          prediction: 'ACTIVE',
          hotspot: 'ACTIVE',
          network: 'ACTIVE',
          anomaly: 'ACTIVE'
        },
        predictionQueue: {
          pendingJobs: 0,
          processedJobs: 48,
          avgLatencyMs: 142
        },
        networkConnections: {
          connectedUsers: 5,
          activeOfficerTerminals: 3,
          averageResponseTimeMs: 18
        },
        healthCheckHistory: [
          { time: '12:00 PM', component: 'DB Sync', status: 'Healthy', note: 'Checksum match: OK' },
          { time: '11:00 AM', component: 'AI Predictor', status: 'Healthy', note: 'Regression slopes aligned' },
          { time: '10:00 AM', component: 'Network Socket', status: 'Healthy', note: 'Secure FIPS tunnel established' }
        ]
      };
    },

    /**
     * Renders health dashboard in settings or target pages if container is found.
     */
    renderDashboard: function (containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const m = this.getMetrics();

      container.innerHTML = `
        <div class="grid-two mb-md">
          <div class="card card-sm">
            <div style="font-weight:700;color:var(--text-primary);font-size:0.875rem;margin-bottom:8px">💻 Node Status</div>
            <div class="flex flex-col gap-xs text-xs">
              <div class="flex justify-between">
                <span class="text-muted">CPU Load</span>
                <span class="text-primary font-semibold">${m.systemLoad.cpu}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Memory Usage</span>
                <span class="text-primary font-semibold">${m.systemLoad.memory}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Sandbox Storage</span>
                <span class="text-primary font-semibold">${m.systemLoad.storage}</span>
              </div>
            </div>
          </div>
          <div class="card card-sm">
            <div style="font-weight:700;color:var(--text-primary);font-size:0.875rem;margin-bottom:8px">🧠 AI Pipelines</div>
            <div class="flex flex-col gap-xs text-xs">
              <div class="flex justify-between">
                <span class="text-muted">Predictor Engine</span>
                <span class="text-success font-semibold">● ACTIVE</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Anomaly Detector</span>
                <span class="text-success font-semibold">● ACTIVE</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Hotspot Clustering</span>
                <span class="text-success font-semibold">● ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card card-sm">
          <div style="font-weight:700;color:var(--text-primary);font-size:0.875rem;margin-bottom:8px">📁 Database Metrics</div>
          <div class="flex flex-col gap-xs text-xs">
            <div class="flex justify-between">
              <span class="text-muted">Incident Records</span>
              <span class="text-primary font-semibold">${m.databaseRecords} cases</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Linked Offender Registry</span>
              <span class="text-primary font-semibold">${m.databaseOffenders} profile cards</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">API Health Status</span>
              <span class="text-success font-semibold">NOMINAL</span>
            </div>
          </div>
        </div>
      `;
    }
  };

  window.KSPSystemHealth = KSPSystemHealth;

})();
