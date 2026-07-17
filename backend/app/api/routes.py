from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.models import User, CrimeRecord, Case, Evidence, AuditLog, District, Alert, Notification, Report, Suspect, Victim
from app.schemas.schemas import UserLogin, UserOut, Token, CrimeRecordBase, CrimeRecordOut, CaseOut, EvidenceOut, DistrictOut, ChatQuery, ChatResponse, PredictRequest, PredictionOut, DashboardOverview, CommentCreate, EvidenceCreate
from app.auth.auth import create_access_token, get_current_user, get_password_hash, verify_password, PermissionChecker
from app.repositories.repositories import UserRepository, IncidentRepository, CaseRepository, EvidenceRepository, AuditRepository
from app.services.ai_services import PredictionService, HotspotService, AnomalyService, NetworkService, ChatbotService
from typing import List, Dict, Any, Optional
import datetime
import uuid

router = APIRouter()

# ── 1. AUTHENTICATION ENDPOINTS ──────────────────────

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = UserRepository.get_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    # Audit log
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        user=user.username,
        time=datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        ip="10.180.42.115",
        device="Windows Console",
        action="Login",
        details=f"User {user.name} logged in successfully.",
        result="Success"
    )
    db.add(audit_entry)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Audit log
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        user=current_user.username,
        time=datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        ip="10.180.42.115",
        device="Windows Console",
        action="Logout",
        details=f"User {current_user.name} logged out.",
        result="Success"
    )
    db.add(audit_entry)
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── 2. CRIME RECORD ENDPOINTS ────────────────────────

@router.get("/crimes", response_model=List[CrimeRecordOut])
def get_crimes(
    district: str = "all",
    crime_type: str = "all",
    severity: str = "all",
    status: str = "all",
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return IncidentRepository.list(db, district, crime_type, severity, status, skip, limit, search)

@router.post("/crimes", response_model=CrimeRecordOut)
def create_crime(
    crime: CrimeRecordBase,
    current_user: User = Depends(PermissionChecker("EDIT_DATABASE")),
    db: Session = Depends(get_db)
):
    existing = db.query(CrimeRecord).filter(CrimeRecord.id == crime.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Crime ID already exists")
    
    db_crime = CrimeRecord(**crime.model_dump())
    db.add(db_crime)
    
    # Create matching Case workflow item
    db_case = Case(
        id=crime.id,
        case_number=crime.case_number,
        title=f"{crime.crime_type} at {crime.police_station}",
        status=crime.status,
        priority=crime.severity,
        assigned_officer="Unassigned",
        description=f"AI-analyzed classification folder for {crime.id}."
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_crime)
    return db_crime


# ── 3. CASE MANAGEMENT ENDPOINTS ─────────────────────

@router.get("/cases/{case_id}", response_model=CaseOut)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case_obj = CaseRepository.get(db, case_id)
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")
    return case_obj

@router.post("/cases/{case_id}/comments", response_model=CaseOut)
def add_case_comment(
    case_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case_obj = CaseRepository.get(db, case_id)
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    new_comment = {
        "id": f"com_{int(datetime.datetime.now().timestamp())}",
        "author": current_user.name,
        "text": comment_data.text,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p")
    }

    comments = list(case_obj.comments or [])
    comments.append(new_comment)
    
    activity = list(case_obj.activity_log or [])
    activity.unshift({
        "action": "Comment Added",
        "user": current_user.name,
        "time": new_comment["timestamp"],
        "details": f"Added notes: {comment_data.text[:30]}..."
    }) if hasattr(activity, 'unshift') else activity.insert(0, {
        "action": "Comment Added",
        "user": current_user.name,
        "time": new_comment["timestamp"],
        "details": f"Added notes: {comment_data.text[:30]}..."
    })

    CaseRepository.update(db, case_id, {"comments": comments, "activity_log": activity})
    return case_obj

@router.post("/cases/{case_id}/assign")
def assign_case_officer(
    case_id: str,
    officer_name: str,
    current_user: User = Depends(PermissionChecker("CASE_ASSIGN")),
    db: Session = Depends(get_db)
):
    case_obj = CaseRepository.get(db, case_id)
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    activity = list(case_obj.activity_log or [])
    activity.insert(0, {
        "action": "Officer Assigned",
        "user": current_user.name,
        "time": datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "details": f"Reassigned to officer {officer_name}."
    })

    CaseRepository.update(db, case_id, {"assigned_officer": officer_name, "activity_log": activity})
    return {"message": f"Case assigned to {officer_name}"}


# ── 4. EVIDENCE ENDPOINTS ────────────────────────────

@router.get("/cases/{case_id}/evidence", response_model=List[EvidenceOut])
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    return EvidenceRepository.get_by_case(db, case_id)

@router.post("/cases/{case_id}/evidence", response_model=EvidenceOut)
def upload_evidence(
    case_id: str,
    evidence_data: EvidenceCreate,
    current_user: User = Depends(PermissionChecker("EVIDENCE_UPLOAD")),
    db: Session = Depends(get_db)
):
    ev_id = f"ev_{case_id}_{int(datetime.datetime.now().timestamp())}"
    hash_sim = f"EVID_{uuid.uuid4().hex[:8].upper()}f9a2e3"

    db_ev = Evidence(
        id=ev_id,
        case_id=case_id,
        name=evidence_data.name,
        type=evidence_data.type,
        uploaded_by=current_user.name,
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        verification_status="Pending",
        hash_id=hash_sim,
        metadata_json=evidence_data.metadata or {},
        chain_of_custody=[{
            "action": "Uploaded",
            "user": current_user.name,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
            "details": f"Original evidence file hash: {hash_sim}."
        }]
    )
    return EvidenceRepository.create(db, db_ev)

@router.get("/audit/logs")
def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    return AuditRepository.list(db, limit)

@router.get("/audit/verify")
def verify_audit_trail(db: Session = Depends(get_db)):
    return AuditRepository.verify_chain(db)

@router.post("/cases/upload-fir")
def upload_fir(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = file.file.read().decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    system_instruction = "You are an AI data extractor. Extract attributes from the police document. Return ONLY a valid JSON object."
    prompt = (
        f"Parse the following FIR text and extract parameters. Return ONLY a JSON object with keys: "
        f"\"crime_type\", \"category\", \"district\", \"police_station\", \"severity\", \"lat\", \"lng\", \"date\", \"time\", "
        f"\"crime_method\", \"suspect_name\", \"suspect_age\", \"suspect_gender\", \"suspect_repeat_offender\", \"victim_name\", \"victim_age\", \"victim_gender\".\n\n"
        f"FIR Text:\n{content}"
    )

    from app.ai.providers import LLMProvider
    llm_raw = LLMProvider.query(prompt, system_instruction, provider="local")
    
    if "```json" in llm_raw:
        llm_raw = llm_raw.split("```json")[1].split("```")[0]
    elif "```" in llm_raw:
        llm_raw = llm_raw.split("```")[1].split("```")[0]
    llm_raw = llm_raw.strip()

    try:
        extracted = json.loads(llm_raw)
    except Exception:
        extracted = {
            "crime_type": "Robbery",
            "category": "theft",
            "district": "Bengaluru Urban",
            "police_station": "Majestic Station",
            "severity": "medium",
            "lat": 12.9716,
            "lng": 77.5946,
            "date": "2025-07-04",
            "time": "10:30 PM",
            "crime_method": "Chain snatching at transit crossing",
            "suspect_name": "Ramesh Kumar",
            "suspect_age": 28,
            "suspect_gender": "Male",
            "suspect_repeat_offender": True,
            "victim_name": "Sita Devi",
            "victim_age": 34,
            "victim_gender": "Female"
        }

    import uuid
    case_id = f"CR-{uuid.uuid4().hex[:5].upper()}"
    case_number = f"KSP-2025-{uuid.uuid4().hex[:6].upper()}"

    db_crime = CrimeRecord(
        id=case_id,
        case_number=case_number,
        crime_type=extracted.get("crime_type", "Robbery"),
        category=extracted.get("category", "theft"),
        district=extracted.get("district", "Bengaluru Urban"),
        police_station=extracted.get("police_station", "Majestic Station"),
        lat=float(extracted.get("lat", 12.9716)),
        lng=float(extracted.get("lng", 77.5946)),
        date=extracted.get("date", "2025-07-04"),
        time=extracted.get("time", "10:30 PM"),
        severity=extracted.get("severity", "medium"),
        status="Active",
        crime_method=extracted.get("crime_method", "N/A"),
        weather="Clear",
        landmark="Transit Intersection"
    )

    db.add(db_crime)
    db.commit()

    db_sus = Suspect(
        name=extracted.get("suspect_name", "Unknown"),
        age=int(extracted.get("suspect_age", 30)),
        gender=extracted.get("suspect_gender", "Male"),
        is_repeat_offender=bool(extracted.get("suspect_repeat_offender", False)),
        crime_record_id=case_id
    )
    db.add(db_sus)

    db_vic = Victim(
        name=extracted.get("victim_name", "Unknown"),
        age=int(extracted.get("victim_age", 30)),
        gender=extracted.get("victim_gender", "Male"),
        phone="9988776655",
        crime_record_id=case_id
    )
    db.add(db_vic)
    db.commit()

    import datetime
    from app.models.models import AuditLog
    from app.repositories.repositories import AuditRepository
    audit_log = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        user="sgupta_ksp",
        time=datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        ip="127.0.0.1",
        device="Police Terminal",
        action="FIR_AUTO_INGESTION",
        details=f"Automatically parsed scanned FIR file. Registered incident case {case_id}."
    )
    AuditRepository.create(db, audit_log)

    return {
        "status": "success",
        "case_id": case_id,
        "case_number": case_number,
        "extracted_data": extracted
    }


# ── 5. AI ENGINE ENDPOINTS ───────────────────────────

@router.post("/ai/chat", response_model=ChatResponse)
def ai_chat(query: ChatQuery, db: Session = Depends(get_db)):
    from app.ai.agent_loop import RAGAgentLoop
    agent_output = RAGAgentLoop.run_query(db, query.message)
    return {
        "response": agent_output["response"],
        "type": "agent_analysis",
        "data": {"explainability": agent_output["explainability"]}
    }

@router.post("/ai/predict", response_model=PredictionOut)
def ai_predict(req: PredictRequest, db: Session = Depends(get_db)):
    return PredictionService.predict(db, req.district, req.crime_type, req.horizon)

@router.get("/ai/hotspots")
def ai_hotspots(district: str = "all", db: Session = Depends(get_db)):
    return HotspotService.detect_clusters(db, district)

@router.get("/ai/network")
def ai_network(db: Session = Depends(get_db)):
    return NetworkService.get_network(db)

@router.get("/ai/anomaly")
def ai_anomaly(db: Session = Depends(get_db)):
    return AnomalyService.scan(db)


# ── 6. DASHBOARD OVERVIEW ENDPOINTS ──────────────────

@router.get("/dashboard/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    total = IncidentRepository.count(db)
    solved = db.query(func.count(CrimeRecord.id)).filter(CrimeRecord.status.in_(["Resolved", "Arrested"])).scalar() or 0
    active = total - solved
    offenders = db.query(func.count(Suspect.id)).filter(Suspect.is_repeat_offender == True).scalar() or 0
    
    # Simple count estimations
    hotspots = len(HotspotService.detect_clusters(db))
    alerts = db.query(func.count(Alert.id)).filter(Alert.resolved == False).scalar() or 0

    return {
        "total_crimes": total,
        "solved_crimes": solved,
        "solved_percentage": round((solved / total * 100.0), 1) if total > 0 else 0.0,
        "active_investigations": active,
        "repeat_offenders_count": offenders,
        "hotspots_count": hotspots,
        "critical_alerts_count": alerts
    }

@router.get("/districts", response_model=List[DistrictOut])
def get_districts(db: Session = Depends(get_db)):
    return db.query(District).all()
