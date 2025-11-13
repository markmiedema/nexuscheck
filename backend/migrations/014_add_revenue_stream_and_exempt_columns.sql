-- ============================================================================
-- Migration 014: Add revenue_stream and exempt sales columns
-- ============================================================================
-- Purpose: Support revenue stream tracking and exempt sales handling
-- Part of Sprint 1, Days 6-8: Enhanced CSV + Exempt Sales
-- Created: 2025-11-13
-- ============================================================================

-- Add revenue_stream column to sales_transactions
-- This tracks the type of product/service being sold (e.g., "food", "clothing", "services")
-- Useful for determining taxability rules and categorizing sales
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS revenue_stream VARCHAR(100);

-- Add exempt sales columns to sales_transactions
-- These support flexible handling of taxable vs. non-taxable sales
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS exempt_amount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2);

-- Update existing records to set taxable_amount = sales_amount for backwards compatibility
UPDATE sales_transactions
SET taxable_amount = sales_amount
WHERE taxable_amount IS NULL;

-- Add exempt sales summary columns to state_results
-- These provide aggregated view of gross vs. taxable sales per state
ALTER TABLE state_results
  ADD COLUMN IF NOT EXISTS gross_sales DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS taxable_sales DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS exempt_sales DECIMAL(15,2);

-- Create index on revenue_stream for efficient filtering/grouping
CREATE INDEX IF NOT EXISTS idx_sales_transactions_revenue_stream
  ON sales_transactions(revenue_stream);

-- Create index on is_taxable for efficient filtering
CREATE INDEX IF NOT EXISTS idx_sales_transactions_is_taxable
  ON sales_transactions(is_taxable);

-- Add helpful comments
COMMENT ON COLUMN sales_transactions.revenue_stream IS
  'Category of product/service sold (e.g., food, clothing, services). Used for taxability determination and reporting.';

COMMENT ON COLUMN sales_transactions.is_taxable IS
  'Boolean flag: Is this transaction subject to sales tax? FALSE for exempt sales.';

COMMENT ON COLUMN sales_transactions.exempt_amount IS
  'Dollar amount exempt from tax. For partial exemptions (e.g., $100 sale with $30 exempt = $70 taxable).';

COMMENT ON COLUMN sales_transactions.taxable_amount IS
  'Amount subject to sales tax. Calculated as sales_amount - exempt_amount, or based on is_taxable flag.';

COMMENT ON COLUMN state_results.gross_sales IS
  'Total sales including both taxable and exempt (used for nexus determination).';

COMMENT ON COLUMN state_results.taxable_sales IS
  'Sales subject to tax only (used for liability calculation).';

COMMENT ON COLUMN state_results.exempt_sales IS
  'Sales not subject to tax (gross_sales - taxable_sales).';

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
--
-- Revenue Stream Usage:
-- - Optional column that users can include in their CSV uploads
-- - Common values: "food", "clothing", "services", "digital_goods", "manufacturing_equipment"
-- - Can be used for categorizing sales and determining default taxability rules
-- - Will be linked to exempt sales logic in future enhancements
--
-- Exempt Sales Logic:
-- - Gross sales (sales_amount) used for nexus determination
-- - Taxable sales (taxable_amount) used for liability calculation
-- - Three ways to specify exempt sales in CSV:
--   1. is_taxable column (boolean Y/N)
--   2. exempt_amount column (dollar value)
--   3. Both (exempt_amount takes precedence)
-- - If neither column present, all sales treated as taxable (default)
--
-- ============================================================================
