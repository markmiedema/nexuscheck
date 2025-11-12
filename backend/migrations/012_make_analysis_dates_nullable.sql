-- Migration 012: Make analysis period dates nullable for auto-detection
-- Created: 2025-11-07
-- Purpose: Allow NULL dates that will be auto-populated from CSV upload

-- Allow NULL for analysis_period_start and analysis_period_end
-- These will be auto-populated from CSV upload if not provided

ALTER TABLE analyses
ALTER COLUMN analysis_period_start DROP NOT NULL;

ALTER TABLE analyses
ALTER COLUMN analysis_period_end DROP NOT NULL;

-- Update the check constraint to only apply when both dates exist
ALTER TABLE analyses
DROP CONSTRAINT IF EXISTS valid_period;

ALTER TABLE analyses
ADD CONSTRAINT valid_period CHECK (
  (analysis_period_start IS NULL AND analysis_period_end IS NULL) OR
  (analysis_period_start IS NOT NULL AND analysis_period_end IS NOT NULL AND analysis_period_end > analysis_period_start)
);

-- Add comments explaining the nullable dates
COMMENT ON COLUMN analyses.analysis_period_start IS 'Start date of analysis period. Can be NULL initially and will be auto-detected from CSV upload.';
COMMENT ON COLUMN analyses.analysis_period_end IS 'End date of analysis period. Can be NULL initially and will be auto-detected from CSV upload.';
