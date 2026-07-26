/* =========================================================
   REALTIME.JS — Live Feed & Demo Mode Simulation Engine
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPRealtime = (() => {
  'use strict';

  // Crime template data for random generation
  const CRIME_TEMPLATES = [
    { type: 'Vehicle Theft', category: 'theft', severity: 'medium', priority: 'medium', officer: 'SI Ramesh K.' },
    { type: 'Cybercrime', category: 'cyber', severity: 'high', priority: 'high', officer: 'SI Priya M.' },
    { type: 'Robbery', category: 'robbery', severity: 'high', priority: 'high', officer: 'SI Kumar R.' },
    { type: 'Assault', category: 'assault', severity: 'medium', priority: 'medium', officer: 'SI Anand B.' },
    { type: 'Narcotics', category: 'drugs', severity: 'critical', priority: 'critical', officer: 'SI Vikram S.' },
    { type: 'Financial Fraud', category: 'fraud', severity: 'high', priority: 'high', officer: 'SI Deepa N.' },
    { type: 'Missing Person', category: 'missing', severity: 'low', priority: 'low', officer: 'SI Sunita P.' }
  ];

  const STATION_POOL = {
    'Bengaluru Urban': ['Majestic', 'Shivajinagar', 'Indiranagar', 'Jayanagar', 'Koramangala'],
    'Mysuru': ['Palace Station', 'Devaraja Market', 'Lashkar'],
    'Belagavi': ['Khade Bazar', 'Camp Station', 'Shahapur'],
    'Kalaburagi': ['Chowk Police Station', 'Station Bazar', 'Raghavendra Nagar'],
    'Hubballi-Dharwad': ['Suburban Hubballi', 'Town Station Dharwad', 'Vidyanagar']
  };

  const WEATHERS = ['Sunny', 'Rainy', 'Overcast', 'Clear Night', 'Foggy'];
  const LANDMARKS = ['Bus Terminal', 'Metro Station', 'Highway Bypass', 'Public Park', 'Shopping Mall', 'Commercial Street'];
  const EVIDENCE_POOL = [['CCTV Footage', 'Witness Statement'], ['Phone Call Logs', 'GPS Tracking'], ['Fingerprints', 'Vehicle Plate Photo']];

  let liveEnabled = true;
  let simulationTimer = null;
  let clockTimer = null;

  // Generate a random incident, add to KSPDatabase, and broadcast
  function triggerIncomingIncident(mapInstance) {
    if (!liveEnabled) return;

    // Pick a random crime template
    const tmpl = CRIME_TEMPLATES[Math.floor(Math.random() * CRIME_TEMPLATES.length)];

    // Pick a random district from core list
    const districts = ['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Kalaburagi', 'Hubballi-Dharwad'];
    const district = districts[Math.floor(Math.random() * districts.length)];

    // Center coordinates
    const centers = {
      'Bengaluru Urban': { lat: 12.9716, lng: 77.5946 },
      'Mysuru': { lat: 12.2958, lng: 76.6394 },
      'Belagavi': { lat: 15.8497, lng: 74.4977 },
      'Kalaburagi': { lat: 17.3297, lng: 76.8343 },
      'Hubballi-Dharwad': { lat: 15.3647, lng: 75.1240 }
    };
    const center = centers[district];
    const lat = parseFloat((center.lat + (Math.random() - 0.5) * 0.08).toFixed(6));
    const lng = parseFloat((center.lng + (Math.random() - 0.5) * 0.08).toFixed(6));

    const stations = STATION_POOL[district] || ['Central Precinct', 'Junction Checkpost'];
    const station = stations[Math.floor(Math.random() * stations.length)];

    const idNum = KSPDatabase.getIncidents().length + 1;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const newInc = {
      id: `CR-${idNum.toString().padStart(5, '0')}`,
      caseNumber: `KSP-2025-${idNum.toString().padStart(5, '0')}`,
      crimeType: tmpl.type,
      category: tmpl.category,
      district: district,
      policeStation: station,
      lat: lat,
      lng: lng,
      date: dateStr,
      time: timeStr,
      victim: {
        name: 'Simulated Citizen',
        age: 32,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        phone: '+91-9888877777'
      },
      suspect: {
        name: 'Under Investigation',
        id: null,
        repeatOffender: false
      },
      severity: tmpl.severity,
      evidence: EVIDENCE_POOL[Math.floor(Math.random() * EVIDENCE_POOL.length)],
      status: 'Active',
      assignedOfficer: tmpl.officer,
      socioEconomic: {
        unemploymentRate: 8.5,
        literacyRate: 75.2,
        populationDensity: 'High Density'
      },
      weather: WEATHERS[Math.floor(Math.random() * WEATHERS.length)],
      landmark: LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)],
      vehicleInfo: 'N/A',
      phoneNumber: '+91-8888777766',
      knownAssociates: 'None Identified',
      crimeMethod: 'Modus operandi logged by simulation'
    };

    // Add to Database (triggers broadcast update)
    KSPDatabase.addIncident(newInc);

    // Pulse the map coordinate
    if (mapInstance && window.L) {
      pulseMapCoordinate(mapInstance, lat, lng, tmpl.priority);
    }

    // Display a global toast notification
    if (window.showToast) {
      showToast(`NEW ALERT: ${tmpl.type} in ${district} (${station})`, tmpl.priority, 4000);
    }
  }

  // Draw a growing ripple on the Leaflet map
  function pulseMapCoordinate(mapInstance, lat, lng, priority) {
    if (!mapInstance || !window.L) return;

    const color = priority === 'critical' ? '#EF4444' : priority === 'high' ? '#F59E0B' : '#3B82F6';

    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      color: color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(mapInstance);

    const ring = L.circleMarker([lat, lng], {
      radius: 8,
      color: color,
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 2,
      opacity: 0.7,
    }).addTo(mapInstance);

    let r = 8;
    const interval = setInterval(() => {
      r += 2.5;
      ring.setRadius(r);
      const el = ring.getElement();
      if (el) el.style.opacity = Math.max(0, 0.7 - (r - 8) / 30).toString();
      if (r > 38) {
        clearInterval(interval);
        try {
          mapInstance.removeLayer(ring);
        } catch (e) {}
      }
    }, 70);

    // Keep primary marker for 10 seconds, then fade out
    setTimeout(() => {
      try {
        mapInstance.removeLayer(marker);
      } catch (e) {}
    }, 10000);
  }

  function start(options = {}) {
    const { mapInstance } = options;
    liveEnabled = true;

    // Clock ticker
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(() => {
      const el = document.getElementById('topnav-time');
      if (el) {
        const now = new Date();
        el.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
          + '  •  ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
    }, 1000);

    // Incoming incidents scheduler (runs every 14 seconds in Demo Mode)
    if (simulationTimer) clearInterval(simulationTimer);
    simulationTimer = setInterval(() => {
      if (liveEnabled) {
        triggerIncomingIncident(mapInstance || window.KSPMap?.instance);
      }
    }, 14000);

    // Add listener to localStorage broadcast tick for cross-tab updates
    window.addEventListener('storage', (e) => {
      if (e.key === 'ksp_db_broadcast_tick' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          const updateEvent = new CustomEvent('ksp_db_update', { detail: payload.incident });
          window.dispatchEvent(updateEvent);
        } catch (err) {}
      }
    });

    console.log("KSP Realtime Engine active (Demo Mode: 14s interval).");
  }

  function stop() {
    liveEnabled = false;
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  return { start, stop, triggerIncomingIncident, pulseMapCoordinate };
})();

window.KSPRealtime = KSPRealtime;
