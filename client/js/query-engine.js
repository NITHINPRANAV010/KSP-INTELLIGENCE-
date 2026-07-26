/* =========================================================
   QUERY-ENGINE.JS — Natural Language Query Parser Service
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  const DISTRICT_SYNONYMS = {
    'bangalore': 'Bengaluru Urban',
    'bengaluru': 'Bengaluru Urban',
    'blr': 'Bengaluru Urban',
    'mysore': 'Mysuru',
    'mysuru': 'Mysuru',
    'mys': 'Mysuru',
    'belgaum': 'Belagavi',
    'belagavi': 'Belagavi',
    'blg': 'Belagavi',
    'gulbarga': 'Kalaburagi',
    'kalaburagi': 'Kalaburagi',
    'klb': 'Kalaburagi',
    'hubli': 'Hubballi-Dharwad',
    'dharwad': 'Hubballi-Dharwad',
    'hubballi': 'Hubballi-Dharwad',
    'hbl': 'Hubballi-Dharwad',
    'davanagere': 'Davanagere',
    'dwd': 'Davanagere',
    'tumkur': 'Tumakuru',
    'tumakuru': 'Tumakuru',
    'mangaluru': 'Mangaluru',
    'mangalore': 'Mangaluru',
    'udupi': 'Udupi',
    'vijayapura': 'Vijayapura',
    'bijapur': 'Vijayapura',
    'kolar': 'Kolar',
    'mandya': 'Mandya',
    'hassan': 'Hassan',
    'shimoga': 'Shivamogga',
    'shivamogga': 'Shivamogga',
    'bellary': 'Ballari',
    'ballari': 'Ballari',
    'bidar': 'Bidar',
    'raichur': 'Raichur',
  };

  const CRIME_SYNONYMS = {
    'murder': 'Murder',
    'homicide': 'Murder',
    'kill': 'Murder',
    'theft': 'Vehicle Theft',
    'stolen': 'Vehicle Theft',
    'vehicle': 'Vehicle Theft',
    'car': 'Vehicle Theft',
    'bike': 'Vehicle Theft',
    'cyber': 'Cybercrime',
    'hacking': 'Cybercrime',
    'phishing': 'Cybercrime',
    'fraud': 'Financial Fraud',
    'scam': 'Financial Fraud',
    'money': 'Financial Fraud',
    'upi': 'Financial Fraud',
    'drugs': 'Narcotics',
    'narcotics': 'Narcotics',
    'smuggling': 'Narcotics',
    'robbery': 'Robbery',
    'heist': 'Robbery',
    'snatching': 'Robbery',
    'burglary': 'Robbery',
    'assault': 'Assault',
    'fight': 'Assault',
    'attack': 'Assault',
    'missing': 'Missing Persons',
    'lost': 'Missing Persons'
  };

  const KSPQueryEngine = {
    parse: function (text) {
      if (!text || typeof text !== 'string') {
        return { action: 'unknown', text: 'Invalid command input', filters: {} };
      }

      const raw = text.trim();
      const txt = raw.toLowerCase();
      const result = {
        raw: raw,
        action: 'filter',
        text: '',
        filters: {},
        route: null
      };

      // ── Find District in Query ────────────────────────────
      let matchedDistrict = null;
      for (const [key, value] of Object.entries(DISTRICT_SYNONYMS)) {
        if (txt.includes(key)) {
          matchedDistrict = value;
          break;
        }
      }

      // ── Find Crime Type in Query ──────────────────────────
      let matchedCrime = null;
      for (const [key, value] of Object.entries(CRIME_SYNONYMS)) {
        if (txt.includes(key)) {
          matchedCrime = value;
          break;
        }
      }

      // ── Match Intent Rules ────────────────────────────────
      
      // 1. Prediction explanation intent
      if (txt.includes('explain') || txt.includes('why') || txt.includes('reason')) {
        result.action = 'explain';
        result.filters.district = matchedDistrict || 'Bengaluru Urban';
        result.filters.crimeType = matchedCrime || 'Vehicle Theft';
        result.text = `AI reasoning model output compiled for ${result.filters.district} (${result.filters.crimeType}): Cluster analysis highlights weekend surge factors.`;
        return result;
      }

      // 2. Predict future risk
      if (txt.includes('predict') || txt.includes('forecast') || txt.includes('future') || txt.includes('next week')) {
        result.action = 'predict';
        result.route = 'predictive.html';
        result.filters.district = matchedDistrict || 'all';
        result.filters.crimeType = matchedCrime || 'all';
        result.text = `AI Prediction Engine loaded. Navigating to forecasts page for: ${matchedDistrict || 'all districts'}...`;
        return result;
      }

      // 3. Repeat offender list
      if (txt.includes('repeat') || txt.includes('offender') || txt.includes('suspect') || txt.includes('recidivism')) {
        result.action = 'filter';
        result.route = 'offenders.html';
        result.filters.repeatOffender = true;
        if (matchedDistrict) result.filters.district = matchedDistrict;
        result.text = `Displaying registry repeat offenders matching queries${matchedDistrict ? ' in ' + matchedDistrict : ''}...`;
        return result;
      }

      // 4. Report generation
      if (txt.includes('report') || txt.includes('generate') || txt.includes('pdf')) {
        result.action = 'report';
        result.route = 'reports.html';
        if (matchedDistrict) result.filters.district = matchedDistrict;
        
        let reportType = 'executive';
        if (matchedCrime) {
          if (matchedCrime === 'Vehicle Theft' || matchedCrime === 'Robbery') reportType = 'hotspot';
          else if (matchedCrime === 'Cybercrime' || matchedCrime === 'Financial Fraud') reportType = 'trend';
        } else if (txt.includes('network') || txt.includes('associate')) {
          reportType = 'network';
        } else if (txt.includes('offender')) {
          reportType = 'offender';
        } else if (matchedDistrict) {
          reportType = 'district';
        }
        
        result.route = `reports.html?type=${reportType}`;
        result.text = `Redirecting to intelligence reports panel to compile '${reportType}' summary...`;
        return result;
      }

      // 5. Compare districts
      if (txt.includes('compare') || txt.includes('difference') || txt.includes('versus') || txt.includes('vs')) {
        result.action = 'compare';
        result.route = 'analytics.html';
        result.text = 'Navigating to Analytics page for cross-district comparison charts...';
        return result;
      }

      // 6. Network analysis
      if (txt.includes('network') || txt.includes('connection') || txt.includes('link') || txt.includes('graph')) {
        result.action = 'network';
        result.route = 'network.html';
        result.text = 'Loading criminal association link graph analysis visualizer...';
        return result;
      }

      // 7. General navigation phrases
      if (txt.includes('map') || txt.includes('heatmap') || txt.includes('hotspot')) {
        result.action = 'navigate';
        result.route = 'heatmap.html';
        if (matchedDistrict) result.filters.district = matchedDistrict;
        result.text = `Navigating to Crime Heatmap visualizer${matchedDistrict ? ' centered on ' + matchedDistrict : ''}...`;
        return result;
      }

      if (txt.includes('patrol') || txt.includes('deployment') || txt.includes('police car')) {
        result.action = 'navigate';
        result.route = 'patrol.html';
        result.text = 'Navigating to Patrol Deployment maps and recommendation logs...';
        return result;
      }

      // Default fallback: normal filter search
      if (matchedDistrict || matchedCrime) {
        result.action = 'filter';
        if (matchedDistrict) result.filters.district = matchedDistrict;
        if (matchedCrime) result.filters.crimeType = matchedCrime;
        
        const descList = [];
        if (matchedCrime) descList.push(`type: "${matchedCrime}"`);
        if (matchedDistrict) descList.push(`district: "${matchedDistrict}"`);
        result.text = `Filtering database records for ${descList.join(' AND ')}...`;
        return result;
      }

      // If nothing matches, trigger fuzzy search redirect
      result.action = 'search';
      result.route = `investigation.html?q=${encodeURIComponent(raw)}`;
      result.text = `Fuzzy indexing command: "${raw}". Loading AI Investigation workbench search logs...`;
      return result;
    }
  };

  // Expose globally
  window.KSPQueryEngine = KSPQueryEngine;
})();
