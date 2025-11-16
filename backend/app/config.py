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
    ALLOWED_ORIGIN_REGEX: str | None = None

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "/tmp/uploads"

    # API
    API_V1_PREFIX: str = "/api/v1"

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into list"""
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

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
