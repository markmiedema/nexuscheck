"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Nexus Check API",
    version="1.0.0",
    description="API for automated sales tax nexus determination and liability estimation",
    debug=settings.DEBUG
)

# Configure CORS
cors_config = {
    "allow_origins": settings.allowed_origins_list,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

# Add regex pattern support for Vercel preview deployments if configured
if settings.ALLOWED_ORIGIN_REGEX:
    cors_config["allow_origin_regex"] = settings.ALLOWED_ORIGIN_REGEX
    logger.info(f"CORS: Using origin regex pattern: {settings.ALLOWED_ORIGIN_REGEX}")

app.add_middleware(CORSMiddleware, **cors_config)

# Log CORS configuration for debugging
logger.info(f"CORS: Allowed origins: {settings.allowed_origins_list}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nexus Check API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include API routers
from app.api.v1 import analyses, physical_nexus, vda

app.include_router(
    analyses.router,
    prefix=f"{settings.API_V1_PREFIX}/analyses",
    tags=["analyses"]
)

app.include_router(
    physical_nexus.router,
    prefix=f"{settings.API_V1_PREFIX}/analyses",
    tags=["physical_nexus"]
)

app.include_router(
    vda.router,
    prefix=f"{settings.API_V1_PREFIX}/analyses",
    tags=["vda"]
)

# TODO: Add more routers as they are implemented
# from app.api.v1 import upload, validation, processing, results, reports, users
# app.include_router(upload.router, prefix=f"{settings.API_V1_PREFIX}/upload", tags=["upload"])
# ... etc

logger.info(f"Nexus Check API starting in {settings.ENVIRONMENT} mode")
