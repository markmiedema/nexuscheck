# Database Migrations Log

**Created:** 2025-11-11
**Purpose:** Chronological record of all database migrations applied to production

This document tracks all schema changes applied to the Nexus Check database. For detailed deployment procedures, see `DEPLOYMENT_GUIDE.md`.

---

## Migration Status Summary

- **Total Migrations:** 14 SQL files
- **Initial Deployment:** 10 migrations (001-008, Nov 2, 2025)
- **Post-Deployment:** 4 migrations (Nov 4-11, 2025)
- **All migrations:** ✅ DEPLOYED

---

## Initial Deployment (November 2, 2025)

These migrations were part of the initial production deployment. Detailed deployment procedures are documented in `DEPLOYMENT_GUIDE.md`.

### 001_initial_schema.sql
**Applied:** Nov 2, 2025
**Purpose:** Create core database schema (12 tables)
**Tables Created:**
- User data: `analyses`, `sales_transactions`, `physical_nexus`, `state_results`, `client_profiles`, `analysis_settings`, `error_logs`
- State rules: `states`, `state_nexus_rules`, `marketplace_facilitator_rules`, `state_tax_rates`, `state_interest_penalty_rates`

**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 2

---

### 002_row_level_security.sql
**Applied:** Nov 2, 2025
**Purpose:** Implement Row Level Security (RLS) policies for multi-tenant data isolation
**Policies Created:** RLS on all 7 user data tables, enforces `user_id` matching
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 3

---

### 002_create_storage_bucket.sql
**Applied:** Nov 2, 2025
**Purpose:** Create Supabase storage bucket for CSV file uploads
**Resources Created:** `nexus-data` bucket with RLS policies
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 4

---

### 003_validation_checks.sql
**Applied:** Nov 2, 2025
**Purpose:** Add database-level validation constraints
**Constraints Added:**
- Date ranges validation
- Sales amounts > 0
- State code format validation
- Period validation

**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 5

---

### 004b_allow_negative_local_rates.sql
**Applied:** Nov 2, 2025
**Purpose:** Relax constraint on `state_tax_rates.avg_local_rate` to allow negative values
**Reason:** Some states (Oregon) have negative "local rates" meaning state-only rate
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 6

---

### 005_populate_state_data.sql
**Applied:** Nov 2, 2025
**Purpose:** Load reference data for all 50 states + DC + territories
**Data Loaded:**
- 52 states (basic metadata)
- Economic nexus thresholds (revenue, transaction, operators)
- Marketplace facilitator rules
- State tax rates (state + avg local)

**Rows Inserted:** ~208 rows
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 7

---

### 006_add_compound_annually_support.sql
**Applied:** Nov 2, 2025
**Purpose:** Add support for annual interest compounding
**Changes:** Added `compound_frequency` column to `state_interest_penalty_rates`
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 8

---

### 007_add_late_payment_penalty_bounds.sql
**Applied:** Nov 2, 2025
**Purpose:** Add min/max bounds for late payment penalties
**Changes:** Added `late_payment_penalty_min` and `late_payment_penalty_max` columns
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 9

---

### 007b_add_filing_penalty_bounds_and_compounding.sql
**Applied:** Nov 2, 2025
**Purpose:** Add filing penalty bounds and interest compounding rules
**Changes:**
- Added `filing_penalty_min` and `filing_penalty_max` columns
- Added `interest_compounds` column (boolean)

**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 10

---

### 008_populate_interest_penalty_rates.sql
**Applied:** Nov 2, 2025
**Purpose:** Load complete interest and penalty rate data for all states
**Data Loaded:** Interest rates, late payment penalties, filing penalties for 52 jurisdictions
**Rows Inserted:** ~52 rows
**Status:** ✅ DEPLOYED
**Documentation:** `DEPLOYMENT_GUIDE.md` Section 11

---

## Post-Deployment Migrations (November 4-11, 2025)

These migrations were applied after initial deployment to support Phase 1A features and UI improvements.

### 006_add_taxable_sales_column.sql
**Applied:** Nov 4, 2025
**Purpose:** Track which sales are taxable vs total sales
**Changes:** Added `taxable_sales` column to `state_results`
**Reason:** Distinguish total sales from taxable sales (excludes marketplace when state has MF law)
**Used By:** `analyses.py:1464` (state detail endpoint)
**Related Feature:** Marketplace facilitator handling
**Status:** ✅ DEPLOYED

---

### 010_phase_1a_multi_year_chronological.sql
**Applied:** Nov 5, 2025 *(Created Nov 5, deployed same day)*
**Purpose:** Enable Phase 1A multi-year tracking and chronological processing
**Changes:**
- Added `lookback_period` to `economic_nexus_thresholds`
- Added to `state_results`: `year`, `nexus_date`, `obligation_start_date`, `first_nexus_year`
- Updated unique constraint: `(analysis_id, state)` → `(analysis_id, state, year)`
- Added indexes for multi-year queries
- Added `effective_from` to `marketplace_facilitator_rules` (future Phase 3)

**Used By:** `nexus_calculator_v2.py` (core logic lines 216-321)
**Related Features:**
- Multi-year analysis
- Sticky nexus tracking
- Exact nexus date determination
- Obligation period calculations

**Status:** ✅ DEPLOYED
**Impact:** 🔥 MAJOR - Core feature enabler

---

### 012_make_analysis_dates_nullable.sql
**Applied:** Nov 7, 2025
**Purpose:** Allow date ranges to be auto-detected from CSV
**Changes:**
- Made `analysis_period_start` and `analysis_period_end` nullable
- Updated `valid_period` constraint to handle NULL dates

**Used By:** `analyses.py:362-369` (auto-detection logic)
**Related Feature:** Smart date range detection from uploaded CSV
**Status:** ✅ DEPLOYED
**Impact:** Improves UX - users don't need to manually enter date ranges

---

### 009_add_state_results_fields.sql
**Applied:** Nov 11, 2025
**Purpose:** Add comprehensive state tracking fields
**Changes:** Added to `state_results`: `transaction_count`, `approaching_threshold`, `threshold`
**Used By:**
- `analyses.py:557` (sample data generation)
- `analyses.py:1082` (summary calculations)
- `analyses.py:1202` (multi-year aggregation)
- `analyses.py:1453` (state detail view)

**Related Feature:** Results dashboard and state detail views
**Status:** ✅ DEPLOYED

---

## Migration Numbering Notes

**Why gaps in numbering (no 011)?**
Migration 011 was likely created but not used, or the number was skipped during development. This is normal - numbering indicates sequence, not count.

**Why multiple '006' and '007' files?**
- `006_add_compound_annually_support.sql` - Initial deployment
- `006_add_taxable_sales_column.sql` - Post-deployment (Nov 4)
- `007_add_late_payment_penalty_bounds.sql` - Initial deployment
- `007b_add_filing_penalty_bounds_and_compounding.sql` - Initial deployment

The 'b' suffix indicates a follow-up migration in the same sequence. The duplicate `006_add_taxable_sales_column.sql` was created later for a different purpose.

---

## Verification

To verify all migrations are applied, check for:

```sql
-- Verify Phase 1A columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'state_results'
AND column_name IN ('year', 'nexus_date', 'obligation_start_date', 'first_nexus_year',
                     'taxable_sales', 'transaction_count', 'approaching_threshold', 'threshold');

-- Should return 8 rows

-- Verify analyses dates are nullable
SELECT is_nullable
FROM information_schema.columns
WHERE table_name = 'analyses'
AND column_name IN ('analysis_period_start', 'analysis_period_end');

-- Should return 'YES' for both

-- Verify unique constraint on state_results
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'unique_analysis_state_year';

-- Should show: UNIQUE (analysis_id, state, year)
```

---

## Related Documentation

- **`DEPLOYMENT_GUIDE.md`** - Detailed deployment procedures for initial deployment (001-008)
- **`../PHASE_1A_TEST_GUIDE.md`** - Testing guide for Phase 1A features (migration 010)
- **`../_04-technical-specs/data-model-specification.md`** - Complete schema documentation
- **`../_04-technical-specs/state-rules-schema.md`** - State rules table specifications

---

## Migration Conventions

**Naming:**
- Format: `###_descriptive_name.sql`
- Use 'b' suffix for related follow-ups: `007b_related_change.sql`
- Use descriptive names that explain purpose

**Structure:**
- Include header comments with creation date and purpose
- Add column comments for complex fields
- Include backfill logic for existing data
- Create indexes where appropriate

**Testing:**
- Test migrations on dev database first
- Verify with SELECT queries
- Check for data loss or constraint violations
- Document verification queries in DEPLOYMENT_GUIDE.md

---

**Last Updated:** 2025-11-11
**Maintained By:** Development team
**Update Frequency:** After each new migration is applied
