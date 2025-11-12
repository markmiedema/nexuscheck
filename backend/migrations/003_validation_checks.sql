-- ============================================================================
-- SALT Tax Tool - Database Validation Checks
-- ============================================================================
-- Created: 2025-11-02
-- Purpose: Verify database schema and RLS policies are correctly configured
-- Run after: 001_initial_schema.sql and 002_row_level_security.sql
-- ============================================================================

-- ============================================================================
-- CHECK 1: Verify All Tables Exist
-- ============================================================================
-- Expected: 12 tables listed

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- analyses, audit_log, economic_nexus_thresholds, error_logs,
-- interest_penalty_rates, marketplace_facilitator_rules, physical_nexus,
-- sales_transactions, state_results, states, tax_rates, users

-- ============================================================================
-- CHECK 2: Verify RLS is Enabled on All Tables
-- ============================================================================
-- Expected: rowsecurity = true for all 12 tables

SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should show: rls_enabled = true

-- ============================================================================
-- CHECK 3: Count RLS Policies
-- ============================================================================
-- Expected: 35+ policies

SELECT
  COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- Expected: 35 or more policies

-- ============================================================================
-- CHECK 4: List All RLS Policies by Table
-- ============================================================================
-- Review policy names and commands

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  CASE
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    WHEN cmd = 'ALL' THEN 'All Operations'
  END AS operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Expected policies per table:
-- User-specific tables: 4 policies each (SELECT, INSERT, UPDATE, DELETE)
-- Public reference tables: 1 policy each (SELECT only)
-- error_logs, audit_log: 2 policies each (SELECT own, INSERT for system)

-- ============================================================================
-- CHECK 5: Verify Foreign Key Constraints
-- ============================================================================
-- Expected: Multiple foreign key relationships

SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected foreign keys:
-- analyses.user_id → users.id
-- sales_transactions.analysis_id → analyses.id
-- physical_nexus.analysis_id → analyses.id
-- state_results.analysis_id → analyses.id
-- error_logs.user_id → users.id
-- error_logs.analysis_id → analyses.id
-- audit_log.user_id → users.id
-- economic_nexus_thresholds.state → states.code
-- marketplace_facilitator_rules.state → states.code
-- tax_rates.state → states.code
-- interest_penalty_rates.state → states.code

-- ============================================================================
-- CHECK 6: Verify Indexes Exist
-- ============================================================================
-- Expected: 15+ indexes (excluding primary keys)

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey' -- Exclude primary key indexes
ORDER BY tablename, indexname;

-- Expected indexes:
-- idx_users_email, idx_users_created
-- idx_analyses_user, idx_analyses_status, idx_analyses_auto_delete
-- idx_error_logs_type, idx_error_logs_analysis, idx_error_logs_user
-- idx_audit_log_user, idx_audit_log_action, idx_audit_log_resource
-- idx_nexus_thresholds_current, idx_nexus_thresholds_effective
-- idx_mf_rules_current
-- idx_tax_rates_current, idx_tax_rates_effective
-- idx_interest_penalty_current

-- ============================================================================
-- CHECK 7: Verify CHECK Constraints
-- ============================================================================
-- Expected: Multiple check constraints for data validation

SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected constraints:
-- analyses: valid_status, valid_period, valid_retention
-- economic_nexus_thresholds: valid_threshold_type, valid_operator, valid_dates, valid_thresholds
-- marketplace_facilitator_rules: valid_dates
-- tax_rates: valid_rates, valid_local_rates, valid_dates
-- interest_penalty_rates: valid_rates, valid_calculation_method, valid_dates

-- ============================================================================
-- CHECK 8: Verify UNIQUE Constraints
-- ============================================================================
-- Expected: At least users.email

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: users.email (UNIQUE)

-- ============================================================================
-- CHECK 9: Verify Generated Columns
-- ============================================================================
-- Expected: tax_rates.combined_avg_rate

SELECT
  table_name,
  column_name,
  data_type,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_generated = 'ALWAYS'
ORDER BY table_name, column_name;

-- Expected: tax_rates.combined_avg_rate (GENERATED ALWAYS AS state_rate + avg_local_rate)

-- ============================================================================
-- CHECK 10: Verify Column Data Types
-- ============================================================================
-- Review all columns and their types

SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Review for accuracy against specification documents

-- ============================================================================
-- CHECK 11: Test Helper Functions
-- ============================================================================

-- Verify helper functions exist
SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('user_owns_analysis', 'get_user_analysis_count')
ORDER BY routine_name;

-- Expected: 2 functions listed

-- ============================================================================
-- CHECK 12: Row Counts (After Data Population)
-- ============================================================================
-- Run this after populating initial data

-- Count rows in each table
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'analyses', COUNT(*) FROM analyses
UNION ALL
SELECT 'sales_transactions', COUNT(*) FROM sales_transactions
UNION ALL
SELECT 'physical_nexus', COUNT(*) FROM physical_nexus
UNION ALL
SELECT 'state_results', COUNT(*) FROM state_results
UNION ALL
SELECT 'error_logs', COUNT(*) FROM error_logs
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log
UNION ALL
SELECT 'states', COUNT(*) FROM states
UNION ALL
SELECT 'economic_nexus_thresholds', COUNT(*) FROM economic_nexus_thresholds
UNION ALL
SELECT 'marketplace_facilitator_rules', COUNT(*) FROM marketplace_facilitator_rules
UNION ALL
SELECT 'tax_rates', COUNT(*) FROM tax_rates
UNION ALL
SELECT 'interest_penalty_rates', COUNT(*) FROM interest_penalty_rates
ORDER BY table_name;

-- Expected after initial population:
-- states: 51 (50 states + DC)
-- economic_nexus_thresholds: 10+ (MVP states)
-- marketplace_facilitator_rules: 10+ (MVP states)
-- tax_rates: 10+ (MVP states)
-- interest_penalty_rates: 10+ (MVP states)
-- Others: 0 (until users start creating analyses)

-- ============================================================================
-- CHECK 13: Test RLS - User Isolation (Run as authenticated user)
-- ============================================================================
-- These queries should only return the current user's data

-- Should only see own analyses
SELECT id, client_company_name, user_id, status FROM analyses;

-- Should only see own profile
SELECT id, email, company_name FROM users;

-- Should only see own sales transactions
SELECT id, analysis_id, customer_state, sales_amount FROM sales_transactions;

-- Should see ALL state rules (public data)
SELECT code, name, has_sales_tax FROM states;

-- ============================================================================
-- CHECK 14: Test RLS - Write Protection (Run as authenticated user)
-- ============================================================================
-- This should FAIL with policy violation error

-- Attempt to insert analysis for different user (should be rejected)
-- Replace '00000000-0000-0000-0000-000000000000' with a different user's UUID
/*
INSERT INTO analyses (
  user_id,
  client_company_name,
  analysis_period_start,
  analysis_period_end
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Unauthorized Test Corp',
  '2024-01-01',
  '2024-12-31'
);
*/

-- Expected: ERROR - new row violates row-level security policy

-- ============================================================================
-- CHECK 15: Database Size and Performance
-- ============================================================================

-- Check database size
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- VALIDATION CHECKLIST
-- ============================================================================
--
-- ✅ CHECK 1: All 12 tables exist
-- ✅ CHECK 2: RLS enabled on all tables
-- ✅ CHECK 3: 35+ policies created
-- ✅ CHECK 4: Policy details reviewed
-- ✅ CHECK 5: Foreign keys configured
-- ✅ CHECK 6: Indexes created
-- ✅ CHECK 7: CHECK constraints exist
-- ✅ CHECK 8: UNIQUE constraints exist
-- ✅ CHECK 9: Generated columns configured
-- ✅ CHECK 10: Data types match spec
-- ✅ CHECK 11: Helper functions exist
-- ✅ CHECK 12: Row counts reasonable
-- ✅ CHECK 13: User isolation works
-- ✅ CHECK 14: Write protection works
-- ✅ CHECK 15: Database size tracked
--
-- ============================================================================
-- END OF VALIDATION CHECKS
-- ============================================================================
