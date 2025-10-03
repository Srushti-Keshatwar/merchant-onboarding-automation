from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import os
import shutil
from datetime import datetime
from typing import List
import uuid
from typing import Dict, Any
from ..core.config import settings
from ..services.document_ai import DocumentAIService  # ✅ ADD THIS
from ..models.merchant import MerchantApplication
from pydantic import BaseModel
from ..database import get_database
from sqlalchemy.orm import Session

router = APIRouter()

# File validation settings
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.txt'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/png', 
    'image/jpeg',
    'image/jpg',
    'image/tiff',
    'text/plain'
}

class ApplicationSubmissionRequest(BaseModel):
    personal_data: Dict[str, Any]
    business_data: Dict[str, Any] 
    processed_documents: Dict[str, Any]

class ContractRequest(BaseModel):
    application_id: str
    merchant_name: str
    signature_data: Dict[str, Any]

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    try:
        if not file.filename:
            return False
            
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            print(f"Invalid extension: {file_ext}")
            return False
        
        if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
            print(f"Invalid MIME type: {file.content_type}")
            return False
            
        return True
    except Exception as e:
        print(f"Validation error: {e}")
        return False

@router.post("/upload-and-process")  
async def upload_and_process_document(
    file: UploadFile = File(...),
    document_type: str = "business_license"
):
    """Upload and process document with Google AI - MULTI-MODAL VERSION"""
    try:
        print(f"🚀 Processing file: {file.filename}, type: {file.content_type}")
        
        # Validate file
        if not validate_file(file):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file. Allowed extensions: {list(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Size: {file_size}, Max: {settings.MAX_FILE_SIZE}"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()
        new_filename = f"{file_id}{file_ext}"
        
        # Create document type directory
        doc_dir = os.path.join(settings.UPLOAD_DIR, document_type)
        os.makedirs(doc_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(doc_dir, new_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        print(f"📁 File saved to: {file_path}")
        
        # ✅ NEW: Use Multi-Modal AI Fusion
        ai_results = {}
        if file_ext == '.pdf' or file_ext in ['.jpg', '.jpeg', '.png']:
            try:
                from ..services.google_ai import google_ai_services
                
                print(f"🤖 Starting multi-modal AI fusion analysis...")
                
                # Call the multi-modal fusion
                ai_results = await google_ai_services.multi_modal_fusion_analysis(
                    file_content, 
                    file.content_type or "application/pdf"
                )
                
                print(f"✅ Multi-modal fusion completed!")
                print(f"   - Document AI confidence: {ai_results.get('document_ai', {}).get('confidence', 0):.2f}")
                print(f"   - Vision AI score: {ai_results.get('vision_ai', {}).get('authenticity_score', 0):.2f}")
                print(f"   - Fusion confidence: {ai_results.get('fusion', {}).get('fusion_confidence', 0):.2f}")
                
            except Exception as ai_error:
                print(f"⚠️ AI processing error: {ai_error}")
                # Fallback to basic response
                ai_results = {
                    "status": "ai_processing_failed",
                    "error": str(ai_error),
                    "message": "File uploaded but AI processing encountered an issue",
                    "fusion": {"fusion_confidence": 0.0}
                }
        else:
            ai_results = {
                "status": "skipped",
                "message": "AI processing only available for PDF and image files",
                "file_type": file_ext
            }
        
        # ✅ NEW: Format response to match what frontend expects
        # Extract key data for frontend compatibility
        confidence_score = 0.0
        form_fields = {}
        full_text = ""
        
        if "fusion" in ai_results and ai_results.get("status") != "ai_processing_failed":
            # Get fusion confidence
            confidence_score = ai_results.get("fusion", {}).get("fusion_confidence", 0.0)
            
            # Get extracted data from Document AI
            doc_ai_data = ai_results.get("document_ai", {})
            form_fields = doc_ai_data.get("form_fields", [])
            full_text = doc_ai_data.get("text", "")
            
            # Convert form_fields list to dict for frontend
            if isinstance(form_fields, list):
                form_fields_dict = {}
                for field in form_fields:
                    if isinstance(field, dict):
                        name = field.get("name", "")
                        value = field.get("value", "")
                        if name and value:
                            form_fields_dict[name] = value
                form_fields = form_fields_dict
        
        # Return comprehensive response with fusion data
        return {
            "status": "success",
            "message": "File uploaded and processed with multi-modal AI fusion",
            "upload_data": {
                "file_id": file_id,
                "original_filename": file.filename,
                "saved_filename": new_filename,
                "document_type": document_type,
                "file_path": file_path,
                "file_size": file_size,
                "upload_timestamp": datetime.now().isoformat()
            },
            "ai_processing": {
                "status": ai_results.get("status", "success"),
                "confidence_score": confidence_score,
                "full_text": full_text[:1000] if full_text else "",  # Truncate for response
                "full_text_length": len(full_text),
                "form_fields": form_fields,
                "multi_modal_fusion": {
                    "document_ai_confidence": ai_results.get("document_ai", {}).get("confidence", 0.0),
                    "vision_ai_score": ai_results.get("vision_ai", {}).get("authenticity_score", 0.0),
                    "fusion_confidence": confidence_score,
                    "recommended_action": ai_results.get("fusion", {}).get("recommended_action", "manual_review"),
                    "processing_quality": ai_results.get("fusion", {}).get("processing_quality", "unknown"),
                    "validation_results": ai_results.get("fusion", {}).get("validation_results", {}),
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload/processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# @router.post("/upload-and-process")  
# async def upload_and_process_document(
#     file: UploadFile = File(...),
#     document_type: str = "business_license"
# ):
#     """Upload and process document with Google AI"""
#     try:
#         print(f"Processing file: {file.filename}, type: {file.content_type}")
        
#         # Validate file
#         if not validate_file(file):
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"Invalid file. Allowed extensions: {list(ALLOWED_EXTENSIONS)}"
#             )
        
#         # Read file content
#         file_content = await file.read()
#         file_size = len(file_content)
        
#         if file_size > settings.MAX_FILE_SIZE:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"File too large. Size: {file_size}, Max: {settings.MAX_FILE_SIZE}"
#             )
        
#         # Generate unique filename
#         file_id = str(uuid.uuid4())
#         file_ext = os.path.splitext(file.filename)[1].lower()
#         new_filename = f"{file_id}{file_ext}"
        
#         # Create document type directory
#         doc_dir = os.path.join(settings.UPLOAD_DIR, document_type)
#         os.makedirs(doc_dir, exist_ok=True)
        
#         # Save file
#         file_path = os.path.join(doc_dir, new_filename)
#         with open(file_path, "wb") as buffer:
#             buffer.write(file_content)
        
#         print(f"File saved to: {file_path}")
        
#         # ✅ PROCESS WITH GOOGLE AI (only for PDFs for now)
#         ai_results = {}
#         if file_ext == '.pdf':
#             try:
#                 doc_ai_service = DocumentAIService()
#                 ai_results = doc_ai_service.process_local_document(file_path, document_type)
#                 print(f"AI processing completed: {ai_results.get('status', 'unknown')}")
#             except Exception as ai_error:
#                 print(f"AI processing error: {ai_error}")
#                 ai_results = {
#                     "status": "ai_error",
#                     "error": str(ai_error),
#                     "message": "File uploaded but AI processing failed"
#                 }
#         else:
#             ai_results = {
#                 "status": "skipped",
#                 "message": "AI processing only available for PDF files",
#                 "file_type": file_ext
#             }
        
#         # Return comprehensive response
#         return {
#             "status": "success",
#             "message": "File uploaded and processed successfully",
#             "upload_data": {
#                 "file_id": file_id,
#                 "original_filename": file.filename,
#                 "saved_filename": new_filename,
#                 "document_type": document_type,
#                 "document_type": document_type,
#                 "file_path": file_path,
#                 "file_size": file_size,
#                 "upload_timestamp": datetime.now().isoformat()
#             },
#             "ai_processing": ai_results
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Upload/processing error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Keep the original upload endpoint for basic testing
@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "business_license"
):
    """Upload document without AI processing"""
    # ... keep existing code unchanged ...

@router.get("/test")
async def test_endpoint():
    """Test endpoint with AI service status"""
    try:
        doc_ai_service = DocumentAIService()
        ai_status = "ready"
    except Exception as e:
        ai_status = f"error: {str(e)}"
    
    return {
        "status": "success",
        "message": "Merchants API is working!",
        "upload_dir": settings.UPLOAD_DIR,
        "max_file_size": settings.MAX_FILE_SIZE,
        "allowed_extensions": list(ALLOWED_EXTENSIONS),
        "ai_service_status": ai_status,
        "google_cloud_project": settings.PROJECT_ID
    }
    
def calculate_risk_score(business_data: Dict, processed_documents: Dict) -> int:
    """AI-powered risk assessment"""
    score = 50  # Base score
    
    # Business data factors
    if business_data.get('annualRevenue'):
        try:
            revenue = float(business_data['annualRevenue'])
            if revenue > 1000000:
                score += 20
            elif revenue > 500000:
                score += 15
            elif revenue > 100000:
                score += 10
        except (ValueError, TypeError):
            pass
    
    # AI confidence scores from document processing
    doc_confidences = []
    for doc_type, doc_data in processed_documents.items():
        if doc_data.get('ai_processing', {}).get('confidence_score'):
            doc_confidences.append(doc_data['ai_processing']['confidence_score'])
    
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
    """Generate merchant terms based on risk assessment"""
    
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
    
    # Calculate estimated profit
    monthly_processing = float(business_data.get('monthlyProcessingVolume', 50000))
    monthly_revenue = min(monthly_processing, monthly_volume * 0.8)  # 80% of limit
    processing_fees = monthly_revenue * (rate / 100) + (monthly_revenue / 100 * 0.30)  # Rate + $0.30 per $100
    hand_net_profit = monthly_revenue - processing_fees
    
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

# ADD THESE NEW ENDPOINTS after your existing endpoints
@router.post("/submit-application")
async def submit_merchant_application(
    request: ApplicationSubmissionRequest,
    db: Session = Depends(get_database)
):
    """Submit complete merchant application with AI-processed documents"""
    try:
        # Generate application ID
        application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate risk score based on AI confidence and business data
        risk_score = calculate_risk_score(request.business_data, request.processed_documents)
        
        # Determine approval status
        approval_status = "APPROVED" if risk_score >= 70 else "DENIED"
        risk_level = "LOW" if risk_score >= 80 else "MEDIUM" if risk_score >= 60 else "HIGH"
        
        # Generate terms if approved
        terms = generate_merchant_terms(request.business_data, risk_score) if approval_status == "APPROVED" else None
        
        # Create application record
        application = MerchantApplication(
            application_id=application_id,
            personal_data=request.personal_data,
            business_data=request.business_data,
            processed_documents=request.processed_documents,
            risk_score=risk_score,
            risk_level=risk_level,
            status=approval_status,
            terms=terms,
            processed_at=datetime.now()
        )
        
        # Save to database
        db.add(application)
        await db.commit()
        
        return {
            "status": "success",
            "application_id": application_id,
            "approval_status": approval_status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "terms": terms,
            "processing_time": "2.3 minutes",  # Simulated for demo
            "message": f"Application {approval_status.lower()}"
        }
        
    except Exception as e:
        print(f"Application submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Application submission failed: {str(e)}")

@router.get("/application/{application_id}/status")
async def get_application_status(
    application_id: str,
    db: Session = Depends(get_database)
):
    """Get current application status"""
    try:
        application = await db.query(MerchantApplication).filter(
            MerchantApplication.application_id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
            
        return {
            "application_id": application_id,
            "status": application.status,
            "risk_score": application.risk_score,
            "risk_level": application.risk_level,
            "terms": application.terms,
            "created_at": application.created_at,
            "processed_at": application.processed_at,
            "processing_complete": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/generate-contract")
async def generate_contract(
    request: ContractRequest,
    db: Session = Depends(get_database)
):
    """Generate and store digital contract"""
    try:
        application = await db.query(MerchantApplication).filter(
            MerchantApplication.application_id == request.application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
            
        if application.status != "APPROVED":
            raise HTTPException(status_code=400, detail="Application not approved")
            
        contract_id = f"CONTRACT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Update application with contract info
        application.contract_id = contract_id
        application.status = "CONTRACTED"
        application.contract_signed_at = datetime.now()
        
        await db.commit()
        
        return {
            "status": "success",
            "contract_id": contract_id,
            "application_id": request.application_id,
            "message": "Contract successfully executed",
            "next_steps": [
                "Account setup begins within 24 hours",
                "Integration credentials within 48 hours", 
                "Account manager contact within 1 business day"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Contract generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Contract generation failed: {str(e)}")