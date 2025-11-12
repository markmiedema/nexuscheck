-- ============================================================================
-- Add Calculation Metadata Columns to state_results Table
-- ============================================================================
--
-- This migration adds transparency fields to show how interest and penalties
-- are calculated for each state-year result.
--
-- Run this in Supabase SQL Editor.
--
-- ============================================================================

-- Add calculation metadata columns
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS interest_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS days_outstanding INTEGER,
ADD COLUMN IF NOT EXISTS penalty_rate DECIMAL(10, 4);

-- Add comments for documentation
COMMENT ON COLUMN state_results.interest_rate IS 'Annual interest rate as decimal (e.g., 0.085 for 8.5%)';
COMMENT ON COLUMN state_results.interest_method IS 'Calculation method: simple, compound_monthly, or compound_daily';
COMMENT ON COLUMN state_results.days_outstanding IS 'Number of days from obligation start to end of year';
COMMENT ON COLUMN state_results.penalty_rate IS 'Penalty rate as decimal (e.g., 0.20 for 20%)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'state_results'
  AND column_name IN ('interest_rate', 'interest_method', 'days_outstanding', 'penalty_rate')
ORDER BY column_name;

-- Expected output:
-- interest_rate       | numeric    | YES
-- interest_method     | varchar    | YES
-- days_outstanding    | integer    | YES
-- penalty_rate        | numeric    | YES

-- ============================================================================
-- After running this migration:
-- 1. Restart your backend server
-- 2. Re-run the calculation in the frontend
-- 3. The calculation details should now appear
-- ============================================================================
