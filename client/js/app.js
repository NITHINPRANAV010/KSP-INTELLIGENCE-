/* =========================================================
   APP.JS — Sidebar, Navigation, Theme, Clock
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  // ── Sidebar Toggle ──────────────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const topnav   = document.getElementById('topnav');
  const mainContent = document.getElementById('main-content');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  function applySidebarState() {
    if (!sidebar) return;
    if (sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      topnav?.classList.add('sidebar-collapsed');
      mainContent?.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      topnav?.classList.remove('sidebar-collapsed');
      mainContent?.classList.remove('sidebar-collapsed');
    }
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebarCollapsed = !sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
      applySidebarState();
    });
  }

  applySidebarState();

  // ── Active Nav Highlight ────────────────────────────────
  const navItems = document.querySelectorAll('.nav-item');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navItems.forEach(item => {
    const href = item.getAttribute('href') || '';
    const hrefFile = href.split('/').pop();
    if (
      hrefFile === currentPath ||
      (currentPath === '' && (hrefFile === 'index.html' || href === '../index.html'))
    ) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // ── Live Clock ──────────────────────────────────────────
  function updateClock() {
    const el = document.getElementById('topnav-time');
    if (!el) return;
    const now = new Date();
    const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    el.textContent = `${date}  •  ${time}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ── Stagger Animation ───────────────────────────────────
  function triggerStagger() {
    const items = document.querySelectorAll('.stagger-item');
    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('visible');
      }, i * 80);
    });
  }

  // ── Intersection Observer for cards ────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stagger-item').forEach(el => observer.observe(el));

  // ── Lucide Icons Init ───────────────────────────────────
  if (window.lucide) {
    lucide.createIcons();
  }

  // Run stagger on load
  window.addEventListener('load', () => {
    triggerStagger();
    if (window.lucide) lucide.createIcons();
  });

  // ── Global Search (decorative) ──────────────────────────
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim().toLowerCase();
        if (q) {
          // Route to investigation with query
          window.location.href = `pages/investigation.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }

  // ── Command Palette shortcut ────────────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('global-search')?.focus();
    }
  });

  // ── FAB click → investigation ───────────────────────────
  const fab = document.getElementById('fab-ai');
  if (fab) {
    fab.addEventListener('click', () => {
      // Already handled by href
    });
  }

  // ── Notification badge pulse ─────────────────────────────
  const notifBtn = document.getElementById('notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      window.location.href = 'pages/alerts.html';
    });
  }

  // Expose utility
  window.KSPApp = {
    formatNumber: (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString(),
    formatDate: (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    getRiskClass: (score) => score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 45 ? 'medium' : 'low',
    getRiskLabel: (score) => score >= 85 ? 'Critical' : score >= 65 ? 'High' : score >= 45 ? 'Medium' : 'Low',
  };

})();
