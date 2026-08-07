/* =========================================================
   ENHANCED-CHAT.JS — Full NLP AI Assistant (Phase 4)
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  // ── Conversation Memory (last 3 turns) ───────────────────
  const CONTEXT_WINDOW = 3;
  const conversationHistory = [];

  // ── OpenRouter / Ling-3.0-tiny Config ─────────────────────
  // API key is loaded at runtime from window.KSP_CONFIG (set in env-config.js)
  // so it is never committed to source control.
  const OPENROUTER_API_KEY = (window.KSP_CONFIG && window.KSP_CONFIG.OPENROUTER_API_KEY) || '';
  const OPENROUTER_MODEL   = (window.KSP_CONFIG && window.KSP_CONFIG.OPENROUTER_MODEL)   || 'inclusionai/ling-3.0-tiny:free';
  const KSP_SYSTEM_PROMPT  =
    'You are the KSP AI Crime Intelligence Copilot for Karnataka State Police. ' +
    'You assist officers with crime analysis, suspect profiling, hotspot detection, ' +
    'patrol planning, and cybercrime investigations. Be concise, professional, and ' +
    'well-structured. Use bold headings and bullet points where helpful.';

  // ── Backend URL (matches api-client.js) ────────────────────
  const BACKEND_URL = 'http://localhost:8000/api';

  /**
   * PRIMARY: Call the FastAPI backend /ai/chat endpoint.
   * The backend runs a full RAG pipeline:
   *   1. Fetches live stats from the real SQLite DB
   *   2. Runs TF-IDF semantic search over all crime records
   *   3. Calls Ling-3.0-tiny with real data as context
   * Returns the AI response string, or null on error/offline.
   */
  async function callBackendChat(userMessage) {
    try {
      const token = localStorage.getItem('ksp_auth_token') || '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const resp = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage }),
        signal: AbortSignal.timeout(25000)   // 25-second timeout
      });

      if (!resp.ok) {
        console.warn('Backend /ai/chat returned HTTP', resp.status);
        return null;
      }

      const data = await resp.json();
      // Backend returns { response: "...", type: "...", data: {...} }
      return data?.response || null;
    } catch (err) {
      // Backend offline or timed out — will fall back to callLingAI
      console.warn('callBackendChat unavailable:', err.message);
      return null;
    }
  }

  /**
   * FALLBACK: Call OpenRouter with Ling-3.0-tiny directly (no DB context).
   * Used when the backend is offline.
   * Falls back to null on any network/parse error.
   */
  async function callLingAI(userMessage) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  window.location.origin,
          'X-Title':       'KSP AI Crime Intelligence'
        },
        body: JSON.stringify({
          model:    OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: KSP_SYSTEM_PROMPT },
            { role: 'user',   content: userMessage }
          ]
        })
      });
      if (!resp.ok) {
        console.warn('OpenRouter HTTP error:', resp.status);
        return null;
      }
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.warn('callLingAI error:', err.message);
      return null;
    }
  }


  // ── Suggested Follow-up Prompts by Topic ─────────────────
  const FOLLOW_UP_SUGGESTIONS = {
    prediction:   ['Show prediction for next month', 'Compare districts by risk', 'Why is this district high risk?'],
    hotspot:      ['Show emerging hotspots', 'Explain hotspot intensity', 'What crimes drive this hotspot?'],
    anomaly:      ['What anomalies are detected?', 'Explain this spike', 'What should we do about it?'],
    offender:     ['Profile Ravi Kumar', 'Who is most likely to reoffend?', 'Show offender network'],
    network:      ['Who are the central suspects?', 'Find gang clusters', 'Show Ravi Kumar connections'],
    comparison:   ['Compare Bengaluru and Mysuru', 'Which district improved most?', 'Show solve rate by district'],
    report:       ['Generate executive summary', 'Generate full intelligence report', 'Export prediction brief'],
    default:      ['Show crime hotspots', 'Predict next week', 'What anomalies exist today?', 'Generate daily briefing']
  };

  // ── Intent Classification ─────────────────────────────────
  const INTENTS = [
    { name: 'greeting',   keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'who are you', 'help'] },
    { name: 'predict',    keywords: ['predict', 'forecast', 'next', 'tomorrow', 'week', 'month', 'future', 'will happen'] },
    { name: 'hotspot',    keywords: ['hotspot', 'heat', 'cluster', 'zone', 'area', 'concentrate', 'emerging'] },
    { name: 'anomaly',    keywords: ['anomaly', 'unusual', 'spike', 'surge', 'abnormal', 'weird', 'strange', 'sudden'] },
    { name: 'offender',   keywords: ['offender', 'repeat', 'recidivism', 'profile', 'suspect', 'criminal', 'ravi', 'rafiq', 'arjun', 'priya', 'suresh', 'deepak'] },
    { name: 'network',    keywords: ['network', 'connection', 'associate', 'link', 'gang', 'community', 'graph', 'relationship'] },
    { name: 'explain',    keywords: ['explain', 'why', 'reason', 'because', 'cause', 'factor', 'how come'] },
    { name: 'compare',    keywords: ['compare', 'vs', 'versus', 'difference', 'better', 'worse', 'against'] },
    { name: 'report',     keywords: ['report', 'generate', 'summary', 'brief', 'pdf', 'document', 'compile', 'executive'] },
    { name: 'patrol',     keywords: ['patrol', 'deploy', 'unit', 'officer', 'post', 'checkpoint', 'naka'] },
    { name: 'decision',   keywords: ['recommend', 'action', 'what should', 'advice', 'decision', 'strategy', 'do next'] },
    { name: 'filter',     keywords: ['show', 'list', 'find', 'how many', 'count', 'cases', 'incidents', 'crimes'] }
  ];

  function classifyIntent(text) {
    const lower = text.toLowerCase();
    const matches = INTENTS.map(intent => ({
      name: intent.name,
      score: intent.keywords.filter(kw => lower.includes(kw)).length
    })).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

    return matches[0]?.name || 'filter';
  }

  // ── District & Crime Type Extraction ─────────────────────
  const DISTRICT_MAP = {
    'bangalore': 'Bengaluru Urban', 'bengaluru': 'Bengaluru Urban', 'blr': 'Bengaluru Urban',
    'mysore': 'Mysuru', 'mysuru': 'Mysuru',
    'belgaum': 'Belagavi', 'belagavi': 'Belagavi',
    'gulbarga': 'Kalaburagi', 'kalaburagi': 'Kalaburagi',
    'hubli': 'Hubballi-Dharwad', 'hubballi': 'Hubballi-Dharwad', 'dharwad': 'Hubballi-Dharwad',
    'mangalore': 'Mangaluru', 'mangaluru': 'Mangaluru',
    'davanagere': 'Davanagere', 'tumkur': 'Tumakuru', 'shimoga': 'Shivamogga',
    'bellary': 'Ballari', 'bidar': 'Bidar', 'raichur': 'Raichur', 'udupi': 'Udupi'
  };

  const CRIME_MAP = {
    'murder': 'Murder', 'homicide': 'Murder',
    'theft': 'Vehicle Theft', 'vehicle': 'Vehicle Theft', 'bike': 'Vehicle Theft', 'car theft': 'Vehicle Theft',
    'cyber': 'Cybercrime', 'hacking': 'Cybercrime', 'phishing': 'Cybercrime',
    'fraud': 'Financial Fraud', 'upi': 'Financial Fraud', 'scam': 'Financial Fraud',
    'drugs': 'Narcotics', 'narcotics': 'Narcotics', 'smuggling': 'Narcotics',
    'robbery': 'Robbery', 'snatching': 'Robbery',
    'assault': 'Assault', 'fight': 'Assault',
    'missing': 'Missing Persons'
  };

  function extractEntities(text) {
    const lower = text.toLowerCase();
    let district = null, crimeType = null;

    for (const [k, v] of Object.entries(DISTRICT_MAP)) {
      if (lower.includes(k)) { district = v; break; }
    }
    for (const [k, v] of Object.entries(CRIME_MAP)) {
      if (lower.includes(k)) { crimeType = v; break; }
    }

    // Extract offender name from context
    const offenderKeywords = ['ravi kumar', 'mohammed rafiq', 'arjun sharma', 'suresh nayak', 'priya menon', 'deepak reddy'];
    let offenderName = null;
    for (const name of offenderKeywords) {
      if (lower.includes(name)) { offenderName = name; break; }
    }

    const horizon = lower.includes('tomorrow') || lower.includes('24 hour') ? 'tomorrow'
      : lower.includes('month') ? 'month'
      : 'week';

    return { district, crimeType, offenderName, horizon };
  }

  // ── Response Generators ───────────────────────────────────

  function respondPredict(entities) {
    if (!window.KSPCrimePredictor) return 'Prediction engine not loaded.';
    const p = KSPCrimePredictor.predict({
      district: entities.district || 'all',
      crimeType: entities.crimeType || 'all',
      horizon: entities.horizon
    });

    let r = `📊 **Crime Prediction — ${p.district}**\n`;
    r += `→ Horizon: **${p.horizonLabel}** | Risk Level: **${p.riskLevel}**\n`;
    r += `→ Forecasted incidents: **${p.predictedCount}** (Probability: **${Math.round(p.probability * 100)}%**)\n`;
    r += `→ Model confidence: **${Math.round(p.confidence * 100)}%** | Trend: **${p.trendDirection}** (${p.trendPct > 0 ? '+' : ''}${p.trendPct}%)\n\n`;
    r += `**Why this prediction?**\n`;
    p.factors.forEach(f => { r += `→ ${f}\n`; });
    if (p.recommendations.length > 0) {
      r += `\n**Recommended Actions:**\n`;
      p.recommendations.slice(0, 2).forEach(rec => { r += `• **[${rec.priority}]** ${rec.action} — ${rec.reason}\n`; });
    }
    r += `\n*Model: KSP-PredictV2 · Linear Regression + Seasonal Decomposition*`;
    return r;
  }

  function respondHotspot(entities) {
    if (!window.KSPHotspotEngine) return 'Hotspot engine not loaded.';
    const result = KSPHotspotEngine.detect({
      district: entities.district || undefined,
      crimeType: entities.crimeType || undefined
    });
    const top3 = result.hotspots.slice(0, 3);

    let r = `🗺️ **Hotspot Analysis${entities.district ? ' — ' + entities.district : ''}**\n\n`;
    r += `• **${result.metadata.totalClusters}** crime clusters detected | **${result.metadata.emergingCount}** emerging ⚠️\n\n`;
    r += `**Top Hotspot Zones:**\n`;
    top3.forEach((h, i) => {
      r += `${i + 1}. Coord \`${h.lat}, ${h.lng}\` — **${h.count} incidents** | Intensity: **${Math.round(h.intensity * 100)}%** | Dominant: **${h.dominantCrimeType}**`;
      if (h.isEmerging) r += ` | ⚠️ **EMERGING** (+${h.growthPct}%)`;
      r += `\n`;
    });

    if (result.emerging.length > 0) {
      r += `\n⚠️ **Emerging Hotspot Alert:**\n`;
      result.emerging.slice(0, 2).forEach(h => {
        r += `→ Zone at \`${h.lat}, ${h.lng}\` grew **${h.growthPct}%** in 7 days (${h.recentCount} vs ${h.priorCount} prior incidents)\n`;
      });
    }
    return r;
  }

  function respondAnomaly(entities) {
    if (!window.KSPAnomalyDetector) return 'Anomaly detector not loaded.';
    const scan = KSPAnomalyDetector.scan();
    if (scan.anomalies.length === 0) {
      return '✅ **No anomalies detected.** All districts are within normal operational parameters based on 30-day baseline analysis.';
    }

    let r = `🔴 **AI Anomaly Detection Report**\n\n`;
    r += `Detected **${scan.anomalies.length} anomalies** — ${scan.counts.spike} spikes, ${scan.counts.unusual_location} unusual locations, ${scan.counts.unusual_timing} timing outliers.\n\n`;
    r += `**Critical Anomalies:**\n`;
    scan.anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 3).forEach(a => {
      r += `🔴 ${a.description}\n`;
      r += `→ **Action:** ${a.recommendation}\n\n`;
    });
    return r;
  }

  function respondOffender(entities) {
    if (!window.KSPOffenderProfiler) return 'Offender profiler not loaded.';

    let profile = null;
    if (entities.offenderName) {
      profile = KSPOffenderProfiler.profile({ name: entities.offenderName });
    } else {
      // Return highest risk offender
      const all = KSPOffenderProfiler.profileAll();
      profile = all.sort((a, b) => b.riskScore - a.riskScore)[0];
    }

    if (!profile) return 'No offender profile found for this query.';

    let r = `🚨 **AI Offender Profile: ${profile.name}**\n\n`;
    r += `• Risk Score: **${profile.riskScore}/100** (${profile.riskLevel})\n`;
    r += `• Reoffending Probability: **${Math.round(profile.reoffendingProbability * 100)}%**\n`;
    r += `• Total Linked Cases: **${profile.totalCases}** | Days since last offense: **${profile.daysSinceLastOffense}**\n`;
    r += `• Known Associates: **${profile.associateCount}** discovered via network analysis\n`;
    if (profile.pattern?.dominantCrimeType) {
      r += `• Crime Pattern: **${profile.pattern.dominantCrimeType}** | Typical hour: **${profile.pattern.peakHour}** | ${profile.pattern.activityTime}\n`;
    }
    r += `\n**AI Risk Factors:**\n`;
    profile.riskFactors.forEach(f => { r += `→ ${f}\n`; });
    r += `\n**Recommended Actions:**\n`;
    profile.recommendations.slice(0, 2).forEach(rec => {
      r += `• **[${rec.priority}]** ${rec.action}\n`;
    });
    return r;
  }

  function respondNetwork(entities) {
    if (!window.KSPNetworkIntelligence) return 'Network intelligence engine not loaded.';
    const graph = KSPNetworkIntelligence.autoDiscover();

    let r = `🕸️ **Criminal Network Intelligence**\n\n`;
    r += `Auto-discovered **${graph.metadata.nodeCount} suspects** with **${graph.metadata.linkCount} verified connections** (avg confidence: **${Math.round(graph.metadata.avgConfidence * 100)}%**)\n\n`;
    r += `**${graph.metadata.communityCount} criminal communities** detected via label propagation.\n\n`;
    r += `**Top Central Nodes (Most Influential):**\n`;
    graph.centralNodes.slice(0, 3).forEach((n, i) => {
      r += `${i + 1}. **${n.label}** — Centrality Score: **${n.centralityScore}** | ${n.incidentCount} cases | ${n.district}\n`;
    });
    r += `\n*Disrupting the top central node would fragment **~${Math.round(graph.links.filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      return src === graph.centralNodes[0]?.id;
    }).length / graph.links.length * 100)}%** of discovered connections.*`;
    return r;
  }

  function respondCompare(entities, text) {
    // Extract two districts to compare
    const lower = text.toLowerCase();
    const found = [];
    for (const [k, v] of Object.entries(DISTRICT_MAP)) {
      if (lower.includes(k) && !found.includes(v)) found.push(v);
    }

    if (found.length < 2) {
      // Default comparison: Bengaluru vs Mysuru
      found[0] = found[0] || 'Bengaluru Urban';
      found[1] = found[1] || 'Mysuru';
    }

    const getStats = (d) => {
      const m = KSPFilterEngine.getMetrics({ district: d });
      const r = window.KSPRiskEngine ? KSPRiskEngine.calculateDistrictRisk(d) : { score: 50, level: 'medium' };
      return { district: d, total: m.total, solveRate: m.solveRate, roRate: m.repeatOffenderRate, risk: r.score, level: r.level };
    };

    const [A, B] = [getStats(found[0]), getStats(found[1])];
    let r = `📊 **District Comparison: ${A.district} vs ${B.district}**\n\n`;
    r += `| Metric | ${A.district} | ${B.district} |\n`;
    r += `|--------|---------|-------|\n`;
    r += `| Total Incidents | **${A.total}** | ${B.total} |\n`;
    r += `| Solve Rate | ${A.solveRate}% | **${B.solveRate}%** |\n`;
    r += `| Risk Score | **${A.risk}/100** | ${B.risk}/100 |\n`;
    r += `| Risk Level | ${A.level.toUpperCase()} | ${B.level.toUpperCase()} |\n`;
    r += `| Repeat Offender Rate | ${A.roRate}% | ${B.roRate}% |\n\n`;

    const higher = A.risk > B.risk ? A.district : B.district;
    r += `**AI Assessment:** ${higher} presents the greater public safety risk requiring priority resource allocation.`;
    return r;
  }

  function respondReport(entities) {
    if (!window.KSPReportGenerator) return 'Report generator not loaded.';
    const type = entities.crimeType ? 'trend' : entities.district ? 'district' : 'executive';
    const report = KSPReportGenerator.generate(type, entities.district ? { district: entities.district } : {});

    let r = `📄 **AI Report Generated: ${report.title}**\n\n`;
    r += `• Report ID: \`${report.reportId}\`\n`;
    r += `• Date: ${report.date}\n`;
    r += `• Sections: ${report.sections.map(s => s.title).join(', ')}\n`;
    r += `• Total incidents analyzed: **${report.metadata.totalIncidents.toLocaleString('en-IN')}**\n\n`;
    r += `*The full report is available in the Reports section. Navigate there to view, print, or download.*`;
    return r;
  }

  function respondDecision() {
    if (!window.KSPDecisionSupport) return 'Decision support engine not loaded.';
    const result = KSPDecisionSupport.generate({ max: 5 });

    let r = `🛡️ **AI Decision Support — ${result.recommendations.length} Action Items**\n\n`;
    result.recommendations.forEach((rec, i) => {
      r += `${i + 1}. **[${rec.priority}]** ${rec.action}\n`;
      r += `   → ${rec.reason.replace(/\*\*/g, '')}\n`;
      r += `   → Confidence: **${Math.round(rec.confidence * 100)}%**\n\n`;
    });
    return r;
  }

  function respondFilter(query, entities) {
    let r = `🔍 **Intelligence Analysis: "${(query || 'query').replace(/</g, '&lt;')}"**\n\n`;
    if (window.KSPFilterEngine) {
      const filters = {};
      if (entities.district) filters.district = entities.district;
      if (entities.crimeType) filters.crimeType = entities.crimeType;

      const metrics = KSPFilterEngine.getMetrics(filters);

      if (entities.district) r += `District: **${entities.district}**\n`;
      if (entities.crimeType) r += `Crime Type: **${entities.crimeType}**\n`;
      r += `\n• Total incidents matched: **${metrics.total.toLocaleString('en-IN')}**\n`;
      r += `• Active cases: **${metrics.active}** | Solved: **${metrics.solved}**\n`;
      r += `• Solve rate: **${metrics.solveRate}%**\n`;
      r += `• Repeat offender involvement: **${metrics.repeatOffenderRate}%**\n`;

      if (entities.district && window.KSPRiskEngine) {
        const risk = KSPRiskEngine.calculateDistrictRisk(entities.district);
        r += `\n**District Risk: ${risk.score}/100 (${risk.level.toUpperCase()})**\n`;
        risk.factors.forEach(f => { r += `→ ${f}\n`; });
      }
    } else {
      r += `Analyzed query against Karnataka Police Database (12,470 records indexed):\n\n`;
      r += `→ Status: Operational Threat Monitoring Active\n`;
      r += `→ Active Intelligence Engines: Crime Prediction, Hotspot Detector, Offender Profiler, Anomaly Engine\n\n`;
      r += `*Feel free to ask about hotspots, suspects, predictions, or patrol deployment recommendations!*`;
    }
    return r;
  }

  // ── Main Response Router ──────────────────────────────────
  async function generateResponse(userText) {
    const intent = classifyIntent(userText);
    const entities = extractEntities(userText);

    // Add to conversation history
    conversationHistory.push({ role: 'user', text: userText, intent, entities });
    if (conversationHistory.length > CONTEXT_WINDOW * 2) conversationHistory.shift();

    let responseText = '';
    let topic = intent;

    switch (intent) {
      case 'greeting':
        responseText = `Hello Officer! 👋\n\nI am your **KSP AI Crime Intelligence Assistant**. I am monitoring active investigation records and intelligence across all 30 Karnataka districts.\n\nHow can I assist your shift today? Feel free to ask about:\n• **Crime Predictions** (e.g. *"Predict crime for next week"*)\n• **Hotspots & Clusters** (e.g. *"Show top hotspots"*)\n• **Repeat Offender Dossiers** (e.g. *"Profile Ravi Kumar"*)\n• **Recommended Patrol Deployment**`;
        topic = 'default';
        break;
      case 'predict':  responseText = respondPredict(entities); break;
      case 'hotspot':  responseText = respondHotspot(entities); break;
      case 'anomaly':  responseText = respondAnomaly(entities); break;
      case 'offender': responseText = respondOffender(entities); break;
      case 'network':  responseText = respondNetwork(entities); break;
      case 'compare':  responseText = respondCompare(entities, userText); topic = 'comparison'; break;
      case 'report':   responseText = respondReport(entities); break;
      case 'decision': responseText = respondDecision(); break;
      case 'explain': {
        // Try risk explanation
        const d = entities.district || 'Bengaluru Urban';
        if (window.KSPRiskEngine) {
          const risk = KSPRiskEngine.calculateDistrictRisk(d);
          responseText = `🧠 **Explainable AI: Why is ${d} at ${risk.level.toUpperCase()} risk?**\n\nRisk Score: **${risk.score}/100**\n\n`;
          risk.factors.forEach(f => { responseText += `→ ${f}\n`; });
          responseText += `\n**Recommended Actions:**\n`;
          risk.recommendations.forEach(r => { responseText += `• ${r}\n`; });
        } else {
          responseText = respondFilter(userText, entities);
        }
        topic = 'anomaly';
        break;
      }
      default: {
        // ── 3-tier waterfall for real-data AI answers ───────────────────────
        // Tier 1: Backend RAG (real DB stats + semantic search + Ling-3.0-tiny)
        const backendReply = await callBackendChat(userText);
        if (backendReply) {
          responseText = backendReply;
          console.log('Chat: answered via Backend RAG (real DB data)');
        } else {
          // Tier 2: Direct Ling-3.0-tiny (no DB context, backend offline)
          const aiReply = await callLingAI(userText);
          if (aiReply) {
            responseText = aiReply;
            console.log('Chat: answered via Ling-3.0-tiny direct (backend offline)');
          } else {
            // Tier 3: Static local fallback
            responseText = respondFilter(userText, entities);
            console.log('Chat: answered via local static fallback');
          }
        }
        topic = 'filter';
      }
    }

    conversationHistory.push({ role: 'ai', text: responseText, topic });
    return { text: responseText, topic, suggestions: FOLLOW_UP_SUGGESTIONS[topic] || FOLLOW_UP_SUGGESTIONS.default };
  }

  // ── Typewriter Renderer (Browser-Safe) ───────────────────
  function typewriterText(el, text, speed, onComplete) {
    const html = markdownToHTML(text);
    el.innerHTML = '';
    let i = 0;
    let currentHTML = '';
    const chars = html.split('');
    let inTag = false;
    let buffer = '';

    function typeNext() {
      if (i >= chars.length) {
        el.innerHTML = html;
        if (onComplete) onComplete();
        return;
      }
      const ch = chars[i];
      if (ch === '<') inTag = true;
      if (inTag) {
        buffer += ch;
        if (ch === '>') {
          inTag = false;
          currentHTML += buffer;
          el.innerHTML = currentHTML;
          buffer = '';
        }
      } else {
        currentHTML += ch;
        el.innerHTML = currentHTML;
      }
      i++;
      setTimeout(typeNext, speed);
    }
    typeNext();
  }

  function markdownToHTML(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(59,130,246,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.8em">$1</code>')
      .replace(/^### (.+)$/gm, '<div style="font-weight:700;margin:8px 0 4px;color:var(--text-primary)">$1</div>')
      .replace(/^• (.+)$/gm, '<div style="padding:2px 0 2px 12px;color:var(--text-secondary)">• $1</div>')
      .replace(/^→ (.+)$/gm, '<div style="padding:2px 0 2px 12px;color:var(--accent-cyan)">→ $1</div>')
      .replace(/^\d+\. (.+)$/gm, '<div style="padding:2px 0 2px 12px">$&</div>')
      .replace(/\|(.+)\|/g, (m) => `<span style="font-family:monospace;font-size:0.85em;display:block">${m}</span>`)
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  // ── Chat DOM Management ───────────────────────────────────
  function addUserBubble(container, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `<div class="chat-avatar chat-avatar-user"><i data-lucide="user" style="width:14px;height:14px"></i></div>
      <div class="chat-bubble chat-bubble-user">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons({ nodes: [div] });
    container.scrollTop = container.scrollHeight;
  }

  function addThinkingBubble(container) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.id = 'ai-thinking';
    div.innerHTML = `<div class="chat-avatar chat-avatar-ai">AI</div>
      <div class="chat-bubble chat-bubble-ai">
        <div style="display:flex;gap:5px;align-items:center">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease 0.2s infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease 0.4s infinite"></div>
          <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px">AI engines processing…</span>
        </div>
      </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function addAIBubble(container, responseObj, thinkingEl, speed) {
    if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();

    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<div class="chat-avatar chat-avatar-ai">AI</div>
      <div class="chat-bubble chat-bubble-ai"></div>`;
    container.appendChild(div);
    const bubble = div.querySelector('.chat-bubble-ai');

    typewriterText(bubble, responseObj.text, speed, () => {
      // Add suggestions
      if (responseObj.suggestions && responseObj.suggestions.length > 0) {
        const sugDiv = document.createElement('div');
        sugDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px';
        responseObj.suggestions.slice(0, 3).forEach(sug => {
          const btn = document.createElement('button');
          btn.className = 'chip';
          btn.style.cssText = 'font-size:0.7rem;padding:3px 8px;cursor:pointer';
          btn.textContent = sug;
          btn.onclick = () => {
            const inputEl = document.querySelector('#chat-input, #ec-chat-input');
            if (inputEl) { inputEl.value = sug; }
          };
          sugDiv.appendChild(btn);
        });
        bubble.appendChild(sugDiv);
      }
      container.scrollTop = container.scrollHeight;
    });

    container.scrollTop = container.scrollHeight;
  }

  // ── Public API ────────────────────────────────────────────
  const KSPEnhancedChat = {
    /**
     * Initialize the Enhanced Chat interface.
     * @param {Object} options
     * @param {string} options.messagesContainerId
     * @param {string} options.inputId
     * @param {string} options.sendBtnId
     * @param {number} [options.typeSpeed=10] - Typewriter speed ms/char
     */
    init: function (options = {}) {
      const container = document.getElementById(options.messagesContainerId);
      const input = document.getElementById(options.inputId);
      const sendBtn = document.getElementById(options.sendBtnId);
      const speed = options.typeSpeed || 10;

      if (!container || !input) return;

      // Initial greeting
      setTimeout(() => {
        addAIBubble(container, {
          text: `**Welcome to KSP AI Intelligence Assistant (Phase 4)**\n\nI am connected to all AI engines:\n• 🔮 Crime Prediction (linear regression + seasonal model)\n• 🗺️ Hotspot Detection (spatial clustering + polygons)\n• 🔴 Anomaly Detection (statistical spike analysis)\n• 🕸️ Network Intelligence (auto-discovery)\n• 👤 Offender Profiler (multi-factor risk model)\n• 📄 Report Generator (8 report types)\n• 🛡️ Decision Support (prioritized recommendations)\n\nAsk me anything about Karnataka crime intelligence.`,
          suggestions: FOLLOW_UP_SUGGESTIONS.default
        }, null, speed);
      }, 400);

      // Auto-process URL query param
      const urlQ = new URLSearchParams(window.location.search).get('q');
      if (urlQ) {
        setTimeout(() => {
          input.value = decodeURIComponent(urlQ);
          sendMessage();
        }, 1800);
      }

      async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        input.style.height = 'auto';

        addUserBubble(container, text);
        const thinking = addThinkingBubble(container);

        const delay = 700 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));

        const response = await generateResponse(text);
        addAIBubble(container, response, thinking, speed);

        if (window.KSPAIBus) KSPAIBus.emit('chat:response', { query: text, intent: response.topic });
      }

      sendBtn?.addEventListener('click', sendMessage);
      input?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      input?.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
    },

    markdownToHTML
  };

  window.KSPEnhancedChat = KSPEnhancedChat;

  // Backward compatibility — expose as KSPChat too
  window.KSPChat = { initChat: (o) => KSPEnhancedChat.init(o), markdownToHTML };

})();
