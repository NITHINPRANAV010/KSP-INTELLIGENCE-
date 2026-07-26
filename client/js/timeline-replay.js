/* =========================================================
   TIMELINE-REPLAY.JS — Crime Timeline Playback Engine
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPTimelineReplay = (() => {

  // ── Generate Timeline Events ──────────────────────────
  function generateEvents() {
    const types = [
      { type:'Vehicle Theft',   color:'#3B82F6', icon:'car',           priority:'high' },
      { type:'Cybercrime',      color:'#22D3EE', icon:'wifi',          priority:'critical' },
      { type:'Robbery',         color:'#F59E0B', icon:'alert-triangle',priority:'high' },
      { type:'Assault',         color:'#EF4444', icon:'user-x',        priority:'medium' },
      { type:'Narcotics',       color:'#F97316', icon:'pill',          priority:'high' },
      { type:'Financial Fraud', color:'#22C55E', icon:'dollar-sign',   priority:'critical' },
      { type:'Missing Person',  color:'#6366F1', icon:'search',        priority:'medium' },
      { type:'Chain Snatching', color:'#8B5CF6', icon:'link',          priority:'medium' },
    ];

    const districts = KSPData.districts;
    const events = [];
    let id = 7700;

    // Generate 120 events across a 7-day period
    for (let day = 0; day < 7; day++) {
      const baseDate = new Date(2025, 5, 27 + day); // June 27 - July 3 2025
      const eventsPerDay = 12 + Math.floor(Math.random() * 8);

      for (let e = 0; e < eventsPerDay; e++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const district = districts[Math.floor(Math.random() * districts.length)];
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const dt = new Date(baseDate);
        dt.setHours(hour, minute);

        // Slight lat/lng jitter around district center
        const lat = district.lat + (Math.random() - 0.5) * 0.12;
        const lng = district.lng + (Math.random() - 0.5) * 0.12;

        events.push({
          id: `CR-${id++}`,
          timestamp: dt.getTime(),
          dateLabel: dt.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' }),
          timeLabel: dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
          type: type.type,
          color: type.color,
          priority: type.priority,
          district: district.name,
          lat, lng,
          day,
        });
      }
    }

    // Sort by timestamp
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  let events = [];
  let allEvents = [];
  let mapInstance = null;
  let markers = [];
  let currentIndex = 0;
  let isPlaying = false;
  let speed = 1;
  let playInterval = null;
  let activeFilters = { type: 'all', district: 'all', severity: 'all' };

  // ── Init ──────────────────────────────────────────────
  function init(mapId, controlsId) {
    allEvents = generateEvents();
    events = [...allEvents];

    // Initialize map
    if (!window.L) return;

    if (!mapInstance) {
      mapInstance = L.map(mapId, {
        center: [15.3173, 75.7139],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(mapInstance);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
    }

    buildControls(controlsId);
    updateStatsPanel();
  }

  // ── Controls ──────────────────────────────────────────
  function buildControls(controlsId) {
    const container = document.getElementById(controlsId);
    if (!container) return;

    const minTs = Math.min(...events.map(e => e.timestamp));
    const maxTs = Math.max(...events.map(e => e.timestamp));

    container.innerHTML = `
      <div class="replay-controls-bar">
        <!-- Playback Buttons -->
        <div class="replay-btn-group">
          <button class="replay-btn" id="replay-rewind" data-tooltip="Rewind">
            <i data-lucide="skip-back" style="width:16px;height:16px"></i>
          </button>
          <button class="replay-btn replay-btn-play" id="replay-play" data-tooltip="Play">
            <i data-lucide="play" style="width:18px;height:18px;color:white"></i>
          </button>
          <button class="replay-btn" id="replay-pause" data-tooltip="Pause" style="display:none">
            <i data-lucide="pause" style="width:18px;height:18px"></i>
          </button>
        </div>

        <!-- Timeline Slider -->
        <div class="replay-timeline">
          <span class="replay-date-label" id="replay-start-label">${events[0]?.dateLabel || 'Jun 27'}</span>
          <input type="range" id="replay-slider" class="replay-slider" min="0" max="${events.length - 1}" value="0" style="flex:1">
          <span class="replay-date-label" id="replay-end-label">${events[events.length-1]?.dateLabel || 'Jul 03'}</span>
        </div>

        <!-- Speed + Stats -->
        <div class="replay-right-controls">
          <span class="replay-stat">
            <span id="replay-shown-count" style="color:var(--accent-blue);font-weight:700">0</span>
            <span class="text-muted"> / ${events.length} crimes</span>
          </span>
          <div class="replay-speed-group">
            <span class="text-xs text-muted">Speed:</span>
            <button class="replay-speed-btn active" data-speed="1">1×</button>
            <button class="replay-speed-btn" data-speed="3">3×</button>
            <button class="replay-speed-btn" data-speed="8">8×</button>
          </div>
          <button class="replay-btn replay-btn-sm" id="replay-clear" data-tooltip="Clear">
            <i data-lucide="trash-2" style="width:14px;height:14px"></i>
          </button>
        </div>
      </div>

      <!-- Current Event Info -->
      <div class="replay-current-event" id="replay-current-event">
        <div style="font-size:0.75rem;color:var(--text-muted)">Press Play to start timeline replay…</div>
      </div>
    `;

    if (window.lucide) lucide.createIcons({ nodes: [container] });
    bindControlEvents();
  }

  function bindControlEvents() {
    document.getElementById('replay-play')?.addEventListener('click', play);
    document.getElementById('replay-pause')?.addEventListener('click', pause);
    document.getElementById('replay-rewind')?.addEventListener('click', rewind);
    document.getElementById('replay-clear')?.addEventListener('click', clearMarkers);

    document.getElementById('replay-slider')?.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value);
      jumpTo(idx);
    });

    document.querySelectorAll('.replay-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.replay-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speed = parseInt(btn.dataset.speed);
        if (isPlaying) {
          clearInterval(playInterval);
          startPlayback();
        }
      });
    });
  }

  // ── Playback ──────────────────────────────────────────
  function play() {
    if (currentIndex >= events.length) rewind();
    isPlaying = true;
    document.getElementById('replay-play').style.display = 'none';
    document.getElementById('replay-pause').style.display = 'flex';
    startPlayback();
  }

  function pause() {
    isPlaying = false;
    clearInterval(playInterval);
    document.getElementById('replay-play').style.display = 'flex';
    document.getElementById('replay-pause').style.display = 'none';
  }

  function rewind() {
    pause();
    clearMarkers();
    currentIndex = 0;
    const slider = document.getElementById('replay-slider');
    if (slider) slider.value = 0;
    updateStats(0);
  }

  function startPlayback() {
    const stepsPerTick = Math.ceil(speed);
    playInterval = setInterval(() => {
      if (currentIndex >= events.length) {
        pause();
        showToast('Timeline replay complete', 'success');
        return;
      }
      for (let i = 0; i < stepsPerTick && currentIndex < events.length; i++) {
        plotEvent(events[currentIndex]);
        currentIndex++;
      }
      const slider = document.getElementById('replay-slider');
      if (slider) slider.value = currentIndex;
      updateStats(currentIndex);
    }, speed <= 1 ? 600 : speed <= 3 ? 200 : 80);
  }

  function jumpTo(index) {
    pause();
    clearMarkers();
    for (let i = 0; i <= index && i < events.length; i++) {
      plotEvent(events[i]);
    }
    currentIndex = index;
    updateStats(index);
  }

  // ── Plot Event on Map ─────────────────────────────────
  function plotEvent(event) {
    if (!mapInstance || !window.L) return;

    const circle = L.circleMarker([event.lat, event.lng], {
      radius: event.priority === 'critical' ? 9 : event.priority === 'high' ? 7 : 5,
      color: event.color,
      fillColor: event.color,
      fillOpacity: 0.75,
      weight: 1.5,
      opacity: 0.9,
    });

    circle.bindPopup(`
      <div style="font-family:Inter,sans-serif;padding:4px">
        <div style="font-weight:700;color:#fff;margin-bottom:4px">${event.id}</div>
        <div style="font-size:0.8125rem;color:#CBD5E1"><b>${event.type}</b></div>
        <div style="font-size:0.75rem;color:#64748B;margin-top:2px">${event.district}</div>
        <div style="font-size:0.6875rem;font-family:monospace;color:#22D3EE;margin-top:4px">${event.dateLabel} · ${event.timeLabel}</div>
      </div>
    `, { className: 'map-dark-popup' });

    circle.addTo(mapInstance);
    markers.push(circle);

    // Update current event display
    const infoEl = document.getElementById('replay-current-event');
    if (infoEl) {
      infoEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:50%;background:${event.color};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">${event.id}: ${event.type}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">— ${event.district}</span>
          <span style="margin-left:auto;font-size:0.6875rem;font-family:monospace;color:var(--accent-cyan)">${event.dateLabel} ${event.timeLabel}</span>
        </div>
      `;
    }
  }

  function clearMarkers() {
    markers.forEach(m => { if (mapInstance) mapInstance.removeLayer(m); });
    markers = [];
  }

  function updateStats(idx) {
    const el = document.getElementById('replay-shown-count');
    if (el) el.textContent = idx.toLocaleString('en-IN');
  }

  function updateStatsPanel() {
    // Can be called to update external stats displays
  }

  // ── Filter Events ─────────────────────────────────────
  function filterEvents(filters) {
    activeFilters = { ...activeFilters, ...filters };
    events = allEvents.filter(e => {
      if (activeFilters.type !== 'all' && e.type !== activeFilters.type) return false;
      if (activeFilters.district !== 'all' && e.district !== activeFilters.district) return false;
      if (activeFilters.severity !== 'all' && e.priority !== activeFilters.severity) return false;
      return true;
    });

    const slider = document.getElementById('replay-slider');
    if (slider) slider.max = events.length - 1;
    rewind();
  }

  return { init, play, pause, rewind, filterEvents, generateEvents };
})();

window.KSPTimelineReplay = KSPTimelineReplay;
