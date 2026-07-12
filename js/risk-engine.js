/* =========================================================
   RISK-ENGINE.JS — Dynamic Risk Analysis & Explainable AI Engine
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  // Severity weights mapping
  const SEVERITY_WEIGHTS = {
    'Murder': 10,
    'Narcotics': 8,
    'Robbery': 6,
    'Assault': 5,
    'Cybercrime': 4,
    'Financial Fraud': 3,
    'Vehicle Theft': 2,
    'Missing Persons': 1
  };

  const KSPRiskEngine = {
    // Dynamically calculate risk parameters for a given district
    calculateDistrictRisk: function (districtName) {
      if (!districtName) {
        return { score: 0, level: 'low', factors: [], recommendations: [] };
      }

      const incidents = KSPDatabase.getIncidents();
      const districtIncidents = incidents.filter(i => i.district === districtName);
      const totalCrimesCount = incidents.length;
      
      if (districtIncidents.length === 0) {
        return {
          score: 10,
          level: 'low',
          factors: ['No incidents recorded in database.'],
          recommendations: ['Maintain baseline officer presence.']
        };
      }

      // ── 1. Crime Frequency Component (Max 40 points) ──────
      // Relative load compared to highest crime district (usually Bengaluru Urban)
      // Bengaluru Urban usually has ~2200 incidents out of 10000+
      const relativeFrequency = Math.min(1.0, districtIncidents.length / 2200);
      const frequencyScore = relativeFrequency * 40;

      // ── 2. Crime Severity Component (Max 30 points) ───────
      // Average crime weight in the district vs theoretical maximum weight
      let totalWeight = 0;
      districtIncidents.forEach(inc => {
        totalWeight += SEVERITY_WEIGHTS[inc.crimeType] || 2;
      });
      const avgSeverityWeight = totalWeight / districtIncidents.length;
      const severityScore = (avgSeverityWeight / 10) * 30;

      // ── 3. Recidivism Component (Max 15 points) ───────────
      // Ratio of crimes committed by repeat offenders
      const repeatOffenderCrimes = districtIncidents.filter(inc => inc.suspect && inc.suspect.repeatOffender);
      const recidivismRate = repeatOffenderCrimes.length / districtIncidents.length;
      const recidivismScore = Math.min(15, recidivismRate * 100);

      // ── 4. Trend Component (Max 15 points) ────────────────
      // Percentage change in last 30 days vs previous 30 days
      const limitDate = new Date(2025, 6, 3); // current time July 3, 2025
      const thirtyDaysAgo = new Date(2025, 6, 3);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(2025, 6, 3);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentIncidents = districtIncidents.filter(inc => {
        const d = new Date(inc.date);
        return d >= thirtyDaysAgo && d <= limitDate;
      });

      const priorIncidents = districtIncidents.filter(inc => {
        const d = new Date(inc.date);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      });

      let trendFactor = 0.5; // neutral multiplier
      let trendPct = 0;
      if (priorIncidents.length > 0) {
        trendPct = ((recentIncidents.length - priorIncidents.length) / priorIncidents.length) * 100;
        // Map trend percentage (-50% to +50%) into trend points (0 to 15)
        trendFactor = Math.max(-1.0, Math.min(1.0, trendPct / 50));
      }
      const trendScore = 7.5 + (trendFactor * 7.5);

      // ── Calculate Final Aggregated Score ──────────────────
      const rawScore = frequencyScore + severityScore + recidivismScore + trendScore;
      const score = Math.max(12, Math.min(99, Math.round(rawScore)));

      // Map score to level
      let level = 'low';
      if (score >= 85) level = 'critical';
      else if (score >= 65) level = 'high';
      else if (score >= 45) level = 'medium';

      // ── 5. Explainable AI Reason Generation ───────────────
      const factors = [];
      
      // Frequency comment
      if (districtIncidents.length > 1000) {
        factors.push(`Critical incident volume (${districtIncidents.length} cases) representing ${((districtIncidents.length/totalCrimesCount)*100).toFixed(1)}% of statewide cases.`);
      } else if (districtIncidents.length > 400) {
        factors.push(`Elevated crime activity (${districtIncidents.length} cases) requiring targeted precinct monitoring.`);
      } else {
        factors.push(`Stable incident rate (${districtIncidents.length} cases) within standard control thresholds.`);
      }

      // Severity comment
      const highSeverityCrimes = districtIncidents.filter(i => i.severity === 'critical' || i.severity === 'high');
      const ratio = highSeverityCrimes.length / districtIncidents.length;
      if (ratio > 0.4) {
        factors.push(`High concentration of critical-severity cases (${Math.round(ratio*100)}% of local logs consist of narcotics, murder, or robberies).`);
      }

      // Recidivism comment
      if (repeatOffenderCrimes.length > 0) {
        factors.push(`Recidivism risk: ${Math.round(recidivismRate*100)}% of local incidents are linked to repeat offenders registered in the KSP database.`);
      }

      // Trend comment
      if (trendPct > 15) {
        factors.push(`Sharp crime trajectory spike: local cases rose by ${Math.round(trendPct)}% in the last 30 days.`);
      } else if (trendPct < -10) {
        factors.push(`Positive local intervention effect: local crime logs decreased by ${Math.abs(Math.round(trendPct))}% over the last 30 days.`);
      }

      // ── 6. Recommendation Card Generator ──────────────────
      const recommendations = [];
      if (level === 'critical') {
        recommendations.push('Redeploy 4 mobile patrol units to critical transit terminals and bypass points.');
        recommendations.push('Establish automated checkpost barricades on main inbound national highways.');
        recommendations.push('Alert local plainclothes detective units to step up surveillance on wanted suspects.');
      } else if (level === 'high') {
        recommendations.push('Increase visual patrolling presence in commercial sectors during high-incident hours.');
        recommendations.push('Coordinate with the local cyber crime division to issue SMS alerts to citizens on active scams.');
        recommendations.push('Ensure 100% CCTV uptime auditing at high-density public squares.');
      } else {
        recommendations.push('Maintain baseline precinct patrols.');
        recommendations.push('Conduct standard neighborhood watch meetings and review CCTV backups weekly.');
      }

      return {
        score: score,
        level: level,
        factors: factors,
        recommendations: recommendations
      };
    }
  };

  // Expose globally
  window.KSPRiskEngine = KSPRiskEngine;
})();
