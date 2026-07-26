/* =========================================================
   ANOMALY-DETECTOR.JS — Real-time Crime Anomaly Detection
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  /**
   * Compute mean and standard deviation of an array of numbers.
   */
  function stats(arr) {
    const n = arr.length;
    if (n === 0) return { mean: 0, std: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    return { mean, std: Math.sqrt(variance) };
  }

  /**
   * Get daily count array for a rolling window.
   * Returns array of {date, count} sorted ascending.
   */
  function getDailyCounts(incidents, district, crimeType, startDate, endDate) {
    const map = {};
    incidents.forEach(inc => {
      if (district !== 'all' && inc.district !== district) return;
      if (crimeType !== 'all' && inc.crimeType !== crimeType && inc.category !== crimeType) return;
      const d = new Date(inc.date);
      if (d < startDate || d > endDate) return;
      const key = inc.date;
      map[key] = (map[key] || 0) + 1;
    });

    // Fill gaps with 0
    const result = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = cursor.toISOString().split('T')[0];
      result.push({ date: key, count: map[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  /**
   * Expected hour distribution for each crime type (based on db.js generator logic)
   */
  const EXPECTED_HOUR_DIST = {
    'Cybercrime':    { peakHours: [9, 10, 11, 14, 15, 16], nightRisk: false },
    'Financial Fraud': { peakHours: [10, 11, 12, 14, 15], nightRisk: false },
    'Vehicle Theft': { peakHours: [8, 9, 10, 14, 15, 16, 17], nightRisk: true },
    'Robbery':       { peakHours: [20, 21, 22, 23, 0, 1], nightRisk: true },
    'Assault':       { peakHours: [20, 21, 22, 23, 18, 19], nightRisk: true },
    'Narcotics':     { peakHours: [22, 23, 0, 1, 2], nightRisk: true },
    'Murder':        { peakHours: [20, 21, 22, 23, 0], nightRisk: true },
    'Missing Persons': { peakHours: [8, 9, 10, 11, 12, 13], nightRisk: false }
  };

  /**
   * Crime type distribution per district — expected fractions
   * Computed once from the database
   */
  function computeDistrictCrimeExpectation(incidents, district) {
    const distInc = incidents.filter(i => i.district === district);
    const total = distInc.length;
    if (total === 0) return {};
    const map = {};
    distInc.forEach(i => { map[i.crimeType] = (map[i.crimeType] || 0) + 1; });
    const result = {};
    for (const [k, v] of Object.entries(map)) result[k] = v / total;
    return result;
  }

  /**
   * Check if a crime type is unusual for a district.
   * "Unusual" = crime type count in last 14 days is > 2x expected fraction.
   */
  function detectUnusualLocations(incidents) {
    const anomalies = [];
    const districts = [...new Set(incidents.map(i => i.district))];

    const cutoff = new Date('2025-06-19'); // Last 14 days from ref date
    const recent = incidents.filter(i => new Date(i.date) >= cutoff);

    districts.forEach(district => {
      const expected = computeDistrictCrimeExpectation(incidents, district);
      const recentDist = recent.filter(i => i.district === district);
      if (recentDist.length < 5) return;

      const recentMap = {};
      recentDist.forEach(i => { recentMap[i.crimeType] = (recentMap[i.crimeType] || 0) + 1; });

      for (const [crimeType, recentCount] of Object.entries(recentMap)) {
        const recentFraction = recentCount / recentDist.length;
        const expectedFraction = expected[crimeType] || 0.005; // Very rare
        const ratio = recentFraction / expectedFraction;

        if (ratio > 2.5 && recentCount >= 3) {
          anomalies.push({
            type: 'unusual_location',
            district,
            crimeType,
            description: `**${crimeType}** is ${ratio.toFixed(1)}x above historical average in ${district} over the last 14 days (${recentCount} cases vs expected ${Math.round(expectedFraction * recentDist.length)}).`,
            severity: ratio > 5 ? 'critical' : 'high',
            confidence: parseFloat(Math.min(0.95, 0.5 + (ratio - 2.5) * 0.1).toFixed(2)),
            recentCount,
            expectedCount: Math.round(expectedFraction * recentDist.length),
            ratio: parseFloat(ratio.toFixed(2)),
            recommendation: `Investigate surge of ${crimeType} in ${district}. Deploy specialist unit immediately.`
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect crimes at unusual times for their crime type.
   */
  function detectUnusualTimings(incidents) {
    const anomalies = [];
    const recentCutoff = new Date('2025-06-26');
    const recent = incidents.filter(i => new Date(i.date) >= recentCutoff);

    const crimeTypeGroups = {};
    recent.forEach(inc => {
      if (!inc.time) return;
      if (!crimeTypeGroups[inc.crimeType]) crimeTypeGroups[inc.crimeType] = [];
      crimeTypeGroups[inc.crimeType].push(parseInt(inc.time.split(':')[0]));
    });

    for (const [crimeType, hours] of Object.entries(crimeTypeGroups)) {
      if (hours.length < 3) continue;
      const profile = EXPECTED_HOUR_DIST[crimeType];
      if (!profile) continue;

      const offPeakHours = hours.filter(h => !profile.peakHours.includes(h));
      const offPeakRate = offPeakHours.length / hours.length;

      if (offPeakRate > 0.6 && hours.length >= 5) {
        const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
        anomalies.push({
          type: 'unusual_timing',
          crimeType,
          description: `**${crimeType}** is occurring predominantly outside its typical hours. ${Math.round(offPeakRate * 100)}% of recent cases are off-peak (avg hour: ${avgHour}:00). This may indicate behavioral adaptation by offenders.`,
          severity: 'medium',
          confidence: parseFloat(Math.min(0.90, 0.55 + offPeakRate * 0.35).toFixed(2)),
          offPeakRate: parseFloat(offPeakRate.toFixed(2)),
          avgHour,
          recommendation: `Adjust patrol schedules for ${crimeType} — offenders may be avoiding standard surveillance windows.`
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect sudden crime spikes using rolling window comparison.
   */
  function detectSpikes(incidents, sigmaThreshold) {
    const anomalies = [];
    const now = new Date('2025-07-03');
    const thirtyDaysAgo = new Date('2025-06-03');
    const sevenDaysAgo = new Date('2025-06-26');

    // Get district x crimeType combinations to analyze
    const combos = new Map();
    incidents.forEach(i => {
      const key = `${i.district}|${i.crimeType}`;
      if (!combos.has(key)) combos.set(key, { district: i.district, crimeType: i.crimeType });
    });

    for (const [, combo] of combos) {
      // Baseline: daily counts for 30-day period before the last 7 days
      const baseline = getDailyCounts(incidents, combo.district, combo.crimeType, thirtyDaysAgo, sevenDaysAgo);
      const recent = getDailyCounts(incidents, combo.district, combo.crimeType, sevenDaysAgo, now);

      const { mean: baselineMean, std: baselineStd } = stats(baseline.map(d => d.count));
      const recentMean = recent.reduce((s, d) => s + d.count, 0) / recent.length;

      if (baselineMean < 0.1 || baselineStd === 0) continue; // Too sparse

      const zScore = (recentMean - baselineMean) / baselineStd;

      if (zScore >= sigmaThreshold) {
        const spikePct = baselineMean > 0 ? ((recentMean - baselineMean) / baselineMean) * 100 : 100;
        anomalies.push({
          type: 'spike',
          district: combo.district,
          crimeType: combo.crimeType,
          description: `**${combo.crimeType}** spike detected in **${combo.district}**. Daily average jumped from ${baselineMean.toFixed(1)} to ${recentMean.toFixed(1)} cases/day (+${Math.round(spikePct)}%) — ${zScore.toFixed(1)}σ above 30-day baseline.`,
          severity: zScore >= sigmaThreshold * 1.5 ? 'critical' : 'high',
          confidence: parseFloat(Math.min(0.97, 0.60 + (zScore - sigmaThreshold) * 0.08).toFixed(2)),
          zScore: parseFloat(zScore.toFixed(2)),
          baselineMean: parseFloat(baselineMean.toFixed(2)),
          recentMean: parseFloat(recentMean.toFixed(2)),
          spikePct: parseFloat(spikePct.toFixed(1)),
          recommendation: `Immediate response required for ${combo.crimeType} surge in ${combo.district}. Activate incident command protocol.`
        });
      }
    }

    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }

  /**
   * Detect abnormal repeat offender activity spikes.
   */
  function detectAbnormalOffenderActivity(incidents) {
    const anomalies = [];
    const sevenDaysAgo = new Date('2025-06-26');

    const recentRO = incidents.filter(i =>
      new Date(i.date) >= sevenDaysAgo && i.suspect && i.suspect.repeatOffender
    );

    const byDistrict = {};
    recentRO.forEach(i => {
      byDistrict[i.district] = (byDistrict[i.district] || 0) + 1;
    });

    for (const [district, count] of Object.entries(byDistrict)) {
      if (count >= 5) {
        anomalies.push({
          type: 'offender_activity',
          district,
          description: `**Abnormal repeat offender activity** in **${district}**: ${count} incidents by known recidivists in the last 7 days. This is indicative of organized criminal gang resurgence.`,
          severity: count >= 10 ? 'critical' : 'high',
          confidence: parseFloat(Math.min(0.93, 0.65 + (count - 5) * 0.04).toFixed(2)),
          offenderIncidentCount: count,
          recommendation: `Activate repeat offender tracking in ${district}. Cross-reference with parole board for recent releases.`
        });
      }
    }

    return anomalies;
  }

  const KSPAnomalyDetector = {
    _lastScan: null,

    /**
     * Run full anomaly scan across all detection algorithms.
     * @param {Object} [options]
     * @param {number} [options.sigmaThreshold] - Override sigma threshold
     * @returns {Object} { anomalies[], summary, generatedAt }
     */
    scan: function (options = {}) {
      const config = window.KSPAIConfig || { get: (k, d) => d };
      const sigmaThreshold = options.sigmaThreshold || config.get('anomalySigmaThreshold') || 2.0;
      const sensitivityMult = config.getSensitivityMultiplier ? config.getSensitivityMultiplier('alert') : 1.0;
      const effectiveSigma = sigmaThreshold / sensitivityMult;

      const incidents = KSPDatabase.getIncidents();

      const spikes = detectSpikes(incidents, effectiveSigma);
      const unusualLocations = detectUnusualLocations(incidents);
      const unusualTimings = detectUnusualTimings(incidents);
      const offenderActivity = detectAbnormalOffenderActivity(incidents);

      const allAnomalies = [
        ...spikes.slice(0, 6),
        ...unusualLocations.slice(0, 4),
        ...unusualTimings.slice(0, 3),
        ...offenderActivity.slice(0, 3)
      ].sort((a, b) => {
        const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0) ||
               b.confidence - a.confidence;
      });

      const result = {
        anomalies: allAnomalies,
        counts: {
          spike: spikes.length,
          unusual_location: unusualLocations.length,
          unusual_timing: unusualTimings.length,
          offender_activity: offenderActivity.length,
          total: allAnomalies.length
        },
        summary: allAnomalies.length === 0
          ? 'No significant anomalies detected. All districts within normal operational parameters.'
          : `${allAnomalies.length} anomalies detected — ${allAnomalies.filter(a => a.severity === 'critical').length} critical, ${allAnomalies.filter(a => a.severity === 'high').length} high priority.`,
        generatedAt: new Date().toISOString()
      };

      this._lastScan = result;

      if (window.KSPAIBus) {
        KSPAIBus.emit('anomaly:detected', result);

        // Auto-alert for critical anomalies
        if (config.get('autoAlerts')) {
          allAnomalies.filter(a => a.severity === 'critical').forEach(a => {
            if (window.showToast) showToast(`🔴 AI ANOMALY: ${a.description.substring(0, 80)}...`, 'critical', 6000);
          });
        }
      }

      return result;
    },

    /** Return last scan result without re-computing */
    getLastScan: function () { return this._lastScan; },

    /** Get anomalies for a specific district */
    getDistrictAnomalies: function (district) {
      const scan = this._lastScan || this.scan();
      return scan.anomalies.filter(a => !a.district || a.district === district);
    }
  };

  window.KSPAnomalyDetector = KSPAnomalyDetector;

})();
