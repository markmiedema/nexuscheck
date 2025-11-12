-- Migration 006: Add Support for 'compound_annually' Calculation Method
-- Created: 2025-11-02
-- Purpose: Expand interest_calculation_method constraint to support annual compounding
-- Rationale: Research found AZ and NJ use annual compounding, schema must reflect reality

-- WHY THIS CHANGE:
-- Initial schema only supported: 'simple', 'compound_monthly', 'compound_daily'
-- Research revealed Arizona and New Jersey compound interest annually
-- Rather than modify research data, we're expanding the schema to match reality

BEGIN;

-- Drop the existing CHECK constraint
ALTER TABLE interest_penalty_rates
DROP CONSTRAINT IF EXISTS valid_calculation_method;

-- Recreate with expanded options including 'compound_annually'
ALTER TABLE interest_penalty_rates
ADD CONSTRAINT valid_calculation_method CHECK (
  interest_calculation_method IN (
    'simple',
    'compound_monthly',
    'compound_daily',
    'compound_annually'  -- NEW: Added for AZ, NJ
  )
);

-- Update the column comment to reflect new option
COMMENT ON COLUMN interest_penalty_rates.interest_calculation_method IS
'How interest is calculated: simple (no compounding), compound_monthly (monthly compounding), compound_daily (daily compounding), compound_annually (annual compounding)';

COMMIT;

-- VALIDATION:
-- This query should now work without constraint violation:
-- INSERT INTO interest_penalty_rates (state, interest_rate, interest_calculation_method, ...)
-- VALUES ('AZ', 3.00, 'compound_annually', ...);

-- Verify constraint was updated:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'valid_calculation_method';
