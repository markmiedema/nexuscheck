-- ============================================================================
-- ROLLBACK: Remove Exempt Sales Support
-- ============================================================================
-- Run this first to clean up any partial migration attempts

-- Drop constraint if it exists
ALTER TABLE sales_transactions
  DROP CONSTRAINT IF EXISTS sales_transactions_amounts_valid;

-- Drop columns from sales_transactions
ALTER TABLE sales_transactions
  DROP COLUMN IF EXISTS is_taxable,
  DROP COLUMN IF EXISTS taxable_amount,
  DROP COLUMN IF EXISTS exempt_amount;

-- Drop columns from state_results
ALTER TABLE state_results
  DROP COLUMN IF EXISTS gross_sales,
  DROP COLUMN IF EXISTS exempt_sales;

-- Verify cleanup
SELECT 'Rollback complete. Columns removed.' as status;
