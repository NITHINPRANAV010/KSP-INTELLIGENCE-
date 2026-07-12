/* =========================================================
   CHARTS.JS — Chart.js Renderers
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  // ── Global Chart Defaults ───────────────────────────────
  function applyChartDefaults() {
    if (!window.Chart) return;

    Chart.defaults.color = '#64748B';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
    Chart.defaults.animation.duration = 900;
    Chart.defaults.animation.easing = 'easeOutQuart';

    Chart.defaults.plugins.tooltip.backgroundColor = '#1B263B';
    Chart.defaults.plugins.tooltip.titleColor = '#fff';
    Chart.defaults.plugins.tooltip.bodyColor = '#CBD5E1';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = false;
  }

  // ── Helper: gradient ────────────────────────────────────
  function makeGradient(ctx, color, alpha1 = 0.5, alpha2 = 0) {
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, color.replace(')', `, ${alpha1})`).replace('rgb', 'rgba'));
    grad.addColorStop(1, color.replace(')', `, ${alpha2})`).replace('rgb', 'rgba'));
    return grad;
  }

  // ── Monthly Trend Chart ─────────────────────────────────
  function initTrendChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');
    const d = window.KSPData;
    if (!d) return null;

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: d.monthlyTrends.labels,
        datasets: [
          {
            label: 'Total Crimes',
            data: d.monthlyTrends.datasets.total,
            borderColor: '#EF4444',
            backgroundColor: (context) => {
              const c = context.chart.ctx;
              const g = c.createLinearGradient(0, 0, 0, 250);
              g.addColorStop(0, 'rgba(239,68,68,0.2)');
              g.addColorStop(1, 'rgba(239,68,68,0)');
              return g;
            },
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#EF4444',
          },
          {
            label: 'Solved Cases',
            data: d.monthlyTrends.datasets.solved,
            borderColor: '#22C55E',
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#22C55E',
          },
          {
            label: 'Cybercrime',
            data: d.monthlyTrends.datasets.cyber,
            borderColor: '#22D3EE',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 3],
            fill: false,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: '#22D3EE',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B', callback: (v) => v.toLocaleString('en-IN') },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  // ── Crime Category Donut ────────────────────────────────
  function initDonutChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');
    const d = window.KSPData;
    if (!d) return null;

    const cats = d.crimeCategories;

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.label),
        datasets: [{
          data: cats.map(c => c.count),
          backgroundColor: cats.map(c => c.color + 'CC'),
          borderColor: cats.map(c => c.color),
          borderWidth: 1.5,
          hoverOffset: 8,
          hoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'right', labels: { padding: 14 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString('en-IN')} cases`,
            },
          },
        },
      },
    });
  }

  // ── District Bar Chart ──────────────────────────────────
  function initDistrictBarChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');
    const d = window.KSPData;
    if (!d) return null;

    const districts = [...d.districts].sort((a, b) => b.crimes - a.crimes).slice(0, 8);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: districts.map(d => d.name.replace('Hubballi-Dharwad', 'Hubballi')),
        datasets: [{
          label: 'Total Crimes',
          data: districts.map(d => d.crimes),
          backgroundColor: districts.map(d => {
            if (d.risk === 'critical') return 'rgba(239,68,68,0.75)';
            if (d.risk === 'high') return 'rgba(245,158,11,0.75)';
            if (d.risk === 'medium') return 'rgba(59,130,246,0.75)';
            return 'rgba(34,197,94,0.75)';
          }),
          borderColor: districts.map(d => {
            if (d.risk === 'critical') return '#EF4444';
            if (d.risk === 'high') return '#F59E0B';
            if (d.risk === 'medium') return '#3B82F6';
            return '#22C55E';
          }),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x.toLocaleString('en-IN')} crimes`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#CBD5E1', font: { size: 11 } },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  // ── Time of Day Polar / Bar ─────────────────────────────
  function initTimeChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');
    const d = window.KSPData;
    if (!d) return null;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: d.timeOfDay.labels,
        datasets: [{
          label: 'Incidents',
          data: d.timeOfDay.data,
          backgroundColor: d.timeOfDay.data.map(v => {
            if (v >= 80) return 'rgba(239,68,68,0.8)';
            if (v >= 50) return 'rgba(245,158,11,0.8)';
            if (v >= 30) return 'rgba(59,130,246,0.8)';
            return 'rgba(34,197,94,0.6)';
          }),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} incidents`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { size: 10 } },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  // ── Crime Type Radar ────────────────────────────────────
  function initRadarChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');
    const d = window.KSPData;
    if (!d) return null;

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: d.crimeCategories.map(c => c.label),
        datasets: [{
          label: 'This Month',
          data: d.crimeCategories.map(c => c.count),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3B82F6',
          borderWidth: 2,
        }, {
          label: 'Last Month',
          data: d.crimeCategories.map(c => Math.round(c.count * 0.82)),
          borderColor: '#22D3EE',
          backgroundColor: 'rgba(34,211,238,0.07)',
          pointBackgroundColor: '#22D3EE',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: '#CBD5E1', font: { size: 10 } },
            ticks: { display: false },
          },
        },
      },
    });
  }

  // ── Prediction Trend Chart ──────────────────────────────
  function initPredictionChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul (pred)', 'Aug (pred)', 'Sep (pred)'];
    const actual = [3421, 3187, 3654, 3892, 4123, 3987, null, null, null];
    const predicted = [null, null, null, null, null, 3987, 4634, 5121, 5489];

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Actual',
            data: actual,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3B82F6',
            spanGaps: false,
          },
          {
            label: 'Predicted',
            data: predicted,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.05)',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#EF4444',
            spanGaps: false,
          },
          {
            label: 'Confidence Band (Upper)',
            data: [null, null, null, null, null, null, 5102, 5634, 6043],
            borderColor: 'transparent',
            backgroundColor: 'rgba(239,68,68,0.04)',
            fill: '-1',
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.parsed.y
                ? ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('en-IN')} crimes`
                : '',
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748B', callback: (v) => v.toLocaleString('en-IN') },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  // ── District Risk Gauge ─────────────────────────────────
  function initRiskGaugeChart(canvasId, score) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx = canvas.getContext('2d');

    const color = score >= 85 ? '#EF4444' : score >= 65 ? '#F59E0B' : score >= 45 ? '#3B82F6' : '#22C55E';

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [color + 'CC', 'rgba(255,255,255,0.05)'],
          borderColor: [color, 'transparent'],
          borderWidth: [2, 0],
          hoverOffset: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        rotation: -90,
        circumference: 180,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 1200 },
      },
    });
  }

  // ── Expose ──────────────────────────────────────────────
  window.KSPCharts = {
    applyDefaults: applyChartDefaults,
    initTrendChart,
    initDonutChart,
    initDistrictBarChart,
    initTimeChart,
    initRadarChart,
    initPredictionChart,
    initRiskGaugeChart,
  };

  // Auto-apply defaults
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyChartDefaults);
  } else {
    applyChartDefaults();
  }

})();
