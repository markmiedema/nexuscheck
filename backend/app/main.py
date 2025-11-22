"""FastAPI application entry point"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

# Create FastAPI app
app = FastAPI(
    title="Nexus Check API",
    version="1.0.0",
    description="API for automated sales tax nexus determination and liability estimation",
    debug=settings.DEBUG
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
cors_config = {
    "allow_origins": settings.allowed_origins_list,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
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
from app.api.v1 import analyses, physical_nexus, vda, clients, engagements

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

app.include_router(
    clients.router,
    prefix=f"{settings.API_V1_PREFIX}/clients",
    tags=["clients"]
)

app.include_router(
    engagements.router,
    prefix=f"{settings.API_V1_PREFIX}/engagements",
    tags=["engagements"]
)

# TODO: Add more routers as they are implemented
# from app.api.v1 import upload, validation, processing, results, reports, users
# app.include_router(upload.router, prefix=f"{settings.API_V1_PREFIX}/upload", tags=["upload"])
# ... etc

logger.info(f"Nexus Check API starting in {settings.ENVIRONMENT} mode")
