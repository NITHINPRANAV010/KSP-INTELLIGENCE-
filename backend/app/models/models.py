from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(100), nullable=False)
    badge = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="Read Only Auditor")
    district = Column(String(100), nullable=True)
    active = Column(Boolean, default=True)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(250))
    permissions = Column(JSON) # List of permission string codes

class CrimeRecord(Base):
    __tablename__ = "crime_records"
    id = Column(String(50), primary_key=True, index=True) # e.g. CR-00001
    case_number = Column(String(50), unique=True, index=True)
    crime_type = Column(String(100), index=True, nullable=False)
    category = Column(String(100), index=True)
    district = Column(String(100), index=True, nullable=False)
    police_station = Column(String(100), index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    date = Column(String(20), index=True, nullable=False)
    time = Column(String(20), nullable=False)
    severity = Column(String(50), default="medium")
    status = Column(String(50), default="Active")
    
    weather = Column(String(50))
    landmark = Column(String(100))
    vehicle_info = Column(String(200))
    phone_number = Column(String(50))
    known_associates = Column(String(200))
    crime_method = Column(String(300))
    unemployment_rate = Column(Float)
    literacy_rate = Column(Float)
    population_density = Column(String(50))

    # Relationships
    suspect = relationship("Suspect", back_populates="crime_record", uselist=False, cascade="all, delete-orphan")
    victim = relationship("Victim", back_populates="crime_record", uselist=False, cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"
    id = Column(String(50), primary_key=True, index=True) # matches crime record ID or unique case key
    case_number = Column(String(50), index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(50), default="New")
    priority = Column(String(50), default="medium")
    assigned_officer = Column(String(100), default="Unassigned")
    description = Column(Text)
    comments = Column(JSON, default=list) # List of comments {author, text, timestamp}
    attachments = Column(JSON, default=list) # List of files {name, type, path}
    activity_log = Column(JSON, default=list) # List of updates {action, user, time, details}

class Suspect(Base):
    __tablename__ = "suspects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    age = Column(Integer)
    gender = Column(String(20))
    is_repeat_offender = Column(Boolean, default=False)
    crime_record_id = Column(String(50), ForeignKey("crime_records.id"), unique=True)
    
    crime_record = relationship("CrimeRecord", back_populates="suspect")

class Victim(Base):
    __tablename__ = "victims"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    age = Column(Integer)
    gender = Column(String(20))
    phone = Column(String(50))
    crime_record_id = Column(String(50), ForeignKey("crime_records.id"), unique=True)
    
    crime_record = relationship("CrimeRecord", back_populates="victim")

class Officer(Base):
    __tablename__ = "officers"
    badge = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rank = Column(String(50))
    district = Column(String(100))
    status = Column(String(50), default="On Duty")

class PoliceStation(Base):
    __tablename__ = "police_stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    district = Column(String(100), nullable=False)

class District(Base):
    __tablename__ = "districts"
    id = Column(String(50), primary_key=True) # e.g. BLR
    name = Column(String(100), unique=True, nullable=False)
    lat = Column(Float)
    lng = Column(Float)
    risk_score = Column(Integer, default=50)
    threat_level = Column(String(50), default="medium")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(String(100), primary_key=True, index=True)
    case_id = Column(String(50), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # CCTV, Fingerprint, PDF, Document
    uploaded_by = Column(String(100))
    timestamp = Column(String(50))
    verification_status = Column(String(50), default="Pending")
    hash_id = Column(String(100), nullable=False)
    metadata_json = Column(JSON, default=dict)
    chain_of_custody = Column(JSON, default=list) # List of actions {action, user, timestamp, details}

class Report(Base):
    __tablename__ = "reports"
    id = Column(String(50), primary_key=True, index=True) # e.g. REP-1234
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # executive, district, trend
    generated_by = Column(String(100))
    content_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), index=True)
    crime_type = Column(String(100), index=True)
    horizon = Column(String(20)) # tomorrow, week, month
    predicted_count = Column(Integer)
    probability = Column(Float)
    confidence = Column(Float)
    risk_level = Column(String(50))
    trend_direction = Column(String(50))
    trend_pct = Column(Float)
    factors = Column(JSON)
    recommendations = Column(JSON)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(100), primary_key=True)
    type = Column(String(50), index=True) # Spike, Anomaly
    severity = Column(String(50)) # critical, high
    description = Column(Text)
    timestamp = Column(String(50))
    resolved = Column(Boolean, default=False)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(100), primary_key=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50))
    priority = Column(String(50))
    read = Column(Boolean, default=False)
    timestamp = Column(String(50))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(100), primary_key=True)
    user = Column(String(100), index=True)
    time = Column(String(50))
    ip = Column(String(50))
    device = Column(String(100))
    action = Column(String(100), index=True)
    details = Column(Text)
    result = Column(String(50), default="Success")
