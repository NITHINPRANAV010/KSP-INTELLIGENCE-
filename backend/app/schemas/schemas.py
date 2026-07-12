from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    username: str
    name: str
    badge: Optional[str] = None
    role: str
    district: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True

# Victim & Suspect Schemas
class VictimSchema(BaseModel):
    name: str
    age: int
    gender: str
    phone: str

    class Config:
        from_attributes = True

class SuspectSchema(BaseModel):
    name: str
    age: int
    gender: str
    is_repeat_offender: bool

    class Config:
        from_attributes = True

# Crime Record Schemas
class CrimeRecordBase(BaseModel):
    id: str
    case_number: str
    crime_type: str
    category: str
    district: str
    police_station: str
    lat: float
    lng: float
    date: str
    time: str
    severity: str
    status: str
    weather: Optional[str] = None
    landmark: Optional[str] = None
    vehicle_info: Optional[str] = None
    phone_number: Optional[str] = None
    known_associates: Optional[str] = None
    crime_method: Optional[str] = None
    unemployment_rate: Optional[float] = None
    literacy_rate: Optional[float] = None
    population_density: Optional[str] = None

class CrimeRecordOut(CrimeRecordBase):
    suspect: Optional[SuspectSchema] = None
    victim: Optional[VictimSchema] = None

    class Config:
        from_attributes = True

# Case Schemas
class CommentCreate(BaseModel):
    text: str

class CaseComment(BaseModel):
    id: str
    author: str
    text: str
    timestamp: str

class CaseActivity(BaseModel):
    action: str
    user: str
    time: str
    details: str

class CaseOut(BaseModel):
    id: str
    case_number: str
    title: str
    status: str
    priority: str
    assigned_officer: str
    description: str
    comments: List[Dict[str, Any]] = []
    attachments: List[Dict[str, Any]] = []
    activity_log: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# Evidence Schemas
class EvidenceCreate(BaseModel):
    name: str
    type: str
    metadata: Optional[Dict[str, Any]] = None

class EvidenceOut(BaseModel):
    id: str
    case_id: str
    name: str
    type: str
    uploaded_by: str
    timestamp: str
    verification_status: str
    hash_id: str
    metadata_json: Dict[str, Any]
    chain_of_custody: List[Dict[str, Any]]

    class Config:
        from_attributes = True

# District Schemas
class DistrictOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    risk_score: int
    threat_level: str

    class Config:
        from_attributes = True

# AI Schemas
class ChatQuery(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    type: str = "text"
    data: Optional[Dict[str, Any]] = None

class PredictRequest(BaseModel):
    district: str = "all"
    crime_type: str = "all"
    horizon: str = "week"

class PredictionOut(BaseModel):
    type: str = "prediction"
    district: str
    crime_type: str
    horizon: str
    horizon_label: str
    predicted_count: int
    probability: float
    confidence: float
    risk_level: str
    trend_direction: str
    trend_pct: float
    factors: List[str]
    recommendations: List[Dict[str, Any]]

# Dashboard Schemas
class DashboardOverview(BaseModel):
    total_crimes: int
    solved_crimes: int
    solved_percentage: float
    active_investigations: int
    repeat_offenders_count: int
    hotspots_count: int
    critical_alerts_count: int
