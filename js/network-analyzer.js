/* =========================================================
   NETWORK-ANALYZER.JS — Dynamic Link Analysis & Graph Builder
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const KSPNetworkAnalyzer = {
    // Generate relationship nodes and links dynamically for a given suspect
    buildGraphForSuspect: function (suspectName) {
      if (!suspectName) {
        return this.buildDefaultGraph();
      }

      const incidents = KSPDatabase.getIncidents();
      const sNameLower = suspectName.toLowerCase();

      // Find all cases involving the suspect
      const suspectCases = incidents.filter(inc => 
        inc.suspect && inc.suspect.name.toLowerCase().includes(sNameLower)
      );

      if (suspectCases.length === 0) {
        return this.buildDefaultGraph();
      }

      const nodesMap = {};
      const links = [];

      // Create central suspect node
      const primarySuspectName = suspectCases[0].suspect.name;
      const primarySuspectId = suspectCases[0].suspect.id || 'S_ROOT';
      
      let riskScore = 50;
      if (window.KSPOffenderProfiler) {
        const prof = KSPOffenderProfiler.profile({ offenderId: primarySuspectId }) || 
                     KSPOffenderProfiler.profile({ name: primarySuspectName });
        if (prof) riskScore = prof.riskScore;
      }

      nodesMap[primarySuspectId] = {
        id: primarySuspectId,
        label: primarySuspectName,
        type: 'suspect',
        val: 30, // Visual size
        district: suspectCases[0].district,
        riskScore: riskScore,
        crimes: suspectCases.length
      };

      // Traverse cases to pull linked attributes
      suspectCases.slice(0, 12).forEach((inc, idx) => {
        // Case node
        const caseId = inc.id;
        if (!nodesMap[caseId]) {
          nodesMap[caseId] = { id: caseId, label: `Case ${caseId}`, type: 'incident', val: 18, district: inc.district };
        }
        links.push({ source: primarySuspectId, target: caseId, type: 'suspect_in', strength: 0.9 });

        // Location node
        const locId = `LOC_${inc.policeStation.replace(/\s+/g, '')}`;
        if (!nodesMap[locId]) {
          nodesMap[locId] = { id: locId, label: inc.policeStation, type: 'location', val: 15, district: inc.district };
        }
        links.push({ source: caseId, target: locId, type: 'located_at', strength: 0.8 });

        // Phone node
        if (inc.phoneNumber && inc.phoneNumber !== 'N/A') {
          const phId = `PH_${inc.phoneNumber.replace(/[^0-9]/g, '')}`;
          if (!nodesMap[phId]) {
            nodesMap[phId] = { id: phId, label: inc.phoneNumber, type: 'phone', val: 12, district: inc.district };
          }
          links.push({ source: primarySuspectId, target: phId, type: 'uses_phone', strength: 0.85 });
          links.push({ source: caseId, target: phId, type: 'phone_in_incident', strength: 0.7 });
        }

        // Vehicle node
        if (inc.vehicleInfo && inc.vehicleInfo !== 'N/A') {
          const vehClean = inc.vehicleInfo.split(' ')[0]; // Plate only
          const vehId = `VEH_${vehClean.replace(/[^a-zA-Z0-9]/g, '')}`;
          if (!nodesMap[vehId]) {
            nodesMap[vehId] = { id: vehId, label: inc.vehicleInfo, type: 'vehicle', val: 14, district: inc.district };
          }
          links.push({ source: primarySuspectId, target: vehId, type: 'uses_vehicle', strength: 0.8 });
          links.push({ source: caseId, target: vehId, type: 'vehicle_in_incident', strength: 0.75 });
        }

        // Check for co-suspects/associates in similar crime locations
        if (idx < 4) {
          const relatedPrecinctCases = incidents.filter(i => 
            i.district === inc.district && 
            i.policeStation === inc.policeStation && 
            i.suspect.name !== primarySuspectName &&
            i.suspect.name !== 'Unknown' &&
            i.suspect.name !== 'Under Investigation'
          ).slice(0, 2);

          relatedPrecinctCases.forEach(rc => {
            const assocId = rc.suspect.id || `S_${rc.suspect.name.replace(/\s+/g, '')}`;
            if (!nodesMap[assocId]) {
              let aRisk = 45;
              if (window.KSPOffenderProfiler) {
                const aProf = KSPOffenderProfiler.profile({ offenderId: assocId });
                if (aProf) aRisk = aProf.riskScore;
              }
              nodesMap[assocId] = { 
                id: assocId, 
                label: rc.suspect.name, 
                type: 'suspect', 
                val: 22, 
                district: rc.district,
                riskScore: aRisk,
                crimes: incidents.filter(i => i.suspect.name === rc.suspect.name).length
              };
            }
            links.push({ source: primarySuspectId, target: assocId, type: 'co_offender', strength: 0.6 });
            links.push({ source: assocId, target: caseId, type: 'linked_suspect', strength: 0.5 });
          });
        }
      });

      return {
        nodes: Object.values(nodesMap),
        links: links
      };
    },

    // Return the default core link graph generated from actual database records
    buildDefaultGraph: function () {
      const incidents = KSPDatabase.getIncidents();
      const offenders = KSPDatabase.getOffenders();
      
      const nodesMap = {};
      const links = [];

      // Take top 6 known repeat offenders
      const topOffenders = offenders.slice(0, 6);

      topOffenders.forEach(o => {
        let riskScore = o.riskScore || 65;
        if (window.KSPOffenderProfiler) {
          const prof = KSPOffenderProfiler.profile({ offenderId: o.id });
          if (prof) riskScore = prof.riskScore;
        }

        nodesMap[o.id] = {
          id: o.id,
          label: o.name,
          type: 'suspect',
          val: 28,
          district: o.district,
          riskScore: riskScore,
          crimes: incidents.filter(i => i.suspect?.id === o.id).length
        };

        // Find linked incidents for this offender
        const offenderCases = incidents.filter(i => i.suspect?.id === o.id).slice(0, 3);
        offenderCases.forEach(inc => {
          const caseId = inc.id;
          if (!nodesMap[caseId]) {
            nodesMap[caseId] = { id: caseId, label: `Case ${caseId}`, type: 'incident', val: 18, district: inc.district };
          }
          links.push({ source: o.id, target: caseId, type: 'incident', strength: 0.9 });

          // Add location
          const locId = `L_${inc.policeStation.replace(/\s+/g, '')}`;
          if (!nodesMap[locId]) {
            nodesMap[locId] = { id: locId, label: inc.policeStation, type: 'location', val: 15, district: inc.district };
          }
          links.push({ source: caseId, target: locId, type: 'location', strength: 0.8 });

          // Add vehicle
          if (inc.vehicleInfo && inc.vehicleInfo !== 'N/A') {
            const vehClean = inc.vehicleInfo.split(' ')[0];
            const vehId = `V_${vehClean.replace(/[^a-zA-Z0-9]/g, '')}`;
            if (!nodesMap[vehId]) {
              nodesMap[vehId] = { id: vehId, label: inc.vehicleInfo, type: 'vehicle', val: 14, district: inc.district };
            }
            links.push({ source: o.id, target: vehId, type: 'vehicle', strength: 0.75 });
          }

          // Add phone
          if (inc.phoneNumber && inc.phoneNumber !== 'N/A') {
            const phId = `P_${inc.phoneNumber.replace(/[^0-9]/g, '')}`;
            if (!nodesMap[phId]) {
              nodesMap[phId] = { id: phId, label: inc.phoneNumber, type: 'phone', val: 12, district: inc.district };
            }
            links.push({ source: o.id, target: phId, type: 'phone', strength: 0.8 });
          }
        });
      });

      // Add suspect-to-suspect links discovered by Phase 4 Network Intelligence
      if (window.KSPNetworkIntelligence) {
        const netResult = KSPNetworkIntelligence.autoDiscover();
        netResult.links.forEach(l => {
          const srcId = typeof l.source === 'object' ? l.source.id : l.source;
          const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
          
          if (nodesMap[srcId] && nodesMap[tgtId]) {
            links.push({
              source: srcId,
              target: tgtId,
              type: 'associate',
              strength: l.confidence
            });
          }
        });
      } else {
        // Fallback links
        if (nodesMap['OFF001'] && nodesMap['OFF002']) links.push({ source: 'OFF001', target: 'OFF002', type: 'associate', strength: 0.9 });
        if (nodesMap['OFF001'] && nodesMap['OFF004']) links.push({ source: 'OFF001', target: 'OFF004', type: 'associate', strength: 0.7 });
        if (nodesMap['OFF002'] && nodesMap['OFF003']) links.push({ source: 'OFF002', target: 'OFF003', type: 'associate', strength: 0.8 });
      }

      return {
        nodes: Object.values(nodesMap),
        links: links
      };
    }
  };

  // Expose globally
  window.KSPNetworkAnalyzer = KSPNetworkAnalyzer;
})();
