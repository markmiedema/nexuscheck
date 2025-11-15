-- ============================================================================
-- Migration 022: Add Missing Foreign Keys to State Tables
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Add foreign key constraints to ensure referential integrity
--          for state codes across all tables
--
-- Impact: Prevents invalid state codes from being inserted into:
--   - sales_transactions.customer_state
--   - physical_nexus.state_code
--   - state_results.state
--
-- Prerequisites: All existing data must have valid state codes
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Existing Data Integrity
-- ============================================================================
-- Before adding constraints, check that all existing data is valid
-- This will fail if any invalid state codes exist

DO $$
DECLARE
  invalid_count INTEGER;
  invalid_states TEXT;
BEGIN
  -- Check sales_transactions
  SELECT COUNT(*), STRING_AGG(DISTINCT customer_state, ', ')
  INTO invalid_count, invalid_states
  FROM sales_transactions
  WHERE customer_state NOT IN (SELECT code FROM states);

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % invalid state codes in sales_transactions: %', invalid_count, invalid_states;
  END IF;

  -- Check physical_nexus
  SELECT COUNT(*), STRING_AGG(DISTINCT state_code, ', ')
  INTO invalid_count, invalid_states
  FROM physical_nexus
  WHERE state_code NOT IN (SELECT code FROM states);

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % invalid state codes in physical_nexus: %', invalid_count, invalid_states;
  END IF;

  -- Check state_results
  SELECT COUNT(*), STRING_AGG(DISTINCT state, ', ')
  INTO invalid_count, invalid_states
  FROM state_results
  WHERE state NOT IN (SELECT code FROM states);

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % invalid state codes in state_results: %', invalid_count, invalid_states;
  END IF;

  RAISE NOTICE 'Data integrity check passed: All state codes are valid';
END $$;

-- ============================================================================
-- STEP 2: Add Foreign Key Constraints
-- ============================================================================

-- FK 1: sales_transactions.customer_state -> states.code
-- Ensures all customer states are valid US states
ALTER TABLE sales_transactions
ADD CONSTRAINT fk_sales_transactions_customer_state
FOREIGN KEY (customer_state) REFERENCES states(code)
ON DELETE RESTRICT  -- Don't allow deleting a state if transactions exist
ON UPDATE CASCADE;  -- If state code changes (unlikely), update transactions

-- FK 2: physical_nexus.state_code -> states.code
-- Ensures all physical nexus locations are valid US states
ALTER TABLE physical_nexus
ADD CONSTRAINT fk_physical_nexus_state_code
FOREIGN KEY (state_code) REFERENCES states(code)
ON DELETE RESTRICT  -- Don't allow deleting a state if physical nexus exists
ON UPDATE CASCADE;  -- If state code changes (unlikely), update records

-- FK 3: state_results.state -> states.code
-- Ensures all state results are for valid US states
ALTER TABLE state_results
ADD CONSTRAINT fk_state_results_state
FOREIGN KEY (state) REFERENCES states(code)
ON DELETE RESTRICT  -- Don't allow deleting a state if results exist
ON UPDATE CASCADE;  -- If state code changes (unlikely), update results

-- ============================================================================
-- STEP 3: Verify Constraints Were Added
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_name IN (
      'fk_sales_transactions_customer_state',
      'fk_physical_nexus_state_code',
      'fk_state_results_state'
    );

  IF constraint_count < 3 THEN
    RAISE EXCEPTION 'Foreign key migration incomplete. Expected 3 constraints, found %', constraint_count;
  END IF;

  RAISE NOTICE 'Successfully added % foreign key constraints', constraint_count;
END $$;

-- ============================================================================
-- STEP 4: Test the Constraints (Commented Out - For Manual Testing)
-- ============================================================================

/*
-- Test 1: Try to insert invalid state code into sales_transactions (should fail)
-- INSERT INTO sales_transactions (analysis_id, transaction_date, customer_state, sales_amount, sales_channel)
-- VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '2024-01-01', 'XX', 100.00, 'direct');
-- Expected: ERROR: insert or update on table "sales_transactions" violates foreign key constraint

-- Test 2: Try to insert valid state code (should succeed)
-- INSERT INTO sales_transactions (analysis_id, transaction_date, customer_state, sales_amount, sales_channel)
-- VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '2024-01-01', 'CA', 100.00, 'direct');
-- Expected: SUCCESS

-- Test 3: Try to delete a state that has transactions (should fail)
-- DELETE FROM states WHERE code = 'CA';
-- Expected: ERROR: update or delete on table "states" violates foreign key constraint
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run after migration to verify constraints exist:
--
-- SELECT
--   tc.table_name,
--   tc.constraint_name,
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name IN ('sales_transactions', 'physical_nexus', 'state_results')
--   AND ccu.table_name = 'states';
--
-- Expected results: 3 rows showing the foreign keys we just added
-- ============================================================================

-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================
-- To remove these constraints:
--
-- ALTER TABLE sales_transactions DROP CONSTRAINT IF EXISTS fk_sales_transactions_customer_state;
-- ALTER TABLE physical_nexus DROP CONSTRAINT IF EXISTS fk_physical_nexus_state_code;
-- ALTER TABLE state_results DROP CONSTRAINT IF EXISTS fk_state_results_state;
-- ============================================================================
