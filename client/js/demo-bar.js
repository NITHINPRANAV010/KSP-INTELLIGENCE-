/* =========================================================
   DEMO-BAR.JS — KSP Demo Guide Bar (injected on every page)
   Provides judges with instant navigation to key features.
   ========================================================= */

(function () {
  'use strict';

  function injectDemoBar() {
    // Don't inject if already present
    if (document.getElementById('ksp-demo-bar')) return;

    // Detect relative prefix (root vs pages/)
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const prefix = isInPagesDir ? '' : 'pages/';
    const rootPrefix = isInPagesDir ? '../' : '';

    const steps = [
      { num: '1', label: 'Dashboard',          href: rootPrefix + 'index.html',     emoji: '🏠' },
      { num: '2', label: 'AI Investigation',   href: prefix + 'investigation.html',  emoji: '🤖' },
      { num: '3', label: 'Heatmap',            href: prefix + 'heatmap.html',        emoji: '🗺️' },
      { num: '4', label: 'AI Forecast',        href: prefix + 'predictive.html',     emoji: '🧠' },
      { num: '5', label: 'Commander Briefing', href: prefix + 'commander.html',      emoji: '🎖️' },
      { num: '6', label: 'Scenario Sim',       href: prefix + 'scenario.html',       emoji: '🧪' },
      { num: '7', label: 'Criminal Network',   href: prefix + 'network.html',        emoji: '🕸️' },
      { num: '8', label: 'Offenders',          href: prefix + 'offenders.html',      emoji: '👤' },
      { num: '9', label: 'Patrol AI',          href: prefix + 'patrol.html',         emoji: '🚔' },
    ];

    const bar = document.createElement('div');
    bar.id = 'ksp-demo-bar';
    bar.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: calc(50% + 120px);
      transform: translateX(-50%);
      background: rgba(10,10,20,0.92);
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 99px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 9999;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.15);
      max-width: calc(100vw - 40px);
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    `;

    // Label
    const label = document.createElement('span');
    label.textContent = '🎯';
    label.style.cssText = 'font-size:0.75rem;flex-shrink:0;';
    bar.appendChild(label);

    // Steps
    steps.forEach(step => {
      const a = document.createElement('a');
      a.href = step.href;
      a.title = step.label;
      a.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 99px;
        font-size: 0.68rem;
        font-weight: 600;
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        border: 1px solid transparent;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.15s;
      `;
      a.innerHTML = `<span style="width:14px;height:14px;border-radius:50%;background:rgba(139,92,246,0.25);color:#c4b5fd;display:inline-flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:800;flex-shrink:0">${step.num}</span>${step.emoji} ${step.label}`;

      a.addEventListener('mouseenter', () => {
        a.style.background = 'rgba(139,92,246,0.18)';
        a.style.borderColor = 'rgba(139,92,246,0.4)';
        a.style.color = '#e2e8f0';
      });
      a.addEventListener('mouseleave', () => {
        a.style.background = '';
        a.style.borderColor = 'transparent';
        a.style.color = 'rgba(255,255,255,0.6)';
      });

      bar.appendChild(a);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Hide demo bar';
    closeBtn.style.cssText = `
      background: none; border: none; color: rgba(255,255,255,0.3);
      font-size: 0.7rem; cursor: pointer; padding: 2px 4px; flex-shrink: 0;
    `;
    closeBtn.addEventListener('click', () => bar.remove());
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDemoBar);
  } else {
    injectDemoBar();
  }

  window.KSPDemoBar = { inject: injectDemoBar };
})();
