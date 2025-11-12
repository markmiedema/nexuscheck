"""Quick script to run the test manually"""
import sys
sys.path.insert(0, 'D:\\01 - Projects\\SALT-Tax-Tool-Clean\\backend')

from unittest.mock import Mock
from app.services.nexus_calculator import NexusCalculator

# Create mocks
mock_supabase = Mock()
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

print("Test Results:")
print(f"  nexus_type: {result['nexus_type']} (expected: 'economic') - {'PASS' if result['nexus_type'] == 'economic' else 'FAIL'}")
print(f"  total_sales: {result['total_sales']} (expected: 100000.0) - {'PASS' if result['total_sales'] == 100000.0 else 'FAIL'}")
print(f"  base_tax: {result['base_tax']} (expected: 8250.0) - {'PASS' if result['base_tax'] == 8250.0 else 'FAIL'}")
print(f"  estimated_liability: {result['estimated_liability']} (expected: 8250.0) - {'PASS' if result['estimated_liability'] == 8250.0 else 'FAIL'}")

# Check if test passes or fails
if result['base_tax'] == 8250.0 and result['estimated_liability'] == 8250.0:
    print("\nTEST PASSED!")
    sys.exit(0)
else:
    print(f"\nTEST FAILED!")
    print(f"  Expected: base_tax=8250.0, estimated_liability=8250.0")
    print(f"  Got: base_tax={result['base_tax']}, estimated_liability={result['estimated_liability']}")
    sys.exit(1)
