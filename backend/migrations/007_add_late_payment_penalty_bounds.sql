-- Migration 007: Add Min/Max Bounds for Late Payment Penalties
-- Created: 2025-11-02
-- Purpose: Support flat fee and capped late payment penalties
-- Rationale: Some states use flat fees or caps for late payment penalties (not just percentages)

-- WHY THIS CHANGE:
-- Current schema has min/max for filing and registration penalties, but not payment penalties
-- For consistency and to support flat fees, adding late_payment_penalty_min and late_payment_penalty_max
-- Example: A state might have "$25 or 10%, whichever is greater" → min=$25, rate=10%

BEGIN;

-- Add late_payment_penalty_min column
ALTER TABLE interest_penalty_rates
ADD COLUMN IF NOT EXISTS late_payment_penalty_min DECIMAL(12,2) DEFAULT NULL
CHECK (late_payment_penalty_min >= 0);

-- Add late_payment_penalty_max column
ALTER TABLE interest_penalty_rates
ADD COLUMN IF NOT EXISTS late_payment_penalty_max DECIMAL(12,2) DEFAULT NULL
CHECK (late_payment_penalty_max >= 0);

-- Add constraint to ensure max >= min when both are set
ALTER TABLE interest_penalty_rates
ADD CONSTRAINT valid_late_payment_bounds CHECK (
  late_payment_penalty_max IS NULL OR
  late_payment_penalty_min IS NULL OR
  late_payment_penalty_max >= late_payment_penalty_min
);

-- Add helpful comments
COMMENT ON COLUMN interest_penalty_rates.late_payment_penalty_min IS
'Minimum late payment penalty in dollars. Used for flat fees or minimum thresholds.';

COMMENT ON COLUMN interest_penalty_rates.late_payment_penalty_max IS
'Maximum late payment penalty in dollars. Used to cap percentage-based penalties.';

COMMIT;

-- USAGE EXAMPLES:
-- 1. Flat fee only: min=$50, max=$50, rate=NULL
-- 2. Percentage only: rate=10%, min=NULL, max=NULL
-- 3. Percentage with cap: rate=10%, max=$5000
-- 4. Greater of flat or percentage: min=$25, rate=5%

-- VALIDATION:
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interest_penalty_rates'
  AND column_name LIKE '%late_payment%'
ORDER BY ordinal_position;
