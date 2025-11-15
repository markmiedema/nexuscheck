-- ============================================================================
-- Simple Test Script for Lookback Period Verification
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Single script that creates test analysis + transactions automatically
-- ============================================================================

-- Step 1: Create test analysis
WITH new_analysis AS (
  INSERT INTO analyses (
    user_id,
    client_company_name,
    analysis_period_start,
    analysis_period_end,
    created_at
  )
  SELECT
    id,
    'Test - Lookback Periods (NY/VT/CT)',
    '2023-01-01',
    '2024-12-31',
    NOW()
  FROM users
  LIMIT 1
  RETURNING id
)
-- Step 2: Insert test transactions using the new analysis_id
INSERT INTO sales_transactions (
  analysis_id, transaction_date, sales_amount, taxable_amount,
  exempt_amount, state, revenue_stream, created_at
)
SELECT
  new_analysis.id,
  txn_date,
  amount,
  amount,
  0,
  state_code,
  'Direct Sales',
  NOW()
FROM new_analysis
CROSS JOIN (
  -- NEW YORK Q2 2024: Should establish nexus via quarterly lookback
  -- Adding enough to push preceding 4 quarters over $500k and 100 txns
  SELECT '2024-04-15'::DATE + (i || ' days')::INTERVAL AS txn_date,
         6000.00 AS amount,
         'NY' AS state_code
  FROM generate_series(1, 60) AS i

  UNION ALL

  -- CONNECTICUT Oct 2023 - Sep 2024: Should establish nexus
  -- $120k across 220 transactions in the Sept 30 measurement period
  SELECT '2023-10-01'::DATE + (i || ' days')::INTERVAL AS txn_date,
         545.00 AS amount,
         'CT' AS state_code
  FROM generate_series(1, 220) AS i

  UNION ALL

  -- VERMONT Q1 2024: High transaction count, low revenue
  -- 250 transactions @ $300 = $75k (under revenue, over transaction threshold)
  SELECT '2024-01-01'::DATE + (i || ' days')::INTERVAL AS txn_date,
         300.00 AS amount,
         'VT' AS state_code
  FROM generate_series(1, 250) AS i
) AS test_data;

-- Display the analysis ID for use in API call
SELECT
  id AS analysis_id,
  client_company_name,
  'Run: POST /api/v1/analyses/' || id || '/calculate-nexus' AS next_step
FROM analyses
WHERE client_company_name = 'Test - Lookback Periods (NY/VT/CT)'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- After running the calculation, verify results with:
-- ============================================================================
-- SELECT state, year, nexus_type, nexus_date, total_sales, transaction_count
-- FROM state_results
-- WHERE analysis_id = (
--   SELECT id FROM analyses
--   WHERE client_company_name = 'Test - Lookback Periods (NY/VT/CT)'
--   ORDER BY created_at DESC LIMIT 1
-- )
-- ORDER BY state, year;
--
-- Expected:
-- - NY 2024: Nexus (quarterly lookback finds threshold exceeded)
-- - CT 2024: Nexus (Sept 30 period has $120k and 220 txns)
-- - VT 2024: Nexus (250 txns > 200 threshold)
-- ============================================================================

-- ============================================================================
-- To clean up test data:
-- ============================================================================
-- DELETE FROM state_results
-- WHERE analysis_id IN (
--   SELECT id FROM analyses
--   WHERE client_company_name LIKE 'Test - Lookback Periods%'
-- );
--
-- DELETE FROM sales_transactions
-- WHERE analysis_id IN (
--   SELECT id FROM analyses
--   WHERE client_company_name LIKE 'Test - Lookback Periods%'
-- );
--
-- DELETE FROM analyses
-- WHERE client_company_name LIKE 'Test - Lookback Periods%';
-- ============================================================================
