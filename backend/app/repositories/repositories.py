from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import User, CrimeRecord, Case, Evidence, AuditLog, District, Suspect, Notification, Alert
from typing import List, Dict, Any, Optional

class UserRepository:
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create(db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

class IncidentRepository:
    @staticmethod
    def get(db: Session, incident_id: str) -> Optional[CrimeRecord]:
        return db.query(CrimeRecord).filter(CrimeRecord.id == incident_id).first()

    @staticmethod
    def list(db: Session, 
             district: str = "all", 
             crime_type: str = "all", 
             severity: str = "all", 
             status: str = "all", 
             skip: int = 0, 
             limit: int = 100, 
             search_query: str = None) -> List[CrimeRecord]:
        
        q = db.query(CrimeRecord)
        
        if district != "all":
            q = q.filter(CrimeRecord.district == district)
        if crime_type != "all":
            # matches either type or category
            q = q.filter((CrimeRecord.crime_type == crime_type) | (CrimeRecord.category == crime_type))
        if severity != "all":
            q = q.filter(CrimeRecord.severity == severity)
        if status != "all":
            q = q.filter(CrimeRecord.status == status)
            
        if search_query:
            sq = f"%{search_query.lower()}%"
            q = q.filter(
                (func.lower(CrimeRecord.id).like(sq)) |
                (func.lower(CrimeRecord.case_number).like(sq)) |
                (func.lower(CrimeRecord.crime_type).like(sq)) |
                (func.lower(CrimeRecord.police_station).like(sq)) |
                (func.lower(CrimeRecord.vehicle_info).like(sq))
            )
            
        return q.offset(skip).limit(limit).all()

    @staticmethod
    def count(db: Session, district: str = "all", crime_type: str = "all") -> int:
        q = db.query(func.count(CrimeRecord.id))
        if district != "all":
            q = q.filter(CrimeRecord.district == district)
        if crime_type != "all":
            q = q.filter((CrimeRecord.crime_type == crime_type) | (CrimeRecord.category == crime_type))
        return q.scalar() or 0

class CaseRepository:
    @staticmethod
    def get(db: Session, case_id: str) -> Optional[Case]:
        return db.query(Case).filter(Case.id == case_id).first()

    @staticmethod
    def create(db: Session, case_obj: Case) -> Case:
        db.add(case_obj)
        db.commit()
        db.refresh(case_obj)
        return case_obj

    @staticmethod
    def update(db: Session, case_id: str, fields: Dict[str, Any]) -> Optional[Case]:
        c = db.query(Case).filter(Case.id == case_id).first()
        if c:
            for k, v in fields.items():
                setattr(c, k, v)
            db.commit()
            db.refresh(c)
        return c

class EvidenceRepository:
    @staticmethod
    def get(db: Session, evidence_id: str) -> Optional[Evidence]:
        return db.query(Evidence).filter(Evidence.id == evidence_id).first()

    @staticmethod
    def get_by_case(db: Session, case_id: str) -> List[Evidence]:
        return db.query(Evidence).filter(Evidence.case_id == case_id).all()

    @staticmethod
    def create(db: Session, ev: Evidence) -> Evidence:
        db.add(ev)
        db.commit()
        db.refresh(ev)
        return ev

class AuditRepository:
    @staticmethod
    def create(db: Session, log: AuditLog) -> AuditLog:
        import hashlib
        # Get last audit log to read its hash
        last_log = db.query(AuditLog).order_by(AuditLog.time.desc()).first()
        prev_hash = "GENESIS_HASH"
        if last_log and "[HashChain=" in last_log.details:
            try:
                parts = last_log.details.split("[HashChain=")
                if len(parts) > 1:
                    prev_hash = parts[1].split(",")[0]
            except Exception:
                pass

        current_hash = hashlib.sha256(f"{log.user}|{log.action}|{log.details}|{prev_hash}".encode('utf-8')).hexdigest()
        log.details = f"{log.details} [HashChain={current_hash}, PrevHash={prev_hash}]"

        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def list(db: Session, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).order_by(AuditLog.time.desc()).limit(limit).all()

    @staticmethod
    def verify_chain(db: Session) -> dict:
        import hashlib
        logs = db.query(AuditLog).order_by(AuditLog.time.asc()).all()
        prev_hash = "GENESIS_HASH"
        breached = False
        breach_index = -1
        
        for idx, log in enumerate(logs):
            if "[HashChain=" not in log.details:
                continue
            try:
                parts = log.details.split(" [HashChain=")
                original_details = parts[0]
                hash_info = parts[1].replace("]", "")
                current_hash_extracted = hash_info.split(",")[0]
                prev_hash_extracted = hash_info.split("PrevHash=")[1]
                
                if prev_hash_extracted != prev_hash:
                    breached = True
                    breach_index = idx
                    break
                    
                recalculated = hashlib.sha256(f"{log.user}|{log.action}|{original_details}|{prev_hash}".encode('utf-8')).hexdigest()
                if recalculated != current_hash_extracted:
                    breached = True
                    breach_index = idx
                    break
                    
                prev_hash = current_hash_extracted
            except Exception:
                breached = True
                breach_index = idx
                break
                
        if breached:
            return {"status": "BREACHED", "tampered_log_index": breach_index, "message": "Audit chain verification failed. Logs have been modified."}
        return {"status": "SECURE", "verified_count": len(logs), "message": "Audit log chain verified successfully. Cryptographically intact."}
