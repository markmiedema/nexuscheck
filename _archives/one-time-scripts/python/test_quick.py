"""Quick test to verify marketplace facilitator test would fail"""
from unittest.mock import Mock
from app.services.nexus_calculator import NexusCalculator

# Create mock and calculator
mock_supabase = Mock()
calculator = NexusCalculator(mock_supabase)

tax_rate = {
    'combined_rate': 0.0825  # 8.25%
}

threshold = {
    'revenue_threshold': 100000,
    'transaction_threshold': 200,
    'threshold_operator': 'or'
}

# $100K direct + $50K marketplace = $150K total
# Current implementation calculates on $150K total
# Expected (after fix): Calculate on $100K direct only
result = calculator._determine_state_nexus(
    state_code='CA',
    total_sales=150000.0,
    transaction_count=250,
    direct_sales=100000.0,
    marketplace_sales=50000.0,
    threshold=threshold,
    tax_rate=tax_rate
)

print(f"Nexus type: {result['nexus_type']}")
print(f"Total sales: ${result['total_sales']:,.2f}")
print(f"Direct sales: ${result['direct_sales']:,.2f}")
print(f"Marketplace sales: ${result['marketplace_sales']:,.2f}")
print(f"Base tax (ACTUAL): ${result['base_tax']:,.2f}")
print(f"Estimated liability (ACTUAL): ${result['estimated_liability']:,.2f}")
print()
print(f"Expected base_tax: $8,250.00 ($100K × 8.25%)")
print(f"Expected estimated_liability: $8,250.00")
print()

# Check if test would fail
if result['base_tax'] == 8250.0:
    print("✅ TEST WOULD PASS - Implementation already correct")
else:
    print("❌ TEST WOULD FAIL - Implementation needs fix")
    print(f"   Current: ${result['base_tax']:,.2f}")
    print(f"   Expected: $8,250.00")
    print(f"   Difference: ${result['base_tax'] - 8250.0:,.2f}")
