"""
Manual test script for rolling 12-month logic
"""

from unittest.mock import Mock
from app.services.nexus_calculator_v2 import NexusCalculatorV2

# Create mock supabase and calculator
mock_supabase = Mock()
calculator = NexusCalculatorV2(mock_supabase)

# Test Illinois rolling 12-month basic scenario
transactions = [
    # January 2024
    {'id': 'TX001', 'transaction_date': '2024-01-15T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    # February 2024
    {'id': 'TX002', 'transaction_date': '2024-02-10T00:00:00Z', 'sales_amount': 25000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    # March 2024
    {'id': 'TX003', 'transaction_date': '2024-03-08T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    # April 2024 - CROSSES THRESHOLD
    {'id': 'TX004', 'transaction_date': '2024-04-12T00:00:00Z', 'sales_amount': 35000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    # May 2024
    {'id': 'TX005', 'transaction_date': '2024-05-20T00:00:00Z', 'sales_amount': 10000, 'sales_channel': 'direct', 'customer_state': 'IL'},
]

threshold_config = {
    'revenue_threshold': 100000,
    'transaction_threshold': 200,
    'threshold_operator': 'or',
    'lookback_period': 'Rolling 12 Months'
}

tax_rate_config = {
    'state_rate': 0.0625,
    'avg_local_rate': 0.0267,
    'combined_rate': 0.0892
}

mf_rule = {
    'has_mf_law': True,
    'exclude_from_liability': True
}

# Calculate nexus
print("Testing Illinois Rolling 12-Month Logic...")
print("=" * 60)

try:
    results = calculator._calculate_state_nexus_multi_year(
        state_code='IL',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    print(f"\n✓ Calculation completed successfully!")
    print(f"  Number of results: {len(results)}")

    for result in results:
        print(f"\n--- Year {result['year']} ---")
        print(f"  Nexus Type: {result['nexus_type']}")
        print(f"  Nexus Date: {result.get('nexus_date', 'N/A')}")
        print(f"  Obligation Start: {result.get('obligation_start_date', 'N/A')}")
        print(f"  First Nexus Year: {result.get('first_nexus_year', 'N/A')}")
        print(f"  Total Sales: ${result['total_sales']:,.2f}")
        print(f"  Taxable Sales: ${result['taxable_sales']:,.2f}")
        print(f"  Estimated Liability: ${result['estimated_liability']:,.2f}")

    # Validate key assertions
    print("\n" + "=" * 60)
    print("VALIDATION:")
    print("=" * 60)

    result = results[0]

    checks = [
        ("Number of results", len(results) == 1, f"Expected 1, got {len(results)}"),
        ("Year", result['year'] == 2024, f"Expected 2024, got {result['year']}"),
        ("Nexus type", result['nexus_type'] == 'economic', f"Expected 'economic', got '{result['nexus_type']}'"),
        ("Nexus date", result['nexus_date'] == '2024-04-12', f"Expected '2024-04-12', got '{result['nexus_date']}'"),
        ("Obligation start", result['obligation_start_date'] == '2024-05-01', f"Expected '2024-05-01', got '{result['obligation_start_date']}'"),
        ("First nexus year", result['first_nexus_year'] == 2024, f"Expected 2024, got {result['first_nexus_year']}"),
        ("Total sales", result['total_sales'] == 120000, f"Expected $120,000, got ${result['total_sales']:,.2f}"),
        ("Taxable sales", result['taxable_sales'] == 10000, f"Expected $10,000, got ${result['taxable_sales']:,.2f}"),
    ]

    all_passed = True
    for check_name, passed, message in checks:
        status = "✓" if passed else "✗"
        print(f"  {status} {check_name}: {'PASS' if passed else 'FAIL - ' + message}")
        if not passed:
            all_passed = False

    if all_passed:
        print("\n🎉 ALL CHECKS PASSED! Rolling 12-month logic is working correctly.")
    else:
        print("\n❌ Some checks failed. Review the output above.")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
