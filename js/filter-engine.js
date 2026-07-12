/* =========================================================
   FILTER-ENGINE.JS — Real Multi-field Filtering & Aggregate Engine
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const KSPFilterEngine = {
    // Current active filter states
    filters: {
      district: 'all',
      crimeType: 'all',
      officer: 'all',
      status: 'all',
      severity: 'all',
      repeatOffender: 'all',
      timeframe: 'all', // 'today', 'week', 'month', 'all'
      dateStart: null,
      dateEnd: null,
      minRisk: 0
    },

    // Get filtered list of incidents
    query: function (customFilters = {}) {
      const active = Object.assign({}, this.filters, customFilters);
      const incidents = KSPDatabase.getIncidents();

      return incidents.filter(inc => {
        // 1. District
        if (active.district !== 'all' && inc.district !== active.district) return false;

        // 2. Crime Type / Category
        if (active.crimeType !== 'all') {
          if (inc.category !== active.crimeType && inc.crimeType !== active.crimeType) return false;
        }

        // 3. Officer
        if (active.officer !== 'all' && inc.assignedOfficer !== active.officer) return false;

        // 4. Status
        if (active.status !== 'all' && inc.status !== active.status) return false;

        // 5. Severity
        if (active.severity !== 'all' && inc.severity !== active.severity) return false;

        // 6. Repeat Offender Status
        if (active.repeatOffender !== 'all') {
          const isRO = active.repeatOffender === 'true' || active.repeatOffender === true;
          if (inc.suspect.repeatOffender !== isRO) return false;
        }

        // 7. Timeframe / Date filters
        if (active.dateStart && inc.date < active.dateStart) return false;
        if (active.dateEnd && inc.date > active.dateEnd) return false;

        if (active.timeframe !== 'all') {
          const incDate = new Date(inc.date);
          const limitDate = new Date(2025, 6, 3); // current time July 3, 2025
          
          if (active.timeframe === 'today') {
            if (inc.date !== '2025-07-03') return false;
          } else if (active.timeframe === 'week') {
            const diffTime = Math.abs(limitDate - incDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 7) return false;
          } else if (active.timeframe === 'month') {
            if (incDate.getMonth() !== 6 || incDate.getFullYear() !== 2025) return false; // Not July 2025
          }
        }

        // 8. Risk Score threshold check (District level)
        if (active.minRisk > 0) {
          const dScore = KSPDatabase.districts.find(d => d.name === inc.district)?.score || 0;
          if (dScore < active.minRisk) return false;
        }

        return true;
      });
    },

    // Set a filter value and dispatch update event
    setFilter: function (key, value) {
      this.filters[key] = value;
      const event = new CustomEvent('ksp_filter_change', { detail: { filters: this.filters } });
      window.dispatchEvent(event);
    },

    // Reset filters
    resetFilters: function () {
      this.filters = {
        district: 'all',
        crimeType: 'all',
        officer: 'all',
        status: 'all',
        severity: 'all',
        repeatOffender: 'all',
        timeframe: 'all',
        dateStart: null,
        dateEnd: null,
        minRisk: 0
      };
      const event = new CustomEvent('ksp_filter_change', { detail: { filters: this.filters } });
      window.dispatchEvent(event);
    },

    // Calculate aggregated metrics from filtered items
    getMetrics: function (customFilters = {}) {
      const list = this.query(customFilters);
      const total = list.length;
      
      const solved = list.filter(i => i.status === 'Resolved' || i.status === 'Arrested').length;
      const active = list.filter(i => i.status === 'Active' || i.status === 'Investigating').length;
      const rate = total > 0 ? parseFloat((solved / total * 100).toFixed(1)) : 0;
      
      // Calculate repeat offender ratio
      const roCount = list.filter(i => i.suspect && i.suspect.repeatOffender).length;
      const roRate = total > 0 ? parseFloat((roCount / total * 100).toFixed(1)) : 0;

      // Group by district to compute counts
      const districtCounts = {};
      list.forEach(i => {
        districtCounts[i.district] = (districtCounts[i.district] || 0) + 1;
      });

      // Group by crime category to compute counts
      const categoryCounts = {};
      list.forEach(i => {
        const cat = i.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      return {
        total: total,
        solved: solved,
        active: active,
        solveRate: rate,
        repeatOffendersCount: roCount,
        repeatOffenderRate: roRate,
        districtCounts: districtCounts,
        categoryCounts: categoryCounts
      };
    },

    // Get Chart data sets derived from query
    getChartData: function (customFilters = {}) {
      const list = this.query(customFilters);
      
      // 1. Monthly Trends
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = {
        labels: months,
        total: Array(12).fill(0),
        solved: Array(12).fill(0),
        cyber: Array(12).fill(0),
        vehicle: Array(12).fill(0)
      };

      list.forEach(inc => {
        const d = new Date(inc.date);
        // Only aggregate 2024 to map monthly patterns correctly
        if (d.getFullYear() === 2024) {
          const mIdx = d.getMonth();
          monthlyData.total[mIdx]++;
          if (inc.status === 'Resolved' || inc.status === 'Arrested') {
            monthlyData.solved[mIdx]++;
          }
          if (inc.category === 'cyber') monthlyData.cyber[mIdx]++;
          if (inc.category === 'theft') monthlyData.vehicle[mIdx]++;
        }
      });

      // 2. Time of Day Distribution
      const timeSlots = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
      const timeCounts = Array(12).fill(0);
      list.forEach(inc => {
        if (!inc.time) return;
        const hr = parseInt(inc.time.split(':')[0]);
        const slotIdx = Math.min(11, Math.floor(hr / 2));
        timeCounts[slotIdx]++;
      });

      return {
        monthlyTrends: monthlyData,
        timeOfDay: {
          labels: timeSlots,
          data: timeCounts
        }
      };
    }
  };

  // Expose globally
  window.KSPFilterEngine = KSPFilterEngine;
})();
