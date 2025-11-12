-- Migration 007b: Add Late Filing Penalty Bounds and Interest Compounding Frequency
-- Created: 2025-11-02
-- Purpose: Add missing columns for complete interest & penalty data storage
-- Rationale: TX has $50 flat late filing fee, and some states specify compounding frequency

BEGIN;

-- Add late_filing_penalty_min/max columns (same pattern as payment penalties)
ALTER TABLE interest_penalty_rates
ADD COLUMN IF NOT EXISTS late_filing_penalty_min DECIMAL(12,2) DEFAULT NULL
CHECK (late_filing_penalty_min >= 0);

ALTER TABLE interest_penalty_rates
ADD COLUMN IF NOT EXISTS late_filing_penalty_max DECIMAL(12,2) DEFAULT NULL
CHECK (late_filing_penalty_max >= 0);

-- Add constraint to ensure max >= min when both are set
ALTER TABLE interest_penalty_rates
ADD CONSTRAINT valid_late_filing_bounds CHECK (
  late_filing_penalty_max IS NULL OR
  late_filing_penalty_min IS NULL OR
  late_filing_penalty_max >= late_filing_penalty_min
);

-- Add interest_compounding_frequency for clarity (e.g., 'monthly', 'daily', 'annually')
ALTER TABLE interest_penalty_rates
ADD COLUMN IF NOT EXISTS interest_compounding_frequency VARCHAR(20) DEFAULT NULL;

-- Add helpful comments
COMMENT ON COLUMN interest_penalty_rates.late_filing_penalty_min IS
'Minimum late filing penalty in dollars. Used for flat fees or minimum thresholds.';

COMMENT ON COLUMN interest_penalty_rates.late_filing_penalty_max IS
'Maximum late filing penalty in dollars. Used to cap percentage-based penalties.';

COMMENT ON COLUMN interest_penalty_rates.interest_compounding_frequency IS
'How often interest compounds: monthly, daily, annually, or NULL for simple interest.';

COMMIT;

-- VALIDATION:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'interest_penalty_rates'
  AND (column_name LIKE '%filing%' OR column_name LIKE '%compound%')
ORDER BY ordinal_position;
