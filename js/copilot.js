/* =========================================================
   COPILOT.JS — Page-Context AI Copilot Sidebar
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPCopilot = (() => {

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

  // AI response simulation
  const AI_RESPONSES = {
    'Why did crimes spike in Bengaluru today?': `**Analysis: Bengaluru Crime Spike**\n\nBased on pattern analysis, 3 converging factors explain today's spike:\n\n→ **Weekend Effect**: Historical data shows 28% higher weekend crime rate\n→ **Festival Proximity**: Upcoming local event increases crowd density in commercial zones by ~40%\n→ **Patrol Gap**: Unit P-7 redeployment left Shivajinagar area with 35% reduced coverage since 06:00\n\n**AI Confidence: 91%**\n\nRecommendation: Immediately restore patrol coverage in Shivajinagar. Priority areas: Bus Stand, KG Road, Majestic.`,

    'Summarize today\'s intelligence briefing': `**Morning Intelligence Summary**\n\n🔴 **2 Critical** | 🟡 **2 High** | 🔵 **2 Medium**\n\n→ Vehicle theft cluster forming — Shivajinagar/Majestic (+34%)\n→ 6-member criminal network active across 3 districts\n→ UPI fraud anomaly: ₹47.3L in 2 hours (23 transactions)\n→ OFF001 (Ravi Kumar) spotted near Majestic — WANTED\n\n**Prediction**: Next 48h vehicle theft risk CRITICAL (94% confidence)\n**Recommended action**: Deploy 4 units to Shivajinagar immediately`,

    default: `**AI Analysis**\n\nProcessing intelligence database across 30 Karnataka districts...\n\nBased on current data:\n\n→ 5 districts at HIGH or CRITICAL risk\n→ 312 repeat offenders being monitored\n→ AI prediction accuracy: 91.4%\n→ 23 AI-generated alerts active today\n\nWould you like me to drill down into a specific area?`,
  };

  let isOpen = false;
  let currentPage = 'default';
  let chatHistory = [];

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
        <div class="copilot-input-row">
          <textarea id="copilot-input" class="copilot-input" rows="1" placeholder="Ask anything about ${ctx.label}…"></textarea>
          <button class="btn btn-primary btn-sm" id="copilot-send" style="align-self:flex-end;padding:8px 10px">
            <i data-lucide="send" style="width:13px;height:13px"></i>
          </button>
        </div>
        <div style="font-size:0.625rem;color:var(--text-muted);text-align:center;margin-top:4px">
          Ctrl+Shift+A · Page-aware intelligence
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
        sendMessage(q);
      });
    });

    const input = document.getElementById('copilot-input');
    const sendBtn = document.getElementById('copilot-send');

    sendBtn?.addEventListener('click', () => {
      const val = input.value.trim();
      if (val) sendMessage(val);
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = input.value.trim();
        if (val) sendMessage(val);
      }
    });
  }

  // ── Send Message ──────────────────────────────────────
  function sendMessage(text) {
    const messages = document.getElementById('copilot-messages');
    const input = document.getElementById('copilot-input');
    if (!messages) return;

    if (input) input.value = '';

    // User bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'copilot-msg copilot-user';
    userBubble.innerHTML = `
      <div class="copilot-avatar copilot-avatar-user">DCP</div>
      <div class="copilot-bubble copilot-bubble-user">${text}</div>
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

    // Simulate AI response
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const typingEl = document.getElementById('copilot-typing');
      if (typingEl) typingEl.remove();

      const response = AI_RESPONSES[text] || AI_RESPONSES.default;
      const aiBubble = document.createElement('div');
      aiBubble.className = 'copilot-msg copilot-ai';
      aiBubble.innerHTML = `
        <div class="copilot-avatar copilot-avatar-ai">
          <i data-lucide="bot" style="width:13px;height:13px;color:white"></i>
        </div>
        <div class="copilot-bubble copilot-bubble-ai copilot-response">
          ${formatResponse(response)}
          <div class="copilot-response-actions">
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
    }, delay);
  }

  function formatResponse(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/→ /g, '<span style="color:var(--accent-cyan)">→</span> ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  // ── Open / Close ──────────────────────────────────────
  function open() {
    if (isOpen) return;
    isOpen = true;
    buildDOM();
    setTimeout(() => {
      const panel = document.getElementById('ksp-copilot-panel');
      if (panel) panel.classList.add('open');
    }, 10);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
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
