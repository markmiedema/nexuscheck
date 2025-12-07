-- ============================================================================
-- Migration 036: Add Penalty Breakdown Column to State Results
-- ============================================================================
-- Created: 2025-12-07
-- Purpose: Add JSONB column to store detailed penalty breakdown from the new
--          penalty/interest calculation system
--
-- The penalty_breakdown column stores:
-- {
--   "late_filing": 100.00,
--   "late_payment": 50.00,
--   "negligence": null,
--   "e_filing_failure": null,
--   "fraud": null,
--   "operating_without_permit": null,
--   "late_registration": null,
--   "unregistered_business": null,
--   "cost_of_collection": null,
--   "extended_delinquency": null,
--   "total": 150.00
-- }
-- ============================================================================

BEGIN;

-- Add penalty_breakdown column as JSONB
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS penalty_breakdown JSONB;

-- Add comment for documentation
COMMENT ON COLUMN state_results.penalty_breakdown IS
'Detailed breakdown of penalties by type (late_filing, late_payment, negligence, etc.).
Calculated by PenaltyInterestCalculator from state_penalty_interest_configs.';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'state_results' AND column_name = 'penalty_breakdown';
-- ============================================================================
