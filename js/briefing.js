/* =========================================================
   BRIEFING.JS — AI Morning Intelligence Briefing (Typewriter)
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPBriefing = (() => {

  const BRIEFINGS = [
    {
      date: 'Today',
      critical: ['Bengaluru Urban', 'Kalaburagi'],
      highlights: [
        { icon: '🔴', text: '<strong style="color:#EF4444">34% crime spike</strong> in Bengaluru Urban — vehicle theft cluster forming in Shivajinagar and Majestic areas.' },
        { icon: '🕸', text: 'New <strong style="color:#22D3EE">6-member criminal network</strong> identified spanning Bengaluru, Mysuru, and Hubballi-Dharwad districts.' },
        { icon: '💻', text: 'UPI fraud anomaly: <strong style="color:#F59E0B">₹47.3 Lakhs</strong> across 23 transactions in 2 hours — same IP cluster in Koramangala.' },
        { icon: '👤', text: 'High-risk offender <strong>Ravi Kumar (OFF001)</strong> — Risk Score 94 — spotted near Majestic Bus Stand. Status: WANTED.' },
        { icon: '🔮', text: 'AI predicts <strong style="color:#EF4444">+28% vehicle theft</strong> in next 48 hours. Immediate patrol redeployment to Shivajinagar recommended.' },
        { icon: '📍', text: 'Narcotics route activation detected: Hubballi–Belagavi corridor showing <strong style="color:#F59E0B">+22%</strong> activity over baseline.' },
        { icon: '✅', text: 'Solve rate improving: <strong style="color:#22C55E">60.1%</strong> YTD cases resolved. Mysuru district leads at 68% clearance rate.' },
      ],
      recommendations: [
        'Deploy <strong>4 additional units</strong> — Shivajinagar & Majestic areas',
        'Issue <strong>cyber advisory</strong> to banks regarding UPI fraud cluster',
        'Activate <strong>naka points</strong> on NH-67 (Hubballi–Belagavi corridor)',
        'Coordinate <strong>plainclothes operation</strong> near Mysuru Palace area this weekend',
        'Issue <strong>BOLO</strong> for KA-01-MF-4892 (linked to OFF001)',
      ],
      activeAlerts: 5,
      aiAccuracy: '91.4%',
      lastUpdated: '2 minutes ago',
    }
  ];

  let currentBriefing = BRIEFINGS[0];
  let typewriterQueue = [];
  let isTyping = false;
  let containerId = null;

  // ── Typewriter Engine ─────────────────────────────────
  function typewrite(el, html, speed = 18, onDone) {
    // Strip HTML to get plaintext length, then reveal HTML char by char
    // For simplicity, we'll fade in full HTML with a staged reveal effect
    el.innerHTML = '';
    el.style.opacity = '0';

    // Fade in approach — reveal content in segments
    const segments = html.split(/(<[^>]+>)/g);
    let builtHTML = '';
    let charIndex = 0;
    const allChars = html.replace(/<[^>]+>/g, '').split('');
    let htmlCursor = 0;

    const interval = setInterval(() => {
      if (charIndex >= allChars.length) {
        clearInterval(interval);
        el.innerHTML = html;
        el.style.opacity = '1';
        if (onDone) onDone();
        return;
      }

      // Advance through HTML, skipping tags
      while (htmlCursor < html.length) {
        if (html[htmlCursor] === '<') {
          // Skip entire tag
          while (htmlCursor < html.length && html[htmlCursor] !== '>') htmlCursor++;
          htmlCursor++; // skip '>'
          builtHTML = html.substring(0, htmlCursor);
          break;
        } else {
          htmlCursor++;
          charIndex++;
          builtHTML = html.substring(0, htmlCursor) + '<span class="typing-cursor-char">|</span>';
          break;
        }
      }

      el.innerHTML = builtHTML;
      el.style.opacity = '1';
    }, speed);

    return interval;
  }

  // ── Render Briefing ───────────────────────────────────
  function renderBriefing(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const b = currentBriefing;

    container.innerHTML = `
      <!-- Header -->
      <div class="briefing-header">
        <div class="briefing-ai-icon">
          <i data-lucide="brain-circuit" style="width:18px;height:18px;color:white"></i>
        </div>
        <div style="flex:1">
          <div class="briefing-title">AI Morning Intelligence Briefing</div>
          <div class="briefing-meta">
            <span class="briefing-meta-dot"></span>
            Auto-generated · Updated ${b.lastUpdated} · AI Accuracy: <strong style="color:var(--accent-cyan)">${b.aiAccuracy}</strong>
          </div>
        </div>
        <div class="briefing-actions">
          <span class="badge badge-critical">${b.activeAlerts} Critical</span>
          <button class="btn btn-ghost btn-sm" id="briefing-listen" data-tooltip="Listen">
            <i data-lucide="volume-2" style="width:14px;height:14px"></i>
          </button>
          <button class="btn btn-ghost btn-sm" id="briefing-refresh" data-tooltip="Refresh Intelligence">
            <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.print()" data-tooltip="Export PDF">
            <i data-lucide="file-down" style="width:14px;height:14px"></i>
          </button>
        </div>
      </div>

      <!-- Critical Districts -->
      <div class="briefing-section" id="brief-districts">
        <div class="briefing-section-title">
          <i data-lucide="shield-alert" style="width:13px;height:13px;color:var(--critical)"></i>
          Critical Districts Today
        </div>
        <div class="briefing-districts">
          ${b.critical.map(d => `<span class="briefing-district-chip">${d}</span>`).join('')}
        </div>
      </div>

      <!-- Intelligence Points -->
      <div class="briefing-section">
        <div class="briefing-section-title">
          <i data-lucide="activity" style="width:13px;height:13px;color:var(--accent-cyan)"></i>
          Intelligence Summary
        </div>
        <div class="briefing-points" id="briefing-points-container">
          ${b.highlights.map((h, i) => `
            <div class="briefing-point-item" id="brief-point-${i}" style="opacity:0;transform:translateX(-10px)">
              <span class="briefing-point-icon">${h.icon}</span>
              <span class="briefing-point-text">${h.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="briefing-section" id="brief-recs" style="opacity:0">
        <div class="briefing-section-title">
          <i data-lucide="navigation" style="width:13px;height:13px;color:var(--success)"></i>
          AI Patrol Recommendations
        </div>
        <div class="briefing-recs">
          ${b.recommendations.map((r, i) => `
            <div class="briefing-rec-item">
              <div class="briefing-rec-num">${i + 1}</div>
              <div class="briefing-rec-text">${r}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="briefing-buttons" id="brief-btns" style="opacity:0">
        <a href="${window.location.pathname.includes('/pages/') ? '../' : ''}pages/reports.html?type=executive" class="btn btn-primary">
          <i data-lucide="file-text" style="width:14px;height:14px"></i>
          Generate Full Briefing
        </a>
        <button class="btn btn-secondary btn-sm" onclick="KSPBriefing.speak()">
          <i data-lucide="volume-2" style="width:14px;height:14px"></i>
          Listen
        </button>
        <button class="btn btn-secondary btn-sm" onclick="KSPBriefing.refresh()">
          <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
          Refresh
        </button>
        <a href="${window.location.pathname.includes('/pages/') ? '../' : ''}pages/patrol.html" class="btn btn-secondary btn-sm">
          <i data-lucide="navigation" style="width:14px;height:14px"></i>
          Deploy Patrols
        </a>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ nodes: [container] });

    // Bind refresh/listen
    document.getElementById('briefing-refresh')?.addEventListener('click', () => refresh());
    document.getElementById('briefing-listen')?.addEventListener('click', () => speak());

    // Animate points in sequence
    animatePoints(b.highlights.length);
  }

  function animatePoints(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.getElementById(`brief-point-${i}`);
        if (el) {
          el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        }
      }, 300 + i * 180);
    }

    // Show recommendations after all points
    setTimeout(() => {
      const recs = document.getElementById('brief-recs');
      const btns = document.getElementById('brief-btns');
      if (recs) { recs.style.transition = 'opacity 0.5s ease'; recs.style.opacity = '1'; }
      setTimeout(() => {
        if (btns) { btns.style.transition = 'opacity 0.5s ease'; btns.style.opacity = '1'; }
      }, 300);
    }, 300 + count * 180 + 300);
  }

  // ── Refresh ───────────────────────────────────────────
  function refresh(cid) {
    const id = cid || containerId;
    if (!id) return;
    containerId = id;
    const container = document.getElementById(id);
    if (!container) return;

    // Show skeleton
    container.innerHTML = `
      <div class="briefing-skeleton">
        <div class="skeleton skeleton-title" style="width:40%;margin-bottom:16px"></div>
        <div class="skeleton skeleton-text" style="width:95%"></div>
        <div class="skeleton skeleton-text" style="width:88%"></div>
        <div class="skeleton skeleton-text" style="width:92%"></div>
        <div class="skeleton skeleton-text" style="width:78%"></div>
        <div class="skeleton skeleton-text" style="width:85%"></div>
        <div style="margin-top:16px;display:flex;gap:8px">
          <div class="skeleton" style="width:160px;height:36px;border-radius:8px"></div>
          <div class="skeleton" style="width:100px;height:36px;border-radius:8px"></div>
        </div>
      </div>
    `;

    // Re-render after simulated "fetch"
    setTimeout(() => renderBriefing(id), 1400);
  }

  // ── Voice ─────────────────────────────────────────────
  function speak() {
    if (!('speechSynthesis' in window)) {
      showToast('Voice not supported in this browser', 'warning');
      return;
    }

    const b = currentBriefing;
    const text = [
      `Good morning. AI Intelligence Briefing for ${b.date}.`,
      `${b.critical.length} districts are at critical risk today: ${b.critical.join(' and ')}.`,
      ...b.highlights.map(h => h.text.replace(/<[^>]+>/g, '')),
      `AI Recommendations: `,
      ...b.recommendations.map((r, i) => `${i+1}. ${r.replace(/<[^>]+>/g, '')}`),
    ].join(' ');

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
    showToast('Playing voice briefing…', 'info');
  }

  // ── Init ──────────────────────────────────────────────
  function init(cid) {
    containerId = cid;
    renderBriefing(cid);
  }

  return { init, refresh, speak, renderBriefing };
})();

window.KSPBriefing = KSPBriefing;
