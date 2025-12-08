-- Migration: 037_add_analysis_registered_states.sql
-- Purpose: Add registered_states column to analyses table for standalone analyses
-- This allows quick analyses (not linked to a client) to track state registrations

-- Add registered_states JSONB column to analyses table
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS registered_states TEXT[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN analyses.registered_states IS 'Array of state codes where client is registered. Used for standalone analyses not linked to a client.';
