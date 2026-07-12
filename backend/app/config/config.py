import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KSP AI Crime Intelligence Backend"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "ksp_secret_key_super_top_secret_9812"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Defaults to SQLite local file, but can be overridden with Postgres URL
    DATABASE_URL: str = "sqlite:///./ksp.db"
    
    # AI Engine Thresholds
    CONFIDENCE_THRESHOLD: float = 0.65
    ALERT_SENSITIVITY: str = "medium"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
