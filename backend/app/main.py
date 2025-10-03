# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from .core.config import settings
from .api import merchants_new
from .api import merchants  # ✅ ADD THIS LINE
from .api import merchants_simple
from .api import contracts

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Revolutionary AI-powered merchant onboarding with Google Cloud AI",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# # ✅ ADD THIS LINE - Include API routes
app.include_router(merchants.router, prefix=settings.API_V1_STR, tags=["merchants"])
# Add this line after the existing merchants router
app.include_router(merchants_new.router, prefix=settings.API_V1_STR, tags=["merchants-test"])

app.include_router(merchants_simple.router, prefix=settings.API_V1_STR, tags=["merchants-simple"])

app.include_router(contracts.router, prefix=settings.API_V1_STR, tags=["contracts"]) 

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "api": f"{settings.API_V1_STR}",
        "status": "ready"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_services": "google_cloud",
        "database": "postgresql",
        "version": settings.VERSION
    }

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )