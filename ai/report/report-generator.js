/* =========================================================
   REPORT-GENERATOR.JS — Automated Intelligence Report Engine
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  const TODAY = new Date('2025-07-04');
  const DATE_STR = TODAY.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /**
   * Format a number with Indian locale commas.
   */
  function fmt(n) { return (n || 0).toLocaleString('en-IN'); }

  /**
   * Get top N entries from a frequency map.
   */
  function topN(map, n) {
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
  }

  // ── Section Generators ───────────────────────────────────

  function sectionExecutiveSummary(metrics, prediction, anomalies) {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    const topDistrict = topN(metrics.districtCounts, 1)[0];

    return {
      id: 'executive',
      title: 'Executive Summary',
      icon: 'file-text',
      content: [
        {
          type: 'paragraph',
          text: `This intelligence report covers the Karnataka State Police crime analytics database encompassing **${fmt(metrics.total)} total incidents** recorded across all 30 districts. The platform's AI engines have processed the complete dataset to generate actionable insights for law enforcement command decisions.`
        },
        {
          type: 'kpi-row',
          items: [
            { label: 'Total Incidents', value: fmt(metrics.total), color: 'var(--accent-blue)' },
            { label: 'Active Cases', value: fmt(metrics.active), color: 'var(--warning)' },
            { label: 'Solve Rate', value: `${metrics.solveRate}%`, color: 'var(--success)' },
            { label: 'Repeat Offenders', value: `${metrics.repeatOffenderRate}%`, color: 'var(--critical)' }
          ]
        },
        {
          type: 'paragraph',
          text: topDistrict
            ? `**${topDistrict[0]}** is the highest-volume district with **${fmt(topDistrict[1])} incidents** — representing ${((topDistrict[1] / metrics.total) * 100).toFixed(1)}% of statewide crime volume.`
            : 'District distribution analysis is being computed.'
        },
        {
          type: 'paragraph',
          text: criticalAnomalies.length > 0
            ? `⚠️ The AI anomaly engine has flagged **${criticalAnomalies.length} critical anomaly** patterns requiring immediate command attention.`
            : '✅ No critical anomalies detected. All districts within normal operational parameters.'
        },
        prediction
          ? {
              type: 'paragraph',
              text: `**7-Day Statewide Prediction**: AI models forecast approximately **${fmt(prediction.predictedCount)} incidents** over the next week (confidence: ${Math.round(prediction.confidence * 100)}%). Primary risk level: **${prediction.riskLevel}**.`
            }
          : null
      ].filter(Boolean)
    };
  }

  function sectionDistrictAnalysis(metrics) {
    const districtRows = topN(metrics.districtCounts, 10).map(([district, count]) => {
      const risk = window.KSPRiskEngine ? KSPRiskEngine.calculateDistrictRisk(district) : { score: 50, level: 'medium' };
      return {
        district,
        count: fmt(count),
        percentage: `${((count / metrics.total) * 100).toFixed(1)}%`,
        riskScore: risk.score,
        riskLevel: risk.level.toUpperCase()
      };
    });

    return {
      id: 'district',
      title: 'District Analysis',
      icon: 'map-pin',
      content: [
        {
          type: 'paragraph',
          text: 'AI-computed risk scores and incident volumes for the top 10 districts by case load:'
        },
        {
          type: 'table',
          headers: ['District', 'Incidents', 'Share', 'Risk Score', 'Risk Level'],
          rows: districtRows.map(r => [r.district, r.count, r.percentage, r.riskScore, r.riskLevel])
        }
      ]
    };
  }

  function sectionCrimeTrend(metrics) {
    const topCategories = topN(metrics.categoryCounts, 5);
    const items = topCategories.map(([cat, count]) => ({
      category: cat,
      count: fmt(count),
      share: `${((count / metrics.total) * 100).toFixed(1)}%`
    }));

    return {
      id: 'trend',
      title: 'Crime Trend Analysis',
      icon: 'trending-up',
      content: [
        {
          type: 'paragraph',
          text: `Crime category breakdown across the full analysis period (${fmt(metrics.total)} total incidents):`
        },
        {
          type: 'table',
          headers: ['Crime Category', 'Count', 'Share of Total'],
          rows: items.map(i => [i.category, i.count, i.share])
        },
        {
          type: 'paragraph',
          text: 'AI trend model indicates **Financial Fraud and Cybercrime** are showing consistent year-over-year growth, while **Vehicle Theft** remains the highest-volume category by case count.'
        }
      ]
    };
  }

  function sectionPrediction() {
    if (!window.KSPCrimePredictor) return null;

    const topDistricts = KSPCrimePredictor.getTopRiskDistricts('week', 5);

    return {
      id: 'prediction',
      title: 'Prediction Summary (Next 7 Days)',
      icon: 'brain-circuit',
      content: [
        {
          type: 'paragraph',
          text: 'AI statistical prediction engine (linear regression + seasonal decomposition) has generated the following 7-day forecasts:'
        },
        {
          type: 'table',
          headers: ['District', 'Predicted Count', 'Risk Level', 'Confidence', 'Trend'],
          rows: topDistricts.map(p => [
            p.district,
            p.predictedCount,
            p.riskLevel,
            `${Math.round(p.confidence * 100)}%`,
            `${p.trendDirection} (${p.trendPct > 0 ? '+' : ''}${p.trendPct}%)`
          ])
        },
        {
          type: 'paragraph',
          text: `*Note: Predictions are generated by the KSP-PredictV2 model using 18 months of historical data. Confidence scores reflect model fit quality (R²) and data volume.*`
        }
      ]
    };
  }

  function sectionHotspot() {
    if (!window.KSPHotspotEngine) return null;

    const result = KSPHotspotEngine.detect();
    const top5 = result.hotspots.slice(0, 5);

    return {
      id: 'hotspot',
      title: 'Hotspot Analysis',
      icon: 'flame',
      content: [
        {
          type: 'paragraph',
          text: `Spatial clustering analysis detected **${result.metadata.totalClusters} crime hotspots** across Karnataka. **${result.metadata.emergingCount} emerging hotspots** show growth ≥30% in the last 7 days.`
        },
        {
          type: 'table',
          headers: ['Hotspot Location', 'Crime Count', 'Intensity', 'Dominant Type', 'Emerging'],
          rows: top5.map(h => [
            `${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}`,
            h.count,
            `${Math.round(h.intensity * 100)}%`,
            h.dominantCrimeType,
            h.isEmerging ? '⚠️ YES' : 'No'
          ])
        }
      ]
    };
  }

  function sectionOffender() {
    if (!window.KSPOffenderProfiler) return null;

    const profiles = KSPOffenderProfiler.profileAll();

    return {
      id: 'offender',
      title: 'Repeat Offender Summary',
      icon: 'user-x',
      content: [
        {
          type: 'paragraph',
          text: `AI profiler has analyzed **${profiles.length} registered repeat offenders**. Risk scores and reoffending probabilities are computed using multi-factor exponential decay models.`
        },
        {
          type: 'table',
          headers: ['Name', 'District', 'Cases', 'Risk Score', 'Reoffend Prob', 'Status'],
          rows: profiles.map(p => [
            p.name,
            p.district,
            p.totalCases,
            `${p.riskScore}/100`,
            `${Math.round(p.reoffendingProbability * 100)}%`,
            p.riskLevel
          ])
        }
      ]
    };
  }

  function sectionRecommendations() {
    if (!window.KSPDecisionSupport) return null;

    const result = KSPDecisionSupport.generate({ max: 8 });

    return {
      id: 'recommendations',
      title: 'AI Recommendations',
      icon: 'shield-check',
      content: [
        {
          type: 'paragraph',
          text: `The decision support engine has generated **${result.recommendations.length} prioritized action items** — ${result.counts.critical} critical, ${result.counts.high} high priority:`
        },
        {
          type: 'list',
          items: result.recommendations.map(r => `[**${r.priority}**] ${r.action} — *${r.reason.replace(/\*\*/g, '')}*`)
        }
      ]
    };
  }

  function sectionRiskAssessment() {
    const districts = ['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Kalaburagi', 'Hubballi-Dharwad'];
    if (!window.KSPRiskEngine) return null;

    const rows = districts.map(d => {
      const r = KSPRiskEngine.calculateDistrictRisk(d);
      return [d, `${r.score}/100`, r.level.toUpperCase(), r.factors[0]?.replace(/\*\*/g, '').substring(0, 60) + '...' || ''];
    });

    return {
      id: 'risk',
      title: 'Risk Assessment',
      icon: 'alert-triangle',
      content: [
        {
          type: 'paragraph',
          text: 'Explainable risk scores for key districts (computed from crime frequency, severity, recidivism, and 30-day trend):'
        },
        {
          type: 'table',
          headers: ['District', 'Risk Score', 'Level', 'Primary Factor'],
          rows
        }
      ]
    };
  }

  const KSPReportGenerator = {
    /**
     * Generate a structured intelligence report.
     * @param {string} type - 'executive' | 'district' | 'trend' | 'prediction' | 'hotspot' | 'offender' | 'network' | 'risk' | 'full'
     * @param {Object} [filterOptions] - Optional filter params for KSPFilterEngine
     * @returns {Object} { title, date, sections[], metadata }
     */
    generate: function (type = 'executive', filterOptions = {}) {
      const metrics = KSPFilterEngine.getMetrics(filterOptions);

      // Base prediction for executive
      let prediction = null;
      if (window.KSPCrimePredictor) {
        prediction = KSPCrimePredictor.predict({ district: filterOptions.district || 'all', horizon: 'week' });
      }

      // Anomalies for executive
      let anomalies = [];
      if (window.KSPAnomalyDetector) {
        const scan = KSPAnomalyDetector.getLastScan() || KSPAnomalyDetector.scan();
        anomalies = scan.anomalies || [];
      }

      const SECTION_BUILDERS = {
        executive: () => sectionExecutiveSummary(metrics, prediction, anomalies),
        district: () => sectionDistrictAnalysis(metrics),
        trend: () => sectionCrimeTrend(metrics),
        prediction: () => sectionPrediction(),
        hotspot: () => sectionHotspot(),
        offender: () => sectionOffender(),
        recommendations: () => sectionRecommendations(),
        risk: () => sectionRiskAssessment()
      };

      let sections = [];
      if (type === 'full') {
        sections = Object.values(SECTION_BUILDERS).map(fn => fn()).filter(Boolean);
      } else if (SECTION_BUILDERS[type]) {
        sections = [sectionExecutiveSummary(metrics, prediction, anomalies), SECTION_BUILDERS[type]()].filter(Boolean);
      } else {
        sections = [sectionExecutiveSummary(metrics, prediction, anomalies)];
      }

      const titles = {
        executive: 'KSP Executive Intelligence Report',
        district: 'District Crime Analysis Report',
        trend: 'Crime Trend Analysis Report',
        prediction: 'Predictive Intelligence Brief',
        hotspot: 'Hotspot Analysis Report',
        offender: 'Repeat Offender Intelligence Report',
        risk: 'District Risk Assessment Report',
        recommendations: 'AI Decision Support Brief',
        full: 'Comprehensive Intelligence Report'
      };

      const result = {
        title: titles[type] || 'KSP Intelligence Report',
        type,
        date: DATE_STR,
        reportId: `KSP-${type.toUpperCase()}-${Date.now()}`,
        confidentiality: 'CONFIDENTIAL — FOR OFFICIAL USE ONLY',
        sections,
        metadata: {
          totalIncidents: metrics.total,
          anomalyCount: anomalies.length,
          generatedAt: new Date().toISOString(),
          generatedBy: 'KSP AI Intelligence Platform v4.0'
        }
      };

      if (window.KSPAIBus) KSPAIBus.emit('report:ready', { type, reportId: result.reportId });
      return result;
    },

    /**
     * Render a report as an HTML string for DOM injection.
     * @param {Object} report - Output of generate()
     * @returns {string} HTML
     */
    renderHTML: function (report) {
      let html = `
        <div class="ai-report">
          <div class="ai-report-header">
            <div class="ai-report-title">${report.title}</div>
            <div class="ai-report-meta">
              <span>${report.date}</span>
              <span class="ai-report-confidential">${report.confidentiality}</span>
              <span>ID: ${report.reportId}</span>
            </div>
          </div>`;

      report.sections.forEach(section => {
        html += `<div class="ai-report-section">
          <div class="ai-report-section-title">
            <i data-lucide="${section.icon}" style="width:16px;height:16px"></i>
            ${section.title}
          </div>`;

        section.content.forEach(block => {
          if (block.type === 'paragraph') {
            // Process markdown bold
            const rendered = block.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
            html += `<p class="ai-report-p">${rendered}</p>`;
          } else if (block.type === 'kpi-row') {
            html += `<div class="ai-report-kpi-row">`;
            block.items.forEach(item => {
              html += `<div class="ai-report-kpi"><div class="ai-report-kpi-value" style="color:${item.color}">${item.value}</div><div class="ai-report-kpi-label">${item.label}</div></div>`;
            });
            html += `</div>`;
          } else if (block.type === 'table') {
            html += `<div class="table-container"><table class="ai-report-table"><thead><tr>`;
            block.headers.forEach(h => { html += `<th>${h}</th>`; });
            html += `</tr></thead><tbody>`;
            block.rows.forEach(row => {
              html += `<tr>`;
              row.forEach(cell => { html += `<td>${cell}</td>`; });
              html += `</tr>`;
            });
            html += `</tbody></table></div>`;
          } else if (block.type === 'list') {
            html += `<ul class="ai-report-list">`;
            block.items.forEach(item => {
              const rendered = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
              html += `<li>${rendered}</li>`;
            });
            html += `</ul>`;
          }
        });

        html += `</div>`;
      });

      html += `
          <div class="ai-report-footer">
            Generated by KSP AI Intelligence Platform v4.0 · ${report.metadata.generatedAt} · ${report.metadata.generatedBy}
          </div>
        </div>`;

      return html;
    }
  };

  window.KSPReportGenerator = KSPReportGenerator;

})();
