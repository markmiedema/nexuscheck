-- Migration 038: Add Performance Indexes for State Detail Endpoint
-- Created: 2025-12-09
-- Purpose: Record indexes applied to production and add enhanced index for state detail queries
--
-- Background:
-- The GET /analyses/{id}/states/{state_code} endpoint was taking 800ms+ due to
-- missing indexes on sales_transactions table. These indexes were applied directly
-- to production via Supabase SQL Editor. This migration records them for version
-- control and adds an enhanced 3-column index.
--
-- Indexes applied to production:
-- - idx_sales_transactions_analysis_id (analysis_id)
-- - idx_sales_transactions_analysis_state (analysis_id, customer_state)
--
-- New index added:
-- - idx_sales_transactions_analysis_state_date (analysis_id, customer_state, transaction_date)
--   This covers the WHERE clause AND ORDER BY for the state detail query.

-- ============================================================================
-- Record existing indexes (already in production, safe to run with IF NOT EXISTS)
-- ============================================================================

-- Single-column index on analysis_id (for general queries)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_analysis_id
ON sales_transactions(analysis_id);

-- Two-column index for state filtering (covers WHERE analysis_id = ? AND customer_state = ?)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_analysis_state
ON sales_transactions(analysis_id, customer_state);

-- ============================================================================
-- Add enhanced 3-column index (NEW)
-- ============================================================================

-- Three-column index that covers:
-- - WHERE analysis_id = ? AND customer_state = ?
-- - ORDER BY transaction_date
-- This eliminates the need for a separate sort operation
CREATE INDEX IF NOT EXISTS idx_sales_transactions_analysis_state_date
ON sales_transactions(analysis_id, customer_state, transaction_date);

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON INDEX idx_sales_transactions_analysis_id IS
'Index for filtering transactions by analysis. Used by multiple endpoints.';

COMMENT ON INDEX idx_sales_transactions_analysis_state IS
'Compound index for filtering transactions by analysis and state. Used by state detail endpoint.';

COMMENT ON INDEX idx_sales_transactions_analysis_state_date IS
'Covering index for state detail queries. Covers WHERE (analysis_id, customer_state) and ORDER BY transaction_date.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    v_index_count INTEGER;
BEGIN
    -- Count the indexes we just created
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE tablename = 'sales_transactions'
      AND indexname IN (
        'idx_sales_transactions_analysis_id',
        'idx_sales_transactions_analysis_state',
        'idx_sales_transactions_analysis_state_date'
      );

    IF v_index_count < 3 THEN
        RAISE WARNING 'Expected 3 indexes, found %. Some indexes may not have been created.', v_index_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All 3 performance indexes verified on sales_transactions table';
    END IF;
END $$;

-- ============================================================================
-- Performance notes
-- ============================================================================
--
-- Before these indexes:
-- - State detail endpoint: 800ms+ (full table scan)
--
-- After these indexes:
-- - State detail endpoint: ~50-100ms (index scan)
--
-- The 3-column index is the most important for the state detail query:
--   SELECT ... FROM sales_transactions
--   WHERE analysis_id = ? AND customer_state = ?
--   ORDER BY transaction_date
--
-- ============================================================================
