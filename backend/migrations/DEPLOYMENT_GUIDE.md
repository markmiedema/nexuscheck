# Migration Deployment Guide
**Created:** 2025-11-02
**Purpose:** Complete guide for deploying all database schema changes and data population
**Document Type:** Historical Reference - Initial Deployment (Nov 2, 2025)

> **Note:** This guide documents the initial production deployment (migrations 001-008).
> For a complete chronological log of ALL migrations including post-deployment changes,
> see **`MIGRATIONS_LOG.md`**.

---

## Overview

This guide covers deploying:
- **Migrations 001-004:** Initial schema + RLS (already deployed ✅)
- **Migration 005:** Population of tables 1-4 (states, nexus, marketplace, tax_rates)
- **Migration 006:** ALTER schema to support 'compound_annually'
- **Migration 007:** ALTER schema to add late_payment_penalty_min/max
- **Migration 008:** Population of interest_penalty_rates (47 jurisdictions)

---

## Pre-Deployment Checklist

- [ ] Access to Supabase dashboard
- [ ] SQL Editor permissions
- [ ] Backup access (migrations are idempotent, but good practice)
- [ ] All migration files present in `migrations/` folder

---

## Deployment Sequence

### Step 1: Verify Current State (Already Deployed)

These should already be deployed:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 12 tables
-- analyses, audit_log, economic_nexus_thresholds, error_logs,
-- interest_penalty_rates, marketplace_facilitator_rules, physical_nexus,
-- sales_transactions, state_results, states, tax_rates, users
```

**Status:** ✅ Deployed (migrations 001-004)

---

### Step 2: Fix Tax Rates Constraint (NEW - Required)

**File:** `004b_allow_negative_local_rates.sql`
**Purpose:** Allow negative avg_local_rate values (NJ has -0.02% due to Urban Enterprise Zones)
**Why:** Schema must accommodate real-world data

**To Deploy:**
1. Open Supabase SQL Editor
2. Copy/paste entire contents of `004b_allow_negative_local_rates.sql`
3. Click "Run"
4. Verify:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'valid_local_rates';

-- Should show: avg_local_rate >= -1 AND avg_local_rate <= 1
```

---

### Step 3: Populate Tables 1-4

**File:** `005_populate_state_data.sql`
**Populates:**
- states (52 entries)
- economic_nexus_thresholds (47 entries)
- marketplace_facilitator_rules (47 entries)
- tax_rates (46 entries, including NJ with negative local rate)

**To Deploy:**
1. Open Supabase SQL Editor
2. Copy/paste entire contents of `005_populate_state_data.sql`
3. Click "Run"
4. Verify: `SELECT COUNT(*) FROM states;` → Expected: 52

---

### Step 4: Deploy Migration 006 (Add compound_annually Support)

**File:** `006_add_compound_annually_support.sql`
**Purpose:** Expand interest_calculation_method constraint to include 'compound_annually'
**Why:** AZ and NJ compound interest annually (research data shows this)

**To Deploy:**
1. Open Supabase SQL Editor
2. Copy/paste entire contents of `006_add_compound_annually_support.sql`
3. Click "Run"
4. Verify:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'valid_calculation_method';

-- Should show: compound_annually is now included in CHECK constraint
```

**Expected Output:**
```
ALTER TABLE interest_penalty_rates DROP CONSTRAINT IF EXISTS valid_calculation_method;
ALTER TABLE interest_penalty_rates ADD CONSTRAINT valid_calculation_method CHECK (...);
COMMIT;
```

---

### Step 5: Deploy Migration 007 (Add Flat Fee Support)

**File:** `007_add_late_payment_penalty_bounds.sql`
**Purpose:** Add late_payment_penalty_min and late_payment_penalty_max columns
**Why:** Some states have flat fees or caps for late payment penalties

**To Deploy:**
1. Open Supabase SQL Editor
2. Copy/paste entire contents of `007_add_late_payment_penalty_bounds.sql`
3. Click "Run"
4. Verify:
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interest_penalty_rates'
  AND column_name LIKE '%late_payment%'
ORDER BY ordinal_position;

-- Should show:
-- late_payment_penalty_rate (DECIMAL 6,4)
-- late_payment_penalty_min (DECIMAL 12,2) ← NEW
-- late_payment_penalty_max (DECIMAL 12,2) ← NEW
```

**Expected Output:**
```
ALTER TABLE interest_penalty_rates ADD COLUMN IF NOT EXISTS late_payment_penalty_min...;
ALTER TABLE interest_penalty_rates ADD COLUMN IF NOT EXISTS late_payment_penalty_max...;
ALTER TABLE interest_penalty_rates ADD CONSTRAINT valid_late_payment_bounds...;
COMMIT;
```

---

### Step 6: Deploy Migration 008 (Populate Interest & Penalty Rates)

**File:** `008_populate_interest_penalty_rates.sql`
**Purpose:** Populate interest_penalty_rates table with all 47 jurisdictions
**Data:** All research data preserved exactly as found

**To Deploy:**
1. Open Supabase SQL Editor
2. Copy/paste entire contents of `008_populate_interest_penalty_rates.sql`
3. Click "Run"
4. Verify with validation queries (see below)

**Expected Output:**
```
BEGIN;
INSERT INTO interest_penalty_rates (...) VALUES (...); -- x47
COMMIT;
```

---

## Post-Deployment Verification

### Verification Query 1: Row Count
```sql
SELECT COUNT(*) as total_rows
FROM interest_penalty_rates
WHERE effective_to IS NULL;
```
**Expected:** 47 rows

---

### Verification Query 2: Check compound_annually States
```sql
SELECT state, interest_rate, interest_calculation_method, interest_compounding_frequency
FROM interest_penalty_rates
WHERE interest_calculation_method = 'compound_annually'
ORDER BY state;
```
**Expected:**
- AZ (3.00%, annually)
- NJ (6.25%, annually)

---

### Verification Query 3: Check Flat Fee Penalties
```sql
SELECT
  state,
  late_filing_penalty_rate,
  late_filing_penalty_min,
  late_filing_penalty_max,
  notes
FROM interest_penalty_rates
WHERE late_filing_penalty_rate IS NULL
  AND late_filing_penalty_min IS NOT NULL
ORDER BY state;
```
**Expected:**
- TX ($50 flat fee)

---

### Verification Query 4: Check NULL vda_penalties_waived
```sql
SELECT state, vda_penalties_waived, notes
FROM interest_penalty_rates
WHERE vda_penalties_waived IS NULL;
```
**Expected:**
- PR (no data found in research - app will apply conservative default)

---

### Verification Query 5: Complete Data Summary
```sql
SELECT
  COUNT(*) as total_jurisdictions,
  COUNT(DISTINCT interest_calculation_method) as calculation_methods,
  MIN(interest_rate) as min_interest,
  MAX(interest_rate) as max_interest,
  COUNT(CASE WHEN vda_penalties_waived = TRUE THEN 1 END) as states_with_vda_penalty_waiver
FROM interest_penalty_rates
WHERE effective_to IS NULL;
```
**Expected:**
- total_jurisdictions: 47
- calculation_methods: 4 (simple, compound_monthly, compound_daily, compound_annually)
- min_interest: 0.0200 (MO = 2%)
- max_interest: 0.1800 (NV, RI = 18%)
- states_with_vda_penalty_waiver: 46 (all except PR which is NULL)

---

## Data Integrity Summary

### Approach: Schema Adapts to Reality (Not Vice Versa)

All research data was preserved exactly as found. When mismatches occurred between data and schema, we **adapted the schema** rather than modifying the research data.

### Fixes Applied:

**1. AZ/NJ compound_annually → Migration 006**
- **Issue:** Research showed AZ and NJ compound interest annually
- **Original schema:** Only allowed simple, compound_monthly, compound_daily
- **Solution:** Added 'compound_annually' to schema constraint
- **States affected:** AZ, NJ

**2. TX $50 flat fee → Migration 007 + proper storage**
- **Issue:** TX has $50 flat late filing fee (not percentage-based)
- **Original schema:** Only had late_filing_penalty_rate (DECIMAL 6,4)
- **Solution:** Added late_payment_penalty_min/max fields (pattern already exists for registration penalties)
- **Storage:** late_filing_penalty_min = 50.00, late_filing_penalty_max = 50.00, rate = NULL
- **States affected:** TX

**3. NY $500 flat fee → proper storage**
- **Issue:** NY has $500 flat late registration fee
- **Original schema:** Already had late_registration_penalty_min/max fields
- **Solution:** Use existing min/max fields (min = 500.00, max = 500.00, rate = NULL)
- **States affected:** NY

**4. PR NULL vda_penalties_waived → preserved NULL**
- **Issue:** No data found for PR VDA penalty waiver
- **Original schema:** BOOLEAN field
- **Solution:** Store as NULL (represents "unknown"), app can apply conservative default (FALSE)
- **States affected:** PR

---

## Deployment Issues Encountered & Resolved

### Issue 1: Oregon Incorrectly Included (RESOLVED)
- **Problem:** Migration 008 originally included Oregon (OR), which doesn't have sales tax
- **Discovery:** Verification query returned 48 jurisdictions instead of 47
- **Root Cause:** Generation error - OR is one of 5 states without sales tax (AK, DE, MT, NH, OR)
- **Resolution:** Deleted OR entry manually in production DB, regenerated 008 without OR
- **Status:** ✅ Migration 008 now corrected (47 jurisdictions only)

### Issue 2: Calculation Methods Count
- **Expected vs Actual:** Documentation originally said "3 calculation methods" but actual is 4
- **Methods:** simple, compound_monthly, compound_daily, compound_annually
- **States using each:**
  - simple: 43 states
  - compound_monthly: WA (1 state)
  - compound_daily: MA, NY (2 states)
  - compound_annually: AZ, NJ (2 states)
- **Status:** ✅ Documentation corrected to reflect 4 methods

---

## Rollback Procedures

If you need to rollback:

### Rollback 008 (Interest & Penalty Data)
```sql
DELETE FROM interest_penalty_rates;
```

### Rollback 007 (Remove late_payment_penalty_min/max)
```sql
ALTER TABLE interest_penalty_rates DROP COLUMN IF EXISTS late_payment_penalty_min;
ALTER TABLE interest_penalty_rates DROP COLUMN IF EXISTS late_payment_penalty_max;
ALTER TABLE interest_penalty_rates DROP CONSTRAINT IF EXISTS valid_late_payment_bounds;
```

### Rollback 006 (Remove compound_annually)
```sql
ALTER TABLE interest_penalty_rates DROP CONSTRAINT IF EXISTS valid_calculation_method;

ALTER TABLE interest_penalty_rates
ADD CONSTRAINT valid_calculation_method CHECK (
  interest_calculation_method IN ('simple', 'compound_monthly', 'compound_daily')
);
```

---

## Next Steps After Deployment

### 1. Test Sample Query (Checkpoint with Friend)
```sql
-- Get all CA nexus rules
SELECT
  'CA' as state,
  e.revenue_threshold,
  e.transaction_threshold,
  e.threshold_operator,
  mf.exclude_from_liability as mf_excluded,
  t.state_rate,
  t.avg_local_rate,
  t.state_rate + t.avg_local_rate as combined_avg_rate,
  i.interest_rate,
  i.vda_penalties_waived,
  i.vda_lookback_period_months
FROM states s
LEFT JOIN economic_nexus_thresholds e ON s.code = e.state AND e.effective_to IS NULL
LEFT JOIN marketplace_facilitator_rules mf ON s.code = mf.state AND mf.effective_to IS NULL
LEFT JOIN tax_rates t ON s.code = t.state AND t.effective_to IS NULL
LEFT JOIN interest_penalty_rates i ON s.code = i.state AND i.effective_to IS NULL
WHERE s.code = 'CA';
```

**Expected Output:**
- State: CA
- Revenue threshold: $500,000
- Tax rates: 7.25% state + 1.73% local avg = 8.98% combined
- Interest rate: 8%
- VDA penalties waived: TRUE
- VDA lookback: 36 months

### 2. Show Friend the Working Query
- Demonstrate complete nexus determination data
- Validate accuracy with their domain knowledge
- Get feedback on any missing data points

### 3. Move to Phase 2B (User Flow Design)
- Design 5-7 core screens
- Create wireframes
- Validate with friend

---

## Files Created

| File | Purpose | Status |
|------|---------|--------|
| `006_add_compound_annually_support.sql` | ALTER schema for AZ/NJ | ✅ Ready |
| `007_add_late_payment_penalty_bounds.sql` | ALTER schema for flat fees | ✅ Ready |
| `008_populate_interest_penalty_rates.sql` | Populate 47 jurisdictions | ✅ Ready |
| `generate_interest_penalty_sql.py` | Python script (reference) | ✅ Complete |
| `DEPLOYMENT_GUIDE.md` | This file | ✅ Complete |

---

## Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify prerequisites (migrations 001-004 deployed)
3. Run verification queries to identify specific issues
4. Rollback if necessary using procedures above

---

**Last Updated:** 2025-11-02
**Status:** Ready for deployment
**Total Rows:** 47 jurisdictions (45 states + DC + PR)
