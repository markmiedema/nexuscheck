"""
Check if interest_penalty_rates table has data for Texas
"""
import os
from supabase import create_client

# Get Supabase credentials from environment
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ ERROR: Missing Supabase credentials!")
    print("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
    exit(1)

print("Connecting to Supabase...")
supabase = create_client(supabase_url, supabase_key)

print("\n" + "=" * 70)
print("CHECKING INTEREST_PENALTY_RATES TABLE")
print("=" * 70)

# Check if table exists and has data for TX
try:
    result = supabase.table('interest_penalty_rates') \
        .select('*') \
        .eq('state_code', 'TX') \
        .is_('effective_to', 'null') \
        .execute()

    if result.data:
        print("\n✓ Found Texas configuration:")
        config = result.data[0]
        print(f"  State: {config.get('state_code')}")
        print(f"  Annual Interest Rate: {config.get('annual_interest_rate')} ({config.get('annual_interest_rate') * 100}%)")
        print(f"  Calculation Method: {config.get('interest_calculation_method')}")
        print(f"  Penalty Rate: {config.get('late_registration_penalty_rate')} ({config.get('late_registration_penalty_rate') * 100 if config.get('late_registration_penalty_rate') else 0}%)")
        print(f"  Penalty Applies To: {config.get('penalty_applies_to')}")
        print(f"  VDA Interest Waived: {config.get('vda_interest_waived')}")
        print(f"  VDA Penalties Waived: {config.get('vda_penalties_waived')}")
        print()
        print("✅ Texas configuration looks good!")
    else:
        print("\n❌ NO CONFIGURATION FOUND FOR TEXAS!")
        print("\n   This is why interest and penalties are 0.")
        print("\n   You need to populate the interest_penalty_rates table.")
        print("\n   Example SQL to add Texas config:")
        print("""
        INSERT INTO interest_penalty_rates (
            state_code,
            annual_interest_rate,
            interest_calculation_method,
            late_registration_penalty_rate,
            penalty_applies_to,
            vda_interest_waived,
            vda_penalties_waived,
            vda_lookback_period_months,
            effective_from
        ) VALUES (
            'TX',
            0.18,  -- 1.5% per month = 18% annual
            'compound_monthly',
            0.05,  -- 5% penalty
            'tax',
            false,
            true,
            48,
            '2019-01-01'
        );
        """)

except Exception as e:
    print(f"\n❌ ERROR querying database: {str(e)}")
    print("\n   The table might not exist or there's a connection issue.")

# Also check a few other states
print("\n" + "=" * 70)
print("CHECKING OTHER STATES")
print("=" * 70)

for state in ['CA', 'FL', 'IL', 'NY']:
    try:
        result = supabase.table('interest_penalty_rates') \
            .select('state_code, annual_interest_rate, interest_calculation_method') \
            .eq('state_code', state) \
            .is_('effective_to', 'null') \
            .execute()

        if result.data:
            config = result.data[0]
            print(f"✓ {state}: {config.get('interest_calculation_method')} @ {config.get('annual_interest_rate') * 100}%")
        else:
            print(f"✗ {state}: NOT CONFIGURED")
    except:
        pass

print("\n" + "=" * 70)
