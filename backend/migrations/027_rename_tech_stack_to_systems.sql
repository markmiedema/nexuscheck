-- ============================================================================
-- Migration: Rename tech_stack to systems to avoid collision
-- ============================================================================
-- Created: 2025-11-22
-- Purpose: The clients table already has a tech_stack JSONB object field
--          from the business profile. The discovery profile also needs a
--          tech stack array. Rename to 'systems' to avoid collision.
-- ============================================================================

-- Rename the discovery profile tech_stack column to systems
ALTER TABLE clients RENAME COLUMN tech_stack TO systems;

-- Update the comment
COMMENT ON COLUMN clients.systems IS 'Technology systems array from Discovery Profile: ["shopify", "woocommerce", "bigcommerce", "amazon", "netsuite", "quickbooks", "xero", "stripe", "other"]';
