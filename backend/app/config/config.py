import os
from pydantic_settings import BaseSettings
from typing import Optional

_db_default_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ksp.db')).replace('\\', '/')

class Settings(BaseSettings):
    PROJECT_NAME: str = "KSP AI Crime Intelligence Backend"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "ksp_secret_key_super_top_secret_9812"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Defaults to SQLite local file in backend directory, but can be overridden with Postgres URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_db_default_path}")
    
    # AI Engine Thresholds
    CONFIDENCE_THRESHOLD: float = 0.65
    ALERT_SENSITIVITY: str = "medium"

    # OpenRouter / Ling-3.0-tiny
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "inclusionai/ling-3.0-tiny:free"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
