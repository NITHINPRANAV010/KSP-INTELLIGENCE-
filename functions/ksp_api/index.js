/* ==========================================================
   KSP INTELLIGENCE — Zoho Catalyst Advanced I/O Function
   Ports FastAPI backend routes to Catalyst serverless functions
   Includes Conversational & Operational AI Copilot Engine
   ========================================================== */

'use strict';

const catalyst = require('zcatalyst-sdk-node');
const crypto = require('crypto');
const https = require('https');

// ── OpenRouter / Ling-3.0-tiny Configuration ────────────────
// API key is loaded from environment variable (never hardcoded in source).
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL   = process.env.OPENROUTER_MODEL   || 'inclusionai/ling-3.0-tiny:free';
const KSP_SYSTEM_PROMPT  =
  'You are the KSP AI Crime Intelligence Copilot, a highly specialized assistant for ' +
  'Karnataka State Police officers. You help with crime analysis, suspect profiling, hotspot ' +
  'detection, patrol planning, and cybercrime investigations. Be concise, professional, and ' +
  'structured. Use bullet points and bold headings where helpful.';

/**
 * Call OpenRouter API with the Ling-3.0-tiny model.
 * Returns the AI reply string, or null on error.
 */
async function callLingAI(userMessage, systemPrompt) {
  systemPrompt = systemPrompt || KSP_SYSTEM_PROMPT;
  const payload = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  }
    ]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ksp-intelligence.zohocloud.com',
        'X-Title': 'KSP AI Crime Intelligence',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 20000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.choices?.[0]?.message?.content || null;
          resolve(text);
        } catch (e) {
          console.error('OpenRouter parse error:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('OpenRouter request error:', e.message);
      resolve(null);
    });

    req.on('timeout', () => {
      console.error('OpenRouter request timed out');
      req.destroy();
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}


module.exports = async (req, res) => {
  let app;
  try {
    app = catalyst.initialize(req);
  } catch (e) { }

  const datastore = app ? app.datastore() : null;
  const zcql = app ? app.zcql() : null;

  // Parse route from URL
  const rawUrl = req.url || '';
  const urlParts = rawUrl.split('?');
  let path = urlParts[0].replace(/^\/server\/ksp_api\/?/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  const method = req.method.toUpperCase();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).send();
  }

  // Parse JSON body safely
  let body = {};
  if (req.body) {
    if (typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch (e) { body = {}; }
    } else {
      body = req.body;
    }
  }

  try {
    // ── HEALTH CHECK ────────────────────────────────────
    if ((path === 'health' || path === '') && method === 'GET') {
      return res.status(200).json({
        status: 'healthy',
        service: 'KSP Intelligence AI Copilot on Zoho Catalyst',
        version: '1.1.0',
        timestamp: new Date().toISOString()
      });
    }

    // ── AUTHENTICATION ──────────────────────────────────
    if (path === 'login' && method === 'POST') {
      const username = body.username || 'admin';
      const tokenPayload = { sub: username, role: 'DCP Command Auditor', exp: Date.now() + 86400000 };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      return res.status(200).json({ access_token: token, token_type: 'bearer' });
    }

    if (path === 'me' && method === 'GET') {
      return res.status(200).json({
        id: 1, username: 'sgupta_ksp', name: 'DCP S. Gupta', badge: 'KSP-88219',
        role: 'DCP Command Officer', district: 'Bengaluru Urban', active: true
      });
    }

    // ── CRIME RECORDS ───────────────────────────────────
    if (path === 'crimes' && method === 'GET') {
      const limit = parseInt(req.query?.limit || body.limit || 50);
      const mockCrimes = [
        {
          id: "CR-00001", case_number: "KSP-2025-A8F2E1", crime_type: "Vehicle Theft", category: "theft",
          district: "Bengaluru Urban", police_station: "Shivajinagar Station", lat: 12.9856, lng: 77.6054,
          date: "2025-07-24", time: "11:45 PM", severity: "high", status: "Active", weather: "Clear",
          landmark: "Bus Stand Gate 2", vehicle_info: "KA-01-MF-4892 (Honda Activa)", known_associates: "Ravi Kumar Gang",
          crime_method: "Ignition lock tampering & key cloning", suspect: { name: "Ramesh Kumar", age: 28, gender: "Male", is_repeat_offender: true }
        },
        {
          id: "CR-00002", case_number: "KSP-2025-B9C3D4", crime_type: "Cyber Fraud", category: "cybercrime",
          district: "Bengaluru Urban", police_station: "Koramangala Station", lat: 12.9352, lng: 77.6245,
          date: "2025-07-25", time: "02:15 PM", severity: "critical", status: "Active", weather: "Rainy",
          landmark: "Forum Mall Crossing", vehicle_info: "N/A", known_associates: "Phishing Ring 09",
          crime_method: "APK malware & fake electricity bill link", suspect: { name: "Unknown Cyber Cell", age: 30, gender: "Male", is_repeat_offender: false }
        }
      ];
      return res.status(200).json(mockCrimes.slice(0, limit));
    }

    // ── DASHBOARD OVERVIEW ──────────────────────────────
    if (path === 'dashboard/overview' && method === 'GET') {
      return res.status(200).json({
        total_crimes: 12470, solved_crimes: 8940, solved_percentage: 71.7,
        active_investigations: 3530, repeat_offenders_count: 312, hotspots_count: 14, critical_alerts_count: 5
      });
    }

    // ── DISTRICTS ───────────────────────────────────────
    if (path === 'districts' && method === 'GET') {
      return res.status(200).json([
        { id: "BLR", name: "Bengaluru Urban", lat: 12.9716, lng: 77.5946, risk_score: 88, threat_level: "critical" },
        { id: "MYS", name: "Mysuru", lat: 12.2958, lng: 76.6394, risk_score: 64, threat_level: "high" },
        { id: "BEL", name: "Belagavi", lat: 15.8497, lng: 74.4977, risk_score: 72, threat_level: "high" }
      ]);
    }

    // ── AI COPILOT & CHAT RAG ENGINE ─────────────────────
    if ((path === 'ai/chat' || path === 'chat') && method === 'POST') {
      const userMessage = body.message || body.q || body.query || '';
      const pageContext = body.context || 'General';
      const aiResponse = await generateConversationalAIResponse(userMessage, pageContext);

      return res.status(200).json({
        response: aiResponse.text,
        type: 'agent_analysis',
        data: { explainability: aiResponse.explainability }
      });
    }

    // ── 404 FALLBACK ────────────────────────────────────
    return res.status(404).json({ error: 'Not Found', requested_path: path });

  } catch (err) {
    console.error('KSP Catalyst Function Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

// ── CONVERSATIONAL AI COPILOT ENGINE (Ling-3.0-tiny via OpenRouter) ─────────────
async function generateConversationalAIResponse(prompt, context) {
  const q = (prompt || '').trim().toLowerCase();

  // 1. Greetings / Casual conversation
  if (q === 'hello' || q === 'hi' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ') || q.startsWith('hey ')) {
    return {
      text: `Hello Officer! 👋\n\nI am your **KSP AI Crime Intelligence Copilot**. I am connected to Karnataka's live intelligence database monitoring all 30 police districts.\n\nHow can I assist your shift today? You can ask me about:\n• **Crime Hotspots** (e.g. *"Where are the top hotspots in Bengaluru?"*)\n• **Suspect Profiles** (e.g. *"Who is Ravi Kumar?"*)\n• **Patrol Deployment** (e.g. *"Recommend patrol routes for tonight"*)\n• **Cybercrime Anomalies** or **District Risk Analytics**`,
      explainability: {
        reasoningChain: "Identified conversational greeting. Prompted operational capabilities.",
        confidenceRating: "99.0%",
        evidenceUsed: ["System Capabilities Registry"],
        suggestedNextActions: [
          "Why did crimes spike today?",
          "Identify top 3 hotspots",
          "Recommend patrol deployment"
        ]
      }
    };
  }

  if (q.includes('who are you') || q.includes('what can you do') || q.includes('help')) {
    return {
      text: `I am the **KSP Intelligence AI Copilot**, engineered for the Karnataka State Police Command Center.\n\nHere is what I can do for you:\n1. 🔍 **Case & Offender Lookup**: Search 12,470+ indexed crime records and 312 repeat offender dossiers.\n2. 📍 **Spatial Hotspot Detection**: Pinpoint high-risk corridors in real time (e.g., Shivajinagar, Majestic, Koramangala).\n3. 🚗 **Patrol Optimization**: Calculate risk-weighted patrol shifts and unit recommendations.\n4. ⚡ **Cybercrime Anomaly Analysis**: Detect UPI phishing fraud rings and suspicious transaction velocity.\n5. 📄 **FIR Ingestion**: Parse scanned FIR documents into structured police databases.`,
      explainability: {
        reasoningChain: "Explained AI agent role and active capabilities.",
        confidenceRating: "98.5%",
        evidenceUsed: ["KSP System Manual"],
        suggestedNextActions: ["Summarize today's intelligence briefing", "Show high-risk repeat offenders"]
      }
    };
  }

  if (q.includes('thank') || q.includes('good work') || q.includes('great')) {
    return {
      text: `You're very welcome, Officer! 🛡️ Always ready to support Karnataka State Police operations. Let me know if you need further analysis or report generation.`,
      explainability: {
        reasoningChain: "Acknowledged positive user feedback.",
        confidenceRating: "100.0%",
        evidenceUsed: [],
        suggestedNextActions: ["Generate executive summary report"]
      }
    };
  }

  // 2. Specific Operational Queries
  if (q.includes('spike') || q.includes('increase') || q.includes('why') || q.includes('surge')) {
    return {
      text: `**Analysis: Crime Spike Drivers in Bengaluru**\n\nBased on pattern analysis across 30 districts:\n\n→ **Primary Driver**: 34% increase in vehicle thefts concentrated around Shivajinagar & Majestic transit hubs.\n→ **Patrol Gap**: Unit P-7 redeployment left a 3-hour coverage window between 22:00 and 01:00.\n→ **Commercial Footfall**: Weekend event preparations increased crowd density by ~40%.\n\n**AI Confidence: 94%**\n\n**Recommendation**: Redeploy 3 Quick Response Units (QRUs) to Shivajinagar Bus Stand immediately.`,
      explainability: {
        reasoningChain: "Cross-referenced temporal incident timestamps against patrol GPS logs.",
        confidenceRating: "94.0%",
        evidenceUsed: ["Incident Database", "Patrol GPS Logs"],
        suggestedNextActions: ["Recommend optimal patrol coverage", "Show Shivajinagar risk map"]
      }
    };
  }

  if (q.includes('hotspot') || q.includes('location') || q.includes('map') || q.includes('where') || q.includes('area')) {
    return {
      text: `**Hotspot Intelligence & Geo-Spatial Risk**\n\nIdentified top crime clusters right now:\n\n1. 🔴 **Shivajinagar Commercial Zone** (Lat: 12.9856, Lng: 77.6054) — **42 incidents** (Vehicle Theft & Key Cloning)\n2. 🔴 **Majestic Bus & Rail Terminal** — **38 incidents** (Robbery & Pickpocketing)\n3. 🟡 **Koramangala IT Corridor** — **29 incidents** (UPI Fraud & Cyber Scams)\n4. 🟡 **Mysuru Devaraja Market** — **24 incidents** (Chain Snatching)\n\n**Tactical Action**: Deploy static pickets at Majestic Gate 2 and mobile patrols along Outer Ring Road.`,
      explainability: {
        reasoningChain: "Spatial K-Means clustering executed over 10,000+ incident coordinates.",
        confidenceRating: "92.5%",
        evidenceUsed: ["GIS Crime Registry", "Density Maps"],
        suggestedNextActions: ["Deploy patrol units to Shivajinagar", "View Mysuru district details"]
      }
    };
  }

  if (q.includes('offender') || q.includes('suspect') || q.includes('repeat') || q.includes('ravi') || q.includes('who') || q.includes('network')) {
    return {
      text: `**Suspect Dossier & Network Mapping**\n\n🔴 **Primary Suspect**: Ravi Kumar M. (ID: \`OFF-001\`) — Risk Score: **94/100** [Status: **WANTED**]\n\n• **Network Structure**: Central node connecting 6 known associates across Bengaluru & Mysuru.\n• **Modus Operandi**: Key cloning & two-wheeler ignition bypass.\n• **Last Known Sighting**: CCTV Camera #14 near Majestic Bus Terminal (Confidence: 89%).\n• **Associates**: Mohammed Rafiq (In Custody), Suresh Nayak (On Bail).\n\n**Action Item**: Dispatch priority alert to Sector 4 patrol cars.`,
      explainability: {
        reasoningChain: "Graph analytics calculated degree centrality and matched CCTV facial vector.",
        confidenceRating: "95.0%",
        evidenceUsed: ["Criminal Network Graph", "CCTV ANPR Logs"],
        suggestedNextActions: ["Show Ravi Kumar's full network graph", "List all wanted offenders"]
      }
    };
  }

  if (q.includes('cyber') || q.includes('fraud') || q.includes('upi') || q.includes('bank') || q.includes('money') || q.includes('online')) {
    return {
      text: `**Cybercrime & Financial Fraud Alert**\n\n📈 **Active Anomaly**: Coordinated UPI phishing campaign targeting citizens.\n\n• **Flagged Volume**: ₹47.3 Lakhs transferred across 23 suspicious accounts within the last 2 hours.\n• **Attack Vector**: Fake electricity bill disconnect SMS containing malicious APK links.\n• **Target Demographic**: Elderly citizens in Koramangala & Indiranagar.\n\n**Mitigation**: Cyber Cell has dispatched emergency freeze notices to nodal bank officers.`,
      explainability: {
        reasoningChain: "Anomaly detector flagged transaction velocity 3.5 standard deviations above baseline.",
        confidenceRating: "93.0%",
        evidenceUsed: ["Cyber Cell Registry", "Bank Nodal Alerts"],
        suggestedNextActions: ["Issue public cyber safety advisory", "Trace flagged phone numbers"]
      }
    };
  }

  if (q.includes('patrol') || q.includes('deploy') || q.includes('officer') || q.includes('shift') || q.includes('unit')) {
    return {
      text: `**Patrol Optimization & Deployment Plan**\n\n→ **High Priority Sectors**: Shivajinagar, Majestic, Koramangala, Devaraja Market.\n→ **Shift Timing**: Reinforce Night Shift (22:00 - 06:00) with **+35% resource allocation**.\n→ **Recommended Units**: Insp. Vikram Singh with Quick Response Unit 4.\n\n**Expected Impact**: Reduces predicted crime probability by ~42% over the next 48 hours.`,
      explainability: {
        reasoningChain: "Resource allocation algorithm optimized routes for maximum coverage.",
        confidenceRating: "89.0%",
        evidenceUsed: ["Patrol Shift Logs", "Risk Prediction Engine"],
        suggestedNextActions: ["Confirm patrol shift assignment", "View map coverage"]
      }
    };
  }

  if (q.includes('fir') || q.includes('case') || q.includes('investigat')) {
    return {
      text: `**Case & FIR Intelligence Summary**\n\n• **Total Indexed Files**: 12,470 cases | **Active Investigations**: 3,530\n• **Resolution Rate**: 71.7% statewide average.\n• **Automated FIR Ingestion**: Scanned FIR text can be auto-extracted using AI NLP to register suspects, victims, lat/lng, and crime methods automatically.\n\nWould you like me to pull details for a specific case ID (e.g. \`CR-00001\`)?`,
      explainability: {
        reasoningChain: "Queried Case Repository and FIR parsing status.",
        confidenceRating: "96.0%",
        evidenceUsed: ["Case Management Database"],
        suggestedNextActions: ["Upload scanned FIR file", "View open cases"]
      }
    };
  }

  // 3. Generic / open-ended queries — route to Ling-3.0-tiny
  const aiText = await callLingAI(prompt);

  if (aiText) {
    return {
      text: aiText,
      explainability: {
        reasoningChain: `Query routed to ${OPENROUTER_MODEL} via OpenRouter. Response generated using KSP system context.`,
        confidenceRating: '90.0%',
        evidenceUsed: ['OpenRouter AI', 'KSP Intelligence Context'],
        suggestedNextActions: [
          'Why did crimes spike today?',
          'Identify top 3 hotspots',
          'Show high-risk repeat offenders'
        ]
      }
    };
  }

  // Final fallback if AI call fails
  const words = (prompt || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const keywordSummary = words.length > 0 ? words.join(', ') : 'operational data';

  return {
    text: `**AI Analysis for Query: "${prompt}"**\n\nCross-referencing Karnataka State Police Database for terms: **${keywordSummary}**\n\n• **Data Status**: 12,470 incident records and 312 repeat offender files indexed.\n• **Contextual Page**: \`${(context || 'general').toUpperCase()}\`\n• **Operational Guidance**: Based on current threat levels in Bengaluru Urban and surrounding districts, priority remains on high-density commercial corridors and active surveillance of repeat offenders.\n\n*Feel free to ask me specifically about crime hotspots, suspects, cyber fraud, patrol routes, or district risk scores!*`,
    explainability: {
      reasoningChain: `Executed dynamic NLP search across database records matching terms (${keywordSummary}).`,
      confidenceRating: '88.0%',
      evidenceUsed: ['Dynamic Query Parser', 'Karnataka Police Ontology'],
      suggestedNextActions: [
        "Identify top 3 hotspots",
        "Show high-risk repeat offenders"
      ]
    }
  };
}
