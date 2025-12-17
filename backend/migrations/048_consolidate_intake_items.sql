-- ============================================================================
-- Migration 048: Consolidate intake_items to data_request only
-- ============================================================================
-- Created: 2025-12-17
-- Purpose: Clarify data storage responsibilities
--
-- Discovery profile data (business model, physical presence, registrations)
-- is stored in the clients table columns. The intake_items table is now used
-- ONLY for tracking external data requests (sales data, tax returns, etc.)
-- that follow a request -> receive -> validate workflow.
--
-- This migration:
-- 1. Removes duplicate intake_items that mirror client table data
-- 2. Updates the category constraint to only allow 'data_request'
-- ============================================================================

-- Step 1: Delete intake_items that duplicate client table data
-- These categories are now managed via client table columns directly
DELETE FROM intake_items
WHERE category IN ('business_model', 'physical_presence', 'registrations');

-- Step 2: Drop old constraint and add new one
ALTER TABLE intake_items DROP CONSTRAINT IF EXISTS valid_intake_category;

ALTER TABLE intake_items ADD CONSTRAINT valid_intake_category
    CHECK (category = 'data_request');

-- Step 3: Update table comment to reflect new purpose
COMMENT ON TABLE intake_items IS 'Tracks external data requests (sales data, returns, certificates) with request/receive/validate workflow. Discovery profile data is stored in clients table columns.';

COMMENT ON COLUMN intake_items.category IS 'Category of data request. Currently only "data_request" is supported.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
