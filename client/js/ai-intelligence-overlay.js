/**
 * KSP AI Smart Anomaly Engine + Global Intelligence Overlay
 * Features: Smart Anomaly Detection, AI Explain Mode, Decision Support Score, Investigation CoPilot
 */

(function() {
  'use strict';

  // ──────────────────────────────────────────────
  // SMART ANOMALY ENGINE
  // ──────────────────────────────────────────────
  const ANOMALIES = [
    {
      id: 'ANO-001',
      type: 'spike',
      severity: 'critical',
      title: 'Sudden Crime Spike Detected',
      location: 'South Bengaluru',
      detail: 'Chain snatching incidents increased 340% in last 2 hours vs 7-day average. Unusual temporal pattern: 3 incidents in same 0.5km radius.',
      time: '2 min ago',
      action: 'View Serial Crime Cluster',
      link: '/pages/serial-crimes.html',
      confidence: 94
    },
    {
      id: 'ANO-002',
      type: 'location',
      severity: 'high',
      title: 'Unusual Location Pattern',
      location: 'ATMs near Majestic',
      detail: 'All 4 skimming devices found within 800m of Bengaluru City Railway Station — rare geographic clustering. Suggests coordinated syndicate operation.',
      time: '14 min ago',
      action: 'View Digital Footprint',
      link: '/pages/digital-footprint.html',
      confidence: 87
    },
    {
      id: 'ANO-003',
      type: 'temporal',
      severity: 'high',
      title: 'Suspicious Temporal Pattern',
      location: 'Peenya Industrial Zone',
      detail: 'All warehouse break-ins occur exclusively on Friday nights (100% correlation). This is a 4σ deviation from expected crime distribution. Indicates planned, repeat offender.',
      time: '1h ago',
      action: 'View Case Priority',
      link: '/pages/case-priority.html',
      confidence: 82
    },
    {
      id: 'ANO-004',
      type: 'behavior',
      severity: 'medium',
      title: 'Unexpected Offender Behavior',
      location: 'Bidar District',
      detail: 'Known gang member Ravi Kumar Naik spotted 3 districts away from usual territory in 24h. Cross-district movement detected. May indicate expansion or flee risk.',
      time: '3h ago',
      action: 'View Digital Footprint',
      link: '/pages/digital-footprint.html',
      confidence: 78
    },
  ];

  // ──────────────────────────────────────────────
  // AI COPILOT WIDGET (floating assistant)
  // ──────────────────────────────────────────────
  const COPILOT_RESPONSES = {
    '/pages/investigation.html': {
      summary: 'You are investigating an active case. AI has identified 3 missing evidence items and 2 potential leads.',
      suggestions: ['Check CCTV footage at 06:00 on incident date', 'Interview witness Ramesh K. — reported sighting', 'Cross-reference with FIR-1088 (similar MO)']
    },
    '/pages/network.html': {
      summary: 'Criminal network graph loaded. AI detected 2 new connection nodes since last view.',
      suggestions: ['Focus on Ravi Kumar Naik — highest centrality score', 'Financial link to Suresh Yadav is unverified — investigate', 'Pradeep Singh connection crosses state border — interstate alert']
    },
    '/pages/heatmap.html': {
      summary: 'Crime heatmap active. Today\'s density is 18% above baseline. 4 emerging hotspots detected.',
      suggestions: ['South Bengaluru: new hotspot forming — increase patrol', 'Overlay population density to see per-capita risk', 'Enable festival events layer for today\'s risk context']
    },
    '/pages/serial-crimes.html': {
      summary: 'Serial crime detection engine active. 3 active clusters, 23 linked incidents.',
      suggestions: ['Issue BOLO for SC-001 suspect immediately', 'Predicted next SC-001 incident: Tonight 6-9 PM, Jayanagar', 'Cross-reference SC-002 suspects with railway CCTV']
    },
    default: {
      summary: 'KSP AI CoPilot active. Select a case or view to receive contextual intelligence.',
      suggestions: ['Go to Commander Briefing for executive summary', 'Check Case Priority AI for today\'s top cases', 'Run Crime Cascade simulation for risk forecast']
    }
  };

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    /* ── Slim Top-Left AI Alert Ribbon ── */
    #anomaly-container {
      position: fixed;
      top: 64px;
      left: 24px;
      right: auto;
      z-index: 9990;
      width: 320px;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .anomaly-toast {
      background: rgba(10,15,28,0.96);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 9px 12px;
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: anomalySlideDown 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
      pointer-events: all;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }
    .anomaly-toast:hover { background: rgba(18,26,46,0.98); border-color: rgba(59,130,246,0.35); }
    .anomaly-toast.critical { border-left: 3px solid #ef4444; }
    .anomaly-toast.high     { border-left: 3px solid #f59e0b; }
    .anomaly-toast.medium   { border-left: 3px solid #3b82f6; }
    .anomaly-toast-icon {
      width: 24px; height: 24px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 0.8rem;
    }
    .anomaly-toast-body { flex: 1; min-width: 0; overflow: hidden; }
    .anomaly-toast-title {
      font-size: 0.72rem; font-weight: 700; color: #f1f5f9;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .anomaly-toast-meta {
      display: flex; align-items: center; gap: 6px; margin-top: 2px;
    }
    .anomaly-toast-time  { font-size: 0.6rem; color: rgba(255,255,255,0.3); }
    .anomaly-toast-conf  { font-size: 0.6rem; font-weight: 700; }
    .anomaly-toast-action {
      font-size: 0.6rem; margin-left: auto; white-space: nowrap;
      text-decoration: none; font-weight: 600;
    }
    .anomaly-dismiss {
      width: 18px; height: 18px; flex-shrink: 0; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.25); font-size: 0.65rem; cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .anomaly-dismiss:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }
    /* Progress bar auto-dismiss indicator */
    .anomaly-progress {
      position: absolute; bottom: 0; left: 0; height: 2px;
      border-radius: 0 0 10px 10px;
      animation: anomalyProgress linear forwards;
    }
    @keyframes anomalySlideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes anomalyFadeOut {
      from { opacity: 1; transform: translateY(0);  max-height: 60px; margin-bottom: 0; }
      to   { opacity: 0; transform: translateY(-8px); max-height: 0;   margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
    }
    @keyframes anomalyProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    /* AI CoPilot FAB */
    #copilot-fab {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
    }
    #copilot-btn {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(59,130,246,0.4);
      transition: all 0.3s;
      position: relative;
    }
    #copilot-btn:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(59,130,246,0.5); }
    #copilot-btn-pulse {
      position: absolute; top: -4px; right: -4px;
      width: 14px; height: 14px; border-radius: 50%;
      background: #ef4444;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.55rem; font-weight: 900; color: #fff;
      animation: pulseDot 2s ease infinite;
    }
    #copilot-panel {
      position: fixed; bottom: 84px; left: 20px; z-index: 9999;
      width: 320px; background: rgba(11,18,32,0.97);
      border: 1px solid rgba(59,130,246,0.3); border-radius: 16px;
      backdrop-filter: blur(20px); overflow: hidden;
      display: none; flex-direction: column;
      animation: fadeIn 0.3s ease;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
    }
    #copilot-panel.open { display: flex; }
    .copilot-header {
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08));
    }
    .copilot-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .copilot-body { padding: 14px 16px; overflow-y: auto; max-height: 380px; }
    .copilot-message {
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 12px; padding: 12px;
      font-size: 0.8rem; color: rgba(255,255,255,0.8);
      line-height: 1.6; margin-bottom: 12px;
    }
    .copilot-suggestion {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 6px; cursor: pointer;
      transition: all 0.2s; font-size: 0.78rem; color: rgba(255,255,255,0.7);
    }
    .copilot-suggestion:hover { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); color: #fff; }
    .copilot-input-wrap {
      padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; gap: 8px;
    }
    #overlay-copilot-input {
      flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; color: #fff;
      font-family: 'Inter', sans-serif; outline: none;
    }
    #overlay-copilot-input:focus { border-color: rgba(59,130,246,0.5); }
    #overlay-copilot-input::placeholder { color: rgba(255,255,255,0.3); }
    #overlay-copilot-send {
      width: 34px; height: 34px; border-radius: 8px;
      background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.3);
      color: #60a5fa; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
    }
    #overlay-copilot-send:hover { background: rgba(59,130,246,0.35); }

    /* Anomaly counter badge in topnav (if exists) */
    @keyframes pulseDot {
      0%,100%{ transform:scale(1);opacity:1; }
      50%{ transform:scale(1.2);opacity:0.7; }
    }
  `;
  document.head.appendChild(style);

  // ──────────────────────────────────────────────
  // INIT ANOMALY CONTAINER
  // ──────────────────────────────────────────────
  const container = document.createElement('div');
  container.id = 'anomaly-container';
  document.body.appendChild(container);

  let shownAnomalies = [];
  const DISMISS_MS = 6000; // auto-dismiss each notification after 6s

  function showAnomaly(anomaly) {
    if(shownAnomalies.includes(anomaly.id)) return;
    if(document.getElementById('ksp-copilot-panel')?.classList.contains('open')) return;
    shownAnomalies.push(anomaly.id);

    const colors = { critical:'#ef4444', high:'#f59e0b', medium:'#3b82f6' };
    const icons  = { spike:'📈', location:'📍', temporal:'⏱️', behavior:'👤', combination:'🔗' };
    const color  = colors[anomaly.severity] || '#3b82f6';
    const severityLabel = anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1);

    const toast = document.createElement('div');
    toast.className = `anomaly-toast ${anomaly.severity}`;
    toast.style.position = 'relative'; // needed for the progress bar
    toast.innerHTML = `
      <div class="anomaly-toast-icon" style="background:${color}18">${icons[anomaly.type]||'⚠️'}</div>
      <div class="anomaly-toast-body">
        <div class="anomaly-toast-title">${anomaly.title}</div>
        <div class="anomaly-toast-meta">
          <span class="anomaly-toast-time">${anomaly.time}</span>
          <span class="anomaly-toast-conf" style="color:${color}">${severityLabel} · ${anomaly.confidence}%</span>
          <a class="anomaly-toast-action" style="color:${color}" href="${anomaly.link}">→ View</a>
        </div>
      </div>
      <div class="anomaly-dismiss" onclick="event.stopPropagation();dismissAnomaly(this.closest('.anomaly-toast'))">✕</div>
      <div class="anomaly-progress" style="background:${color};animation-duration:${DISMISS_MS}ms"></div>
    `;
    toast.addEventListener('click', (e) => {
      if(!e.target.classList.contains('anomaly-dismiss') && !e.target.classList.contains('anomaly-toast-action')) {
        window.location.href = anomaly.link;
      }
    });
    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismissAnomaly(toast), DISMISS_MS);
    toast._timer = timer;
  }

  window.dismissAnomaly = function(toast) {
    if(!toast) return;
    clearTimeout(toast._timer);
    toast.style.animation = 'anomalyFadeOut 0.3s ease forwards';
    setTimeout(() => { if(toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  };

  // Show anomalies one at a time with longer spacing so page feels clean on load
  let anomalyIdx = 0;
  function showNextAnomaly() {
    if(anomalyIdx < ANOMALIES.length) {
      showAnomaly(ANOMALIES[anomalyIdx++]);
    }
  }

  // First alert after 8s (page has settled), then every 20s — never stacked
  setTimeout(showNextAnomaly, 8000);
  setTimeout(showNextAnomaly, 28000);
  setTimeout(showNextAnomaly, 52000);
  setTimeout(showNextAnomaly, 80000);

  // ──────────────────────────────────────────────
  // AI COPILOT FAB
  // ──────────────────────────────────────────────
  const fab = document.createElement('div');
  fab.id = 'overlay-copilot-fab';

  const currentPage = window.location.pathname;
  const context = COPILOT_RESPONSES[currentPage] || COPILOT_RESPONSES.default;

  fab.innerHTML = `
    <div id="overlay-copilot-panel">
      <div class="copilot-header">
        <div class="copilot-avatar">🤖</div>
        <div>
          <div style="font-weight:700;font-size:0.875rem;color:#f1f5f9">Investigation CoPilot</div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.4)">AI-powered · Contextual Intelligence</div>
        </div>
        <button onclick="closeCopilot()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:1rem">✕</button>
      </div>
      <div class="copilot-body" id="overlay-copilot-body">
        <div class="copilot-message" id="overlay-copilot-context-msg">${context.summary}</div>
        <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);margin-bottom:8px">💡 SUGGESTIONS</div>
        ${context.suggestions.map(s=>`
          <div class="copilot-suggestion">
            <span style="color:#60a5fa;flex-shrink:0">→</span>
            <span>${s}</span>
          </div>`).join('')}
        <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);margin:12px 0 8px">🚨 ACTIVE ANOMALIES</div>
        ${ANOMALIES.slice(0,2).map(a=>`
          <div style="padding:8px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:8px;margin-bottom:6px;cursor:pointer" onclick="window.location.href='${a.link}'">
            <div style="font-size:0.75rem;font-weight:700;color:#f1f5f9;margin-bottom:2px">${a.title}</div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4)">${a.confidence}% confidence · ${a.time}</div>
          </div>`).join('')}
      </div>
      <div class="copilot-input-wrap">
        <input type="text" id="overlay-copilot-input" placeholder="Ask CoPilot anything..." onkeydown="if(event.key==='Enter')sendCopilot()">
        <button id="overlay-copilot-send" onclick="sendCopilot()">→</button>
      </div>
    </div>
    <button id="overlay-copilot-btn" onclick="toggleCopilot()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
      <div id="overlay-copilot-btn-pulse">${ANOMALIES.length}</div>
    </button>
  `;

  document.body.appendChild(fab);

  let copilotOpen = false;
  window.toggleCopilot = function() {
    copilotOpen = !copilotOpen;
    const panel = document.getElementById('overlay-copilot-panel');
    panel?.classList.toggle('open', copilotOpen);
  };
  window.closeCopilot = function() {
    copilotOpen = false;
    document.getElementById('overlay-copilot-panel')?.classList.remove('open');
  };

  const aiReplies = [
    'Based on current intelligence, I recommend reviewing the Serial Crime Cluster SC-001 immediately.',
    'AI Analysis: The pattern matches a known gang operating between Bengaluru and Bidar districts.',
    'Cross-referencing with historical data shows 87% similarity to the 2022 chain-snatching series.',
    'Evidence gap detected: CCTV footage from the 3rd incident location has not been reviewed yet.',
    'Risk score for this area is currently 94/100. Immediate patrol deployment recommended.',
    'Similar case found: FIR-1088 (2024). Suggest investigating connection between both suspects.',
  ];
  let replyIdx = 0;

  window.sendCopilot = function() {
    const input = document.getElementById('overlay-copilot-input');
    if (!input) return;
    const query = input.value.trim();
    if(!query) return;

    const body = document.getElementById('overlay-copilot-body');
    if (!body) return;
    // Show user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'text-align:right;margin-bottom:8px';
    userMsg.innerHTML = `<span style="background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:6px 12px;font-size:0.8rem;color:#f1f5f9;display:inline-block">${query}</span>`;
    body.appendChild(userMsg);
    input.value = '';

    // AI typing indicator
    const typing = document.createElement('div');
    typing.style.cssText = 'margin-bottom:8px';
    typing.innerHTML = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;font-size:0.8rem;color:rgba(255,255,255,0.4)">🤖 AI thinking...</div>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
      body.removeChild(typing);
      const aiMsg = document.createElement('div');
      aiMsg.style.cssText = 'margin-bottom:8px';
      aiMsg.innerHTML = `<div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:8px;padding:8px 12px;font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.6">${aiReplies[replyIdx % aiReplies.length]}</div>`;
      replyIdx++;
      body.appendChild(aiMsg);
      body.scrollTop = body.scrollHeight;
    }, 1200);
  };

})();
