-- ============================================================================
-- Migration 032: Make reason column optional in physical_nexus table
-- ============================================================================
-- Created: 2025-11-25
-- Purpose: Make reason column nullable since nexus_type now provides categorization
-- ============================================================================

-- Make reason column nullable (it was required before)
ALTER TABLE physical_nexus
ALTER COLUMN reason DROP NOT NULL;

-- Set default to NULL for new records
ALTER TABLE physical_nexus
ALTER COLUMN reason SET DEFAULT NULL;

-- Update comment
COMMENT ON COLUMN physical_nexus.reason IS 'Optional reason/description for physical nexus (deprecated - use nexus_type instead)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
