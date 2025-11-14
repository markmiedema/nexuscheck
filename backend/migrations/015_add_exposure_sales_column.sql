-- ============================================================================
-- Add exposure_sales column to state_results
-- ============================================================================
-- Created: 2025-01-13
-- Purpose: Distinguish between taxable_sales (for nexus determination) and
--          exposure_sales (for liability calculation)
--
-- Background:
-- - taxable_sales = All taxable sales for the year (used to check if nexus threshold crossed)
-- - exposure_sales = Taxable sales during obligation period (used to calculate tax liability)
--
-- Example:
-- - Company has $150K taxable sales in 2023
-- - Economic nexus triggered on July 1, 2023 (obligation starts July 1)
-- - Only $75K in taxable sales occurred July-Dec (exposure period)
-- - taxable_sales = $150K (crossed threshold)
-- - exposure_sales = $75K (owes tax on this amount)
-- ============================================================================

-- Add exposure_sales column
ALTER TABLE state_results ADD COLUMN exposure_sales DECIMAL(12,2);

-- Backfill existing data
-- For existing data, we'll assume exposure_sales equals taxable_sales as a conservative estimate
-- Users should re-run calculations to get accurate exposure_sales values
UPDATE state_results
SET exposure_sales = taxable_sales
WHERE exposure_sales IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE state_results ALTER COLUMN exposure_sales SET NOT NULL;

-- Add comment
COMMENT ON COLUMN state_results.exposure_sales IS
'Taxable sales during the obligation period (on or after obligation_start_date). Used to calculate tax liability. This may be less than taxable_sales if nexus was triggered mid-year.';

-- Update the taxable_sales comment for clarity
COMMENT ON COLUMN state_results.taxable_sales IS
'All taxable sales for the year. Used to determine if economic nexus threshold is crossed. May include pre-obligation sales.';
