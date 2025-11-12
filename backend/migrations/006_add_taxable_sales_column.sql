-- ============================================================================
-- Add taxable_sales column to state_results
-- ============================================================================
-- Created: 2025-11-04
-- Purpose: Track which sales are taxable (exclude marketplace when applicable)
-- ============================================================================

-- Add taxable_sales column
ALTER TABLE state_results ADD COLUMN taxable_sales DECIMAL(12,2);

-- Backfill existing data (assume all sales were taxable before this fix)
UPDATE state_results
SET taxable_sales = total_sales
WHERE taxable_sales IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE state_results ALTER COLUMN taxable_sales SET NOT NULL;

-- Add comment
COMMENT ON COLUMN state_results.taxable_sales IS
'Sales subject to tax liability. Excludes marketplace sales when state has MF law.';
