-- ============================================================================
-- Add Name Fields for Users and Invites
-- ============================================================================
-- Created: 2025-12-09
-- Purpose: Add name tracking for better user identification
-- Phase: 1.4 Platform Foundation (Enhancement)
--
-- This migration:
-- 1. Adds full_name to users table
-- 2. Adds invited_name to organization_members table
-- ============================================================================

-- Add full_name to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add member_name to organization_members table (for both invites and active members)
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);

-- Create index for name searches (optional, for future autocomplete)
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name) WHERE full_name IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- WHAT THIS MIGRATION DOES:
-- 1. Adds full_name column to users table for display names
-- 2. Adds member_name column to organization_members for display names
--
-- ROLLBACK (if needed):
-- ALTER TABLE users DROP COLUMN IF EXISTS full_name;
-- ALTER TABLE organization_members DROP COLUMN IF EXISTS member_name;
-- DROP INDEX IF EXISTS idx_users_full_name;
--
-- ============================================================================
