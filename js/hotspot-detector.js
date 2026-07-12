/* =========================================================
   HOTSPOT-DETECTOR.JS — Coordinate Grid-Clustering & Heat Layer
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const KSPHotspotDetector = {
    // Generate hotspot coordinate clusters using grid-based spatial aggregation
    detectHotspots: function (filteredIncidents, gridPrecision = 0.015) {
      if (!filteredIncidents || filteredIncidents.length === 0) {
        return [];
      }

      const grid = {};
      let maxCount = 1;

      // Aggregate coordinates into grid cells
      filteredIncidents.forEach(inc => {
        if (!inc.lat || !inc.lng) return;

        // Snap coordinate to grid intervals
        const latCell = Math.round(inc.lat / gridPrecision);
        const lngCell = Math.round(inc.lng / gridPrecision);
        const cellId = `${latCell}_${lngCell}`;

        if (!grid[cellId]) {
          grid[cellId] = {
            sumLat: 0,
            sumLng: 0,
            count: 0
          };
        }

        grid[cellId].sumLat += inc.lat;
        grid[cellId].sumLng += inc.lng;
        grid[cellId].count++;

        if (grid[cellId].count > maxCount) {
          maxCount = grid[cellId].count;
        }
      });

      // Convert grid cells to array of coordinates with intensity weights
      const hotspots = [];
      for (const key in grid) {
        const cell = grid[key];
        const avgLat = cell.sumLat / cell.count;
        const avgLng = cell.sumLng / cell.count;
        
        // Normalize intensity between 0.15 and 1.0
        const intensity = 0.15 + (cell.count / maxCount) * 0.85;

        hotspots.push({
          lat: parseFloat(avgLat.toFixed(6)),
          lng: parseFloat(avgLng.toFixed(6)),
          count: cell.count,
          intensity: parseFloat(intensity.toFixed(3))
        });
      }

      // Sort by count descending
      return hotspots.sort((a, b) => b.count - a.count);
    },

    // Convert hotspots directly to Leaflet Heatmap format: [ [lat, lng, intensity], ... ]
    getHeatPoints: function (filteredIncidents) {
      const hotspots = this.detectHotspots(filteredIncidents);
      return hotspots.map(h => [h.lat, h.lng, h.intensity]);
    }
  };

  // Expose globally
  window.KSPHotspotDetector = KSPHotspotDetector;
})();
