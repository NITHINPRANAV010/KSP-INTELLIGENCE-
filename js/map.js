/* =========================================================
   MAP.JS — Leaflet Map + Heatmap (GeoJSON from CDN)
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const KARNATAKA_GEOJSON_URL = 'https://raw.githubusercontent.com/datameet/maps/master/States/KA.geojson';

  let mapInstance = null;
  let heatLayer   = null;
  let geoLayer    = null;

  // Leaflet tile layers
  const TILE_LAYERS = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
    terrain: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    },
  };

  /**
   * Initialize the Leaflet map on a given container element ID.
   * @param {string} containerId
   * @param {object} options
   */
  function initMap(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !window.L) return null;

    // Karnataka center
    const center = options.center || [15.3173, 75.7139];
    const zoom   = options.zoom   || 7;

    mapInstance = L.map(containerId, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Attribution in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(mapInstance);

    // Dark tile layer
    L.tileLayer(TILE_LAYERS.dark.url, {
      attribution: TILE_LAYERS.dark.attribution,
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(mapInstance);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    // Load Karnataka GeoJSON from CDN
    loadKarnatakaGeoJSON();

    // Add heatmap if data available
    if (window.KSPData && window.L.heatLayer) {
      addHeatmapLayer();
    }

    // Add district markers
    if (window.KSPData) {
      addDistrictMarkers();
    }

    return mapInstance;
  }

  /**
   * Load Karnataka district boundaries from datameet CDN.
   */
  function loadKarnatakaGeoJSON() {
    if (!window.L || !mapInstance) return;

    fetch(KARNATAKA_GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error('GeoJSON fetch failed');
        return res.json();
      })
      .then(data => {
        geoLayer = L.geoJSON(data, {
          style: {
            color: 'rgba(59,130,246,0.5)',
            weight: 1.2,
            fillColor: 'rgba(59,130,246,0.04)',
            fillOpacity: 1,
          },
          onEachFeature: (feature, layer) => {
            const name = feature.properties?.district || feature.properties?.NAME_2 || 'Karnataka District';
            const dist = window.KSPData?.districts?.find(d => name.toLowerCase().includes(d.name.split(' ')[0].toLowerCase()));
            layer.bindTooltip(
              `<div style="font-family:Inter,sans-serif;padding:6px 10px;background:#1B263B;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:12px">
                <strong>${name}</strong>${dist ? `<br><span style="color:#CBD5E1">Risk: <span style="color:${getRiskColor(dist.risk)}">${dist.risk.toUpperCase()}</span></span><br><span style="color:#64748B">${dist.crimes.toLocaleString('en-IN')} crimes</span>` : ''}
              </div>`,
              { className: 'leaflet-tooltip-dark', sticky: true, direction: 'top' }
            );
            layer.on('mouseover', function () {
              this.setStyle({ fillOpacity: 0.12, color: 'rgba(59,130,246,0.8)', weight: 1.8 });
            });
            layer.on('mouseout', function () {
              geoLayer.resetStyle(this);
            });
          },
        }).addTo(mapInstance);
      })
      .catch(err => {
        console.warn('Karnataka GeoJSON load failed, using fallback boundary:', err.message);
        // Fallback: draw a simple Karnataka approximation polygon
        addFallbackBoundary();
      });
  }

  /**
   * Fallback polygon if CDN is unavailable.
   */
  function addFallbackBoundary() {
    if (!mapInstance) return;
    // Simplified Karnataka boundary approximation (not precise, just visual)
    const poly = L.polygon([
      [18.45, 74.05], [17.98, 76.84], [17.12, 77.80], [16.55, 77.48],
      [16.04, 76.93], [15.32, 77.82], [14.78, 78.27], [13.84, 77.80],
      [13.07, 78.20], [11.62, 77.70], [11.47, 76.60], [11.85, 75.40],
      [12.76, 74.65], [13.83, 74.60], [14.74, 74.14], [15.76, 73.96],
      [16.50, 73.82], [17.28, 73.95], [17.98, 73.83], [18.45, 74.05],
    ], {
      color: 'rgba(59,130,246,0.5)',
      weight: 1.5,
      fillColor: 'rgba(59,130,246,0.03)',
      fillOpacity: 1,
      dashArray: '4,4',
    }).addTo(mapInstance);
  }

  /**
   * Add heatmap layer using Leaflet.heat plugin
   */
  function addHeatmapLayer() {
    if (!window.L?.heatLayer || !mapInstance || !window.KSPData) return;

    const points = window.KSPData.heatmapPoints;

    heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      max: 1.0,
      gradient: {
        0.2: '#22C55E',
        0.4: '#3B82F6',
        0.6: '#F59E0B',
        0.8: '#EF4444',
        1.0: '#FF0000',
      },
    }).addTo(mapInstance);
  }

  /**
   * Add district marker pins
   */
  function addDistrictMarkers() {
    if (!mapInstance || !window.KSPData) return;

    window.KSPData.districts.forEach(dist => {
      const color = getRiskColor(dist.risk);
      const size  = dist.risk === 'critical' ? 14 : dist.risk === 'high' ? 12 : 10;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2px solid rgba(255,255,255,0.4);
          border-radius:50%;
          box-shadow:0 0 ${size}px ${color}80;
          position:relative;
        ">
          ${dist.risk === 'critical' ? `<div style="
            position:absolute;
            top:50%;left:50%;
            transform:translate(-50%,-50%);
            width:${size + 8}px;height:${size + 8}px;
            border:1.5px solid ${color}60;
            border-radius:50%;
            animation:pulseRing 2s ease-out infinite;
          "></div>` : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([dist.lat, dist.lng], { icon });

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px;background:#1B263B;border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;padding:14px">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:8px">${dist.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:11px;font-weight:600;padding:3px 8px;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:99px;text-transform:uppercase">${dist.risk}</span>
            <span style="font-size:11px;color:#64748B">Risk Score: <strong style="color:#fff">${dist.score}</strong></span>
          </div>
          <div style="font-size:12px;color:#CBD5E1"><span style="color:#64748B">Total Crimes:</span> <strong style="color:#fff">${dist.crimes.toLocaleString('en-IN')}</strong></div>
          <div style="margin-top:10px;background:rgba(255,255,255,0.06);border-radius:4px;height:4px;overflow:hidden">
            <div style="width:${dist.score}%;height:100%;background:linear-gradient(90deg,${color},${color}88)"></div>
          </div>
        </div>
      `, {
        className: 'custom-popup',
        maxWidth: 240,
      }).addTo(mapInstance);
    });
  }

  /**
   * Toggle heatmap layer visibility
   */
  function toggleHeatmap(show) {
    if (!mapInstance || !heatLayer) return;
    if (show) {
      mapInstance.addLayer(heatLayer);
    } else {
      mapInstance.removeLayer(heatLayer);
    }
  }

  /**
   * Toggle GeoJSON boundary layer visibility
   */
  function toggleBoundaries(show) {
    if (!mapInstance || !geoLayer) return;
    if (show) {
      mapInstance.addLayer(geoLayer);
    } else {
      mapInstance.removeLayer(geoLayer);
    }
  }

  /**
   * Get risk color by risk level string
   */
  function getRiskColor(risk) {
    const map = {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#22C55E',
    };
    return map[risk] || '#64748B';
  }

  /**
   * Fly to a district
   */
  function flyToDistrict(districtId) {
    if (!mapInstance || !window.KSPData) return;
    const dist = window.KSPData.districts.find(d => d.id === districtId);
    if (dist) {
      mapInstance.flyTo([dist.lat, dist.lng], 10, { duration: 1.2 });
    }
  }

  // Leaflet popup style override
  const popupStyle = document.createElement('style');
  popupStyle.textContent = `
    .leaflet-popup-content-wrapper {
      background: transparent !important;
      border: none !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      border-radius: 10px !important;
      padding: 0 !important;
    }
    .leaflet-popup-content {
      margin: 0 !important;
    }
    .leaflet-popup-tip-container { display: none; }
    .leaflet-tooltip {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .leaflet-control-zoom a {
      background: #1B263B !important;
      color: #CBD5E1 !important;
      border-color: rgba(255,255,255,0.08) !important;
    }
    .leaflet-control-zoom a:hover {
      background: #1F2E45 !important;
      color: white !important;
    }
    .leaflet-control-attribution {
      background: rgba(11,18,32,0.7) !important;
      color: #64748B !important;
      font-size: 10px !important;
    }
    .leaflet-control-attribution a { color: #64748B !important; }
  `;
  document.head.appendChild(popupStyle);

  // Expose
  window.KSPMap = {
    initMap,
    toggleHeatmap,
    toggleBoundaries,
    flyToDistrict,
    getRiskColor,
    get instance() { return mapInstance; },
  };

})();
