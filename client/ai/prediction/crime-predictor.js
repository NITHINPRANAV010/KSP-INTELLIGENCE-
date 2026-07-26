/* =========================================================
   CRIME-PREDICTOR.JS — Statistical Crime Prediction Engine
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  // Seasonal coefficients by month (index 0 = Jan)
  // Based on observed crime patterns in Karnataka
  const SEASONAL = [0.92, 0.88, 0.95, 1.02, 1.05, 1.10, 1.12, 1.08, 1.00, 0.98, 1.03, 1.15];

  // Day-of-week crime multipliers (0=Sun to 6=Sat)
  const DAY_OF_WEEK = [1.08, 0.92, 0.88, 0.90, 0.96, 1.12, 1.14];

  // Crime type base weights for severity adjustment
  const CRIME_SEVERITY_WEIGHTS = {
    'Murder': 10, 'Narcotics': 8, 'Robbery': 6, 'Assault': 5,
    'Cybercrime': 4, 'Financial Fraud': 3, 'Vehicle Theft': 2, 'Missing Persons': 1
  };

  /**
   * Compute linear regression slope and intercept from monthly data points.
   * @param {number[]} data - Array of monthly counts
   * @returns {{ slope: number, intercept: number, r2: number }}
   */
  function linearRegression(data) {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    data.forEach((y, x) => {
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² coefficient of determination
    const meanY = sumY / n;
    const ssTot = data.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
    const ssRes = data.reduce((acc, y, x) => acc + Math.pow(y - (slope * x + intercept), 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, r2 };
  }

  /**
   * Get historical monthly counts for a district/crimeType combination.
   * Returns array of 18 values (Jan 2024 – Jun 2025).
   */
  function getMonthlyHistory(districtFilter, crimeTypeFilter) {
    const incidents = KSPDatabase.getIncidents();

    // 18 months: Jan 2024 (index 0) to Jun 2025 (index 17)
    const counts = new Array(18).fill(0);

    incidents.forEach(inc => {
      if (districtFilter !== 'all' && inc.district !== districtFilter) return;
      if (crimeTypeFilter !== 'all' && inc.crimeType !== crimeTypeFilter && inc.category !== crimeTypeFilter) return;

      const d = new Date(inc.date);
      const year = d.getFullYear();
      const month = d.getMonth();

      let idx = -1;
      if (year === 2024) idx = month;           // Jan–Dec 2024 → 0–11
      else if (year === 2025) idx = 12 + month; // Jan–Jun 2025 → 12–17

      if (idx >= 0 && idx < 18) counts[idx]++;
    });

    return counts;
  }

  /**
   * Generate a single prediction for a given horizon.
   * @param {string} district
   * @param {string} crimeType - 'all' or specific type
   * @param {'tomorrow'|'week'|'month'} horizon
   */
  function generatePrediction(district, crimeType, horizon) {
    const history = getMonthlyHistory(district, crimeType);
    const { slope, intercept, r2 } = linearRegression(history);

    // Predict month index 18 (July 2025) as base
    const baseMonthIdx = 18;
    const baseMonthlyPrediction = Math.max(0, slope * baseMonthIdx + intercept);

    // Seasonal adjustment for July (index 6)
    const seasonal = SEASONAL[6]; // July
    const seasonallyAdjusted = baseMonthlyPrediction * seasonal;

    // Scale to horizon
    let predictedCount;
    let horizonLabel;
    let horizonDays;

    if (horizon === 'tomorrow') {
      const dayOfWeek = (new Date().getDay() + 1) % 7; // Tomorrow's day
      const dayMultiplier = DAY_OF_WEEK[dayOfWeek];
      predictedCount = Math.max(1, Math.round((seasonallyAdjusted / 30) * dayMultiplier));
      horizonLabel = 'Next 24 Hours';
      horizonDays = 1;
    } else if (horizon === 'week') {
      predictedCount = Math.max(3, Math.round(seasonallyAdjusted / 4.3));
      horizonLabel = 'Next 7 Days';
      horizonDays = 7;
    } else { // month
      predictedCount = Math.max(10, Math.round(seasonallyAdjusted));
      horizonLabel = 'Next 30 Days';
      horizonDays = 30;
    }

    // Confidence based on R² + data volume
    const dataVolume = history.reduce((a, b) => a + b, 0);
    const volumeFactor = Math.min(1.0, dataVolume / 200);
    const confidence = parseFloat(Math.min(0.97, Math.max(0.40,
      (r2 * 0.6) + (volumeFactor * 0.4)
    )).toFixed(2));

    // Risk level based on predicted count per day
    const perDay = predictedCount / horizonDays;
    let riskLevel = 'LOW';
    if (perDay > 15) riskLevel = 'CRITICAL';
    else if (perDay > 8) riskLevel = 'HIGH';
    else if (perDay > 4) riskLevel = 'MEDIUM';

    // Probability that count will be at or above predicted level
    const probability = parseFloat(Math.min(0.97, confidence * 0.9 + 0.05).toFixed(2));

    // Trend direction
    const recentAvg = history.slice(14).reduce((a, b) => a + b, 0) / 4;
    const priorAvg = history.slice(10, 14).reduce((a, b) => a + b, 0) / 4;
    const trendPct = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;
    const trendDir = trendPct > 5 ? 'INCREASING' : trendPct < -5 ? 'DECREASING' : 'STABLE';

    // XAI Explanation factors
    const factors = [];

    if (slope > 0.5) {
      factors.push(`Long-term crime trend is **increasing** at +${slope.toFixed(1)} cases/month over the analysis period.`);
    } else if (slope < -0.5) {
      factors.push(`Long-term crime trend is **decreasing** at ${slope.toFixed(1)} cases/month — positive intervention effect observed.`);
    } else {
      factors.push(`Crime volume is **stable** with minimal trend deviation (slope: ${slope.toFixed(2)} cases/month).`);
    }

    if (seasonal > 1.05) {
      factors.push(`July historically shows a **+${Math.round((seasonal - 1) * 100)}% seasonal uplift** due to monsoon patterns and festival periods.`);
    }

    if (trendPct > 15) {
      factors.push(`**Short-term acceleration**: Recent 4-week average is ${Math.round(trendPct)}% above the prior 4-week baseline.`);
    } else if (trendPct < -15) {
      factors.push(`**Short-term deceleration**: Recent 4-week average is ${Math.abs(Math.round(trendPct))}% below the prior 4-week baseline.`);
    }

    factors.push(`Model fit quality (R²): **${(r2 * 100).toFixed(0)}%** — ${r2 > 0.7 ? 'high confidence in trend extrapolation' : r2 > 0.4 ? 'moderate confidence' : 'limited historical pattern found'}.`);

    if (district !== 'all') {
      const distMetrics = KSPFilterEngine.getMetrics({ district });
      const roRate = distMetrics.repeatOffenderRate;
      if (roRate > 10) {
        factors.push(`Repeat offender activity in ${district}: **${roRate}% of cases** — recidivism risk elevates prediction.`);
      }
    }

    // Recommendations
    const recommendations = [];
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push({ action: 'Increase patrol density', priority: 'high', reason: `Predicted ${predictedCount} incidents in ${horizonLabel}` });
      recommendations.push({ action: 'Activate CCTV alert monitoring', priority: 'high', reason: 'High-risk period requires visual surveillance' });
    }
    if (trendDir === 'INCREASING') {
      recommendations.push({ action: 'Mobilize quick-response units', priority: 'medium', reason: `${Math.round(trendPct)}% upward trend in recent weeks` });
    }
    recommendations.push({ action: 'Issue district briefing', priority: 'low', reason: 'Inform field officers of predicted risk window' });

    return {
      type: 'prediction',
      district: district === 'all' ? 'All Karnataka' : district,
      crimeType: crimeType === 'all' ? 'All Crime Types' : crimeType,
      horizon,
      horizonLabel,
      predictedCount,
      probability,
      confidence,
      riskLevel,
      trendDirection: trendDir,
      trendPct: parseFloat(trendPct.toFixed(1)),
      factors,
      recommendations,
      dataPoints: history,
      modelStats: { slope: parseFloat(slope.toFixed(3)), intercept: parseFloat(intercept.toFixed(3)), r2: parseFloat(r2.toFixed(3)) },
      generatedAt: new Date().toISOString()
    };
  }

  const KSPCrimePredictor = {
    /**
     * Predict crime for given parameters.
     * @param {Object} options
     * @param {string} [options.district='all']
     * @param {string} [options.crimeType='all']
     * @param {'tomorrow'|'week'|'month'} [options.horizon='week']
     */
    predict: function (options = {}) {
      const district = options.district || 'all';
      const crimeType = options.crimeType || 'all';
      const horizon = options.horizon || 'week';

      const result = generatePrediction(district, crimeType, horizon);

      if (window.KSPAIBus) KSPAIBus.emit('prediction:ready', result);
      return result;
    },

    /**
     * Generate predictions for all horizons for a given district.
     * @param {string} district
     * @param {string} [crimeType='all']
     */
    predictAll: function (district, crimeType = 'all') {
      return {
        tomorrow: generatePrediction(district, crimeType, 'tomorrow'),
        week: generatePrediction(district, crimeType, 'week'),
        month: generatePrediction(district, crimeType, 'month')
      };
    },

    /**
     * Get top N highest-risk district predictions for a given horizon.
     * @param {'tomorrow'|'week'|'month'} horizon
     * @param {number} [topN=5]
     */
    getTopRiskDistricts: function (horizon = 'week', topN = 5) {
      const districts = [
        'Bengaluru Urban', 'Mysuru', 'Belagavi', 'Kalaburagi', 'Hubballi-Dharwad',
        'Davanagere', 'Tumakuru', 'Mangaluru', 'Vijayapura', 'Ballari'
      ];

      return districts
        .map(d => generatePrediction(d, 'all', horizon))
        .sort((a, b) => b.predictedCount - a.predictedCount)
        .slice(0, topN);
    },

    /**
     * Predict crime type breakdown for a district and horizon.
     * @param {string} district
     * @param {'tomorrow'|'week'|'month'} horizon
     */
    predictByType: function (district, horizon = 'week') {
      const types = ['Financial Fraud', 'Vehicle Theft', 'Cybercrime', 'Robbery', 'Assault', 'Narcotics', 'Missing Persons', 'Murder'];
      return types.map(t => generatePrediction(district, t, horizon))
        .sort((a, b) => b.predictedCount - a.predictedCount);
    }
  };

  window.KSPCrimePredictor = KSPCrimePredictor;

})();
