from sqlalchemy.orm import Session
from app.models.models import User, CrimeRecord, Case, Suspect, Victim, Officer, PoliceStation, District, Evidence, AuditLog, Prediction, Alert, Notification
from app.auth.auth import get_password_hash
import random
import datetime

# Seed arrays matching db.js templates
CRIME_TEMPLATES = [
    {"type": "Vehicle Theft", "category": "theft", "severity": "medium"},
    {"type": "Cybercrime", "category": "cyber", "severity": "high"},
    {"type": "Robbery", "category": "robbery", "severity": "high"},
    {"type": "Assault", "category": "violent", "severity": "medium"},
    {"type": "Narcotics", "category": "narcotics", "severity": "critical"},
    {"type": "Financial Fraud", "category": "fraud", "severity": "high"},
    {"type": "Murder", "category": "homicide", "severity": "critical"},
    {"type": "Missing Persons", "category": "missing", "severity": "low"}
]

DISTRICTS = [
    {"id": "BLR", "name": "Bengaluru Urban", "lat": 12.9716, "lng": 77.5946, "score": 92, "risk": "critical"},
    {"id": "MYS", "name": "Mysuru", "lat": 12.2958, "lng": 76.6394, "score": 78, "risk": "high"},
    {"id": "BLG", "name": "Belagavi", "lat": 15.8497, "lng": 74.4977, "score": 64, "risk": "medium"},
    {"id": "KLB", "name": "Kalaburagi", "lat": 17.3297, "lng": 76.8347, "score": 71, "risk": "high"},
    {"id": "HBL", "name": "Hubballi-Dharwad", "lat": 15.3647, "lng": 75.1240, "score": 58, "risk": "medium"},
    {"id": "DVG", "name": "Davanagere", "lat": 14.4644, "lng": 75.9218, "score": 45, "risk": "medium"},
    {"id": "TMK", "name": "Tumakuru", "lat": 13.3379, "lng": 77.1173, "score": 42, "risk": "low"},
    {"id": "MNG", "name": "Mangaluru", "lat": 12.9141, "lng": 74.8560, "score": 69, "risk": "high"},
    {"id": "VJP", "name": "Vijayapura", "lat": 16.8302, "lng": 75.7100, "score": 52, "risk": "medium"},
    {"id": "BLR_R", "name": "Ballari", "lat": 15.1394, "lng": 76.9214, "score": 61, "risk": "medium"}
]

POLICE_STATIONS = {
    "Bengaluru Urban": ["Majestic", "Indiranagar", "Koramangala", "Whitefield", "Jayanagar"],
    "Mysuru": ["Lashkar", "Devaraja", "Vidyaranyapuram", "K R Mohalla"],
    "Belagavi": ["Khade Bazar", "Camp", "Shahapur", "Udyambag"],
    "Kalaburagi": ["Chowk", "Raghavendra Nagar", "Station Bazar"],
    "Hubballi-Dharwad": ["Gokul Road", "Town Station", "Suburban Police Station"]
}

FIRST_NAMES = ["Ravi", "Amit", "Sanjay", "Vijay", "Prakash", "Anand", "Deepak", "Sunil", "Rajesh", "Karan"]
LAST_NAMES = ["Kumar", "Sharma", "Gupta", "Patil", "Gowda", "Joshi", "Shetty", "Reddy", "Naik", "Singh"]

OFFICER_ROSTER = [
    {"badge": "DCP-9812", "name": "DCP Sanjay Gupta", "rank": "DCP", "district": "Bengaluru Urban"},
    {"badge": "SP-4512", "name": "SP Ranjitha D.", "rank": "SP", "district": "Mysuru"},
    {"badge": "CI-8802", "name": "CI Anand Kumar", "rank": "CI", "district": "Bengaluru Urban"},
    {"badge": "SI-1204", "name": "SI Vikram Setty", "rank": "SI", "district": "Kalaburagi"},
    {"badge": "HC-5501", "name": "HC Pradeep N.", "rank": "HC", "district": "Belagavi"}
]

CORE_OFFENDERS = [
    {"id": "OFF001", "name": "Ravi Kumar M.", "gender": "Male", "age": 34, "district": "Bengaluru Urban"},
    {"id": "OFF002", "name": "Syed Ibrahim", "gender": "Male", "age": 29, "district": "Bengaluru Urban"},
    {"id": "OFF003", "name": "Manjunath Gowda", "gender": "Male", "age": 41, "district": "Mysuru"}
]

EVIDENCE_POOL = ["Fingerprint Lift Report", "CCTV Footage Log", "Witness Audio Record", "Call Detail Record (CDR)"]

def seed_db(db: Session):
    # Check if already seeded
    if db.query(User).first() is not None:
        print("Database already contains data. Skipping seeder.")
        return

    print("Seeding database with default users...")
    # 1. Seed default user roles
    admin_user = User(
        username="sgupta_ksp",
        password_hash=get_password_hash("ksp_admin_pass"),
        name="Sanjay Gupta",
        badge="DCP-9812",
        role="Super Administrator",
        district="Bengaluru Urban"
    )
    db.add(admin_user)
    
    # Other role users
    commissioner = User(
        username="commissioner_ksp",
        password_hash=get_password_hash("ksp_comm_pass"),
        name="Commissioner Alok Kumar",
        badge="IPS-2004",
        role="State Police Commissioner",
        district="All Karnataka"
    )
    db.add(commissioner)
    db.commit()

    # 2. Seed Officers
    print("Seeding officers...")
    for o in OFFICER_ROSTER:
        officer = Officer(badge=o["badge"], name=o["name"], rank=o["rank"], district=o["district"])
        db.add(officer)

    # 3. Seed Districts
    print("Seeding districts...")
    for d in DISTRICTS:
        dist = District(id=d["id"], name=d["name"], lat=d["lat"], lng=d["lng"], risk_score=d["score"], threat_level=d["risk"])
        db.add(dist)
        
    db.commit()

    # 4. Generate 10,250 incidents deterministically
    print("Generating 10,250 deterministic crime records...")
    
    # Set seed for deterministic generation
    rng = random.Random(42)
    
    start_date = datetime.date(2024, 1, 1)
    
    records_bulk = []
    cases_bulk = []
    
    for i in range(1, 10251):
        c_tmpl = rng.choice(CRIME_TEMPLATES)
        dist_meta = rng.choice(DISTRICTS)
        
        district_name = dist_meta["name"]
        stations = POLICE_STATIONS.get(district_name, ["Central Precinct", "Rural Precinct"])
        station = rng.choice(stations)
        
        # Calculate lat/lng in proximity to district center
        lat = dist_meta["lat"] + (rng.random() - 0.5) * 0.08
        lng = dist_meta["lng"] + (rng.random() - 0.5) * 0.08
        
        days_offset = rng.randint(0, 545) # 1.5 year span
        inc_date = start_date + datetime.timedelta(days=days_offset)
        date_str = inc_date.strftime("%Y-%m-%d")
        
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        time_str = f"{hour:02d}:{minute:02d}"

        # Assign victim
        v_first = rng.choice(FIRST_NAMES)
        v_last = rng.choice(LAST_NAMES)
        v_age = rng.randint(18, 70)
        v_gender = rng.choice(["Male", "Female"])
        v_phone = f"+91-9{rng.randint(100000000, 999999999)}"

        # Suspect details
        repeat_flag = rng.random() < 0.15
        suspect_id = None
        if repeat_flag:
            core_ref = rng.choice(CORE_OFFENDERS)
            suspect_name = core_ref["name"]
            suspect_id = core_ref["id"]
        else:
            s_first = rng.choice(FIRST_NAMES)
            s_last = rng.choice(LAST_NAMES)
            suspect_name = f"{s_first} {s_last}" if rng.random() > 0.3 else "Unknown"

        # Evidence count
        ev_count = rng.randint(2, 4)
        evidence = rng.sample(EVIDENCE_POOL, min(ev_count, len(EVIDENCE_POOL)))

        status = rng.choice(["Active", "Investigating", "Resolved", "Arrested"])
        if days_offset > 300 and status == "Active":
            status = "Resolved" if rng.random() > 0.4 else "Arrested"

        officer = rng.choice(OFFICER_ROSTER)

        # Vehicle Info
        vehicle = "N/A"
        if c_tmpl["category"] in ["theft", "robbery"] or rng.random() < 0.2:
            plate = f"KA-0{rng.randint(1,9)}-EM-{rng.randint(1000,9999)}"
            vehicle = f"{plate} (Honda City)"

        rec_id = f"CR-{i:05d}"
        case_num = f"KSP-2024-{i:05d}"

        rec = CrimeRecord(
            id=rec_id,
            case_number=case_num,
            crime_type=c_tmpl["type"],
            category=c_tmpl["category"],
            district=district_name,
            police_station=station,
            lat=lat,
            lng=lng,
            date=date_str,
            time=time_str,
            severity=c_tmpl["severity"],
            status=status,
            weather="Clear",
            landmark="Bypass Intersection",
            vehicle_info=vehicle,
            phone_number=f"+91-8{rng.randint(100000000, 999999999)}",
            known_associates="Linked in Registry" if repeat_flag else "None Identified",
            crime_method="Modus operandi logged by investigator.",
            unemployment_rate=round(4.0 + rng.random() * 10, 1),
            literacy_rate=round(65.0 + rng.random() * 25, 1),
            population_density="High Density" if rng.random() > 0.4 else "Low Density"
        )
        records_bulk.append(rec)

        # Create linked Case
        case_obj = Case(
            id=rec_id,
            case_number=case_num,
            title=f"{c_tmpl['type']} at {station}",
            status=status,
            priority=c_tmpl["severity"],
            assigned_officer=officer["name"],
            description=f"Automated ingestion tracking for crime ID {rec_id}.",
            comments=[{"author": "AI Intel System", "text": "Case initialized procedurally.", "timestamp": f"{date_str} 10:00 AM"}],
            attachments=[],
            activity_log=[{"action": "Case Created", "user": "System Generator", "time": f"{date_str} 10:00 AM", "details": "Incident ingested."}]
        )
        cases_bulk.append(case_obj)

    print("Bulk saving Crime Records...")
    db.bulk_save_objects(records_bulk)
    print("Bulk saving Case Details...")
    db.bulk_save_objects(cases_bulk)
    db.commit()

    # Link Suspects & Victims for first 1,000 cases to prevent DB constraints explosion
    print("Linking suspects and victims for first 1,000 cases...")
    for index in range(1000):
        c_rec = records_bulk[index]
        susp = Suspect(
            name="Ravi Kumar M." if c_rec.known_associates == "Linked in Registry" else f"Suspect-{index}",
            age=rng.randint(22, 50),
            gender="Male",
            is_repeat_offender=(c_rec.known_associates == "Linked in Registry"),
            crime_record_id=c_rec.id
        )
        db.add(susp)

        vict = Victim(
            name=f"Victim-{index}",
            age=rng.randint(18, 65),
            gender=rng.choice(["Male", "Female"]),
            phone=f"+91-900000{index:04d}",
            crime_record_id=c_rec.id
        )
        db.add(vict)

    # Seed initial predictions
    print("Generating statistical predictions...")
    for d in DISTRICTS:
        for t in CRIME_TEMPLATES:
            # Tomorrow prediction
            pred = Prediction(
                district=d["name"],
                crime_type=t["type"],
                horizon="week",
                predicted_count=rng.randint(5, 25),
                probability=round(0.60 + rng.random() * 0.35, 2),
                confidence=round(0.70 + rng.random() * 0.25, 2),
                risk_level=rng.choice(["LOW", "MEDIUM", "HIGH"]),
                trend_direction="INCREASING" if rng.random() > 0.5 else "DECREASING",
                trend_pct=round(rng.random() * 20, 1),
                factors=[f"Recent {t['type']} volume is elevated by {rng.randint(5,15)}%"],
                recommendations=[{"action": "Deploy additional units", "priority": "high", "reason": "Predicted crime surge"}]
            )
            db.add(pred)

    # Seed system notifications & alerts
    print("Generating default alerts...")
    db.add(Alert(
        id="ALERT_001",
        type="Spike",
        severity="critical",
        description="Vehicle theft surge in Majestic area exceeds standard baseline.",
        timestamp="10:00 AM",
        resolved=False
    ))
    db.add(Notification(
        id="NOTIF_001",
        title="Critical Anomaly Detected",
        message="Vehicle theft spike in Majestic precinct exceeds 2.5σ baseline threshold.",
        category="anomaly",
        priority="critical",
        read=False,
        timestamp="10:00 AM"
    ))

    db.commit()
    print("Seeding complete. procedured 10,250 records successfully.")
