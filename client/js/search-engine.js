/* =========================================================
   SEARCH-ENGINE.JS — Premium Global Search & Substring Matcher
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const KSPSearchEngine = {
    // Perform fuzzy and substring matches across the database
    search: function (queryStr) {
      if (!queryStr || typeof queryStr !== 'string') {
        return { total: 0, cases: [], offenders: [], vehicles: [], phones: [], districts: [] };
      }

      const q = queryStr.trim().toLowerCase();
      const incidents = KSPDatabase.getIncidents();
      const offenders = KSPDatabase.getOffenders();
      const districts = KSPDatabase.districts || [];

      const results = {
        total: 0,
        cases: [],
        offenders: [],
        vehicles: [],
        phones: [],
        districts: []
      };

      // ── 1. Search Districts ───────────────────────────────
      districts.forEach(d => {
        if (d.name.toLowerCase().includes(q) || d.id.toLowerCase() === q) {
          results.districts.push({
            type: 'district',
            id: d.id,
            name: d.name,
            risk: d.risk,
            score: d.score,
            crimes: d.crimes
          });
        }
      });

      // ── 2. Search Offenders ───────────────────────────────
      offenders.forEach(off => {
        let score = 0;
        if (off.id.toLowerCase() === q) score += 100;
        else if (off.name.toLowerCase().includes(q)) score += 50;
        else if (off.crimes.some(c => c.toLowerCase().includes(q))) score += 20;
        else if (off.district.toLowerCase().includes(q)) score += 10;

        if (score > 0) {
          results.offenders.push({
            type: 'offender',
            id: off.id,
            name: off.name,
            age: off.age,
            gender: off.gender,
            district: off.district,
            status: off.status,
            riskScore: off.riskScore,
            score: score
          });
        }
      });
      // Sort offenders by score
      results.offenders.sort((a, b) => b.score - a.score);

      // ── 3. Search Incidents, Vehicles, Phones & Evidence ──
      incidents.forEach(inc => {
        let score = 0;
        
        // Exact ID matches get highest priority
        if (inc.id.toLowerCase() === q || inc.caseNumber.toLowerCase() === q) {
          score += 150;
        }
        // Suspect matches
        else if (inc.suspect.name.toLowerCase().includes(q) || (inc.suspect.id && inc.suspect.id.toLowerCase() === q)) {
          score += 80;
        }
        // Officer matches
        else if (inc.assignedOfficer.toLowerCase().includes(q)) {
          score += 60;
        }
        // Victim matches
        else if (inc.victim.name.toLowerCase().includes(q)) {
          score += 50;
        }
        // Vehicle search matches
        else if (inc.vehicleInfo !== 'N/A' && inc.vehicleInfo.toLowerCase().includes(q)) {
          score += 70;
          results.vehicles.push({
            type: 'vehicle',
            caseId: inc.id,
            plate: inc.vehicleInfo,
            district: inc.district,
            suspect: inc.suspect.name,
            officer: inc.assignedOfficer,
            date: inc.date
          });
        }
        // Phone number matches
        else if (inc.phoneNumber.includes(q) || inc.victim.phone.includes(q)) {
          score += 70;
          results.phones.push({
            type: 'phone',
            caseId: inc.id,
            number: inc.phoneNumber.includes(q) ? inc.phoneNumber : inc.victim.phone,
            district: inc.district,
            suspect: inc.suspect.name,
            victim: inc.victim.name
          });
        }
        // Location & police station matches
        else if (inc.policeStation.toLowerCase().includes(q) || inc.landmark.toLowerCase().includes(q) || inc.district.toLowerCase().includes(q)) {
          score += 40;
        }
        // Category / Type / Method matches
        else if (inc.crimeType.toLowerCase().includes(q) || inc.crimeMethod.toLowerCase().includes(q)) {
          score += 30;
        }
        // Evidence matches
        else if (inc.evidence.some(e => e.toLowerCase().includes(q))) {
          score += 25;
        }

        if (score > 0) {
          results.cases.push({
            type: 'case',
            id: inc.id,
            caseNumber: inc.caseNumber,
            crimeType: inc.crimeType,
            district: inc.district,
            station: inc.policeStation,
            date: inc.date,
            time: inc.time,
            status: inc.status,
            priority: inc.severity,
            officer: inc.assignedOfficer,
            suspect: inc.suspect.name,
            score: score
          });
        }
      });

      // Sort cases by score
      results.cases.sort((a, b) => b.score - a.score);

      // Keep max 10 entries per category to avoid overflowing UI
      results.cases = results.cases.slice(0, 10);
      results.offenders = results.offenders.slice(0, 5);
      results.vehicles = results.vehicles.slice(0, 5);
      results.phones = results.phones.slice(0, 5);
      results.districts = results.districts.slice(0, 3);

      results.total = results.cases.length + results.offenders.length + results.vehicles.length + results.phones.length + results.districts.length;
      return results;
    }
  };

  // Expose globally
  window.KSPSearchEngine = KSPSearchEngine;
})();
