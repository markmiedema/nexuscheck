-- ============================================================================
-- Migration 031: Add office/physical location fields to clients table
-- ============================================================================
-- Created: 2025-11-25
-- Purpose: Add fields for tracking physical office locations that create nexus
-- ============================================================================

-- Add columns for office/physical location tracking
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS has_office BOOLEAN DEFAULT false;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS office_states JSONB DEFAULT '[]'::jsonb;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS office_state_dates JSONB DEFAULT '{}'::jsonb;

-- Comments
COMMENT ON COLUMN clients.has_office IS 'Whether client has physical office locations (triggers physical nexus)';
COMMENT ON COLUMN clients.office_states IS 'Array of state codes where offices/physical locations exist';
COMMENT ON COLUMN clients.office_state_dates IS 'Map of state code to establishment date for offices, e.g. {"CA": "2020-01-01"}';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
