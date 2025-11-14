-- ============================================================================
-- Migration 019: Allow Negative Exempt Amounts for Returns
-- ============================================================================
-- Purpose: Update the check constraint to allow negative exempt amounts
--          for returns/refunds while maintaining data integrity
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE sales_transactions
  DROP CONSTRAINT IF EXISTS sales_transactions_amounts_valid;

-- Add updated constraint that allows negative exempt amounts for returns
-- Logic:
-- - For positive sales (sales_amount >= 0): exempt_amount must be >= 0
-- - For negative returns (sales_amount < 0): exempt_amount must be <= 0
-- - The absolute sum of taxable + exempt should equal absolute sales_amount
ALTER TABLE sales_transactions
ADD CONSTRAINT sales_transactions_amounts_valid
CHECK (
    -- Constraint 1: Sign consistency
    (
        (sales_amount >= 0 AND exempt_amount >= 0) OR  -- Positive sales have positive exempt
        (sales_amount < 0 AND exempt_amount <= 0)      -- Negative returns have negative exempt
    )
    AND
    -- Constraint 2: Amount validation (with small tolerance for rounding)
    ABS(taxable_amount + exempt_amount) <= ABS(sales_amount) + 0.01
);

-- Verify constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sales_transactions_amounts_valid'
    ) THEN
        RAISE NOTICE 'Constraint sales_transactions_amounts_valid updated successfully';
        RAISE NOTICE 'Now allows negative exempt amounts for returns';
    ELSE
        RAISE EXCEPTION 'Failed to create constraint sales_transactions_amounts_valid';
    END IF;
END $$;
