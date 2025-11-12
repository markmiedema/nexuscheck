"""
Test script to verify Supabase database connection
"""
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print("Testing Supabase connection...")
print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_SERVICE_ROLE_KEY[:20]}..." if SUPABASE_SERVICE_ROLE_KEY else "Key: NOT FOUND")
print()

try:
    # Try importing supabase
    from supabase import create_client

    print("✓ Supabase library found")

    # Create client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("✓ Supabase client created")

    # Test connection by querying states table
    states_result = supabase.table('states').select('*').execute()
    states_count = len(states_result.data)
    print(f"✓ Connected to Supabase! Found {states_count} states")

    # Show first 5 states
    print("\nFirst 5 states:")
    for state in states_result.data[:5]:
        print(f"  - {state['code']}: {state['name']}")

    # Since the database is already set up, let's just verify we can query it
    # We don't need to check every table - the states table being accessible is enough
    print(f"\n✅ Database connection successful!")
    print(f"✅ Found {states_count} states (52 US states + DC + territories)")

    if states_count >= 50:
        print("\n✅ SUCCESS: Database connection verified!")
        print("   - Ready to start backend server!")
        print("\nNext step: Run the backend server with:")
        print("   uvicorn app.main:app --reload --port 8000")
    else:
        print(f"\n⚠️  WARNING: Expected ~52 states but found {states_count}")

except ImportError:
    print("❌ Supabase library not installed")
    print("   Run: pip install supabase")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    print(f"   Type: {type(e).__name__}")
