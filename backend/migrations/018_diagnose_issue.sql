-- ============================================================================
-- Diagnostic Query: Check what's wrong with the data
-- ============================================================================
-- Run this AFTER adding columns but BEFORE adding constraint

-- First, check if columns exist and have data
SELECT
    COUNT(*) as total_rows,
    COUNT(taxable_amount) as rows_with_taxable,
    COUNT(exempt_amount) as rows_with_exempt,
    SUM(CASE WHEN taxable_amount IS NULL THEN 1 ELSE 0 END) as null_taxable,
    SUM(CASE WHEN exempt_amount IS NULL THEN 1 ELSE 0 END) as null_exempt
FROM sales_transactions;

-- Check for negative values
SELECT
    'Negative sales_amount' as issue,
    COUNT(*) as count
FROM sales_transactions
WHERE sales_amount < 0

UNION ALL

SELECT
    'Negative taxable_amount' as issue,
    COUNT(*) as count
FROM sales_transactions
WHERE taxable_amount < 0

UNION ALL

SELECT
    'Negative exempt_amount' as issue,
    COUNT(*) as count
FROM sales_transactions
WHERE exempt_amount < 0;

-- Check the actual problematic rows (sample)
SELECT
    transaction_id,
    sales_amount,
    taxable_amount,
    exempt_amount,
    (taxable_amount + exempt_amount) as calculated_total,
    (taxable_amount + exempt_amount) - sales_amount as difference,
    CASE
        WHEN sales_amount IS NULL THEN 'sales_amount is NULL'
        WHEN taxable_amount IS NULL THEN 'taxable_amount is NULL'
        WHEN exempt_amount IS NULL THEN 'exempt_amount is NULL'
        WHEN taxable_amount < 0 THEN 'taxable_amount is negative'
        WHEN exempt_amount < 0 THEN 'exempt_amount is negative'
        WHEN sales_amount < 0 THEN 'sales_amount is negative'
        WHEN (taxable_amount + exempt_amount) > (sales_amount + 0.01) THEN 'sum exceeds sales_amount'
        ELSE 'unknown'
    END as issue_type
FROM sales_transactions
WHERE taxable_amount < 0
   OR exempt_amount < 0
   OR sales_amount < 0
   OR (taxable_amount + exempt_amount) > (sales_amount + 0.01)
LIMIT 20;
