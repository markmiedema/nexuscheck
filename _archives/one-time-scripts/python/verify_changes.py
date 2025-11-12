"""
Verification script to check if Task 5 changes are correctly implemented.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 80)
print("TASK 5 IMPLEMENTATION VERIFICATION")
print("=" * 80)

# Check the changes in nexus_calculator.py
print("\n1. Checking _determine_state_nexus implementation...")

try:
    from app.services.nexus_calculator import NexusCalculator
    from unittest.mock import Mock

    # Create a mock calculator
    mock_supabase = Mock()
    calculator = NexusCalculator(mock_supabase)

    # Test scenario from the test
    tax_rate = {'combined_rate': 0.0825}
    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }
    mf_rules = {
        'has_mf_law': True,
        'count_toward_threshold': True,
        'exclude_from_liability': True
    }

    result = calculator._determine_state_nexus(
        state_code='CA',
        total_sales=150000.0,
        transaction_count=250,
        direct_sales=100000.0,
        marketplace_sales=50000.0,
        threshold=threshold,
        tax_rate=tax_rate,
        mf_rules=mf_rules
    )

    print("   Result obtained successfully!")
    print(f"   - Nexus type: {result['nexus_type']}")
    print(f"   - Total sales: ${result['total_sales']:,.2f}")
    print(f"   - Direct sales: ${result['direct_sales']:,.2f}")
    print(f"   - Marketplace sales: ${result['marketplace_sales']:,.2f}")
    print(f"   - Taxable sales: ${result.get('taxable_sales', 'NOT FOUND'):,.2f}" if isinstance(result.get('taxable_sales'), (int, float)) else f"   - Taxable sales: {result.get('taxable_sales', 'NOT FOUND')}")
    print(f"   - Base tax: ${result['base_tax']:,.2f}")
    print(f"   - Estimated liability: ${result['estimated_liability']:,.2f}")

    # Verify the expected values
    print("\n2. Verifying expected values...")

    errors = []

    if result['nexus_type'] != 'economic':
        errors.append(f"   ERROR: nexus_type should be 'economic', got '{result['nexus_type']}'")
    else:
        print("   ✓ Nexus type is correct (economic)")

    if 'taxable_sales' not in result:
        errors.append("   ERROR: 'taxable_sales' not in result dict")
    else:
        print("   ✓ 'taxable_sales' is in result dict")

        if result['taxable_sales'] != 100000.0:
            errors.append(f"   ERROR: taxable_sales should be 100000.0 (direct_sales), got {result['taxable_sales']}")
        else:
            print("   ✓ Taxable sales is correct (100000.0 = direct_sales)")

    if result['base_tax'] != 8250.0:
        errors.append(f"   ERROR: base_tax should be 8250.0 ($100K × 8.25%), got {result['base_tax']}")
    else:
        print("   ✓ Base tax is correct (8250.0)")

    if result['estimated_liability'] != 8250.0:
        errors.append(f"   ERROR: estimated_liability should be 8250.0, got {result['estimated_liability']}")
    else:
        print("   ✓ Estimated liability is correct (8250.0)")

    if errors:
        print("\n❌ VERIFICATION FAILED:")
        for error in errors:
            print(error)
        sys.exit(1)
    else:
        print("\n" + "=" * 80)
        print("✅ ALL VERIFICATIONS PASSED!")
        print("=" * 80)
        print("\nTask 5 implementation is correct:")
        print("  • Marketplace sales are excluded from liability calculation")
        print("  • Taxable sales = direct_sales when MF rules exclude_from_liability = True")
        print("  • Liability calculated correctly: $100K × 8.25% = $8,250")
        print("  • (NOT $150K × 8.25% = $12,375)")
        sys.exit(0)

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
