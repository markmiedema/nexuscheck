# CSV Template Guide

## Available Templates

### 1. `sales_data_template.csv` (Basic)
**Required columns:**
- `transaction_date` - Date of transaction (YYYY-MM-DD, MM/DD/YYYY, etc.)
- `customer_state` - State code (CA, NY) or name (California, New York)
- `revenue_amount` - Transaction amount (can be negative for returns)
- `sales_channel` - Either "direct" or "marketplace" (or variants like "Amazon", "Website")

### 2. `sales_data_with_exemptions_template.csv` (With Optional Columns)
**All columns:**
- Required columns (same as basic template)
- `is_taxable` - Y/N flag indicating if transaction is taxable
- `exempt_amount` - Dollar amount that is exempt from tax
- `revenue_stream` - Product category (Software, Groceries, Clothing, etc.)

## Optional Columns Explained

### `is_taxable` (Y/N)
- Use when entire transaction is taxable or exempt
- `Y` = fully taxable
- `N` = fully exempt (common for groceries, clothing in some states)

### `exempt_amount` (Dollar value)
- Use for partial exemptions
- Example: $100 sale with $30 exempt → `exempt_amount` = 30.00
- Takes priority over `is_taxable` if both are provided

### `revenue_stream` (Text)
- Product category or business line
- Examples: Software, Groceries, Clothing, Manufacturing_Equipment
- Used for categorization and reporting

## Column Detection Features

The system automatically handles:
- **State names** → Converts "California" to "CA", "New York" to "NY", etc.
- **Date formats** → Accepts MM/DD/YYYY, YYYY-MM-DD, Jan 15, 2024, etc.
- **Sales channels** → Converts "Amazon" to "marketplace", "Website" to "direct", etc.

## Test Files

- `test_exempt_sales_grocery.csv` - All exempt grocery sales
- `test_mixed_taxable_exempt.csv` - Mix of taxable, exempt, partial, and returns
- `test_clothing_partial_exempt.csv` - Clothing with partial exemptions

## Common Scenarios

**Fully Taxable Sale:**
```csv
2024-01-01,CA,100.00,direct,Y,0.00,Software
```

**Fully Exempt Sale (Groceries):**
```csv
2024-01-02,CA,50.00,direct,N,50.00,Groceries
```

**Partial Exemption (Clothing under $110 in NY):**
```csv
2024-01-03,NY,150.00,direct,Y,110.00,Clothing
```

**Return/Refund:**
```csv
2024-01-04,CA,-25.00,direct,Y,0.00,Software
```

**Marketplace Sale:**
```csv
2024-01-05,TX,200.00,marketplace,Y,0.00,Electronics
```

## Need Help?

- For basic testing, use `sales_data_template.csv`
- For industries with exemptions (grocery, clothing, manufacturing), use `sales_data_with_exemptions_template.csv`
- For comprehensive testing, use the `test_*.csv` files
