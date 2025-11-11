# Multi-Year Nexus Calculation and Liability Fix

**Created:** November 4, 2025
**Status:** Planning
**Priority:** HIGH - Contains critical calculation bugs

---

## Executive Summary

This document outlines critical bugs in the nexus calculation and liability estimation, along with a comprehensive plan to fix multi-year nexus tracking and implement "sticky nexus" logic.

### Critical Issues Found

1. **CRITICAL BUG: Tax liability 100x too low** - Tax rate being divided by 100 when already in decimal format
2. **Multi-year nexus not tracked** - Results aggregated across all years, no year-by-year tracking
3. **No "sticky nexus" logic** - Doesn't track nexus persistence across years
4. **Marketplace facilitator rules ignored** - Not checking whether to exclude marketplace sales from liability
5. **Interest and penalties not calculated** - Currently stubbed out as $0

---

## Issue #1: Tax Liability 100x Too Low (CRITICAL)

### Current Code (nexus_calculator.py:294-302)

```python
if has_nexus and tax_rate:
    # Simple calculation: total_sales * combined_tax_rate
    # Note: This is a simplified estimate. Real calculation would be more complex.
    combined_rate = tax_rate['combined_rate'] / 100  # ❌ BUG: Already a decimal!
    base_tax = total_sales * combined_rate
    estimated_liability = base_tax
```

### The Bug

**Database stores rates as decimals:**
- California: `state_rate = 0.0725` (7.25%), `avg_local_rate = 0.0100` (1%)
- Combined: `0.0825` (8.25%)

**Code divides by 100 AGAIN:**
- Takes `0.0825` and divides by 100 → `0.000825`
- Liability: `$100,000 * 0.000825 = $82.50` instead of `$8,250`
- **Result: Liability is 100x too low**

### The Fix

```python
if has_nexus and tax_rate:
    combined_rate = tax_rate['combined_rate']  # Already decimal, don't divide!
    base_tax = total_sales * combined_rate
    estimated_liability = base_tax
```

---

## Issue #2: Multi-Year Nexus Not Tracked

### Current Behavior

The `state_results` table schema:

```sql
CREATE TABLE state_results (
  id SERIAL PRIMARY KEY,
  analysis_id UUID,
  state CHAR(2),
  nexus_type VARCHAR(20),
  nexus_date DATE,
  total_sales DECIMAL(12,2),      -- ❌ Aggregated across ALL years
  direct_sales DECIMAL(12,2),
  marketplace_sales DECIMAL(12,2),
  estimated_liability DECIMAL(12,2),
  -- ❌ NO YEAR FIELD!
);
```

**Problems:**
1. No `year` column - can't track year-by-year results
2. Calculator aggregates ALL transactions across entire analysis period (nexus_calculator.py:139-182)
3. Frontend DOES calculate per-year (analyses.py:1040-1135) but results aren't stored
4. Can't track when nexus was first established vs. when it persists

### Current Aggregation Logic

```python
# nexus_calculator.py:139-182
def _aggregate_transactions_by_state(self, analysis_id: str) -> Dict:
    # Get ALL transactions (no year filter)
    result = self.supabase.table('sales_transactions') \
        .select('*') \
        .eq('analysis_id', analysis_id) \
        .execute()

    # Aggregate by state ONLY (not by year)
    for state_code in df['customer_state'].unique():
        state_df = df[df['customer_state'] == state_code]
        total_sales = float(state_df['sales_amount'].sum())  # All years combined!
```

### Impact

- **Incorrect nexus determination**: If Year 1 has $50K sales and Year 2 has $60K sales, they're combined to $110K, triggering nexus incorrectly
- **Can't identify when nexus started**: Lost temporal information
- **Can't calculate per-year liability**: Critical for accurate tax estimation
- **No "sticky nexus"**: Can't track that nexus persists from prior years

---

## Issue #3: No "Sticky Nexus" Logic

### What is "Sticky Nexus"?

In real-world tax compliance:

1. **Year 1 (2023)**: Company has $120K sales in California → **Nexus established**
2. **Year 2 (2024)**: Company has $80K sales in California (below threshold)
   - **Nexus still exists!** (doesn't go away just because sales dropped)
   - Company still owes tax on all $80K of sales
3. **Nexus persists** until company formally closes registration with state

### Current (Incorrect) Behavior

- Calculates threshold for each year independently
- If Year 2 sales drop below threshold, shows "No Nexus" (wrong!)
- Doesn't track nexus establishment date across years

### Required Behavior

```
Analysis Period: 2023-2024

California:
├── 2023: $120K sales → CROSSED THRESHOLD → Nexus established
│   ├── Nexus status: "has_nexus" (newly established)
│   └── Liability: $120K × 8.25% = $9,900
│
└── 2024: $80K sales → Below threshold BUT nexus persists!
    ├── Nexus status: "has_nexus" (sticky from 2023)
    ├── Liability: $80K × 8.25% = $6,600
    └── Note: "Nexus established in 2023, persists from prior year"
```

---

## Issue #4: Marketplace Facilitator Rules Ignored

### Database Schema

```sql
CREATE TABLE marketplace_facilitator_rules (
  state CHAR(2),
  count_toward_threshold BOOLEAN,      -- Do MF sales count toward threshold?
  exclude_from_liability BOOLEAN,      -- Exclude MF sales from liability?
  effective_from DATE,
  effective_to DATE
);
```

### Current Code (Incorrect)

```python
# nexus_calculator.py:294-302
if has_nexus and tax_rate:
    combined_rate = tax_rate['combined_rate'] / 100
    base_tax = total_sales * combined_rate  # ❌ Uses ALL sales, including marketplace!
```

### The Problem

Most states have marketplace facilitator laws:
- **Marketplace sales (Amazon, eBay, etc.) count toward threshold determination**
- **But marketplace sales are EXCLUDED from liability calculation** (marketplace collects the tax)

Example:
- Company has $100K direct sales + $50K marketplace sales = $150K total
- Threshold check: $150K → **Nexus established** ✅
- Liability calculation: Should be on $100K (direct only), NOT $150K total
- Current code calculates on $150K → **Overstates liability by 50%!**

Wait, actually the user said liability is too LOW, not too high. So this might not be the issue, or the 100x bug overshadows it. But we still need to fix it.

### The Fix

1. Fetch marketplace facilitator rules for each state
2. Use rules to determine:
   - Which sales count toward threshold
   - Which sales are taxable (excluded from liability if marketplace)

```python
# Pseudo-code
mf_rules = get_marketplace_facilitator_rules(state_code)

# Threshold determination
if mf_rules['count_toward_threshold']:
    threshold_sales = total_sales  # Include marketplace
else:
    threshold_sales = direct_sales  # Exclude marketplace

# Liability calculation
if mf_rules['exclude_from_liability']:
    taxable_sales = direct_sales  # Only direct sales are taxable
else:
    taxable_sales = total_sales  # All sales taxable

base_tax = taxable_sales * combined_rate
```

---

## Issue #5: Interest and Penalties Not Calculated

### Current Code

```python
# nexus_calculator.py:314-315
'interest': 0.0,  # TODO: Calculate interest based on time period
'penalties': 0.0,  # TODO: Calculate penalties if applicable
```

### Database Schema Available

```sql
CREATE TABLE interest_penalty_rates (
  state CHAR(2),
  annual_interest_rate DECIMAL(6,4),
  interest_calculation_method VARCHAR(20),
  late_registration_penalty_rate DECIMAL(6,4),
  vda_interest_waived BOOLEAN,
  vda_penalties_waived BOOLEAN,
  -- ... more fields
);
```

### Why This Matters

For clients who have never registered:
- **Interest accrues** from when nexus was established until present
- **Late registration penalties** may apply
- Can be 10-30% of total liability in severe cases

**Example:**
- Nexus established: January 2023
- Current date: November 2025 (almost 3 years)
- Base tax: $10,000
- Interest (3% APR for 3 years): ~$900
- Late registration penalty (10%): $1,000
- **Total liability: $11,900** (19% higher than base)

---

## Proposed Solution Architecture

### Phase 1: Critical Bug Fixes (IMMEDIATE)

**Goal:** Fix the 100x liability bug and marketplace facilitator rules

#### Changes to `nexus_calculator.py`

1. **Fix tax rate bug** (line 300):
   ```python
   # BEFORE
   combined_rate = tax_rate['combined_rate'] / 100

   # AFTER
   combined_rate = tax_rate['combined_rate']  # Already decimal
   ```

2. **Add marketplace facilitator rules** to `_determine_state_nexus`:
   ```python
   # Fetch MF rules
   mf_rules = self._get_marketplace_facilitator_rules(state_code)

   # Determine taxable sales
   if mf_rules and mf_rules['exclude_from_liability']:
       taxable_sales = direct_sales
   else:
       taxable_sales = total_sales

   # Calculate liability
   base_tax = taxable_sales * combined_rate
   ```

3. **Add new method** `_get_marketplace_facilitator_rules`:
   ```python
   def _get_marketplace_facilitator_rules(self, state_code: str) -> Dict:
       """Get current marketplace facilitator rules for state."""
       result = self.supabase.table('marketplace_facilitator_rules') \
           .select('*') \
           .eq('state', state_code) \
           .is_('effective_to', 'null') \
           .execute()

       if result.data:
           return result.data[0]
       return None
   ```

**Impact:** Liability will be calculated correctly, approximately 100x higher than current (fixing the bug).

---

### Phase 2: Multi-Year Tracking (HIGH PRIORITY)

**Goal:** Track nexus and liability per year, enable "sticky nexus" logic

#### Database Schema Changes

**Option A: Add year column to state_results (RECOMMENDED)**

```sql
-- Migration: Add year column to state_results
ALTER TABLE state_results ADD COLUMN year INTEGER;

-- Update unique constraint
ALTER TABLE state_results
ADD CONSTRAINT unique_analysis_state_year
UNIQUE (analysis_id, state, year);

-- Existing data: populate year from analysis period
UPDATE state_results sr
SET year = EXTRACT(YEAR FROM a.analysis_period_end)
FROM analyses a
WHERE sr.analysis_id = a.id;
```

**Option B: Create new state_results_by_year table (CLEAN SLATE)**

```sql
CREATE TABLE state_results_by_year (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  year INTEGER NOT NULL,

  -- Nexus information
  nexus_status VARCHAR(20) NOT NULL, -- 'has_nexus', 'approaching', 'none'
  nexus_type VARCHAR(20), -- 'physical', 'economic', 'both', 'none'
  nexus_first_established_year INTEGER, -- Track when nexus originally started
  nexus_is_sticky BOOLEAN DEFAULT FALSE, -- True if carrying over from prior year

  -- Sales data
  total_sales DECIMAL(12,2) NOT NULL,
  direct_sales DECIMAL(12,2) NOT NULL,
  marketplace_sales DECIMAL(12,2) NOT NULL,
  taxable_sales DECIMAL(12,2) NOT NULL, -- Sales subject to tax
  transaction_count INTEGER NOT NULL,

  -- Liability
  estimated_liability DECIMAL(12,2) NOT NULL,
  base_tax DECIMAL(12,2) NOT NULL,
  interest DECIMAL(12,2) DEFAULT 0,
  penalties DECIMAL(12,2) DEFAULT 0,

  -- Threshold tracking
  threshold_revenue DECIMAL(12,2),
  threshold_transactions INTEGER,
  threshold_percentage DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_analysis_state_year UNIQUE (analysis_id, state, year)
);

CREATE INDEX idx_state_results_year ON state_results_by_year(analysis_id, state, year);
```

**Recommendation:** Use Option B (new table) for clean architecture.

#### Calculator Logic Changes

**New calculation flow:**

```python
def calculate_nexus_for_analysis(self, analysis_id: str) -> Dict:
    """
    Calculate nexus per state per year, with sticky nexus logic.
    """

    # 1. Get analysis period
    analysis = self._get_analysis(analysis_id)
    start_year = analysis['analysis_period_start'].year
    end_year = analysis['analysis_period_end'].year

    # 2. Aggregate transactions by state AND year
    state_year_aggregates = self._aggregate_transactions_by_state_and_year(analysis_id)

    # 3. Get all reference data
    thresholds = self._get_economic_nexus_thresholds()
    tax_rates = self._get_tax_rates()
    mf_rules = self._get_all_marketplace_facilitator_rules()

    # 4. Process each state
    all_results = []
    total_liability = Decimal('0.00')

    for state_code in all_state_codes:
        # Track nexus across years for this state
        nexus_first_established = None

        # Process each year in chronological order
        for year in range(start_year, end_year + 1):
            year_agg = state_year_aggregates.get((state_code, year), {
                'total_sales': 0,
                'direct_sales': 0,
                'marketplace_sales': 0,
                'transaction_count': 0
            })

            # Determine nexus for this year
            result = self._determine_state_nexus_for_year(
                state_code=state_code,
                year=year,
                aggregates=year_agg,
                threshold=thresholds.get(state_code),
                tax_rate=tax_rates.get(state_code),
                mf_rules=mf_rules.get(state_code),
                nexus_first_established=nexus_first_established  # Sticky nexus!
            )

            # Track when nexus was first established
            if result['nexus_status'] == 'has_nexus' and nexus_first_established is None:
                nexus_first_established = year

            all_results.append(result)
            total_liability += Decimal(str(result['estimated_liability']))

    # 5. Save all results
    self._save_results_to_database(analysis_id, all_results)

    # 6. Update analysis summary
    self._update_analysis_summary(analysis_id, float(total_liability), ...)

    return {...}


def _aggregate_transactions_by_state_and_year(self, analysis_id: str) -> Dict:
    """
    Aggregate transactions by state AND year.

    Returns dict with (state_code, year) tuple as key.
    """
    result = self.supabase.table('sales_transactions') \
        .select('*') \
        .eq('analysis_id', analysis_id) \
        .execute()

    if not result.data:
        return {}

    df = pd.DataFrame(result.data)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['year'] = df['transaction_date'].dt.year

    aggregates = {}

    # Group by BOTH state and year
    for (state_code, year), group in df.groupby(['customer_state', 'year']):
        aggregates[(state_code, year)] = {
            'total_sales': float(group['sales_amount'].sum()),
            'transaction_count': len(group),
            'direct_sales': float(group[group['sales_channel'] == 'direct']['sales_amount'].sum()),
            'marketplace_sales': float(group[group['sales_channel'] == 'marketplace']['sales_amount'].sum())
        }

    return aggregates


def _determine_state_nexus_for_year(
    self,
    state_code: str,
    year: int,
    aggregates: Dict,
    threshold: Dict,
    tax_rate: Dict,
    mf_rules: Dict,
    nexus_first_established: int = None  # Sticky nexus tracking
) -> Dict:
    """
    Determine nexus for a specific state in a specific year.
    Implements "sticky nexus" - once established, persists.
    """

    total_sales = aggregates['total_sales']
    direct_sales = aggregates['direct_sales']
    marketplace_sales = aggregates['marketplace_sales']
    transaction_count = aggregates['transaction_count']

    # Sticky nexus: if nexus was established in a prior year, it persists
    if nexus_first_established is not None and nexus_first_established < year:
        nexus_status = 'has_nexus'
        nexus_type = 'economic'
        nexus_is_sticky = True
    else:
        # Check threshold for this year
        nexus_is_sticky = False

        # Determine which sales count toward threshold
        if mf_rules and mf_rules.get('count_toward_threshold'):
            threshold_sales = total_sales
        else:
            threshold_sales = direct_sales

        # Check threshold
        revenue_meets = False
        transaction_meets = False

        if threshold and threshold['revenue_threshold']:
            revenue_meets = threshold_sales >= threshold['revenue_threshold']

        if threshold and threshold['transaction_threshold']:
            transaction_meets = transaction_count >= threshold['transaction_threshold']

        # Apply operator
        if threshold:
            if threshold['threshold_operator'] == 'or':
                has_nexus = revenue_meets or transaction_meets
            else:
                has_nexus = revenue_meets and transaction_meets
        else:
            has_nexus = False

        if has_nexus:
            nexus_status = 'has_nexus'
            nexus_type = 'economic'
        elif threshold and threshold['revenue_threshold']:
            if threshold_sales >= (threshold['revenue_threshold'] * 0.9):
                nexus_status = 'approaching'
                nexus_type = 'none'
            else:
                nexus_status = 'none'
                nexus_type = 'none'
        else:
            nexus_status = 'none'
            nexus_type = 'none'

    # Calculate liability
    estimated_liability = 0.0
    base_tax = 0.0
    taxable_sales = 0.0

    if nexus_status == 'has_nexus' and tax_rate:
        # Determine taxable sales (exclude marketplace if applicable)
        if mf_rules and mf_rules.get('exclude_from_liability'):
            taxable_sales = direct_sales
        else:
            taxable_sales = total_sales

        # Calculate tax (FIXED: don't divide by 100!)
        combined_rate = tax_rate['combined_rate']  # Already decimal
        base_tax = taxable_sales * combined_rate
        estimated_liability = base_tax  # TODO: Add interest/penalties

    return {
        'analysis_id': analysis_id,
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
        'interest': 0.0,  # TODO: Phase 3
        'penalties': 0.0,  # TODO: Phase 3
        'threshold_revenue': threshold.get('revenue_threshold') if threshold else None,
        'threshold_transactions': threshold.get('transaction_threshold') if threshold else None
    }
```

---

### Phase 3: Interest and Penalties (MEDIUM PRIORITY)

**Goal:** Calculate interest and penalties based on state rules

#### Implementation

```python
def _calculate_interest_and_penalties(
    self,
    state_code: str,
    base_tax: Decimal,
    nexus_established_year: int,
    current_year: int
) -> Tuple[Decimal, Decimal]:
    """
    Calculate interest and penalties from nexus establishment to present.
    """

    # Get interest/penalty rates
    ip_rates = self.supabase.table('interest_penalty_rates') \
        .select('*') \
        .eq('state', state_code) \
        .is_('effective_to', 'null') \
        .execute()

    if not ip_rates.data:
        return (Decimal('0'), Decimal('0'))

    rates = ip_rates.data[0]

    # Calculate years of non-compliance
    years_overdue = current_year - nexus_established_year

    # Calculate interest
    annual_rate = Decimal(str(rates['annual_interest_rate']))

    if rates['interest_calculation_method'] == 'simple':
        interest = base_tax * annual_rate * years_overdue
    elif rates['interest_calculation_method'] == 'compound_annual':
        interest = base_tax * ((1 + annual_rate) ** years_overdue - 1)
    else:
        interest = Decimal('0')  # TODO: compound_monthly, compound_daily

    # Calculate penalties
    penalty_rate = Decimal(str(rates.get('late_registration_penalty_rate', 0)))
    penalties = base_tax * penalty_rate

    # Apply min/max
    if rates.get('late_registration_penalty_min'):
        penalties = max(penalties, Decimal(str(rates['late_registration_penalty_min'])))
    if rates.get('late_registration_penalty_max'):
        penalties = min(penalties, Decimal(str(rates['late_registration_penalty_max'])))

    return (interest, penalties)
```

---

## Implementation Plan

### Step 1: Fix Critical Bugs (1-2 hours)

**Files to modify:**
- `backend/app/services/nexus_calculator.py`

**Tasks:**
1. Fix tax rate division bug (line 300)
2. Add `_get_marketplace_facilitator_rules()` method
3. Update `_determine_state_nexus()` to:
   - Fetch MF rules
   - Calculate taxable_sales (exclude marketplace if applicable)
   - Use taxable_sales for liability calculation
4. Test with real data to verify liability is now ~100x higher

**Testing:**
- Run calculation on existing analysis
- Verify liability increases by ~100x (fixing the bug)
- Verify marketplace sales are excluded from liability (if state has MF law)

---

### Step 2: Database Migration (30 minutes)

**Create migration file:** `006_add_year_to_state_results.sql`

```sql
-- Add year column to state_results
ALTER TABLE state_results ADD COLUMN year INTEGER;

-- Add new fields for sticky nexus tracking
ALTER TABLE state_results ADD COLUMN nexus_first_established_year INTEGER;
ALTER TABLE state_results ADD COLUMN nexus_is_sticky BOOLEAN DEFAULT FALSE;
ALTER TABLE state_results ADD COLUMN taxable_sales DECIMAL(12,2);

-- Add unique constraint
ALTER TABLE state_results
ADD CONSTRAINT unique_analysis_state_year
UNIQUE (analysis_id, state, year);

-- Add index
CREATE INDEX idx_state_results_year ON state_results(analysis_id, state, year);

-- Populate year for existing data (use analysis end year as default)
UPDATE state_results sr
SET year = EXTRACT(YEAR FROM a.analysis_period_end)::INTEGER
FROM analyses a
WHERE sr.analysis_id = a.id AND sr.year IS NULL;

-- Make year NOT NULL after backfill
ALTER TABLE state_results ALTER COLUMN year SET NOT NULL;
```

**Run migration:**
```bash
# In Supabase SQL Editor, run the migration
```

---

### Step 3: Update Calculator for Multi-Year (4-6 hours)

**Files to modify:**
- `backend/app/services/nexus_calculator.py`

**Tasks:**

1. **Update `_aggregate_transactions_by_state_and_year()`:**
   - Change return format to `Dict[(state, year), aggregates]`
   - Group transactions by both state AND year

2. **Update `calculate_nexus_for_analysis()`:**
   - Get analysis period (start/end years)
   - Loop through each year in the period
   - For each state, process years chronologically
   - Track `nexus_first_established` to implement sticky nexus
   - Save per-year results

3. **Update `_determine_state_nexus()` → rename to `_determine_state_nexus_for_year()`:**
   - Add `year` parameter
   - Add `nexus_first_established` parameter for sticky logic
   - If `nexus_first_established < year`, set nexus_status = 'has_nexus' (sticky)
   - Add `nexus_is_sticky` field to return value

4. **Update `_save_results_to_database()`:**
   - Include `year` in insert
   - Include `nexus_first_established_year`, `nexus_is_sticky`, `taxable_sales`

**Testing:**
- Create test analysis with multi-year data (2023-2024)
- Verify nexus calculated per year
- Verify sticky nexus: if 2023 has nexus, 2024 should too (even if below threshold)

---

### Step 4: Update Frontend Display (2-3 hours)

**Files to modify:**
- `frontend/app/analysis/[id]/results/page.tsx` (Results summary)
- `frontend/lib/api.ts` (TypeScript interfaces)

**Tasks:**

1. **Update Results Summary API:**
   - Calculate total liability across all years
   - Show year-by-year breakdown
   - Highlight states with sticky nexus

2. **Update State Table:**
   - Add year filter dropdown
   - Show per-year results
   - Add indicator for sticky nexus ("Established 2023, persists")

3. **State Detail Page:**
   - Already has year filtering! (lines 1040-1135 in analyses.py)
   - Just verify it works with new multi-year storage

**Testing:**
- Load Results page, verify per-year data displays
- Switch year filter, verify data changes
- Check state detail page year filtering

---

### Step 5: Add Interest/Penalties (Phase 3, Future)

**Estimated:** 4-6 hours

**Tasks:**
1. Implement `_calculate_interest_and_penalties()` method
2. Update liability calculation to include interest/penalties
3. Add breakdown to frontend (base tax + interest + penalties = total)
4. Add VDA scenario toggle (waive penalties)

---

## Testing Strategy

### Unit Tests

```python
# tests/test_nexus_calculator.py

def test_tax_rate_not_divided_by_100():
    """Verify tax rate is used as-is (already decimal)."""
    calculator = NexusCalculator(supabase)

    # Mock tax rate data
    tax_rate = {'combined_rate': 0.0825}  # 8.25%

    result = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2024,
        aggregates={'total_sales': 100000, ...},
        tax_rate=tax_rate,
        ...
    )

    # Should be $100,000 * 0.0825 = $8,250
    assert result['base_tax'] == 8250.00


def test_marketplace_sales_excluded_from_liability():
    """Verify marketplace sales are excluded when state has MF law."""
    calculator = NexusCalculator(supabase)

    mf_rules = {'exclude_from_liability': True}
    aggregates = {
        'total_sales': 150000,
        'direct_sales': 100000,
        'marketplace_sales': 50000
    }

    result = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2024,
        aggregates=aggregates,
        mf_rules=mf_rules,
        tax_rate={'combined_rate': 0.0825},
        ...
    )

    # Taxable sales should be $100K (direct only), not $150K (total)
    assert result['taxable_sales'] == 100000.00
    assert result['base_tax'] == 8250.00  # $100K * 8.25%


def test_sticky_nexus_persists_across_years():
    """Verify nexus persists in Year 2 even if sales drop below threshold."""
    calculator = NexusCalculator(supabase)

    # Year 1: $120K sales → exceeds $100K threshold
    result_2023 = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2023,
        aggregates={'total_sales': 120000, ...},
        threshold={'revenue_threshold': 100000, 'threshold_operator': 'or'},
        nexus_first_established=None
    )
    assert result_2023['nexus_status'] == 'has_nexus'

    # Year 2: $80K sales → below threshold, BUT nexus persists from 2023
    result_2024 = calculator._determine_state_nexus_for_year(
        state_code='CA',
        year=2024,
        aggregates={'total_sales': 80000, ...},
        threshold={'revenue_threshold': 100000, 'threshold_operator': 'or'},
        nexus_first_established=2023  # Sticky!
    )
    assert result_2024['nexus_status'] == 'has_nexus'
    assert result_2024['nexus_is_sticky'] == True
```

### Integration Tests

```python
def test_multi_year_calculation_end_to_end():
    """Full test: Upload multi-year CSV, verify per-year results."""

    # 1. Create analysis for 2023-2024
    analysis_id = create_analysis(period_start='2023-01-01', period_end='2024-12-31')

    # 2. Upload CSV with transactions spanning 2 years
    upload_transactions(analysis_id, 'test_data_multi_year.csv')

    # 3. Run calculation
    calculator.calculate_nexus_for_analysis(analysis_id)

    # 4. Verify results stored per year
    results = supabase.table('state_results') \
        .select('*') \
        .eq('analysis_id', analysis_id) \
        .eq('state', 'CA') \
        .order('year') \
        .execute()

    assert len(results.data) == 2  # One record per year

    result_2023 = results.data[0]
    result_2024 = results.data[1]

    assert result_2023['year'] == 2023
    assert result_2024['year'] == 2024

    # If 2023 had nexus, 2024 should too (sticky)
    if result_2023['nexus_status'] == 'has_nexus':
        assert result_2024['nexus_status'] == 'has_nexus'
        assert result_2024['nexus_is_sticky'] == True
```

---

## Rollout Plan

### Phase 1: Immediate (This Week)
- ✅ Document issues (this file)
- ⏳ Fix critical bugs (tax rate division, marketplace rules)
- ⏳ Deploy to staging
- ⏳ Test with real data
- ⏳ Deploy to production

### Phase 2: Multi-Year (Next Week)
- ⏳ Database migration
- ⏳ Update calculator logic
- ⏳ Update frontend
- ⏳ End-to-end testing
- ⏳ Deploy to production

### Phase 3: Interest/Penalties (Future Sprint)
- ⏳ Implement calculation logic
- ⏳ Add VDA scenario toggle
- ⏳ Update frontend display
- ⏳ Deploy to production

---

## Risk Assessment

### High Risk
- **Database migration:** Modifying state_results schema could break existing analyses
  - **Mitigation:** Backfill year column, maintain backward compatibility

### Medium Risk
- **Calculation changes:** Liability will change dramatically (100x increase)
  - **Mitigation:** Document expected change, verify against manual calculations

### Low Risk
- **Frontend updates:** Minimal changes needed (already has year filtering)

---

## Success Criteria

### Phase 1 (Critical Bugs)
- ✅ Liability calculated correctly (not 100x too low)
- ✅ Marketplace sales excluded from liability when applicable
- ✅ All existing tests pass
- ✅ Manual verification: CA with $100K direct + $50K marketplace = $8,250 liability (not $12,375)

### Phase 2 (Multi-Year)
- ✅ Results stored per year
- ✅ Sticky nexus implemented: if Year 1 has nexus, Year 2 does too
- ✅ Frontend displays per-year breakdowns
- ✅ State detail page year filtering works correctly

### Phase 3 (Interest/Penalties)
- ✅ Interest calculated based on years overdue
- ✅ Penalties applied per state rules
- ✅ VDA scenarios supported (waive penalties)

---

## Appendix: Example Calculations

### Before Fix (INCORRECT)

**California, 2024:**
- Sales: $100,000 direct + $50,000 marketplace = $150,000 total
- Tax rate in DB: `0.0825` (8.25%)
- Code divides by 100: `0.0825 / 100 = 0.000825`
- Liability: `$150,000 * 0.000825 = $123.75` ❌ (WAY too low!)

### After Fix (CORRECT)

**California, 2024:**
- Sales: $100,000 direct + $50,000 marketplace = $150,000 total
- Marketplace excluded from liability: Taxable sales = $100,000
- Tax rate: `0.0825` (8.25%, NOT divided)
- Liability: `$100,000 * 0.0825 = $8,250.00` ✅

**Difference:** $8,250 vs. $123.75 = **67x higher** (approximately 100x as expected)

---

## Questions for Review

1. **Should we use Option A (add column) or Option B (new table) for multi-year tracking?**
   - Recommendation: Option A is faster, Option B is cleaner

2. **Should we backfill existing analyses with per-year data?**
   - Recommendation: Yes, re-run calculations for existing analyses

3. **Should sticky nexus apply retroactively?**
   - Example: If we discover 2022 had nexus, should 2023-2024 automatically have sticky nexus?
   - Recommendation: Yes, but add manual override

4. **Should we add VDA scenarios in Phase 3 or defer to later?**
   - Recommendation: Defer, focus on core calculation first

---

**Document Version:** 1.0
**Last Updated:** November 4, 2025
**Author:** Claude (with assistance from Mark)
**Status:** Ready for Review
