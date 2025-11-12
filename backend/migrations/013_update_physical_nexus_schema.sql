-- ============================================================================
-- Migration 013: Update Physical Nexus Schema for Sprint 1
-- ============================================================================
-- Created: 2025-11-11
-- Purpose: Update physical_nexus table to match new API requirements
-- Changes:
--   - Rename 'state' to 'state_code'
--   - Rename 'nexus_type' to 'reason' (text field)
--   - Rename 'established_date' to 'nexus_date'
--   - Remove 'ended_date' and 'still_active' (not needed for MVP)
--   - Add 'registration_date' (optional)
--   - Add 'permit_number' (optional, max 50 chars)
--   - Keep 'notes' field
-- ============================================================================

-- Drop existing physical_nexus table and recreate with new schema
DROP TABLE IF EXISTS physical_nexus CASCADE;

CREATE TABLE physical_nexus (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,

  -- State identification
  state_code CHAR(2) NOT NULL,

  -- Nexus establishment information
  nexus_date DATE NOT NULL,
  reason VARCHAR(255) NOT NULL, -- Why physical nexus exists (office, warehouse, employees, etc.)

  -- Optional registration information
  registration_date DATE, -- When registered with the state
  permit_number VARCHAR(50), -- State tax permit/registration number

  -- Additional notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT physical_nexus_unique_per_analysis UNIQUE (analysis_id, state_code)
);

-- Indexes for performance
CREATE INDEX idx_physical_nexus_analysis ON physical_nexus(analysis_id);
CREATE INDEX idx_physical_nexus_state ON physical_nexus(state_code);
CREATE INDEX idx_physical_nexus_created ON physical_nexus(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE physical_nexus IS 'Tracks physical presence (offices, warehouses, employees) by state for each analysis';
COMMENT ON COLUMN physical_nexus.state_code IS 'Two-letter state code (e.g., CA, NY)';
COMMENT ON COLUMN physical_nexus.nexus_date IS 'Date when physical nexus was established';
COMMENT ON COLUMN physical_nexus.reason IS 'Reason for physical nexus (office, warehouse, employees, etc.)';
COMMENT ON COLUMN physical_nexus.registration_date IS 'Date registered with state (optional)';
COMMENT ON COLUMN physical_nexus.permit_number IS 'State tax permit or registration number (optional)';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE physical_nexus ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own physical nexus records
CREATE POLICY physical_nexus_select_own
  ON physical_nexus
  FOR SELECT
  USING (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only insert their own physical nexus records
CREATE POLICY physical_nexus_insert_own
  ON physical_nexus
  FOR INSERT
  WITH CHECK (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only update their own physical nexus records
CREATE POLICY physical_nexus_update_own
  ON physical_nexus
  FOR UPDATE
  USING (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only delete their own physical nexus records
CREATE POLICY physical_nexus_delete_own
  ON physical_nexus
  FOR DELETE
  USING (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Validation
-- ============================================================================

-- Verify table structure
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'physical_nexus'
    AND column_name IN ('state_code', 'nexus_date', 'reason', 'registration_date', 'permit_number', 'notes');

  IF column_count < 6 THEN
    RAISE EXCEPTION 'Physical nexus table migration incomplete. Expected 6 key columns, found %', column_count;
  END IF;

  RAISE NOTICE 'Physical nexus table migration successful. All columns present.';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
