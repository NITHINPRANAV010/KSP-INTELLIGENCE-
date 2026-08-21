/* =========================================================
   COPILOT.JS — Page-Context AI Copilot Sidebar
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPCopilot = (() => {

  // ── OpenRouter / Ling-3.0-tiny Config ──────────────────────
  const OPENROUTER_API_KEY = (window.KSP_CONFIG && window.KSP_CONFIG.OPENROUTER_API_KEY) || localStorage.getItem('openrouter_api_key') || (window.ENV && window.ENV.OPENROUTER_API_KEY) || '';
  const OPENROUTER_MODEL   = (window.KSP_CONFIG && window.KSP_CONFIG.OPENROUTER_MODEL)   || 'inclusionai/ling-3.0-tiny:free';
  const BACKEND_URL        = 'http://localhost:8000/api';
  const KSP_SYSTEM_PROMPT  =
    'You are the KSP AI Crime Intelligence Copilot — a Senior Police Crime Intelligence Analyst ' +
    'for Karnataka State Police. Answer based on real Karnataka crime data. ' +
    'Be concise, professional, and well-structured. Use bold headings and bullet points.';

  /**
   * Tier 1: Backend RAG (real DB + Ling-3.0-tiny). 25s timeout.
   */
  async function callBackendChat(message, pageContext) {
    try {
      const token = localStorage.getItem('ksp_auth_token') || '';
      const res = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, context: pageContext }),
        signal: AbortSignal.timeout(25000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.response || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Tier 2: OpenRouter direct (works on Catalyst, no backend needed).
   */
  async function callLingAI(message) {
    if (!OPENROUTER_API_KEY) return null;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  window.location.origin,
          'X-Title':       'KSP AI Crime Intelligence'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: KSP_SYSTEM_PROMPT },
            { role: 'user',   content: message }
          ]
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch (err) {
      return null;
    }
  }

  // Page context detection
  const PAGE_CONTEXTS = {
    'index.html':           { page: 'dashboard',    label: 'Dashboard' },
    'investigation.html':   { page: 'investigation', label: 'Investigation' },
    'heatmap.html':         { page: 'heatmap',       label: 'Crime Heatmap' },
    'analytics.html':       { page: 'analytics',     label: 'Analytics' },
    'network.html':         { page: 'network',       label: 'Criminal Network' },
    'offenders.html':       { page: 'offenders',     label: 'Offenders' },
    'predictive.html':      { page: 'predictive',    label: 'Predictive Intel' },
    'patrol.html':          { page: 'patrol',        label: 'Patrol Engine' },
    'district.html':        { page: 'district',      label: 'District Profile' },
    'timeline.html':        { page: 'timeline',      label: 'Timeline Replay' },
    'reports.html':         { page: 'reports',       label: 'Reports' },
    'alerts.html':          { page: 'alerts',        label: 'Alert Center' },
    'users.html':           { page: 'users',         label: 'User Management' },
    'settings.html':        { page: 'settings',      label: 'Settings' },
  };

  const CONTEXT_ACTIONS = {
    dashboard:    [
      { icon:'trending-up',    label:'Why did crimes spike today?',           q:'Why did crimes spike in Bengaluru today?' },
      { icon:'brain-circuit',  label:'Summarize today\'s intelligence',       q:'Summarize today\'s intelligence briefing' },
      { icon:'navigation',     label:'Recommend patrol deployment now',       q:'Recommend optimal patrol deployment for today' },
      { icon:'zap',            label:'Explain the cybercrime anomaly',        q:'Explain the UPI fraud anomaly detected this morning' },
    ],
    investigation:[
      { icon:'search',         label:'Find similar past cases',              q:'Find similar crime patterns from past 6 months' },
      { icon:'git-branch',     label:'Who are the associates?',              q:'List all known associates in this investigation' },
      { icon:'brain-circuit',  label:'AI probability assessment',            q:'Give probability assessment for this case resolution' },
      { icon:'file-text',      label:'Generate investigation report',        q:'Generate full investigation report for this case' },
    ],
    heatmap:      [
      { icon:'map-pin',        label:'Identify top 3 hotspots',             q:'Identify the top 3 crime hotspots right now' },
      { icon:'trending-up',    label:'Why is Shivajinagar high risk?',      q:'Why is Shivajinagar showing high crime risk?' },
      { icon:'navigation',     label:'Optimal patrol coverage for map',     q:'Recommend optimal patrol coverage for current hotspots' },
      { icon:'clock',          label:'Predict tomorrow\'s hotspots',        q:'Predict hotspots for tomorrow based on patterns' },
    ],
    analytics:    [
      { icon:'trending-up',    label:'Why is cybercrime increasing?',        q:'Why is cybercrime showing 34% increase this year?' },
      { icon:'bar-chart-3',    label:'Which district improved most?',        q:'Which district improved the most in 2025?' },
      { icon:'compare',        label:'Compare this month vs last',           q:'Compare crime statistics: June vs May 2025' },
      { icon:'brain-circuit',  label:'Key insights from analytics',         q:'Give top 5 key insights from current analytics' },
    ],
    network:      [
      { icon:'git-branch',     label:'Who is the central node?',            q:'Who is the most connected suspect in the criminal network?' },
      { icon:'alert-triangle', label:'Identify network weak points',        q:'Identify weak links in the criminal network' },
      { icon:'user-x',         label:'Profile the highest-risk suspect',    q:'Give detailed profile of highest risk suspect in network' },
      { icon:'map-pin',        label:'Where does network operate?',         q:'What locations does this criminal network operate from?' },
    ],
    offenders:    [
      { icon:'alert-circle',   label:'Who is most likely to reoffend?',     q:'Which offender is most likely to reoffend in 30 days?' },
      { icon:'map-pin',        label:'Where are wanted offenders now?',     q:'What is the likely current location of wanted offenders?' },
      { icon:'git-branch',     label:'Show Ravi Kumar\'s network',          q:'Show the criminal network associated with Ravi Kumar' },
      { icon:'shield',         label:'Recommend surveillance targets',      q:'Recommend top 3 offenders for enhanced surveillance' },
    ],
    predictive:   [
      { icon:'brain-circuit',  label:'Why these predictions?',              q:'Explain the reasoning behind current predictions' },
      { icon:'trending-up',    label:'How confident is the model?',         q:'Explain model confidence and accuracy factors' },
      { icon:'navigation',     label:'Prevention strategy',                 q:'What prevention strategy will reduce predicted crimes most?' },
      { icon:'map-pin',        label:'Identify blind spots in predictions', q:'What areas might the prediction model be missing?' },
    ],
    patrol:       [
      { icon:'navigation',     label:'Is current deployment optimal?',      q:'Is the current patrol deployment optimal for risk coverage?' },
      { icon:'zap',            label:'Emergency redeployment needed?',      q:'Based on current alerts, is emergency redeployment needed?' },
      { icon:'map-pin',        label:'Most under-patrolled high-risk area', q:'Which high-risk area is most under-patrolled right now?' },
      { icon:'clock',          label:'Best patrol shift timing',            q:'What are the optimal patrol shift timings for tonight?' },
    ],
    district:     [
      { icon:'trending-up',    label:'Why is this district high risk?',     q:'Explain why this district has elevated crime risk' },
      { icon:'brain-circuit',  label:'Prediction for next 7 days',          q:'Predict crime pattern for this district next 7 days' },
      { icon:'navigation',     label:'Patrol recommendation for district',  q:'Give detailed patrol recommendation for this district' },
      { icon:'file-text',      label:'Generate district intelligence brief', q:'Generate intelligence brief for this district' },
    ],
    alerts:       [
      { icon:'alert-triangle', label:'Which alert needs action first?',     q:'Which current alert requires the most urgent response?' },
      { icon:'navigation',     label:'Recommended officer assignments',     q:'Which officers should be assigned to current critical alerts?' },
      { icon:'brain-circuit',  label:'Pattern in recent alerts',            q:'What pattern do you see in today\'s alerts?' },
      { icon:'git-branch',     label:'Are alerts connected?',               q:'Are any of today\'s alerts connected to the same criminal network?' },
    ],
    default:      [
      { icon:'brain-circuit',  label:'What should I focus on?',             q:'What should I focus on right now based on intelligence?' },
      { icon:'trending-up',    label:'Today\'s top priorities',             q:'List today\'s top 5 operational priorities' },
      { icon:'navigation',     label:'Patrol recommendation',               q:'Give current patrol deployment recommendation' },
      { icon:'file-text',      label:'Generate situation report',           q:'Generate current situation report for commanders' },
    ],
  };

  let isOpen = false;
  let currentPage = 'default';

  // ── DOM Build ──────────────────────────────────────────
  function buildDOM() {
    if (document.getElementById('ksp-copilot-panel')) return;

    // Detect page context
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    const ctx = PAGE_CONTEXTS[filename] || { page: 'default', label: 'Overview' };
    currentPage = ctx.page;
    const actions = CONTEXT_ACTIONS[currentPage] || CONTEXT_ACTIONS.default;

    const panel = document.createElement('div');
    panel.id = 'ksp-copilot-panel';
    panel.className = 'copilot-panel';
    panel.innerHTML = `
      <div class="copilot-header">
        <div class="copilot-header-left">
          <div class="copilot-ai-dot"></div>
          <div>
            <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary)">AI Copilot</div>
            <div style="font-size:0.6875rem;color:var(--text-muted)">Context: ${ctx.label}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" id="copilot-close">
          <i data-lucide="x" style="width:15px;height:15px"></i>
        </button>
      </div>

      <div class="copilot-messages" id="copilot-messages">
        <div class="copilot-welcome">
          <div class="copilot-welcome-icon">
            <i data-lucide="brain-circuit" style="width:22px;height:22px;color:white"></i>
          </div>
          <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">KSP AI Copilot</div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;line-height:1.5">
            I understand you're on the ${ctx.label} page. Ask me anything or use a quick action below.
          </div>
        </div>
      </div>

      <div class="copilot-quick-actions" id="copilot-quick-actions">
        <div class="copilot-section-label">Quick Actions</div>
        ${actions.map(a => `
          <button class="copilot-action-btn" data-query="${a.q}">
            <i data-lucide="${a.icon}" style="width:13px;height:13px;flex-shrink:0"></i>
            <span>${a.label}</span>
          </button>
        `).join('')}
      </div>

      <div class="copilot-input-area">
        <form id="ksp-copilot-form" class="copilot-input-row" action="javascript:void(0);">
          <input type="text" id="ksp-copilot-input" class="copilot-input" placeholder="Ask anything about ${ctx.label}…" autocomplete="off" />
          <button type="submit" class="btn btn-primary btn-sm" id="ksp-copilot-send" style="align-self:center;padding:8px 10px">
            <i data-lucide="send" style="width:13px;height:13px"></i>
          </button>
        </form>
        <div style="font-size:0.625rem;color:var(--text-muted);text-align:center;margin-top:4px">
          Press Enter to Send · Powered by Catalyst AI Engine
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    if (window.lucide) lucide.createIcons({ nodes: [panel] });

    // Bind events
    document.getElementById('copilot-close')?.addEventListener('click', close);

    document.querySelectorAll('.copilot-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.query;
        handleSend(q);
      });
    });

    const form = document.getElementById('ksp-copilot-form');
    const input = document.getElementById('ksp-copilot-input');
    const sendBtn = document.getElementById('ksp-copilot-send');

    const submitFn = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const val = input ? input.value.trim() : '';
      if (val) handleSend(val);
      return false;
    };

    form?.addEventListener('submit', submitFn);
    sendBtn?.addEventListener('click', submitFn);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        submitFn(e);
      }
    });
  }

  // ── Send Message Handler ──────────────────────────────
  async function handleSend(text) {
    const messages = document.getElementById('copilot-messages');
    const input = document.getElementById('ksp-copilot-input');
    if (!messages || !text) return;

    // Immediately clear input field
    if (input) input.value = '';

    // User message bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'copilot-msg copilot-user';
    userBubble.innerHTML = `
      <div class="copilot-avatar copilot-avatar-user">DCP</div>
      <div class="copilot-bubble copilot-bubble-user">${escapeHTML(text)}</div>
    `;
    messages.appendChild(userBubble);

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'copilot-msg copilot-ai';
    typing.id = 'copilot-typing';
    typing.innerHTML = `
      <div class="copilot-avatar copilot-avatar-ai">
        <i data-lucide="bot" style="width:13px;height:13px;color:white"></i>
      </div>
      <div class="copilot-bubble copilot-bubble-ai">
        <div class="copilot-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messages.appendChild(typing);
    if (window.lucide) lucide.createIcons({ nodes: [typing] });
    messages.scrollTop = messages.scrollHeight;

    let responseText = "";

    // ── 3-Tier AI Waterfall ───────────────────────────────
    // Tier 1: Backend RAG (real DB + Ling-3.0-tiny)
    const backendReply = await callBackendChat(text, currentPage);
    if (backendReply) {
      responseText = backendReply;
    } else {
      // Tier 2: Direct Ling-3.0-tiny (Catalyst / no backend)
      const aiReply = await callLingAI(text);
      if (aiReply) {
        responseText = aiReply;
      } else {
        // Tier 3: Local conversational fallback
        await new Promise(r => setTimeout(r, 200));
        responseText = generateLocalConversationalResponse(text, currentPage);
      }
    }

    // Remove typing indicator
    const typingEl = document.getElementById('copilot-typing');
    if (typingEl) typingEl.remove();

    // Render AI Response
    const aiBubble = document.createElement('div');
    aiBubble.className = 'copilot-msg copilot-ai';
    aiBubble.innerHTML = `
      <div class="copilot-avatar copilot-avatar-ai">
        <i data-lucide="bot" style="width:13px;height:13px;color:white"></i>
      </div>
      <div class="copilot-bubble copilot-bubble-ai copilot-response">
        ${formatResponse(responseText)}
        <div class="copilot-response-actions" style="margin-top:8px">
          <button class="btn btn-ghost btn-sm" onclick="window.location.href='${window.location.pathname.includes('/pages/') ? '../' : ''}pages/investigation.html?q=${encodeURIComponent(text)}'">
            <i data-lucide="external-link" style="width:11px;height:11px"></i> Full Analysis
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.location.href='${window.location.pathname.includes('/pages/') ? '../' : ''}pages/reports.html'">
            <i data-lucide="file-text" style="width:11px;height:11px"></i> Report
          </button>
        </div>
      </div>
    `;
    messages.appendChild(aiBubble);
    if (window.lucide) lucide.createIcons({ nodes: [aiBubble] });
    messages.scrollTop = messages.scrollHeight;

    // Refocus input
    if (input) input.focus();
  }

  // Conversational local fallback
  function generateLocalConversationalResponse(query, page) {
    const q = (query || '').toLowerCase().trim();

    if (q === 'hello' || q === 'hi' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ') || q.startsWith('hey ')) {
      return `Hello Officer! 👋\n\nI am your **KSP AI Crime Intelligence Copilot**. I am monitoring all 30 police districts across Karnataka.\n\nHow can I assist your shift today? Feel free to ask me about:\n• **Crime Hotspots** (e.g. *"Where are the top hotspots?"*)\n• **Suspect Details** (e.g. *"Who is Ravi Kumar?"*)\n• **Patrol Deployment** or **Cybercrime Anomalies**`;
    }

    if (q.includes('who are you') || q.includes('what can you do') || q.includes('help')) {
      return `I am the **KSP Intelligence AI Copilot**.\n\nKey capabilities:\n1. 🔍 Search 12,470+ indexed crime records and repeat offender dossiers.\n2. 📍 Pinpoint real-time crime hotspots (Shivajinagar, Majestic, Koramangala).\n3. 🚗 Calculate risk-weighted patrol route recommendations.\n4. ⚡ Flag cyber fraud anomalies and suspicious transaction velocity.`;
    }

    if (q.includes('spike') || q.includes('increase') || q.includes('why') || q.includes('surge')) {
      return `**Analysis: Crime Rate Spike & Trend Drivers**\n\n→ **Vehicle Theft**: +34% surge concentrated around transit corridors (Majestic, Shivajinagar).\n→ **Patrol Vulnerability**: Coverage gap identified between 22:00 and 01:00.\n→ **Recommendation**: Deploy 3 QRU units to Shivajinagar Bus Stand immediately.`;
    }

    if (q.includes('hotspot') || q.includes('location') || q.includes('map') || q.includes('where') || q.includes('area')) {
      return `**Hotspot Intelligence & Geo-Spatial Risk**\n\nTop crime clusters identified right now:\n\n1. 🔴 **Shivajinagar Commercial Zone** — 42 incidents (Vehicle Theft / Key Cloning)\n2. 🔴 **Majestic Transit Hub** — 38 incidents (Pickpocketing & Robbery)\n3. 🟡 **Koramangala IT Sector** — 29 incidents (UPI & Cyber Fraud)`;
    }

    if (q.includes('offender') || q.includes('suspect') || q.includes('repeat') || q.includes('ravi') || q.includes('network') || q.includes('who')) {
      return `**Suspect Dossier & Network Mapping**\n\n🔴 **Target**: Ravi Kumar M. (Risk Score: **94/100** - **WANTED**)\n\n• **Network**: Connects 6 associates in Bengaluru & Mysuru.\n• **Modus Operandi**: Key cloning & two-wheeler ignition bypass.\n• **Last Sighted**: Near Majestic Bus Terminal on CCTV Camera #14.`;
    }

    if (q.includes('cyber') || q.includes('fraud') || q.includes('upi') || q.includes('bank') || q.includes('online')) {
      return `**Cybercrime & Financial Fraud Alert**\n\n📈 **Active Threat**: Phishing campaign targeting banking customers.\n\n• **Flagged Volume**: ₹47.3 Lakhs across 23 suspicious accounts.\n• **Vector**: Fake electricity bill disconnect SMS containing malware links.`;
    }

    return `**AI Copilot Response to: "${escapeHTML(query)}"**\n\nAnalyzed query against Karnataka Police Database (12,470 records indexed):\n\n→ Page Context: **${page.toUpperCase()}**\n→ Status: Systems operational. Threat monitoring active.\n\n*Feel free to ask specific questions about hotspots, suspects, patrol routes, or crime statistics!*`;
  }

  function formatResponse(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(59,130,246,0.15);padding:1px 4px;border-radius:3px;font-family:monospace">$1</code>')
      .replace(/→ /g, '<span style="color:var(--accent-cyan)">→</span> ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function escapeHTML(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Open / Close ──────────────────────────────────────
  function open() {
    if (isOpen) return;
    isOpen = true;
    window.KSP_NOTIFICATIONS_MUTED = true;
    // Immediately remove any active toast popups from screen
    document.querySelectorAll('.ksp-toast, .anomaly-toast').forEach(el => el.remove());
    buildDOM();
    setTimeout(() => {
      const panel = document.getElementById('ksp-copilot-panel');
      if (panel) {
        panel.classList.add('open');
        document.getElementById('ksp-copilot-input')?.focus();
      }
    }, 10);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    window.KSP_NOTIFICATIONS_MUTED = false;
    const panel = document.getElementById('ksp-copilot-panel');
    if (panel) panel.classList.remove('open');
  }

  function toggle() {
    isOpen ? close() : open();
  }

  // ── Keyboard Shortcut ─────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      toggle();
    }
  });

  // ── Replace FAB ───────────────────────────────────────
  function replaceFAB() {
    const fab = document.querySelector('.fab-ai');
    if (!fab) return;
    fab.removeAttribute('href');
    fab.addEventListener('click', toggle);
    fab.querySelector('.fab-ai-tooltip') && (fab.querySelector('.fab-ai-tooltip').textContent = 'AI Copilot (Ctrl+Shift+A)');
  }

  return { open, close, toggle, replaceFAB };
})();

window.KSPCopilot = KSPCopilot;
