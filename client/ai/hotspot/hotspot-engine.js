/* =========================================================
   HOTSPOT-ENGINE.JS — Advanced Hotspot Detection & Polygon Generation
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  /**
   * Compute convex hull of a set of [lat, lng] points (Graham scan).
   * Returns ordered array of { lat, lng } forming the hull polygon.
   */
  function convexHull(points) {
    if (points.length < 3) return points;

    // Find bottom-most point
    let pivot = points.reduce((a, b) => (b.lat < a.lat || (b.lat === a.lat && b.lng < a.lng)) ? b : a);

    // Sort by polar angle from pivot
    const sorted = points
      .filter(p => p !== pivot)
      .sort((a, b) => {
        const angleA = Math.atan2(a.lat - pivot.lat, a.lng - pivot.lng);
        const angleB = Math.atan2(b.lat - pivot.lat, b.lng - pivot.lng);
        return angleA - angleB;
      });

    const hull = [pivot];

    function cross(O, A, B) {
      return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
    }

    for (const p of sorted) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
        hull.pop();
      }
      hull.push(p);
    }

    return hull;
  }

  /**
   * Expand a polygon outward by a given buffer in degrees.
   */
  function expandPolygon(polygon, bufferDeg) {
    const centLat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
    const centLng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;

    return polygon.map(p => ({
      lat: p.lat + (p.lat - centLat > 0 ? bufferDeg : -bufferDeg) + (p.lat >= centLat ? bufferDeg * 0.3 : -bufferDeg * 0.3),
      lng: p.lng + (p.lng - centLng > 0 ? bufferDeg : -bufferDeg) + (p.lng >= centLng ? bufferDeg * 0.3 : -bufferDeg * 0.3),
    }));
  }

  /**
   * Compute grid-based clusters from incident list.
   * @param {Array} incidents
   * @param {number} precision - Grid cell size in degrees
   * @returns {Array} clusters sorted by intensity
   */
  function clusterIncidents(incidents, precision) {
    const grid = {};
    const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

    incidents.forEach(inc => {
      if (!inc.lat || !inc.lng) return;

      const latCell = Math.round(inc.lat / precision);
      const lngCell = Math.round(inc.lng / precision);
      const cellId = `${latCell}_${lngCell}`;

      if (!grid[cellId]) {
        grid[cellId] = {
          cellId, latCell, lngCell,
          points: [], count: 0, weightedCount: 0,
          repeatOffenderCount: 0, crimeTypes: {},
          sumLat: 0, sumLng: 0
        };
      }

      const cell = grid[cellId];
      const sev = inc.severity || 'medium';
      const w = SEVERITY_WEIGHT[sev] || 2;

      cell.points.push({ lat: inc.lat, lng: inc.lng });
      cell.count++;
      cell.weightedCount += w;
      cell.sumLat += inc.lat;
      cell.sumLng += inc.lng;
      cell.crimeTypes[inc.crimeType] = (cell.crimeTypes[inc.crimeType] || 0) + 1;
      if (inc.suspect && inc.suspect.repeatOffender) cell.repeatOffenderCount++;
    });

    return Object.values(grid);
  }

  const KSPHotspotEngine = {
    _cache: null,
    _cacheKey: '',

    /**
     * Detect hotspots from incidents.
     * @param {Object} [options]
     * @param {string} [options.district='all']
     * @param {string} [options.crimeType='all']
     * @param {number} [options.precision=0.015] - Grid precision in degrees
     * @param {number} [options.minCluster] - Minimum cluster size (from config)
     * @returns {Object} { hotspots, polygons, emerging, heatPoints, metadata }
     */
    detect: function (options = {}) {
      const config = window.KSPAIConfig || { get: (k, d) => d };
      const precision = options.precision || 0.015;
      const minCluster = options.minCluster || config.get('hotspotMinCluster') || 5;
      const emergingGrowthPct = config.get('emergingHotspotGrowthPct') || 30;

      // Filter incidents
      const allIncidents = KSPDatabase.getIncidents();
      let incidents = allIncidents;
      if (options.district && options.district !== 'all') {
        incidents = incidents.filter(i => i.district === options.district);
      }
      if (options.crimeType && options.crimeType !== 'all') {
        incidents = incidents.filter(i => i.crimeType === options.crimeType || i.category === options.crimeType);
      }

      // Cluster all incidents (full period)
      const allClusters = clusterIncidents(incidents, precision);

      // Cluster last 7 days vs prior 7 days for emerging detection
      const now = new Date('2025-07-03');
      const sevenDaysAgo = new Date('2025-06-26');
      const fourteenDaysAgo = new Date('2025-06-19');

      const recentIncidents = incidents.filter(i => new Date(i.date) >= sevenDaysAgo);
      const priorIncidents = incidents.filter(i => new Date(i.date) >= fourteenDaysAgo && new Date(i.date) < sevenDaysAgo);

      const recentClusters = clusterIncidents(recentIncidents, precision);
      const priorClusters = clusterIncidents(priorIncidents, precision);

      const priorMap = {};
      priorClusters.forEach(c => { priorMap[c.cellId] = c.count; });

      // Find max weighted count for normalization
      const maxWeighted = Math.max(1, ...allClusters.map(c => c.weightedCount));

      // Build hotspot objects
      const hotspots = allClusters
        .filter(c => c.count >= minCluster)
        .map(c => {
          const avgLat = c.sumLat / c.count;
          const avgLng = c.sumLng / c.count;
          const intensity = parseFloat((0.15 + (c.weightedCount / maxWeighted) * 0.85).toFixed(3));
          const dominantCrimeType = Object.entries(c.crimeTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
          const roRate = c.count > 0 ? parseFloat((c.repeatOffenderCount / c.count * 100).toFixed(1)) : 0;

          // Confidence: based on cluster density relative to max
          const confidence = parseFloat(Math.min(0.98, 0.5 + (c.count / (minCluster * 5)) * 0.48).toFixed(2));

          // Radius estimate in meters (more incidents = larger area)
          const radiusMeters = Math.round(200 + c.count * 15);

          // Emerging check
          const recentCluster = recentClusters.find(rc => rc.cellId === c.cellId);
          const priorCount = priorMap[c.cellId] || 0;
          const recentCount = recentCluster ? recentCluster.count : 0;
          const growth = priorCount > 0 ? ((recentCount - priorCount) / priorCount) * 100 : 0;
          const isEmerging = growth >= emergingGrowthPct && recentCount >= 3;

          return {
            cellId: c.cellId,
            lat: parseFloat(avgLat.toFixed(6)),
            lng: parseFloat(avgLng.toFixed(6)),
            count: c.count,
            intensity,
            confidence,
            radiusMeters,
            dominantCrimeType,
            repeatOffenderRate: roRate,
            recentCount,
            priorCount,
            growthPct: parseFloat(growth.toFixed(1)),
            isEmerging,
            points: c.points
          };
        })
        .sort((a, b) => b.weightedCount - a.weightedCount ||
                         b.count - a.count);

      // Generate polygons for top hotspots
      const polygons = hotspots.slice(0, 15).map(h => {
        if (h.points.length < 3) {
          // Circle approximation if too few points
          const buf = 0.008;
          return {
            cellId: h.cellId,
            polygon: [
              { lat: h.lat + buf, lng: h.lng },
              { lat: h.lat, lng: h.lng + buf },
              { lat: h.lat - buf, lng: h.lng },
              { lat: h.lat, lng: h.lng - buf }
            ],
            intensity: h.intensity,
            isEmerging: h.isEmerging
          };
        }

        const hull = convexHull(h.points);
        const expanded = expandPolygon(hull, 0.005);

        return {
          cellId: h.cellId,
          polygon: expanded,
          intensity: h.intensity,
          isEmerging: h.isEmerging,
          dominantCrimeType: h.dominantCrimeType,
          confidence: h.confidence
        };
      });

      // Emerging hotspots list
      const emerging = hotspots.filter(h => h.isEmerging);

      // Heat points for Leaflet heatmap
      const heatPoints = hotspots.map(h => [h.lat, h.lng, h.intensity]);

      const result = {
        hotspots,
        polygons,
        emerging,
        heatPoints,
        metadata: {
          totalClusters: hotspots.length,
          emergingCount: emerging.length,
          maxIntensity: hotspots[0]?.intensity || 0,
          topHotspot: hotspots[0] || null,
          analyzedIncidents: incidents.length,
          precision,
          generatedAt: new Date().toISOString()
        }
      };

      if (window.KSPAIBus) {
        KSPAIBus.emit('hotspot:ready', result);
        if (emerging.length > 0) {
          KSPAIBus.emit('hotspot:emerging', { emerging, count: emerging.length });
        }
      }

      return result;
    },

    /**
     * Get Leaflet-compatible polygon layer configs for top hotspots.
     * Returns array of { polygon: L.LatLng[], options: L.PolylineOptions }
     */
    getLeafletPolygons: function (options = {}) {
      const result = this.detect(options);
      return result.polygons.map(p => ({
        latlngs: p.polygon.map(pt => [pt.lat, pt.lng]),
        options: {
          color: p.isEmerging ? '#EF4444' : (p.intensity > 0.7 ? '#F59E0B' : '#3B82F6'),
          fillColor: p.isEmerging ? '#EF4444' : (p.intensity > 0.7 ? '#F59E0B' : '#3B82F6'),
          fillOpacity: 0.15 + p.intensity * 0.20,
          weight: p.isEmerging ? 2.5 : 1.5,
          dashArray: p.isEmerging ? '5,5' : null,
        },
        meta: { isEmerging: p.isEmerging, dominantCrimeType: p.dominantCrimeType, confidence: p.confidence }
      }));
    }
  };

  window.KSPHotspotEngine = KSPHotspotEngine;

})();
