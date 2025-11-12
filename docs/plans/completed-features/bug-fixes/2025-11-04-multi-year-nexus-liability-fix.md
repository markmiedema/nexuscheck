# Multi-Year Nexus Calculation and Liability Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical liability calculation bugs (100x too low) and implement proper multi-year nexus tracking with "sticky nexus" logic.

**Architecture:** Modify nexus calculation engine to calculate per state per year, track when nexus is first established, and persist nexus across subsequent years. Fix tax rate bug causing 100x underestimation. Add marketplace facilitator rules to exclude marketplace sales from liability.

**Tech Stack:** Python 3.9+, FastAPI, Supabase (PostgreSQL), pandas, pytest

---

## Background - Critical Issues Identified

### Issue #1: Tax Liability 100x Too Low (CRITICAL)
- Database stores rates as decimals: `0.0825` = 8.25%
- Code divides by 100 again: `0.0825 / 100 = 0.000825`
- Result: $100K sales → $82.50 liability (should be $8,250)
- **Impact: All liability calculations are ~100x too low**

### Issue #2: Multi-Year Nexus Not Tracked
- Current code aggregates ALL years together
- Can't track year-by-year results
- No way to implement "sticky nexus"

### Issue #3: No "Sticky Nexus" Logic
- Real tax law: Once nexus established, it persists until formally closed
- Current: Each year calculated independently
- Example problem:
  - 2023: $120K sales → Nexus established ✅
  - 2024: $80K sales → Shows "No Nexus" ❌ (WRONG - nexus persists!)

### Issue #4: Marketplace Facilitator Rules Ignored
- Marketplace sales (Amazon, eBay) should count toward threshold
- But should be EXCLUDED from liability (marketplace collects tax)
- Current: All sales included in liability calculation

---

## Phase 1: Fix Critical Bugs (Tax Rate and Marketplace Facilitator)

**Estimated Time:** 2-3 hours
**Files Modified:** 1
**New Files:** 1 (test file)

---

### Task 1: Add test for correct tax rate calculation

**Files:**
- Create: `backend/tests/test_nexus_calculator.py`

**Step 1: Create test file with imports**

Create `backend/tests/test_nexus_calculator.py`:

```python
"""
Tests for nexus calculation engine.
"""

import pytest
from decimal import Decimal
from unittest.mock import Mock, MagicMock
from app.services.nexus_calculator import NexusCalculator


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    return Mock()


@pytest.fixture
def calculator(mock_supabase):
    """Create calculator instance with mocked supabase."""
    return NexusCalculator(mock_supabase)
```

**Step 2: Write failing test for tax rate bug**

Add to `backend/tests/test_nexus_calculator.py`:

```python
def test_tax_rate_not_divided_by_100(calculator, mock_supabase):
    """
    Verify tax rate is used as-is (already decimal).
    Bug: Code was dividing 0.0825 by 100 = 0.000825, making liability 100x too low.
    """
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

    # Assertions
    assert result['nexus_type'] == 'economic'
    assert result['total_sales'] == 100000.0

    # Critical: Tax should be $100,000 * 0.0825 = $8,250
    # NOT $100,000 * 0.000825 = $82.50 (the bug)
    assert result['base_tax'] == 8250.0
    assert result['estimated_liability'] == 8250.0
```

**Step 3: Run test to verify it fails**

```bash
cd backend
pytest tests/test_nexus_calculator.py::test_tax_rate_not_divided_by_100 -v
```

Expected output:
```
FAILED - AssertionError: assert 82.5 == 8250.0
```

**Step 4: Commit the failing test**

```bash
git add tests/test_nexus_calculator.py
git commit -m "test: add failing test for tax rate calculation bug

Test demonstrates tax liability is 100x too low due to
dividing decimal rate by 100 unnecessarily"
```

---

### Task 2: Fix tax rate division bug

**Files:**
- Modify: `backend/app/services/nexus_calculator.py:294-302`

**Step 1: Fix the tax rate bug**

In `backend/app/services/nexus_calculator.py`, find this code around line 300:

```python
# BEFORE (BUGGY):
if has_nexus and tax_rate:
    # Simple calculation: total_sales * combined_tax_rate
    # Note: This is a simplified estimate. Real calculation would be more complex.
    combined_rate = tax_rate['combined_rate'] / 100  # ❌ BUG: Already a decimal!
    base_tax = total_sales * combined_rate
    estimated_liability = base_tax  # For MVP, no interest/penalties yet
```

Replace with:

```python
# AFTER (FIXED):
if has_nexus and tax_rate:
    # Tax rates are stored as decimals in database (0.0825 for 8.25%)
    # DO NOT divide by 100 - that would make liability 100x too low!
    combined_rate = tax_rate['combined_rate']
    base_tax = total_sales * combined_rate
    estimated_liability = base_tax  # For MVP, no interest/penalties yet
```

**Step 2: Run test to verify it passes**

```bash
pytest tests/test_nexus_calculator.py::test_tax_rate_not_divided_by_100 -v
```

Expected output:
```
PASSED
```

**Step 3: Commit the fix**

```bash
git add app/services/nexus_calculator.py
git commit -m "fix: correct tax rate calculation (was 100x too low)

Tax rates are stored as decimals (0.0825 = 8.25%) in database.
Code was dividing by 100 again, resulting in 0.000825 rate.

Fixed: Use rate as-is without division.
Result: $100K sales now correctly yields $8,250 liability
instead of $82.50."
```

---

### Task 3: Add test for marketplace facilitator exclusion

**Files:**
- Modify: `backend/tests/test_nexus_calculator.py`

**Step 1: Write failing test for marketplace facilitator rules**

Add to `backend/tests/test_nexus_calculator.py`:

```python
def test_marketplace_sales_excluded_from_liability(calculator, mock_supabase):
    """
    Verify marketplace sales are excluded from liability when state has MF law.

    Marketplace facilitator law:
    - Marketplace sales COUNT toward threshold determination
    - Marketplace sales EXCLUDED from liability (marketplace collects tax)
    """
    # Mock marketplace facilitator rules query
    mock_mf_result = Mock()
    mock_mf_result.data = [{
        'state': 'CA',
        'has_mf_law': True,
        'count_toward_threshold': True,
        'exclude_from_liability': True
    }]

    mock_supabase.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value = mock_mf_result

    tax_rate = {
        'combined_rate': 0.0825  # 8.25%
    }

    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }

    # $100K direct + $50K marketplace = $150K total
    # Threshold check: $150K → NEXUS ✅
    # Liability: Only $100K (direct) × 8.25% = $8,250
    result = calculator._determine_state_nexus(
        state_code='CA',
        total_sales=150000.0,
        transaction_count=250,
        direct_sales=100000.0,
        marketplace_sales=50000.0,
        threshold=threshold,
        tax_rate=tax_rate
    )

    # Should have nexus (total $150K exceeds $100K threshold)
    assert result['nexus_type'] == 'economic'

    # But liability should only be on $100K direct sales
    # NOT on $150K total
    assert result['base_tax'] == 8250.0  # $100K * 8.25%
    assert result['estimated_liability'] == 8250.0
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_nexus_calculator.py::test_marketplace_sales_excluded_from_liability -v
```

Expected output:
```
FAILED - AssertionError: assert 12375.0 == 8250.0
(Currently calculates on $150K instead of $100K)
```

**Step 3: Commit the failing test**

```bash
git add tests/test_nexus_calculator.py
git commit -m "test: add failing test for marketplace facilitator exclusion

Test shows marketplace sales incorrectly included in liability.
Should be: $100K direct × 8.25% = $8,250
Currently: $150K total × 8.25% = $12,375"
```

---

### Task 4: Add method to fetch marketplace facilitator rules

**Files:**
- Modify: `backend/app/services/nexus_calculator.py`

**Step 1: Add helper method to fetch MF rules**

Add this method after `_get_tax_rates()` method (around line 238):

```python
def _get_marketplace_facilitator_rules(self) -> Dict:
    """
    Get current marketplace facilitator rules for all states.

    Returns dict with state_code as key and rule data as value.
    """
    try:
        result = self.supabase.table('marketplace_facilitator_rules') \
            .select('*') \
            .is_('effective_to', 'null') \
            .execute()

        rules = {}
        for row in result.data:
            rules[row['state']] = {
                'has_mf_law': row['has_mf_law'],
                'count_toward_threshold': row['count_toward_threshold'],
                'exclude_from_liability': row['exclude_from_liability']
            }

        return rules

    except Exception as e:
        logger.error(f"Error fetching marketplace facilitator rules: {str(e)}")
        raise
```

**Step 2: Update calculate_nexus_for_analysis to fetch MF rules**

In `calculate_nexus_for_analysis()`, after line 43 where tax_rates are fetched, add:

```python
# Step 3: Get tax rates for all states
tax_rates = self._get_tax_rates()

# Step 4: Get marketplace facilitator rules  # ← ADD THIS
mf_rules = self._get_marketplace_facilitator_rules()  # ← ADD THIS
```

And update the loop to pass mf_rules (around line 51):

```python
for state_code, aggregates in state_aggregates.items():
    result = self._determine_state_nexus(
        state_code=state_code,
        total_sales=aggregates['total_sales'],
        transaction_count=aggregates['transaction_count'],
        direct_sales=aggregates['direct_sales'],
        marketplace_sales=aggregates['marketplace_sales'],
        threshold=thresholds.get(state_code),
        tax_rate=tax_rates.get(state_code),
        mf_rules=mf_rules.get(state_code)  # ← ADD THIS
    )
```

**Step 3: Commit**

```bash
git add app/services/nexus_calculator.py
git commit -m "feat: add method to fetch marketplace facilitator rules

Add _get_marketplace_facilitator_rules() to retrieve current
MF rules for all states. Pass to _determine_state_nexus()."
```

---

### Task 5: Update _determine_state_nexus to use MF rules

**Files:**
- Modify: `backend/app/services/nexus_calculator.py:251-318`

**Step 1: Update method signature**

Change the method signature from:

```python
def _determine_state_nexus(
    self,
    state_code: str,
    total_sales: float,
    transaction_count: int,
    direct_sales: float,
    marketplace_sales: float,
    threshold: Dict,
    tax_rate: Dict
) -> Dict:
```

To:

```python
def _determine_state_nexus(
    self,
    state_code: str,
    total_sales: float,
    transaction_count: int,
    direct_sales: float,
    marketplace_sales: float,
    threshold: Dict,
    tax_rate: Dict,
    mf_rules: Dict = None  # ← ADD THIS
) -> Dict:
```

**Step 2: Update liability calculation to exclude marketplace sales**

Find the liability calculation section (around line 294-302) and replace with:

```python
# Calculate estimated liability if nexus exists
estimated_liability = 0.0
base_tax = 0.0
taxable_sales = 0.0  # ← ADD THIS

if has_nexus and tax_rate:
    # Determine which sales are taxable based on marketplace facilitator rules
    if mf_rules and mf_rules.get('exclude_from_liability'):
        # Exclude marketplace sales - marketplace collects tax on those
        taxable_sales = direct_sales
    else:
        # No MF law or all sales are taxable
        taxable_sales = total_sales

    # Tax rates are stored as decimals in database (0.0825 for 8.25%)
    # DO NOT divide by 100 - that would make liability 100x too low!
    combined_rate = tax_rate['combined_rate']
    base_tax = taxable_sales * combined_rate
    estimated_liability = base_tax  # For MVP, no interest/penalties yet
```

**Step 3: Add taxable_sales to return value**

Find the return statement (around line 304) and add `taxable_sales`:

```python
return {
    'state': state_code,
    'nexus_type': nexus_type,
    'nexus_date': datetime.utcnow().date().isoformat() if has_nexus else None,
    'total_sales': total_sales,
    'direct_sales': direct_sales,
    'marketplace_sales': marketplace_sales,
    'taxable_sales': taxable_sales,  # ← ADD THIS
    'transaction_count': transaction_count,
    'estimated_liability': estimated_liability,
    'base_tax': base_tax,
    'interest': 0.0,
    'penalties': 0.0,
    'approaching_threshold': approaching_threshold,
    'threshold': threshold.get('revenue_threshold', 100000) if threshold else 100000
}
```

**Step 4: Update _save_results_to_database to include taxable_sales**

Find the state_results.append() call (around line 328) and add:

```python
state_results.append({
    'analysis_id': analysis_id,
    'state': result['state'],
    'nexus_type': result['nexus_type'],
    'nexus_date': result['nexus_date'],
    'total_sales': result['total_sales'],
    'direct_sales': result['direct_sales'],
    'marketplace_sales': result['marketplace_sales'],
    'taxable_sales': result.get('taxable_sales', result['total_sales']),  # ← ADD THIS
    'transaction_count': result.get('transaction_count', 0),
    'estimated_liability': result['estimated_liability'],
    'base_tax': result['base_tax'],
    'interest': result['interest'],
    'penalties': result['penalties'],
    'approaching_threshold': result.get('approaching_threshold', False),
    'threshold': result.get('threshold', 100000)
})
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/test_nexus_calculator.py::test_marketplace_sales_excluded_from_liability -v
```

Expected output:
```
PASSED
```

**Step 6: Run all tests**

```bash
pytest tests/test_nexus_calculator.py -v
```

Expected: All tests PASS

**Step 7: Commit**

```bash
git add app/services/nexus_calculator.py
git commit -m "feat: exclude marketplace sales from liability calculation

Implement marketplace facilitator rules:
- Marketplace sales count toward threshold (determines nexus)
- Marketplace sales excluded from liability (marketplace collects tax)

Example: $100K direct + $50K marketplace
- Threshold check: $150K → Nexus ✅
- Liability: $100K × 8.25% = $8,250 (not $12,375)"
```

---

### Task 6: Add database migration for taxable_sales column

**Files:**
- Create: `backend/migrations/006_add_taxable_sales_column.sql`

**Step 1: Create migration file**

Create `backend/migrations/006_add_taxable_sales_column.sql`:

```sql
-- ============================================================================
-- Add taxable_sales column to state_results
-- ============================================================================
-- Created: 2025-11-04
-- Purpose: Track which sales are taxable (exclude marketplace when applicable)
-- ============================================================================

-- Add taxable_sales column
ALTER TABLE state_results ADD COLUMN taxable_sales DECIMAL(12,2);

-- Backfill existing data (assume all sales were taxable before this fix)
UPDATE state_results
SET taxable_sales = total_sales
WHERE taxable_sales IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE state_results ALTER COLUMN taxable_sales SET NOT NULL;

-- Add comment
COMMENT ON COLUMN state_results.taxable_sales IS
'Sales subject to tax liability. Excludes marketplace sales when state has MF law.';
```

**Step 2: Run migration in Supabase**

1. Open Supabase SQL Editor
2. Paste the migration SQL
3. Execute

**Step 3: Verify migration**

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'state_results'
  AND column_name = 'taxable_sales';
```

Expected output:
```
column_name    | data_type | is_nullable
taxable_sales  | numeric   | NO
```

**Step 4: Commit migration file**

```bash
git add migrations/006_add_taxable_sales_column.sql
git commit -m "migration: add taxable_sales column to state_results

Track which sales are subject to tax liability.
Excludes marketplace sales when state has MF law."
```

---

### Task 7: Manual testing of Phase 1 fixes

**Files:**
- None (manual testing)

**Step 1: Re-run calculation on existing analysis**

Using your existing test data:

```bash
# Start backend server
cd backend
uvicorn app.main:app --reload
```

In separate terminal:

```bash
# Trigger re-calculation on analysis
curl -X POST http://localhost:8000/api/v1/analyses/{analysis_id}/calculate \
  -H "Authorization: Bearer {your_token}"
```

**Step 2: Verify liability increased ~100x**

Check database:

```sql
-- Before fix: Total liability was very low (e.g., $500)
-- After fix: Should be ~100x higher (e.g., $50,000)

SELECT
  analysis_id,
  state,
  total_sales,
  taxable_sales,
  direct_sales,
  marketplace_sales,
  estimated_liability,
  base_tax
FROM state_results
WHERE analysis_id = '{your_analysis_id}'
  AND nexus_type IN ('economic', 'physical', 'both')
ORDER BY estimated_liability DESC
LIMIT 10;
```

**Step 3: Verify marketplace sales excluded**

For states with marketplace sales:

```sql
-- taxable_sales should equal direct_sales (not total_sales)
SELECT
  state,
  total_sales,
  direct_sales,
  marketplace_sales,
  taxable_sales,
  CASE
    WHEN taxable_sales = direct_sales THEN 'MF Excluded ✅'
    WHEN taxable_sales = total_sales THEN 'MF Included ❌'
    ELSE 'Unknown'
  END as mf_status
FROM state_results
WHERE marketplace_sales > 0
  AND nexus_type IN ('economic', 'physical', 'both');
```

**Step 4: Document results**

Create test results document:

```bash
echo "# Phase 1 Testing Results

## Tax Rate Fix
- Before: Liability ~$500
- After: Liability ~$50,000
- Increase: ~100x ✅

## Marketplace Facilitator
- CA: $100K direct + $50K marketplace = $150K total
- Liability on: $100K (direct only) ✅
- Tax: $8,250 ($100K × 8.25%) ✅

$(date)" > docs/testing/phase-1-results.md
```

**Step 5: Commit test results**

```bash
git add docs/testing/phase-1-results.md
git commit -m "docs: document Phase 1 testing results

Verified:
- Tax liability now ~100x higher (bug fixed)
- Marketplace sales excluded from liability"
```

---

## Phase 2: Multi-Year Nexus Tracking with Sticky Nexus

**Estimated Time:** 6-8 hours
**Files Modified:** 2
**New Files:** 2 (migration + test file)

---

### Task 8: Database migration for multi-year tracking

**Files:**
- Create: `backend/migrations/007_add_year_to_state_results.sql`

**Step 1: Create migration file**

Create `backend/migrations/007_add_year_to_state_results.sql`:

```sql
-- ============================================================================
-- Add year column and sticky nexus tracking to state_results
-- ============================================================================
-- Created: 2025-11-04
-- Purpose: Enable per-year nexus tracking and "sticky nexus" logic
-- ============================================================================

-- Add year column
ALTER TABLE state_results ADD COLUMN year INTEGER;

-- Add sticky nexus tracking columns
ALTER TABLE state_results ADD COLUMN nexus_first_established_year INTEGER;
ALTER TABLE state_results ADD COLUMN nexus_is_sticky BOOLEAN DEFAULT FALSE;

-- Backfill year from analysis period end date
UPDATE state_results sr
SET year = EXTRACT(YEAR FROM a.analysis_period_end)::INTEGER
FROM analyses a
WHERE sr.analysis_id = a.id
  AND sr.year IS NULL;

-- Make year NOT NULL after backfill
ALTER TABLE state_results ALTER COLUMN year SET NOT NULL;

-- Drop old unique constraint (if exists)
ALTER TABLE state_results DROP CONSTRAINT IF EXISTS state_results_analysis_id_state_key;

-- Add new unique constraint for (analysis_id, state, year)
ALTER TABLE state_results
ADD CONSTRAINT unique_analysis_state_year
UNIQUE (analysis_id, state, year);

-- Add index for efficient querying
CREATE INDEX idx_state_results_year ON state_results(analysis_id, state, year);

-- Add index for sticky nexus queries
CREATE INDEX idx_state_results_nexus_established
ON state_results(analysis_id, state, nexus_first_established_year)
WHERE nexus_first_established_year IS NOT NULL;

-- Add comments
COMMENT ON COLUMN state_results.year IS
'Calendar year for this result (enables per-year tracking)';

COMMENT ON COLUMN state_results.nexus_first_established_year IS
'Year when nexus was first established in this state (for sticky nexus tracking)';

COMMENT ON COLUMN state_results.nexus_is_sticky IS
'True if nexus persists from prior year (sales below threshold but nexus continues)';
```

**Step 2: Run migration in Supabase**

1. Open Supabase SQL Editor
2. Paste the migration SQL
3. Execute

**Step 3: Verify migration**

```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'state_results'
  AND column_name IN ('year', 'nexus_first_established_year', 'nexus_is_sticky')
ORDER BY column_name;

-- Check unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'state_results'
  AND constraint_name = 'unique_analysis_state_year';
```

Expected output:
```
column_name                    | data_type | is_nullable
nexus_first_established_year   | integer   | YES
nexus_is_sticky                | boolean   | YES
year                           | integer   | NO

constraint_name             | constraint_type
unique_analysis_state_year  | UNIQUE
```

**Step 4: Commit migration**

```bash
git add migrations/007_add_year_to_state_results.sql
git commit -m "migration: add year and sticky nexus tracking to state_results

Add columns:
- year: Calendar year for per-year tracking
- nexus_first_established_year: Track when nexus started
- nexus_is_sticky: Flag for nexus persisting from prior year

Add unique constraint: (analysis_id, state, year)"
```

---

### Task 9: Add tests for multi-year aggregation

**Files:**
- Modify: `backend/tests/test_nexus_calculator.py`

**Step 1: Add test data fixture**

Add to `backend/tests/test_nexus_calculator.py`:

```python
@pytest.fixture
def multi_year_transactions():
    """
    Sample transactions spanning 2 years.

    California:
    - 2023: $120,000 (exceeds $100K threshold → NEXUS)
    - 2024: $80,000 (below threshold but nexus persists)
    """
    return [
        # 2023 transactions (total $120,000)
        {'analysis_id': 'test-123', 'customer_state': 'CA', 'transaction_date': '2023-01-15', 'sales_amount': 50000, 'sales_channel': 'direct'},
        {'analysis_id': 'test-123', 'customer_state': 'CA', 'transaction_date': '2023-06-20', 'sales_amount': 40000, 'sales_channel': 'direct'},
        {'analysis_id': 'test-123', 'customer_state': 'CA', 'transaction_date': '2023-11-10', 'sales_amount': 30000, 'sales_channel': 'direct'},

        # 2024 transactions (total $80,000)
        {'analysis_id': 'test-123', 'customer_state': 'CA', 'transaction_date': '2024-03-15', 'sales_amount': 40000, 'sales_channel': 'direct'},
        {'analysis_id': 'test-123', 'customer_state': 'CA', 'transaction_date': '2024-09-20', 'sales_amount': 40000, 'sales_channel': 'direct'},
    ]
```

**Step 2: Write failing test for year aggregation**

Add to `backend/tests/test_nexus_calculator.py`:

```python
def test_aggregate_transactions_by_state_and_year(calculator, mock_supabase, multi_year_transactions):
    """
    Verify transactions are aggregated by state AND year.
    Should return dict with (state, year) tuple as key.
    """
    import pandas as pd

    # Mock database response
    mock_result = Mock()
    mock_result.data = multi_year_transactions
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

    # Call method
    aggregates = calculator._aggregate_transactions_by_state_and_year('test-123')

    # Should have 2 entries: (CA, 2023) and (CA, 2024)
    assert ('CA', 2023) in aggregates
    assert ('CA', 2024) in aggregates

    # Verify 2023 totals
    assert aggregates[('CA', 2023)]['total_sales'] == 120000.0
    assert aggregates[('CA', 2023)]['transaction_count'] == 3

    # Verify 2024 totals
    assert aggregates[('CA', 2024)]['total_sales'] == 80000.0
    assert aggregates[('CA', 2024)]['transaction_count'] == 2
```

**Step 3: Run test to verify it fails**

```bash
pytest tests/test_nexus_calculator.py::test_aggregate_transactions_by_state_and_year -v
```

Expected output:
```
FAILED - AttributeError: 'NexusCalculator' object has no attribute '_aggregate_transactions_by_state_and_year'
```

**Step 4: Commit failing test**

```bash
git add tests/test_nexus_calculator.py
git commit -m "test: add failing test for multi-year transaction aggregation

Test verifies transactions are grouped by (state, year) tuple
instead of state only."
```

---

### Task 10: Implement _aggregate_transactions_by_state_and_year

**Files:**
- Modify: `backend/app/services/nexus_calculator.py`

**Step 1: Rename existing method**

Find `_aggregate_transactions_by_state` (line 139) and rename to `_aggregate_transactions_by_state_and_year`:

```python
def _aggregate_transactions_by_state_and_year(self, analysis_id: str) -> Dict:
    """
    Aggregate all transactions by state AND year.

    Returns dict with (state_code, year) tuple as key and aggregates as value.
    Example: {('CA', 2023): {...}, ('CA', 2024): {...}}
    """
    try:
        # Get all transactions
        result = self.supabase.table('sales_transactions') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not result.data:
            return {}

        # Convert to DataFrame for easy aggregation
        df = pd.DataFrame(result.data)

        # Parse dates and extract year
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        df['year'] = df['transaction_date'].dt.year

        # Aggregate by state AND year
        aggregates = {}
        for (state_code, year), group in df.groupby(['customer_state', 'year']):
            # Calculate totals
            total_sales = float(group['sales_amount'].sum())
            transaction_count = len(group)

            # Split by sales channel
            direct_df = group[group['sales_channel'] == 'direct']
            marketplace_df = group[group['sales_channel'] == 'marketplace']

            direct_sales = float(direct_df['sales_amount'].sum()) if len(direct_df) > 0 else 0.0
            marketplace_sales = float(marketplace_df['sales_amount'].sum()) if len(marketplace_df) > 0 else 0.0

            aggregates[(state_code, year)] = {
                'total_sales': total_sales,
                'transaction_count': transaction_count,
                'direct_sales': direct_sales,
                'marketplace_sales': marketplace_sales
            }

        return aggregates

    except Exception as e:
        logger.error(f"Error aggregating transactions: {str(e)}")
        raise
```

**Step 2: Run test to verify it passes**

```bash
pytest tests/test_nexus_calculator.py::test_aggregate_transactions_by_state_and_year -v
```

Expected output:
```
PASSED
```

**Step 3: Commit**

```bash
git add app/services/nexus_calculator.py
git commit -m "feat: aggregate transactions by state and year

Change from grouping by state only to grouping by (state, year) tuple.
Enables per-year nexus calculation."
```

---

### Task 11: Add test for sticky nexus logic

**Files:**
- Modify: `backend/tests/test_nexus_calculator.py`

**Step 1: Write failing test for sticky nexus**

Add to `backend/tests/test_nexus_calculator.py`:

```python
def test_sticky_nexus_persists_across_years(calculator):
    """
    Verify "sticky nexus" - once established, persists even if sales drop.

    Year 1: $120K sales → Exceeds $100K threshold → Nexus established
    Year 2: $80K sales → Below threshold BUT nexus persists
    """
    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }

    tax_rate = {'combined_rate': 0.0825}

    # Year 1: $120K sales → exceeds threshold
    result_2023 = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2023,
        total_sales=120000.0,
        transaction_count=150,
        direct_sales=120000.0,
        marketplace_sales=0.0,
        threshold=threshold,
        tax_rate=tax_rate,
        mf_rules=None,
        nexus_first_established=None  # First year, no prior nexus
    )

    # Should establish nexus
    assert result_2023['nexus_status'] == 'has_nexus'
    assert result_2023['nexus_type'] == 'economic'
    assert result_2023['nexus_first_established_year'] == 2023
    assert result_2023['nexus_is_sticky'] == False  # Not sticky yet (first year)

    # Year 2: $80K sales → below threshold, BUT nexus persists from 2023
    result_2024 = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2024,
        total_sales=80000.0,
        transaction_count=100,
        direct_sales=80000.0,
        marketplace_sales=0.0,
        threshold=threshold,
        tax_rate=tax_rate,
        mf_rules=None,
        nexus_first_established=2023  # Nexus established in prior year
    )

    # Should STILL have nexus (sticky from 2023)
    assert result_2024['nexus_status'] == 'has_nexus'
    assert result_2024['nexus_type'] == 'economic'
    assert result_2024['nexus_first_established_year'] == 2023  # Still 2023
    assert result_2024['nexus_is_sticky'] == True  # Sticky nexus!

    # Liability should be calculated on $80K (even though below threshold)
    assert result_2024['base_tax'] == 6600.0  # $80K × 8.25%
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_nexus_calculator.py::test_sticky_nexus_persists_across_years -v
```

Expected output:
```
FAILED - AttributeError: 'NexusCalculator' object has no attribute '_determine_state_nexus_for_year'
```

**Step 3: Commit failing test**

```bash
git add tests/test_nexus_calculator.py
git commit -m "test: add failing test for sticky nexus logic

Test verifies:
- Year 1: $120K → Nexus established
- Year 2: $80K (below threshold) → Nexus persists (sticky)
- Liability calculated on Year 2 sales despite below threshold"
```

---

### Task 12: Implement _determine_state_nexus_for_year with sticky logic

**Files:**
- Modify: `backend/app/services/nexus_calculator.py`

**Step 1: Create new method _determine_state_nexus_for_year**

Add this method after the existing `_determine_state_nexus`:

```python
def _determine_state_nexus_for_year(
    self,
    state_code: str,
    year: int,
    total_sales: float,
    transaction_count: int,
    direct_sales: float,
    marketplace_sales: float,
    threshold: Dict,
    tax_rate: Dict,
    mf_rules: Dict = None,
    nexus_first_established: int = None
) -> Dict:
    """
    Determine if nexus exists for a specific state in a specific year.

    Implements "sticky nexus" logic:
    - If nexus was established in a prior year, it persists (nexus_is_sticky=True)
    - Otherwise, check threshold for this year

    Args:
        state_code: State code (e.g., 'CA')
        year: Calendar year
        total_sales: Total sales for this state in this year
        transaction_count: Number of transactions
        direct_sales: Direct sales (non-marketplace)
        marketplace_sales: Marketplace sales
        threshold: Economic nexus threshold rules
        tax_rate: Tax rates
        mf_rules: Marketplace facilitator rules
        nexus_first_established: Year when nexus was first established (None if not yet established)

    Returns:
        Dict with nexus determination and calculated liability
    """

    # Sticky nexus: if nexus was established in a prior year, it persists
    if nexus_first_established is not None and nexus_first_established < year:
        nexus_status = 'has_nexus'
        nexus_type = 'economic'
        nexus_is_sticky = True
    else:
        # No prior nexus - check threshold for this year
        nexus_is_sticky = False

        # Determine which sales count toward threshold
        if mf_rules and mf_rules.get('count_toward_threshold'):
            threshold_sales = total_sales
        else:
            threshold_sales = direct_sales

        # Check revenue and transaction thresholds
        revenue_meets = False
        transaction_meets = False
        approaching_threshold = False

        if threshold:
            if threshold.get('revenue_threshold'):
                revenue_meets = threshold_sales >= threshold['revenue_threshold']

                # Check if approaching (90-100% of threshold)
                if not revenue_meets and threshold_sales >= (threshold['revenue_threshold'] * 0.9):
                    approaching_threshold = True

            if threshold.get('transaction_threshold'):
                transaction_meets = transaction_count >= threshold['transaction_threshold']

            # Apply operator logic
            if threshold['threshold_operator'] == 'or':
                has_nexus = revenue_meets or transaction_meets
            elif threshold['threshold_operator'] == 'and':
                has_nexus = revenue_meets and transaction_meets
            else:
                has_nexus = revenue_meets
        else:
            has_nexus = False

        # Determine nexus status and type
        if has_nexus:
            nexus_status = 'has_nexus'
            nexus_type = 'economic'
            # Set nexus_first_established to current year if not already set
            if nexus_first_established is None:
                nexus_first_established = year
        elif approaching_threshold:
            nexus_status = 'approaching'
            nexus_type = 'none'
        else:
            nexus_status = 'none'
            nexus_type = 'none'

    # Calculate liability
    estimated_liability = 0.0
    base_tax = 0.0
    taxable_sales = 0.0

    if nexus_status == 'has_nexus' and tax_rate:
        # Determine which sales are taxable
        if mf_rules and mf_rules.get('exclude_from_liability'):
            taxable_sales = direct_sales
        else:
            taxable_sales = total_sales

        # Calculate tax (rates already in decimal format)
        combined_rate = tax_rate['combined_rate']
        base_tax = taxable_sales * combined_rate
        estimated_liability = base_tax

    return {
        'state': state_code,
        'year': year,
        'nexus_status': nexus_status,
        'nexus_type': nexus_type,
        'nexus_first_established_year': nexus_first_established,
        'nexus_is_sticky': nexus_is_sticky,
        'total_sales': total_sales,
        'direct_sales': direct_sales,
        'marketplace_sales': marketplace_sales,
        'taxable_sales': taxable_sales,
        'transaction_count': transaction_count,
        'estimated_liability': estimated_liability,
        'base_tax': base_tax,
        'interest': 0.0,
        'penalties': 0.0,
        'threshold': threshold.get('revenue_threshold', 100000) if threshold else 100000
    }
```

**Step 2: Run test to verify it passes**

```bash
pytest tests/test_nexus_calculator.py::test_sticky_nexus_persists_across_years -v
```

Expected output:
```
PASSED
```

**Step 3: Commit**

```bash
git add app/services/nexus_calculator.py
git commit -m "feat: implement sticky nexus logic in _determine_state_nexus_for_year

Sticky nexus behavior:
- If nexus established in prior year → persists (nexus_is_sticky=True)
- Even if current year sales below threshold
- Liability calculated on all sales

Example:
- 2023: $120K → Nexus ✅
- 2024: $80K → Still has nexus ✅ (sticky from 2023)"
```

---

### Task 13: Update calculate_nexus_for_analysis for multi-year

**Files:**
- Modify: `backend/app/services/nexus_calculator.py`

**Step 1: Update main calculation loop**

Find `calculate_nexus_for_analysis` method and replace the aggregation and processing logic (lines 24-70) with:

```python
def calculate_nexus_for_analysis(self, analysis_id: str) -> Dict:
    """
    Main calculation method - determines nexus for all states per year.
    Implements "sticky nexus" - once established, persists across years.

    Returns summary with total states analyzed, states with nexus, etc.
    """
    try:
        logger.info(f"Starting nexus calculation for analysis {analysis_id}")

        # Step 1: Get analysis period
        analysis_result = self.supabase.table('analyses').select(
            'analysis_period_start, analysis_period_end'
        ).eq('id', analysis_id).execute()

        if not analysis_result.data:
            raise ValueError("Analysis not found")

        analysis = analysis_result.data[0]
        start_year = analysis['analysis_period_start'].year if hasattr(analysis['analysis_period_start'], 'year') else int(analysis['analysis_period_start'][:4])
        end_year = analysis['analysis_period_end'].year if hasattr(analysis['analysis_period_end'], 'year') else int(analysis['analysis_period_end'][:4])

        # Step 2: Aggregate transactions by state AND year
        state_year_aggregates = self._aggregate_transactions_by_state_and_year(analysis_id)

        if not state_year_aggregates:
            logger.warning(f"No transactions found for analysis {analysis_id}")

        # Step 3: Get reference data for all states
        thresholds = self._get_economic_nexus_thresholds()
        tax_rates = self._get_tax_rates()
        mf_rules = self._get_marketplace_facilitator_rules()
        all_state_codes = self._get_all_state_codes()

        # Step 4: Calculate nexus for each state for each year
        results = []
        total_liability = Decimal('0.00')
        states_with_nexus_set = set()  # Track unique states with nexus
        states_approaching = 0

        for state_code in all_state_codes:
            # Track when nexus was first established for this state
            nexus_first_established = None

            # Process each year chronologically
            for year in range(start_year, end_year + 1):
                # Get aggregates for this state-year (or zeros if no transactions)
                agg = state_year_aggregates.get((state_code, year), {
                    'total_sales': 0.0,
                    'transaction_count': 0,
                    'direct_sales': 0.0,
                    'marketplace_sales': 0.0
                })

                # Determine nexus for this state-year
                result = self._determine_state_nexus_for_year(
                    state_code=state_code,
                    year=year,
                    total_sales=agg['total_sales'],
                    transaction_count=agg['transaction_count'],
                    direct_sales=agg['direct_sales'],
                    marketplace_sales=agg['marketplace_sales'],
                    threshold=thresholds.get(state_code),
                    tax_rate=tax_rates.get(state_code),
                    mf_rules=mf_rules.get(state_code),
                    nexus_first_established=nexus_first_established
                )

                # Update nexus tracking
                if result['nexus_status'] == 'has_nexus':
                    states_with_nexus_set.add(state_code)
                    total_liability += Decimal(str(result['estimated_liability']))

                    # Record when nexus was first established
                    if nexus_first_established is None:
                        nexus_first_established = year

                if result['nexus_status'] == 'approaching':
                    states_approaching += 1

                # Add analysis_id to result
                result['analysis_id'] = analysis_id
                results.append(result)

        logger.info(f"Prepared {len(results)} state-year results for analysis {analysis_id}")

        # Step 5: Save results to database
        self._save_results_to_database(analysis_id, results)

        # Step 6: Update analysis summary
        states_with_nexus = len(states_with_nexus_set)
        self._update_analysis_summary(
            analysis_id=analysis_id,
            total_liability=float(total_liability),
            states_with_nexus=states_with_nexus
        )

        logger.info(f"Calculation complete for analysis {analysis_id}: {states_with_nexus} states with nexus")

        return {
            "total_states_analyzed": len(all_state_codes),
            "total_state_year_results": len(results),
            "states_with_nexus": states_with_nexus,
            "states_approaching_threshold": states_approaching,
            "total_estimated_liability": float(total_liability),
            "status": "complete"
        }

    except Exception as e:
        logger.error(f"Error calculating nexus for analysis {analysis_id}: {str(e)}")
        raise
```

**Step 2: Update _save_results_to_database to include new fields**

Find `_save_results_to_database` and update the insert to include year and sticky nexus fields:

```python
def _save_results_to_database(self, analysis_id: str, results: List[Dict]):
    """
    Save state-year results to database.
    """
    try:
        # Prepare data for insertion
        state_results = []
        for result in results:
            state_results.append({
                'analysis_id': analysis_id,
                'state': result['state'],
                'year': result['year'],
                'nexus_type': result['nexus_type'],
                'nexus_date': datetime.utcnow().date().isoformat() if result['nexus_status'] == 'has_nexus' else None,
                'nexus_first_established_year': result.get('nexus_first_established_year'),
                'nexus_is_sticky': result.get('nexus_is_sticky', False),
                'total_sales': result['total_sales'],
                'direct_sales': result['direct_sales'],
                'marketplace_sales': result['marketplace_sales'],
                'taxable_sales': result.get('taxable_sales', result['total_sales']),
                'transaction_count': result.get('transaction_count', 0),
                'estimated_liability': result['estimated_liability'],
                'base_tax': result['base_tax'],
                'interest': result['interest'],
                'penalties': result['penalties'],
                'approaching_threshold': result['nexus_status'] == 'approaching',
                'threshold': result.get('threshold', 100000)
            })

        # Delete existing results (in case of re-calculation)
        self.supabase.table('state_results').delete().eq('analysis_id', analysis_id).execute()

        # Insert new results in batches
        batch_size = 50
        for i in range(0, len(state_results), batch_size):
            batch = state_results[i:i + batch_size]
            self.supabase.table('state_results').insert(batch).execute()

        logger.info(f"Saved {len(state_results)} state-year results for analysis {analysis_id}")

    except Exception as e:
        logger.error(f"Error saving results to database: {str(e)}")
        raise
```

**Step 3: Commit**

```bash
git add app/services/nexus_calculator.py
git commit -m "feat: update calculate_nexus_for_analysis for multi-year tracking

Changes:
- Process each year in analysis period chronologically
- Track nexus_first_established per state
- Apply sticky nexus logic across years
- Save per-year results to database
- Calculate total liability across all years"
```

---

### Task 14: Integration test for multi-year calculation

**Files:**
- Create: `backend/tests/integration/test_multi_year_nexus.py`

**Step 1: Create integration test file**

Create `backend/tests/integration/test_multi_year_nexus.py`:

```python
"""
Integration test for multi-year nexus calculation.
Tests complete flow: transactions → aggregation → calculation → database storage.
"""

import pytest
from app.services.nexus_calculator import NexusCalculator
from app.core.database import get_supabase
import uuid
from datetime import datetime


@pytest.fixture
def test_analysis_id():
    """Create a test analysis."""
    supabase = get_supabase()

    # Create test user
    user_result = supabase.table('users').insert({
        'email': f'test_{uuid.uuid4()}@example.com',
        'company_name': 'Test Company'
    }).execute()

    user_id = user_result.data[0]['id']

    # Create test analysis (2023-2024)
    analysis_result = supabase.table('analyses').insert({
        'user_id': user_id,
        'client_company_name': 'Test Client',
        'analysis_period_start': '2023-01-01',
        'analysis_period_end': '2024-12-31',
        'status': 'processing'
    }).execute()

    analysis_id = analysis_result.data[0]['id']

    yield analysis_id

    # Cleanup
    supabase.table('analyses').delete().eq('id', analysis_id).execute()
    supabase.table('users').delete().eq('id', user_id).execute()


@pytest.fixture
def test_transactions(test_analysis_id):
    """Insert test transactions spanning 2 years."""
    supabase = get_supabase()

    transactions = [
        # California 2023: $120,000 (exceeds $100K threshold)
        {'analysis_id': test_analysis_id, 'transaction_date': '2023-01-15', 'customer_state': 'CA', 'sales_amount': 50000, 'sales_channel': 'direct', 'transaction_id': 'TX001'},
        {'analysis_id': test_analysis_id, 'transaction_date': '2023-06-20', 'customer_state': 'CA', 'sales_amount': 40000, 'sales_channel': 'direct', 'transaction_id': 'TX002'},
        {'analysis_id': test_analysis_id, 'transaction_date': '2023-11-10', 'customer_state': 'CA', 'sales_amount': 30000, 'sales_channel': 'direct', 'transaction_id': 'TX003'},

        # California 2024: $80,000 (below threshold but nexus persists)
        {'analysis_id': test_analysis_id, 'transaction_date': '2024-03-15', 'customer_state': 'CA', 'sales_amount': 40000, 'sales_channel': 'direct', 'transaction_id': 'TX004'},
        {'analysis_id': test_analysis_id, 'transaction_date': '2024-09-20', 'customer_state': 'CA', 'sales_amount': 40000, 'sales_channel': 'direct', 'transaction_id': 'TX005'},

        # Texas 2023: $50,000 (below threshold)
        {'analysis_id': test_analysis_id, 'transaction_date': '2023-05-10', 'customer_state': 'TX', 'sales_amount': 50000, 'sales_channel': 'direct', 'transaction_id': 'TX006'},

        # Texas 2024: $150,000 (exceeds threshold in 2024 only)
        {'analysis_id': test_analysis_id, 'transaction_date': '2024-07-15', 'customer_state': 'TX', 'sales_amount': 150000, 'sales_channel': 'direct', 'transaction_id': 'TX007'},
    ]

    supabase.table('sales_transactions').insert(transactions).execute()

    return transactions


def test_multi_year_sticky_nexus_end_to_end(test_analysis_id, test_transactions):
    """
    Integration test: Multi-year nexus with sticky logic.

    California:
    - 2023: $120K → Nexus established
    - 2024: $80K → Nexus persists (sticky)

    Texas:
    - 2023: $50K → No nexus
    - 2024: $150K → Nexus established (not sticky, first year)
    """
    supabase = get_supabase()
    calculator = NexusCalculator(supabase)

    # Run calculation
    result = calculator.calculate_nexus_for_analysis(test_analysis_id)

    # Verify summary
    assert result['status'] == 'complete'
    assert result['states_with_nexus'] == 2  # CA and TX

    # Fetch CA results from database
    ca_results = supabase.table('state_results').select('*').eq(
        'analysis_id', test_analysis_id
    ).eq('state', 'CA').order('year').execute()

    assert len(ca_results.data) == 2  # 2 years

    # CA 2023: Nexus established
    ca_2023 = ca_results.data[0]
    assert ca_2023['year'] == 2023
    assert ca_2023['total_sales'] == 120000.0
    assert ca_2023['nexus_type'] == 'economic'
    assert ca_2023['nexus_first_established_year'] == 2023
    assert ca_2023['nexus_is_sticky'] == False  # First year
    assert ca_2023['estimated_liability'] > 0

    # CA 2024: Nexus persists (sticky)
    ca_2024 = ca_results.data[1]
    assert ca_2024['year'] == 2024
    assert ca_2024['total_sales'] == 80000.0
    assert ca_2024['nexus_type'] == 'economic'
    assert ca_2024['nexus_first_established_year'] == 2023  # Still 2023
    assert ca_2024['nexus_is_sticky'] == True  # Sticky from 2023!
    assert ca_2024['estimated_liability'] > 0  # Liability on $80K

    # Fetch TX results
    tx_results = supabase.table('state_results').select('*').eq(
        'analysis_id', test_analysis_id
    ).eq('state', 'TX').order('year').execute()

    assert len(tx_results.data) == 2

    # TX 2023: No nexus
    tx_2023 = tx_results.data[0]
    assert tx_2023['year'] == 2023
    assert tx_2023['total_sales'] == 50000.0
    assert tx_2023['nexus_type'] == 'none'
    assert tx_2023['nexus_first_established_year'] is None
    assert tx_2023['estimated_liability'] == 0

    # TX 2024: Nexus established (not sticky, first year with nexus)
    tx_2024 = tx_results.data[1]
    assert tx_2024['year'] == 2024
    assert tx_2024['total_sales'] == 150000.0
    assert tx_2024['nexus_type'] == 'economic'
    assert tx_2024['nexus_first_established_year'] == 2024
    assert tx_2024['nexus_is_sticky'] == False  # Not sticky (first year)
    assert tx_2024['estimated_liability'] > 0
```

**Step 2: Run integration test**

```bash
pytest tests/integration/test_multi_year_nexus.py -v
```

Expected output:
```
PASSED
```

**Step 3: Commit**

```bash
git add tests/integration/test_multi_year_nexus.py
git commit -m "test: add integration test for multi-year sticky nexus

Test verifies:
- CA 2023: $120K → Nexus established
- CA 2024: $80K → Nexus persists (sticky from 2023)
- TX 2023: $50K → No nexus
- TX 2024: $150K → Nexus established (not sticky)"
```

---

### Task 15: Manual testing of Phase 2

**Files:**
- None (manual testing)

**Step 1: Re-run calculation on existing multi-year analysis**

If you have existing test data spanning multiple years:

```bash
# Trigger re-calculation
curl -X POST http://localhost:8000/api/v1/analyses/{analysis_id}/calculate \
  -H "Authorization: Bearer {your_token}"
```

**Step 2: Verify per-year results in database**

```sql
-- Check results are stored per year
SELECT
  state,
  year,
  total_sales,
  nexus_type,
  nexus_first_established_year,
  nexus_is_sticky,
  estimated_liability
FROM state_results
WHERE analysis_id = '{your_analysis_id}'
  AND state IN ('CA', 'NY', 'TX')
ORDER BY state, year;
```

Expected: Multiple rows per state (one per year)

**Step 3: Verify sticky nexus in action**

```sql
-- Find states where nexus persists despite sales dropping
SELECT
  state,
  year,
  total_sales,
  nexus_first_established_year,
  nexus_is_sticky,
  estimated_liability
FROM state_results
WHERE analysis_id = '{your_analysis_id}'
  AND nexus_is_sticky = TRUE
ORDER BY state, year;
```

Expected: States with `nexus_is_sticky = TRUE` where sales are below threshold

**Step 4: Document results**

```bash
echo "# Phase 2 Testing Results

## Multi-Year Tracking
- Results stored per year: ✅
- Each state has record for each year
- Year range: 2023-2024

## Sticky Nexus
- CA 2023: $120K → Nexus established
- CA 2024: $80K → Nexus persists ✅
- nexus_is_sticky = TRUE ✅
- Liability calculated on all $80K ✅

$(date)" >> docs/testing/phase-2-results.md
```

**Step 5: Commit test results**

```bash
git add docs/testing/phase-2-results.md
git commit -m "docs: document Phase 2 testing results

Verified:
- Per-year nexus tracking working
- Sticky nexus logic functioning correctly
- Liability calculated for all years"
```

---

## Phase 3: Update Frontend API Endpoints (Optional - If Needed)

**Note:** The frontend State Detail Page already fetches per-year data (analyses.py:1040-1135), so it should work with the new multi-year storage. However, the Results Summary page may need updates.

---

### Task 16: Update Results Summary API to aggregate multi-year data

**Files:**
- Modify: `backend/app/api/v1/analyses.py:685-783`

**Step 1: Update get_results_summary to aggregate across years**

Find `get_results_summary` endpoint and update to group by state (aggregating years):

```python
@router.get("/{analysis_id}/results/summary")
async def get_results_summary(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get high-level summary of nexus analysis results.
    Aggregates multi-year data into per-state summaries.
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq(
            'id', analysis_id
        ).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get all state-year results
        results_query = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not results_query.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No results found. Please run calculation first."
            )

        state_year_results = results_query.data

        # Group by state (aggregate across years)
        from collections import defaultdict
        state_aggregates = defaultdict(lambda: {
            'total_sales': 0,
            'estimated_liability': 0,
            'years_with_nexus': [],
            'nexus_first_established': None
        })

        for result in state_year_results:
            state = result['state']
            state_aggregates[state]['total_sales'] += float(result['total_sales'] or 0)
            state_aggregates[state]['estimated_liability'] += float(result['estimated_liability'] or 0)

            if result['nexus_type'] in ['economic', 'physical', 'both']:
                state_aggregates[state]['years_with_nexus'].append(result['year'])

                if state_aggregates[state]['nexus_first_established'] is None:
                    state_aggregates[state]['nexus_first_established'] = result.get('nexus_first_established_year')

        # Get state names
        states_query = supabase.table('states').select('code,name').execute()
        state_names = {s['code']: s['name'] for s in states_query.data}

        # Calculate summary statistics
        total_states_analyzed = len(state_aggregates)
        states_with_nexus = len([s for s, data in state_aggregates.items() if len(data['years_with_nexus']) > 0])
        states_no_nexus = total_states_analyzed - states_with_nexus
        total_liability = sum(data['estimated_liability'] for data in state_aggregates.values())
        total_revenue = sum(data['total_sales'] for data in state_aggregates.values())

        # Get top states by liability
        top_states_data = sorted(
            [(state, data) for state, data in state_aggregates.items() if data['estimated_liability'] > 0],
            key=lambda x: x[1]['estimated_liability'],
            reverse=True
        )[:5]

        top_states_formatted = [{
            "state": state,
            "state_name": state_names.get(state, state),
            "estimated_liability": data['estimated_liability'],
            "total_sales": data['total_sales'],
            "years_with_nexus": len(data['years_with_nexus']),
            "nexus_first_established": data['nexus_first_established']
        } for state, data in top_states_data]

        return {
            "analysis_id": analysis_id,
            "company_name": analysis['client_company_name'],
            "period_start": analysis['analysis_period_start'],
            "period_end": analysis['analysis_period_end'],
            "status": analysis['status'],
            "completed_at": analysis['updated_at'],
            "summary": {
                "total_states_analyzed": total_states_analyzed,
                "states_with_nexus": states_with_nexus,
                "states_no_nexus": states_no_nexus,
                "total_estimated_liability": total_liability,
                "total_revenue": total_revenue,
                "multi_year_analysis": True
            },
            "top_states_by_liability": top_states_formatted
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting results summary for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results summary: {str(e)}"
        )
```

**Step 2: Commit**

```bash
git add app/api/v1/analyses.py
git commit -m "feat: update results summary to aggregate multi-year data

Results summary now:
- Groups state-year results by state
- Sums liability across all years
- Shows years_with_nexus count
- Displays nexus_first_established year"
```

---

### Task 17: Update get_state_results endpoint for multi-year

**Files:**
- Modify: `backend/app/api/v1/analyses.py:785-905`

**Step 1: Add year filter parameter**

Update `get_state_results` endpoint to support optional year filter:

```python
@router.get("/{analysis_id}/results/states")
async def get_state_results(
    analysis_id: str,
    year: int = None,  # ← ADD THIS PARAMETER
    user_id: str = Depends(require_auth)
):
    """
    Get complete state-by-state results for table display.
    Returns all states including those with $0 sales.

    Optional year filter to show results for specific year.
    If year=None, aggregates across all years.
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists
        analysis_response = supabase.table('analyses').select('*').eq(
            'id', analysis_id
        ).eq('user_id', user_id).execute()

        if not analysis_response.data:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Build query
        query = supabase.table('state_results').select('*').eq('analysis_id', analysis_id)

        # Apply year filter if provided
        if year is not None:
            query = query.eq('year', year)

        state_results_response = query.execute()

        if not state_results_response.data:
            raise HTTPException(status_code=404, detail="No results found")

        # Get state names
        states_response = supabase.table('states').select('code, name').execute()
        state_names = {s['code']: s['name'] for s in states_response.data}

        # If no year filter, aggregate by state
        if year is None:
            from collections import defaultdict
            state_aggregates = defaultdict(lambda: {
                'total_sales': 0,
                'direct_sales': 0,
                'marketplace_sales': 0,
                'estimated_liability': 0,
                'has_nexus_any_year': False
            })

            for result in state_results_response.data:
                state = result['state']
                state_aggregates[state]['total_sales'] += float(result['total_sales'] or 0)
                state_aggregates[state]['direct_sales'] += float(result['direct_sales'] or 0)
                state_aggregates[state]['marketplace_sales'] += float(result['marketplace_sales'] or 0)
                state_aggregates[state]['estimated_liability'] += float(result['estimated_liability'] or 0)

                if result['nexus_type'] in ['economic', 'physical', 'both']:
                    state_aggregates[state]['has_nexus_any_year'] = True

            # Format aggregated results
            formatted_states = []
            for state_code, data in state_aggregates.items():
                formatted_states.append({
                    'state_code': state_code,
                    'state_name': state_names.get(state_code, state_code),
                    'nexus_status': 'has_nexus' if data['has_nexus_any_year'] else 'no_nexus',
                    'total_sales': data['total_sales'],
                    'direct_sales': data['direct_sales'],
                    'marketplace_sales': data['marketplace_sales'],
                    'estimated_liability': data['estimated_liability']
                })
        else:
            # Year-specific results (existing logic)
            formatted_states = []
            for state in state_results_response.data:
                nexus_type = state.get('nexus_type', 'none')

                if nexus_type in ['physical', 'economic', 'both']:
                    nexus_status = 'has_nexus'
                elif state.get('approaching_threshold', False):
                    nexus_status = 'approaching'
                else:
                    nexus_status = 'no_nexus'

                formatted_states.append({
                    'state_code': state['state'],
                    'state_name': state_names.get(state['state'], state['state']),
                    'year': state['year'],
                    'nexus_status': nexus_status,
                    'nexus_type': nexus_type,
                    'total_sales': float(state.get('total_sales', 0)),
                    'direct_sales': float(state.get('direct_sales', 0)),
                    'marketplace_sales': float(state.get('marketplace_sales', 0)),
                    'estimated_liability': float(state.get('estimated_liability', 0)),
                    'nexus_is_sticky': state.get('nexus_is_sticky', False)
                })

        return {
            'analysis_id': analysis_id,
            'year': year,
            'total_states': len(formatted_states),
            'states': formatted_states
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch state results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Commit**

```bash
git add app/api/v1/analyses.py
git commit -m "feat: add year filter to get_state_results endpoint

Supports:
- year=2023: Show only 2023 results
- year=None: Aggregate all years
- Includes nexus_is_sticky flag for filtered years"
```

---

### Task 18: Final verification and documentation

**Files:**
- Create: `docs/testing/final-verification.md`

**Step 1: Run full test suite**

```bash
# Unit tests
pytest tests/test_nexus_calculator.py -v

# Integration tests
pytest tests/integration/test_multi_year_nexus.py -v

# All tests
pytest -v
```

Expected: All tests PASS

**Step 2: Create final verification checklist**

Create `docs/testing/final-verification.md`:

```markdown
# Final Verification Checklist

## Phase 1: Critical Bug Fixes

### Tax Rate Fix
- [x] Tax rates used as-is (not divided by 100)
- [x] Liability ~100x higher than before
- [x] Test passes: `test_tax_rate_not_divided_by_100`

### Marketplace Facilitator
- [x] MF rules fetched from database
- [x] Marketplace sales excluded from liability
- [x] Test passes: `test_marketplace_sales_excluded_from_liability`

## Phase 2: Multi-Year Nexus

### Per-Year Tracking
- [x] Transactions aggregated by (state, year)
- [x] Results stored with year column
- [x] Test passes: `test_aggregate_transactions_by_state_and_year`

### Sticky Nexus
- [x] Nexus persists across years
- [x] nexus_is_sticky flag set correctly
- [x] Liability calculated even when below threshold
- [x] Test passes: `test_sticky_nexus_persists_across_years`

### Integration Test
- [x] Full flow works end-to-end
- [x] Test passes: `test_multi_year_sticky_nexus_end_to_end`

## Database Migrations

- [x] Migration 006: taxable_sales column added
- [x] Migration 007: year, nexus_first_established_year, nexus_is_sticky added
- [x] Unique constraint: (analysis_id, state, year)
- [x] Indexes created

## API Endpoints

- [x] Results summary aggregates multi-year data
- [x] State results support year filter
- [x] State detail page works with per-year data

## Manual Testing

- [x] Re-ran calculation on test data
- [x] Liability increased ~100x (bug fixed)
- [x] Marketplace sales excluded
- [x] Per-year results stored correctly
- [x] Sticky nexus verified in database

## Documentation

- [x] Implementation plan created
- [x] Test results documented
- [x] README updated (if needed)

---

**All checks passed!** ✅

Date: $(date)
```

**Step 3: Commit final verification**

```bash
git add docs/testing/final-verification.md
git commit -m "docs: final verification checklist

All Phase 1 and Phase 2 tasks complete:
- Tax rate bug fixed (100x liability increase)
- Marketplace facilitator rules implemented
- Multi-year nexus tracking working
- Sticky nexus logic functioning
- All tests passing"
```

---

## Summary

This implementation plan fixes:

1. **Tax liability 100x too low** - Fixed division bug
2. **Marketplace facilitator rules ignored** - Now excludes MF sales from liability
3. **No multi-year tracking** - Results now stored per year
4. **No sticky nexus** - Nexus persists across years once established

### Key Changes:

- **Database:** Added `year`, `nexus_first_established_year`, `nexus_is_sticky`, `taxable_sales` columns
- **Calculator:** New `_determine_state_nexus_for_year()` method with sticky logic
- **Aggregation:** Changed from by-state to by-state-and-year
- **Tests:** Comprehensive unit and integration tests

### Testing Strategy:

- **TDD approach:** Write failing test → Implement → Verify passes → Commit
- **Frequent commits:** One commit per logical change
- **Integration tests:** Verify full flow works end-to-end

---

## Execution Options

Plan saved to `docs/plans/2025-11-04-multi-year-nexus-liability-fix.md`.

**Two execution approaches:**

### 1. Subagent-Driven Development (Recommended - This Session)
- **REQUIRED SUB-SKILL:** Use `superpowers:subagent-driven-development`
- Stay in this session
- Fresh subagent executes each task
- Code review between tasks
- Fast iteration with quality gates

### 2. Parallel Session (Batch Execution)
- Open new session with executing-plans skill
- **REQUIRED SUB-SKILL:** New session uses `superpowers:executing-plans`
- Execute tasks in batches with review checkpoints
- Good for larger plans with many independent tasks

**Which approach would you like to use?**
