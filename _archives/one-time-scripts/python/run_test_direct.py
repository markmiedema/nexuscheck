import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import pytest
import pytest

# Run the specific test
exit_code = pytest.main([
    'tests/test_nexus_calculator.py::test_marketplace_sales_excluded_from_liability',
    '-v',
    '--tb=short'
])

print(f"\n\nTest exit code: {exit_code}")
print("Exit code 0 = SUCCESS, non-zero = FAILURE")
sys.exit(exit_code)
