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

-- Step 1: Add columns with proper defaults
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;

ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2) DEFAULT NULL;

ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS exempt_amount DECIMAL(12,2) DEFAULT 0;

-- Step 2: Update ALL rows to set proper values (no WHERE clause to ensure all rows updated)
UPDATE sales_transactions
SET
  exempt_amount = 0,
  taxable_amount = sales_amount;

-- Step 3: Verify all rows are properly set
DO $$
DECLARE
    null_taxable_count INTEGER;
    null_exempt_count INTEGER;
    invalid_count INTEGER;
BEGIN
    -- Check for NULL taxable_amount
    SELECT COUNT(*) INTO null_taxable_count
    FROM sales_transactions
    WHERE taxable_amount IS NULL;

    -- Check for NULL exempt_amount
    SELECT COUNT(*) INTO null_exempt_count
    FROM sales_transactions
    WHERE exempt_amount IS NULL;

    -- Check for constraint violations
    SELECT COUNT(*) INTO invalid_count
    FROM sales_transactions
    WHERE taxable_amount < 0
       OR exempt_amount < 0
       OR (taxable_amount + exempt_amount) > (sales_amount + 0.01);

    -- Report findings
    IF null_taxable_count > 0 THEN
        RAISE EXCEPTION 'Found % rows with NULL taxable_amount', null_taxable_count;
    END IF;

    IF null_exempt_count > 0 THEN
        RAISE EXCEPTION 'Found % rows with NULL exempt_amount', null_exempt_count;
    END IF;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % rows that violate constraint rules', invalid_count;
    END IF;

    RAISE NOTICE 'Data validation passed. All rows have valid values.';
END $$;

-- Step 4: Add check constraint (only if doesn't exist)
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
            (taxable_amount + exempt_amount) <= (sales_amount + 0.01)
        );
        RAISE NOTICE 'Constraint sales_transactions_amounts_valid added successfully';
    ELSE
        RAISE NOTICE 'Constraint sales_transactions_amounts_valid already exists';
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
