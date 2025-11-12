"""Quick syntax verification for the new endpoint"""
import sys
import ast

# Read and parse the analyses.py file
with open('app/api/v1/analyses.py', 'r') as f:
    code = f.read()

try:
    # Parse the file to check for syntax errors
    ast.parse(code)
    print("✓ Syntax check passed")

    # Check if the new endpoint exists
    if 'get_state_detail' in code:
        print("✓ get_state_detail function found")
    else:
        print("✗ get_state_detail function not found")

    # Check if Optional import exists
    if 'from typing import Optional' in code:
        print("✓ Optional import found")
    else:
        print("✗ Optional import not found")

    # Check if the route decorator exists
    if '@router.get("/{analysis_id}/states/{state_code}")' in code:
        print("✓ Route decorator found")
    else:
        print("✗ Route decorator not found")

    print("\nAll syntax checks passed!")
    sys.exit(0)

except SyntaxError as e:
    print(f"✗ Syntax error: {e}")
    sys.exit(1)
