/* =========================================================
   COUNTERS.JS — Animated KPI Number Counters
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  /**
   * Animate a number from 0 to target value.
   * @param {HTMLElement} el - Target element
   * @param {number} target - Target value
   * @param {number} duration - Animation duration in ms
   * @param {string} suffix - Optional suffix ('%', 'K', etc.)
   * @param {number} decimals - Decimal places
   */
  function animateCounter(el, target, duration = 1400, suffix = '', decimals = 0) {
    if (!el) return;

    const startTime = performance.now();
    const start = 0;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = start + (target - start) * eased;

      el.textContent = decimals > 0
        ? current.toFixed(decimals) + suffix
        : Math.round(current).toLocaleString('en-IN') + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = decimals > 0
          ? target.toFixed(decimals) + suffix
          : target.toLocaleString('en-IN') + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  /**
   * Animate sparkline mini-chart within a KPI card.
   * Uses canvas for lightweight rendering.
   */
  function drawSparkline(canvas, data, color = '#3B82F6', fill = true) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 120;
    const H = canvas.offsetHeight || 36;
    canvas.width = W;
    canvas.height = H;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const stepX = W / (data.length - 1);
    const points = data.map((v, i) => ({
      x: i * stepX,
      y: H - ((v - min) / range) * (H - 6) - 3,
    }));

    ctx.clearRect(0, 0, W, H);

    // Fill gradient
    if (fill) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(points[0].x, H);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i].x + points[i - 1].x) / 2;
      ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // End dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Initialize all KPI cards on the page
   */
  function initKPICards() {
    const cards = document.querySelectorAll('[data-kpi]');
    cards.forEach((card, idx) => {
      const value    = parseFloat(card.dataset.value || '0');
      const suffix   = card.dataset.suffix || '';
      const decimals = parseInt(card.dataset.decimals || '0');
      const color    = card.dataset.color || '#3B82F6';
      const sparkRaw = card.dataset.spark;

      const counterEl = card.querySelector('.kpi-value');
      const sparkCanvas = card.querySelector('.kpi-sparkline canvas');

      // Stagger delay per card
      setTimeout(() => {
        if (counterEl) {
          animateCounter(counterEl, value, 1200, suffix, decimals);
        }
        if (sparkCanvas && sparkRaw) {
          try {
            const sparkData = JSON.parse(sparkRaw);
            drawSparkline(sparkCanvas, sparkData, color);
          } catch (e) {}
        }
      }, idx * 100);
    });
  }

  /**
   * Initialize all standalone counter elements
   */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach((el, i) => {
      const target   = parseFloat(el.dataset.count);
      const suffix   = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0');
      const delay    = parseInt(el.dataset.delay || '0');

      setTimeout(() => {
        animateCounter(el, target, 1400, suffix, decimals);
      }, delay);
    });
  }

  /**
   * Draw sparklines by selector
   */
  function initSparklines() {
    document.querySelectorAll('[data-sparkline]').forEach(canvas => {
      if (!(canvas instanceof HTMLCanvasElement)) return;
      try {
        const data  = JSON.parse(canvas.dataset.sparkline);
        const color = canvas.dataset.color || '#3B82F6';
        drawSparkline(canvas, data, color);
      } catch (e) {}
    });
  }

  // Expose
  window.KSPCounters = { animateCounter, drawSparkline, initKPICards, initCounters, initSparklines };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initKPICards();
      initCounters();
      initSparklines();
    });
  } else {
    initKPICards();
    initCounters();
    initSparklines();
  }

})();
