-- ============================================================================
-- Migration 030: Add nexus_type column to physical_nexus table
-- ============================================================================
-- Created: 2025-11-25
-- Purpose: Add explicit nexus type field to categorize physical nexus
-- Changes:
--   - Add 'nexus_type' column with valid types: remote_employee, inventory_3pl, office, other
--   - Default to 'other' for backwards compatibility with existing records
-- ============================================================================

-- Add the nexus_type column
ALTER TABLE physical_nexus
ADD COLUMN IF NOT EXISTS nexus_type VARCHAR(20) DEFAULT 'other';

-- Add a check constraint to ensure valid values
ALTER TABLE physical_nexus
ADD CONSTRAINT physical_nexus_type_check
CHECK (nexus_type IN ('remote_employee', 'inventory_3pl', 'office', 'other'));

-- Update column comment
COMMENT ON COLUMN physical_nexus.nexus_type IS 'Type of physical nexus: remote_employee, inventory_3pl, office, or other';

-- ============================================================================
-- Validation
-- ============================================================================

-- Verify column was added
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'physical_nexus'
      AND column_name = 'nexus_type'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'nexus_type column was not added to physical_nexus table';
  END IF;

  RAISE NOTICE 'Migration 030 successful: nexus_type column added to physical_nexus table';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
