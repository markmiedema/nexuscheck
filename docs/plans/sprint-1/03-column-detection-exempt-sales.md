# Phase 3: Enhanced Column Detection + Exempt Sales (Days 6-8)

**Goal:** Improve CSV handling with better normalization and add critical exempt sales support to properly distinguish between gross sales (for nexus) and taxable sales (for liability).

**Why This Matters:** Real-world CSVs are messy. Better normalization reduces user frustration. Exempt sales support is CRITICAL for accuracy in industries with exemptions (grocery, clothing, manufacturing, resale certificates).

---

## Overview

This phase has two major components:

1. **Enhanced Column Detection** (Days 6-7)
   - More column aliases
   - Date format auto-detection
   - State name normalization
   - Sales channel mapping
   - Preview transformations

2. **Exempt Sales Support** (Day 8)
   - `is_taxable` column support (boolean)
   - `exempt_amount` column support (dollar value)
   - Hybrid calculation logic
   - Gross vs. taxable distinction
   - UI updates

---

## Days 6-7: Enhanced Column Detection

### Expand Column Patterns

**File:** `backend/app/services/column_detector.py` (UPDATE)

```python
"""Service for auto-detecting column mappings from CSV headers"""
from typing import Dict, List
import pandas as pd
import re
from datetime import datetime


class ColumnDetector:
    """
    Auto-detect which columns map to required fields based on column names.

    Enhanced with:
    - More aliases per field
    - Case-insensitive + whitespace handling
    - Pattern matching (regex)
    - Confidence scoring
    """

    # Patterns ordered by confidence (first = highest)
    COLUMN_PATTERNS = {
        'transaction_date': [
            'transaction_date', 'transaction date',
            'date', 'order_date', 'order date',
            'sale_date', 'sale date', 'sales_date',
            'txn_date', 'trans_date', 'transaction_dt',
            'invoice_date', 'invoice date',
            'purchase_date', 'purchase date',
            'created_date', 'created_at',
            'order_created', 'order_timestamp'
        ],
        'customer_state': [
            'customer_state', 'customer state',
            'state', 'buyer_state', 'buyer state',
            'ship_to_state', 'ship to state', 'shipto_state',
            'shipping_state', 'shipping state',
            'customer_location', 'destination_state',
            'dest_state', 'to_state',
            'delivery_state', 'recipient_state',
            'customer_province', 'province'  # For Canadian data
        ],
        'revenue_amount': [
            'revenue_amount', 'revenue amount', 'revenue',
            'amount', 'sales_amount', 'sales amount', 'sales',
            'total', 'total_amount', 'total amount',
            'price', 'sale_amount',
            'order_total', 'order total',
            'gross_sales', 'gross sales',
            'line_total', 'subtotal', 'net_amount'
        ],
        'sales_channel': [
            'sales_channel', 'sales channel',
            'channel', 'source', 'order_source', 'order source',
            'marketplace', 'platform', 'seller',
            'sale_channel', 'sales_source',
            'fulfillment_channel', 'order_channel'
        ],
        # NEW: Exempt sales columns
        'is_taxable': [
            'is_taxable', 'is taxable', 'taxable',
            'tax_status', 'tax status', 'taxability',
            'exempt', 'is_exempt', 'is exempt',
            'taxable_flag', 'tax_exempt', 'tax exempt',
            'exemption_status'
        ],
        'exempt_amount': [
            'exempt_amount', 'exempt amount', 'exempt',
            'exempt_sales', 'exempt sales',
            'non_taxable_amount', 'non taxable amount',
            'exemption_amount', 'exemption amount',
            'exempt_amt', 'tax_exempt_amount'
        ]
    }

    # State name mapping
    STATE_NAME_TO_CODE = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
        'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
        'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
        'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
        'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
        'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
        'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
        'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
        'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
        'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
        'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
    }

    def __init__(self, columns: List[str]):
        """
        Initialize detector with CSV column names.

        Args:
            columns: List of column names from CSV
        """
        self.columns = columns
        self.normalized_columns = [self._normalize_column_name(col) for col in columns]

    def _normalize_column_name(self, col: str) -> str:
        """Normalize column name for matching."""
        return col.lower().strip().replace('_', ' ').replace('-', ' ')

    def detect_mappings(self) -> Dict:
        """
        Detect column mappings with confidence scores.

        Returns:
            Dict with:
                - mappings: Dict of field -> detected column name (original)
                - confidence: Dict of field -> confidence level
                - all_required_detected: Boolean
                - optional_detected: List of optional fields detected
        """
        mappings = {}
        confidence = {}

        for field, patterns in self.COLUMN_PATTERNS.items():
            for i, pattern in enumerate(patterns):
                # Try exact match (normalized)
                normalized_pattern = self._normalize_column_name(pattern)

                for orig_col, norm_col in zip(self.columns, self.normalized_columns):
                    if norm_col == normalized_pattern:
                        mappings[field] = orig_col

                        # Assign confidence based on pattern position
                        if i == 0:
                            confidence[field] = 'high'
                        elif i < 3:
                            confidence[field] = 'medium'
                        else:
                            confidence[field] = 'low'
                        break

                if field in mappings:
                    break

        # Required fields
        required_fields = ['transaction_date', 'customer_state', 'revenue_amount']
        all_required = all(field in mappings for field in required_fields)

        # Optional fields
        optional_fields = ['sales_channel', 'is_taxable', 'exempt_amount']
        optional_detected = [field for field in optional_fields if field in mappings]

        return {
            'mappings': mappings,
            'confidence': confidence,
            'all_required_detected': all_required,
            'optional_detected': optional_detected,
            'missing_required': [f for f in required_fields if f not in mappings]
        }

    def normalize_data(self, df: pd.DataFrame, mappings: Dict) -> pd.DataFrame:
        """
        Normalize data after column mapping.

        Performs:
        - Date format conversion
        - State name → code conversion
        - Sales channel normalization
        - Exempt sales calculation
        """
        df = df.copy()

        # Rename columns based on mappings
        rename_dict = {v: k for k, v in mappings.items()}
        df = df.rename(columns=rename_dict)

        # Normalize dates
        if 'transaction_date' in df.columns:
            df = self._normalize_dates(df)

        # Normalize state codes
        if 'customer_state' in df.columns:
            df = self._normalize_state_codes(df)

        # Normalize sales channel
        if 'sales_channel' in df.columns:
            df = self._normalize_sales_channel(df)

        # Calculate taxable amount
        df = self._calculate_taxable_amount(df, mappings)

        return df

    def _normalize_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Auto-detect and convert date formats.

        Tries multiple common formats and uses pandas fallback.
        """
        date_col = 'transaction_date'

        # Common date formats to try
        formats = [
            '%m/%d/%Y',      # 01/15/2024
            '%m-%d-%Y',      # 01-15-2024
            '%Y-%m-%d',      # 2024-01-15
            '%Y/%m/%d',      # 2024/01/15
            '%d/%m/%Y',      # 15/01/2024
            '%m/%d/%y',      # 01/15/24
            '%Y%m%d',        # 20240115
        ]

        for fmt in formats:
            try:
                df[date_col] = pd.to_datetime(df[date_col], format=fmt)
                print(f"Date format detected: {fmt}")
                return df
            except:
                continue

        # If all fail, use pandas auto-detection
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            print("Date format: using pandas auto-detection")
        except:
            print("Warning: Could not parse dates")

        return df

    def _normalize_state_codes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert state names to codes.

        Handles:
        - Full state names ("California" → "CA")
        - Mixed case
        - Extra whitespace
        """
        def normalize_state(val):
            if pd.isna(val):
                return val

            val_str = str(val).strip()

            # If already 2-letter code, uppercase and return
            if len(val_str) == 2:
                return val_str.upper()

            # Try state name lookup
            val_lower = val_str.lower()
            if val_lower in self.STATE_NAME_TO_CODE:
                return self.STATE_NAME_TO_CODE[val_lower]

            # Return as-is (might be valid, might be error)
            return val_str.upper()

        df['customer_state'] = df['customer_state'].apply(normalize_state)

        return df

    def _normalize_sales_channel(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize sales channel values.

        Maps variants to standard values:
        - Marketplace platforms → "marketplace"
        - Direct sales → "direct"
        """
        marketplace_variants = [
            'amazon', 'ebay', 'walmart', 'etsy', 'shopify marketplace',
            'marketplace', 'third-party', '3rd party', 'third party',
            'fba', 'fulfillment by amazon', 'seller central'
        ]

        direct_variants = [
            'direct', 'website', 'web', 'online', 'store', 'retail',
            'own site', 'ecommerce', 'e-commerce'
        ]

        def normalize_channel(val):
            if pd.isna(val):
                return 'direct'  # Default

            val_lower = str(val).lower().strip()

            if val_lower in marketplace_variants:
                return 'marketplace'
            elif val_lower in direct_variants:
                return 'direct'
            else:
                return val  # Keep original if not recognized

        df['sales_channel'] = df['sales_channel'].apply(normalize_channel)

        return df

    def _calculate_taxable_amount(self, df: pd.DataFrame, mappings: Dict) -> pd.DataFrame:
        """
        Calculate taxable amount using hybrid approach.

        Priority:
        1. If exempt_amount specified, subtract from revenue
        2. If is_taxable specified, use Y/N logic
        3. Default to fully taxable
        """
        def calc_taxable(row):
            revenue = row.get('revenue_amount', 0)

            # Priority 1: exempt_amount specified
            if 'exempt_amount' in mappings and 'exempt_amount' in row.index:
                exempt = row.get('exempt_amount', 0)
                if pd.notna(exempt):
                    return max(0, revenue - float(exempt))

            # Priority 2: is_taxable specified
            if 'is_taxable' in mappings and 'is_taxable' in row.index:
                taxable_val = row.get('is_taxable')
                if pd.notna(taxable_val):
                    val_str = str(taxable_val).upper().strip()
                    if val_str in ['N', 'NO', 'FALSE', '0', 'EXEMPT', 'F']:
                        return 0
                    else:
                        return revenue

            # Priority 3: Default to fully taxable
            return revenue

        df['taxable_amount'] = df.apply(calc_taxable, axis=1)

        # Also add is_taxable boolean if not present (for database)
        if 'is_taxable' not in df.columns:
            df['is_taxable'] = df['taxable_amount'] > 0

        # Add exempt_amount if not present
        if 'exempt_amount' not in df.columns:
            df['exempt_amount'] = df['revenue_amount'] - df['taxable_amount']

        return df

    def get_preview_data(
        self,
        df: pd.DataFrame,
        mappings: Dict,
        max_rows: int = 10
    ) -> List[Dict]:
        """
        Get preview of normalized data.

        Returns list of dicts with original + normalized columns.
        """
        # Create normalized copy
        df_normalized = self.normalize_data(df, mappings)

        # Get sample rows
        sample = df_normalized.head(max_rows)

        return sample.to_dict('records')

    def validate_normalized_data(self, df: pd.DataFrame) -> Dict:
        """
        Validate normalized data and return warnings/errors.

        Checks:
        - Invalid state codes
        - Future dates
        - Negative amounts
        - Missing required fields
        """
        warnings = []
        errors = []

        # Validate state codes
        valid_states = set(self.STATE_NAME_TO_CODE.values()) | {'DC'}
        invalid_states = df[~df['customer_state'].isin(valid_states)]['customer_state'].unique()
        if len(invalid_states) > 0:
            errors.append({
                'field': 'customer_state',
                'message': f"Invalid state codes: {', '.join(invalid_states)}",
                'count': len(df[df['customer_state'].isin(invalid_states)])
            })

        # Validate dates
        if 'transaction_date' in df.columns:
            future_dates = df[df['transaction_date'] > pd.Timestamp.now()]
            if len(future_dates) > 0:
                warnings.append({
                    'field': 'transaction_date',
                    'message': f"{len(future_dates)} transactions have future dates",
                    'count': len(future_dates)
                })

        # Validate amounts
        if 'revenue_amount' in df.columns:
            negative = df[df['revenue_amount'] < 0]
            if len(negative) > 0:
                warnings.append({
                    'field': 'revenue_amount',
                    'message': f"{len(negative)} transactions have negative amounts",
                    'count': len(negative)
                })

        # Validate taxable amount
        if 'exempt_amount' in df.columns:
            over_exempt = df[df['exempt_amount'] > df['revenue_amount']]
            if len(over_exempt) > 0:
                warnings.append({
                    'field': 'exempt_amount',
                    'message': f"{len(over_exempt)} transactions have exempt > revenue (will be capped at 0)",
                    'count': len(over_exempt)
                })

        return {
            'valid': len(errors) == 0,
            'warnings': warnings,
            'errors': errors,
            'total_rows': len(df),
            'valid_rows': len(df) - sum(e['count'] for e in errors)
        }
```

---

### Update Database Schema

**File:** `backend/migrations/add_exempt_columns.sql` (NEW)

```sql
-- Add exempt sales columns to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS exempt_amount DECIMAL(12,2) DEFAULT 0;

-- Update existing data (set taxable = revenue for existing records)
UPDATE transactions
SET taxable_amount = revenue_amount
WHERE taxable_amount IS NULL;

UPDATE transactions
SET exempt_amount = 0
WHERE exempt_amount IS NULL;

-- Add to state_results for summary display
ALTER TABLE state_results
  ADD COLUMN IF NOT EXISTS gross_sales DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS taxable_sales DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS exempt_sales DECIMAL(15,2);

-- Comments
COMMENT ON COLUMN transactions.taxable_amount IS 'Amount subject to tax (revenue - exempt)';
COMMENT ON COLUMN transactions.is_taxable IS 'Boolean flag: is this transaction taxable?';
COMMENT ON COLUMN transactions.exempt_amount IS 'Dollar amount exempt from tax';

COMMENT ON COLUMN state_results.gross_sales IS 'Total sales (for nexus determination)';
COMMENT ON COLUMN state_results.taxable_sales IS 'Taxable sales (for liability calculation)';
COMMENT ON COLUMN state_results.exempt_sales IS 'Exempt sales (gross - taxable)';
```

---

### Update Nexus Calculator

**File:** `backend/app/services/nexus_calculator_v2.py` (UPDATE)

```python
def _calculate_state_nexus_multi_year(self, ...):
    """
    Calculate nexus using GROSS sales, liability using TAXABLE sales.
    """
    # ... existing code ...

    # For nexus determination: use GROSS sales (revenue_amount)
    gross_sales = sum(txn['revenue_amount'] for txn in state_transactions)

    # Check threshold
    if gross_sales >= threshold_config['sales_threshold']:
        has_nexus = True

    # ... nexus date calculation ...

    # For liability: use TAXABLE sales
    if has_nexus:
        taxable_sales = sum(
            txn.get('taxable_amount', txn['revenue_amount'])
            for txn in state_transactions
        )

        exempt_sales = gross_sales - taxable_sales

        liability = self._calculate_liability(
            state_code=state_code,
            taxable_sales=taxable_sales,  # Changed from gross_sales
            nexus_date=nexus_date,
            tax_rate_config=tax_rate_config
        )

        # Save to state_results with gross/taxable/exempt breakdown
        result = {
            'analysis_id': analysis_id,
            'state_code': state_code,
            'nexus_type': 'economic',
            'nexus_date': nexus_date,
            'gross_sales': float(gross_sales),        # NEW
            'taxable_sales': float(taxable_sales),    # NEW
            'exempt_sales': float(exempt_sales),      # NEW
            'estimated_liability': liability['total'],
            'base_tax': liability['base_tax'],
            'interest': liability['interest'],
            'penalties': liability['penalties'],
            # ... other fields ...
        }
```

---

### Days 6-7 Tasks Checklist

- [ ] Update `column_detector.py` with expanded patterns
- [ ] Add state name → code mapping
- [ ] Add date format auto-detection
- [ ] Add sales channel normalization
- [ ] Add taxable amount calculation
- [ ] Add validation logic
- [ ] Run database migration (add exempt columns)
- [ ] Update `nexus_calculator_v2.py` to use gross vs. taxable
- [ ] Test with various CSV formats:
  - [ ] Different date formats
  - [ ] State names vs. codes
  - [ ] Various channel names
  - [ ] With/without exempt columns
- [ ] Verify gross sales used for nexus
- [ ] Verify taxable sales used for liability

---

## Day 8: Frontend Updates for Exempt Sales

### Update CSV Preview Component

**File:** `frontend/components/analysis/CSVPreview.tsx` (UPDATE)

```tsx
// Add exempt sales indicators

{detectedColumns.includes('is_taxable') && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Exempt Sales Detected</AlertTitle>
    <AlertDescription>
      Your CSV includes an <code>is_taxable</code> column.
      Non-taxable sales will be excluded from liability calculations but
      will still count toward nexus thresholds.
    </AlertDescription>
  </Alert>
)}

{detectedColumns.includes('exempt_amount') && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Partial Exemptions Detected</AlertTitle>
    <AlertDescription>
      Your CSV includes an <code>exempt_amount</code> column.
      Partial exemptions will be handled accurately.
    </AlertDescription>
  </Alert>
)}
```

---

### Update State Results Table

**File:** `frontend/components/analysis/StateTable.tsx` (UPDATE)

```tsx
// Add columns for gross/taxable/exempt

<TableHead>Gross Sales</TableHead>
<TableHead>Taxable Sales</TableHead>
<TableHead>Exempt</TableHead>
<TableHead>Liability</TableHead>

// In row:
<TableCell>{formatCurrency(state.gross_sales)}</TableCell>
<TableCell>
  {formatCurrency(state.taxable_sales)}
  {state.exempt_sales > 0 && (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-3 w-3 ml-1 text-muted-foreground inline" />
        </TooltipTrigger>
        <TooltipContent>
          Liability calculated on taxable sales only
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
</TableCell>
<TableCell>
  {state.exempt_sales > 0 ? (
    <div className="flex items-center gap-2">
      {formatCurrency(state.exempt_sales)}
      <Badge variant="secondary" className="text-xs">
        {((state.exempt_sales / state.gross_sales) * 100).toFixed(1)}%
      </Badge>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )}
</TableCell>
<TableCell className="font-semibold">
  {formatCurrency(state.estimated_liability)}
</TableCell>
```

---

### Update State Detail Page

**File:** `frontend/app/analysis/[id]/states/[stateCode]/page.tsx` (UPDATE)

```tsx
// Add sales breakdown section

<Card>
  <CardHeader>
    <CardTitle>Sales Breakdown</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Gross Sales</span>
        <span className="font-semibold">{formatCurrency(state.gross_sales)}</span>
      </div>

      {state.exempt_sales > 0 && (
        <>
          <div className="flex justify-between items-center text-sm">
            <span className="pl-4 text-muted-foreground">- Exempt Sales</span>
            <span className="text-muted-foreground">
              ({formatCurrency(state.exempt_sales)})
            </span>
          </div>
          <Separator />
        </>
      )}

      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Taxable Sales</span>
        <span className="font-semibold">{formatCurrency(state.taxable_sales)}</span>
      </div>
    </div>

    <Alert className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>How Exempt Sales Affect Calculations</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
          <li>
            <strong>Nexus Determination:</strong> Uses gross sales
            ({formatCurrency(state.gross_sales)})
          </li>
          <li>
            <strong>Tax Liability:</strong> Uses taxable sales
            ({formatCurrency(state.taxable_sales)})
          </li>
          {state.exempt_sales > 0 && (
            <li>
              <strong>Exemptions:</strong> {formatCurrency(state.exempt_sales)}
              ({((state.exempt_sales / state.gross_sales) * 100).toFixed(1)}% of total)
            </li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>
```

---

### Update CSV Template

**File:** `backend/templates/csv_template.csv` (UPDATE)

```csv
transaction_date,customer_state,revenue_amount,sales_channel,is_taxable,exempt_amount
01/15/2024,CA,1250.00,direct,Y,
01/16/2024,NY,450.00,direct,N,
01/17/2024,TX,2100.00,marketplace,Y,
01/18/2024,FL,3000.00,direct,,500.00
01/19/2024,GA,875.00,direct,,
```

---

### Create User Documentation

**File:** `docs/user-guide/exempt-sales.md` (NEW)

```markdown
# Handling Exempt Sales

## Overview

Many businesses sell both taxable and non-taxable products/services. Nexus Check properly handles exempt sales by:

- **Using gross sales for nexus determination** (economic activity)
- **Using taxable sales for liability calculation** (tax obligation)

## How to Specify Exempt Sales

### Option 1: Simple Boolean (is_taxable column)

Add a column indicating if each transaction is taxable:

```csv
transaction_date,customer_state,revenue_amount,is_taxable
01/15/2024,CA,1250.00,Y
01/16/2024,NY,450.00,N
```

**Accepted values for is_taxable:**
- Taxable: `Y`, `YES`, `TRUE`, `1`, `T`
- Exempt: `N`, `NO`, `FALSE`, `0`, `F`, `EXEMPT`

### Option 2: Dollar Amount (exempt_amount column)

Add a column with the exempt dollar amount:

```csv
transaction_date,customer_state,revenue_amount,exempt_amount
01/15/2024,CA,1250.00,0
01/17/2024,TX,3000.00,500.00
```

This is useful for partial exemptions (e.g., $3000 sale with $500 exempt = $2500 taxable).

### Option 3: Hybrid (both columns)

You can use both columns. The system prioritizes:
1. `exempt_amount` (if specified)
2. `is_taxable` (if specified)
3. Default: all sales taxable

### Option 4: No Column

If you don't include either column, **all sales are treated as taxable** (default behavior).

## Common Exempt Categories

### By Industry

**Grocery Stores:**
- Food for home consumption: Often exempt
- Prepared foods: Usually taxable
- Alcohol: Usually taxable

**Clothing Retailers:**
- Varies by state (NY exempts under $110, some states tax fully)

**Manufacturers:**
- Manufacturing equipment: Often exempt
- Resale items: Exempt with certificate

**Service Providers:**
- Services vary widely by state

### By Transaction Type

**Resale Certificates:**
- Customer provides certificate → exempt
- Mark transaction as `is_taxable=N`

**Interstate Sales:**
- Out-of-state shipments may be exempt
- Check destination state rules

## Examples

### Example 1: Grocery Store

```csv
transaction_date,customer_state,revenue_amount,is_taxable
01/15/2024,CA,50.00,N        # Groceries (exempt)
01/15/2024,CA,15.00,Y        # Soda (taxable)
01/16/2024,CA,200.00,N       # Food items (exempt)
```

Result:
- Gross sales: $265 (counts toward nexus)
- Taxable sales: $15 (generates tax liability)

### Example 2: Clothing with Partial Exemption

```csv
transaction_date,customer_state,revenue_amount,exempt_amount
01/15/2024,NY,150.00,110.00
```

Result:
- Gross: $150
- Exempt: $110 (under NY threshold)
- Taxable: $40
- Tax liability calculated on $40

### Example 3: Wholesale with Resale Certificate

```csv
transaction_date,customer_state,revenue_amount,is_taxable
01/15/2024,TX,5000.00,N      # Resale certificate
01/16/2024,TX,2000.00,Y      # Retail sale
```

Result:
- Gross: $7000 (both count toward nexus)
- Taxable: $2000 (only retail generates liability)

## Important Notes

✅ **Exempt sales COUNT toward nexus thresholds**
- Economic nexus is based on economic activity
- Both taxable and exempt sales count

❌ **Exempt sales do NOT generate tax liability**
- You can't owe tax on non-taxable sales
- But they may trigger registration requirements

⚠️ **You are responsible for accuracy**
- The tool trusts your exemption classifications
- Consult a tax professional if unsure
- State rules vary significantly

## State-Specific Considerations

Different states have different exemption rules. Common variations:

**Food:**
- CA: Most groceries exempt
- IL: Reduced rate (1%)
- Some states: Fully taxable

**Clothing:**
- NY: Exempt under $110
- PA: Exempt
- CA: Taxable

**Manufacturing Equipment:**
- Many states: Exempt
- But definitions vary

**Digital Products:**
- Varies widely by state
- Many states recently changed rules

## Troubleshooting

**Problem:** High exemption percentage flagged

**Solution:** This is just a warning. If accurate, no action needed.

---

**Problem:** Exempt amount > revenue amount

**Solution:** System caps at $0 taxable. Check your data for errors.

---

**Problem:** State shows nexus but $0 liability

**Solution:** This is normal if all sales are exempt. You may still need to register.

## Questions?

- Check state-specific rules in your analysis results
- Consult a tax professional for exemption classification
- Contact support if the tool isn't handling your scenario correctly
```

---

### Day 8 Tasks Checklist

- [ ] Update CSV preview component with exempt indicators
- [ ] Update StateTable with gross/taxable/exempt columns
- [ ] Update state detail page with sales breakdown
- [ ] Update CSV template with optional columns
- [ ] Create user documentation for exempt sales
- [ ] Test UI with various exempt scenarios
- [ ] Verify calculations show correctly
- [ ] Test with edge cases (100% exempt, partial exempt, etc.)

---

## Summary: Days 6-8 Complete

At the end of this phase, you'll have:

✅ **Enhanced Column Detection:**
- More column aliases (better CSV compatibility)
- Date format auto-detection
- State name normalization
- Sales channel mapping
- Preview of transformations

✅ **Exempt Sales Support:**
- `is_taxable` column (boolean)
- `exempt_amount` column (dollar value)
- Hybrid support (both optional)
- Gross vs. taxable distinction throughout app
- Clear UI indicators

✅ **Critical Accuracy Improvement:**
- Nexus uses gross sales (correct)
- Liability uses taxable sales (correct)
- Exempt sales handled properly

---

**Next:** Proceed to **04-integration-polish.md** for Days 9-10 implementation.
