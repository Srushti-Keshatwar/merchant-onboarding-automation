# backend/app/api/merchants_new.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

router = APIRouter()

# In-memory storage for demo (fallback)
applications_store = {}

class ApplicationSubmissionRequest(BaseModel):
    personal_data: Dict[str, Any]
    business_data: Dict[str, Any] 
    processed_documents: Dict[str, Any]

class ContractRequest(BaseModel):
    application_id: str
    merchant_name: str

# # Simple sync database connection for production endpoints
# def get_sync_db():
#     """Get synchronous database connection"""
#     try:
#         engine = create_engine(settings.DATABASE_URL)
#         SessionLocal = sessionmaker(bind=engine)
#         return SessionLocal()
#     except Exception as e:
#         print(f"Database connection error: {e}")
#         return None

def get_sync_db():
    """Get synchronous database connection (returns None if fails)"""
    try:
        # Check if we're in Docker and can reach the db service
        import socket
        socket.getaddrinfo('db', 5432)
        
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        # Test the connection
        session.execute(text("SELECT 1"))
        return session
    except Exception as e:
        print(f"Database unavailable (using memory fallback): {e}")
        return None


# def calculate_risk_score(business_data: Dict, processed_documents: Dict) -> int:
#     """AI-powered risk assessment"""
#     score = 50  # Base score
    
#     # Business data factors
#     if business_data.get('annualRevenue'):
#         try:
#             revenue = float(business_data['annualRevenue'])
#             if revenue > 1000000:
#                 score += 20
#             elif revenue > 500000:
#                 score += 15
#             elif revenue > 100000:
#                 score += 10
#         except (ValueError, TypeError):
#             pass
    
#     # AI confidence scores from document processing
#     doc_confidences = []
#     for doc_type, doc_data in processed_documents.items():
#         if doc_data.get('ai_processing', {}).get('confidence_score'):
#             doc_confidences.append(doc_data['ai_processing']['confidence_score'])
    
#     if doc_confidences:
#         avg_confidence = sum(doc_confidences) / len(doc_confidences)
#         score += int(avg_confidence * 30)  # Up to 30 points for AI confidence
    
#     # Industry risk factors
#     industry = business_data.get('industry', '').lower()
#     high_risk_industries = ['cryptocurrency', 'gambling', 'adult']
#     low_risk_industries = ['professional services', 'retail', 'technology']
    
#     if any(risk in industry for risk in high_risk_industries):
#         score -= 15
#     elif any(safe in industry for safe in low_risk_industries):
#         score += 10
    
#     return max(0, min(100, score))  # Clamp between 0-100

def calculate_risk_score(business_data: Dict, processed_documents: Dict) -> int:
    """AI-powered risk assessment (FIXED for empty strings)"""
    score = 50  # Base score
    
    # Business data factors - HANDLE EMPTY STRINGS
    annual_revenue = business_data.get('annualRevenue')
    if annual_revenue and str(annual_revenue).strip():  # Check for non-empty string
        try:
            revenue = float(annual_revenue)
            if revenue > 1000000:
                score += 20
            elif revenue > 500000:
                score += 15
            elif revenue > 100000:
                score += 10
        except (ValueError, TypeError):
            print(f"Warning: Could not convert annualRevenue '{annual_revenue}' to float")
    
    # Monthly processing volume - HANDLE EMPTY STRINGS
    monthly_volume = business_data.get('monthlyProcessingVolume')
    if monthly_volume and str(monthly_volume).strip():
        try:
            volume = float(monthly_volume)
            if volume > 100000:
                score += 10
            elif volume > 50000:
                score += 5
        except (ValueError, TypeError):
            print(f"Warning: Could not convert monthlyProcessingVolume '{monthly_volume}' to float")
    
    # AI confidence scores from document processing
    doc_confidences = []
    for doc_type, doc_data in processed_documents.items():
        if doc_data.get('ai_processing', {}).get('confidence_score'):
            try:
                confidence = float(doc_data['ai_processing']['confidence_score'])
                doc_confidences.append(confidence)
            except (ValueError, TypeError):
                print(f"Warning: Invalid confidence score for {doc_type}")
    
    if doc_confidences:
        avg_confidence = sum(doc_confidences) / len(doc_confidences)
        score += int(avg_confidence * 30)  # Up to 30 points for AI confidence
    
    # Industry risk factors
    industry = business_data.get('industry', '').lower()
    high_risk_industries = ['cryptocurrency', 'gambling', 'adult']
    low_risk_industries = ['professional services', 'retail', 'technology']
    
    if any(risk in industry for risk in high_risk_industries):
        score -= 15
    elif any(safe in industry for safe in low_risk_industries):
        score += 10
    
    return max(0, min(100, score))  # Clamp between 0-100


def generate_merchant_terms(business_data: Dict, risk_score: int) -> Dict:
    """Generate merchant terms based on risk assessment (FIXED for empty strings)"""
    
    # Base rates based on risk score
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
    
    # Calculate estimated profit - HANDLE EMPTY STRINGS
    try:
        monthly_processing_str = business_data.get('monthlyProcessingVolume', '50000')
        if not monthly_processing_str or not str(monthly_processing_str).strip():
            monthly_processing_str = '50000'  # Default value
        
        monthly_processing = float(monthly_processing_str)
        monthly_revenue = min(monthly_processing, monthly_volume * 0.8)  # 80% of limit
        processing_fees = monthly_revenue * (rate / 100) + (monthly_revenue / 100 * 0.30)
        hand_net_profit = monthly_revenue - processing_fees
    except (ValueError, TypeError) as e:
        print(f"Warning: Error calculating terms: {e}")
        # Use safe defaults
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

# ================================
# TEST ENDPOINTS (In-Memory)
# ================================

@router.post("/submit-application-test")
async def submit_merchant_application_test(request: ApplicationSubmissionRequest):
    """Submit complete merchant application (in-memory for testing)"""
    try:
        # Generate application ID
        application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        print(f"Processing application: {application_id}")
        print(f"Documents received: {list(request.processed_documents.keys())}")
        
        # Calculate risk score based on AI confidence and business data
        risk_score = calculate_risk_score(request.business_data, request.processed_documents)
        
        # Determine approval status
        approval_status = "APPROVED" if risk_score >= 70 else "DENIED"
        risk_level = "LOW" if risk_score >= 80 else "MEDIUM" if risk_score >= 60 else "HIGH"
        
        # Generate terms if approved
        terms = generate_merchant_terms(request.business_data, risk_score) if approval_status == "APPROVED" else None
        
        # Store in memory (replace with DB later)
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
        
        return {
            "status": "success",
            "application_id": application_id,
            "approval_status": approval_status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "terms": terms,
            "processing_time": "2.3 minutes",
            "message": f"Application {approval_status.lower()}"
        }
        
    except Exception as e:
        print(f"Application submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Application submission failed: {str(e)}")

@router.get("/application-test/{application_id}/status")
async def get_application_status_test(application_id: str):
    """Get application status (in-memory)"""
    try:
        if application_id not in applications_store:
            raise HTTPException(status_code=404, detail="Application not found")
        
        app = applications_store[application_id]
        
        return {
            "application_id": application_id,
            "status": app["status"],
            "risk_score": app["risk_score"],
            "risk_level": app["risk_level"],
            "terms": app["terms"],
            "created_at": app["created_at"],
            "processing_complete": True,
            "source": "memory_test"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

# ================================
# PRODUCTION ENDPOINTS (Database + Fallback)
# ================================

# @router.post("/submit-application")
# async def submit_merchant_application_production(request: ApplicationSubmissionRequest):
#     """Submit complete merchant application (PRODUCTION with database)"""
#     try:
#         # Generate application ID
#         application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
#         print(f"🚀 Processing PRODUCTION application: {application_id}")
        
#         # Calculate risk score
#         risk_score = calculate_risk_score(request.business_data, request.processed_documents)
#         approval_status = "APPROVED" if risk_score >= 70 else "DENIED"
#         risk_level = "LOW" if risk_score >= 80 else "MEDIUM" if risk_score >= 60 else "HIGH"
#         terms = generate_merchant_terms(request.business_data, risk_score) if approval_status == "APPROVED" else None
        
#         # Try to save to database, fallback to in-memory
#         saved_to_db = False
#         db = get_sync_db()
#         if db:
#             try:
#                 # First create the table if it doesn't exist
#                 create_table_query = text("""
#                     CREATE TABLE IF NOT EXISTS merchant_applications (
#                         id VARCHAR PRIMARY KEY,
#                         application_id VARCHAR UNIQUE NOT NULL,
#                         personal_data TEXT,
#                         business_data TEXT,
#                         processed_documents TEXT,
#                         risk_score INTEGER,
#                         risk_level VARCHAR(20),
#                         status VARCHAR(50),
#                         terms TEXT,
#                         created_at TIMESTAMP,
#                         processed_at TIMESTAMP
#                     )
#                 """)
#                 db.execute(create_table_query)
#                 db.commit()
                
#                 # Insert application data
#                 insert_query = text("""
#                     INSERT INTO merchant_applications 
#                     (id, application_id, personal_data, business_data, processed_documents, 
#                      risk_score, risk_level, status, terms, created_at, processed_at)
#                     VALUES 
#                     (:id, :application_id, :personal_data, :business_data, :processed_documents,
#                      :risk_score, :risk_level, :status, :terms, :created_at, :processed_at)
#                 """)
                
#                 db.execute(insert_query, {
#                     'id': str(uuid.uuid4()),
#                     'application_id': application_id,
#                     'personal_data': str(request.personal_data),
#                     'business_data': str(request.business_data),
#                     'processed_documents': str(request.processed_documents),
#                     'risk_score': risk_score,
#                     'risk_level': risk_level,
#                     'status': approval_status,
#                     'terms': str(terms) if terms else None,
#                     'created_at': datetime.now(),
#                     'processed_at': datetime.now()
#                 })
#                 db.commit()
#                 db.close()
#                 saved_to_db = True
#                 print(f"✅ Saved to database: {application_id}")
                
#             except Exception as db_error:
#                 print(f"❌ Database save failed: {db_error}")
#                 if db:
#                     db.rollback()
#                     db.close()
        
#         # Always save to memory as backup
#         applications_store[application_id] = {
#             "application_id": application_id,
#             "personal_data": request.personal_data,
#             "business_data": request.business_data,
#             "processed_documents": request.processed_documents,
#             "risk_score": risk_score,
#             "risk_level": risk_level,
#             "status": approval_status,
#             "terms": terms,
#             "created_at": datetime.now().isoformat(),
#             "saved_to_db": saved_to_db
#         }
        
#         return {
#             "status": "success",
#             "application_id": application_id,
#             "approval_status": approval_status,
#             "risk_score": risk_score,
#             "risk_level": risk_level,
#             "terms": terms,
#             "processing_time": "2.3 minutes",
#             "message": f"Application {approval_status.lower()}",
#             "saved_to_database": saved_to_db
#         }
        
#     except Exception as e:
#         print(f"Application submission error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Application submission failed: {str(e)}")

@router.post("/submit-application")
async def submit_merchant_application_production(request: ApplicationSubmissionRequest):
    """Submit complete merchant application (MEMORY-ONLY version)"""
    try:
        # Generate application ID
        application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        print(f"🚀 Processing application: {application_id}")
        
        # Calculate risk score
        risk_score = calculate_risk_score(request.business_data, request.processed_documents)
        approval_status = "APPROVED" if risk_score >= 70 else "DENIED"
        risk_level = "LOW" if risk_score >= 80 else "MEDIUM" if risk_score >= 60 else "HIGH"
        
        # Generate terms
        terms = generate_merchant_terms(request.business_data, risk_score) if approval_status == "APPROVED" else None
        
        # Store in memory only (for now)
        applications_store[application_id] = {
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
        
        return {
            "status": "success",
            "application_id": application_id,
            "approval_status": approval_status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "terms": terms,
            "processing_time": "2.3 minutes",
            "message": f"Application {approval_status.lower()}",
            "saved_to_database": False,
            "storage_mode": "memory"
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")

@router.get("/application/{application_id}/status")
async def get_application_status_production(application_id: str):
    """Get application status (PRODUCTION with database lookup)"""
    try:
        # Try database first
        db = get_sync_db()
        if db:
            try:
                query = text("SELECT * FROM merchant_applications WHERE application_id = :app_id")
                result = db.execute(query, {'app_id': application_id}).fetchone()
                db.close()
                
                if result:
                    # Parse terms back from string
                    terms = None
                    if result.terms:
                        try:
                            terms = eval(result.terms)
                        except:
                            terms = result.terms
                    
                    return {
                        "application_id": application_id,
                        "status": result.status,
                        "risk_score": result.risk_score,
                        "risk_level": result.risk_level,
                        "terms": terms,
                        "created_at": result.created_at.isoformat() if result.created_at else None,
                        "processing_complete": True,
                        "source": "database"
                    }
            except Exception as db_error:
                print(f"Database lookup failed: {db_error}")
                if db:
                    db.close()
        
        # Fallback to in-memory
        if application_id in applications_store:
            app = applications_store[application_id]
            return {
                "application_id": application_id,
                "status": app["status"],
                "risk_score": app["risk_score"],
                "risk_level": app.get("risk_level"),
                "terms": app["terms"],
                "created_at": app["created_at"],
                "processing_complete": True,
                "source": "memory_fallback"
            }
        
        raise HTTPException(status_code=404, detail="Application not found")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/generate-contract")
async def generate_contract_production(request: ContractRequest):
    """Generate digital contract (PRODUCTION)"""
    try:
        # Lookup application
        db = get_sync_db()
        application_found = False
        application_data = None
        
        if db:
            try:
                query = text("SELECT * FROM merchant_applications WHERE application_id = :app_id AND status = 'APPROVED'")
                result = db.execute(query, {'app_id': request.application_id}).fetchone()
                if result:
                    application_found = True
                    application_data = result
                db.close()
            except Exception as db_error:
                print(f"Database contract lookup failed: {db_error}")
                if db:
                    db.close()
        
        # Fallback to in-memory
        if not application_found and request.application_id in applications_store:
            app = applications_store[request.application_id]
            if app["status"] == "APPROVED":
                application_found = True
                application_data = app
        
        if not application_found:
            raise HTTPException(status_code=404, detail="Approved application not found")
            
        contract_id = f"CONTRACT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        return {
            "status": "success",
            "contract_id": contract_id,
            "application_id": request.application_id,
            "merchant_name": request.merchant_name,
            "message": "Contract successfully generated",
            "contract_terms": application_data.terms if hasattr(application_data, 'terms') else application_data.get("terms"),
            "next_steps": [
                "Review contract terms",
                "Digital signature required",
                "Account setup begins after signing"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Contract generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Contract generation failed: {str(e)}")

@router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str):
    """Get contract details"""
    try:
        # Simple mock response for now
        return {
            "contract_id": contract_id,
            "status": "GENERATED",
            "created_at": datetime.now().isoformat(),
            "message": "Contract ready for signature"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract retrieval failed: {str(e)}")