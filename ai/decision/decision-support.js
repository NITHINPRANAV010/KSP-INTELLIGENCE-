/* =========================================================
   DECISION-SUPPORT.JS — Strategic Decision Intelligence Engine
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  const PRIORITY_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  /**
   * Generate patrol deployment recommendations based on risk engine data.
   */
  function patrolRecommendations(incidents) {
    const recs = [];
    const districts = [...new Set(incidents.map(i => i.district))].filter(Boolean);

    districts.forEach(district => {
      if (!window.KSPRiskEngine) return;
      const risk = KSPRiskEngine.calculateDistrictRisk(district);

      if (risk && risk.score >= 75) {
        const recentCount = incidents.filter(i => {
          const d = new Date(i.date);
          return i.district === district && d >= new Date('2025-06-26');
        }).length;

        recs.push({
          id: `patrol_${district.replace(/\s+/g, '_')}`,
          category: 'patrol',
          priority: risk.score >= 85 ? 'CRITICAL' : 'HIGH',
          action: `Deploy ${risk.score >= 85 ? '6' : '3'} additional patrol units to ${district}`,
          district,
          reason: `Risk score **${risk.score}/100** — ${recentCount} incidents in last 7 days`,
          confidence: parseFloat(Math.min(0.95, 0.6 + (risk.score - 75) * 0.015).toFixed(2)),
          icon: 'navigation',
          tags: ['patrol', 'deployment']
        });
      }
    });

    return recs.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]).slice(0, 4);
  }

  /**
   * Generate surveillance recommendations from anomaly detector output.
   */
  function surveillanceRecommendations(anomalies) {
    return anomalies
      .filter(a => a && (a.severity === 'critical' || (a.severity === 'high' && a.confidence > 0.75)))
      .slice(0, 4)
      .map(a => {
        const distName = a.district || 'All';
        const crime = a.crimeType || 'Activity';
        const desc = a.description || '';
        return {
          id: `surv_${(a.district || a.crimeType || 'All').replace(/\s+/g, '_')}_${Date.now()}`,
          category: 'surveillance',
          priority: a.severity === 'critical' ? 'CRITICAL' : 'HIGH',
          action: a.type === 'spike'
            ? `Activate CCTV monitoring grid in ${distName} for ${crime}`
            : a.type === 'unusual_location'
            ? `Deploy surveillance unit for ${crime} cluster in ${distName}`
            : `Increase monitoring for off-schedule ${crime} activity`,
          district: distName,
          reason: desc.replace(/\*\*/g, ''),
          confidence: a.confidence || 0.8,
          icon: 'eye',
          tags: ['surveillance', 'cctv', a.type || 'general']
        };
      });
  }

  /**
   * Generate cyber unit recommendations from cybercrime trends.
   */
  function cyberRecommendations(incidents) {
    const recs = [];
    const recentCyber = incidents.filter(i => {
      const d = new Date(i.date);
      return (i.category === 'cyber' || i.category === 'fraud') && d >= new Date('2025-06-10');
    });

    if (recentCyber.length >= 20) {
      const topDistricts = {};
      recentCyber.forEach(i => {
        if (i.district) {
          topDistricts[i.district] = (topDistricts[i.district] || 0) + 1;
        }
      });
      const sorted = Object.entries(topDistricts).sort((a, b) => b[1] - a[1]);
      const topDistrict = sorted.length > 0 ? sorted[0] : ['Unknown', 0];

      recs.push({
        id: 'cyber_unit_deploy',
        category: 'cyber',
        priority: 'HIGH',
        action: `Assign Cyber Crime Cell to ${topDistrict[0]} — UPI/Phishing surge`,
        district: topDistrict[0],
        reason: `${recentCyber.length} cybercrime incidents in last 3 weeks — ${topDistrict[1]} in ${topDistrict[0]} alone`,
        confidence: 0.85,
        icon: 'shield-alert',
        tags: ['cyber', 'fraud', 'unit']
      });

      recs.push({
        id: 'cyber_public_advisory',
        category: 'cyber',
        priority: 'MEDIUM',
        action: 'Issue statewide public advisory on UPI/phishing scams',
        district: 'All',
        reason: `${recentCyber.filter(i => i.category === 'fraud').length} financial fraud cases recorded — citizen risk high`,
        confidence: 0.80,
        icon: 'megaphone',
        tags: ['advisory', 'cyber']
      });
    }

    return recs;
  }

  /**
   * Generate forensic/intelligence recommendations from network analysis.
   */
  function intelligenceRecommendations() {
    const recs = [];
    if (!window.KSPNetworkIntelligence) return recs;

    const graph = KSPNetworkIntelligence.getGraph();
    const topNode = graph.centralNodes?.[0];
    if (topNode) {
      recs.push({
        id: `intel_central_node`,
        category: 'intelligence',
        priority: 'HIGH',
        action: `Prioritize investigation of **${topNode.label}** — highest network centrality score`,
        district: topNode.district || 'Unknown',
        reason: `Centrality score: ${topNode.centralityScore} — disrupting this node would fragment ${graph.links.filter(l => {
          const src = typeof l.source === 'object' ? l.source.id : l.source;
          const tgt = typeof l.target === 'object' ? l.target.id : l.target;
          return src === topNode.id || tgt === topNode.id;
        }).length} criminal connections`,
        confidence: 0.87,
        icon: 'git-branch',
        tags: ['network', 'intelligence']
      });
    }

    if (graph.communities?.length > 0) {
      recs.push({
        id: 'intel_gang_breakup',
        category: 'intelligence',
        priority: 'MEDIUM',
        action: `Initiate gang disruption operation — ${graph.communities.length} criminal clusters identified`,
        district: 'Multiple',
        reason: `Network analysis detected ${graph.communities.length} distinct criminal communities with ${graph.metadata.linkCount} verified associations`,
        confidence: 0.78,
        icon: 'users',
        tags: ['gang', 'community']
      });
    }

    return recs;
  }

  /**
   * Generate offender-specific action items.
   */
  function offenderRecommendations() {
    const recs = [];
    if (!window.KSPOffenderProfiler) return recs;

    const profiles = KSPOffenderProfiler.profileAll();
    const criticalOffenders = profiles.filter(p => p.riskScore >= 80 && p.status === 'Active');

    criticalOffenders.slice(0, 2).forEach(p => {
      recs.push({
        id: `offender_${p.id}`,
        category: 'offender',
        priority: 'CRITICAL',
        action: `Escalate surveillance on ${p.name} (Risk: ${p.riskScore}/100)`,
        district: p.district,
        reason: `${Math.round(p.reoffendingProbability * 100)}% reoffending probability — ${p.totalCases} linked cases, ${p.daysSinceLastOffense} days since last offense`,
        confidence: parseFloat(Math.min(0.95, 0.55 + p.riskScore / 200).toFixed(2)),
        icon: 'user-x',
        tags: ['offender', 'surveillance']
      });
    });

    return recs;
  }

  const KSPDecisionSupport = {
    _lastResult: null,

    /**
     * Generate comprehensive decision recommendations from all AI engines.
     * @param {Object} [options]
     * @param {number} [options.max=8] - Max recommendations to return
     * @returns {Object} { recommendations[], summary, generatedAt }
     */
    generate: function (options = {}) {
      const max = options.max || (window.KSPAIConfig ? KSPAIConfig.get('maxRecommendations') : 6);
      const incidents = KSPDatabase.getIncidents();

      // Get anomalies for surveillance recommendations
      let anomalies = [];
      if (window.KSPAnomalyDetector) {
        const scan = KSPAnomalyDetector.getLastScan() || KSPAnomalyDetector.scan();
        anomalies = scan.anomalies || [];
      }

      // Gather from all engines
      const allRecs = [
        ...patrolRecommendations(incidents),
        ...surveillanceRecommendations(anomalies),
        ...cyberRecommendations(incidents),
        ...intelligenceRecommendations(),
        ...offenderRecommendations()
      ];

      // Sort by priority then confidence
      const sorted = allRecs.sort((a, b) =>
        (PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]) || b.confidence - a.confidence
      );

      // Deduplicate by id
      const seen = new Set();
      const unique = sorted.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      const top = unique.slice(0, max);

      const criticalCount = top.filter(r => r.priority === 'CRITICAL').length;
      const highCount = top.filter(r => r.priority === 'HIGH').length;

      const result = {
        recommendations: top,
        counts: { critical: criticalCount, high: highCount, total: top.length },
        summary: `${top.length} AI-generated action items — ${criticalCount} critical, ${highCount} high priority.`,
        generatedAt: new Date().toISOString()
      };

      this._lastResult = result;

      if (window.KSPAIBus) KSPAIBus.emit('decision:updated', result);
      return result;
    },

    /** Get last result without recomputing */
    getLast: function () { return this._lastResult; },

    /**
     * Render a single recommendation as an HTML card string.
     */
    renderCard: function (rec) {
      const priorityColors = {
        CRITICAL: 'var(--critical)', HIGH: 'var(--warning)',
        MEDIUM: 'var(--accent-blue)', LOW: 'var(--text-muted)'
      };
      const color = priorityColors[rec.priority] || 'var(--text-muted)';

      return `
        <div class="card card-sm" style="border-left:3px solid ${color};margin-bottom:8px">
          <div class="flex items-center gap-sm" style="margin-bottom:4px">
            <span style="color:${color};font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em">${rec.priority}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase">${rec.category}</span>
            <span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">${Math.round(rec.confidence * 100)}% conf</span>
          </div>
          <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">${rec.action}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px">${rec.reason.replace(/\*\*/g, '')}</div>
        </div>`;
    }
  };

  window.KSPDecisionSupport = KSPDecisionSupport;

})();
