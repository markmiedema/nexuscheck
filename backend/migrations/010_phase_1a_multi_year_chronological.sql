-- ============================================================================
-- PHASE 1A: Multi-Year Tracking & Chronological Processing
-- ============================================================================
-- Created: 2025-11-05
-- Purpose: Enable accurate nexus dating with multi-year tracking and
--          state-specific lookback periods
-- Implements: Phase 1A from nexus_calculation_implementation_plan.md
-- ============================================================================

-- Add lookback period to economic_nexus_thresholds
-- ============================================================================
ALTER TABLE economic_nexus_thresholds
ADD COLUMN IF NOT EXISTS lookback_period VARCHAR(100);

COMMENT ON COLUMN economic_nexus_thresholds.lookback_period IS
'How the state measures the threshold period. Examples:
- "Current or Previous Calendar Year" (most common)
- "Previous Calendar Year"
- "Preceding 12 calendar months"
- "Preceding 4 Sales Tax Quarters"
- "12-month period ending on September 30"';


-- Add multi-year tracking to state_results
-- ============================================================================

-- Add year column for multi-year results
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS year INTEGER;

COMMENT ON COLUMN state_results.year IS
'Calendar year for this result. Allows tracking nexus across multiple years.';

-- Add actual nexus date (not "today")
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS nexus_date DATE;

COMMENT ON COLUMN state_results.nexus_date IS
'Exact date when economic nexus threshold was crossed.
NULL if no nexus in this year.';

-- Add obligation start date
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS obligation_start_date DATE;

COMMENT ON COLUMN state_results.obligation_start_date IS
'Date when collection obligation begins. Typically first day of month
following nexus establishment. NULL if no nexus.';

-- Add first nexus year for sticky nexus logic
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS first_nexus_year INTEGER;

COMMENT ON COLUMN state_results.first_nexus_year IS
'Year when nexus was first established in this state. Used for sticky nexus
logic - once nexus is established, it continues in subsequent years.';


-- Update constraints for multi-year support
-- ============================================================================

-- Drop old unique constraint (analysis + state only)
ALTER TABLE state_results
DROP CONSTRAINT IF EXISTS unique_analysis_state;

-- Add new unique constraint (analysis + state + year)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_analysis_state_year'
    ) THEN
        ALTER TABLE state_results
        ADD CONSTRAINT unique_analysis_state_year
        UNIQUE (analysis_id, state, year);
    END IF;
END $$;

COMMENT ON CONSTRAINT unique_analysis_state_year ON state_results IS
'Ensures one result per state per year per analysis. Supports multi-year tracking.';


-- Create indexes for performance
-- ============================================================================

-- Index for multi-year queries
CREATE INDEX IF NOT EXISTS idx_state_results_analysis_year
ON state_results(analysis_id, year);

-- Index for nexus date queries
CREATE INDEX IF NOT EXISTS idx_state_results_nexus_date
ON state_results(nexus_date) WHERE nexus_date IS NOT NULL;

-- Index for first nexus year (sticky nexus queries)
CREATE INDEX IF NOT EXISTS idx_state_results_first_nexus_year
ON state_results(first_nexus_year) WHERE first_nexus_year IS NOT NULL;


-- Backfill existing data
-- ============================================================================

-- For existing records, set year to current year if NULL
-- (This preserves existing data during migration)
UPDATE state_results
SET year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE year IS NULL;

-- Note: nexus_date, obligation_start_date, and first_nexus_year will be NULL
-- for existing records. They will be calculated correctly on next analysis run.


-- Add marketplace facilitator effective dates (for future Phase 3)
-- ============================================================================
ALTER TABLE marketplace_facilitator_rules
ADD COLUMN IF NOT EXISTS effective_from DATE;

COMMENT ON COLUMN marketplace_facilitator_rules.effective_from IS
'Date when marketplace facilitator law became effective in this state.
Will be used in Phase 3 for pre-law marketplace scenarios.';


-- ============================================================================
-- End of migration
-- ============================================================================
