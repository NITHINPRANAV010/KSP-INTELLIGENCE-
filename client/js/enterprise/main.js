/* =========================================================
   MAIN.JS — Enterprise Module Loader (Dependency Injection Router)
   KSP AI Crime Intelligence Command Center — Phase 5
   ========================================================= */

(function () {
  'use strict';

  // Determine path offset depending on whether the page is root or inside /pages/
  const isRoot = !window.location.pathname.includes('/pages/');
  const basePath = isRoot ? 'js/enterprise/' : '../js/enterprise/';
  const clientPath = isRoot ? 'js/' : '../js/';

  // Enterprise scripts to load in order
  const SCRIPTS = [
    basePath + 'auth.js',
    basePath + 'cases.js',
    basePath + 'evidence.js',
    basePath + 'audit.js',
    basePath + 'notifications.js',
    basePath + 'custom-dashboard.js',
    basePath + 'advanced-search.js',
    basePath + 'security.js',
    basePath + 'system-health.js',
    basePath + 'onboarding.js',
    clientPath + 'api-client.js'
  ];

  // Load scripts sequentially to maintain order and dependency integrity
  function loadScript(index) {
    if (index >= SCRIPTS.length) {
      console.log('=== KSP Enterprise Platform Engines Initialized Successfully ===');
      // Dispatch ready event
      window.dispatchEvent(new Event('ksp_enterprise_ready'));
      return;
    }

    const scriptPath = SCRIPTS[index];
    const scriptEl = document.createElement('script');
    scriptEl.src = scriptPath;
    scriptEl.async = false; // Maintain execution order
    scriptEl.onload = () => loadScript(index + 1);
    scriptEl.onerror = () => {
      console.error(`Failed to load enterprise module: ${scriptPath}`);
      loadScript(index + 1);
    };

    document.head.appendChild(scriptEl);
  }

  // Kickstart loading process
  loadScript(0);

})();
