# app/core/config.py
import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "AI-Powered Merchant Onboarding"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    
    # Google Cloud settings
    PROJECT_ID: str = "zippy-pad-473008-v0"
    PROJECT_NUMBER: str = "943373916171"
    REGION: str = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: str = "./service-account-key.json"
    
    # Database settings
    DATABASE_URL: str = "postgresql://merchant_user:MerchantHack2024!@#@db:5432/merchant_db"
    
    # Storage settings
    STORAGE_BUCKET: str = "zippy-pad-473008-v0-merchant-docs"
    
    # AI Services settings
    DOCUMENT_AI_PROCESSOR_ID: str = "452734bdc979b2a5"
    DOCUMENT_AI_LOCATION: str = "us"
    
    # Security
    SECRET_KEY: str = "merchant-onboarding-secret-key-2024"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Development
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    
    # Upload settings
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",       
        "http://127.0.0.1:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8080",
        "https://zippy-pad-473008-v0.web.app",
        "https://zippy-pad-473008-v0.firebaseapp.com"
    ]
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra environment variables

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()