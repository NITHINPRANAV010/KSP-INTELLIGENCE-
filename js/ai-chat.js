/* =========================================================
   AI-CHAT.JS — AI Investigation Chat Simulation
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  // Pre-defined AI responses keyed by keywords
  const AI_RESPONSES = {
    hotspot: `**Bengaluru Urban** is the primary hotspot this week with **1,247 recorded crimes** — a **34% spike** compared to last week.\n\nKey high-density zones:\n• **Shivajinagar** — Vehicle theft cluster (14 incidents in 72 hrs)\n• **Koramangala** — Cybercrime surge (UPI fraud pattern)\n• **Majestic Area** — Robbery and pickpocketing\n\nI recommend immediate deployment of **4 additional patrol units** to Shivajinagar and activating **plain-clothes teams** at Majestic Bus Stand.\n\n*Confidence: 94% | Model: KSP-PredictV2*`,

    offender: `**High-risk repeat offenders in Mysuru district:**\n\n1. **Mohammed Rafiq S.** — Risk Score: **87/100** (In Custody)\n   - 5 arrests | Robbery, Assault, Murder Attempt\n   - Last seen: Devaraja Market area\n\n2. **Suresh Nayak B.** — Risk Score: **71/100** (Released on Bail)\n   - 4 arrests | Vehicle Theft, Fraud\n   - Currently active — surveillance recommended\n\n*AI Assessment: Both subjects have high recidivism probability. Recommend enhanced monitoring for Nayak following bail release.*`,

    predict: `**Belagavi District — 72-Hour Prediction**\n\n📊 Risk Level: **HIGH** (Confidence: 71%)\n\n**Predicted Crime Type:** Vehicle Theft, Narcotics Trafficking\n\n**Why this prediction?**\n→ Known trafficking route NH-748 shows increased activity\n→ Border proximity with Goa creates smuggling corridor\n→ Weekend pattern: 40% spike in nighttime incidents\n→ Intelligence report: 2 active criminal cells identified\n\n**Recommended Actions:**\n• Set up naka points on NH-748 at Khanapur junction\n• Coordinate with Dharwad and Hubballi units\n• Deploy quick response team near border checkpoints`,

    network: `**Criminal Network Analysis — Case CR-4521**\n\n🔴 **Primary Suspect:** Ravi Kumar M. (Risk: 94/100)\n\nNetwork mapping reveals **6 direct associates** and **3 shared locations:**\n\n**Key Connections:**\n• Ravi Kumar ↔ Mohammed Rafiq — phone contact (14 calls in 30 days)\n• Ravi Kumar → KA-01-MF-4892 — linked to 3 theft incidents\n• Ravi Kumar ↔ Priya Menon — financial transactions flagged\n• Shivajinagar Bus Stand — common meeting point for all 3\n\n**AI Observation:** This network shows characteristics of an **organized gang** with clear hierarchy. Ravi Kumar is the central node. Disrupting this node would fragment the network by ~68%.`,

    summary: `**Executive Summary — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}**\n\n**State Crime Overview**\n• Total incidents today: **47** (+8.2% vs. yesterday)\n• Active cases: **1,284** | Solved this week: **312**\n• High-risk districts: **5** (BLR Urban, Mysuru, Belagavi, Kalaburagi, Hubballi)\n\n**Critical Alerts**\n• 🔴 Vehicle theft surge — Bengaluru Urban (+34%)\n• 🔴 Cybercrime anomaly — UPI fraud cluster detected\n• 🟡 Repeat offender Ravi Kumar sighted — Majestic area\n\n**AI Recommendations**\n1. Increase patrol density in Shivajinagar and Koramangala\n2. Cyber cell to issue public advisory on UPI fraud\n3. Activate CCTV monitoring protocol in Mysuru Palace Area\n\n*This briefing is AI-generated based on real-time crime data.*`,

    cybercrime: `**Cybercrime Trend Analysis — 2025**\n\n📈 Total Cases: **1,234** (YTD) — **+34.7%** vs. 2024\n\n**Top Crime Types:**\n1. UPI/Banking Fraud — 487 cases (39.5%)\n2. Social Media Impersonation — 234 cases (19%)\n3. OTP/Phishing Scams — 312 cases (25.3%)\n4. Online Investment Fraud — 201 cases (16.3%)\n\n**Emerging Pattern:** AI has detected a coordinated **phishing campaign** targeting elderly citizens (60+) in Bengaluru. Same SMS template used across 47 cases.\n\n**Recommended:** Trace mobile numbers +91-8095XXXXXX cluster. Issue advisory to banks to flag transactions >₹50,000 from new payees.`,

    patrol: `**Weekend Patrol Deployment Recommendation**\n\n**High Priority Zones:**\n\n🔴 **Bengaluru Urban** — Shivajinagar, Majestic\n   → Deploy: 6 units + 2 plain-clothes teams\n   → Active hours: 10PM – 4AM\n\n🟡 **Mysuru** — Palace Area, Devaraja Market\n   → Deploy: 3 units\n   → Active hours: 8PM – 2AM\n\n🟡 **Hubballi** — Station Road area\n   → Deploy: 2 units\n   → Active hours: 6PM – 12AM\n\n**Confidence:** 87% | Based on 24-month pattern analysis + festival calendar + weather data`,

    vehicle: `**Vehicle Theft Analysis — Last 30 Days**\n\nTotal cases: **234** | Recovery rate: **42%**\n\n**Top 5 Hotspot Locations:**\n1. Shivajinagar Bus Stand — 28 cases\n2. Bengaluru City Railway Station — 19 cases\n3. Mysuru Palace Parking — 12 cases\n4. Yeshwanthpur Market — 11 cases\n5. Hubballi Bus Stand — 9 cases\n\n**Most Stolen:** Two-wheelers (Honda Activa: 67 cases, Hero Splendor: 43 cases)\n\n**Pattern:** 78% of thefts occur between 8AM–6PM in commercial areas. Sophisticated key cloning method detected in 34 cases.\n\n**Linked Suspect:** Ravi Kumar M. linked to 7 cases via CCTV + witness statements.`,

    default: `I've analyzed your query. Based on current intelligence data from **Karnataka State Police Database**:\n\nThis query relates to active operational intelligence. I'm cross-referencing with:\n• Crime records database (1.2M+ cases)\n• Criminal network graph (4,800+ nodes)\n• Predictive model (91.4% accuracy)\n• CCTV and surveillance feeds\n\nWould you like me to generate a **detailed investigation report** or **drill down into specific districts, suspects, or crime types?**\n\n*Use suggested prompts below or type a specific question.*`,
  };

  function getAIResponse(query) {
    const q = query.toLowerCase();

    // ── Real Dynamic Mock Database NLP Hook ───────────
    if (window.KSPQueryEngine && window.KSPFilterEngine && window.KSPSearchEngine && window.KSPRiskEngine) {
      const parsed = KSPQueryEngine.parse(query);

      // Handle real filter queries
      if (parsed.action === 'filter' && (parsed.filters.district || parsed.filters.crimeType)) {
        const district = parsed.filters.district || 'all';
        const type = parsed.filters.crimeType || 'all';

        const filtered = KSPFilterEngine.query(parsed.filters);
        const metrics = KSPFilterEngine.getMetrics(parsed.filters);

        let response = `📊 **Live Database Filter Results**\n\n`;
        if (district !== 'all') {
          const riskInfo = KSPRiskEngine.calculateDistrictRisk(district);
          response += `Location Focus: **${district}** (Risk level: **${riskInfo.level.toUpperCase()}**, Score: **${riskInfo.score}**)\n`;
        }
        if (type !== 'all') {
          response += `Crime Category Focus: **${type}**\n`;
        }
        response += `\n• Total matched records: **${filtered.length.toLocaleString('en-IN')} cases**\n`;
        response += `• Caseload solve rate: **${metrics.solveRate}%**\n`;
        response += `• Active investigations: **${metrics.active}**\n`;

        if (filtered.length > 0) {
          response += `\n**Recent Incidents matching query:**\n`;
          filtered.slice(0, 3).forEach(inc => {
            response += `- \`${inc.id}\` | ${inc.crimeType} in ${inc.policeStation} (${inc.date}) - Status: **${inc.status}**\n`;
          });
        }
        return response;
      }

      // Handle risk explanations
      if (parsed.action === 'explain') {
        const district = parsed.filters.district || 'Bengaluru Urban';
        const riskInfo = KSPRiskEngine.calculateDistrictRisk(district);
        let response = `🧠 **AI Explainable Risk Reasoning: ${district}**\n\n`;
        response += `• Calculated Risk Index: **${riskInfo.score}/100**\n`;
        response += `• Safety Tier: **${riskInfo.level.toUpperCase()}**\n\n`;
        response += `**Key Risk Factor Analysis:**\n`;
        riskInfo.factors.forEach(f => {
          response += `→ ${f}\n`;
        });
        response += `\n**Recommended Operations Checklist:**\n`;
        riskInfo.recommendations.forEach(r => {
          response += `• ${r}\n`;
        });
        return response;
      }

      // Handle fuzzy searches
      if (parsed.action === 'search') {
        const results = KSPSearchEngine.search(query);
        if (results.total > 0) {
          let response = `🔍 **Search Results for "${query}"**\n\n`;
          response += `Indexed **${results.total} matching entities** in the command registry:\n\n`;
          
          if (results.offenders.length > 0) {
            response += `👥 **Suspects / Repeat Offenders:**\n`;
            results.offenders.forEach(o => {
              response += `- **${o.name}** (${o.id}) · Risk: **${o.riskScore}** · Status: **${o.status}**\n`;
            });
          }
          if (results.cases.length > 0) {
            response += `\n📂 **Matching Case Files:**\n`;
            results.cases.slice(0, 3).forEach(c => {
              response += `- **${c.id}** (${c.caseNumber}) · ${c.crimeType} · ${c.district} (Status: **${c.status}**)\n`;
            });
          }
          if (results.vehicles.length > 0) {
            response += `\n🚗 **Matching Vehicles:**\n`;
            results.vehicles.forEach(v => {
              response += `- Plate: \`${v.plate}\` linked to Case **${v.caseId}**\n`;
            });
          }
          return response;
        }
      }
    }

    // Default static template keyword mappings
    if (q.includes('hotspot') || q.includes('bengaluru') || q.includes('heat')) return AI_RESPONSES.hotspot;
    if (q.includes('offender') || q.includes('mysuru') || q.includes('repeat')) return AI_RESPONSES.offender;
    if (q.includes('predict') || q.includes('belagavi') || q.includes('48 hour') || q.includes('next')) return AI_RESPONSES.predict;
    if (q.includes('network') || q.includes('cr-4521') || q.includes('association')) return AI_RESPONSES.network;
    if (q.includes('summary') || q.includes('brief') || q.includes('dgp') || q.includes('executive')) return AI_RESPONSES.summary;
    if (q.includes('cyber') || q.includes('fraud') || q.includes('upi') || q.includes('online')) return AI_RESPONSES.cybercrime;
    if (q.includes('patrol') || q.includes('weekend') || q.includes('deploy')) return AI_RESPONSES.patrol;
    if (q.includes('vehicle') || q.includes('theft') || q.includes('stolen')) return AI_RESPONSES.vehicle;
    return AI_RESPONSES.default;
  }

  // ── Typewriter Effect (Browser-Safe Accumulator Fix) ──
  function typewriterText(el, text, speed = 12) {
    return new Promise((resolve) => {
      // Convert markdown to HTML first
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
          resolve();
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
    });
  }

  // ── Simple Markdown → HTML ──────────────────────────────
  function markdownToHTML(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(59,130,246,0.15);padding:1px 5px;border-radius:4px;font-family:JetBrains Mono,monospace;font-size:0.8em">$1</code>')
      .replace(/^(#{1,3})\s(.+)$/gm, (m, h, t) => `<strong style="font-size:${1.1 - (h.length * 0.05)}em;display:block;margin:8px 0 4px">${t}</strong>`)
      .replace(/^•\s(.+)$/gm, '<div style="padding:2px 0;padding-left:12px;color:#CBD5E1">• $1</div>')
      .replace(/^→\s(.+)$/gm, '<div style="padding:2px 0;padding-left:12px;color:#22D3EE">→ $1</div>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/🔴/g, '<span>🔴</span>')
      .replace(/🟡/g, '<span>🟡</span>')
      .replace(/📊/g, '<span>📊</span>')
      .replace(/📈/g, '<span>📈</span>');
  }

  // ── Render RAG Explainability Block (Phase 7) ───────────
  function renderExplainabilityBlock(explain) {
    if (!explain) return '';
    const sourcesHTML = (explain.evidenceUsed || []).map(s => 
      `<span class="chip" style="font-size:0.65rem;background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.2);cursor:pointer;margin-right:4px;" onclick="window.KSPAdvancedSearch.setSearchValue('${s}')">${s}</span>`
    ).join(' ');

    const actionsHTML = (explain.suggestedNextActions || []).map(a => 
      `<div class="tactical-action-item" style="padding:6px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.75rem;cursor:pointer;color:var(--text-primary);" onclick="document.getElementById('chat-input').value='${a}';document.getElementById('chat-input').focus();">
         ⚡ ${a}
       </div>`
    ).join('');

    return `
      <div class="explainability-block" style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
        <details style="background:rgba(255,255,255,0.01);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 12px;" open>
          <summary style="font-weight:700;color:var(--accent-blue);font-size:0.75rem;cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;">
            🧠 AI ANALYST EXPLAINABILITY CHAIN (Confidence: ${explain.confidenceRating})
          </summary>
          <div style="margin-top:8px;font-size:0.75rem;line-height:1.5;color:var(--text-secondary)">
            <div style="margin-bottom:6px;"><strong>Reasoning Path:</strong> ${explain.reasoningChain}</div>
            <div style="margin-bottom:6px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;"><strong>Context Sources:</strong> ${sourcesHTML}</div>
            <div style="margin-top:6px;"><strong>Suggested Next Actions:</strong><div style="margin-top:4px;">${actionsHTML}</div></div>
          </div>
        </details>
      </div>
    `;
  }

  // ── Text-to-Speech Synthesis ────────────────────────────
  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#`]/g, '').replace(/⚡/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // ── Add Message to Chat ─────────────────────────────────
  function addUserMessage(container, text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.innerHTML = `
      <div class="chat-avatar chat-avatar-user">
        <i data-lucide="user" style="width:14px;height:14px"></i>
      </div>
      <div class="chat-bubble chat-bubble-user">${escapeHTML(text)}</div>
    `;
    container.appendChild(msg);
    if (window.lucide) lucide.createIcons({ nodes: [msg] });
    container.scrollTop = container.scrollHeight;
  }

  function addAIThinking(container) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.id = 'ai-thinking-msg';
    msg.innerHTML = `
      <div class="chat-avatar chat-avatar-ai">AI</div>
      <div class="chat-bubble chat-bubble-ai">
        <div style="display:flex;gap:4px;align-items:center;padding:4px 0">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease 0.2s infinite"></div>
          <div style="width:7px;height:7px;border-radius:50%;background:var(--accent-blue);animation:pulse 1s ease 0.4s infinite"></div>
          <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px">Analyzing intelligence data…</span>
        </div>
      </div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  async function addAIMessage(container, text, thinkingEl, explain = null) {
    // Remove thinking indicator
    if (thinkingEl && thinkingEl.parentNode) {
      thinkingEl.remove();
    }

    const msgId = `ai-msg-${Date.now()}`;
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `
      <div class="chat-avatar chat-avatar-ai" style="position:relative;">
        AI
        <button class="speaker-btn" title="Listen text" style="position:absolute;bottom:-10px;right:-10px;background:var(--card-bg);border:1px solid var(--border);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;">
          🔊
        </button>
      </div>
      <div class="chat-bubble chat-bubble-ai" id="ai-response-bubble-${msgId}"></div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    const bubble = msg.querySelector('.chat-bubble-ai');
    await typewriterText(bubble, text, 12);

    if (explain) {
      const explDiv = document.createElement('div');
      explDiv.innerHTML = renderExplainabilityBlock(explain);
      bubble.appendChild(explDiv);
    }

    // Bind Speech synthesis
    msg.querySelector('.speaker-btn').onclick = () => speakText(text);

    container.scrollTop = container.scrollHeight;
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Initialize Chat Interface ───────────────────────────
  function initChat(options = {}) {
    const {
      messagesContainerId = 'chat-messages',
      inputId = 'chat-input',
      sendBtnId = 'chat-send',
      suggestionsId = 'chat-suggestions',
    } = options;

    const messagesContainer = document.getElementById(messagesContainerId);
    const input = document.getElementById(inputId);
    const sendBtn = document.getElementById(sendBtnId);
    const suggestionsContainer = document.getElementById(suggestionsId);

    if (!messagesContainer || !input) return;

    // Initial AI greeting
    setTimeout(async () => {
      const greeting = `**Welcome to KSP AI Investigation Assistant**\n\nI have access to **Karnataka's complete crime intelligence database** including:\n• Real-time crime reports from all 30 districts\n• Criminal network associations and profiles\n• Predictive hotspot analysis\n• Vehicle and phone surveillance data\n\nHow can I assist your investigation today?`;
      const dummy = document.createElement('div');
      await addAIMessage(messagesContainer, greeting, null);
    }, 500);

    // Inject Microphone icon (Speech-to-Text)
    if (sendBtn) {
      const micBtn = document.createElement('button');
      micBtn.id = 'chat-mic-btn';
      micBtn.className = 'chat-send-btn';
      micBtn.style.marginRight = '6px';
      micBtn.style.background = 'rgba(255,255,255,0.03)';
      micBtn.setAttribute('title', 'Voice Command (Speech-to-Text)');
      micBtn.innerHTML = '🎙️';
      sendBtn.parentNode.insertBefore(micBtn, sendBtn);

      let recognizing = false;
      let recognition = null;
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          recognizing = true;
          micBtn.style.background = 'rgba(239, 68, 68, 0.15)';
          input.placeholder = 'Listening to voice command...';
        };

        recognition.onerror = (e) => {
          console.error('Speech recognition error', e);
          stopMic();
        };

        recognition.onend = () => {
          stopMic();
        };

        recognition.onresult = (event) => {
          const resultText = event.results[0][0].transcript;
          input.value = resultText;
          input.dispatchEvent(new Event('input'));
          sendMessage();
        };
      }

      function stopMic() {
        recognizing = false;
        micBtn.style.background = 'rgba(255,255,255,0.03)';
        input.placeholder = 'Ask AI Copilot...';
      }

      micBtn.onclick = (e) => {
        e.preventDefault();
        if (!recognition) {
          alert('Web Speech API is not supported in this browser.');
          return;
        }
        if (recognizing) {
          recognition.stop();
        } else {
          recognition.start();
        }
      };
    }

    // Populate suggestions
    if (suggestionsContainer && window.KSPData) {
      window.KSPData.aiChatSuggestions.forEach(prompt => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = prompt;
        chip.onclick = () => {
          input.value = prompt;
          sendMessage();
        };
        suggestionsContainer.appendChild(chip);
      });
    }

    // Check for URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setTimeout(() => {
        input.value = decodeURIComponent(q);
        sendMessage();
      }, 1200);
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      input.style.height = 'auto';

      addUserMessage(messagesContainer, text);

      const thinking = addAIThinking(messagesContainer);

      // ── API Chat routing to FastAPI RAG Agent ─────────────
      if (window.KSPAPIClient && window.KSPAPIClient.isOnline) {
        try {
          const res = await fetch('http://localhost:8000/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('ksp_auth_token') || ''}`
            },
            body: JSON.stringify({ message: text })
          });
          if (res.ok) {
            const data = await res.json();
            const explain = data.data ? data.data.explainability : null;
            await addAIMessage(messagesContainer, data.response, thinking, explain);
            return;
          }
        } catch (err) {
          console.warn('FastAPI chat request failed. Falling back to local briefing response.');
        }
      }

      // Offline fallback
      const delay = 800 + Math.random() * 600;
      await new Promise(r => setTimeout(r, delay));

      const response = getAIResponse(text);
      await addAIMessage(messagesContainer, response, thinking);
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    // Enter key
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
    }
  }

  // Expose
  window.KSPChat = { initChat, markdownToHTML };

})();
