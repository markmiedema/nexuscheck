"""
Quick test to verify the tax rate fix works correctly.
"""
import sys
sys.path.insert(0, 'D:\\01 - Projects\\SALT-Tax-Tool-Clean\\backend')

from unittest.mock import Mock
from app.services.nexus_calculator import NexusCalculator

def test_tax_rate_fix():
    """Test that tax rate is not divided by 100."""

    # Create mock supabase client
    mock_supabase = Mock()

    # Create calculator instance
    calculator = NexusCalculator(mock_supabase)

    # Tax rate stored in database as decimal
    tax_rate = {
        'state_rate': 0.0725,      # 7.25%
        'avg_local_rate': 0.0100,  # 1.00%
        'combined_rate': 0.0825    # 8.25%
    }

    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }

    # $100,000 in sales should trigger nexus and $8,250 liability
    result = calculator._determine_state_nexus(
        state_code='CA',
        total_sales=100000.0,
        transaction_count=150,
        direct_sales=100000.0,
        marketplace_sales=0.0,
        threshold=threshold,
        tax_rate=tax_rate
    )

    # Check results
    print(f"Nexus Type: {result['nexus_type']}")
    print(f"Total Sales: ${result['total_sales']:,.2f}")
    print(f"Base Tax: ${result['base_tax']:,.2f}")
    print(f"Estimated Liability: ${result['estimated_liability']:,.2f}")
    print()

    # Verify expectations
    assert result['nexus_type'] == 'economic', f"Expected 'economic', got '{result['nexus_type']}'"
    assert result['total_sales'] == 100000.0, f"Expected 100000.0, got {result['total_sales']}"

    # Critical: Tax should be $100,000 * 0.0825 = $8,250
    # NOT $100,000 * 0.000825 = $82.50 (the bug)
    expected_tax = 8250.0
    if result['base_tax'] == expected_tax:
        print(f"✓ PASS: Base tax is correct: ${result['base_tax']:,.2f} == ${expected_tax:,.2f}")
    else:
        print(f"✗ FAIL: Base tax is wrong: ${result['base_tax']:,.2f} != ${expected_tax:,.2f}")
        print(f"  Expected: ${expected_tax:,.2f}")
        print(f"  Got: ${result['base_tax']:,.2f}")
        sys.exit(1)

    if result['estimated_liability'] == expected_tax:
        print(f"✓ PASS: Estimated liability is correct: ${result['estimated_liability']:,.2f} == ${expected_tax:,.2f}")
    else:
        print(f"✗ FAIL: Estimated liability is wrong: ${result['estimated_liability']:,.2f} != ${expected_tax:,.2f}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("ALL TESTS PASSED! Tax rate bug is FIXED! ✓")
    print("=" * 60)
    print()
    print("The fix removed the '/ 100' division that was causing")
    print("liability to be 100x too low.")

    return True

if __name__ == '__main__':
    try:
        test_tax_rate_fix()
    except Exception as e:
        print(f"✗ TEST FAILED with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
