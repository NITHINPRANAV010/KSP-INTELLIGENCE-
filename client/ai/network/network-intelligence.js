/* =========================================================
   NETWORK-INTELLIGENCE.JS — Auto-Discovery Criminal Association Engine
   KSP AI Crime Intelligence Command Center — Phase 4
   ========================================================= */

(function () {
  'use strict';

  /**
   * Assign relationship confidence based on shared attribute strength.
   */
  function edgeConfidence(shared) {
    // Each shared attribute contributes to confidence
    const WEIGHTS = { phone: 0.9, vehicle: 0.85, location: 0.75, crimeType: 0.5, district: 0.3 };
    let score = 0;
    for (const [attr, w] of Object.entries(WEIGHTS)) {
      if (shared[attr]) score += w * (typeof shared[attr] === 'number' ? Math.min(1, shared[attr] / 3) : 1);
    }
    return parseFloat(Math.min(0.98, score).toFixed(2));
  }

  /**
   * Simple label propagation for community detection.
   * Returns map: nodeId → communityId
   */
  function labelPropagation(nodes, links, iterations = 10) {
    const labels = {};
    nodes.forEach(n => { labels[n.id] = n.id; }); // Each node is its own community

    // Build adjacency
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    links.forEach(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      if (adj[src]) adj[src].push(tgt);
      if (adj[tgt]) adj[tgt].push(src);
    });

    for (let iter = 0; iter < iterations; iter++) {
      const order = Object.keys(labels).sort(() => Math.random() - 0.5);
      let changed = false;

      for (const nodeId of order) {
        const neighbors = adj[nodeId] || [];
        if (neighbors.length === 0) continue;

        // Count neighbor label frequencies
        const freq = {};
        neighbors.forEach(nb => {
          const lbl = labels[nb];
          freq[lbl] = (freq[lbl] || 0) + 1;
        });

        // Pick most frequent label (tie-break: current label)
        let bestLabel = labels[nodeId];
        let bestCount = freq[labels[nodeId]] || 0;
        for (const [lbl, cnt] of Object.entries(freq)) {
          if (cnt > bestCount) { bestLabel = lbl; bestCount = cnt; }
        }

        if (bestLabel !== labels[nodeId]) { labels[nodeId] = bestLabel; changed = true; }
      }

      if (!changed) break;
    }

    return labels;
  }

  /**
   * Compute simplified centrality score for each node.
   * Uses degree (connection count) weighted by edge confidence.
   */
  function computeCentrality(nodes, links) {
    const centrality = {};
    nodes.forEach(n => { centrality[n.id] = 0; });

    links.forEach(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      const w = l.confidence || 0.5;
      if (centrality[src] !== undefined) centrality[src] += w;
      if (centrality[tgt] !== undefined) centrality[tgt] += w;
    });

    return centrality;
  }

  const KSPNetworkIntelligence = {
    _cache: null,

    /**
     * Auto-discover criminal associations from the entire database.
     * Links suspects who share: phones, vehicles, locations, crime types.
     *
     * @param {Object} [options]
     * @param {number} [options.minConfidence=0.5]
     * @param {number} [options.maxNodes=60] - Limit graph size for performance
     * @returns {Object} { nodes, links, communities, centralNodes, metadata }
     */
    autoDiscover: function (options = {}) {
      const config = window.KSPAIConfig || { get: () => 0.5 };
      const minConfidence = options.minConfidence || config.get('networkMinConfidence') || 0.5;
      const maxNodes = options.maxNodes || 60;

      const incidents = KSPDatabase.getIncidents();

      // --- Build suspect profiles from all incidents ---
      const suspectMap = {};

      incidents.forEach(inc => {
        const sName = inc.suspect?.name;
        if (!sName || sName === 'Unknown' || sName === 'Under Investigation') return;

        const sId = inc.suspect.id || `S_${sName.replace(/\s+/g, '_').toUpperCase()}`;

        if (!suspectMap[sId]) {
          suspectMap[sId] = {
            id: sId,
            name: sName,
            isRepeat: inc.suspect.repeatOffender || false,
            phones: new Set(),
            vehicles: new Set(),
            locations: new Set(),
            districts: new Set(),
            crimeTypes: new Set(),
            cases: [],
            incidentCount: 0
          };
        }

        const s = suspectMap[sId];
        s.incidentCount++;
        s.cases.push(inc.id);
        if (inc.phoneNumber && inc.phoneNumber !== 'N/A') s.phones.add(inc.phoneNumber);
        if (inc.vehicleInfo && inc.vehicleInfo !== 'N/A') s.vehicles.add(inc.vehicleInfo.split(' ')[0]);
        if (inc.policeStation) s.locations.add(inc.policeStation);
        s.districts.add(inc.district);
        s.crimeTypes.add(inc.crimeType);
      });

      const suspects = Object.values(suspectMap);

      // --- Build nodes (top suspects by case count) ---
      const topSuspects = suspects
        .sort((a, b) => b.incidentCount - a.incidentCount)
        .slice(0, maxNodes);

      const nodes = topSuspects.map(s => ({
        id: s.id,
        label: s.name,
        type: 'suspect',
        isRepeat: s.isRepeat,
        val: Math.min(35, 10 + s.incidentCount * 1.5),
        incidentCount: s.incidentCount,
        district: [...s.districts][0] || 'Unknown',
        primaryCrimeType: [...s.crimeTypes][0] || 'Unknown'
      }));

      // --- Discover edges ---
      const links = [];
      const edgeSet = new Set();

      for (let i = 0; i < topSuspects.length; i++) {
        for (let j = i + 1; j < topSuspects.length; j++) {
          const A = topSuspects[i];
          const B = topSuspects[j];

          const shared = {};

          // Shared phones
          const sharedPhones = [...A.phones].filter(p => B.phones.has(p)).length;
          if (sharedPhones > 0) shared.phone = sharedPhones;

          // Shared vehicles
          const sharedVehicles = [...A.vehicles].filter(v => B.vehicles.has(v)).length;
          if (sharedVehicles > 0) shared.vehicle = sharedVehicles;

          // Shared locations
          const sharedLocs = [...A.locations].filter(l => B.locations.has(l)).length;
          if (sharedLocs > 0) shared.location = sharedLocs;

          // Shared crime types
          const sharedTypes = [...A.crimeTypes].filter(t => B.crimeTypes.has(t)).length;
          if (sharedTypes > 0) shared.crimeType = sharedTypes;

          // Shared district
          const sharedDistricts = [...A.districts].filter(d => B.districts.has(d)).length;
          if (sharedDistricts > 0) shared.district = sharedDistricts;

          if (Object.keys(shared).length === 0) continue;

          const confidence = edgeConfidence(shared);
          if (confidence < minConfidence) continue;

          const edgeKey = [A.id, B.id].sort().join('|');
          if (edgeSet.has(edgeKey)) continue;
          edgeSet.add(edgeKey);

          const linkType = shared.phone ? 'phone' : shared.vehicle ? 'vehicle' : shared.location ? 'location' : 'co_offense';

          links.push({
            source: A.id,
            target: B.id,
            confidence,
            type: linkType,
            sharedAttributes: shared,
            strength: confidence
          });
        }
      }

      // Emit event for new edges discovered
      if (window.KSPAIBus && links.length > 0) {
        KSPAIBus.emit('network:discovered', { nodeCount: nodes.length, linkCount: links.length });
      }

      // --- Community detection ---
      const communityLabels = labelPropagation(nodes, links);
      const communities = {};
      for (const [nodeId, communityId] of Object.entries(communityLabels)) {
        if (!communities[communityId]) communities[communityId] = [];
        communities[communityId].push(nodeId);
      }
      const communityList = Object.values(communities).filter(c => c.length > 1)
        .sort((a, b) => b.length - a.length);

      // Annotate nodes with community ID
      const communityIndex = {};
      communityList.forEach((c, i) => c.forEach(id => { communityIndex[id] = i; }));
      nodes.forEach(n => { n.communityId = communityIndex[n.id] ?? -1; });

      // --- Centrality ---
      const centrality = computeCentrality(nodes, links);
      const centralNodes = nodes
        .map(n => ({ ...n, centralityScore: parseFloat((centrality[n.id] || 0).toFixed(2)) }))
        .sort((a, b) => b.centralityScore - a.centralityScore)
        .slice(0, 5);

      const result = {
        nodes,
        links,
        communities: communityList,
        centralNodes,
        metadata: {
          nodeCount: nodes.length,
          linkCount: links.length,
          communityCount: communityList.length,
          avgConfidence: links.length > 0 ? parseFloat((links.reduce((s, l) => s + l.confidence, 0) / links.length).toFixed(2)) : 0,
          topCentralNode: centralNodes[0]?.label || 'N/A',
          generatedAt: new Date().toISOString()
        }
      };

      this._cache = result;
      return result;
    },

    /**
     * Get network focused on a specific suspect.
     * @param {string} suspectId
     */
    getSuspectSubgraph: function (suspectId) {
      const data = this._cache || this.autoDiscover();
      const relatedLinks = data.links.filter(l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return src === suspectId || tgt === suspectId;
      });

      const relatedIds = new Set([suspectId]);
      relatedLinks.forEach(l => {
        relatedIds.add(typeof l.source === 'object' ? l.source.id : l.source);
        relatedIds.add(typeof l.target === 'object' ? l.target.id : l.target);
      });

      return {
        nodes: data.nodes.filter(n => relatedIds.has(n.id)),
        links: relatedLinks
      };
    },

    /** Get cached result or run discovery */
    getGraph: function () {
      return this._cache || this.autoDiscover();
    }
  };

  window.KSPNetworkIntelligence = KSPNetworkIntelligence;

})();
