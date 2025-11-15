# Data Models & Database Schema Audit

**Database**: Supabase (PostgreSQL)
**Migrations**: 22 migration files
**Tables**: 12 core tables
**Last Updated**: 2025-01-14

---

## Overview

The SALT Tax Tool uses PostgreSQL (via Supabase) as its primary database. The schema has evolved through 22 migrations, adding columns and constraints as features were developed.

**Good News**:
- ✅ Well-structured relational schema
- ✅ Proper foreign key relationships
- ✅ Migration-based schema management
- ✅ Temporal data support (effective_from/effective_to)
- ✅ Soft deletes implemented

**Concerns**:
- ⚠️ No ORM layer (raw SQL everywhere)
- ⚠️ Schema drift from initial design
- ⚠️ Some columns added but never fully implemented
- ⚠️ No database views (aggregation done in code)

---

## Schema Evolution

### Initial Schema (Migration 001)
Created 12 core tables:
1. `users`
2. `states`
3. `analyses`
4. `sales_transactions`
5. `physical_nexus`
6. `state_results`
7. `error_logs`
8. `audit_log`
9. `economic_nexus_thresholds`
10. `marketplace_facilitator_rules`
11. `tax_rates`
12. `interest_penalty_rates`

### Major Schema Changes

**Migration 009** - Added state_results fields:
- `transaction_count`
- `approaching_threshold`
- `threshold`

**Migration 010** - Phase 1A Multi-Year Support:
- Added `year` column to `state_results`
- Added `nexus_date`, `obligation_start_date`, `first_nexus_year`
- Added `lookback_period` to `economic_nexus_thresholds`
- Changed unique constraint from `(analysis_id, state)` to `(analysis_id, state, year)`

**Migration 012** - Made analysis dates nullable:
- `analysis_period_start` and `analysis_period_end` now nullable
- Supports auto-detection from CSV

**Migration 013** - Physical nexus schema update:
- Changed `physical_nexus` table structure
- Added state_code reference

**Migration 014** - Revenue stream and exempt sales:
- Added `revenue_stream`, `is_taxable`, `exempt_amount`, `taxable_amount` to `sales_transactions`
- Added `gross_sales`, `taxable_sales`, `exempt_sales` to `state_results`

**Migration 015** - Exposure sales:
- Added `exposure_sales` to `state_results`

**Migration 018** - Full exempt sales support:
- Enhanced exempt sales columns
- Added validation

**Migration 019** - Allow negative exempt amounts:
- Removed check constraint blocking negative values
- Supports refunds/corrections

---

## Table Reference

### 1. users

**Purpose**: User accounts and authentication

**Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

**Indexes**:
- `idx_users_email` on `email`
- `idx_users_created` on `created_at DESC`

**Relationships**:
- One-to-many: `analyses`
- One-to-many: `error_logs`
- One-to-many: `audit_log`

**Issues**:
- ⚠️ No user roles/permissions (all users have same access)
- ⚠️ `company_name` is optional but probably shouldn't be
- ⚠️ Future fields commented out (firm branding info)

---

### 2. states

**Purpose**: State metadata and basic information

**Schema**:
```sql
CREATE TABLE states (
  code CHAR(2) PRIMARY KEY,           -- 'CA', 'NY', etc.
  name VARCHAR(50) NOT NULL,          -- 'California', 'New York'
  has_sales_tax BOOLEAN NOT NULL DEFAULT TRUE,
  economic_nexus_effective_date DATE,
  has_local_taxes BOOLEAN NOT NULL DEFAULT FALSE,
  has_home_rule_cities BOOLEAN NOT NULL DEFAULT FALSE,
  has_vda_program BOOLEAN NOT NULL DEFAULT TRUE,
  vda_contact_email VARCHAR(100),
  vda_contact_phone VARCHAR(20),
  state_tax_website VARCHAR(255),
  registration_url VARCHAR(255),
  typical_processing_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- One-to-many: `economic_nexus_thresholds`
- One-to-many: `marketplace_facilitator_rules`
- One-to-many: `tax_rates`
- One-to-many: `interest_penalty_rates`

**Data**: Should contain 51 records (50 states + DC)

**Issues**:
- ⚠️ No validation that all 51 states exist
- ⚠️ `typical_processing_time_days` rarely populated
- ⚠️ URLs could become stale over time

---

### 3. analyses

**Purpose**: Track each nexus analysis project

**Schema**:
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Client & Analysis Info
  client_company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  business_type VARCHAR(50),
  analysis_period_start DATE,      -- NULLABLE since migration 012
  analysis_period_end DATE,        -- NULLABLE since migration 012

  -- File Storage Paths
  uploaded_file_path TEXT,
  report_storage_path TEXT,

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'draft',
    -- 'draft', 'processing', 'complete', 'error'
  error_message TEXT,
  last_error_at TIMESTAMP,

  -- Results Summary
  total_liability DECIMAL(12,2),
  states_with_nexus INTEGER,

  -- Retention Policy
  retention_policy VARCHAR(20) NOT NULL DEFAULT '90_days',
    -- 'delete_immediate', '90_days', '1_year'
  auto_delete_date DATE,
  deleted_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'processing', 'complete', 'error')),
  CONSTRAINT valid_period CHECK (analysis_period_end > analysis_period_start),
  CONSTRAINT valid_retention CHECK (retention_policy IN ('delete_immediate', '90_days', '1_year'))
);
```

**Indexes**:
- `idx_analyses_user` on `(user_id, created_at DESC)`
- `idx_analyses_status` on `status`
- `idx_analyses_auto_delete` on `auto_delete_date WHERE deleted_at IS NULL`

**Relationships**:
- Many-to-one: `users`
- One-to-many: `sales_transactions`
- One-to-many: `physical_nexus`
- One-to-many: `state_results`

**Issues**:
- 🔴 `uploaded_file_path` is TEXT but never used (file stored in Supabase Storage instead)
- 🔴 `valid_period` constraint fails when both dates are NULL (should handle nullable case)
- ⚠️ `industry` column exists but never populated
- ⚠️ No index on `status` + `user_id` (common query pattern)
- ⚠️ Auto-delete scheduled job not confirmed to exist

---

### 4. sales_transactions

**Purpose**: Store uploaded sales transaction data

**Initial Schema**:
```sql
CREATE TABLE sales_transactions (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  customer_state CHAR(2) NOT NULL,
  sales_amount DECIMAL(12,2) NOT NULL,
  sales_channel VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  transaction_count INTEGER DEFAULT 1,
  tax_collected DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Added in Migration 014**:
```sql
ALTER TABLE sales_transactions
  ADD COLUMN revenue_stream VARCHAR(100),
  ADD COLUMN is_taxable BOOLEAN DEFAULT TRUE,
  ADD COLUMN exempt_amount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN taxable_amount DECIMAL(12,2);
```

**Current Full Schema**:
- `id` - Serial primary key
- `analysis_id` - FK to analyses
- `transaction_date` - Date of sale
- `customer_state` - 2-char state code
- `sales_amount` - Gross sales amount
- `sales_channel` - 'direct', 'marketplace', 'other'
- `transaction_id` - Optional external ID
- `transaction_count` - Always 1 (legacy field)
- `tax_collected` - Optional (rarely used)
- `revenue_stream` - Product/service category (optional)
- `is_taxable` - Boolean flag for taxability
- `exempt_amount` - Dollar amount exempt from tax
- `taxable_amount` - Amount subject to tax
- `created_at` - Timestamp

**Indexes**:
- `idx_sales_transactions_revenue_stream` on `revenue_stream`
- `idx_sales_transactions_is_taxable` on `is_taxable`

**Relationships**:
- Many-to-one: `analyses` (CASCADE delete)

**Issues**:
- ⚠️ No index on `(analysis_id, customer_state, transaction_date)` - common query pattern
- ⚠️ `transaction_count` always 1 - could be removed
- ⚠️ `tax_collected` rarely populated, unclear purpose
- ⚠️ No constraint ensuring `taxable_amount = sales_amount - exempt_amount`
- ⚠️ Migration 019 allows negative `exempt_amount` (for refunds) but no documentation

**Data Volume Concerns**:
- Could grow to millions of rows
- No partitioning strategy
- No archival/cleanup process (besides analysis deletion)

---

### 5. physical_nexus

**Purpose**: User-defined physical nexus configurations

**Schema** (updated in Migration 013):
```sql
CREATE TABLE physical_nexus (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  state_code CHAR(2) NOT NULL,        -- Changed from 'state'
  nexus_type VARCHAR(50) NOT NULL,
  established_date DATE NOT NULL,
  ended_date DATE,
  still_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- Many-to-one: `analyses` (CASCADE delete)

**Issues**:
- ⚠️ Column renamed from `state` to `state_code` but no migration comments explain why
- ⚠️ No FK to `states` table (should validate state_code)
- ⚠️ `nexus_type` is free text, should be ENUM or constrained
- ⚠️ `still_active` vs `ended_date` redundant (could be computed)

---

### 6. state_results

**Purpose**: Calculated nexus results per state per year

**Initial Schema**:
```sql
CREATE TABLE state_results (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  nexus_type VARCHAR(20),        -- 'physical', 'economic', 'both', 'none'
  nexus_date DATE,
  total_sales DECIMAL(12,2),
  direct_sales DECIMAL(12,2),
  marketplace_sales DECIMAL(12,2),
  estimated_liability DECIMAL(12,2),
  base_tax DECIMAL(12,2),
  interest DECIMAL(12,2),
  penalties DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Added Over Time**:
- Migration 009: `transaction_count`, `approaching_threshold`, `threshold`
- Migration 010: `year`, `nexus_date`, `obligation_start_date`, `first_nexus_year`
- Migration 014: `gross_sales`, `taxable_sales`, `exempt_sales`
- Migration 015: `exposure_sales`

**Current Full Schema** (17+ columns):
- Core identifiers: `id`, `analysis_id`, `state`, `year`
- Nexus determination: `nexus_type`, `nexus_date`, `obligation_start_date`, `first_nexus_year`
- Sales breakdowns: `total_sales`, `gross_sales`, `taxable_sales`, `exempt_sales`, `exposure_sales`
- Sales channels: `direct_sales`, `marketplace_sales`
- Liability: `estimated_liability`, `base_tax`, `interest`, `penalties`
- Metadata: `transaction_count`, `approaching_threshold`, `threshold`, `created_at`

**Indexes**:
- `idx_state_results_analysis_year` on `(analysis_id, year)`
- `idx_state_results_nexus_date` on `nexus_date WHERE nexus_date IS NOT NULL`
- `idx_state_results_first_nexus_year` on `first_nexus_year WHERE first_nexus_year IS NOT NULL`

**Constraints**:
- `UNIQUE (analysis_id, state, year)` - One result per state per year

**Relationships**:
- Many-to-one: `analyses` (CASCADE delete)

**Issues**:
- 🔴 **Column naming inconsistency**: `total_sales` vs `gross_sales` - which is which?
- 🔴 No constraint that `gross_sales >= taxable_sales`
- 🔴 No constraint that `taxable_sales + exempt_sales = gross_sales`
- ⚠️ 17+ columns in one table - violates normalization
- ⚠️ No FK to `states` table (should validate state code)
- ⚠️ No interest/penalty calculation metadata stored (hard to audit)
- ⚠️ `approaching_threshold` boolean but no threshold_percentage (less useful)

**Column Confusion Analysis**:

Looking at the code, it appears:
- `total_sales` = Original field, should equal `gross_sales`
- `gross_sales` = Added later, intended to clarify meaning
- Backend sometimes uses `total_sales`, sometimes `gross_sales`
- This is a **naming debt** issue

**Recommendation**: Deprecate `total_sales`, use only `gross_sales`

---

### 7. error_logs

**Purpose**: Track errors during analysis processing

**Schema**:
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  analysis_id UUID REFERENCES analyses(id),
  error_type VARCHAR(50) NOT NULL,
    -- 'validation', 'processing', 'pdf_generation', 'infrastructure'
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_error_logs_type` on `(error_type, created_at)`
- `idx_error_logs_analysis` on `analysis_id`
- `idx_error_logs_user` on `(user_id, created_at)`

**Issues**:
- ⚠️ No retention policy (table grows forever)
- ⚠️ Not clear if this is used (couldn't find inserts in code)
- ⚠️ `context` JSONB could become large (no size limit)

---

### 8. audit_log

**Purpose**: Compliance and security tracking

**Schema**:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
    -- login, analysis_created, data_exported, analysis_deleted, etc.
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_audit_log_user` on `(user_id, created_at DESC)`
- `idx_audit_log_action` on `(action, created_at DESC)`
- `idx_audit_log_resource` on `(resource_type, resource_id)`

**Issues**:
- ⚠️ No retention policy (GDPR concerns)
- ⚠️ Not clear if this is used
- ⚠️ `action` is free text, should be ENUM
- ⚠️ No guarantee `resource_id` matches `resource_type`

---

### 9. economic_nexus_thresholds

**Purpose**: Revenue and transaction thresholds by state

**Schema**:
```sql
CREATE TABLE economic_nexus_thresholds (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  threshold_type VARCHAR(20) NOT NULL,
  revenue_threshold DECIMAL(12,2),
  transaction_threshold INTEGER,
  threshold_operator VARCHAR(10) NOT NULL,    -- 'and', 'or'
  lookback_period VARCHAR(100),               -- Added migration 010
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_threshold_type CHECK (threshold_type IN ('revenue', 'transaction', 'both', 'or')),
  CONSTRAINT valid_operator CHECK (threshold_operator IN ('and', 'or')),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);
```

**Indexes**:
- `idx_nexus_thresholds_current` on `state WHERE effective_to IS NULL`
- `idx_nexus_thresholds_effective` on `(state, effective_from, effective_to)`

**Temporal Design**: ✅ Well done! Supports historical thresholds with effective dates

**Issues**:
- ⚠️ `threshold_type` values include 'both' and 'or' - confusing naming
- ⚠️ No enforcement that `(threshold_type, revenue_threshold, transaction_threshold)` are consistent
- ⚠️ `lookback_period` is free text - should be normalized or ENUM

**Example Lookback Periods** (from migration):
- "Current or Previous Calendar Year" (most common)
- "Previous Calendar Year"
- "Preceding 12 calendar months"
- "Preceding 4 Sales Tax Quarters"
- "12-month period ending on September 30"

---

### 10. marketplace_facilitator_rules

**Purpose**: How each state treats marketplace sales

**Schema**:
```sql
CREATE TABLE marketplace_facilitator_rules (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  has_mf_law BOOLEAN NOT NULL DEFAULT TRUE,
  mf_law_effective_date DATE,
  count_toward_threshold BOOLEAN NOT NULL,
  exclude_from_liability BOOLEAN NOT NULL DEFAULT TRUE,
  remote_seller_must_register BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  effective_from DATE NOT NULL,              -- Added migration 010
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);
```

**Indexes**:
- `idx_mf_rules_current` on `state WHERE effective_to IS NULL`

**Temporal Design**: ✅ Supports historical rules

**Key Fields**:
- `count_toward_threshold` - Do MF sales count for nexus determination?
- `exclude_from_liability` - Are MF sales excluded from tax liability?

**Issues**:
- ⚠️ Migration 016 fixed `exclude_from_liability` logic - indicates past confusion
- ⚠️ `mf_law_effective_date` vs `effective_from` - what's the difference?

---

### 11. tax_rates

**Purpose**: State base rate + average local rate

**Schema**:
```sql
CREATE TABLE tax_rates (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  state_rate DECIMAL(6,4) NOT NULL,          -- 0.0825 for 8.25%
  avg_local_rate DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
  combined_avg_rate DECIMAL(6,4) GENERATED ALWAYS AS (state_rate + avg_local_rate) STORED,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_rates CHECK (state_rate >= 0 AND state_rate <= 1),
  CONSTRAINT valid_local_rates CHECK (avg_local_rate >= 0 AND avg_local_rate <= 1),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);
```

**Indexes**:
- `idx_tax_rates_current` on `state WHERE effective_to IS NULL`
- `idx_tax_rates_effective` on `(state, effective_from, effective_to)`

**Temporal Design**: ✅ Supports historical rates

**Computed Column**: ✅ `combined_avg_rate` auto-calculated

**Issues**:
- ⚠️ Migration 004b allows negative local rates - why? (refunds?)
- ⚠️ Rates stored as decimals (0.0825), API converts to percentages (8.25) - conversion done in multiple places

---

### 12. interest_penalty_rates

**Purpose**: Interest and penalty calculations by state

**Schema**:
```sql
CREATE TABLE interest_penalty_rates (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),

  -- Interest
  annual_interest_rate DECIMAL(6,4) NOT NULL,
  interest_calculation_method VARCHAR(20) NOT NULL,
    -- 'simple', 'compound_monthly', 'compound_daily', 'compound_annually'

  -- Penalties
  late_registration_penalty_rate DECIMAL(6,4),
  late_registration_penalty_min DECIMAL(10,2),
  late_registration_penalty_max DECIMAL(10,2),
  late_filing_penalty_rate DECIMAL(6,4),
  late_payment_penalty_rate DECIMAL(6,4),
  penalty_applies_to VARCHAR(20) DEFAULT 'tax',  -- 'tax', 'tax_plus_interest'

  -- VDA
  vda_interest_waived BOOLEAN DEFAULT FALSE,
  vda_penalties_waived BOOLEAN DEFAULT TRUE,
  vda_lookback_period_months INTEGER,

  notes TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_rates CHECK (annual_interest_rate >= 0 AND annual_interest_rate <= 1),
  CONSTRAINT valid_calculation_method CHECK (interest_calculation_method IN ('simple', 'compound_monthly', 'compound_daily', 'compound_annually')),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);
```

**Indexes**:
- `idx_interest_penalty_current` on `state WHERE effective_to IS NULL`

**Temporal Design**: ✅ Supports historical rates

**Issues**:
- ⚠️ Migration 006 added 'compound_annually' support
- ⚠️ Migration 007 and 007b added penalty bounds and compounding - indicates evolving understanding
- ⚠️ Complex penalty logic (min/max/rate) - hard to validate
- ⚠️ VDA fields exist but VDA calculator is separate service

---

## Entity Relationship Diagram (ERD)

```
users
  └─── analyses
         ├─── sales_transactions
         ├─── physical_nexus
         └─── state_results

states
  ├─── economic_nexus_thresholds
  ├─── marketplace_facilitator_rules
  ├─── tax_rates
  └─── interest_penalty_rates

users
  ├─── error_logs
  └─── audit_log
```

**Primary Entities**:
- `users` → `analyses` (one user has many analyses)
- `analyses` → `sales_transactions`, `physical_nexus`, `state_results` (one analysis has many)

**Reference Data**:
- `states` → thresholds, rules, rates (one state has many configs over time)

**Logging**:
- `users` → logs (optional relationship)

---

## Data Integrity Analysis

### Foreign Key Constraints ✅

**Strong Relationships** (CASCADE delete):
- `analyses.user_id` → `users.id` (CASCADE)
- `sales_transactions.analysis_id` → `analyses.id` (CASCADE)
- `physical_nexus.analysis_id` → `analyses.id` (CASCADE)
- `state_results.analysis_id` → `analyses.id` (CASCADE)

**Reference Data**:
- `economic_nexus_thresholds.state` → `states.code`
- `marketplace_facilitator_rules.state` → `states.code`
- `tax_rates.state` → `states.code`
- `interest_penalty_rates.state` → `states.code`

**Missing FKs** (should exist):
- ❌ `state_results.state` → `states.code`
- ❌ `physical_nexus.state_code` → `states.code`
- ❌ `sales_transactions.customer_state` → `states.code`

**Why Missing FKs Are Bad**:
- Invalid state codes can be inserted ('XX', 'ZZ')
- No cascading behavior on state updates
- Harder to maintain referential integrity

---

### Check Constraints

**Good Constraints**:
- ✅ `analyses.status` IN ('draft', 'processing', 'complete', 'error')
- ✅ `analyses.retention_policy` IN ('delete_immediate', '90_days', '1_year')
- ✅ `tax_rates.state_rate` >= 0 AND <= 1
- ✅ Temporal: `effective_to IS NULL OR effective_to > effective_from`

**Problematic Constraints**:
- 🔴 `analyses.valid_period` CHECK fails when dates are NULL (migration 012 made dates nullable)
- ⚠️ No constraints on `state_results` sales columns (gross >= taxable, etc.)

---

### Indexes

**Well-Indexed Tables**:
- ✅ `users` - email, created_at
- ✅ `analyses` - user + created_at, status, auto_delete
- ✅ `state_results` - analysis + year, nexus_date, first_nexus_year
- ✅ `error_logs` - type, analysis, user
- ✅ `audit_log` - user, action, resource

**Missing Indexes** (likely needed):
- ❌ `sales_transactions (analysis_id, customer_state, transaction_date)` - common query
- ❌ `analyses (user_id, status)` - common filter
- ❌ `state_results (state)` - for global state queries

---

## Temporal Data Strategy

**Pattern Used**: Effective dates with NULL end date for current records

**Tables Using Temporal Data**:
- `economic_nexus_thresholds` (effective_from, effective_to)
- `marketplace_facilitator_rules` (effective_from, effective_to)
- `tax_rates` (effective_from, effective_to)
- `interest_penalty_rates` (effective_from, effective_to)

**Indexes for Current Data**:
```sql
WHERE effective_to IS NULL
```

**Strengths**:
- ✅ Supports historical data
- ✅ Can track rule changes over time
- ✅ Efficient queries for current data

**Weaknesses**:
- ⚠️ Requires code to handle date ranges correctly
- ⚠️ No built-in temporal query support (need to write WHERE clauses)
- ⚠️ Easy to forget to set `effective_to` when adding new record

---

## Multi-Year Support (Migration 010)

**Before**: One `state_results` row per analysis per state
**After**: One `state_results` row per analysis per state **per year**

**Key Change**:
```sql
-- Old constraint
UNIQUE (analysis_id, state)

-- New constraint
UNIQUE (analysis_id, state, year)
```

**Added Fields**:
- `year` - Calendar year
- `nexus_date` - Exact date nexus crossed
- `obligation_start_date` - When tax obligation begins
- `first_nexus_year` - For sticky nexus logic

**Impact**:
- ✅ Enables multi-year analyses
- ✅ Supports sticky nexus (once established, continues)
- ⚠️ Increased data volume (3 years = 3× rows)
- ⚠️ Queries must GROUP BY year or filter specific year

---

## Exempt Sales Support (Migration 014)

**Added to `sales_transactions`**:
- `revenue_stream` - Product category
- `is_taxable` - Boolean flag
- `exempt_amount` - Dollar amount exempt
- `taxable_amount` - Amount subject to tax

**Added to `state_results`**:
- `gross_sales` - Total including exempt
- `taxable_sales` - Only taxable portion
- `exempt_sales` - Non-taxable portion

**Logic**:
- Gross sales used for **nexus determination**
- Taxable sales used for **liability calculation**

**Issues**:
- 🔴 No constraint: `taxable_amount = sales_amount - exempt_amount`
- 🔴 Migration 019 allows negative `exempt_amount` (undocumented)
- ⚠️ Three ways to specify exempt sales (is_taxable, exempt_amount, both) - confusing

---

## Critical Issues Summary

### 🔴 Critical

1. **Missing Foreign Keys**
   - `state_results.state` should FK to `states.code`
   - `physical_nexus.state_code` should FK to `states.code`
   - `sales_transactions.customer_state` should FK to `states.code`
   - **Risk**: Invalid state codes can be inserted

2. **Column Naming Confusion**
   - `total_sales` vs `gross_sales` in `state_results`
   - Backend uses both interchangeably
   - **Risk**: Calculations use wrong column

3. **Broken Constraint**
   - `analyses.valid_period` CHECK fails when dates are NULL
   - Dates are nullable since migration 012
   - **Risk**: Database errors on INSERT

4. **No ORM Layer**
   - All queries are raw SQL strings
   - No type safety
   - No query builder
   - **Risk**: SQL injection, typos, hard to maintain

5. **No Data Validation in Database**
   - `exempt_amount` can be anything (even > sales_amount)
   - `taxable_amount` not enforced to equal `sales_amount - exempt_amount`
   - **Risk**: Data integrity issues

### 🟡 Important

6. **Unused Columns**
   - `analyses.uploaded_file_path` - never used
   - `sales_transactions.transaction_count` - always 1
   - `sales_transactions.tax_collected` - rarely used
   - **Risk**: Confusion, wasted storage

7. **No Archival Strategy**
   - `sales_transactions` grows unbounded
   - `error_logs` grows forever
   - `audit_log` grows forever (GDPR issue)
   - **Risk**: Performance degradation, compliance issues

8. **Missing Indexes**
   - Common query patterns not indexed
   - Could cause slow queries as data grows
   - **Risk**: Performance issues

9. **Schema Drift**
   - 22 migrations indicate evolving understanding
   - Initial design vs current state differ significantly
   - **Risk**: Hard to understand, documentation stale

### 🟢 Nice to Have

10. **No Database Views**
    - Common aggregations done in code
    - Could be materialized views
    - **Risk**: Performance, duplicate logic

11. **Free Text Enums**
    - `nexus_type`, `sales_channel`, etc. are VARCHAR
    - Should be PostgreSQL ENUMs
    - **Risk**: Typos, invalid values

12. **No Computed Columns**
    - Only `tax_rates.combined_avg_rate` uses GENERATED
    - Could compute `exempt_sales`, `is_deleted`, etc.
    - **Risk**: Duplicate calculations, inconsistency

---

## Recommendations

### Phase 1: Fix Critical Issues (2-3 days)

1. **Add Missing Foreign Keys**
   ```sql
   ALTER TABLE state_results
   ADD CONSTRAINT fk_state_results_state
   FOREIGN KEY (state) REFERENCES states(code);

   ALTER TABLE physical_nexus
   ADD CONSTRAINT fk_physical_nexus_state
   FOREIGN KEY (state_code) REFERENCES states(code);

   ALTER TABLE sales_transactions
   ADD CONSTRAINT fk_sales_transactions_state
   FOREIGN KEY (customer_state) REFERENCES states(code);
   ```

2. **Fix Broken Constraint**
   ```sql
   ALTER TABLE analyses
   DROP CONSTRAINT valid_period;

   ALTER TABLE analyses
   ADD CONSTRAINT valid_period
   CHECK (
     (analysis_period_start IS NULL AND analysis_period_end IS NULL)
     OR
     (analysis_period_end > analysis_period_start)
   );
   ```

3. **Standardize Column Names**
   ```sql
   -- Deprecate total_sales in favor of gross_sales
   ALTER TABLE state_results
   ADD COLUMN IF NOT EXISTS gross_sales DECIMAL(15,2);

   UPDATE state_results
   SET gross_sales = COALESCE(gross_sales, total_sales);

   -- Keep total_sales for backward compat but mark deprecated
   COMMENT ON COLUMN state_results.total_sales IS
   'DEPRECATED: Use gross_sales instead. Will be removed in v2.';
   ```

4. **Add Data Validation Constraints**
   ```sql
   ALTER TABLE sales_transactions
   ADD CONSTRAINT valid_taxable_amount
   CHECK (taxable_amount = sales_amount - COALESCE(exempt_amount, 0));

   ALTER TABLE state_results
   ADD CONSTRAINT valid_sales_breakdown
   CHECK (gross_sales >= taxable_sales);
   ```

### Phase 2: Introduce ORM (1 week)

5. **Evaluate ORMs**
   - SQLAlchemy (most popular)
   - Tortoise ORM (async-first)
   - Piccolo (modern, async)

6. **Create Models**
   - Define Python classes for each table
   - Use Pydantic for validation
   - Generate migrations from models

7. **Gradual Migration**
   - Start with read-only operations
   - Replace raw SQL queries one service at a time
   - Keep raw SQL for complex queries (for now)

### Phase 3: Improve Performance (3-5 days)

8. **Add Missing Indexes**
   ```sql
   CREATE INDEX idx_sales_transactions_analysis_state_date
   ON sales_transactions(analysis_id, customer_state, transaction_date);

   CREATE INDEX idx_analyses_user_status
   ON analyses(user_id, status);

   CREATE INDEX idx_state_results_state
   ON state_results(state);
   ```

9. **Create Database Views**
   ```sql
   -- View for current state rules
   CREATE OR REPLACE VIEW current_state_rules AS
   SELECT
     s.code,
     s.name,
     ent.revenue_threshold,
     ent.transaction_threshold,
     ent.lookback_period,
     mf.exclude_from_liability,
     tr.combined_avg_rate,
     ipr.annual_interest_rate
   FROM states s
   LEFT JOIN economic_nexus_thresholds ent
     ON s.code = ent.state AND ent.effective_to IS NULL
   LEFT JOIN marketplace_facilitator_rules mf
     ON s.code = mf.state AND mf.effective_to IS NULL
   LEFT JOIN tax_rates tr
     ON s.code = tr.state AND tr.effective_to IS NULL
   LEFT JOIN interest_penalty_rates ipr
     ON s.code = ipr.state AND ipr.effective_to IS NULL;
   ```

10. **Consider Partitioning**
    - Partition `sales_transactions` by `analysis_id`
    - Or by `transaction_date` (monthly/yearly)
    - Improves query performance for large datasets

### Phase 4: Data Governance (ongoing)

11. **Implement Archival**
    - Archive old analyses after retention period
    - Move to cold storage or delete
    - Prune `error_logs` and `audit_log`

12. **Add Data Quality Checks**
    - Scheduled job to detect:
      - Orphaned records
      - Invalid state codes (before adding FK)
      - Missing required fields
      - Data anomalies

13. **Document Schema**
    - Create ER diagram
    - Document each table purpose
    - Document each column meaning
    - Keep synchronized with migrations

---

## Migration Strategy

**Goal**: Modernize database without breaking production

**Step 1: Add Constraints (Non-Breaking)**
- Add missing FKs
- Fix broken constraints
- Add validation constraints
- **Deploy**: Database changes only

**Step 2: Standardize Names (Non-Breaking)**
- Add new columns (`gross_sales`)
- Backfill from old columns
- Mark old columns deprecated
- **Deploy**: Database changes only

**Step 3: Update Code to Use New Columns**
- Update services to use `gross_sales` instead of `total_sales`
- **Deploy**: Code changes only

**Step 4: Introduce ORM (Breaking Change - Coordinate)**
- Create SQLAlchemy models
- Replace raw SQL in one service
- Test thoroughly
- Repeat for each service
- **Deploy**: Code changes, gradual rollout

**Step 5: Drop Deprecated Columns (Breaking Change)**
- Remove `total_sales` column
- Remove `uploaded_file_path`
- Remove `transaction_count`
- **Deploy**: Database + code changes together

---

## Testing Strategy

### Schema Tests

1. **Constraint Tests**
   - Test FK constraints prevent invalid data
   - Test CHECK constraints reject bad values
   - Test UNIQUE constraints prevent duplicates

2. **Migration Tests**
   - Test each migration can run
   - Test rollback works
   - Test idempotency (run twice)

3. **Index Tests**
   - Test indexes are used (EXPLAIN ANALYZE)
   - Test query performance with/without indexes

### Data Integrity Tests

4. **Referential Integrity**
   - No orphaned records
   - All FKs valid
   - Cascade deletes work

5. **Data Validation**
   - No invalid state codes
   - No negative amounts (where not allowed)
   - Date ranges valid

### ORM Tests (when implemented)

6. **Model Tests**
   - Models match database schema
   - Relationships work correctly
   - Queries return expected types

---

## Metrics

- **Total Tables**: 12
- **Total Migrations**: 22
- **Schema Evolution**: High (22 migrations for initial launch indicates rapid iteration)
- **Temporal Tables**: 4 (thresholds, rules, rates)
- **Foreign Keys**: 16 defined, 3 missing
- **Indexes**: ~20 total
- **Constraints**: ~15 CHECK constraints
- **Column Count**: ~100 total across all tables
- **Largest Table**: `state_results` (17+ columns)
- **Most Complex Table**: `interest_penalty_rates` (many fields, complex logic)

---

## Dependencies

### Database
- PostgreSQL (via Supabase)
- Supabase Storage (for file uploads)
- Supabase RLS (Row Level Security)

### Code Dependencies
- No ORM (direct SQL)
- Supabase Python client
- Pandas (for data processing)

---

## Next Steps

1. ✅ Complete this audit
2. ⏸️ Add missing foreign keys (critical)
3. ⏸️ Fix broken constraint (critical)
4. ⏸️ Standardize column names (important)
5. ⏸️ Evaluate ORM options
6. ⏸️ Create ER diagram (visual documentation)

---

*Continue to: `04-frontend-backend-sync/` audit*
