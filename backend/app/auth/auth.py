from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config.config import settings
from app.database.connection import get_db
from app.models.models import User
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # Fallback default user for easy hackathon demonstration if no bearer token
        default_user = db.query(User).filter(User.username == "sgupta_ksp").first()
        if default_user:
            return default_user
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        # Super Admin has all access
        if current_user.role == "Super Administrator":
            return current_user

        # Simple role mapping check matching Phase 5 auth.js logic
        ROLE_PERMISSIONS = {
            'State Police Commissioner': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
                'VIEW_NETWORK', 'VIEW_OFFENDERS', 'VIEW_PREDICTION', 'VIEW_PATROL',
                'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS', 'DISMISS_ALERTS',
                'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW', 'VIEW_SYSTEM_HEALTH'
            ],
            'SCRB Officer': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
                'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS',
                'CASE_CREATE', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW'
            ],
            'District SP': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
                'VIEW_PREDICTION', 'VIEW_PATROL', 'VIEW_REPORTS', 'EXPORT_REPORTS',
                'VIEW_ALERTS', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_VIEW'
            ],
            'Circle Inspector': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
                'VIEW_PREDICTION', 'VIEW_PATROL', 'VIEW_ALERTS',
                'CASE_CREATE', 'CASE_UPDATE', 'CASE_ASSIGN', 'EVIDENCE_UPLOAD', 'EVIDENCE_VIEW'
            ],
            'Investigation Officer': [
                'VIEW_DASHBOARD', 'VIEW_MAP', 'VIEW_ALERTS',
                'CASE_UPDATE', 'EVIDENCE_UPLOAD', 'EVIDENCE_VIEW'
            ],
            'Intelligence Analyst': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP', 'VIEW_TIMELINE',
                'VIEW_NETWORK', 'VIEW_OFFENDERS', 'VIEW_PREDICTION',
                'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ALERTS'
            ],
            'Crime Analyst': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
                'VIEW_PREDICTION', 'VIEW_REPORTS', 'EXPORT_REPORTS'
            ],
            'Read Only Auditor': [
                'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_MAP',
                'VIEW_REPORTS', 'EVIDENCE_VIEW'
            ]
        }

        user_perms = ROLE_PERMISSIONS.get(current_user.role, [])
        if self.required_permission not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Requires {self.required_permission} permission."
            )
        return current_user
