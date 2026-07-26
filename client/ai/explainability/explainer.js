/* =========================================================
   EXPLAINER.JS — Explainable AI (XAI) Layer
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  /**
   * Format a confidence value into a human-readable label and color class.
   */
  function confidenceLabel(confidence) {
    if (confidence >= 0.90) return { label: 'Very High Confidence', cls: 'text-success', icon: '🟢' };
    if (confidence >= 0.75) return { label: 'High Confidence', cls: 'text-success', icon: '🟢' };
    if (confidence >= 0.60) return { label: 'Moderate Confidence', cls: 'text-warning', icon: '🟡' };
    if (confidence >= 0.45) return { label: 'Low Confidence', cls: 'text-warning', icon: '🟡' };
    return { label: 'Uncertain', cls: 'text-danger', icon: '🔴' };
  }

  /**
   * Format a risk score into a readable tier.
   */
  function riskTier(score) {
    if (score >= 85) return { label: 'CRITICAL', cls: 'badge-critical', color: 'var(--critical)' };
    if (score >= 65) return { label: 'HIGH', cls: 'badge-high', color: 'var(--warning)' };
    if (score >= 45) return { label: 'MEDIUM', cls: 'badge-medium', color: '#F59E0B' };
    return { label: 'LOW', cls: 'badge-low', color: 'var(--success)' };
  }

  /**
   * Generate XAI explanation card HTML from any AI module output.
   */
  function renderExplanationHTML(title, factors, confidence, score, recommendations) {
    const confInfo = confidenceLabel(confidence);
    const riskInfo = score !== undefined ? riskTier(score) : null;

    let html = `
      <div class="ai-explanation-card">
        <div class="ai-explanation-header">
          <span class="ai-explanation-icon">🧠</span>
          <span class="ai-explanation-title">${title}</span>
          <span class="ai-conf-badge ${confInfo.cls}">${confInfo.icon} ${confInfo.label}</span>
        </div>`;

    if (riskInfo && score !== undefined) {
      html += `
        <div class="ai-score-row">
          <span class="ai-score-label">AI Risk Score</span>
          <span class="ai-score-value" style="color:${riskInfo.color}">${score}/100</span>
          <span class="badge" style="background:${riskInfo.color};color:white;padding:2px 8px;border-radius:4px;font-size:0.7rem">${riskInfo.label}</span>
        </div>`;
    }

    if (factors && factors.length > 0) {
      html += `<div class="ai-why-header" style="margin-top:10px"><i data-lucide="info" style="width:12px;height:12px"></i> Why this result?</div>`;
      factors.forEach(f => {
        html += `<div class="ai-why-factor">${f}</div>`;
      });
    }

    if (recommendations && recommendations.length > 0) {
      html += `<div class="ai-why-header" style="margin-top:10px"><i data-lucide="shield-check" style="width:12px;height:12px"></i> Recommended Actions</div>`;
      recommendations.forEach(r => {
        const action = typeof r === 'string' ? r : r.action;
        const detail = typeof r === 'object' ? r.detail : '';
        const priority = typeof r === 'object' ? r.priority : 'MEDIUM';
        const pColor = priority === 'CRITICAL' ? 'var(--critical)' : priority === 'HIGH' ? 'var(--warning)' : 'var(--accent-blue)';
        html += `
          <div class="ai-rec-item">
            <span class="ai-rec-priority" style="color:${pColor}">[${priority}]</span>
            <span class="ai-rec-text">${action}${detail ? ` — <em>${detail}</em>` : ''}</span>
          </div>`;
      });
    }

    html += `</div>`;
    return html;
  }

  /**
   * Render a compact inline explanation badge.
   * Usage: instead of showing "Risk: 87%" show a badge with tooltip.
   */
  function renderInlineBadge(score, confidence, factors) {
    const riskInfo = riskTier(score);
    const confInfo = confidenceLabel(confidence);
    const tooltipText = factors?.slice(0, 2).map(f => f.replace(/\*\*/g, '')).join(' | ') || '';

    return `
      <span class="ai-inline-badge" style="border-left:3px solid ${riskInfo.color};padding:2px 8px;background:rgba(0,0,0,0.2);border-radius:4px;cursor:help" title="${tooltipText}">
        <span style="color:${riskInfo.color};font-weight:700">${score}</span>
        <span style="color:var(--text-muted);font-size:0.7em;margin-left:4px">${riskInfo.label}</span>
        <span style="color:var(--text-muted);font-size:0.7em;margin-left:4px">${confInfo.icon}</span>
      </span>`;
  }

  /**
   * Generate a plain-text explanation string (for chat responses).
   */
  function explainToText(moduleOutput) {
    const parts = [];

    if (moduleOutput.type === 'prediction') {
      const p = moduleOutput;
      parts.push(`📊 **Prediction: ${p.crimeType} in ${p.district}**`);
      parts.push(`→ Forecasted count: **${p.predictedCount} incidents** over ${p.horizonLabel}`);
      parts.push(`→ Probability: **${Math.round(p.probability * 100)}%** | Confidence: **${Math.round(p.confidence * 100)}%**`);
      parts.push(`→ Risk Level: **${p.riskLevel}** | Trend: **${p.trendDirection}** (${p.trendPct > 0 ? '+' : ''}${p.trendPct}%)`);
      if (p.factors) {
        parts.push('\n**Why this prediction?**');
        p.factors.forEach(f => parts.push(`→ ${f}`));
      }
    } else if (moduleOutput.type === 'anomaly') {
      const a = moduleOutput;
      parts.push(`🔴 **Anomaly Detected: ${a.type.replace(/_/g, ' ').toUpperCase()}**`);
      parts.push(a.description);
      if (a.recommendation) parts.push(`\n**Action:** ${a.recommendation}`);
    } else if (moduleOutput.riskScore !== undefined) {
      // Risk/offender profile
      const r = moduleOutput;
      const ri = riskTier(r.riskScore);
      parts.push(`⚠️ **AI Risk Assessment**`);
      parts.push(`→ Risk Score: **${r.riskScore}/100** (${ri.label})`);
      if (r.reoffendingProbability) parts.push(`→ Reoffending Probability: **${Math.round(r.reoffendingProbability * 100)}%**`);
      if (r.riskFactors) {
        parts.push('\n**Contributing Factors:**');
        r.riskFactors.forEach(f => parts.push(`→ ${f}`));
      }
    } else {
      // Generic explanation
      parts.push('AI analysis complete. No specific explanation template matched.');
    }

    return parts.join('\n');
  }

  const KSPExplainer = {
    /**
     * Render full explanation card HTML for any AI output object.
     * @param {string} title - Card heading
     * @param {Object} aiOutput - Output from any AI module
     * @returns {string} HTML string
     */
    render: function (title, aiOutput) {
      const factors = aiOutput.factors || aiOutput.riskFactors || aiOutput.explanation || [];
      const confidence = aiOutput.confidence || aiOutput.modelConfidence || 0.7;
      const score = aiOutput.riskScore || aiOutput.score;
      const recs = aiOutput.recommendations || aiOutput.actions || [];
      return renderExplanationHTML(title, factors, confidence, score, recs);
    },

    /**
     * Render inline badge (for use inside table cells or metric cards).
     */
    badge: function (score, confidence, factors) {
      return renderInlineBadge(score, confidence || 0.7, factors || []);
    },

    /**
     * Convert any AI output to plain text (for chat).
     */
    toText: function (aiOutput) {
      return explainToText(aiOutput);
    },

    /** Confidence label utility */
    confidenceLabel,

    /** Risk tier utility */
    riskTier
  };

  window.KSPExplainer = KSPExplainer;

})();
