"""Supabase client initialization"""
from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client with service role key
# Note: RLS policies are still enforced even with service role key
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

logger.info("Supabase client initialized")


def get_supabase() -> Client:
    """Get Supabase client instance"""
    return supabase
