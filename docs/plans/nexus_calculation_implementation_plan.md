# Nexus Calculation & Liability Estimation - Complete Implementation Plan

**Document Version:** 1.0
**Created:** 2025-11-05
**Project:** Nexus Check - Professional Nexus Analysis
**Status:** Planning & Phased Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Background & Context](#background--context)
3. [Current State Analysis](#current-state-analysis)
4. [Professional Requirements](#professional-requirements)
5. [Implementation Phases](#implementation-phases)
6. [Database Schema Changes](#database-schema-changes)
7. [Algorithm Specifications](#algorithm-specifications)
8. [Test Cases](#test-cases)
9. [Data References](#data-references)

---

## Executive Summary

This plan outlines the transformation of the Nexus Check's nexus calculation from a simple aggregation-based approach to a professional, chronologically-accurate, multi-scenario analysis system suitable for tax professional use.

### Key Changes:
- **Chronological Processing**: Process transactions in date order to find exact threshold crossing dates
- **Multi-Year Tracking**: Track nexus establishment across multiple years with sticky nexus logic
- **State-Specific Lookback Periods**: Support 7 different lookback period types used by states
- **Multi-Scenario Analysis**: Base, Conservative, and VDA-adjusted scenarios
- **Professional Documentation**: Assumptions, notes, and review flags for defensibility

### Implementation Approach:
**Phased rollout** starting with simplest, most common cases (80% of states) and progressively adding complexity.

---

## Background & Context

### The Problem

The current implementation has critical flaws:
1. **Wrong Nexus Dates**: Sets `nexus_date = datetime.utcnow()` instead of actual threshold crossing date
2. **No Temporal Logic**: Aggregates first, loses chronological ordering
3. **No Obligation Start Date**: Doesn't calculate when collection obligation begins
4. **Single Scenario**: No base vs conservative vs VDA analysis
5. **No Documentation**: Missing assumptions and professional notes

### Tax Professional Requirements

From professional tax practice, liability estimates must:
- Be **defensible** in audit or VDA negotiations
- Show **clear assumptions** (rates used, lookback periods, marketplace treatment)
- Provide **scenario analysis** (base case, conservative case, VDA-adjusted)
- Flag **edge cases** for manual review (borderline nexus, large scenario differences)
- Separate components (base tax, interest, penalties) for clarity

### Data Source

Complete state-by-state nexus rules available in:
```
D:\01 - Projects\SALT-Tax-Tool-Clean\state_sales_tax_nexus.json
```

This includes:
- Economic nexus thresholds
- Lookback period types (7 different types across states)
- Marketplace exclusion rules
- Transaction exclusion rules

---

## Current State Analysis

### Current Implementation Location
```
D:\01 - Projects\SALT-Tax-Tool-Clean\backend\app\services\nexus_calculator.py
```

### Current Algorithm Flow
```python
1. Aggregate transactions by state (total sales, counts)
2. Check if total >= threshold
3. If yes, calculate: total_sales * tax_rate
4. Set nexus_date = today (WRONG!)
5. Return single estimated_liability number
```

### What Works
- ✅ Database structure supports what we need
- ✅ Tax rates stored correctly (as decimals, not percentages)
- ✅ Marketplace facilitator rules table exists
- ✅ Transaction data includes dates and channels

### What Needs Fixing
- ❌ No chronological processing
- ❌ Wrong nexus dates
- ❌ No obligation start date calculation
- ❌ Doesn't respect state-specific lookback periods
- ❌ No multi-year tracking
- ❌ No sticky nexus logic
- ❌ No scenario analysis
- ❌ No interest calculation
- ❌ No VDA adjustment
- ❌ No professional documentation

---

## Professional Requirements

### Core Business Rules

#### Rule 1: Nexus Establishment
**Purpose:** Determine when a seller must register for sales tax in a state

**Logic:**
- Include ALL transaction amounts (Direct + Marketplace channels)
- Calculate running total using state-specific lookback period
- Nexus is established when: running_total >= state_threshold
- Record the exact DATE when threshold is crossed

**Important:** Marketplace sales COUNT toward nexus threshold even though seller doesn't collect tax on them.

#### Rule 2: Collection Obligation Start Date
**Purpose:** Determine when seller must START collecting tax

**Default Rule (Most States):**
```
obligation_start_date = first_day_of_month_following(nexus_establishment_date)
```

**Example:**
- Nexus established: June 10, 2024
- Obligation starts: July 1, 2024

**Professional Note:** This is technically correct. The transaction that establishes nexus occurs BEFORE the obligation begins.

#### Rule 3: Tax Liability Calculation
**Purpose:** Calculate actual tax owed with multiple scenarios

**Base Calculation:**
```python
liability = 0

for each transaction in chronological order:
    if transaction.date >= obligation_start_date:
        if transaction.channel == "Direct":
            liability += transaction.amount * state_tax_rate
```

**Exclusions (DO NOT include in base liability):**
- ❌ Any transaction before obligation_start_date
- ❌ The specific transaction that crossed the threshold
- ❌ All Marketplace channel transactions AFTER marketplace facilitator law effective date

#### Rule 4: Sticky Nexus
**Purpose:** Once nexus is established, it continues in subsequent years

**Logic:**
```python
if nexus_established_year <= current_year:
    obligation_start_date_this_year = January 1
else:
    obligation_start_date_this_year = calculate_from_threshold_crossing()
```

### Output Requirements

#### Three Scenarios Required:

1. **Base Scenario (Recommended)**
   - Exclude marketplace sales in pre-facilitator period
   - Most practical, assumes marketplaces handled collection
   - Use for standard analysis

2. **Conservative Scenario**
   - Include marketplace sales in pre-facilitator period
   - Statutory obligation existed regardless of practical reality
   - Use when client wants worst-case (M&A, pre-audit)

3. **VDA-Adjusted Scenario**
   - Apply typical VDA lookback period (3-4 years)
   - Show potential savings from voluntary disclosure
   - Critical for decision-making

#### Separated Components:
- Base Tax (principal amount owed)
- Interest (calculated separately, shown separately)
- Penalties (calculate but show separately - usually waived in VDA)

#### Documentation Required:
- **Assumptions Array**: Document all calculation choices
  - Tax rate used and why
  - Marketplace treatment
  - Lookback period applied
  - Interest calculation method

- **Notes Array**: Contextual guidance
  - "Recent nexus establishment (June 2024)"
  - "⚠️ Borderline nexus - within 10% of threshold"
  - "VDA could reduce liability by $XX,XXX"

- **Review Flags**: Boolean flags for manual review
  - `is_borderline_nexus`: Within 10% of threshold
  - `requires_review`: Large scenario differences or other concerns

---

## Implementation Phases

### Phase 1A: Foundation + Simple Lookback Types ✅ **START HERE - V1 PILOT**

**Goal:** Implement chronological processing, multi-year tracking, and calendar year lookback (covers 80% of states)

**Scope:**
- Chronological transaction processing
- Exact nexus date determination
- Obligation start date calculation
- Multi-year tracking with sticky nexus
- Support for "Previous Calendar Year" lookback
- Support for "Current or Previous Calendar Year" lookback
- Database migration for multi-year structure
- Import state nexus rules from JSON

**States Covered:** 36 out of 45 states (80%)

**Database Changes:**
```sql
-- Add lookback period column
ALTER TABLE economic_nexus_thresholds
ADD COLUMN lookback_period VARCHAR(100);

-- Add year and temporal tracking to state_results
ALTER TABLE state_results ADD COLUMN year INTEGER;
ALTER TABLE state_results ADD COLUMN nexus_date DATE;
ALTER TABLE state_results ADD COLUMN obligation_start_date DATE;
ALTER TABLE state_results ADD COLUMN first_nexus_year INTEGER;

-- Add composite unique constraint
ALTER TABLE state_results
ADD CONSTRAINT unique_analysis_state_year
UNIQUE (analysis_id, state, year);

-- Drop old unique constraint if exists
ALTER TABLE state_results
DROP CONSTRAINT IF EXISTS unique_analysis_state;
```

**Algorithm:**
```python
def calculate_nexus_calendar_year(state_code, transactions, threshold_config):
    """
    Calculate nexus for states using calendar year lookback.
    """
    lookback_type = threshold_config['lookback_period']

    # Group transactions by year
    transactions_by_year = group_by_year(transactions)

    # Track when nexus was first established
    first_nexus_year = None
    first_nexus_date = None

    results_by_year = []

    for year in sorted(transactions_by_year.keys()):
        year_transactions = transactions_by_year[year]
        prior_year_transactions = transactions_by_year.get(year - 1, [])

        # Determine which period to check based on lookback type
        if lookback_type == 'Previous Calendar Year':
            check_transactions = prior_year_transactions
        elif lookback_type == 'Current or Previous Calendar Year':
            current_total = sum(t.amount for t in year_transactions)
            prior_total = sum(t.amount for t in prior_year_transactions)

            # Check current year first, then prior year
            if current_total >= threshold_config['revenue_threshold']:
                check_transactions = year_transactions
            elif prior_total >= threshold_config['revenue_threshold']:
                check_transactions = prior_year_transactions
            else:
                check_transactions = []

        # Process chronologically to find exact threshold crossing
        if check_transactions:
            nexus_info = find_threshold_crossing(
                check_transactions,
                threshold_config
            )

            if nexus_info['has_nexus']:
                if first_nexus_year is None:
                    first_nexus_year = year
                    first_nexus_date = nexus_info['nexus_date']

                # Calculate obligation start date
                if first_nexus_year < year:
                    # Sticky nexus - obligation started in prior year
                    obligation_start_date = f"{year}-01-01"
                else:
                    # New nexus this year
                    obligation_start_date = first_day_of_following_month(
                        nexus_info['nexus_date']
                    )

                # Calculate liability for this year
                liability = calculate_liability_for_year(
                    year_transactions,
                    obligation_start_date,
                    threshold_config,
                    mf_rules
                )

                results_by_year.append({
                    'year': year,
                    'nexus_date': nexus_info['nexus_date'],
                    'obligation_start_date': obligation_start_date,
                    'first_nexus_year': first_nexus_year,
                    **liability
                })

    return results_by_year
```

**Deliverables:**
- ✅ Database migration script
- ✅ Updated nexus_calculator.py with chronological logic
- ✅ Multi-year results structure
- ✅ Tests for calendar year lookback
- ✅ Import script for state_sales_tax_nexus.json
- ✅ API updates to return year_data array
- ✅ Frontend already supports year selector

**Estimated Effort:** 1-2 days

---

### Phase 1B: Rolling 12-Month Lookback 🔄 **NEXT PRIORITY**

**Goal:** Support "Preceding 12 calendar months" lookback period

**States Covered:** 5 critical states
- Illinois (large state, $100K threshold)
- Minnesota
- Mississippi
- Tennessee
- Texas (CRITICAL - $500K threshold, major economy)

**Algorithm:**
```python
def calculate_nexus_rolling_12_months(state_code, transactions, threshold_config):
    """
    Calculate nexus for states using rolling 12-month lookback.

    For each transaction date, check if sales in preceding 12 months
    exceed threshold.
    """
    # Sort transactions chronologically
    sorted_txns = sorted(transactions, key=lambda t: t.date)

    nexus_date = None

    for i, txn in enumerate(sorted_txns):
        # Calculate 12-month window ending on this transaction date
        window_start = txn.date - timedelta(days=365)
        window_end = txn.date

        # Sum all sales in this 12-month window
        window_sales = sum(
            t.amount for t in sorted_txns
            if window_start <= t.date <= window_end
        )

        # Check if threshold exceeded
        if window_sales >= threshold_config['revenue_threshold']:
            nexus_date = txn.date
            break

    if nexus_date:
        # Calculate obligation start date
        obligation_start_date = first_day_of_following_month(nexus_date)

        # Calculate liability for each year
        results_by_year = calculate_liability_multi_year(
            transactions,
            obligation_start_date,
            threshold_config
        )

        return results_by_year
    else:
        return []
```

**Performance Optimization:**
For large transaction sets, this can be expensive. Consider:
- Maintain running sum with sliding window
- Only recalculate when significant sales occur
- Cache intermediate results

**Deliverables:**
- ✅ Rolling 12-month algorithm implementation
- ✅ Performance optimization for large datasets
- ✅ Tests for Texas, Illinois examples
- ✅ Update state rules to use rolling lookback

**Estimated Effort:** 1 day

---

### Phase 1C: Quarter-Based Lookback 📊 **LOWER PRIORITY**

**Goal:** Support quarter-based lookback periods

**States Covered:** 2 states (both high thresholds)
- New York: "Preceding 4 Sales Tax Quarters" ($500K AND 100 txns)
- Vermont: "Preceding 4 calendar Quarters"

**Algorithm:**
```python
def calculate_nexus_quarterly(state_code, transactions, threshold_config):
    """
    Calculate nexus for states using quarter-based lookback.
    """
    # Group transactions by quarter
    quarters = defaultdict(list)
    for txn in transactions:
        quarter_key = get_quarter(txn.date)  # e.g., "2024-Q1"
        quarters[quarter_key].append(txn)

    # Sort quarters chronologically
    sorted_quarters = sorted(quarters.keys())

    for i, current_quarter in enumerate(sorted_quarters):
        # Get preceding 4 quarters
        if i < 4:
            continue  # Not enough history yet

        preceding_quarters = sorted_quarters[i-4:i]

        # Sum sales across preceding 4 quarters
        total_sales = sum(
            sum(t.amount for t in quarters[q])
            for q in preceding_quarters
        )

        # Check threshold
        if total_sales >= threshold_config['revenue_threshold']:
            # Nexus established at start of current quarter
            nexus_date = get_quarter_start_date(current_quarter)
            break

    # Calculate liability...
```

**Special Considerations:**
- **New York**: Uses "Sales Tax Quarters" which may differ from calendar quarters
  - Need to research NY sales tax quarter definitions
  - Typically March 1 - May 31, June 1 - Aug 31, etc.

- **Vermont**: Uses standard calendar quarters
  - Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec

**Deliverables:**
- ✅ Quarter-based algorithm
- ✅ NY sales tax quarter logic
- ✅ Tests for NY and Vermont
- ✅ Update state rules

**Estimated Effort:** 0.5 days

---

### Phase 1D: Edge Cases 🔧 **LOWEST PRIORITY**

**Goal:** Support unusual lookback periods

**States Covered:** 2 states
- Connecticut: "12-month period ending on September 30"
- Puerto Rico: "Seller's accounting year"

**Connecticut Algorithm:**
```python
def calculate_nexus_connecticut(transactions, threshold_config):
    """
    Connecticut uses 12-month period ending September 30.
    """
    # For each year, check Oct 1 (prior year) to Sept 30 (current year)
    years = set(t.date.year for t in transactions)

    for year in sorted(years):
        period_start = datetime(year - 1, 10, 1)
        period_end = datetime(year, 9, 30)

        period_sales = sum(
            t.amount for t in transactions
            if period_start <= t.date <= period_end
        )

        if period_sales >= threshold_config['revenue_threshold']:
            # Nexus established
            nexus_date = period_end
            obligation_start_date = datetime(year, 10, 1)
            break
```

**Puerto Rico:**
- Requires client to specify their accounting/fiscal year
- Add field to analysis: `client_fiscal_year_end`
- Use that date for 12-month window

**Deliverables:**
- ✅ Connecticut-specific logic
- ✅ Puerto Rico logic with fiscal year input
- ✅ Tests
- ✅ Update state rules

**Estimated Effort:** 0.5 days

---

### Phase 2: Interest Calculation & VDA Lookback 💰

**Goal:** Add financial accuracy with interest and VDA scenario

**Scope:**
- Calculate simple interest from obligation start date
- Implement VDA lookback periods (typically 3-4 years by state)
- Show base liability vs VDA-adjusted liability
- Add interest as separate line item
- Calculate potential savings from VDA

**Database Changes:**
```sql
-- Add interest and VDA tracking
ALTER TABLE state_results ADD COLUMN base_scenario_tax DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN base_scenario_interest DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN base_scenario_total DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN vda_scenario_tax DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN vda_scenario_interest DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN vda_scenario_total DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN vda_potential_savings DECIMAL(12,2);

-- Add state-specific interest rates (from existing migration 008)
-- Already exists in interest_penalty_rates table
```

**Interest Calculation Algorithm:**
```python
def calculate_interest(taxable_transactions, state_config):
    """
    Calculate simple interest from filing due dates.

    Simplified approach:
    - Assume monthly filing (most common)
    - Due date = last day of month following transaction month
    - Simple interest from due date to present
    """
    total_interest = 0

    for txn in taxable_transactions:
        # Filing due date = last day of following month
        filing_due_date = last_day_of_month(
            txn.date + relativedelta(months=1)
        )

        # Days overdue
        days_overdue = (datetime.now() - filing_due_date).days

        if days_overdue > 0:
            # Simple interest formula
            # Interest = Principal × Rate × Time
            years_overdue = days_overdue / 365.25
            tax_on_this_txn = txn.amount * state_config['tax_rate']

            interest = (
                tax_on_this_txn *
                state_config['annual_interest_rate'] *
                years_overdue
            )

            total_interest += interest

    return round(total_interest, 2)
```

**VDA Lookback Algorithm:**
```python
def calculate_vda_scenario(transactions, nexus_date, state_config):
    """
    Calculate liability with VDA lookback period applied.
    """
    vda_lookback_years = state_config.get('vda_lookback_years', 4)

    # VDA cutoff date
    vda_cutoff = datetime.now() - relativedelta(years=vda_lookback_years)

    # Only include transactions after VDA cutoff
    vda_transactions = [
        t for t in transactions
        if t.date >= vda_cutoff
    ]

    # Recalculate obligation start (may be later due to lookback limit)
    vda_obligation_start = max(nexus_date, vda_cutoff)

    # Calculate liability
    vda_liability = calculate_liability(
        vda_transactions,
        vda_obligation_start,
        state_config
    )

    return vda_liability
```

**Deliverables:**
- ✅ Interest calculation logic
- ✅ VDA scenario calculation
- ✅ Savings calculation (base - VDA)
- ✅ Update API to return both scenarios
- ✅ Frontend display of scenarios side-by-side
- ✅ Tests for interest and VDA logic

**Estimated Effort:** 1 day

---

### Phase 3: Pre-Law Marketplace Scenarios 🏪 **REQUIRES RESEARCH**

**Goal:** Handle pre-facilitator-law marketplace sales with scenario analysis

**Research Required:**
- Marketplace facilitator effective dates for each state
- When did Amazon/eBay/Etsy start collecting in each state?

**Database Changes:**
```sql
-- Add marketplace facilitator effective dates
ALTER TABLE marketplace_facilitator_rules
ADD COLUMN effective_from DATE;

-- Update existing rows with researched dates
UPDATE marketplace_facilitator_rules
SET effective_from = '2019-10-01'  -- Example: Texas
WHERE state = 'TX';
```

**Algorithm:**
```python
def calculate_scenarios_with_marketplace(transactions, state_config, mf_rules):
    """
    Generate base vs conservative scenarios for marketplace treatment.
    """
    mf_effective_date = mf_rules.get('effective_from')

    # Base Scenario: Exclude pre-law marketplace sales
    base_liability = 0
    for txn in transactions:
        if txn.channel == 'direct':
            base_liability += txn.amount * state_config['tax_rate']
        elif txn.channel == 'marketplace':
            # Only include if BEFORE facilitator law
            if txn.date < mf_effective_date:
                # Base case: DON'T include (marketplace handled it)
                pass

    # Conservative Scenario: Include pre-law marketplace sales
    conservative_liability = 0
    for txn in transactions:
        if txn.channel == 'direct':
            conservative_liability += txn.amount * state_config['tax_rate']
        elif txn.channel == 'marketplace':
            if txn.date < mf_effective_date:
                # Conservative: INCLUDE (statutory obligation existed)
                conservative_liability += txn.amount * state_config['tax_rate']

    return {
        'base_scenario': base_liability,
        'conservative_scenario': conservative_liability,
        'scenario_difference': conservative_liability - base_liability
    }
```

**Flag for Review:**
```python
# Flag if difference is material
requires_review = (
    (conservative - base) > 5000 or
    (conservative - base) / base > 0.25  # 25% difference
)
```

**Deliverables:**
- ✅ Research marketplace facilitator effective dates
- ✅ Update database with dates
- ✅ Implement scenario generation
- ✅ Add scenario difference to results
- ✅ Flag material differences
- ✅ Frontend display of both scenarios
- ✅ Tests with pre-law marketplace data

**Estimated Effort:** 2 days (1 day research, 1 day implementation)

---

### Phase 4: Professional Documentation & Review Flags 📋

**Goal:** Add defensibility and professional polish

**Scope:**
- Assumptions array (document all choices)
- Notes array (contextual guidance)
- Review flags (borderline nexus, large differences)
- Potential penalties (shown separately)

**Database Changes:**
```sql
ALTER TABLE state_results ADD COLUMN is_borderline_nexus BOOLEAN DEFAULT FALSE;
ALTER TABLE state_results ADD COLUMN requires_review BOOLEAN DEFAULT FALSE;
ALTER TABLE state_results ADD COLUMN assumptions JSONB;
ALTER TABLE state_results ADD COLUMN notes JSONB;
ALTER TABLE state_results ADD COLUMN potential_penalties DECIMAL(12,2);
```

**Assumptions Generation:**
```python
def build_assumptions_list(state_config, calculation_params):
    """
    Document all key assumptions for defensibility.
    """
    assumptions = []

    assumptions.append(
        f"Lookback period: {state_config['lookback_period']}"
    )

    assumptions.append(
        f"Obligation begins first day of month following nexus"
    )

    assumptions.append(
        f"Tax rate: {state_config['combined_rate'] * 100:.2f}% "
        f"(state + average local)"
    )

    if calculation_params['has_marketplace_sales']:
        assumptions.append(
            f"Marketplace sales excluded (facilitator law in effect)"
        )

    assumptions.append(
        f"Interest: {state_config['interest_rate'] * 100:.0f}% annual, "
        f"simple interest from filing due dates"
    )

    assumptions.append(
        "Penalties excluded (typical VDA outcome)"
    )

    return assumptions
```

**Notes Generation:**
```python
def build_notes_list(nexus_date, liability_results):
    """
    Generate contextual notes for professional review.
    """
    notes = []

    # Age of nexus
    years_since = (datetime.now() - nexus_date).days / 365
    if years_since > 4:
        notes.append(
            f"Old nexus ({nexus_date.year}) - significant VDA benefits"
        )
    elif years_since < 1:
        notes.append(
            f"Recent nexus ({nexus_date.strftime('%B %Y')})"
        )

    # Borderline nexus
    if liability_results['is_borderline']:
        notes.append(
            "⚠️ Borderline nexus - within 10% of threshold"
        )

    # No liability despite nexus
    if liability_results['base_tax'] == 0:
        notes.append("Nexus established but no current liability")
        notes.append("Registration required despite zero liability")

    # Scenario differences
    if liability_results.get('scenario_difference', 0) > 5000:
        notes.append(
            "⚠️ REQUIRES REVIEW: Large scenario difference"
        )
        notes.append(
            "Pre-law marketplace sales significantly impact liability"
        )

    # VDA savings
    if liability_results.get('vda_savings', 0) > 10000:
        notes.append(
            f"VDA could reduce liability by "
            f"${liability_results['vda_savings']:,.0f}"
        )

    return notes
```

**Review Flags:**
```python
def determine_review_flags(state_result):
    """
    Set flags requiring manual professional review.
    """
    requires_review = False
    is_borderline = False

    # Borderline nexus (within 10% of threshold)
    if state_result['total_sales'] < (state_result['threshold'] * 1.10):
        is_borderline = True
        requires_review = True

    # Large scenario differences
    scenario_diff = (
        state_result.get('conservative_tax', 0) -
        state_result.get('base_tax', 0)
    )
    if scenario_diff > 5000:
        requires_review = True

    # Significant VDA savings
    if state_result.get('vda_savings', 0) > 10000:
        requires_review = True

    # Old nexus dates (>4 years)
    if state_result.get('nexus_date'):
        years_ago = (
            datetime.now() - state_result['nexus_date']
        ).days / 365
        if years_ago > 4:
            requires_review = True

    return {
        'is_borderline_nexus': is_borderline,
        'requires_review': requires_review
    }
```

**Deliverables:**
- ✅ Assumptions generation logic
- ✅ Notes generation logic
- ✅ Review flag logic
- ✅ Penalty calculation (shown separately)
- ✅ API returns full documentation
- ✅ Frontend displays assumptions/notes clearly
- ✅ Tests for documentation logic

**Estimated Effort:** 0.5 days

---

## Database Schema Changes

### Complete Migration Script (All Phases)

```sql
-- ============================================================================
-- NEXUS CALCULATION ENHANCEMENT - COMPLETE SCHEMA CHANGES
-- ============================================================================
-- Created: 2025-11-05
-- Purpose: Support chronological processing, multi-year tracking, scenarios
-- ============================================================================

-- PHASE 1A: Multi-year tracking and lookback periods
-- ============================================================================

-- Add lookback period to economic_nexus_thresholds
ALTER TABLE economic_nexus_thresholds
ADD COLUMN IF NOT EXISTS lookback_period VARCHAR(100);

COMMENT ON COLUMN economic_nexus_thresholds.lookback_period IS
'How the state measures the threshold period (e.g., "Current or Previous Calendar Year", "Preceding 12 calendar months")';

-- Add marketplace facilitator effective dates (for Phase 3)
ALTER TABLE marketplace_facilitator_rules
ADD COLUMN IF NOT EXISTS effective_from DATE;

COMMENT ON COLUMN marketplace_facilitator_rules.effective_from IS
'Date when marketplace facilitator law became effective in this state';

-- Modify state_results for multi-year tracking
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS nexus_date DATE;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS obligation_start_date DATE;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS first_nexus_year INTEGER;

-- Drop old unique constraint, add new one
ALTER TABLE state_results
DROP CONSTRAINT IF EXISTS unique_analysis_state;

ALTER TABLE state_results
ADD CONSTRAINT unique_analysis_state_year
UNIQUE (analysis_id, state, year);

COMMENT ON COLUMN state_results.year IS
'Calendar year for this result (allows multi-year tracking)';

COMMENT ON COLUMN state_results.nexus_date IS
'Exact date when economic nexus threshold was crossed';

COMMENT ON COLUMN state_results.obligation_start_date IS
'Date when collection obligation begins (typically first of following month)';

COMMENT ON COLUMN state_results.first_nexus_year IS
'Year when nexus was first established (for sticky nexus logic)';


-- PHASE 2: Interest and VDA scenarios
-- ============================================================================

-- Add scenario columns
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS base_scenario_tax DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS base_scenario_interest DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS base_scenario_total DECIMAL(12,2);

ALTER TABLE state_results ADD COLUMN IF NOT EXISTS vda_scenario_tax DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS vda_scenario_interest DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS vda_scenario_total DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS vda_potential_savings DECIMAL(12,2);

COMMENT ON COLUMN state_results.base_scenario_tax IS
'Base tax liability (no interest or penalties)';

COMMENT ON COLUMN state_results.base_scenario_interest IS
'Estimated interest on base tax';

COMMENT ON COLUMN state_results.vda_scenario_tax IS
'Tax liability with VDA lookback applied (typically 3-4 years)';

COMMENT ON COLUMN state_results.vda_potential_savings IS
'Savings from VDA vs full statutory period (base - VDA)';


-- PHASE 3: Marketplace scenarios
-- ============================================================================

ALTER TABLE state_results ADD COLUMN IF NOT EXISTS conservative_scenario_tax DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS conservative_scenario_interest DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS conservative_scenario_total DECIMAL(12,2);
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS scenario_difference DECIMAL(12,2);

COMMENT ON COLUMN state_results.conservative_scenario_tax IS
'Conservative scenario including pre-facilitator-law marketplace sales';

COMMENT ON COLUMN state_results.scenario_difference IS
'Difference between conservative and base scenarios';


-- PHASE 4: Professional documentation
-- ============================================================================

ALTER TABLE state_results ADD COLUMN IF NOT EXISTS is_borderline_nexus BOOLEAN DEFAULT FALSE;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT FALSE;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS assumptions JSONB;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS notes JSONB;
ALTER TABLE state_results ADD COLUMN IF NOT EXISTS potential_penalties DECIMAL(12,2);

COMMENT ON COLUMN state_results.is_borderline_nexus IS
'True if sales within 10% of threshold (requires manual review)';

COMMENT ON COLUMN state_results.requires_review IS
'True if any condition requires professional review (borderline, large differences, etc.)';

COMMENT ON COLUMN state_results.assumptions IS
'JSON array of assumption strings documenting calculation choices';

COMMENT ON COLUMN state_results.notes IS
'JSON array of note strings providing contextual guidance';

COMMENT ON COLUMN state_results.potential_penalties IS
'Potential penalties if not VDA (shown separately, not in base)';

-- Create index for efficient multi-year queries
CREATE INDEX IF NOT EXISTS idx_state_results_analysis_year
ON state_results(analysis_id, year);

CREATE INDEX IF NOT EXISTS idx_state_results_nexus_date
ON state_results(nexus_date) WHERE nexus_date IS NOT NULL;
```

---

## Algorithm Specifications

### Helper Functions

```python
def first_day_of_following_month(date):
    """
    Get first day of month following given date.

    Example: June 10 → July 1
    """
    if date.month == 12:
        return datetime(date.year + 1, 1, 1)
    else:
        return datetime(date.year, date.month + 1, 1)


def find_threshold_crossing(transactions, threshold_config):
    """
    Find exact transaction that crossed the threshold.

    Returns:
        - has_nexus: bool
        - nexus_date: date when crossed
        - threshold_transaction_id: ID of transaction that crossed
    """
    sorted_txns = sorted(transactions, key=lambda t: t.date)

    running_total = 0
    running_count = 0

    for txn in sorted_txns:
        running_total += txn.amount
        running_count += 1

        # Check revenue threshold
        revenue_met = False
        if threshold_config.get('revenue_threshold'):
            revenue_met = running_total >= threshold_config['revenue_threshold']

        # Check transaction threshold
        transaction_met = False
        if threshold_config.get('transaction_threshold'):
            transaction_met = running_count >= threshold_config['transaction_threshold']

        # Apply operator
        operator = threshold_config.get('threshold_operator', 'or')
        if operator == 'or':
            threshold_met = revenue_met or transaction_met
        else:  # 'and'
            threshold_met = revenue_met and transaction_met

        if threshold_met:
            return {
                'has_nexus': True,
                'nexus_date': txn.date,
                'threshold_transaction_id': txn.transaction_id,
                'running_total': running_total,
                'running_count': running_count
            }

    return {'has_nexus': False}


def calculate_liability_for_year(
    transactions,
    obligation_start_date,
    tax_rate,
    mf_rules
):
    """
    Calculate tax liability for transactions in a specific year.
    """
    taxable_sales = 0
    taxable_transactions = []

    for txn in transactions:
        # Skip if before obligation date
        if txn.date < obligation_start_date:
            continue

        # Determine if taxable
        is_taxable = False

        if txn.channel == 'direct':
            is_taxable = True
        elif txn.channel == 'marketplace':
            # Check if marketplace facilitator law applies
            if mf_rules and mf_rules.get('exclude_from_liability'):
                # After facilitator law, marketplace collects
                is_taxable = False
            else:
                # No facilitator law, seller is responsible
                is_taxable = True

        if is_taxable:
            taxable_sales += txn.amount
            taxable_transactions.append(txn)

    base_tax = taxable_sales * tax_rate

    return {
        'taxable_sales': taxable_sales,
        'base_tax': round(base_tax, 2),
        'taxable_transactions': taxable_transactions
    }
```

---

## Test Cases

### Test Case 1: Illinois - Nexus Without Liability

**Purpose:** Verify correct handling when nexus is established but no liability exists

**Input:**
```python
transactions = [
    {'date': '2024-01-28', 'id': 'TX088', 'amount': 38000, 'channel': 'direct', 'state': 'IL'},
    {'date': '2024-04-12', 'id': 'TX089', 'amount': 42500, 'channel': 'marketplace', 'state': 'IL'},
    {'date': '2024-07-03', 'id': 'TX010', 'amount': 35700, 'channel': 'direct', 'state': 'IL'},
    {'date': '2024-10-15', 'id': 'TX011', 'amount': 35000, 'channel': 'marketplace', 'state': 'IL'}
]

state_config = {
    'state_code': 'IL',
    'threshold': 100000,
    'lookback_period': 'Preceding 12 calendar months',
    'tax_rate': 0.0892,
    'has_mf_law': True
}
```

**Expected Output:**
```python
{
    'nexus_established': True,
    'nexus_date': '2024-07-03',  # When running total hit $116,200
    'obligation_start_date': '2024-08-01',
    'year': 2024,
    'base_scenario': {
        'base_tax': 0,  # No direct sales after Aug 1
        'interest': 0,
        'total': 0,
        'taxable_sales': 0
    },
    'notes': [
        'Nexus established but no current liability',
        'Registration required despite zero liability',
        'Only marketplace sales occurred after obligation date'
    ]
}
```

### Test Case 2: Florida - Has Liability

**Purpose:** Verify correct liability calculation with obligation start date

**Input:**
```python
transactions = [
    {'date': '2024-01-15', 'id': 'TX001', 'amount': 45000, 'channel': 'direct', 'state': 'FL'},
    {'date': '2024-03-22', 'id': 'TX002', 'amount': 38500, 'channel': 'marketplace', 'state': 'FL'},
    {'date': '2024-06-10', 'id': 'TX003', 'amount': 42000, 'channel': 'direct', 'state': 'FL'},
    {'date': '2024-09-05', 'id': 'TX004', 'amount': 27000, 'channel': 'direct', 'state': 'FL'}
]

state_config = {
    'state_code': 'FL',
    'threshold': 100000,
    'lookback_period': 'Previous Calendar Year',
    'tax_rate': 0.0702,
    'interest_rate': 0.12,
    'has_mf_law': True
}
```

**Expected Output:**
```python
{
    'nexus_established': True,
    'nexus_date': '2024-06-10',  # Third transaction crossed $100K
    'obligation_start_date': '2024-07-01',
    'year': 2024,
    'base_scenario': {
        'base_tax': 1895.40,  # $27,000 × 7.02%
        'interest': 113.72,   # ~3 months at 12% annual
        'total': 2009.12,
        'taxable_sales': 27000
    },
    'vda_scenario': {
        'base_tax': 1895.40,  # All within 4 years
        'interest': 113.72,
        'total': 2009.12,
        'savings': 0
    },
    'notes': [
        'Recent nexus establishment (June 2024)',
        'Low exposure - good candidate for VDA'
    ]
}
```

### Test Case 3: Multi-Year with Sticky Nexus

**Purpose:** Verify sticky nexus logic across multiple years

**Input:**
```python
transactions = [
    # 2022 - Establish nexus
    {'date': '2022-06-15', 'id': 'TX001', 'amount': 110000, 'channel': 'direct', 'state': 'CA'},
    {'date': '2022-08-20', 'id': 'TX002', 'amount': 50000, 'channel': 'direct', 'state': 'CA'},

    # 2023 - Nexus continues (sticky)
    {'date': '2023-02-10', 'id': 'TX003', 'amount': 75000, 'channel': 'direct', 'state': 'CA'},
    {'date': '2023-11-05', 'id': 'TX004', 'amount': 80000, 'channel': 'direct', 'state': 'CA'},

    # 2024 - Nexus continues
    {'date': '2024-03-15', 'id': 'TX005', 'amount': 90000, 'channel': 'direct', 'state': 'CA'}
]

state_config = {
    'state_code': 'CA',
    'threshold': 500000,
    'lookback_period': 'Current or Previous Calendar Year',
    'tax_rate': 0.0825
}
```

**Expected Output:**
```python
{
    'first_nexus_year': 2022,
    'years': [
        {
            'year': 2022,
            'nexus_date': '2022-06-15',
            'obligation_start_date': '2022-07-01',
            'base_tax': 4125.00,  # $50K × 8.25% (only Aug transaction)
        },
        {
            'year': 2023,
            'nexus_date': '2022-06-15',  # Original nexus date
            'obligation_start_date': '2023-01-01',  # Sticky - full year
            'base_tax': 12787.50,  # ($75K + $80K) × 8.25%
        },
        {
            'year': 2024,
            'nexus_date': '2022-06-15',
            'obligation_start_date': '2024-01-01',  # Sticky - full year
            'base_tax': 7425.00,  # $90K × 8.25%
        }
    ]
}
```

---

## Data References

### Primary Data Source
```
D:\01 - Projects\SALT-Tax-Tool-Clean\state_sales_tax_nexus.json
```

**Structure:**
```json
{
  "states": [
    {
      "state": "StateName",
      "economic_nexus_threshold": "$100,000 OR 200 transactions",
      "lookback_period": "Current or Previous Calendar Year",
      "marketplace_transactions_excluded": true,
      "non_taxable_transactions_excluded": false,
      "resale_transactions_excluded": true
    }
  ]
}
```

### Lookback Period Distribution

| Lookback Period | Count | Percentage |
|----------------|-------|------------|
| Current or Previous Calendar Year | ~30 | 67% |
| Previous Calendar Year | 6 | 13% |
| Preceding 12 calendar months | 5 | 11% |
| Preceding 4 Sales Tax Quarters | 1 | 2% |
| Preceding 4 calendar Quarters | 1 | 2% |
| 12-month period ending Sept 30 | 1 | 2% |
| Seller's accounting year | 1 | 2% |

### Critical States by Threshold

**High Thresholds ($500K):**
- California
- New York ($500K AND 100 txns)
- Texas

**Standard Thresholds ($100K):**
- Most other states

**High Threshold ($250K):**
- Alabama
- Mississippi

---

## Implementation Checklist

### Phase 1A (V1 Pilot) - ✅ START HERE

- [ ] Database Migration
  - [ ] Add `lookback_period` column
  - [ ] Add `year`, `nexus_date`, `obligation_start_date` columns
  - [ ] Update unique constraints
  - [ ] Create indexes

- [ ] Import State Data
  - [ ] Parse state_sales_tax_nexus.json
  - [ ] Map to database schema
  - [ ] Import into economic_nexus_thresholds

- [ ] Core Algorithm
  - [ ] Implement chronological transaction processing
  - [ ] Implement `find_threshold_crossing()`
  - [ ] Implement `first_day_of_following_month()`
  - [ ] Implement calendar year lookback logic
  - [ ] Implement sticky nexus logic
  - [ ] Implement multi-year result structure

- [ ] Testing
  - [ ] Test: Illinois example (nexus, no liability)
  - [ ] Test: Florida example (nexus with liability)
  - [ ] Test: Multi-year sticky nexus
  - [ ] Test: Previous Calendar Year lookback
  - [ ] Test: Current or Previous Calendar Year lookback

- [ ] API Updates
  - [ ] Update response schema for year_data array
  - [ ] Update endpoint to return multi-year results
  - [ ] Test API responses

- [ ] Documentation
  - [ ] Update API documentation
  - [ ] Add comments to new code
  - [ ] Document assumptions in code

### Phase 1B - 🔄 NEXT

- [ ] Implement rolling 12-month algorithm
- [ ] Performance optimization
- [ ] Tests for Texas, Illinois
- [ ] Update state configurations

### Phase 1C - 📊 LATER

- [ ] Quarter-based algorithm
- [ ] NY sales tax quarter logic
- [ ] Tests for NY, Vermont

### Phase 1D - 🔧 LOWEST PRIORITY

- [ ] Connecticut fixed-date logic
- [ ] Puerto Rico fiscal year logic
- [ ] Tests

### Phase 2 - 💰

- [ ] Interest calculation
- [ ] VDA scenario logic
- [ ] Savings calculation
- [ ] API updates
- [ ] Frontend updates

### Phase 3 - 🏪 REQUIRES RESEARCH

- [ ] Research marketplace facilitator dates
- [ ] Update database
- [ ] Implement scenario generation
- [ ] Tests

### Phase 4 - 📋

- [ ] Assumptions generation
- [ ] Notes generation
- [ ] Review flags
- [ ] Penalty calculation
- [ ] Tests

---

## Success Criteria

### Phase 1A Success Metrics:
- ✅ Nexus dates are actual threshold crossing dates (not "today")
- ✅ Obligation start dates calculated correctly
- ✅ Multi-year results work correctly
- ✅ Sticky nexus applies in subsequent years
- ✅ 36 states (calendar year lookback) work correctly
- ✅ Tests pass for all Phase 1A scenarios
- ✅ API returns year_data array
- ✅ Frontend displays multi-year data

### Overall Success Criteria:
- Professional tax practitioners can use output in client presentations
- Calculations are defensible in audit
- Assumptions are clearly documented
- Edge cases are flagged for review
- System handles all 45+ states correctly
- Performance is acceptable (<5 seconds per analysis)

---

## Future Enhancements (Beyond This Plan)

1. **Filing Frequency Per State**
   - Track whether state requires monthly, quarterly, or annual filing
   - More accurate interest calculation based on actual filing due dates

2. **Transaction-Level Exemptions**
   - Clothing exemptions (some states)
   - Food exemptions
   - Resale certificates

3. **Destination-Based Rates**
   - Use actual ship-to address for local tax rate
   - Requires tax rate lookup service integration

4. **Penalty Modeling**
   - Model different penalty scenarios
   - Compare VDA with self-disclosure vs audit outcomes

5. **Registration Timeline Tracking**
   - Track when client actually registered
   - Adjust liability calculations accordingly

6. **Multi-State Package Deals**
   - Package pricing for VDA across multiple states
   - Bundle discounts

---

## Questions & Notes

### Open Questions:
1. Should we support custom fiscal year for all states, or just Puerto Rico?
2. How to handle states that changed thresholds mid-year?
3. Should we track physical nexus separately from economic nexus?
4. How to handle marketplace transactions where we're unsure if marketplace collected?

### Technical Debt:
- Current implementation doesn't validate transaction data thoroughly
- No duplicate transaction detection
- No handling of amended returns
- Interest calculation is simplified (doesn't account for payment plans)

### Performance Considerations:
- Rolling 12-month lookback can be O(n²) for large datasets
- Consider caching or optimization for analyses with >10,000 transactions
- Database indexes on transaction dates may be needed

---

**END OF IMPLEMENTATION PLAN**

*This is a living document. Update as requirements change or new information is discovered.*
