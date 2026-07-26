/* =========================================================
   DB.JS — Karnataka Crime Mock Database Engine (10,000+ Records)
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  // ── LCG Pseudo-Random Number Generator ──────────────────
  function createRandom(seed) {
    let s = seed;
    return function () {
      s = (1103515245 * s + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  // ── District Coordinate Centers (All 30 Districts) ─────
  const DISTRICT_CENTERS = {
    'Bengaluru Urban':   { lat: 12.9716, lng: 77.5946, weight: 2200 },
    'Mysuru':            { lat: 12.2958, lng: 76.6394, weight: 950 },
    'Belagavi':          { lat: 15.8497, lng: 74.4977, weight: 800 },
    'Kalaburagi':        { lat: 17.3297, lng: 76.8343, weight: 750 },
    'Hubballi-Dharwad':  { lat: 15.3647, lng: 75.1240, weight: 700 },
    'Davanagere':        { lat: 14.4644, lng: 75.9218, weight: 550 },
    'Tumakuru':          { lat: 13.3409, lng: 77.1010, weight: 500 },
    'Mangaluru':         { lat: 12.9141, lng: 74.8560, weight: 450 },
    'Udupi':             { lat: 13.3409, lng: 74.7421, weight: 300 },
    'Vijayapura':        { lat: 16.8302, lng: 75.7100, weight: 450 },
    'Bengaluru Rural':   { lat: 13.2122, lng: 77.5772, weight: 400 },
    'Kolar':             { lat: 13.1368, lng: 78.1292, weight: 280 },
    'Mandya':            { lat: 12.5218, lng: 76.8951, weight: 260 },
    'Hassan':            { lat: 13.0072, lng: 76.1027, weight: 250 },
    'Chikkamagaluru':    { lat: 13.3186, lng: 75.7761, weight: 220 },
    'Shivamogga':        { lat: 13.9299, lng: 75.5681, weight: 350 },
    'Chitradurga':       { lat: 14.2251, lng: 76.3986, weight: 240 },
    'Ballari':           { lat: 15.1394, lng: 76.9214, weight: 380 },
    'Bidar':             { lat: 17.9104, lng: 77.5199, weight: 310 },
    'Raichur':           { lat: 16.2057, lng: 77.3556, weight: 290 },
    'Koppal':            { lat: 15.3468, lng: 76.1554, weight: 200 },
    'Gadag':             { lat: 15.4262, lng: 75.6268, weight: 180 },
    'Haveri':            { lat: 14.7937, lng: 75.4042, weight: 190 },
    'Uttara Kannada':    { lat: 14.8080, lng: 74.7490, weight: 170 },
    'Dakshina Kannada':  { lat: 12.8710, lng: 75.2500, weight: 220 },
    'Kodagu':            { lat: 12.4244, lng: 75.7382, weight: 130 },
    'Chamarajanagar':    { lat: 11.9261, lng: 76.9402, weight: 140 },
    'Ramanagara':        { lat: 12.7150, lng: 77.2813, weight: 210 },
    'Chikkaballapur':    { lat: 13.4325, lng: 77.7275, weight: 230 },
    'Yadgir':            { lat: 16.7600, lng: 77.1300, weight: 180 },
  };

  // Roster lists for generator
  const FIRST_NAMES = ['Ramesh', 'Suresh', 'Priya', 'Kavitha', 'Vikram', 'Ananya', 'Ravi', 'Meena', 'Raju', 'Deepa', 'Sanjay', 'Sunita', 'Amit', 'Sneha', 'Vijay', 'Lakshmi', 'Kumar', 'Asha', 'Ganesh', 'Radha', 'Pradeep', 'Divya', 'Anil', 'Nisha', 'Rajesh', 'Shwetha', 'Arjun', 'Pooja', 'Harish', 'Kiran'];
  const LAST_NAMES = ['Kumar', 'Reddy', 'Setty', 'Nayak', 'Menon', 'Sharma', 'Gowda', 'Babu', 'Krishnan', 'Patil', 'Joshi', 'Hegde', 'Rao', 'Singh', 'Naidu', 'Desai', 'Acharya', 'Swamy', 'Bhat', 'Prasad'];
  
  const CRIME_TYPES = [
    { type: 'Financial Fraud', category: 'fraud', weight: 0.28, severity: 'high' },
    { type: 'Vehicle Theft', category: 'theft', weight: 0.24, severity: 'medium' },
    { type: 'Cybercrime', category: 'cyber', weight: 0.16, severity: 'high' },
    { type: 'Robbery', category: 'robbery', weight: 0.11, severity: 'high' },
    { type: 'Assault', category: 'assault', weight: 0.08, severity: 'medium' },
    { type: 'Narcotics', category: 'drugs', weight: 0.07, severity: 'critical' },
    { type: 'Missing Persons', category: 'missing', weight: 0.04, severity: 'low' },
    { type: 'Murder', category: 'murder', weight: 0.02, severity: 'critical' }
  ];

  const POLICE_STATIONS = {
    'Bengaluru Urban': ['Majestic', 'Shivajinagar', 'Indiranagar', 'Jayanagar', 'Koramangala', 'Whitefield', 'Yelahanka'],
    'Mysuru': ['Palace Station', 'Devaraja Market', 'Vidyaranyapuram', 'Jayalakshmipuram', 'Lashkar'],
    'Belagavi': ['Khade Bazar', 'Camp Station', 'Shahapur', 'Udyambag', 'Market Station'],
    'Kalaburagi': ['Chowk Police Station', 'Station Bazar', 'Raghavendra Nagar', 'University Area'],
    'Hubballi-Dharwad': ['Suburban Hubballi', 'Town Station Dharwad', 'Vidyanagar', 'Gokul Road'],
    'Davanagere': ['Gandhinagar Station', 'Basaveshwara', 'KTJ Nagar'],
    'Tumakuru': ['Kyatsandra', 'Town Police Station', 'New Extension'],
    'Mangaluru': ['Kadri Police Station', 'Pandeshwar', 'Bunder', 'Urwa'],
    'Udupi': ['Town Police Station', 'Malpe Beach Outpost', 'Manipal'],
  };

  const WEATHERS = ['Sunny', 'Rainy', 'Overcast', 'Clear Night', 'Foggy'];
  const LANDMARKS = ['Bus Terminal', 'Metro Station', 'Highway Bypass', 'Public Park', 'Shopping Mall', 'Commercial Street', 'Railway Station', 'Lake Road', 'University Campus', 'Market Square'];
  const EVIDENCE_POOL = ['CCTV Footage', 'Call Logs', 'GPS Tracking', 'Fingerprints', 'Witness Statement', 'Digital IP Logs', 'Vehicle Registration', 'Recovered Weapon', 'Socio-economic Survey', 'Financial Records'];
  const STATUSES = ['Active', 'Investigating', 'Resolved', 'Arrested'];

  const CORE_OFFENDERS = [
    { id: 'OFF001', name: 'Ravi Kumar M.', gender: 'Male', age: 34, district: 'Bengaluru Urban' },
    { id: 'OFF002', name: 'Arjun Sharma P.', gender: 'Male', age: 29, district: 'Hubballi-Dharwad' },
    { id: 'OFF003', name: 'Mohammed Rafiq S.', gender: 'Male', age: 41, district: 'Mysuru' },
    { id: 'OFF004', name: 'Suresh Nayak B.', gender: 'Male', age: 38, district: 'Belagavi' },
    { id: 'OFF005', name: 'Priya Menon K.', gender: 'Female', age: 27, district: 'Bengaluru Urban' },
    { id: 'OFF006', name: 'Deepak Reddy N.', gender: 'Male', age: 31, district: 'Kalaburagi' }
  ];

  const OFFICER_ROSTER = [
    'DCP Sanjay Gupta', 'SP Meena Krishnan', 'SI Kavitha Reddy', 'CI Ramesh Babu', 'HC Sunil Kumar',
    'SI Anand Bhosale', 'SI Sunita Patil', 'SI Vikram Setty', 'HC Pradeep N.', 'CI Anand Kumar',
    'SP Ranjitha D.', 'SI Kumar Rao', 'SI Deepa Nayak', 'HC Raju Lamani', 'HC Mahesh Tambe'
  ];

  const METHOD_POOL = {
    'Financial Fraud': ['Vishing (phone fraud)', 'Phishing email link', 'Fake investment portal', 'Card cloning', 'E-commerce escrow scam'],
    'Vehicle Theft': ['Master key cloning', 'Keyless signal relay', 'Ignition hotwiring', 'Towed away covertly', 'Forced window entry'],
    'Cybercrime': ['Ransomware deployment', 'SIM swap hijack', 'Social engineering account theft', 'Maliwre script download', 'Fake government portal login'],
    'Robbery': ['Knife threat at intersection', 'Chain snatching from bike', 'Home break-in threat', 'Bag snatching in crowd', 'Highway vehicle hijacking'],
    'Assault': ['Street altercation', 'Property dispute clash', 'Bar altercation', 'Road rage escalation', 'Domestic altercation'],
    'Narcotics': ['Interstate corridor transport', 'Darknet mail order delivery', 'Local dealer peddling', 'Peddler hideout exchange', 'Border checkpoint smuggling'],
    'Missing Persons': ['Runaway pattern', 'Displacement due to employment', 'Cognitive disorientation', 'Lost in crowded event', 'Voluntary departure'],
    'Murder': ['Personal enmity assault', 'Robbery resistance clash', 'Premeditated assault', 'Contract assignment hit', 'Spontaneous altercation']
  };

  const KSPDatabase = {
    incidents: [],
    initialized: false,

    init: function () {
      if (this.initialized) return;

      const cache = localStorage.getItem('ksp_db_incidents_v2');
      if (cache) {
        try {
          this.incidents = JSON.parse(cache);
          this.initialized = true;
          return;
        } catch (e) {
          console.warn("Failed to parse cached incidents database. Re-generating...", e);
        }
      }

      this.generateDatabase();
      this.saveToCache();
      this.initialized = true;
    },

    generateDatabase: function () {
      console.log("Generating 10,250 deterministic crime records...");
      const rand = createRandom(54321); // Set seed
      const incidents = [];

      const districtsList = Object.keys(DISTRICT_CENTERS);
      const totalTarget = 10250;

      // First distribute district count indices realistically
      const districtDistribution = [];
      districtsList.forEach(d => {
        const weight = DISTRICT_CENTERS[d].weight;
        for (let i = 0; i < weight; i++) {
          districtDistribution.push(d);
        }
      });

      for (let i = 1; i <= totalTarget; i++) {
        // Select District based on distribution
        const district = districtDistribution[Math.floor(rand() * districtDistribution.length)];
        const center = DISTRICT_CENTERS[district];

        // Small coordinate offset (+/- 0.08)
        const latOffset = (rand() - 0.5) * 0.16;
        const lngOffset = (rand() - 0.5) * 0.16;
        const lat = parseFloat((center.lat + latOffset).toFixed(6));
        const lng = parseFloat((center.lng + lngOffset).toFixed(6));

        // Select police station
        const stations = POLICE_STATIONS[district] || ['Central Police Station', 'Rural Police Station', 'Junction Station'];
        const station = stations[Math.floor(rand() * stations.length)];

        // Select crime type based on weights
        const crimeRand = rand();
        let crimeTmpl = CRIME_TYPES[0];
        let runningWeight = 0;
        for (let c = 0; c < CRIME_TYPES.length; c++) {
          runningWeight += CRIME_TYPES[c].weight;
          if (crimeRand <= runningWeight) {
            crimeTmpl = CRIME_TYPES[c];
            break;
          }
        }

        // Generate dates (Jan 1, 2024 to Jul 3, 2025)
        // 2024 represents 366 days, 2025 has 184 days. Total ~550 days.
        const dayOffset = Math.floor(rand() * 550);
        const crimeDate = new Date(2024, 0, 1);
        crimeDate.setDate(crimeDate.getDate() + dayOffset);
        const dateStr = crimeDate.toISOString().split('T')[0];

        // Generate time matching timeOfDay curve (skewed towards late afternoon / evening)
        const timeVal = rand();
        let hour = 18;
        if (timeVal < 0.1) hour = Math.floor(rand() * 6); // Late night (0-5)
        else if (timeVal < 0.25) hour = Math.floor(rand() * 6) + 6; // Morning (6-11)
        else if (timeVal < 0.55) hour = Math.floor(rand() * 6) + 12; // Afternoon (12-17)
        else hour = Math.floor(rand() * 6) + 18; // Evening (18-23)

        const minute = Math.floor(rand() * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Victim details
        const vFirst = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const vLast = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const vAge = Math.floor(rand() * 62) + 18;
        const vGender = rand() > 0.5 ? 'Male' : 'Female';
        const vPhone = `+91-9${Math.floor(rand() * 900000000) + 100000000}`;

        // Suspect details (Repeat offender linkage check)
        const isRepeat = rand() < 0.12; // 12% Repeat offender rate
        let suspectName = 'Unknown';
        let suspectId = null;
        let repeatFlag = false;

        if (isRepeat) {
          // Link to core repeat offenders or generate new repeat IDs
          const coreRef = CORE_OFFENDERS[Math.floor(rand() * CORE_OFFENDERS.length)];
          suspectName = coreRef.name;
          suspectId = coreRef.id;
          repeatFlag = true;
        } else if (rand() > 0.3) {
          const sFirst = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
          const sLast = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
          suspectName = `${sFirst} ${sLast}`;
        }

        // Severity override based on crime type
        const severity = crimeTmpl.severity;

        // Evidence pool assignment (2 to 4 items)
        const evidenceCount = Math.floor(rand() * 3) + 2;
        const evidence = [];
        const evShuffled = [...EVIDENCE_POOL].sort(() => rand() - 0.5);
        for (let e = 0; e < evidenceCount; e++) {
          evidence.push(evShuffled[e]);
        }

        // Status assignment (Historical dates are more likely to be Resolved)
        let status = STATUSES[Math.floor(rand() * STATUSES.length)];
        const daysAgo = (new Date(2025, 6, 3) - crimeDate) / (1000 * 60 * 60 * 24);
        if (daysAgo > 30 && status === 'Active') {
          status = rand() > 0.4 ? 'Resolved' : 'Arrested';
        } else if (daysAgo < 5) {
          status = rand() > 0.3 ? 'Active' : 'Investigating';
        }

        // Assigned Officer
        const officer = OFFICER_ROSTER[Math.floor(rand() * OFFICER_ROSTER.length)];

        // Socioeconomic details
        const unemployment = parseFloat((4 + rand() * 11).toFixed(1));
        const literacy = parseFloat((65 + rand() * 23).toFixed(1));
        const density = center.weight > 1000 ? 'High Density' : center.weight > 400 ? 'Medium Density' : 'Low Density';

        // Vehicle info for vehicle thefts & highway bypass crimes
        let vehicle = 'N/A';
        if (crimeTmpl.category === 'theft' || crimeTmpl.category === 'robbery' || rand() < 0.25) {
          const series = ['MF', 'HC', 'EM', 'KL', 'TR'];
          const plate = `KA-0${Math.floor(rand() * 9) + 1}-${series[Math.floor(rand() * series.length)]}-${Math.floor(rand() * 9000) + 1000}`;
          const models = ['Honda Activa', 'Hero Splendor', 'Honda City', 'Maruti Swift', 'Royal Enfield', 'Hyundai i20'];
          vehicle = `${plate} (${models[Math.floor(rand() * models.length)]})`;
        }

        const phoneNo = `+91-8${Math.floor(rand() * 900000000) + 100000000}`;
        const associates = repeatFlag ? 'Linked in Registry' : 'None Identified';

        const methods = METHOD_POOL[crimeTmpl.type] || ['Modus operandi unknown'];
        const crimeMethod = methods[Math.floor(rand() * methods.length)];

        incidents.push({
          id: `CR-${i.toString().padStart(5, '0')}`,
          caseNumber: `KSP-2024-${i.toString().padStart(5, '0')}`,
          crimeType: crimeTmpl.type,
          category: crimeTmpl.category,
          district: district,
          policeStation: station,
          lat: lat,
          lng: lng,
          date: dateStr,
          time: timeStr,
          victim: {
            name: `${vFirst} ${vLast}`,
            age: vAge,
            gender: vGender,
            phone: vPhone
          },
          suspect: {
            name: suspectName,
            id: suspectId,
            repeatOffender: repeatFlag
          },
          severity: severity,
          evidence: evidence,
          status: status,
          assignedOfficer: officer,
          socioEconomic: {
            unemploymentRate: unemployment,
            literacyRate: literacy,
            populationDensity: density
          },
          weather: WEATHERS[Math.floor(rand() * WEATHERS.length)],
          landmark: LANDMARKS[Math.floor(rand() * LANDMARKS.length)],
          vehicleInfo: vehicle,
          phoneNumber: phoneNo,
          knownAssociates: associates,
          crimeMethod: crimeMethod
        });
      }

      this.incidents = incidents;
      console.log(`Procedurally generated ${this.incidents.length} crime records successfully.`);
    },

    saveToCache: function () {
      try {
        localStorage.setItem('ksp_db_incidents_v2', JSON.stringify(this.incidents));
      } catch (e) {
        console.warn("localStorage quota exceeded. Storing database in-memory only.");
      }
    },

    getIncidents: function () {
      this.init();
      return this.incidents;
    },

    getOffenders: function () {
      this.init();
      
      // Compute repeat offender cases dynamic count and cases details
      const list = JSON.parse(JSON.stringify(CORE_OFFENDERS));
      list.forEach(o => {
        const associatedCrimes = this.incidents.filter(inc => inc.suspect && inc.suspect.id === o.id);
        o.crimes = [...new Set(associatedCrimes.map(c => c.crimeType))];
        o.arrests = associatedCrimes.filter(c => c.status === 'Arrested' || c.status === 'Resolved').length + 1;
        o.riskScore = Math.min(99, 50 + associatedCrimes.length * 7);
        o.associates = associatedCrimes.length > 2 ? 5 : 2;
        
        // Pick last 3 cases sorted by date
        const sorted = associatedCrimes.sort((a,b) => new Date(b.date) - new Date(a.date));
        o.lastSeen = sorted.length > 0 ? sorted[0].date : '2025-06-30';
        o.crimeHistory = sorted.slice(0, 3).map(c => ({
          date: c.date,
          crime: c.crimeType,
          status: c.status === 'Active' ? 'Open' : c.status === 'Investigating' ? 'Under Trial' : 'Convicted'
        }));
      });
      return list;
    },

    addIncident: function (inc) {
      this.init();
      this.incidents.unshift(inc);
      this.saveToCache();

      // Trigger standard event notifications
      const event = new CustomEvent('ksp_db_update', { detail: inc });
      window.dispatchEvent(event);
      
      // Dispatch broadcast storage event for multi-tab sync
      localStorage.setItem('ksp_db_broadcast_tick', JSON.stringify({
        timestamp: Date.now(),
        incident: inc
      }));
    },

    updateIncident: function (id, fields) {
      this.init();
      const inc = this.incidents.find(i => i.id === id);
      if (inc) {
        Object.assign(inc, fields);
        this.saveToCache();
        
        const event = new CustomEvent('ksp_db_update', { detail: inc });
        window.dispatchEvent(event);
        return true;
      }
      return false;
    },

    reset: function () {
      localStorage.removeItem('ksp_db_incidents_v2');
      this.incidents = [];
      this.initialized = false;
      this.init();
      
      const event = new CustomEvent('ksp_db_update', { detail: null });
      window.dispatchEvent(event);
    }
  };

  // Expose globally
  KSPDatabase.districts = window.KSPData?.districts || [];
  window.KSPDatabase = KSPDatabase;
  KSPDatabase.init();
})();
