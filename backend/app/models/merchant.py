# app/models/merchant.py
from sqlalchemy import Column, String, DateTime, Float, Boolean, Text, JSON, Integer
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from ..database import Base

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(50), nullable=False)  # LLC, Corp, Partnership
    industry = Column(String(100), nullable=False)
    owner_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    
    # Address
    street_address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True, default="US")
    
    # Financial
    ein = Column(String(20), nullable=True)
    monthly_volume = Column(Integer, nullable=True)
    annual_revenue = Column(Integer, nullable=True)
    
    # Risk Assessment
    risk_level = Column(String(20), nullable=True)  # Low, Medium, High
    risk_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, processing, approved, rejected, review
    kyc_status = Column(String(50), default="pending")
    aml_status = Column(String(50), default="pending")
    document_status = Column(String(50), default="pending")
    
    # Processing results
    ai_processing_results = Column(JSON, nullable=True)
    external_verification_results = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, nullable=False)
    document_type = Column(String(100), nullable=False)  # business_license, ein_letter, drivers_license, etc.
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Multi-modal AI Results
    document_ai_results = Column(JSON, nullable=True)
    vision_ai_results = Column(JSON, nullable=True)
    nlp_results = Column(JSON, nullable=True)
    fusion_results = Column(JSON, nullable=True)
    
    # Confidence scores
    document_ai_confidence = Column(Float, nullable=True)
    vision_ai_confidence = Column(Float, nullable=True)
    fusion_confidence = Column(Float, nullable=True)
    
    # Verification status
    is_authentic = Column(Boolean, nullable=True)
    quality_score = Column(Float, nullable=True)
    processing_status = Column(String(50), default="uploaded")  # uploaded, processing, completed, failed
    verification_status = Column(String(50), default="pending")  # pending, verified, failed
    
    # External verification
    external_verification_results = Column(JSON, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, nullable=False)
    document_id = Column(String, nullable=True)
    stage = Column(String(100), nullable=False)  # upload, document_ai, vision_ai, fusion, risk_assessment, decision
    status = Column(String(50), nullable=False)  # started, completed, failed
    message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)  # seconds
    meta_data = Column(JSON, nullable=True)
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class MerchantApplication(Base):
    """NEW model for complete application submissions"""
    __tablename__ = "merchant_applications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String, unique=True, index=True)
    
    # Form data from frontend
    personal_data = Column(JSON, nullable=True)
    business_data = Column(JSON, nullable=True)
    processed_documents = Column(JSON, nullable=True)
    
    # Risk assessment results
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String(20), nullable=True)  # LOW, MEDIUM, HIGH
    
    # Application status
    status = Column(String(50), default="SUBMITTED")  # SUBMITTED, APPROVED, DENIED, CONTRACTED
    approval_reason = Column(Text, nullable=True)
    
    # Generated terms (if approved)
    terms = Column(JSON, nullable=True)
    
    # Contract tracking
    contract_id = Column(String, nullable=True)
    contract_signed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)