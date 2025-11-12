"""
Script to create the analysis-uploads storage bucket in Supabase
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def create_bucket():
    """Create the analysis-uploads bucket if it doesn't exist"""

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        sys.exit(1)

    print(f"Connecting to Supabase at {supabase_url}...")

    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)

    bucket_name = "analysis-uploads"

    try:
        # Try to get the bucket info (to see if it exists)
        print(f"Checking if bucket '{bucket_name}' exists...")
        buckets = supabase.storage.list_buckets()

        bucket_exists = any(b['name'] == bucket_name for b in buckets)

        if bucket_exists:
            print(f"✓ Bucket '{bucket_name}' already exists!")
            return

        # Create the bucket
        print(f"Creating bucket '{bucket_name}'...")
        result = supabase.storage.create_bucket(
            bucket_name,
            options={
                "public": False,  # Private bucket
                "file_size_limit": 52428800,  # 50MB in bytes
                "allowed_mime_types": ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
            }
        )

        print(f"✓ Successfully created bucket '{bucket_name}'!")
        print(f"  - Public: False (private)")
        print(f"  - Max file size: 50MB")
        print(f"  - Allowed types: CSV, XLS, XLSX")

    except Exception as e:
        print(f"✗ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    create_bucket()
