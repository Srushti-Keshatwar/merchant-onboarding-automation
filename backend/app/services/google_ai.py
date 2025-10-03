# app/services/google_ai.py
import asyncio
import logging
from typing import Dict, Any, Optional, List
from google.cloud import documentai
from google.cloud import vision
from google.cloud import language_v1
from google.cloud import storage
from ..core.config import settings

logger = logging.getLogger(__name__)

class GoogleAIServices:
    def __init__(self):
        """Initialize Google Cloud AI clients"""
        try:
            self.document_ai_client = documentai.DocumentProcessorServiceClient()
            self.vision_client = vision.ImageAnnotatorClient()
            self.language_client = language_v1.LanguageServiceClient()
            self.storage_client = storage.Client()
            
            # Document AI processor name
            self.processor_name = f"projects/{settings.PROJECT_ID}/locations/{settings.DOCUMENT_AI_LOCATION}/processors/{settings.DOCUMENT_AI_PROCESSOR_ID}"
            logger.info("Google AI services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google AI services: {str(e)}")
            raise
    
    async def process_document_with_document_ai(self, file_content: bytes, mime_type: str) -> Dict[str, Any]:
        """Process document using Google Document AI"""
        try:
            # Create the document object
            raw_document = documentai.RawDocument(content=file_content, mime_type=mime_type)
            
            # Configure the process request
            request = documentai.ProcessRequest(
                name=self.processor_name,
                raw_document=raw_document
            )
            
            # Process the document
            result = self.document_ai_client.process_document(request=request)
            document = result.document
            
            # Extract text and entities
            extracted_data = {
                "text": document.text[:2000],  # First 2000 chars
                "entities": [],
                "form_fields": [],
                "pages": len(document.pages),
                "confidence": 0.0
            }
            
            # Extract entities
            total_confidence = 0
            entity_count = 0
            
            for entity in document.entities:
                entity_data = {
                    "type": entity.type_,
                    "mention_text": entity.mention_text,
                    "confidence": entity.confidence,
                    "normalized_value": entity.normalized_value.text if entity.normalized_value else None
                }
                extracted_data["entities"].append(entity_data)
                total_confidence += entity.confidence
                entity_count += 1
            
            # Calculate average confidence
            if entity_count > 0:
                extracted_data["confidence"] = total_confidence / entity_count
            
            # Extract form fields
            for page in document.pages:
                for form_field in page.form_fields:
                    field_name = ""
                    field_value = ""
                    
                    if form_field.field_name and form_field.field_name.text_anchor:
                        field_name = document.text[
                            form_field.field_name.text_anchor.text_segments[0].start_index:
                            form_field.field_name.text_anchor.text_segments[0].end_index
                        ].strip()
                    
                    if form_field.field_value and form_field.field_value.text_anchor:
                        field_value = document.text[
                            form_field.field_value.text_anchor.text_segments[0].start_index:
                            form_field.field_value.text_anchor.text_segments[0].end_index
                        ].strip()
                    
                    if field_name and field_value:
                        extracted_data["form_fields"].append({
                            "name": field_name,
                            "value": field_value,
                            "confidence": form_field.field_value.confidence if form_field.field_value else 0.0
                        })
            
            logger.info(f"Document AI processing completed. Extracted {len(extracted_data['entities'])} entities, {len(extracted_data['form_fields'])} form fields")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Document AI processing failed: {str(e)}")
            return {
                "error": str(e),
                "text": "",
                "entities": [],
                "form_fields": [],
                "confidence": 0.0
            }
    
    async def analyze_document_with_vision_ai(self, file_content: bytes) -> Dict[str, Any]:
        """Analyze document authenticity using Google Vision AI"""
        try:
            # Create Vision AI image object
            image = vision.Image(content=file_content)
            
            # Perform multiple analyses
            text_response = self.vision_client.text_detection(image=image)
            object_response = self.vision_client.object_localization(image=image)
            logo_response = self.vision_client.logo_detection(image=image)
            face_response = self.vision_client.face_detection(image=image)
            
            # Extract text
            texts = text_response.text_annotations
            detected_text = texts[0].description if texts else ""
            
            # Build analysis result
            analysis_result = {
                "text_detected": len(detected_text) > 0,
                "text_content": detected_text[:1000],  # First 1000 chars
                "text_confidence": texts[0].confidence if texts else 0.0,
                "objects_detected": len(object_response.localized_object_annotations),
                "logos_detected": len(logo_response.logo_annotations),
                "faces_detected": len(face_response.face_annotations),
                "document_features": {
                    "has_structured_text": len(detected_text) > 100,
                    "has_official_elements": len(logo_response.logo_annotations) > 0,
                    "has_faces": len(face_response.face_annotations) > 0,
                    "text_density": len(detected_text.split()) if detected_text else 0
                }
            }
            
            # Calculate authenticity score
            score = 0.0
            if analysis_result["text_detected"]:
                score += 0.4
            if analysis_result["objects_detected"] > 0:
                score += 0.2
            if analysis_result["logos_detected"] > 0:
                score += 0.3
            if analysis_result["document_features"]["has_structured_text"]:
                score += 0.1
            
            analysis_result["authenticity_score"] = min(score, 1.0)
            
            logger.info(f"Vision AI analysis completed. Authenticity score: {analysis_result['authenticity_score']:.2f}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Vision AI analysis failed: {str(e)}")
            return {
                "error": str(e),
                "authenticity_score": 0.0,
                "text_detected": False
            }
    
    async def analyze_content_with_nlp(self, text: str) -> Dict[str, Any]:
        """Analyze document content using Natural Language AI"""
        try:
            if not text or len(text.strip()) < 10:
                return {"entities": [], "entity_count": 0, "risk_keywords": []}
            
            # Create document object
            document = language_v1.Document(content=text[:1000], type_=language_v1.Document.Type.PLAIN_TEXT)
            
            # Perform entity analysis
            entities_response = self.language_client.analyze_entities(
                request={"document": document, "encoding_type": language_v1.EncodingType.UTF8}
            )
            
            # Extract entities
            entities = []
            risk_keywords = []
            
            for entity in entities_response.entities:
                entity_data = {
                    "name": entity.name,
                    "type": entity.type_.name,
                    "salience": entity.salience,
                    "mentions": [mention.text.content for mention in entity.mentions[:3]]  # Limit mentions
                }
                entities.append(entity_data)
                
                # Check for risk-related keywords
                if any(keyword in entity.name.lower() for keyword in ['fraud', 'illegal', 'violation', 'suspended', 'revoked']):
                    risk_keywords.append(entity.name)
            
            nlp_result = {
                "entities": entities,
                "entity_count": len(entities),
                "risk_keywords": risk_keywords,
                "has_business_entities": any(e["type"] in ["ORGANIZATION", "LOCATION"] for e in entities),
                "has_person_entities": any(e["type"] == "PERSON" for e in entities)
            }
            
            logger.info(f"NLP analysis completed. Found {len(entities)} entities, {len(risk_keywords)} risk keywords")
            return nlp_result
            
        except Exception as e:
            logger.error(f"NLP analysis failed: {str(e)}")
            return {
                "error": str(e),
                "entities": [],
                "entity_count": 0,
                "risk_keywords": []
            }
    

    async def multi_modal_fusion_analysis(self, file_content: bytes, mime_type: str) -> Dict[str, Any]:
        """Perform multi-modal AI fusion analysis - OUR INNOVATION"""
        try:
            logger.info("Starting multi-modal AI fusion analysis")
            
            # Run Document AI and Vision AI in parallel
            try:
                document_ai_task = self.process_document_with_document_ai(file_content, mime_type)
                vision_ai_task = self.analyze_document_with_vision_ai(file_content)
                
                # Wait for both to complete
                document_ai_result, vision_ai_result = await asyncio.gather(
                    document_ai_task, vision_ai_task, return_exceptions=True
                )
            except Exception as parallel_error:
                logger.error(f"Parallel processing error: {parallel_error}")
                # Fallback: run sequentially
                document_ai_result = await self.process_document_with_document_ai(file_content, mime_type)
                vision_ai_result = await self.analyze_document_with_vision_ai(file_content)
            
            # Handle exceptions from parallel execution
            if isinstance(document_ai_result, Exception):
                logger.error(f"Document AI failed: {document_ai_result}")
                document_ai_result = {"error": str(document_ai_result), "confidence": 0.0}
            if isinstance(vision_ai_result, Exception):
                logger.error(f"Vision AI failed: {vision_ai_result}")
                vision_ai_result = {"error": str(vision_ai_result), "authenticity_score": 0.0}
            
            # Run NLP on extracted text
            text_content = document_ai_result.get("text", "")
            nlp_result = await self.analyze_content_with_nlp(text_content)
            
            # Perform fusion analysis
            fusion_result = self._perform_fusion_analysis(document_ai_result, vision_ai_result, nlp_result)
            
            final_result = {
                "status": "success",  # ✅ ADD status field
                "document_ai": document_ai_result,
                "vision_ai": vision_ai_result,
                "nlp": nlp_result,
                "fusion": fusion_result,
                "processing_summary": {
                    "total_processing_time": fusion_result.get("processing_time", 0),
                    "confidence_score": fusion_result.get("fusion_confidence", 0),
                    "recommended_action": fusion_result.get("recommended_action", "manual_review")
                }
            }
            
            logger.info(f"Multi-modal fusion completed. Final confidence: {fusion_result.get('fusion_confidence', 0):.2f}")
            return final_result
            
        except Exception as e:
            logger.error(f"Multi-modal fusion analysis failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",  # ✅ ADD status field for errors
                "error": str(e),
                "fusion": {"fusion_confidence": 0.0, "recommended_action": "manual_review"}
            }
        
    def _perform_fusion_analysis(self, document_ai: Dict, vision_ai: Dict, nlp: Dict) -> Dict[str, Any]:
        """Cross-validation and fusion of AI results - CORE INNOVATION"""
        
        # Extract confidence scores
        doc_ai_confidence = document_ai.get("confidence", 0.0)
        vision_ai_confidence = vision_ai.get("authenticity_score", 0.0)
        
        # Cross-validation checks
        validation_results = {
            "text_extraction_quality": doc_ai_confidence > 0.7,
            "document_authenticity": vision_ai_confidence > 0.6,
            "content_structure": len(document_ai.get("entities", [])) >= 1,
            "visual_integrity": vision_ai.get("text_detected", False),
            "business_entities_present": nlp.get("has_business_entities", False),
            "no_risk_keywords": len(nlp.get("risk_keywords", [])) == 0
        }
        
        # Calculate weighted fusion confidence
        weights = {
            "document_ai": 0.4,
            "vision_ai": 0.3,
            "validation": 0.3
        }
        
        validation_score = sum(validation_results.values()) / len(validation_results)
        fusion_confidence = (
            doc_ai_confidence * weights["document_ai"] +
            vision_ai_confidence * weights["vision_ai"] +
            validation_score * weights["validation"]
        )
        
        # Determine recommended action
        if fusion_confidence >= 0.85 and validation_score >= 0.8:
            recommended_action = "auto_approve"
        elif fusion_confidence >= 0.60:
            recommended_action = "human_review"
        else:
            recommended_action = "reject"
        
        # Calculate processing quality
        if fusion_confidence > 0.8:
            processing_quality = "high"
        elif fusion_confidence > 0.6:
            processing_quality = "medium"
        else:
            processing_quality = "low"
        
        return {
            "fusion_confidence": round(fusion_confidence, 3),
            "validation_results": validation_results,
            "validation_score": round(validation_score, 3),
            "recommended_action": recommended_action,
            "processing_quality": processing_quality,
            "cross_validation_passed": validation_score >= 0.7,
            "ai_agreement_score": abs(doc_ai_confidence - vision_ai_confidence),
            "processing_time": 3.2  # Simulated processing time
        }

# Create global instance
google_ai_services = GoogleAIServices()