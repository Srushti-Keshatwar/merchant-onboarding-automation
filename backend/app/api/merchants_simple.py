# backend/app/api/merchants_simple.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import io
import os
from fastapi.responses import Response

router = APIRouter()

# In-memory storage only
applications_store = {}

class ApplicationSubmissionRequest(BaseModel):
    personal_data: Dict[str, Any]
    business_data: Dict[str, Any] 
    processed_documents: Dict[str, Any]
    
class ContractGenerationRequest(BaseModel):
    application_id: str
    merchant_name: str
    signature_data: Dict[str, Any] = {}

class EmailNotificationRequest(BaseModel):
    application_id: str
    email_type: str  # "approval", "denial", "contract_ready"
    recipient_email: str

def calculate_risk_score_simple(business_data: Dict, processed_documents: Dict) -> int:
    """Simple risk assessment - no external dependencies"""
    score = 50  # Base score
    
    # Business data factors
    annual_revenue = business_data.get('annualRevenue', '')
    if annual_revenue and str(annual_revenue).strip():
        try:
            revenue = float(annual_revenue)
            if revenue > 1000000:
                score += 20
            elif revenue > 500000:
                score += 15
            elif revenue > 100000:
                score += 10
        except (ValueError, TypeError):
            pass
    
    # Monthly processing volume
    monthly_volume = business_data.get('monthlyProcessingVolume', '')
    if monthly_volume and str(monthly_volume).strip():
        try:
            volume = float(monthly_volume)
            if volume > 100000:
                score += 10
            elif volume > 50000:
                score += 5
        except (ValueError, TypeError):
            pass
    
    # AI confidence scores
    doc_confidences = []
    for doc_type, doc_data in processed_documents.items():
        ai_processing = doc_data.get('ai_processing', {})
        confidence = ai_processing.get('confidence_score')
        if confidence:
            try:
                doc_confidences.append(float(confidence))
            except (ValueError, TypeError):
                pass
    
    if doc_confidences:
        avg_confidence = sum(doc_confidences) / len(doc_confidences)
        score += int(avg_confidence * 30)
    
    # Industry bonus
    industry = business_data.get('industry', '').lower()
    if 'technology' in industry or 'professional' in industry:
        score += 10
    
    return max(0, min(100, score))

def generate_terms_simple(business_data: Dict, risk_score: int) -> Dict:
    """Generate terms - simple version"""
    if risk_score >= 90:
        rate = 2.9
        daily_limit = 50000
        monthly_volume = 500000
    elif risk_score >= 80:
        rate = 3.2
        daily_limit = 40000
        monthly_volume = 400000
    elif risk_score >= 70:
        rate = 3.5
        daily_limit = 30000
        monthly_volume = 300000
    else:
        rate = 4.0
        daily_limit = 20000
        monthly_volume = 200000
    
    # Safe calculation
    try:
        monthly_processing_str = business_data.get('monthlyProcessingVolume', '50000')
        monthly_processing = float(monthly_processing_str) if monthly_processing_str else 50000
        monthly_revenue = min(monthly_processing, monthly_volume * 0.8)
        processing_fees = monthly_revenue * (rate / 100) + (monthly_revenue / 100 * 0.30)
        hand_net_profit = monthly_revenue - processing_fees
    except:
        monthly_revenue = 50000
        processing_fees = 1500
        hand_net_profit = 48500
    
    return {
        "rate": f"{rate}%",
        "transaction_fee": "$0.30",
        "daily_limit": f"${daily_limit:,}",
        "monthly_volume": f"${monthly_volume:,}",
        "settlement": "Next business day",
        "contract_length": "12 months",
        "hand_net_profit": f"${hand_net_profit:,.0f}",
        "estimated_monthly_revenue": f"${monthly_revenue:,.0f}",
        "estimated_fees": f"${processing_fees:,.0f}"
    }

@router.post("/submit-application-simple")
async def submit_application_simple(request: ApplicationSubmissionRequest):
    """Submit application - SIMPLE MEMORY-ONLY version"""
    try:
        # Generate ID
        application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        print(f"🚀 Processing simple application: {application_id}")
        
        # Calculate risk
        risk_score = calculate_risk_score_simple(request.business_data, request.processed_documents)
        approval_status = "APPROVED" if risk_score >= 70 else "DENIED"
        risk_level = "LOW" if risk_score >= 80 else "MEDIUM" if risk_score >= 60 else "HIGH"
        
        # Generate terms
        terms = generate_terms_simple(request.business_data, risk_score) if approval_status == "APPROVED" else None
        
        # Store in memory
        application_data = {
            "application_id": application_id,
            "personal_data": request.personal_data,
            "business_data": request.business_data,
            "processed_documents": request.processed_documents,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": approval_status,
            "terms": terms,
            "created_at": datetime.now().isoformat()
        }
        
        applications_store[application_id] = application_data
        
        print(f"✅ Application stored: {application_id}")
        
        return {
            "status": "success",
            "application_id": application_id,
            "approval_status": approval_status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "terms": terms,
            "processing_time": "1.2 minutes",
            "message": f"Application {approval_status.lower()}",
            "saved_to_database": False,
            "storage_mode": "memory_simple"
        }
        
    except Exception as e:
        print(f"❌ Simple submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simple submission failed: {str(e)}")

@router.get("/application-simple/{application_id}/status")
async def get_status_simple(application_id: str):
    """Get status - simple version"""
    try:
        if application_id in applications_store:
            app = applications_store[application_id]
            return {
                "application_id": application_id,
                "status": app["status"],
                "risk_score": app["risk_score"],
                "risk_level": app["risk_level"],
                "terms": app["terms"],
                "created_at": app["created_at"],
                "processing_complete": True,
                "source": "memory_simple"
            }
        else:
            raise HTTPException(status_code=404, detail="Application not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
    