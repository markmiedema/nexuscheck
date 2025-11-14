-- ============================================================================
-- Add Exempt Sales Support
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Add columns to track taxable vs exempt sales for accurate liability
--
-- Background:
-- Many industries have tax-exempt sales (groceries, clothing, manufacturing).
-- We need to distinguish:
-- - Gross sales (total revenue) - used for nexus determination
-- - Taxable sales (subject to tax) - used for liability calculation
-- - Exempt sales (not subject to tax) - informational
--
-- Columns:
-- - is_taxable: Boolean flag (simple: Y/N per transaction)
-- - taxable_amount: Dollar amount of taxable portion
-- - exempt_amount: Dollar amount of exempt portion
-- ============================================================================

-- Add columns to sales_transactions table (only if they don't exist)
DO $$
BEGIN
    -- Add is_taxable column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_transactions' AND column_name = 'is_taxable'
    ) THEN
        ALTER TABLE sales_transactions ADD COLUMN is_taxable BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add taxable_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_transactions' AND column_name = 'taxable_amount'
    ) THEN
        ALTER TABLE sales_transactions ADD COLUMN taxable_amount DECIMAL(12,2);
    END IF;

    -- Add exempt_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_transactions' AND column_name = 'exempt_amount'
    ) THEN
        ALTER TABLE sales_transactions ADD COLUMN exempt_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- Backfill exempt_amount first (ensure it's 0 for all existing records)
UPDATE sales_transactions
SET exempt_amount = COALESCE(exempt_amount, 0);

-- Backfill taxable_amount for existing records (assume all sales are taxable)
UPDATE sales_transactions
SET taxable_amount = COALESCE(taxable_amount, sales_amount);

-- Verify data before adding constraint (find problematic rows)
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM sales_transactions
    WHERE taxable_amount < 0
       OR exempt_amount < 0
       OR (taxable_amount + exempt_amount) > (sales_amount + 0.01);

    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % rows that violate the constraint. Details:', invalid_count;
        RAISE NOTICE 'Run this query to see problematic rows:';
        RAISE NOTICE 'SELECT transaction_id, sales_amount, taxable_amount, exempt_amount, (taxable_amount + exempt_amount) as total FROM sales_transactions WHERE taxable_amount < 0 OR exempt_amount < 0 OR (taxable_amount + exempt_amount) > (sales_amount + 0.01);';
        RAISE EXCEPTION 'Cannot add constraint: % rows violate the constraint', invalid_count;
    END IF;
END $$;

-- Add check constraint: taxable_amount + exempt_amount should not exceed sales_amount
-- Only add if constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sales_transactions_amounts_valid'
    ) THEN
        ALTER TABLE sales_transactions
        ADD CONSTRAINT sales_transactions_amounts_valid
        CHECK (
            taxable_amount >= 0 AND
            exempt_amount >= 0 AND
            (taxable_amount + exempt_amount) <= (sales_amount + 0.01)  -- Allow 1 cent rounding
        );
    END IF;
END $$;

-- Add columns to state_results table for reporting
ALTER TABLE state_results
  ADD COLUMN IF NOT EXISTS gross_sales DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS exempt_sales DECIMAL(12,2) DEFAULT 0;

-- Backfill gross_sales (same as total_sales for existing records)
UPDATE state_results
SET gross_sales = total_sales
WHERE gross_sales IS NULL;

-- Add comments
COMMENT ON COLUMN sales_transactions.is_taxable IS
'Boolean flag indicating if transaction is subject to sales tax. Defaults to true if not specified.';

COMMENT ON COLUMN sales_transactions.taxable_amount IS
'Dollar amount of the transaction that is subject to sales tax. May be less than sales_amount if partial exemption.';

COMMENT ON COLUMN sales_transactions.exempt_amount IS
'Dollar amount of the transaction that is exempt from sales tax (e.g., groceries, clothing under threshold).';

COMMENT ON COLUMN state_results.gross_sales IS
'Total sales to the state (all transactions). Used for economic nexus threshold determination.';

COMMENT ON COLUMN state_results.exempt_sales IS
'Sales that are exempt from taxation. Informational only, not included in liability calculation.';

-- Verify the update
SELECT
  'sales_transactions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sales_transactions'
  AND column_name IN ('is_taxable', 'taxable_amount', 'exempt_amount')
ORDER BY ordinal_position;

SELECT
  'state_results' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'state_results'
  AND column_name IN ('gross_sales', 'exempt_sales')
ORDER BY ordinal_position;
