"""
Test script for nexus calculation engine.
Tests the calculation endpoint and results summary endpoint.
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ANALYSIS_ID = "5b803d55-bb22-4c26-8433-145c4012bfc3"  # Test analysis from previous session

# You'll need to get a valid JWT token
# For testing, we can use the service role key or create a test token
JWT_TOKEN = input("Enter JWT token (or press Enter to skip auth check): ").strip()

headers = {}
if JWT_TOKEN:
    headers["Authorization"] = f"Bearer {JWT_TOKEN}"

def test_get_analysis():
    """Test getting analysis details"""
    print("\n=== Test 1: Get Analysis Details ===")
    response = requests.get(f"{BASE_URL}/analyses/{ANALYSIS_ID}", headers=headers)

    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analysis found: {data['client_company_name']}")
        print(f"   Period: {data['analysis_period_start']} to {data['analysis_period_end']}")
        print(f"   Status: {data['status']}")
        print(f"   Transactions: {data.get('total_transactions', 'N/A')}")
        print(f"   Unique States: {data.get('unique_states', 'N/A')}")
        return True
    else:
        print(f"❌ Failed: {response.text}")
        return False

def test_calculate_nexus():
    """Test running the nexus calculation"""
    print("\n=== Test 2: Run Nexus Calculation ===")
    response = requests.post(f"{BASE_URL}/analyses/{ANALYSIS_ID}/calculate", headers=headers)

    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Calculation completed successfully!")
        print(f"   Total States Analyzed: {data['summary']['total_states_analyzed']}")
        print(f"   States with Nexus: {data['summary']['states_with_nexus']}")
        print(f"   Total Estimated Liability: ${data['summary']['total_estimated_liability']:,.2f}")
        print(f"   States Approaching Threshold: {data['summary']['states_approaching_threshold']}")
        return True
    else:
        print(f"❌ Failed: {response.text}")
        return False

def test_get_results_summary():
    """Test getting results summary"""
    print("\n=== Test 3: Get Results Summary ===")
    response = requests.get(f"{BASE_URL}/analyses/{ANALYSIS_ID}/results/summary", headers=headers)

    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Results retrieved successfully!")
        print(f"\nSummary:")
        print(f"   Total States: {data['summary']['total_states_analyzed']}")
        print(f"   States with Nexus: {data['summary']['states_with_nexus']}")
        print(f"   Total Liability: ${data['summary']['total_estimated_liability']:,.2f}")

        print(f"\nNexus Breakdown:")
        print(f"   Economic Nexus: {data['nexus_breakdown']['economic_nexus']}")
        print(f"   Physical Nexus: {data['nexus_breakdown']['physical_nexus']}")
        print(f"   No Nexus: {data['nexus_breakdown']['no_nexus']}")

        print(f"\nTop 5 States by Liability:")
        for state in data['top_states_by_liability']:
            print(f"   {state['state']}: ${state['estimated_liability']:,.2f} ({state['nexus_type']})")

        return True
    else:
        print(f"❌ Failed: {response.text}")
        return False

def main():
    print("=" * 60)
    print("Testing Nexus Calculation Engine")
    print("=" * 60)

    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code != 200:
            print("❌ Backend is not responding. Please start the backend server:")
            print("   cd D:\\01 - Projects\\SALT-Tax-Tool-Clean\\backend")
            print("   python -m uvicorn app.main:app --reload --port 8000")
            sys.exit(1)
        print("✅ Backend server is running")
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to backend. Please start the backend server:")
        print("   cd D:\\01 - Projects\\SALT-Tax-Tool-Clean\\backend")
        print("   python -m uvicorn app.main:app --reload --port 8000")
        sys.exit(1)

    # Run tests
    results = []
    results.append(("Get Analysis", test_get_analysis()))
    results.append(("Calculate Nexus", test_calculate_nexus()))
    results.append(("Get Results Summary", test_get_results_summary()))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")

    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")

    if total_passed == len(results):
        print("\n🎉 All tests passed! Calculation engine is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
