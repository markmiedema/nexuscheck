-- Migration 023: Add Data Validation Constraints
-- Created: 2025-01-14
-- Purpose: Add CHECK constraints to ensure data integrity
--
-- Addresses audit findings:
-- - Prevent invalid data (exempt_amount > sales_amount)
-- - Ensure taxable_amount is correctly calculated
-- - Ensure gross_sales >= taxable_sales in state_results

-- ============================================================================
-- 1. Validate sales_transactions data before adding constraints
-- ============================================================================

-- Check for any violations that would prevent constraint addition
DO $$
DECLARE
    v_invalid_exempt_count INTEGER;
    v_invalid_taxable_count INTEGER;
BEGIN
    -- Check for negative sales amounts
    SELECT COUNT(*) INTO v_invalid_exempt_count
    FROM sales_transactions
    WHERE sales_amount < 0 AND exempt_amount IS NOT NULL AND exempt_amount != 0;

    IF v_invalid_exempt_count > 0 THEN
        RAISE NOTICE 'Found % transactions with negative sales_amount and non-zero exempt_amount', v_invalid_exempt_count;
    END IF;

    -- Check for taxable_amount mismatches
    SELECT COUNT(*) INTO v_invalid_taxable_count
    FROM sales_transactions
    WHERE taxable_amount IS NOT NULL
      AND ABS(taxable_amount - (sales_amount - COALESCE(exempt_amount, 0))) > 0.01;  -- Allow 1 cent rounding

    IF v_invalid_taxable_count > 0 THEN
        RAISE NOTICE 'Found % transactions where taxable_amount != sales_amount - exempt_amount', v_invalid_taxable_count;
        RAISE NOTICE 'These will be auto-corrected before adding constraint';
    END IF;
END $$;

-- ============================================================================
-- 2. Fix any invalid data in sales_transactions
-- ============================================================================

-- Recalculate taxable_amount for any mismatched rows
UPDATE sales_transactions
SET taxable_amount = sales_amount - COALESCE(exempt_amount, 0)
WHERE taxable_amount IS NOT NULL
  AND ABS(taxable_amount - (sales_amount - COALESCE(exempt_amount, 0))) > 0.01;

-- ============================================================================
-- 3. Add constraints to sales_transactions
-- ============================================================================

-- Ensure taxable_amount is correctly calculated
-- Note: Allows NULL taxable_amount (for legacy data)
ALTER TABLE sales_transactions
ADD CONSTRAINT valid_taxable_amount
CHECK (
  taxable_amount IS NULL
  OR
  ABS(taxable_amount - (sales_amount - COALESCE(exempt_amount, 0))) <= 0.01
);

-- Ensure exempt_amount doesn't exceed sales_amount (except for refunds)
-- Allow negative values for both (refunds) but ensure relationship holds
ALTER TABLE sales_transactions
ADD CONSTRAINT valid_exempt_amount
CHECK (
  exempt_amount IS NULL
  OR
  (sales_amount >= 0 AND exempt_amount <= sales_amount)
  OR
  (sales_amount < 0 AND exempt_amount >= sales_amount)  -- Refund case
);

-- ============================================================================
-- 4. Validate state_results data before adding constraints
-- ============================================================================

DO $$
DECLARE
    v_invalid_sales_count INTEGER;
BEGIN
    -- Check for gross_sales < taxable_sales violations
    SELECT COUNT(*) INTO v_invalid_sales_count
    FROM state_results
    WHERE total_sales IS NOT NULL
      AND taxable_sales IS NOT NULL
      AND total_sales < taxable_sales - 0.01;  -- Allow 1 cent rounding

    IF v_invalid_sales_count > 0 THEN
        RAISE NOTICE 'Found % state results where total_sales < taxable_sales', v_invalid_sales_count;
        RAISE NOTICE 'These will be auto-corrected before adding constraint';
    END IF;
END $$;

-- ============================================================================
-- 5. Fix any invalid data in state_results
-- ============================================================================

-- Set taxable_sales = total_sales for any violations
-- (Assumes the total is correct and taxable was miscalculated)
UPDATE state_results
SET taxable_sales = total_sales
WHERE total_sales IS NOT NULL
  AND taxable_sales IS NOT NULL
  AND total_sales < taxable_sales - 0.01;

-- ============================================================================
-- 6. Add constraints to state_results
-- ============================================================================

-- Ensure total_sales (gross_sales) >= taxable_sales
-- Note: Both can be NULL, constraint only applies when both are set
ALTER TABLE state_results
ADD CONSTRAINT valid_sales_breakdown
CHECK (
  total_sales IS NULL
  OR taxable_sales IS NULL
  OR total_sales >= taxable_sales - 0.01  -- Allow 1 cent rounding difference
);

-- Ensure exempt_sales is non-negative (when set)
ALTER TABLE state_results
ADD CONSTRAINT valid_exempt_sales
CHECK (
  exempt_sales IS NULL
  OR exempt_sales >= 0
);

-- Ensure exposure_sales doesn't exceed taxable_sales
-- (exposure_sales is taxable sales during obligation period)
ALTER TABLE state_results
ADD CONSTRAINT valid_exposure_sales
CHECK (
  exposure_sales IS NULL
  OR taxable_sales IS NULL
  OR exposure_sales <= taxable_sales + 0.01  -- Allow 1 cent rounding
);

-- ============================================================================
-- 7. Verify constraints were added
-- ============================================================================

DO $$
DECLARE
    v_constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_constraint_count
    FROM information_schema.table_constraints
    WHERE table_name IN ('sales_transactions', 'state_results')
      AND constraint_type = 'CHECK'
      AND constraint_name IN (
        'valid_taxable_amount',
        'valid_exempt_amount',
        'valid_sales_breakdown',
        'valid_exempt_sales',
        'valid_exposure_sales'
      );

    IF v_constraint_count = 5 THEN
        RAISE NOTICE 'SUCCESS: All 5 data validation constraints added';
    ELSE
        RAISE EXCEPTION 'FAILED: Expected 5 constraints, found %', v_constraint_count;
    END IF;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================
-- Added 5 CHECK constraints:
-- 1. sales_transactions.valid_taxable_amount - Ensures taxable = sales - exempt
-- 2. sales_transactions.valid_exempt_amount - Ensures exempt <= sales
-- 3. state_results.valid_sales_breakdown - Ensures total >= taxable
-- 4. state_results.valid_exempt_sales - Ensures exempt >= 0
-- 5. state_results.valid_exposure_sales - Ensures exposure <= taxable
--
-- These constraints prevent invalid data from being inserted and ensure
-- calculation integrity at the database level.
