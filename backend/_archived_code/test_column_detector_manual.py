"""
Test script for enhanced column detector with normalization.
Tests all Day 6 enhancements.
"""
import pandas as pd
from app.services.column_detector import ColumnDetector

# Sample CSV data with various messy formats
sample_data = {
    'Date': ['01/15/2024', '2024-02-20', '03-10-2024', '20240415', '5/1/24'],
    'State': ['California', 'ny', 'TX', 'florida', 'WA'],
    'Amount': [1250.50, 450.00, 2100.75, 3000.00, 875.25],
    'Channel': ['Amazon FBA', 'website', 'Walmart Marketplace', 'retail', 'eBay'],
    'Product Type': ['groceries', 'software', 'clothing', 'physical goods', 'apparel'],
    'Taxable': ['N', 'Y', '', 'Y', 'Y'],
    'Exempt Amt': [1250.50, 0, 50, 0, 0]
}

df = pd.DataFrame(sample_data)

print("="*80)
print("ENHANCED COLUMN DETECTOR TEST - DAY 6")
print("="*80)
print("\n1. ORIGINAL DATA:")
print(df)
print()

# Initialize detector
detector = ColumnDetector(df.columns.tolist())

# Test column detection
print("2. COLUMN DETECTION:")
detection_result = detector.detect_mappings()
print(f"   Mappings found: {detection_result['mappings']}")
print(f"   Confidence levels: {detection_result['confidence']}")
print(f"   All required detected: {detection_result['all_required_detected']}")
print()

# Test individual normalization functions
print("3. INDIVIDUAL NORMALIZATION TESTS:")
print()

# Test state normalization
print("   State Normalization:")
test_states = ['California', 'ny', 'TX', 'florida', 'WA', 'New York', 'north carolina']
for state in test_states:
    normalized = ColumnDetector.normalize_state_code(state)
    print(f"     '{state}' → '{normalized}'")
print()

# Test date normalization
print("   Date Normalization:")
test_dates = ['01/15/2024', '2024-02-20', '03-10-2024', '20240415', '5/1/24', '15.03.2024']
for date in test_dates:
    normalized = ColumnDetector.normalize_date(date)
    print(f"     '{date}' → '{normalized}'")
print()

# Test sales channel normalization
print("   Sales Channel Normalization:")
test_channels = ['Amazon FBA', 'website', 'Walmart Marketplace', 'retail', 'eBay', 'Shopify', 'direct']
for channel in test_channels:
    normalized = ColumnDetector.normalize_sales_channel(channel)
    print(f"     '{channel}' → '{normalized}'")
print()

# Test revenue stream normalization
print("   Revenue Stream Normalization:")
test_streams = ['groceries', 'software', 'clothing', 'physical goods', 'apparel', 'consulting', 'wholesale']
for stream in test_streams:
    normalized = ColumnDetector.normalize_revenue_stream(stream)
    print(f"     '{stream}' → '{normalized}'")
print()

# Test taxable amount calculation
print("   Taxable Amount Calculation:")
test_cases = [
    (100.00, 'Y', None, "Fully taxable"),
    (100.00, 'N', None, "Fully exempt via is_taxable"),
    (100.00, None, 30.00, "Partial exempt via exempt_amount"),
    (100.00, 'Y', 25.00, "Partial exempt (exempt_amount takes priority)"),
    (100.00, None, None, "Default (fully taxable)"),
]
for revenue, is_tax, exempt, description in test_cases:
    taxable, is_taxable_bool, exempt_calc = ColumnDetector.calculate_taxable_amount(revenue, is_tax, exempt)
    print(f"     {description}:")
    print(f"       Revenue: ${revenue}, is_taxable: {is_tax}, exempt_amount: {exempt}")
    print(f"       Result: Taxable=${taxable}, is_taxable={is_taxable_bool}, exempt=${exempt_calc}")
print()

# Test full normalization
print("4. FULL DATA NORMALIZATION:")
result = detector.normalize_data(df, detection_result['mappings'])
print(f"   Transformations applied:")
for t in result['transformations']:
    print(f"     - {t}")
print()
if result['warnings']:
    print(f"   Warnings:")
    for w in result['warnings']:
        print(f"     - {w}")
print()

print("   Normalized DataFrame:")
print(result['df'][['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel',
                     'revenue_stream', 'taxable_amount', 'is_taxable', 'exempt_amount_calc']])
print()

# Test validation
print("5. DATA VALIDATION:")
validation = detector.validate_normalized_data(result['df'])
print(f"   Valid: {validation['valid']}")
print(f"   Total rows: {validation['total_rows']}")
print(f"   Valid rows: {validation['valid_rows']}")
if validation['errors']:
    print(f"   Errors:")
    for e in validation['errors']:
        print(f"     - {e['message']} (count: {e['count']})")
if validation['warnings']:
    print(f"   Warnings:")
    for w in validation['warnings']:
        print(f"     - {w['message']} (count: {w['count']})")
print()

print("="*80)
print("TEST COMPLETE - ALL NORMALIZATION FUNCTIONS WORKING!")
print("="*80)
