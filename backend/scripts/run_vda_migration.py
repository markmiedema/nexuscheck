"""
Run VDA columns migration

This script adds VDA (Voluntary Disclosure Agreement) columns to the database.
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the VDA columns migration."""

    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        return False

    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)

    # Read migration SQL
    migration_path = Path(__file__).parent / 'migrations' / 'add_vda_columns.sql'

    if not migration_path.exists():
        print(f"ERROR: Migration file not found at {migration_path}")
        return False

    with open(migration_path, 'r') as f:
        sql = f.read()

    print("Running VDA columns migration...")
    print("-" * 60)

    try:
        # Execute the SQL using Supabase's RPC or direct SQL execution
        # Note: Supabase Python client doesn't have direct SQL execution
        # You'll need to run this in Supabase SQL Editor or use psycopg2

        print("\n⚠️  IMPORTANT:")
        print("The Supabase Python client doesn't support direct SQL execution.")
        print("\nPlease run the migration using one of these methods:")
        print("\n1. Supabase Dashboard (Recommended):")
        print("   - Go to https://supabase.com/dashboard")
        print("   - Select your project")
        print("   - Go to SQL Editor")
        print("   - Copy and paste the SQL from: backend/migrations/add_vda_columns.sql")
        print("   - Click 'Run'")
        print("\n2. psql command line:")
        print(f"   psql $SUPABASE_DB_URL < {migration_path}")
        print("\n" + "=" * 60)
        print("\nMigration SQL Preview:")
        print("-" * 60)
        print(sql)
        print("-" * 60)

        return None  # Return None to indicate manual action needed

    except Exception as e:
        print(f"\nERROR: Migration failed: {e}")
        return False

if __name__ == '__main__':
    result = run_migration()

    if result is False:
        sys.exit(1)
    elif result is None:
        print("\n✅ Migration script prepared.")
        print("Please run the SQL manually as instructed above.")
        sys.exit(0)
    else:
        print("\n✅ Migration completed successfully!")
        sys.exit(0)
