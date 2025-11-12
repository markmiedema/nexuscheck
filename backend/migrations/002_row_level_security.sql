-- ============================================================================
-- SALT Tax Tool - Row Level Security (RLS) Policies
-- ============================================================================
-- Created: 2025-11-02
-- Purpose: Enable RLS and create policies for multi-tenant data isolation
-- Database: Supabase (PostgreSQL)
--
-- SECURITY MODEL:
-- - Users can only access their own analyses and related data
-- - State rules tables are read-only for all authenticated users
-- - Supabase Auth handles authentication (auth.uid() = users.id)
-- ============================================================================

-- ============================================================================
-- PART 1: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- User-specific tables (strict isolation)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_nexus ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Public reference tables (read-only for authenticated users)
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_nexus_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_facilitator_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_penalty_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: USER-SPECIFIC TABLE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: users
-- ----------------------------------------------------------------------------
-- Users can read and update their own profile
-- User creation handled by Supabase Auth trigger

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can create their own profile (on first login)
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own account
CREATE POLICY "Users can delete own account"
  ON users
  FOR DELETE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- TABLE: analyses
-- ----------------------------------------------------------------------------
-- Users can manage their own analyses

-- SELECT: Users can view their own analyses
CREATE POLICY "Users can view own analyses"
  ON analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create analyses for themselves
CREATE POLICY "Users can create own analyses"
  ON analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON analyses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- TABLE: sales_transactions
-- ----------------------------------------------------------------------------
-- Users can manage sales data for their own analyses

-- SELECT: Users can view sales data for their own analyses
CREATE POLICY "Users can view own sales transactions"
  ON sales_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = sales_transactions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- INSERT: Users can add sales data to their own analyses
CREATE POLICY "Users can insert own sales transactions"
  ON sales_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = sales_transactions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update sales data for their own analyses
CREATE POLICY "Users can update own sales transactions"
  ON sales_transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = sales_transactions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = sales_transactions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete sales data from their own analyses
CREATE POLICY "Users can delete own sales transactions"
  ON sales_transactions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = sales_transactions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: physical_nexus
-- ----------------------------------------------------------------------------
-- Users can manage physical nexus data for their own analyses

-- SELECT: Users can view physical nexus for their own analyses
CREATE POLICY "Users can view own physical nexus"
  ON physical_nexus
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = physical_nexus.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- INSERT: Users can add physical nexus to their own analyses
CREATE POLICY "Users can insert own physical nexus"
  ON physical_nexus
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = physical_nexus.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update physical nexus for their own analyses
CREATE POLICY "Users can update own physical nexus"
  ON physical_nexus
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = physical_nexus.analysis_id
      AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = physical_nexus.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete physical nexus from their own analyses
CREATE POLICY "Users can delete own physical nexus"
  ON physical_nexus
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = physical_nexus.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: state_results
-- ----------------------------------------------------------------------------
-- Users can view results for their own analyses

-- SELECT: Users can view state results for their own analyses
CREATE POLICY "Users can view own state results"
  ON state_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = state_results.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- INSERT: Users can add state results to their own analyses
CREATE POLICY "Users can insert own state results"
  ON state_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = state_results.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update state results for their own analyses
CREATE POLICY "Users can update own state results"
  ON state_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = state_results.analysis_id
      AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = state_results.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete state results from their own analyses
CREATE POLICY "Users can delete own state results"
  ON state_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = state_results.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: error_logs
-- ----------------------------------------------------------------------------
-- Users can view their own error logs

-- SELECT: Users can view their own errors
CREATE POLICY "Users can view own errors"
  ON error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: System can log errors for any user (relaxed for system operations)
CREATE POLICY "System can log errors"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- NOTE: No UPDATE or DELETE policies - error logs are immutable for audit purposes

-- ----------------------------------------------------------------------------
-- TABLE: audit_log
-- ----------------------------------------------------------------------------
-- Users can view their own audit trail

-- SELECT: Users can view their own audit log
CREATE POLICY "Users can view own audit log"
  ON audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: System can log actions for any user (relaxed for system operations)
CREATE POLICY "System can log actions"
  ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- NOTE: No UPDATE or DELETE policies - audit logs are immutable

-- ============================================================================
-- PART 3: PUBLIC REFERENCE TABLE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: states
-- ----------------------------------------------------------------------------
-- All authenticated users can read state metadata
-- Only service_role can modify (admin access)

-- SELECT: All authenticated users can read states
CREATE POLICY "Authenticated users can read states"
  ON states
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: Only service_role (admin via backend)
-- No policies needed - service_role bypasses RLS

-- ----------------------------------------------------------------------------
-- TABLE: economic_nexus_thresholds
-- ----------------------------------------------------------------------------
-- All authenticated users can read thresholds
-- Only service_role can modify

-- SELECT: All authenticated users can read thresholds
CREATE POLICY "Authenticated users can read nexus thresholds"
  ON economic_nexus_thresholds
  FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- TABLE: marketplace_facilitator_rules
-- ----------------------------------------------------------------------------
-- All authenticated users can read marketplace rules
-- Only service_role can modify

-- SELECT: All authenticated users can read MF rules
CREATE POLICY "Authenticated users can read MF rules"
  ON marketplace_facilitator_rules
  FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- TABLE: tax_rates
-- ----------------------------------------------------------------------------
-- All authenticated users can read tax rates
-- Only service_role can modify

-- SELECT: All authenticated users can read tax rates
CREATE POLICY "Authenticated users can read tax rates"
  ON tax_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- TABLE: interest_penalty_rates
-- ----------------------------------------------------------------------------
-- All authenticated users can read interest/penalty rates
-- Only service_role can modify

-- SELECT: All authenticated users can read interest/penalty rates
CREATE POLICY "Authenticated users can read interest penalty rates"
  ON interest_penalty_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PART 4: HELPER FUNCTIONS (Optional but Recommended)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: Check if user owns analysis
-- ----------------------------------------------------------------------------
-- Useful for application-level checks and database functions

CREATE OR REPLACE FUNCTION user_owns_analysis(analysis_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM analyses
    WHERE id = analysis_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNCTION: Get user's analysis count
-- ----------------------------------------------------------------------------
-- Example helper function for dashboard

CREATE OR REPLACE FUNCTION get_user_analysis_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM analyses
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: VALIDATION & TESTING
-- ============================================================================

-- After running this script, test with these queries:
--
-- 1. Verify RLS is enabled on all tables:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Expected: rowsecurity = true for all tables
--
-- 2. Check all policies created:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- Expected: ~35+ policies listed
--
-- 3. Test user isolation (as authenticated user):
--
-- -- Should only see own analyses
-- SELECT id, client_company_name, user_id FROM analyses;
--
-- -- Should only see own profile
-- SELECT id, email, company_name FROM users;
--
-- -- Should see all state rules (public data)
-- SELECT code, name FROM states;
--
-- 4. Test cross-user access prevention:
--
-- -- Try to insert analysis for different user (should fail)
-- INSERT INTO analyses (user_id, client_company_name, analysis_period_start, analysis_period_end)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test Corp', '2024-01-01', '2024-12-31');
--
-- Expected: Policy violation error
--
-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- SECURITY NOTES:
--
-- 1. service_role key bypasses RLS - NEVER expose to frontend
-- 2. anon key has no policies - cannot access any data without authentication
-- 3. authenticated users isolated by auth.uid() = users.id
-- 4. State rules are read-only for users, writable only via service_role (backend)
-- 5. Error logs and audit logs are write-once, read-own for compliance
--
-- NEXT STEPS:
--
-- 1. Run this script in Supabase SQL Editor (after 001_initial_schema.sql)
-- 2. Run validation queries above to verify RLS is working
-- 3. Test user creation flow with Supabase Auth
-- 4. Verify multi-tenant isolation with test users
-- 5. Configure backend to use service_role key for state rules updates
--
-- ============================================================================
