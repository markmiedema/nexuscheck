# Nexus Accuracy Implementation Guide

**Created**: 2025-01-14
**Priority**: 🔴 Critical (Sprint 1, Week 1)
**Estimated Effort**: 3 days

---

## Overview

This guide provides step-by-step implementation for the 3 critical nexus accuracy fixes:

1. **Transaction Threshold Checking** (1 day) - 24 states need this
2. **NY + CT Lookback Periods** (0.5 day) - Major + medium markets
3. **Marketplace Facilitator Rules Fix** (Complete! ✅)

---

## Part 1: Transaction Threshold Checking

### Problem

Currently, the code only checks **revenue thresholds**:
```python
if total_revenue >= revenue_threshold:
    has_nexus = True
```

But 24 states have **transaction thresholds** too:
- Alabama: $250,000 **OR** 200 transactions
- Most states: $100,000 **OR** 200 transactions

**Impact**: Missing nexus for high-transaction, low-revenue sellers.

### Solution

Check BOTH thresholds with AND/OR operator logic.

---

### Step 1: Update Data Tracking (1 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_calculate_calendar_year_lookback()` method (around line 200)

**BEFORE**:
```python
# Current code only tracks revenue
total_revenue = sum(t.sales_amount for t in year_transactions)
```

**AFTER**:
```python
# Track BOTH revenue and transaction count
total_revenue = sum(t.sales_amount for t in year_transactions)
transaction_count = len(year_transactions)  # Each row = 1 transaction

# Store for later use
threshold_metrics = {
    'total_revenue': total_revenue,
    'transaction_count': transaction_count
}
```

---

### Step 2: Create Threshold Checking Function (1 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: Add new method after `_find_threshold_crossing()` (around line 600)

```python
def _check_threshold_met(
    self,
    total_revenue: Decimal,
    transaction_count: int,
    threshold_config: dict
) -> bool:
    """
    Check if economic nexus threshold is met using AND/OR logic.

    Args:
        total_revenue: Total sales for the period
        transaction_count: Number of transactions for the period
        threshold_config: Threshold configuration from database

    Returns:
        True if threshold is met, False otherwise

    Examples:
        # OR operator (most common)
        $120k revenue, 150 transactions, ($100k OR 200 txn) → TRUE (revenue met)
        $80k revenue, 250 transactions, ($100k OR 200 txn) → TRUE (txn met)
        $80k revenue, 150 transactions, ($100k OR 200 txn) → FALSE (neither met)

        # AND operator (rare)
        $120k revenue, 250 transactions, ($100k AND 200 txn) → TRUE (both met)
        $120k revenue, 150 transactions, ($100k AND 200 txn) → FALSE (txn not met)
    """
    revenue_threshold = threshold_config.get('revenue_threshold', 0)
    transaction_threshold = threshold_config.get('transaction_threshold', 0)
    operator = threshold_config.get('threshold_operator', 'or').lower()

    # Check if each threshold is met
    meets_revenue = False
    meets_transactions = False

    if revenue_threshold and revenue_threshold > 0:
        meets_revenue = total_revenue >= Decimal(revenue_threshold)

    if transaction_threshold and transaction_threshold > 0:
        meets_transactions = transaction_count >= transaction_threshold

    # Apply operator logic
    if operator == 'and':
        # Both must be met
        return meets_revenue and meets_transactions
    else:  # 'or' is default
        # Either can be met
        return meets_revenue or meets_transactions
```

---

### Step 3: Update Calendar Year Lookback (2 hours)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_calculate_calendar_year_lookback()` method (around line 220)

**BEFORE**:
```python
# Old code (only checks revenue)
prior_year_total = sum(t.sales_amount for t in prior_year_transactions)

if prior_year_total >= threshold:
    # Has nexus
```

**AFTER**:
```python
# New code (checks both revenue and transactions)
prior_year_total = sum(t.sales_amount for t in prior_year_transactions)
prior_year_txn_count = len(prior_year_transactions)

# Use new threshold checking function
if self._check_threshold_met(
    total_revenue=prior_year_total,
    transaction_count=prior_year_txn_count,
    threshold_config=threshold_config
):
    # Has nexus
    logger.info(f"Threshold met: ${prior_year_total:,.2f} revenue, {prior_year_txn_count} transactions")
```

**Repeat this pattern** for:
- Current year checking
- "Current OR Previous" logic
- Sticky nexus checking

---

### Step 4: Update Rolling 12 Month Lookback (2 hours)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_calculate_rolling_12_month_lookback()` method (around line 400)

**BEFORE**:
```python
# Old code
rolling_total = sum(t.sales_amount for t in window_transactions)

if rolling_total >= threshold:
    # Threshold crossed
```

**AFTER**:
```python
# New code
rolling_total = sum(t.sales_amount for t in window_transactions)
rolling_txn_count = len(window_transactions)

if self._check_threshold_met(
    total_revenue=rolling_total,
    transaction_count=rolling_txn_count,
    threshold_config=threshold_config
):
    # Threshold crossed
    logger.info(f"Rolling threshold met: ${rolling_total:,.2f}, {rolling_txn_count} txns")
```

---

### Step 5: Update Threshold Crossing Detection (1 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_find_threshold_crossing()` method (around line 560)

**BEFORE**:
```python
# Old code (only tracks revenue running total)
running_total = Decimal('0')
for txn in sorted_transactions:
    running_total += txn.sales_amount
    if running_total >= threshold:
        return txn.transaction_date  # Crossed on this date
```

**AFTER**:
```python
# New code (tracks both revenue and transaction count)
running_revenue = Decimal('0')
running_txn_count = 0

for txn in sorted_transactions:
    running_revenue += txn.sales_amount
    running_txn_count += 1

    # Check if threshold crossed
    if self._check_threshold_met(
        total_revenue=running_revenue,
        transaction_count=running_txn_count,
        threshold_config=threshold_config
    ):
        # Log which threshold triggered
        if transaction_threshold and running_txn_count >= transaction_threshold:
            logger.info(f"Transaction threshold crossed: {running_txn_count} >= {transaction_threshold}")
        if revenue_threshold and running_revenue >= revenue_threshold:
            logger.info(f"Revenue threshold crossed: ${running_revenue:,.2f} >= ${revenue_threshold:,.2f}")

        return txn.transaction_date  # Crossed on this date
```

---

### Step 6: Update state_results Storage (0.5 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_save_results_to_database()` method (around line 900)

Make sure `transaction_count` is saved correctly:

```python
result_data = {
    # ... existing fields ...
    'transaction_count': transaction_count,  # ← Ensure this is populated
    # ... other fields ...
}
```

---

### Testing Transaction Thresholds

**Test Case 1: Revenue Met, Transactions Not**
```python
# Alabama: $250k OR 200 transactions
# Scenario: $300k revenue, 100 transactions
# Expected: HAS NEXUS (revenue threshold met)

transactions = [
    # 100 transactions @ $3,000 each = $300,000
]
assert has_nexus == True
assert nexus_reason == "revenue_threshold"
```

**Test Case 2: Transactions Met, Revenue Not**
```python
# Most states: $100k OR 200 transactions
# Scenario: $50k revenue, 250 transactions
# Expected: HAS NEXUS (transaction threshold met)

transactions = [
    # 250 transactions @ $200 each = $50,000
]
assert has_nexus == True
assert nexus_reason == "transaction_threshold"
```

**Test Case 3: AND Operator (Rare)**
```python
# Hypothetical: $100k AND 200 transactions
# Scenario: $120k revenue, 150 transactions
# Expected: NO NEXUS (transaction threshold not met)

transactions = [
    # 150 transactions @ $800 each = $120,000
]
assert has_nexus == False  # Both must be met for AND
```

---

## Part 2: NY + CT Lookback Periods

### New York: "Preceding 4 Sales Tax Quarters"

**Problem**: NY uses quarterly lookback, not calendar year.

**Solution**: Implement quarter-based lookback.

---

### Step 1: Add Quarterly Lookback Function (2 hours)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: Add new method after `_calculate_rolling_12_month_lookback()` (around line 550)

```python
def _calculate_quarterly_lookback(
    self,
    state_transactions: list,
    threshold_config: dict,
    analysis_year: int
) -> list:
    """
    Calculate nexus for states using quarterly lookback periods.

    Used by:
    - New York: "Preceding 4 Sales Tax Quarters"
    - Vermont: "Preceding 4 calendar Quarters"

    Quarters align with calendar:
    Q1: Jan 1 - Mar 31
    Q2: Apr 1 - Jun 30
    Q3: Jul 1 - Sep 30
    Q4: Oct 1 - Dec 31

    "Preceding 4 quarters" means the 4 complete quarters before current quarter.

    Example (analysis in Q2 2024):
    - Current quarter: Q2 2024 (Apr-Jun)
    - Preceding 4 quarters: Q2 2023, Q3 2023, Q4 2023, Q1 2024
    - Check if sales in those 4 quarters exceed threshold
    """
    from datetime import date
    from dateutil.relativedelta import relativedelta

    logger.info(f"[QUARTERLY LOOKBACK] Checking {len(state_transactions)} transactions")

    # Determine quarters to check
    # For each year in analysis, check preceding 4 quarters
    years = sorted(set(t.transaction_date.year for t in state_transactions))
    results = []

    for year in years:
        # For each quarter in the year
        for quarter in range(1, 5):  # Q1, Q2, Q3, Q4
            quarter_end_date = self._get_quarter_end_date(year, quarter)

            # Get preceding 4 quarters
            quarters_to_check = []
            for i in range(1, 5):
                lookback_date = quarter_end_date - relativedelta(months=3*i)
                lookback_quarter = (lookback_date.month - 1) // 3 + 1
                lookback_year = lookback_date.year

                quarter_start, quarter_end = self._get_quarter_dates(lookback_year, lookback_quarter)
                quarters_to_check.append((quarter_start, quarter_end))

            # Filter transactions in these 4 quarters
            period_transactions = [
                t for t in state_transactions
                if any(start <= t.transaction_date <= end for start, end in quarters_to_check)
            ]

            if not period_transactions:
                continue

            # Calculate totals
            total_revenue = sum(t.sales_amount for t in period_transactions)
            transaction_count = len(period_transactions)

            # Check threshold
            if self._check_threshold_met(total_revenue, transaction_count, threshold_config):
                # Find exact crossing date
                nexus_date = self._find_threshold_crossing(
                    period_transactions,
                    threshold_config
                )

                # Calculate obligation start (month after crossing)
                obligation_start = self._calculate_obligation_start_date(nexus_date)

                # Build result for this quarter/year
                result = {
                    'year': year,
                    'quarter': quarter,
                    'nexus_type': 'economic',
                    'nexus_date': nexus_date,
                    'obligation_start_date': obligation_start,
                    'total_sales': total_revenue,
                    'transaction_count': transaction_count,
                    # ... other fields
                }
                results.append(result)

        return results

def _get_quarter_dates(self, year: int, quarter: int) -> tuple:
    """Get start and end dates for a calendar quarter."""
    from datetime import date

    if quarter == 1:
        return date(year, 1, 1), date(year, 3, 31)
    elif quarter == 2:
        return date(year, 4, 1), date(year, 6, 30)
    elif quarter == 3:
        return date(year, 7, 1), date(year, 9, 30)
    else:  # Q4
        return date(year, 10, 1), date(year, 12, 31)

def _get_quarter_end_date(self, year: int, quarter: int) -> date:
    """Get end date for a quarter."""
    _, end_date = self._get_quarter_dates(year, quarter)
    return end_date
```

---

### Connecticut: "12-month period ending on September 30"

**Problem**: CT uses a fixed annual period (Oct 1 - Sep 30), not calendar year.

**Solution**: Implement fixed-period lookback.

---

### Step 2: Add Connecticut Lookback Function (1 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: Add after quarterly lookback function

```python
def _calculate_connecticut_september_lookback(
    self,
    state_transactions: list,
    threshold_config: dict,
    analysis_year: int
) -> list:
    """
    Calculate nexus for Connecticut's special lookback period.

    Connecticut uses: "12-month period ending on September 30"

    This is a FIXED annual period:
    - For analysis in 2024: Oct 1, 2023 through Sep 30, 2024
    - For analysis in 2023: Oct 1, 2022 through Sep 30, 2023

    Not a rolling period - it's the same Oct-Sep window every year.
    """
    from datetime import date

    logger.info(f"[CT SEPTEMBER LOOKBACK] Checking {len(state_transactions)} transactions")

    # Determine years to check
    years = sorted(set(t.transaction_date.year for t in state_transactions))
    results = []

    for year in years:
        # Connecticut's measurement period for this year
        period_start = date(year - 1, 10, 1)  # Oct 1 of prior year
        period_end = date(year, 9, 30)        # Sep 30 of current year

        # Filter transactions in this fixed period
        period_transactions = [
            t for t in state_transactions
            if period_start <= t.transaction_date <= period_end
        ]

        if not period_transactions:
            continue

        # Calculate totals
        total_revenue = sum(t.sales_amount for t in period_transactions)
        transaction_count = len(period_transactions)

        # Check threshold
        if self._check_threshold_met(total_revenue, transaction_count, threshold_config):
            # Find exact crossing date
            nexus_date = self._find_threshold_crossing(
                period_transactions,
                threshold_config
            )

            # Calculate obligation start
            obligation_start = self._calculate_obligation_start_date(nexus_date)

            result = {
                'year': year,
                'nexus_type': 'economic',
                'nexus_date': nexus_date,
                'obligation_start_date': obligation_start,
                'total_sales': total_revenue,
                'transaction_count': transaction_count,
                'lookback_period_used': 'Oct 1 - Sep 30',
                # ... other fields
            }
            results.append(result)

    return results
```

---

### Step 3: Update Routing Logic (0.5 hour)

**File**: `backend/app/services/nexus_calculator_v2.py`

**Location**: `_calculate_state_nexus_multi_year()` method (around line 180)

**BEFORE**:
```python
# Old routing (only 3 types)
if lookback_period == "Previous Calendar Year":
    return self._calculate_calendar_year_lookback(...)
elif lookback_period == "Current or Previous Calendar Year":
    return self._calculate_calendar_year_lookback(...)
elif lookback_period == "Preceding 12 calendar months":
    return self._calculate_rolling_12_month_lookback(...)
else:
    # Fallback to default
    logger.warning(f"Unknown lookback: {lookback_period}, using default")
    return self._calculate_calendar_year_lookback(...)
```

**AFTER**:
```python
# New routing (7 types supported)
if lookback_period == "Previous Calendar Year":
    return self._calculate_calendar_year_lookback(...)

elif lookback_period == "Current or Previous Calendar Year":
    return self._calculate_calendar_year_lookback(...)

elif lookback_period == "Preceding 12 calendar months":
    return self._calculate_rolling_12_month_lookback(...)

elif lookback_period in ["Preceding 4 Sales Tax Quarters", "Preceding 4 calendar Quarters"]:
    # NY, VT use quarterly lookback
    return self._calculate_quarterly_lookback(...)

elif lookback_period == "12-month period ending on September 30":
    # CT uses fixed Oct-Sep period
    return self._calculate_connecticut_september_lookback(...)

elif lookback_period == "Seller's accounting year":
    # Use analysis period dates as fiscal year proxy
    logger.info("Using seller's accounting year (analysis period as proxy)")
    return self._calculate_calendar_year_lookback(...)  # Fallback to calendar

else:
    # Should never reach here now
    logger.warning(f"Unhandled lookback: {lookback_period}, using calendar year default")
    return self._calculate_calendar_year_lookback(...)
```

---

### Testing NY + CT Lookback

**Test Case: New York Q4 2024**
```python
# Analysis date: Q4 2024 (Oct-Dec)
# Preceding 4 quarters: Q4 2023, Q1 2024, Q2 2024, Q3 2024
# Transactions: $30k per quarter = $120k total
# Threshold: $100k OR 200 txn
# Expected: HAS NEXUS (revenue met)

transactions = [
    # Q4 2023: $30k
    Transaction(date='2023-10-15', amount=30000),
    # Q1 2024: $30k
    Transaction(date='2024-01-15', amount=30000),
    # Q2 2024: $30k
    Transaction(date='2024-04-15', amount=30000),
    # Q3 2024: $30k
    Transaction(date='2024-07-15', amount=30000),
]

assert total_in_4_quarters == 120000
assert has_nexus == True
```

**Test Case: Connecticut 2024**
```python
# Analysis year: 2024
# Measurement period: Oct 1, 2023 - Sep 30, 2024
# Transactions: $110k in that period
# Expected: HAS NEXUS

transactions = [
    Transaction(date='2023-10-15', amount=50000),  # Counts (after Oct 1)
    Transaction(date='2024-05-15', amount=60000),  # Counts (before Sep 30)
    Transaction(date='2024-10-15', amount=30000),  # Does NOT count (after Sep 30)
]

assert total_in_period == 110000
assert has_nexus == True
```

---

## Part 3: Marketplace Facilitator Fix

### ✅ COMPLETE!

Migration file created: `020_fix_marketplace_facilitator_threshold_rules.sql`

**What it does**:
1. Sets all 51 states to `count_toward_threshold: TRUE` (default)
2. Flips 15 exception states to `FALSE`:
   - AL, AR, AZ, CO, FL, GA, LA, MA, ME, MI, NM, TN, UT, VA, WY

**Run it**:
```bash
psql -h [your-supabase-url] -U postgres -d postgres -f backend/migrations/020_fix_marketplace_facilitator_threshold_rules.sql
```

**Verify**:
```sql
SELECT count_toward_threshold, COUNT(*) as state_count
FROM marketplace_facilitator_rules
WHERE effective_to IS NULL
GROUP BY count_toward_threshold;

-- Expected:
-- FALSE: 15 states
-- TRUE: 36 states (or however many you have)
```

---

## Summary Checklist

### Transaction Thresholds
- [ ] Add `_check_threshold_met()` function
- [ ] Update calendar year lookback (both revenue + txn count)
- [ ] Update rolling 12 month lookback (both revenue + txn count)
- [ ] Update threshold crossing detection (both metrics)
- [ ] Test with high-txn, low-revenue scenario
- [ ] Test with AND vs OR operators

### NY + CT Lookback
- [ ] Add `_calculate_quarterly_lookback()` function
- [ ] Add `_calculate_connecticut_september_lookback()` function
- [ ] Add quarter date helper functions
- [ ] Update routing logic in `_calculate_state_nexus_multi_year()`
- [ ] Test NY with quarterly data
- [ ] Test CT with Oct-Sep period

### MF Rules
- [x] Run migration 020
- [ ] Verify counts (15 FALSE, 36 TRUE)
- [ ] Test that excluded states don't count MF sales toward threshold

---

## Estimated Timeline

**Day 1**: Transaction Thresholds
- Morning: Add `_check_threshold_met()` function + update calendar year (4 hours)
- Afternoon: Update rolling 12 month + threshold crossing (4 hours)

**Day 2**: NY + CT Lookback + Testing
- Morning: Implement quarterly and CT lookback functions (3 hours)
- Afternoon: Update routing, test all scenarios (5 hours)

**Day 3**: Integration + Polish
- Morning: Run MF migration, integration testing (4 hours)
- Afternoon: Fix any bugs, add logging, update documentation (4 hours)

---

## Success Criteria

After implementation:

✅ **Transaction thresholds work**: 250 transactions at $200 each triggers nexus in states with 200 txn threshold

✅ **NY quarterly works**: Sales in Q1-Q4 2023 correctly establish nexus in 2024

✅ **CT fixed period works**: Sales from Oct 2023 - Sep 2024 correctly establish 2024 nexus

✅ **MF rules correct**: 15 states exclude MF sales from threshold, 36 include them

✅ **No regressions**: All existing tests still pass

---

*Ready to implement? Start with Part 1 (Transaction Thresholds) as it has the highest impact!*
