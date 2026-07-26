/* =========================================================
   OFFENDER-PROFILER.JS — Deep AI Offender Profile Engine
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  const SEVERITY_WEIGHTS = {
    'Murder': 10, 'Narcotics': 8, 'Robbery': 6, 'Assault': 5,
    'Cybercrime': 4, 'Financial Fraud': 3, 'Vehicle Theft': 2, 'Missing Persons': 1
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /**
   * Calculate reoffending probability using exponential decay model.
   * P(reoffend) = base_rate * e^(-k * daysSinceLast) + recency_bonus
   */
  function reoffendingProbability(daysSinceLastOffense, crimeCount, severityScore, decayDays) {
    const k = Math.log(2) / decayDays; // Half-life decay
    const baseRate = Math.min(0.95, 0.3 + (crimeCount / 10) * 0.2 + (severityScore / 10) * 0.2);
    const decayed = baseRate * Math.exp(-k * daysSinceLastOffense);
    return parseFloat(Math.max(0.05, Math.min(0.97, decayed)).toFixed(2));
  }

  /**
   * Calculate risk score from multiple factors.
   */
  function calculateRiskScore(profile) {
    // Frequency component (max 30 points)
    const freqScore = Math.min(30, profile.totalCases * 3);

    // Severity component (max 30 points)
    const severityScore = Math.min(30, profile.avgSeverityWeight * 3);

    // Recency component (max 20 points) — more recent = higher risk
    const daysSinceLast = profile.daysSinceLastOffense;
    const recencyScore = Math.max(0, 20 - (daysSinceLast / 30) * 5);

    // Associate network component (max 10 points)
    const networkScore = Math.min(10, profile.associateCount * 2);

    // District risk overlay (max 10 points)
    const districtRiskScore = profile.districtRiskScore ? Math.min(10, profile.districtRiskScore / 10) : 5;

    const raw = freqScore + severityScore + recencyScore + networkScore + districtRiskScore;
    return Math.max(10, Math.min(99, Math.round(raw)));
  }

  /**
   * Detect crime patterns: peak hours, peak days, preferred crime type, geographic pattern.
   */
  function extractPattern(cases) {
    if (cases.length === 0) return {};

    // Hour distribution
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const crimeTypeCounts = {};
    const locationCounts = {};

    cases.forEach(c => {
      if (c.time) {
        const h = parseInt(c.time.split(':')[0]);
        if (!isNaN(h)) hourCounts[h]++;
      }
      if (c.date) {
        const dow = new Date(c.date).getDay();
        dayCounts[dow]++;
      }
      crimeTypeCounts[c.crimeType] = (crimeTypeCounts[c.crimeType] || 0) + 1;
      if (c.policeStation) locationCounts[c.policeStation] = (locationCounts[c.policeStation] || 0) + 1;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = DAY_NAMES[dayCounts.indexOf(Math.max(...dayCounts))];
    const dominantCrime = Object.entries(crimeTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const frequentLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Activity time classification
    const nightCases = cases.filter(c => {
      const h = c.time ? parseInt(c.time.split(':')[0]) : -1;
      return h >= 20 || h <= 5;
    }).length;
    const activityTime = nightCases / cases.length > 0.5 ? 'Predominantly Nocturnal' : 'Predominantly Daytime';

    return {
      peakHour: `${peakHour.toString().padStart(2, '0')}:00`,
      peakDay,
      dominantCrimeType: dominantCrime,
      frequentLocation,
      activityTime,
      crimeTypeBreakdown: crimeTypeCounts,
      locationBreakdown: locationCounts
    };
  }

  /**
   * Generate AI recommendation for a specific offender profile.
   */
  function generateRecommendation(profile) {
    const actions = [];
    const riskScore = profile.riskScore;
    const reoffendProb = profile.reoffendingProbability;

    if (profile.status === 'Active' || profile.status === 'Bail') {
      if (riskScore >= 80) {
        actions.push({ priority: 'CRITICAL', action: 'Issue immediate surveillance order', detail: `Risk score ${riskScore}/100 warrants 24/7 tracking` });
        actions.push({ priority: 'HIGH', action: 'Coordinate with district SP for arrest warrant', detail: 'Multiple high-severity linked cases' });
      } else if (riskScore >= 60) {
        actions.push({ priority: 'HIGH', action: 'Increase monitoring frequency', detail: `Reoffend probability: ${Math.round(reoffendProb * 100)}%` });
        actions.push({ priority: 'MEDIUM', action: 'Cross-check associate network', detail: 'May be operating with known accomplices' });
      } else {
        actions.push({ priority: 'MEDIUM', action: 'Routine monitoring', detail: 'Standard surveillance protocol' });
      }
    } else if (profile.status === 'Custody') {
      actions.push({ priority: 'LOW', action: 'Monitor for bail application', detail: 'Alert if custody status changes' });
      actions.push({ priority: 'LOW', action: 'Review case file for additional charges', detail: `${profile.totalCases} linked incidents` });
    }

    if (reoffendProb > 0.7) {
      actions.push({ priority: 'HIGH', action: 'Notify parole/probation officer', detail: `${Math.round(reoffendProb * 100)}% reoffending probability` });
    }

    if (profile.pattern?.dominantCrimeType) {
      const unit = {
        'Cybercrime': 'Cyber Crime Cell', 'Financial Fraud': 'Economic Offenses Wing',
        'Narcotics': 'Narcotics Control Bureau', 'Murder': 'CID Homicide Division',
        'Vehicle Theft': 'Vehicle Theft Task Force', 'Robbery': 'Anti-Robbery Squad'
      }[profile.pattern.dominantCrimeType] || 'General CID';
      actions.push({ priority: 'MEDIUM', action: `Assign ${unit}`, detail: `Primary offense type: ${profile.pattern.dominantCrimeType}` });
    }

    return actions;
  }

  const KSPOffenderProfiler = {
    /**
     * Generate a complete AI profile for an offender by ID or name.
     * @param {Object} options
     * @param {string} [options.offenderId] - Offender ID (e.g. 'OFF001')
     * @param {string} [options.name] - Offender name (fuzzy match)
     */
    profile: function (options = {}) {
      const config = window.KSPAIConfig || { get: () => 90 };
      const decayDays = config.get('recidivismDecayDays') || 90;

      const incidents = KSPDatabase.getIncidents();
      const offenders = KSPDatabase.getOffenders();

      let offenderBase = null;
      let linkedCases = [];

      if (options.offenderId) {
        offenderBase = offenders.find(o => o.id === options.offenderId);
        linkedCases = incidents.filter(i => i.suspect?.id === options.offenderId);
      } else if (options.name) {
        const nameLower = options.name.toLowerCase();
        linkedCases = incidents.filter(i => i.suspect?.name?.toLowerCase().includes(nameLower));
        offenderBase = offenders.find(o => o.name.toLowerCase().includes(nameLower));
      }

      if (!offenderBase && linkedCases.length === 0) {
        return null;
      }

      // Compute metrics from cases
      const sortedCases = linkedCases.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastCaseDate = sortedCases[0]?.date ? new Date(sortedCases[0].date) : new Date('2025-01-01');
      const refDate = new Date('2025-07-03');
      const daysSinceLast = Math.max(0, Math.round((refDate - lastCaseDate) / (1000 * 60 * 60 * 24)));

      // Severity
      let totalSeverityWeight = 0;
      linkedCases.forEach(c => { totalSeverityWeight += SEVERITY_WEIGHTS[c.crimeType] || 2; });
      const avgSeverityWeight = linkedCases.length > 0 ? totalSeverityWeight / linkedCases.length : 2;

      // Associate count from network
      const networkData = window.KSPNetworkIntelligence ? KSPNetworkIntelligence.getGraph() : null;
      const nodeId = offenderBase?.id || linkedCases[0]?.suspect?.id;
      const nodeLinks = networkData ? networkData.links.filter(l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return src === nodeId || tgt === nodeId;
      }) : [];
      const associateCount = nodeLinks.length;

      // District risk
      let districtRiskScore = 50;
      const primaryDistrict = offenderBase?.district || linkedCases[0]?.district;
      if (primaryDistrict && window.KSPRiskEngine) {
        districtRiskScore = KSPRiskEngine.calculateDistrictRisk(primaryDistrict).score;
      }

      const totalCases = linkedCases.length;

      // Build intermediate profile
      const partialProfile = {
        totalCases, avgSeverityWeight, daysSinceLastOffense: daysSinceLast, associateCount, districtRiskScore
      };

      const riskScore = calculateRiskScore(partialProfile);
      const reoffendProb = reoffendingProbability(daysSinceLast, totalCases, avgSeverityWeight, decayDays);
      const pattern = extractPattern(linkedCases);

      const profile = {
        id: offenderBase?.id || linkedCases[0]?.suspect?.id || 'UNKNOWN',
        name: offenderBase?.name || linkedCases[0]?.suspect?.name || 'Unknown',
        gender: offenderBase?.gender || 'Unknown',
        age: offenderBase?.age || null,
        district: primaryDistrict || 'Unknown',

        // AI Metrics
        riskScore,
        reoffendingProbability: reoffendProb,
        riskLevel: riskScore >= 85 ? 'CRITICAL' : riskScore >= 65 ? 'HIGH' : riskScore >= 45 ? 'MEDIUM' : 'LOW',

        // Factual metrics
        totalCases,
        solvedCases: linkedCases.filter(c => c.status === 'Arrested' || c.status === 'Resolved').length,
        avgSeverityWeight: parseFloat(avgSeverityWeight.toFixed(1)),
        daysSinceLastOffense: daysSinceLast,
        lastKnownDate: sortedCases[0]?.date || 'N/A',
        associateCount,
        status: offenderBase?.crimeHistory?.[0]?.status || (linkedCases.some(c => c.status === 'Active') ? 'Active' : 'In Custody'),

        // Pattern analysis
        pattern,

        // Linked cases (most recent 5)
        recentCases: sortedCases.slice(0, 5).map(c => ({
          id: c.id,
          date: c.date,
          crimeType: c.crimeType,
          district: c.district,
          status: c.status,
          severity: c.severity
        })),

        // XAI factors
        riskFactors: [
          `Case volume: **${totalCases} linked incidents** — ${totalCases > 10 ? 'extensive criminal history' : totalCases > 5 ? 'moderate history' : 'limited history'}.`,
          `Average crime severity weight: **${avgSeverityWeight.toFixed(1)}/10** — ${avgSeverityWeight > 6 ? 'predominantly violent/serious offenses' : 'non-violent / property crimes'}.`,
          `Days since last known offense: **${daysSinceLast} days** — ${daysSinceLast < 30 ? 'recently active' : daysSinceLast < 90 ? 'moderate recency' : 'dormant period'}.`,
          `Network connections: **${associateCount} known associates** discovered via shared phones, vehicles, locations.`,
          `District environment risk: **${districtRiskScore}/100** (${primaryDistrict}) — ${districtRiskScore > 70 ? 'high-risk operational area' : 'moderate-risk area'}.`
        ],

        // AI recommendations
        recommendations: generateRecommendation({
          riskScore, reoffendingProbability: reoffendProb, totalCases, pattern,
          status: linkedCases.some(c => c.status === 'Active') ? 'Active' : 'Custody'
        }),

        generatedAt: new Date().toISOString()
      };

      if (window.KSPAIBus) KSPAIBus.emit('offender:profiled', { id: profile.id, riskScore, reoffendProb });
      return profile;
    },

    /**
     * Profile all core offenders (from KSPDatabase.getOffenders()).
     */
    profileAll: function () {
      const offenders = KSPDatabase.getOffenders();
      return offenders.map(o => this.profile({ offenderId: o.id })).filter(Boolean);
    }
  };

  window.KSPOffenderProfiler = KSPOffenderProfiler;

})();
