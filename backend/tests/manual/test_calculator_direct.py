"""
Direct test of NexusCalculator without API layer.
This bypasses the API and tests the calculator logic directly.
"""
import sys
import os
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from app.core.supabase import get_supabase
from app.services.nexus_calculator import NexusCalculator

# Test analysis ID from previous session
ANALYSIS_ID = "5b803d55-bb22-4c26-8433-145c4012bfc3"

def main():
    print("=" * 70)
    print("Direct Test: Nexus Calculation Engine")
    print("=" * 70)

    try:
        # Get Supabase client
        print("\n[1/6] Connecting to Supabase...")
        supabase = get_supabase()
        print("✅ Connected to Supabase")

        # Verify analysis exists
        print(f"\n[2/6] Verifying analysis {ANALYSIS_ID}...")
        analysis_result = supabase.table('analyses').select('*').eq('id', ANALYSIS_ID).execute()

        if not analysis_result.data:
            print(f"❌ Analysis {ANALYSIS_ID} not found")
            print("   Please create a new analysis and upload transactions first.")
            return

        analysis = analysis_result.data[0]
        print(f"✅ Found analysis: {analysis['client_company_name']}")
        print(f"   Period: {analysis['analysis_period_start']} to {analysis['analysis_period_end']}")
        print(f"   Status: {analysis['status']}")

        # Check for transactions
        print(f"\n[3/6] Checking for transactions...")
        transactions_result = supabase.table('sales_transactions') \
            .select('id, customer_state, sales_amount') \
            .eq('analysis_id', ANALYSIS_ID) \
            .execute()

        if not transactions_result.data:
            print("❌ No transactions found for this analysis")
            print("   Please upload a CSV file first.")
            return

        transaction_count = len(transactions_result.data)
        unique_states = len(set(t['customer_state'] for t in transactions_result.data))
        total_sales = sum(float(t['sales_amount']) for t in transactions_result.data)

        print(f"✅ Found {transaction_count} transactions")
        print(f"   Unique states: {unique_states}")
        print(f"   Total sales: ${total_sales:,.2f}")

        # Initialize calculator
        print(f"\n[4/6] Initializing NexusCalculator...")
        calculator = NexusCalculator(supabase)
        print("✅ Calculator initialized")

        # Run calculation
        print(f"\n[5/6] Running nexus calculation...")
        print("   This may take a few seconds...")
        result = calculator.calculate_nexus_for_analysis(ANALYSIS_ID)
        print("✅ Calculation completed!")

        # Display results
        print(f"\n[6/6] Results Summary:")
        print("-" * 70)
        print(f"   Total States Analyzed: {result['total_states_analyzed']}")
        print(f"   States with Nexus: {result['states_with_nexus']}")
        print(f"   States Approaching Threshold: {result['states_approaching_threshold']}")
        print(f"   Total Estimated Liability: ${result['total_estimated_liability']:,.2f}")
        print(f"   Status: {result['status']}")

        # Get detailed results from database
        print(f"\n[Bonus] Detailed State Results:")
        print("-" * 70)
        state_results = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', ANALYSIS_ID) \
            .execute()

        # Sort by liability descending
        states_with_nexus = [s for s in state_results.data if s['nexus_type'] in ['economic', 'physical', 'both']]
        states_with_nexus.sort(key=lambda x: float(x['estimated_liability'] or 0), reverse=True)

        if states_with_nexus:
            print(f"\n   States with Nexus ({len(states_with_nexus)}):")
            for state in states_with_nexus:
                print(f"      {state['state']}: ${float(state['estimated_liability']):,.2f}")
                print(f"         - Type: {state['nexus_type']}")
                print(f"         - Total Sales: ${float(state['total_sales']):,.2f}")
                print(f"         - Direct Sales: ${float(state['direct_sales']):,.2f}")
                print(f"         - Marketplace Sales: ${float(state['marketplace_sales']):,.2f}")
                print()

        # States without nexus
        states_no_nexus = [s for s in state_results.data if s['nexus_type'] == 'none']
        if states_no_nexus:
            print(f"   States without Nexus ({len(states_no_nexus)}):")
            for state in states_no_nexus:
                print(f"      {state['state']}: ${float(state['total_sales']):,.2f} in sales (below threshold)")

        print("\n" + "=" * 70)
        print("🎉 Test completed successfully!")
        print("=" * 70)

        # Verify analysis was updated
        updated_analysis = supabase.table('analyses').select('*').eq('id', ANALYSIS_ID).execute()
        if updated_analysis.data:
            updated = updated_analysis.data[0]
            print(f"\nAnalysis Status Updated:")
            print(f"   Status: {updated['status']}")
            print(f"   Total Liability: ${float(updated['total_liability'] or 0):,.2f}")
            print(f"   States with Nexus: {updated['states_with_nexus']}")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    main()
