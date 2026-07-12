/* =========================================================
   COMMAND.JS — Global AI Command Palette (Ctrl+K)
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPCommand = (() => {
  // ── Command Registry ──────────────────────────────────
  const BASE = window.location.pathname.includes('/pages/') ? '../' : '';

  const COMMANDS = [
    // Navigation
    { id:'nav-dashboard',   group:'Navigate', icon:'layout-dashboard', label:'Go to Dashboard',          shortcut:'D', action:() => goto(BASE+'index.html') },
    { id:'nav-investigate', group:'Navigate', icon:'bot',              label:'Open AI Investigation',    shortcut:'I', action:() => goto(BASE+'pages/investigation.html') },
    { id:'nav-heatmap',     group:'Navigate', icon:'map',              label:'Crime Heatmap',             shortcut:'H', action:() => goto(BASE+'pages/heatmap.html') },
    { id:'nav-analytics',   group:'Navigate', icon:'bar-chart-3',      label:'Crime Analytics',           shortcut:'A', action:() => goto(BASE+'pages/analytics.html') },
    { id:'nav-network',     group:'Navigate', icon:'git-branch',       label:'Criminal Network Graph',    shortcut:'N', action:() => goto(BASE+'pages/network.html') },
    { id:'nav-offenders',   group:'Navigate', icon:'user-x',           label:'Repeat Offender Registry',  shortcut:'O', action:() => goto(BASE+'pages/offenders.html') },
    { id:'nav-predictive',  group:'Navigate', icon:'brain-circuit',    label:'Predictive Intelligence',   shortcut:'P', action:() => goto(BASE+'pages/predictive.html') },
    { id:'nav-patrol',      group:'Navigate', icon:'navigation',       label:'Patrol Deployment Map',     shortcut:'',  action:() => goto(BASE+'pages/patrol.html') },
    { id:'nav-district',    group:'Navigate', icon:'map-pin',          label:'District Intelligence',     shortcut:'',  action:() => goto(BASE+'pages/district.html') },
    { id:'nav-timeline',    group:'Navigate', icon:'clock',            label:'Crime Timeline Replay',     shortcut:'T', action:() => goto(BASE+'pages/timeline.html') },
    { id:'nav-alerts',      group:'Navigate', icon:'bell',             label:'Alert Center',              shortcut:'',  action:() => goto(BASE+'pages/alerts.html') },
    { id:'nav-reports',     group:'Navigate', icon:'file-text',        label:'Report Generator',          shortcut:'R', action:() => goto(BASE+'pages/reports.html') },
    { id:'nav-users',       group:'Navigate', icon:'users',            label:'User Management',           shortcut:'U', action:() => goto(BASE+'pages/users.html') },
    { id:'nav-settings',    group:'Navigate', icon:'settings',         label:'System Settings',           shortcut:'',  action:() => goto(BASE+'pages/settings.html') },

    // Analyze
    { id:'analyze-blr',     group:'Analyze',  icon:'trending-up',      label:'Show Bengaluru Urban hotspots',         action:() => analyzeCmd('Show crime hotspots in Bengaluru Urban') },
    { id:'analyze-mys',     group:'Analyze',  icon:'trending-up',      label:'Show Mysuru crime analysis',            action:() => analyzeCmd('Show crime analysis for Mysuru') },
    { id:'analyze-cyber',   group:'Analyze',  icon:'wifi',             label:'Highlight cybercrime clusters',         action:() => analyzeCmd('Show cybercrime hotspots and trends') },
    { id:'analyze-network', group:'Analyze',  icon:'git-branch',       label:'Show criminal network associations',    action:() => goto(BASE+'pages/network.html') },
    { id:'analyze-compare', group:'Analyze',  icon:'sliders-horizontal',label:'Compare Bengaluru vs Mysuru',          action:() => analyzeCmd('Compare crime statistics between Bengaluru and Mysuru') },
    { id:'analyze-repeat',  group:'Analyze',  icon:'user-x',           label:'Find high-risk repeat offenders',       action:() => goto(BASE+'pages/offenders.html') },
    { id:'analyze-vehicle', group:'Analyze',  icon:'car',              label:'Vehicle theft in last 30 days',         action:() => analyzeCmd('Show all vehicle theft cases in last 30 days') },
    { id:'analyze-narco',   group:'Analyze',  icon:'alert-triangle',   label:'Narcotics activity — Hubballi corridor',action:() => analyzeCmd('Show narcotics activity along Hubballi corridor') },

    // Predict
    { id:'predict-48h',     group:'Predict',  icon:'brain-circuit',    label:'Predict crimes — next 48 hours',        action:() => goto(BASE+'pages/predictive.html') },
    { id:'predict-blr',     group:'Predict',  icon:'brain-circuit',    label:'Predict Bengaluru tomorrow',            action:() => analyzeCmd('Predict tomorrow\'s crime for Bengaluru Urban') },
    { id:'predict-weekend', group:'Predict',  icon:'calendar',         label:'Weekend crime forecast',                action:() => analyzeCmd('Forecast crimes for this weekend across all districts') },
    { id:'predict-patrol',  group:'Predict',  icon:'navigation',       label:'Recommend patrol deployment',           action:() => goto(BASE+'pages/patrol.html') },
    { id:'predict-timeline',group:'Predict',  icon:'play-circle',      label:'Replay crime timeline',                 action:() => goto(BASE+'pages/timeline.html') },

    // Generate
    { id:'gen-executive',   group:'Generate', icon:'briefcase',        label:'Generate Executive Summary (DGP)',      action:() => generateReport('executive') },
    { id:'gen-district',    group:'Generate', icon:'map-pin',          label:'Generate District Report',              action:() => generateReport('district') },
    { id:'gen-hotspot',     group:'Generate', icon:'flame',            label:'Generate Hotspot Analysis Report',      action:() => generateReport('hotspot') },
    { id:'gen-network',     group:'Generate', icon:'git-branch',       label:'Generate Criminal Network Report',      action:() => generateReport('network') },
    { id:'gen-trend',       group:'Generate', icon:'trending-up',      label:'Generate Crime Trend Report',           action:() => generateReport('trend') },
    { id:'gen-briefing',    group:'Generate', icon:'sparkles',         label:'Refresh Morning Intelligence Briefing', action:() => refreshBriefing() },

    // Quick Actions
    { id:'qa-fullscreen',   group:'View',     icon:'maximize-2',       label:'Toggle Fullscreen',                     shortcut:'F', action:() => toggleFullscreen() },
    { id:'qa-alert-center', group:'View',     icon:'bell',             label:'Open Alert Center',                     action:() => goto(BASE+'pages/alerts.html') },
    { id:'qa-new-case',     group:'Action',   icon:'plus-circle',      label:'Log New Incident',                      action:() => showToast('New incident form opening…', 'info') },
    { id:'qa-bolo',         group:'Action',   icon:'radio',            label:'Issue BOLO Alert',                      action:() => showToast('BOLO alert system opening…', 'warning') },
    { id:'qa-patrol-deploy',group:'Action',   icon:'navigation',       label:'Emergency Patrol Deployment',           action:() => goto(BASE+'pages/patrol.html') },
  ];

  // Natural language → command mapping
  const NL_PATTERNS = [
    { pattern: /hotspot|crime.*(bengaluru|blr)/i,  cmd: 'nav-heatmap' },
    { pattern: /predict|forecast|tomorrow|48.hour/i, cmd: 'nav-predictive' },
    { pattern: /repeat.offend|high.risk/i,          cmd: 'nav-offenders' },
    { pattern: /network|associat|link/i,            cmd: 'nav-network' },
    { pattern: /report|summary|dgp|brief/i,         cmd: 'gen-executive' },
    { pattern: /cyber|fraud|upi/i,                  cmd: 'analyze-cyber' },
    { pattern: /compare|bengaluru.*mysuru|vs/i,     cmd: 'analyze-compare' },
    { pattern: /alert|notification/i,               cmd: 'nav-alerts' },
    { pattern: /patrol|deploy|checkpost/i,          cmd: 'nav-patrol' },
    { pattern: /district|profile/i,                 cmd: 'nav-district' },
    { pattern: /timeline|replay|playback/i,         cmd: 'nav-timeline' },
    { pattern: /vehicle.theft|car.stolen/i,         cmd: 'analyze-vehicle' },
    { pattern: /narco|drug/i,                       cmd: 'analyze-narco' },
  ];

  // State
  let isOpen = false;
  let selectedIndex = 0;
  let currentQuery = '';
  let filteredCommands = [];
  let commandHistory = JSON.parse(localStorage.getItem('ksp_cmd_history') || '[]');

  // ── Helpers ───────────────────────────────────────────
  function goto(url) {
    close();
    // Small delay for close animation
    setTimeout(() => { window.location.href = url; }, 180);
  }

  function analyzeCmd(text) {
    close();
    // Navigate to investigation and prefill
    setTimeout(() => {
      const base = window.location.pathname.includes('/pages/') ? '../' : '';
      window.location.href = base + 'pages/investigation.html?q=' + encodeURIComponent(text);
    }, 180);
  }

  function generateReport(type) {
    close();
    const base = window.location.pathname.includes('/pages/') ? '../' : '';
    setTimeout(() => { window.location.href = base + 'pages/reports.html?type=' + type; }, 180);
  }

  function refreshBriefing() {
    close();
    if (window.KSPBriefing) {
      KSPBriefing.refresh();
      showToast('Intelligence briefing refreshing…', 'info');
    }
  }

  function toggleFullscreen() {
    close();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }

  // ── DOM Build ──────────────────────────────────────────
  function buildDOM() {
    if (document.getElementById('ksp-command-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ksp-command-overlay';
    overlay.innerHTML = `
      <div class="cmd-backdrop" id="cmd-backdrop"></div>
      <div class="cmd-palette" id="cmd-palette" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="cmd-search-row">
          <div class="cmd-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <input class="cmd-input" id="cmd-input" placeholder="Search commands, navigate, analyze…" autocomplete="off" spellcheck="false">
          <div class="cmd-esc-badge">ESC</div>
        </div>
        <div class="cmd-body" id="cmd-body">
          <div class="cmd-results" id="cmd-results"></div>
        </div>
        <div class="cmd-footer">
          <span class="cmd-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span class="cmd-hint"><kbd>↵</kbd> Execute</span>
          <span class="cmd-hint"><kbd>ESC</kbd> Close</span>
          <span class="cmd-hint" style="margin-left:auto">KSP AI · <span style="color:var(--accent-cyan)">Intelligence Mode</span></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Events
    document.getElementById('cmd-backdrop').addEventListener('click', close);
    const input = document.getElementById('cmd-input');
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeydown);
  }

  // ── Render Results ────────────────────────────────────
  function renderResults(query) {
    const body = document.getElementById('cmd-results');
    if (!body) return;

    // NL match check
    let nlMatch = null;
    if (query.length > 3) {
      for (const p of NL_PATTERNS) {
        if (p.pattern.test(query)) {
          nlMatch = COMMANDS.find(c => c.id === p.cmd);
          break;
        }
      }
    }

    if (!query) {
      // Show recent + quick categories
      const recent = commandHistory.slice(0, 3).map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
      const quickNav = COMMANDS.filter(c => c.group === 'Navigate').slice(0, 5);
      filteredCommands = [...recent, ...COMMANDS.filter(c => c.group === 'Generate').slice(0, 3)];

      let html = '';
      if (recent.length) {
        html += renderGroup('Recent', recent);
      }
      html += renderGroup('Navigate', COMMANDS.filter(c => c.group === 'Navigate'));
      html += renderGroup('Generate Report', COMMANDS.filter(c => c.group === 'Generate'));
      body.innerHTML = html;
    } else {
      const q = query.toLowerCase();
      filteredCommands = COMMANDS.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.shortcut && c.shortcut.toLowerCase() === q)
      );

      if (nlMatch && !filteredCommands.find(c => c.id === nlMatch.id)) {
        filteredCommands.unshift({ ...nlMatch, _nlMatch: true });
      }

      if (!filteredCommands.length) {
        body.innerHTML = `
          <div class="cmd-empty">
            <div style="font-size:1.5rem;margin-bottom:8px">🤖</div>
            <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">Ask AI: "${query}"</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Press Enter to open AI Investigation with this query</div>
          </div>`;
        filteredCommands = [{ id:'ai-query', label: `Ask AI: "${query}"`, icon:'bot', group:'AI', action:() => analyzeCmd(query) }];
        return;
      }

      // Group results
      const groups = {};
      filteredCommands.forEach(c => {
        if (!groups[c.group]) groups[c.group] = [];
        groups[c.group].push(c);
      });

      body.innerHTML = Object.entries(groups).map(([g, cmds]) => renderGroup(g, cmds)).join('');
    }

    selectedIndex = 0;
    highlightSelected();
    attachResultClicks();
  }

  function renderGroup(name, cmds) {
    if (!cmds.length) return '';
    return `
      <div class="cmd-group-label">${name}</div>
      ${cmds.map((c, i) => `
        <div class="cmd-result-item" data-id="${c.id}" data-idx="${filteredCommands.indexOf(c)}">
          <div class="cmd-result-icon">
            <i data-lucide="${c.icon || 'terminal'}" style="width:14px;height:14px"></i>
          </div>
          <div class="cmd-result-label">${c._nlMatch ? '<span class="cmd-ai-tag">AI Match</span> ' : ''}${c.label}</div>
          ${c.shortcut ? `<kbd class="cmd-shortcut">${c.shortcut}</kbd>` : ''}
        </div>
      `).join('')}
    `;
  }

  function attachResultClicks() {
    document.querySelectorAll('.cmd-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        executeCommand(id);
      });
      el.addEventListener('mouseenter', () => {
        selectedIndex = parseInt(el.dataset.idx);
        highlightSelected();
      });
    });
    if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('cmd-results')] });
  }

  function highlightSelected() {
    document.querySelectorAll('.cmd-result-item').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
      if (i === selectedIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function executeCommand(id) {
    const cmd = COMMANDS.find(c => c.id === id) || filteredCommands.find(c => c.id === id);
    if (!cmd) return;
    // Save to history
    commandHistory = [id, ...commandHistory.filter(h => h !== id)].slice(0, 10);
    localStorage.setItem('ksp_cmd_history', JSON.stringify(commandHistory));
    cmd.action();
  }

  // ── Events ─────────────────────────────────────────────
  function onInput(e) {
    currentQuery = e.target.value;
    selectedIndex = 0;
    renderResults(currentQuery);
  }

  function onKeydown(e) {
    const items = document.querySelectorAll('.cmd-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      highlightSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) executeCommand(selected.id);
      else if (currentQuery) analyzeCmd(currentQuery);
    } else if (e.key === 'Escape') {
      close();
    }
  }

  // ── Open / Close ──────────────────────────────────────
  function open() {
    if (isOpen) return;
    isOpen = true;
    buildDOM();
    const overlay = document.getElementById('ksp-command-overlay');
    overlay.classList.add('open');
    const input = document.getElementById('cmd-input');
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 60);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const overlay = document.getElementById('ksp-command-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Global Keyboard Shortcut ──────────────────────────
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
    }
    // ESC anywhere
    if (e.key === 'Escape' && isOpen) close();
  });

  // ── Public API ────────────────────────────────────────
  return { open, close, goto, showToast };
})();

// ── Toast Notification System ─────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('ksp-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ksp-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icons = { info: 'info', success: 'check-circle', warning: 'alert-triangle', error: 'alert-octagon', critical: 'zap' };
  const icon = icons[type] || 'info';

  toast.className = `ksp-toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${icon}" style="width:14px;height:14px"></i></div>
    <div class="toast-msg">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i data-lucide="x" style="width:12px;height:12px"></i>
    </button>
  `;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

window.KSPCommand = KSPCommand;
window.showToast = showToast;
