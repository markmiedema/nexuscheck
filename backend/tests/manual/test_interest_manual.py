"""
Manual test script for Phase 2 interest calculator
Tests the three previously failing tests after fixes
"""

from unittest.mock import Mock
from datetime import datetime
from app.services.interest_calculator import InterestCalculator

# Create mock supabase and calculator
mock_supabase = Mock()
calculator = InterestCalculator(mock_supabase)

print("=" * 70)
print("PHASE 2 INTEREST CALCULATOR - MANUAL TEST")
print("=" * 70)

# ============================================================================
# Test 1: Simple Interest (California) - Was failing due to rounding
# ============================================================================
print("\n" + "=" * 70)
print("Test 1: Simple Interest (California)")
print("=" * 70)

config1 = {
    'annual_interest_rate': 0.03,
    'interest_calculation_method': 'simple',
    'late_registration_penalty_rate': 0.10,
    'penalty_applies_to': 'tax'
}

obligation_start = datetime(2022, 4, 1)
calculation_date = datetime(2024, 3, 31)  # Exactly 730 days, not exactly 2 years

result1 = calculator.calculate_interest_and_penalties(
    base_tax=10000,
    obligation_start_date=obligation_start,
    calculation_date=calculation_date,
    state_code='CA',
    interest_penalty_config=config1
)

print(f"Base Tax: $10,000")
print(f"Rate: 3% annual")
print(f"Days: {result1['days_outstanding']}")
print(f"Years: {result1['years_outstanding']}")
print(f"Interest: ${result1['interest']:,.2f}")
print(f"Penalties: ${result1['penalties']:,.2f}")

# Verify
test1_pass = abs(result1['interest'] - 600.00) < 1 and result1['penalties'] == 1000.00
print(f"\n✓ Test 1: {'PASS' if test1_pass else 'FAIL'}")
if test1_pass:
    print(f"  Interest ~$600 (got ${result1['interest']}) ✓")
    print(f"  Penalty $1,000 (got ${result1['penalties']}) ✓")

# ============================================================================
# Test 2: Compound Monthly (Texas) - Was failing due to wrong config
# ============================================================================
print("\n" + "=" * 70)
print("Test 2: Compound Monthly Interest (Texas)")
print("=" * 70)

config2 = {
    'annual_interest_rate': 0.18,  # FIXED: 1.5% per month = 18% annual
    'interest_calculation_method': 'compound_monthly',
    'late_registration_penalty_rate': 0.05,
    'penalty_applies_to': 'tax'
}

obligation_start2 = datetime(2022, 1, 1)
calculation_date2 = datetime(2024, 1, 1)  # 24 months

result2 = calculator.calculate_interest_and_penalties(
    base_tax=10000,
    obligation_start_date=obligation_start2,
    calculation_date=calculation_date2,
    state_code='TX',
    interest_penalty_config=config2
)

expected_interest2 = 10000 * ((1.015 ** 24) - 1)

print(f"Base Tax: $10,000")
print(f"Monthly Rate: 1.5% (18% annual)")
print(f"Months: 24")
print(f"Interest: ${result2['interest']:,.2f}")
print(f"Expected: ${expected_interest2:,.2f}")
print(f"Penalties: ${result2['penalties']:,.2f}")

# Verify
test2_pass = abs(result2['interest'] - expected_interest2) < 10 and result2['penalties'] == 500.00
print(f"\n✓ Test 2: {'PASS' if test2_pass else 'FAIL'}")
if test2_pass:
    print(f"  Interest ~${expected_interest2:,.2f} (got ${result2['interest']:,.2f}) ✓")
    print(f"  Penalty $500 (got ${result2['penalties']}) ✓")

# ============================================================================
# Test 3: Penalty on Tax + Interest - Was failing due to rounding
# ============================================================================
print("\n" + "=" * 70)
print("Test 3: Penalty Applies to Tax + Interest")
print("=" * 70)

config3 = {
    'annual_interest_rate': 0.03,
    'interest_calculation_method': 'simple',
    'late_registration_penalty_rate': 0.10,
    'penalty_applies_to': 'tax_plus_interest'
}

obligation_start3 = datetime(2022, 1, 1)
calculation_date3 = datetime(2024, 1, 1)  # 731 days (not exactly 2 years)

result3 = calculator.calculate_interest_and_penalties(
    base_tax=10000,
    obligation_start_date=obligation_start3,
    calculation_date=calculation_date3,
    state_code='FL',
    interest_penalty_config=config3
)

expected_penalty3 = (10000 + result3['interest']) * 0.10

print(f"Base Tax: $10,000")
print(f"Days: {result3['days_outstanding']}")
print(f"Interest: ${result3['interest']:,.2f}")
print(f"Penalty Base: ${10000 + result3['interest']:,.2f} (tax + interest)")
print(f"Penalty (10%): ${result3['penalties']:,.2f}")
print(f"Expected: ${expected_penalty3:,.2f}")

# Verify
test3_pass = abs(result3['interest'] - 600.00) < 5 and abs(result3['penalties'] - expected_penalty3) < 1
print(f"\n✓ Test 3: {'PASS' if test3_pass else 'FAIL'}")
if test3_pass:
    print(f"  Interest ~$600 (got ${result3['interest']:,.2f}) ✓")
    print(f"  Penalty ~${expected_penalty3:,.2f} (got ${result3['penalties']:,.2f}) ✓")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

all_pass = test1_pass and test2_pass and test3_pass

if all_pass:
    print("🎉 ALL 3 TESTS PASSED!")
    print("\nAll fixes applied successfully:")
    print("  1. Simple interest: Added tolerance for day-based calculation")
    print("  2. Compound monthly: Fixed annual rate (0.015 → 0.18)")
    print("  3. Penalty + interest: Added tolerance for calculation")
else:
    print("❌ Some tests failed:")
    if not test1_pass:
        print("  - Test 1 (Simple interest): FAILED")
    if not test2_pass:
        print("  - Test 2 (Compound monthly): FAILED")
    if not test3_pass:
        print("  - Test 3 (Penalty + interest): FAILED")

print("\n" + "=" * 70)
