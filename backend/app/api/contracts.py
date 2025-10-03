from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any
import os
import logging
from ..contract_generator import generate_contract_pdf

logger = logging.getLogger(__name__)
router = APIRouter()

class ContractRequest(BaseModel):
    application_id: str
    personal_data: Dict[str, Any]
    business_data: Dict[str, Any]
    merchant_terms: Dict[str, Any]
    processed_documents: Dict[str, Any] = {}

@router.post("/generate-contract/{application_id}")
async def generate_contract_endpoint(application_id: str, contract_data: ContractRequest):
    """Generate PDF contract for an application"""
    try:
        logger.info(f"📄 Generating contract for {application_id}")
        logger.info(f"📋 Contract data received")
        
        contract_dict = {
            "application_id": application_id,
            "personal_data": contract_data.personal_data,
            "business_data": contract_data.business_data,
            "merchant_terms": contract_data.merchant_terms,
            "processed_documents": contract_data.processed_documents
        }
        
        filename = generate_contract_pdf(contract_dict)
        logger.info(f"✅ Contract generated: {filename}")
        
        return {
            "success": True,
            "filename": filename,
            "download_url": f"/api/v1/download-contract/{filename}",
            "message": "Contract generated successfully",
            "application_id": application_id
        }
        
    except Exception as e:
        logger.error(f"❌ Contract generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Contract generation failed: {str(e)}")

# ✅ Support both GET and HEAD methods
@router.get("/download-contract/{filename}")
@router.head("/download-contract/{filename}")
async def download_contract(filename: str):
    """Download a generated contract PDF"""
    
    # Force console output to confirm function is called
    print(f"🔥🔥🔥 DOWNLOAD FUNCTION CALLED: {filename}")
    logger.info(f"🔥 Download request for: {filename}")
    
    file_path = f"/app/contracts/{filename}"
    print(f"🔥 File path: {file_path}")
    print(f"🔥 File exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        print(f"🔥 FILE NOT FOUND!")
        raise HTTPException(status_code=404, detail="Contract file not found")
    
    print(f"🔥 Returning FileResponse")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/test-contracts")
async def test_contracts():
    """Test endpoint"""
    return {
        "message": "Contract API is working - LATEST VERSION v2",
        "status": "ready",
        "version": "2.0"
    }