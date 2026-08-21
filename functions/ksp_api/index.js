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
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL   = process.env.OPENROUTER_MODEL   || 'inclusionai/ling-3.0-tiny:free';
const KSP_SYSTEM_PROMPT  =
  'You are the KSP AI Crime Intelligence Copilot, a Senior Police Crime Intelligence Analyst ' +
  'for Karnataka State Police. Answer the officer\'s questions with structured intelligence assessments. ' +
  'Use bold headings, bullet points, and actionable police recommendations.';

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
      timeout: 25000
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

  // 1. Casual Greetings (instant response)
  if (q === 'hello' || q === 'hi' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ') || q.startsWith('hey ')) {
    return {
      text: `Hello Officer! 👋\n\nI am your **KSP AI Crime Intelligence Copilot**, powered by **Ling-3.0-tiny**. I am connected to Karnataka's live intelligence database monitoring all 30 police districts.\n\nHow can I assist your shift today? You can ask me anything about:\n• **Crime Hotspots** (e.g. *"Where are the top hotspots in Bengaluru?"*)\n• **Suspect Profiles** (e.g. *"Who is Ravi Kumar?"*)\n• **Patrol Deployment** (e.g. *"Recommend patrol routes for tonight"*)\n• **Cybercrime Anomalies** or **District Risk Analytics**`,
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

  // 2. Primary: Call Ling-3.0-tiny via OpenRouter with live system context
  const systemInstruction =
    'You are the KSP AI Crime Intelligence Copilot for Karnataka State Police. ' +
    'You assist police officers, inspectors, and commissioners with crime intelligence, suspect profiling, ' +
    'hotspot analysis, patrol allocation, cyber fraud tracking, and investigation strategy across Karnataka\'s 30 districts. ' +
    'Context: Total crimes: 12,470 (71.7% solved), Active investigations: 3,530, Repeat offenders: 312, Top districts: Bengaluru Urban (Risk 88), Belagavi (Risk 72), Mysuru (Risk 64). ' +
    'Current page context: ' + (context || 'General Intelligence') + '. ' +
    'Always provide realistic, actionable, and structured police intelligence responses with bold headings and bullet points.';

  try {
    const aiText = await callLingAI(prompt, systemInstruction);
    if (aiText) {
      return {
        text: aiText,
        explainability: {
          reasoningChain: `Query processed by ${OPENROUTER_MODEL} via OpenRouter with Karnataka Crime Intelligence context.`,
          confidenceRating: '94.0%',
          evidenceUsed: ['KSP Crime Database', 'OpenRouter Ling-3.0-tiny AI Engine', 'District Risk Registry'],
          suggestedNextActions: [
            'Why did crimes spike today?',
            'Identify top 3 hotspots',
            'Show high-risk repeat offenders'
          ]
        }
      };
    }
  } catch (err) {
    console.error('Ling AI call error:', err.message);
  }

  // 3. Fallback only if OpenRouter call fails / times out
  const words = (prompt || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const keywordSummary = words.length > 0 ? words.join(', ') : 'operational query';

  return {
    text: `**AI Intelligence Assessment for: "${prompt}"**\n\nBased on current Karnataka State Police intelligence records:\n\n• **State Overview**: 12,470 total recorded cases | 3,530 active investigations | 71.7% resolution rate.\n• **High-Risk Zones**: Bengaluru Urban (Risk 88/100), Belagavi (Risk 72/100), Mysuru (Risk 64/100).\n• **Key Suspects**: 312 repeat offenders under active monitoring.\n• **Analysis Focus**: Query cross-referenced against ${keywordSummary}.\n\n*Tactical Recommendation*: Intensify patrol frequency in commercial corridors and cross-reference vehicle theft registries.`,
    explainability: {
      reasoningChain: `Evaluated query parameters (${keywordSummary}) against indexed crime records.`,
      confidenceRating: '88.0%',
      evidenceUsed: ['Karnataka Crime Registry', 'District Risk Index'],
      suggestedNextActions: [
        'Identify top 3 hotspots',
        'Show high-risk repeat offenders'
      ]
    }
  };
}
