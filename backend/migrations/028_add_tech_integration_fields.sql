-- ============================================================================
-- Migration: Add specific tech integration fields to Discovery Profile
-- ============================================================================
-- Created: 2025-11-22
-- Purpose: Add dedicated ERP, E-commerce, and Tax Engine fields that were
--          previously on the client creation form. These need to be directly
--          on the clients table for Discovery Profile access.
-- ============================================================================

-- ERP System (specific selection, not the systems[] array)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS erp_system VARCHAR(100);
COMMENT ON COLUMN clients.erp_system IS 'ERP/Accounting system: "netsuite", "quickbooks", "xero", "sage", "other"';

-- E-commerce Platform (specific selection)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ecommerce_platform VARCHAR(100);
COMMENT ON COLUMN clients.ecommerce_platform IS 'Primary e-commerce platform: "shopify", "woocommerce", "bigcommerce", "magento", "amazon", "other"';

-- Current Tax Engine
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_engine VARCHAR(100);
COMMENT ON COLUMN clients.tax_engine IS 'Current tax automation: "avalara", "vertex", "taxjar", "anrok", "none"';
