-- Migration 004b: Allow Negative Local Rates
-- Created: 2025-11-02
-- Purpose: Allow negative avg_local_rate values in tax_rates table
-- Rationale: Some states (e.g., NJ) have Urban Enterprise Zones that provide
--            sales tax reductions, resulting in negative average local rates

-- WHY THIS CHANGE:
-- New Jersey has avg_local_rate = -0.0002 (-0.02%) due to Urban Enterprise Zones
-- The original constraint blocked negative values, but this is legitimate data
-- Schema must adapt to accommodate real-world tax structures

BEGIN;

-- Drop the existing CHECK constraint on avg_local_rate
ALTER TABLE tax_rates
DROP CONSTRAINT IF EXISTS valid_local_rates;

-- Recreate without the >= 0 restriction on avg_local_rate
-- (state_rate should still be >= 0, but avg_local_rate can be negative)
ALTER TABLE tax_rates
ADD CONSTRAINT valid_local_rates CHECK (
  state_rate >= 0 AND state_rate <= 1 AND
  avg_local_rate >= -1 AND avg_local_rate <= 1  -- Allow negative, but reasonable bounds
);

-- Update column comment to explain negative values
COMMENT ON COLUMN tax_rates.avg_local_rate IS
'Average local tax rate. Can be negative due to tax reduction zones (e.g., Urban Enterprise Zones in NJ).';

COMMIT;

-- VALIDATION:
-- This insert should now work:
-- INSERT INTO tax_rates (state, state_rate, avg_local_rate, effective_from)
-- VALUES ('NJ', 0.06625, -0.0002, '2025-01-01');
