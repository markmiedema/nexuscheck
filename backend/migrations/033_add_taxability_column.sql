-- Migration: Add taxability column to sales_transactions
-- Codes: T (Taxable), NT (Non-Taxable), E (Exempt), EC (Exempt w/ Certificate), P (Partial)

ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS taxability VARCHAR(2) DEFAULT 'T';

-- Add check constraint for valid codes
ALTER TABLE sales_transactions
ADD CONSTRAINT valid_taxability_code
CHECK (taxability IN ('T', 'NT', 'E', 'EC', 'P'));

-- Note: Constraint that P (partial) requires exempt_amount > 0 is enforced at application level
-- since CHECK constraints can't easily reference dynamic conditions with other columns

COMMENT ON COLUMN sales_transactions.taxability IS 'Taxability code: T=Taxable, NT=Non-Taxable, E=Exempt, EC=Exempt w/ Certificate, P=Partial';
