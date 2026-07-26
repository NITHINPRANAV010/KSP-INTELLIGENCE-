/* =========================================================
   DATA.JS — Karnataka Crime Mock Dataset
   KSP AI Crime Intelligence Command Center
   ========================================================= */

const KSPData = {

  // ── Districts ─────────────────────────────────────────
  districts: [
    { id: 'BLR', name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, risk: 'critical', score: 94, crimes: 1247 },
    { id: 'MYS', name: 'Mysuru', lat: 12.2958, lng: 76.6394, risk: 'high', score: 78, crimes: 634 },
    { id: 'BLG', name: 'Belagavi', lat: 15.8497, lng: 74.4977, risk: 'high', score: 71, crimes: 521 },
    { id: 'DWD', name: 'Davanagere', lat: 14.4644, lng: 75.9218, risk: 'medium', score: 58, crimes: 398 },
    { id: 'HBL', name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, risk: 'high', score: 67, crimes: 487 },
    { id: 'MNG', name: 'Mangaluru', lat: 12.9141, lng: 74.8560, risk: 'medium', score: 52, crimes: 312 },
    { id: 'KLB', name: 'Kalaburagi', lat: 17.3297, lng: 76.8343, risk: 'high', score: 73, crimes: 445 },
    { id: 'SHV', name: 'Shivamogga', lat: 13.9299, lng: 75.5681, risk: 'medium', score: 49, crimes: 287 },
    { id: 'TUM', name: 'Tumakuru', lat: 13.3409, lng: 77.1010, risk: 'medium', score: 55, crimes: 334 },
    { id: 'UDR', name: 'Udupi', lat: 13.3409, lng: 74.7421, risk: 'low', score: 28, crimes: 134 },
    { id: 'BGR', name: 'Bengaluru Rural', lat: 13.2122, lng: 77.5772, risk: 'medium', score: 61, crimes: 356 },
    { id: 'VJP', name: 'Vijayapura', lat: 16.8302, lng: 75.7100, risk: 'high', score: 68, crimes: 412 },
  ],

  // ── Crime Categories ──────────────────────────────────
  crimeCategories: [
    { id: 'theft', label: 'Vehicle Theft', count: 1847, color: '#3B82F6', trend: +12.4 },
    { id: 'cyber', label: 'Cybercrime', count: 1234, color: '#22D3EE', trend: +34.7 },
    { id: 'robbery', label: 'Robbery', count: 876, color: '#F59E0B', trend: -3.2 },
    { id: 'assault', label: 'Assault', count: 654, color: '#EF4444', trend: +5.1 },
    { id: 'murder', label: 'Murder', count: 142, color: '#8B5CF6', trend: -8.3 },
    { id: 'fraud', label: 'Financial Fraud', count: 2187, color: '#22C55E', trend: +47.2 },
    { id: 'drugs', label: 'Narcotics', count: 567, color: '#F97316', trend: +18.9 },
    { id: 'missing', label: 'Missing Persons', count: 334, color: '#6366F1', trend: +2.1 },
  ],

  // ── Monthly Crime Trends (2024–2025) ──────────────────
  monthlyTrends: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: {
      total:   [3421, 3187, 3654, 3892, 4123, 3987, 4341, 4512, 4287, 4634, 4891, 5123],
      solved:  [2134, 1987, 2312, 2456, 2678, 2543, 2789, 2934, 2712, 2987, 3123, 3287],
      cyber:   [678,  712,  834,  923,  1045, 987,  1123, 1234, 1187, 1312, 1456, 1567],
      vehicle: [512,  487,  543,  612,  589,  623,  645,  678,  654,  712,  689,  734],
    }
  },

  // ── KPI Stats ─────────────────────────────────────────
  kpis: {
    todayCrimes:     { value: 47, trend: +8.2, label: "Today's Crimes" },
    activeCases:     { value: 1284, trend: -3.1, label: "Active Cases" },
    highRiskDistricts: { value: 5, trend: +1, label: "High Risk Districts" },
    repeatOffenders: { value: 312, trend: +12.4, label: "Repeat Offenders" },
    predictionAccuracy: { value: 91.4, trend: +2.3, label: "AI Accuracy %" },
    aiAlerts:        { value: 23, trend: +5, label: "AI Alerts" },
  },

  // ── Heatmap Points [lat, lng, intensity] ─────────────
  heatmapPoints: [
    // Bengaluru
    [12.9716, 77.5946, 1.0], [12.9352, 77.6245, 0.9], [12.9762, 77.6033, 0.85],
    [12.9611, 77.5842, 0.88], [13.0298, 77.5640, 0.75], [12.9010, 77.5940, 0.82],
    [12.9550, 77.6350, 0.78], [12.9200, 77.5700, 0.71], [13.0100, 77.5450, 0.65],
    [12.9800, 77.6100, 0.80], [12.9450, 77.5800, 0.69], [12.9650, 77.6200, 0.74],
    // Mysuru
    [12.2958, 76.6394, 0.78], [12.3052, 76.6502, 0.71], [12.2801, 76.6280, 0.65],
    // Belagavi
    [15.8497, 74.4977, 0.71], [15.8600, 74.5100, 0.64], [15.8350, 74.4850, 0.59],
    // Kalaburagi
    [17.3297, 76.8343, 0.68], [17.3450, 76.8500, 0.62],
    // Hubballi
    [15.3647, 75.1240, 0.66], [15.3800, 75.1400, 0.59],
    // Vijayapura
    [16.8302, 75.7100, 0.64], [16.8450, 75.7250, 0.58],
    // Davanagere
    [14.4644, 75.9218, 0.55], [14.4800, 75.9400, 0.50],
    // Tumakuru
    [13.3409, 77.1010, 0.52], [13.3550, 77.1150, 0.48],
    // Mangaluru
    [12.9141, 74.8560, 0.50], [12.9000, 74.8400, 0.45],
  ],

  // ── Criminal Network Nodes ────────────────────────────
  networkNodes: [
    { id: 'S001', type: 'suspect', label: 'Ravi Kumar', riskScore: 94, district: 'Bengaluru Urban', crimes: 7 },
    { id: 'S002', type: 'suspect', label: 'Mohammed Rafiq', riskScore: 87, district: 'Mysuru', crimes: 5 },
    { id: 'S003', type: 'suspect', label: 'Suresh Nayak', riskScore: 71, district: 'Belagavi', crimes: 4 },
    { id: 'S004', type: 'suspect', label: 'Priya Menon', riskScore: 63, district: 'Bengaluru Urban', crimes: 3 },
    { id: 'S005', type: 'suspect', label: 'Arjun Sharma', riskScore: 89, district: 'Hubballi', crimes: 6 },
    { id: 'S006', type: 'suspect', label: 'Deepak Reddy', riskScore: 55, district: 'Kalaburagi', crimes: 2 },
    { id: 'L001', type: 'location', label: 'Shivajinagar Bus Stand', district: 'Bengaluru Urban' },
    { id: 'L002', type: 'location', label: 'Mysuru Palace Area', district: 'Mysuru' },
    { id: 'L003', type: 'location', label: 'Tilak Nagar, BLR', district: 'Bengaluru Urban' },
    { id: 'V001', type: 'vehicle', label: 'KA-01-MF-4892 (Honda City)', district: 'Bengaluru Urban' },
    { id: 'V002', type: 'vehicle', label: 'KA-09-HC-1234 (Activa)', district: 'Mysuru' },
    { id: 'P001', type: 'phone', label: '+91-9845XXXXXX', district: 'Bengaluru Urban' },
    { id: 'P002', type: 'phone', label: '+91-9632XXXXXX', district: 'Belagavi' },
    { id: 'I001', type: 'incident', label: 'Bank Robbery CR#4521', district: 'Bengaluru Urban' },
    { id: 'I002', type: 'incident', label: 'Vehicle Theft CR#3876', district: 'Mysuru' },
    { id: 'I003', type: 'incident', label: 'Cyber Fraud CR#6123', district: 'Bengaluru Urban' },
  ],

  networkLinks: [
    { source: 'S001', target: 'S002', strength: 0.9, type: 'associate' },
    { source: 'S001', target: 'S004', strength: 0.7, type: 'associate' },
    { source: 'S002', target: 'S003', strength: 0.8, type: 'associate' },
    { source: 'S005', target: 'S001', strength: 0.6, type: 'associate' },
    { source: 'S003', target: 'S006', strength: 0.5, type: 'associate' },
    { source: 'S001', target: 'L001', strength: 0.9, type: 'location' },
    { source: 'S002', target: 'L002', strength: 0.8, type: 'location' },
    { source: 'S004', target: 'L003', strength: 0.7, type: 'location' },
    { source: 'S001', target: 'V001', strength: 0.85, type: 'vehicle' },
    { source: 'S002', target: 'V002', strength: 0.75, type: 'vehicle' },
    { source: 'S001', target: 'P001', strength: 0.9, type: 'phone' },
    { source: 'S003', target: 'P002', strength: 0.7, type: 'phone' },
    { source: 'S001', target: 'I001', strength: 0.95, type: 'incident' },
    { source: 'S002', target: 'I002', strength: 0.85, type: 'incident' },
    { source: 'S004', target: 'I003', strength: 0.8, type: 'incident' },
    { source: 'S001', target: 'I003', strength: 0.6, type: 'incident' },
    { source: 'L001', target: 'I001', strength: 0.9, type: 'scene' },
    { source: 'V001', target: 'I001', strength: 0.8, type: 'evidence' },
  ],

  // ── Repeat Offenders ─────────────────────────────────
  offenders: [
    {
      id: 'OFF001', name: 'Ravi Kumar M.', age: 34, gender: 'Male',
      district: 'Bengaluru Urban', riskScore: 94, status: 'Wanted',
      crimes: ['Vehicle Theft', 'Robbery', 'Assault'], arrests: 7, lastSeen: '2025-06-28',
      photo: null, associates: 4, crimeHistory: [
        { date: '2025-06-28', crime: 'Vehicle Theft', status: 'Open' },
        { date: '2025-04-12', crime: 'Robbery', status: 'Convicted' },
        { date: '2024-11-03', crime: 'Assault', status: 'Convicted' },
      ]
    },
    {
      id: 'OFF002', name: 'Arjun Sharma P.', age: 29, gender: 'Male',
      district: 'Hubballi', riskScore: 89, status: 'Under Surveillance',
      crimes: ['Narcotics', 'Financial Fraud'], arrests: 5, lastSeen: '2025-06-30',
      photo: null, associates: 6, crimeHistory: [
        { date: '2025-06-30', crime: 'Narcotics Possession', status: 'Open' },
        { date: '2025-02-14', crime: 'Financial Fraud', status: 'Under Trial' },
      ]
    },
    {
      id: 'OFF003', name: 'Mohammed Rafiq S.', age: 41, gender: 'Male',
      district: 'Mysuru', riskScore: 87, status: 'In Custody',
      crimes: ['Robbery', 'Murder Attempt', 'Assault'], arrests: 5, lastSeen: '2025-06-15',
      photo: null, associates: 3, crimeHistory: [
        { date: '2025-06-15', crime: 'Robbery', status: 'Convicted' },
        { date: '2024-09-08', crime: 'Assault', status: 'Convicted' },
      ]
    },
    {
      id: 'OFF004', name: 'Suresh Nayak B.', age: 38, gender: 'Male',
      district: 'Belagavi', riskScore: 71, status: 'Released on Bail',
      crimes: ['Vehicle Theft', 'Fraud'], arrests: 4, lastSeen: '2025-07-01',
      photo: null, associates: 2, crimeHistory: [
        { date: '2025-07-01', crime: 'Vehicle Theft', status: 'Open' },
        { date: '2024-12-20', crime: 'Fraud', status: 'Under Trial' },
      ]
    },
    {
      id: 'OFF005', name: 'Priya Menon K.', age: 27, gender: 'Female',
      district: 'Bengaluru Urban', riskScore: 63, status: 'Under Surveillance',
      crimes: ['Cybercrime', 'Financial Fraud'], arrests: 3, lastSeen: '2025-07-02',
      photo: null, associates: 5, crimeHistory: [
        { date: '2025-07-02', crime: 'Cybercrime', status: 'Open' },
        { date: '2025-03-18', crime: 'Financial Fraud', status: 'Under Trial' },
      ]
    },
    {
      id: 'OFF006', name: 'Deepak Reddy N.', age: 31, gender: 'Male',
      district: 'Kalaburagi', riskScore: 55, status: 'Released on Bail',
      crimes: ['Narcotics'], arrests: 2, lastSeen: '2025-06-25',
      photo: null, associates: 3, crimeHistory: [
        { date: '2025-06-25', crime: 'Narcotics Trafficking', status: 'Under Trial' },
      ]
    },
  ],

  // ── Alerts ────────────────────────────────────────────
  alerts: [
    { id: 'ALT001', severity: 'critical', title: 'Crime Spike Detected — Bengaluru Urban', message: 'Theft incidents up 34% in Shivajinagar area. Immediate patrol deployment recommended.', time: '08:42 AM', category: 'Spike', read: false },
    { id: 'ALT002', severity: 'critical', title: 'New Criminal Network Identified', message: 'AI has identified a new 6-member criminal network operating across BLR, MYS, and HBL districts.', time: '07:15 AM', category: 'Network', read: false },
    { id: 'ALT003', severity: 'high', title: 'Repeat Offender — Active', message: 'Ravi Kumar (OFF001) has been spotted near Majestic Bus Stand. Last conviction: Vehicle Theft.', time: '06:50 AM', category: 'Offender', read: false },
    { id: 'ALT004', severity: 'high', title: 'Cybercrime Anomaly — Bengaluru', message: 'Unusual UPI fraud pattern detected. 23 transactions flagged in last 2 hours totaling ₹47.3L.', time: '05:30 AM', category: 'Cyber', read: true },
    { id: 'ALT005', severity: 'medium', title: 'Prediction Confidence Drop — Belagavi', message: 'Model prediction confidence for Belagavi district dropped from 87% to 71%. Review required.', time: 'Yesterday', category: 'System', read: true },
    { id: 'ALT006', severity: 'medium', title: 'Patrol Deployment Recommended — Mysuru', message: 'AI suggests increased patrol in Palace Area based on weekend crime pattern analysis.', time: 'Yesterday', category: 'Patrol', read: true },
    { id: 'ALT007', severity: 'low', title: 'Weekly Report Ready', message: 'Crime trend analysis for Week 26/2025 is ready for review and distribution.', time: '2 days ago', category: 'Report', read: true },
    { id: 'ALT008', severity: 'low', title: 'New Officer Added', message: 'SI Kavitha Reddy (Badge #3421) has been added to Bengaluru Urban district roster.', time: '2 days ago', category: 'System', read: true },
  ],

  // ── Predictive Data ───────────────────────────────────
  predictions: [
    {
      district: 'Bengaluru Urban', crimeType: 'Vehicle Theft',
      risk: 'critical', confidence: 94, predictedIncrease: '+28%',
      timeframe: 'Next 48 hours', factors: ['Weekend pattern', 'Festival approaching', 'Low patrol density in Shivajinagar'],
      recommendation: 'Deploy 4 additional patrol units to Shivajinagar and Majestic areas. Increase CCTV monitoring.'
    },
    {
      district: 'Mysuru', crimeType: 'Robbery',
      risk: 'high', confidence: 81, predictedIncrease: '+18%',
      timeframe: 'Next 72 hours', factors: ['Tourist influx', 'Previous robbery pattern', 'Low visibility areas'],
      recommendation: 'Increase plainclothes officers near Palace area and Devaraja Market. Alert shop owners.'
    },
    {
      district: 'Hubballi-Dharwad', crimeType: 'Narcotics',
      risk: 'high', confidence: 77, predictedIncrease: '+22%',
      timeframe: 'Next 7 days', factors: ['Known trafficking route active', 'Border proximity', 'Market day patterns'],
      recommendation: 'Set up naka points on NH-67. Coordinate with Belagavi and Dharwad units.'
    },
    {
      district: 'Bengaluru Urban', crimeType: 'Cybercrime',
      risk: 'critical', confidence: 91, predictedIncrease: '+47%',
      timeframe: 'Ongoing', factors: ['UPI fraud surge', 'Phishing campaigns active', 'Elderly targets identified'],
      recommendation: 'Cyber cell to issue public advisory. Monitor flagged mobile numbers and bank accounts.'
    },
    {
      district: 'Kalaburagi', crimeType: 'Assault',
      risk: 'medium', confidence: 63, predictedIncrease: '+11%',
      timeframe: 'Next 5 days', factors: ['Local festival', 'Historical tension zones', 'Alcohol availability'],
      recommendation: 'Increase visible policing near event venues. Establish quick response teams.'
    },
  ],

  // ── AI Insights ───────────────────────────────────────
  aiInsights: [
    { type: 'alert', icon: 'trending-up', title: 'Vehicle Theft Surge', desc: 'Bengaluru Urban showing 34% spike in 2-wheeler thefts near commercial areas', severity: 'critical', time: '2 min ago' },
    { type: 'anomaly', icon: 'zap', title: 'Cybercrime Anomaly', desc: 'UPI fraud pattern detected — 23 fraudulent transactions in 2 hours from same IP cluster', severity: 'critical', time: '8 min ago' },
    { type: 'patrol', icon: 'map-pin', title: 'Patrol Recommendation', desc: 'AI recommends shifting patrol unit P-7 to Shivajinagar based on predictive model', severity: 'high', time: '15 min ago' },
    { type: 'network', icon: 'git-branch', title: 'New Criminal Link', desc: 'OFF001 (Ravi Kumar) linked to new associate in Mysuru via phone record analysis', severity: 'high', time: '32 min ago' },
    { type: 'risk', icon: 'shield-alert', title: 'District Risk Updated', desc: 'Vijayapura risk score elevated from 68 to 74 following border intelligence reports', severity: 'medium', time: '1 hr ago' },
  ],

  // ── Recent Incidents ──────────────────────────────────
  recentIncidents: [
    { id: 'CR-7842', type: 'Vehicle Theft', location: 'Shivajinagar, BLR', time: '08:23 AM', status: 'Active', priority: 'high', officer: 'SI Ramesh K.' },
    { id: 'CR-7841', type: 'Cybercrime', location: 'Koramangala, BLR', time: '07:45 AM', status: 'Active', priority: 'critical', officer: 'SI Priya M.' },
    { id: 'CR-7840', type: 'Robbery', location: 'Devaraja Market, MYS', time: '06:12 AM', status: 'Investigating', priority: 'high', officer: 'SI Kumar R.' },
    { id: 'CR-7839', type: 'Assault', location: 'Belagavi Junction', time: '05:38 AM', status: 'Resolved', priority: 'medium', officer: 'SI Anand B.' },
    { id: 'CR-7838', type: 'Missing Person', location: 'Dharwad District', time: '04:55 AM', status: 'Investigating', priority: 'medium', officer: 'SI Sunita P.' },
    { id: 'CR-7837', type: 'Narcotics', location: 'Kalaburagi Bypass', time: '03:30 AM', status: 'Arrested', priority: 'high', officer: 'SI Vikram S.' },
    { id: 'CR-7836', type: 'Financial Fraud', location: 'Online / Bengaluru', time: '02:15 AM', status: 'Active', priority: 'critical', officer: 'SI Deepa N.' },
  ],

  // ── AI Chat Messages ──────────────────────────────────
  aiChatSuggestions: [
    'Show crime hotspots in Bengaluru for this week',
    'Who are the high-risk repeat offenders in Mysuru?',
    'Predict next 48 hours for Belagavi district',
    'Analyze the criminal network linked to case CR-4521',
    'Generate executive summary for DGP briefing',
    'What is the cybercrime trend for 2025?',
    'Recommend patrol deployment for this weekend',
    'Show all vehicle theft cases in last 30 days',
  ],

  // ── Time of Day Distribution ──────────────────────────
  timeOfDay: {
    labels: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],
    data:   [12, 8, 6, 14, 31, 47, 38, 42, 56, 78, 92, 64]
  },

  // ── Officers ──────────────────────────────────────────
  officers: [
    { badge: '1001', name: 'DCP Sanjay Gupta', rank: 'DCP', district: 'Bengaluru Urban', status: 'On Duty' },
    { badge: '2145', name: 'SP Meena Krishnan', rank: 'SP', district: 'Mysuru', status: 'On Duty' },
    { badge: '3421', name: 'SI Kavitha Reddy', rank: 'SI', district: 'Bengaluru Urban', status: 'On Duty' },
    { badge: '4312', name: 'CI Ramesh Babu', rank: 'CI', district: 'Belagavi', status: 'Off Duty' },
    { badge: '5678', name: 'HC Sunil Kumar', rank: 'HC', district: 'Hubballi', status: 'On Leave' },
  ],

  // ── Patrol Data ───────────────────────────────────────
  patrols: [
    { id: 'P-101', name: 'Eagle 1 (Bengaluru)', lat: 12.9716, lng: 77.5946, status: 'Active Patrol', officer: 'SI Ramesh K.', recommendedLat: 12.9800, recommendedLng: 77.6100, reason: 'Shivajinagar vehicle theft spike', priority: 'critical' },
    { id: 'P-102', name: 'Cheetah 3 (Bengaluru)', lat: 12.9352, lng: 77.6245, status: 'Stationary', officer: 'SI Priya M.', recommendedLat: 12.9550, recommendedLng: 77.6350, reason: 'UPI fraud IP cluster location scan', priority: 'high' },
    { id: 'P-103', name: 'Garuda 2 (Mysuru)', lat: 12.2958, lng: 76.6394, status: 'Active Patrol', officer: 'SI Kumar R.', recommendedLat: 12.3052, recommendedLng: 76.6502, reason: 'Palace Area crowd influx monitoring', priority: 'medium' },
    { id: 'P-104', name: 'Hawk 5 (Belagavi)', lat: 15.8497, lng: 74.4977, status: 'Stationary', officer: 'SI Anand B.', recommendedLat: 15.8600, recommendedLng: 74.5100, reason: 'Naka point deployment near Junction', priority: 'medium' },
    { id: 'P-105', name: 'Tiger 4 (Kalaburagi)', lat: 17.3297, lng: 76.8343, status: 'Stationary', officer: 'SI Vikram S.', recommendedLat: 17.3450, recommendedLng: 76.8500, reason: 'Local festival event safety deployment', priority: 'high' }
  ],
};

// Expose globally
window.KSPData = KSPData;
