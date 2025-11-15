-- ============================================================================
-- Migration 021b: Test Data for NY/VT/CT Lookback Period Testing
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Insert test transactions to verify quarterly and Sept 30 lookback logic
--
-- IMPORTANT: This is TEST DATA only. Delete after verification.
-- ============================================================================

-- Create a test analysis
INSERT INTO analyses (
  user_id,
  client_company_name,
  analysis_period_start,
  analysis_period_end,
  created_at
) VALUES (
  (SELECT id FROM users LIMIT 1), -- Use first user, or replace with your user_id
  'Test Business - Lookback Verification',
  '2023-01-01',
  '2024-12-31',
  NOW()
) RETURNING id;

-- Save the analysis_id (you'll need to note this from the output)
-- For the examples below, replace {ANALYSIS_ID} with the actual ID

-- ============================================================================
-- NEW YORK TEST DATA
-- Threshold: $500,000 AND 100 transactions
-- Lookback: Preceding 4 Sales Tax Quarters
-- ============================================================================

-- Scenario: Sales spread across 2023 that establish nexus in Q2 2024
-- Q1 2023: $100k (25 txns)
-- Q2 2023: $150k (30 txns)
-- Q3 2023: $180k (30 txns)
-- Q4 2023: $100k (20 txns)
-- Q1 2024: $50k (10 txns)
--
-- When checking Q2 2024, preceding 4 quarters = Q2'23, Q3'23, Q4'23, Q1'24
-- Total: $150k + $180k + $100k + $50k = $480k (< $500k threshold)
-- Transactions: 30 + 30 + 20 + 10 = 90 (< 100 threshold)
-- Result: NO NEXUS in Q2 2024
--
-- But in Q3 2024, if we add more sales, preceding 4 quarters = Q3'23, Q4'23, Q1'24, Q2'24
-- This demonstrates the rolling nature

-- Replace {ANALYSIS_ID} with actual analysis ID from above
DO $$
DECLARE
  v_analysis_id INTEGER := {ANALYSIS_ID}; -- REPLACE THIS
  v_txn_date DATE;
  v_amount DECIMAL;
  i INTEGER;
BEGIN
  -- Q1 2023: $100k across 25 transactions
  FOR i IN 1..25 LOOP
    v_txn_date := '2023-01-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 4000.00; -- $4k each = $100k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  -- Q2 2023: $150k across 30 transactions
  FOR i IN 1..30 LOOP
    v_txn_date := '2023-04-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 5000.00; -- $5k each = $150k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  -- Q3 2023: $180k across 30 transactions
  FOR i IN 1..30 LOOP
    v_txn_date := '2023-07-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 6000.00; -- $6k each = $180k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  -- Q4 2023: $100k across 20 transactions
  FOR i IN 1..20 LOOP
    v_txn_date := '2023-10-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 5000.00; -- $5k each = $100k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  -- Q1 2024: $50k across 10 transactions
  FOR i IN 1..10 LOOP
    v_txn_date := '2024-01-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 5000.00; -- $5k each = $50k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  -- Q2 2024: $150k across 30 transactions (this pushes over threshold)
  FOR i IN 1..30 LOOP
    v_txn_date := '2024-04-01'::DATE + (i || ' days')::INTERVAL;
    v_amount := 5000.00; -- $5k each = $150k total
    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'NY', 'Direct Sales', NOW()
    );
  END LOOP;

  RAISE NOTICE 'Inserted NY test transactions for analysis %', v_analysis_id;
END $$;

-- ============================================================================
-- CONNECTICUT TEST DATA
-- Threshold: $100,000 AND 200 transactions
-- Lookback: 12-month period ending on September 30
-- ============================================================================

-- Scenario: Sales from Oct 2023 - Sep 2024 that exceed threshold
-- Oct 2023 - Sep 2024: $120k across 220 transactions
-- Both revenue ($120k > $100k) AND transactions (220 > 200) met
-- Result: NEXUS in 2024

DO $$
DECLARE
  v_analysis_id INTEGER := {ANALYSIS_ID}; -- REPLACE THIS
  v_txn_date DATE;
  v_amount DECIMAL;
  i INTEGER;
BEGIN
  -- Spread $120k across 220 transactions from Oct 1, 2023 to Sep 30, 2024
  FOR i IN 1..220 LOOP
    -- Distribute evenly across the 12 months
    v_txn_date := '2023-10-01'::DATE + ((i * 365 / 220)::INTEGER || ' days')::INTERVAL;
    v_amount := 545.45; -- ~$545 each = ~$120k total

    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'CT', 'Direct Sales', NOW()
    );
  END LOOP;

  RAISE NOTICE 'Inserted CT test transactions for analysis %', v_analysis_id;
END $$;

-- ============================================================================
-- VERMONT TEST DATA
-- Threshold: $100,000 OR 200 transactions
-- Lookback: Preceding 4 Calendar Quarters (same as NY)
-- ============================================================================

-- Scenario: High transaction count, low revenue
-- Q1 2024: 250 transactions @ $300 each = $75k
-- Result: Nexus via transaction threshold (250 > 200), even though revenue < $100k

DO $$
DECLARE
  v_analysis_id INTEGER := {ANALYSIS_ID}; -- REPLACE THIS
  v_txn_date DATE;
  v_amount DECIMAL;
  i INTEGER;
BEGIN
  -- Q1 2024: 250 transactions at $300 each
  FOR i IN 1..250 LOOP
    v_txn_date := '2024-01-01'::DATE + ((i * 90 / 250)::INTEGER || ' days')::INTERVAL;
    v_amount := 300.00;

    INSERT INTO sales_transactions (
      analysis_id, transaction_date, sales_amount, taxable_amount,
      exempt_amount, state, revenue_stream, created_at
    ) VALUES (
      v_analysis_id, v_txn_date, v_amount, v_amount,
      0, 'VT', 'Direct Sales', NOW()
    );
  END LOOP;

  RAISE NOTICE 'Inserted VT test transactions for analysis %', v_analysis_id;
END $$;

-- ============================================================================
-- HOW TO USE THIS TEST DATA
-- ============================================================================
--
-- 1. First, create the analysis and note the ID:
--    SELECT id FROM analyses WHERE client_company_name = 'Test Business - Lookback Verification';
--
-- 2. Replace {ANALYSIS_ID} in the three DO blocks above with the actual ID
--
-- 3. Run this migration
--
-- 4. Run the nexus calculation API endpoint:
--    POST /api/v1/analyses/{ANALYSIS_ID}/calculate-nexus
--
-- 5. Check the results:
--    SELECT state, year, nexus_type, nexus_date, total_sales, transaction_count
--    FROM state_results
--    WHERE analysis_id = {ANALYSIS_ID}
--    ORDER BY state, year;
--
-- 6. Expected results:
--    - NY 2023: No nexus (each quarter under threshold)
--    - NY 2024: Nexus in Q3 (when preceding 4 quarters exceed threshold)
--    - CT 2024: Nexus (Oct 2023 - Sep 2024 period exceeds both thresholds)
--    - VT 2024: Nexus (transaction count > 200)
--
-- 7. Clean up test data:
--    DELETE FROM sales_transactions WHERE analysis_id = {ANALYSIS_ID};
--    DELETE FROM state_results WHERE analysis_id = {ANALYSIS_ID};
--    DELETE FROM analyses WHERE id = {ANALYSIS_ID};
-- ============================================================================
