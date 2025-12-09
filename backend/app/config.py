"""Application configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Application
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    # Optional: Regex pattern for Vercel preview deployments
    # Example: r"https://.*\.vercel\.app$" to allow all Vercel preview URLs
    # WARNING: Be cautious with regex patterns when allow_credentials=True
    # Overly permissive patterns can create CSRF vulnerabilities
    ALLOWED_ORIGIN_REGEX: str | None = None

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "/tmp/uploads"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Rate Limiting
    # Default: 100 requests per minute per IP for general endpoints
    # Stricter limits applied to specific endpoints (login, upload, calculate)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"  # General endpoints
    RATE_LIMIT_AUTH: str = "5/minute"  # Login/signup endpoints
    RATE_LIMIT_UPLOAD: str = "10/minute"  # File upload endpoints
    RATE_LIMIT_CALCULATE: str = "20/minute"  # Calculation endpoints

    # Email (Resend)
    RESEND_API_KEY: str | None = None
    EMAIL_FROM_ADDRESS: str = "noreply@nexuscheck.com"
    EMAIL_FROM_NAME: str = "NexusCheck"
    APP_URL: str = "http://localhost:3000"  # Frontend URL for email links

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into list"""
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

        # Prevent wildcard origins (security: wildcards with credentials = CSRF vulnerability)
        if "*" in origins:
            raise ValueError(
                "Wildcard origin '*' is not allowed when using credentials. "
                "Specify explicit origins instead (e.g., https://yourapp.vercel.app)"
            )

        # Validate HTTPS in production (except localhost)
        if self.ENVIRONMENT == "production":
            for origin in origins:
                if not origin.startswith("https://") and not origin.startswith("http://localhost"):
                    raise ValueError(
                        f"Non-HTTPS origin '{origin}' not allowed in production. "
                        "Use HTTPS or localhost only."
                    )

        return origins

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
