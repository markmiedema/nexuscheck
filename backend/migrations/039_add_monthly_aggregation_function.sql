-- Migration 039: Add Monthly Aggregation Function for State Detail Endpoint
-- Created: 2025-12-09
-- Purpose: Move monthly aggregation from Python to SQL for better performance
--
-- This function aggregates transactions by month for a given analysis and state,
-- eliminating Python loops that were iterating through all transactions.

-- ============================================================================
-- Create function for monthly sales aggregation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_sales_aggregates(
    p_analysis_id UUID,
    p_state_code CHAR(2)
)
RETURNS TABLE (
    year INTEGER,
    month TEXT,
    month_num INTEGER,
    total_sales NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(YEAR FROM st.transaction_date)::INTEGER AS year,
        TO_CHAR(st.transaction_date, 'YYYY-MM') AS month,
        EXTRACT(MONTH FROM st.transaction_date)::INTEGER AS month_num,
        COALESCE(SUM(st.sales_amount), 0) AS total_sales,
        COUNT(*) AS transaction_count
    FROM sales_transactions st
    WHERE st.analysis_id = p_analysis_id
      AND st.customer_state = p_state_code
    GROUP BY
        EXTRACT(YEAR FROM st.transaction_date),
        EXTRACT(MONTH FROM st.transaction_date),
        TO_CHAR(st.transaction_date, 'YYYY-MM')
    ORDER BY year, month_num;
END;
$$;

-- ============================================================================
-- Add helpful comment
-- ============================================================================

COMMENT ON FUNCTION get_monthly_sales_aggregates IS
'Aggregates sales transactions by month for a given analysis and state.
Used by state detail endpoint to avoid Python-level aggregation loops.
Returns: year, month (YYYY-MM), month_num, total_sales, transaction_count';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    v_func_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc
        WHERE proname = 'get_monthly_sales_aggregates'
    ) INTO v_func_exists;

    IF v_func_exists THEN
        RAISE NOTICE 'SUCCESS: get_monthly_sales_aggregates function created';
    ELSE
        RAISE EXCEPTION 'FAILED: get_monthly_sales_aggregates function was not created';
    END IF;
END $$;

-- ============================================================================
-- Example usage
-- ============================================================================
/*
-- Call from Supabase client:
result = supabase.rpc('get_monthly_sales_aggregates', {
    'p_analysis_id': 'uuid-here',
    'p_state_code': 'CA'
}).execute()

-- Returns:
-- [
--   {"year": 2023, "month": "2023-01", "month_num": 1, "total_sales": 15000.00, "transaction_count": 45},
--   {"year": 2023, "month": "2023-02", "month_num": 2, "total_sales": 18500.00, "transaction_count": 52},
--   ...
-- ]
*/
