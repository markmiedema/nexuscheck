-- Verification queries for migrations 023 and 024
-- Run these to confirm constraints and view are working correctly

-- ============================================================================
-- 1. Verify CHECK constraints were added (Migration 023)
-- ============================================================================

SELECT
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'CHECK'
  AND table_name IN ('sales_transactions', 'state_results')
  AND constraint_name IN (
    'valid_taxable_amount',
    'valid_exempt_amount',
    'valid_sales_breakdown',
    'valid_exempt_sales',
    'valid_exposure_sales'
  )
ORDER BY table_name, constraint_name;

-- Expected: 5 rows (2 for sales_transactions, 3 for state_results)

-- ============================================================================
-- 2. Verify state_results_aggregated view exists (Migration 024)
-- ============================================================================

SELECT
    table_name,
    view_definition IS NOT NULL as has_definition
FROM information_schema.views
WHERE table_name = 'state_results_aggregated';

-- Expected: 1 row with has_definition = true

-- ============================================================================
-- 3. Test the view with sample data
-- ============================================================================

SELECT
    analysis_id,
    state_code,
    total_sales,
    taxable_sales,
    nexus_type,
    year_count
FROM state_results_aggregated
LIMIT 5;

-- Expected: Sample rows showing aggregated state data (if you have data)

-- ============================================================================
-- 4. Verify indexes were created (Migration 024)
-- ============================================================================

SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE tablename = 'state_results'
  AND indexname IN (
    'idx_state_results_analysis_state',
    'idx_state_results_nexus_type'
  );

-- Expected: 2 rows

-- ============================================================================
-- 5. Test constraint enforcement (Migration 023)
-- ============================================================================

-- This should FAIL with constraint violation:
-- INSERT INTO sales_transactions (
--     analysis_id, transaction_date, customer_state,
--     sales_amount, exempt_amount, sales_channel
-- ) VALUES (
--     gen_random_uuid(), CURRENT_DATE, 'CA',
--     100, 150, 'direct'  -- exempt > sales (should fail)
-- );

-- If the above fails with "violates check constraint", constraints are working!

-- ============================================================================
-- Summary
-- ============================================================================
-- ✓ Migration 023: 5 CHECK constraints added
-- ✓ Migration 024: 1 view + 2 indexes created
-- ✓ Data integrity enforced at database level
-- ✓ Query performance improved for aggregations
