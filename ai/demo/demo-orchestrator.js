/* =========================================================
   DEMO-ORCHESTRATOR.JS — AI-Driven Live Command Center Demo
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  const AI_COMMENTARY = [
    { type: 'anomaly', message: 'AI Anomaly Engine: Spike detected in Vehicle Theft — Shivajinagar (+38%)' },
    { type: 'prediction', message: 'Crime Predictor: 94% probability of narcotics activity on NH-748 corridor tonight' },
    { type: 'network', message: 'Network Intelligence: New associate link discovered — Ravi Kumar ↔ Deepak Reddy' },
    { type: 'hotspot', message: 'Hotspot Engine: Emerging cluster forming near Koramangala Metro Station' },
    { type: 'offender', message: 'Offender Profiler: Suresh Nayak reoffending probability elevated to 78%' },
    { type: 'decision', message: 'Decision Support: Recommend deploying 3 units to Whitefield — peak crime window' },
    { type: 'anomaly', message: 'AI Anomaly Engine: Cybercrime activity at off-peak hours detected in Mysuru' },
    { type: 'prediction', message: 'Crime Predictor: Financial fraud surge expected next 48 hours — Bengaluru Urban' },
    { type: 'network', message: 'Network Intelligence: Gang community of 5 members identified — Belagavi district' },
    { type: 'hotspot', message: 'Hotspot Engine: Intensity level increased in Majestic area by 22% this week' }
  ];

  const AI_ALERT_COLORS = {
    anomaly: 'var(--critical)',
    prediction: 'var(--accent-blue)',
    network: 'var(--accent-cyan)',
    hotspot: 'var(--warning)',
    offender: '#C084FC',
    decision: 'var(--success)'
  };

  let orchestratorTimer = null;
  let commentaryIndex = 0;
  let commentaryContainer = null;
  let isRunning = false;

  /**
   * Render a single AI commentary entry into the live ticker.
   */
  function pushAICommentary(entry) {
    if (!commentaryContainer) {
      commentaryContainer = document.getElementById('ai-commentary-ticker') ||
                            document.getElementById('ai-live-ticker') ||
                            document.querySelector('.ai-ticker');
    }

    if (!commentaryContainer) return;

    const el = document.createElement('div');
    el.style.cssText = `
      display:flex; align-items:center; gap:8px; padding:6px 10px;
      background:rgba(0,0,0,0.25); border-left:3px solid ${AI_ALERT_COLORS[entry.type] || 'var(--accent-blue)'};
      border-radius:4px; animation:slideInLeft 0.3s ease; font-size:0.75rem;
      color:var(--text-secondary); margin-bottom:4px;
    `;
    el.innerHTML = `
      <span style="color:${AI_ALERT_COLORS[entry.type]};font-weight:700;text-transform:uppercase;font-size:0.65rem;min-width:60px">${entry.type}</span>
      <span>${entry.message}</span>
      <span style="margin-left:auto;color:var(--text-muted);font-size:0.65rem">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    `;
    commentaryContainer.prepend(el);

    // Keep max 8 items
    while (commentaryContainer.children.length > 8) {
      commentaryContainer.removeChild(commentaryContainer.lastChild);
    }
  }

  /**
   * Update any visible AI metric counters on the current page.
   */
  function updateAIMetricCounters() {
    const incidents = KSPDatabase.getIncidents();
    const today = incidents.filter(i => i.date === '2025-07-03' || new Date(i.date) >= new Date('2025-06-26'));

    const todayCount = document.getElementById('demo-today-count');
    if (todayCount) todayCount.textContent = today.length;

    const totalCount = document.getElementById('demo-total-count');
    if (totalCount) totalCount.textContent = incidents.length.toLocaleString('en-IN');

    const activeCount = document.getElementById('demo-active-count');
    if (activeCount) activeCount.textContent = incidents.filter(i => i.status === 'Active' || i.status === 'Investigating').length;

    // Update decision support count
    const dsCount = document.getElementById('decision-count');
    if (dsCount && window.KSPDecisionSupport) {
      const last = KSPDecisionSupport.getLast();
      if (last) dsCount.textContent = last.counts.critical;
    }
  }

  /**
   * Pulse an AI engine status indicator.
   */
  function pulseEngineStatus(engineName) {
    const el = document.getElementById(`engine-status-${engineName}`) ||
               document.querySelector(`[data-engine="${engineName}"]`);
    if (!el) return;
    el.style.transition = 'all 0.3s';
    el.style.filter = 'brightness(2)';
    el.style.transform = 'scale(1.2)';
    setTimeout(() => {
      el.style.filter = '';
      el.style.transform = '';
    }, 600);
  }

  /**
   * Trigger an AI event popup notification in the command center.
   */
  function triggerAIEventPopup(entry) {
    if (!window.showToast) return;
    const icon = { anomaly: '🔴', prediction: '🔮', network: '🕸️', hotspot: '🗺️', offender: '👤', decision: '🛡️' }[entry.type] || '🤖';
    showToast(`${icon} ${entry.message}`, entry.type === 'anomaly' ? 'critical' : 'info', 4500);
  }

  /**
   * Run a single demo orchestration tick.
   */
  function orchestrationTick() {
    const config = window.KSPAIConfig || { get: () => 1 };
    const entry = AI_COMMENTARY[commentaryIndex % AI_COMMENTARY.length];
    commentaryIndex++;

    pushAICommentary(entry);
    updateAIMetricCounters();
    pulseEngineStatus(entry.type);

    // Emit AI event for any page-level listeners
    if (window.KSPAIBus) {
      KSPAIBus.emit('demo:ai_event', entry);
    }

    // Occasional toast popup (every 3rd event)
    if (commentaryIndex % 3 === 0) {
      triggerAIEventPopup(entry);
    }

    // Also trigger a real-time incident every other tick
    if (commentaryIndex % 2 === 0 && window.KSPRealtime) {
      KSPRealtime.triggerIncomingIncident(window.KSPMap?.instance);
    }
  }

  const KSPDemoOrchestrator = {
    /**
     * Start the AI demo orchestrator.
     * @param {Object} [options]
     * @param {string} [options.tickerContainerId] - ID of ticker DOM element
     * @param {number} [options.interval=8000] - Tick interval in ms
     */
    start: function (options = {}) {
      if (isRunning) return;
      isRunning = true;

      const config = window.KSPAIConfig || { get: () => 1 };
      const speed = config.get('simulationSpeed') || 1;
      const baseInterval = options.interval || 8000;
      const interval = Math.round(baseInterval / speed);

      if (options.tickerContainerId) {
        commentaryContainer = document.getElementById(options.tickerContainerId);
      }

      // Initialize decision support on start
      if (window.KSPDecisionSupport) KSPDecisionSupport.generate();

      // Run anomaly scan on start
      if (window.KSPAnomalyDetector) KSPAnomalyDetector.scan();

      // First tick immediately
      setTimeout(() => orchestrationTick(), 1500);

      // Then recurring
      orchestratorTimer = setInterval(orchestrationTick, interval);

      console.log(`[KSPDemoOrchestrator] Started at ${speed}x speed (${interval}ms interval)`);

      if (window.KSPAIBus) KSPAIBus.emit('demo:started', { speed, interval });
    },

    /**
     * Stop the orchestrator.
     */
    stop: function () {
      isRunning = false;
      if (orchestratorTimer) {
        clearInterval(orchestratorTimer);
        orchestratorTimer = null;
      }
      if (window.KSPAIBus) KSPAIBus.emit('demo:stopped', {});
    },

    /**
     * Set the ticker container after initialization.
     */
    setContainer: function (el) {
      commentaryContainer = el;
    },

    /** Manually trigger one tick */
    tick: function () { orchestrationTick(); },

    /** Check if running */
    isRunning: function () { return isRunning; }
  };

  window.KSPDemoOrchestrator = KSPDemoOrchestrator;

})();
