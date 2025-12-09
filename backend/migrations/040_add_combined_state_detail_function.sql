-- Migration 040: Combined State Detail RPC Function
-- Created: 2025-12-09
-- Purpose: Single database call for all state detail data (7 queries → 1)
--
-- Performance impact:
-- - Before: 7 parallel HTTP round-trips to Supabase (~300-570ms)
-- - After: 1 HTTP round-trip (~100-150ms expected)
--
-- This function combines all data needed by the state detail endpoint:
-- 1. State info (name, URLs)
-- 2. State results (year-by-year)
-- 3. Transactions (limited to 500)
-- 4. Aggregated totals
-- 5. Monthly aggregates
-- 6. Thresholds
-- 7. Tax rates

-- ============================================================================
-- Create combined state detail function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_state_detail_complete(
    p_analysis_id UUID,
    p_state_code CHAR(2),
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_analysis_exists BOOLEAN;
BEGIN
    -- Security check: Verify analysis belongs to user
    SELECT EXISTS(
        SELECT 1 FROM analyses
        WHERE id = p_analysis_id AND user_id = p_user_id
    ) INTO v_analysis_exists;

    IF NOT v_analysis_exists THEN
        RETURN json_build_object(
            'error', 'not_found',
            'message', 'Analysis not found or access denied'
        );
    END IF;

    -- Build complete response in single query
    SELECT json_build_object(
        -- State info
        'state_info', (
            SELECT json_build_object(
                'code', s.code,
                'name', s.name,
                'registration_url', s.registration_url,
                'state_tax_website', s.state_tax_website
            )
            FROM states s
            WHERE s.code = p_state_code
        ),

        -- State results (year-by-year data)
        'state_results', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', sr.id,
                    'state', sr.state,
                    'year', sr.year,
                    'nexus_type', sr.nexus_type,
                    'nexus_date', sr.nexus_date,
                    'obligation_start_date', sr.obligation_start_date,
                    'first_nexus_year', sr.first_nexus_year,
                    'approaching_threshold', sr.approaching_threshold,
                    'total_sales', sr.total_sales,
                    'direct_sales', sr.direct_sales,
                    'marketplace_sales', sr.marketplace_sales,
                    'taxable_sales', sr.taxable_sales,
                    'exempt_sales', sr.exempt_sales,
                    'exposure_sales', sr.exposure_sales,
                    'transaction_count', sr.transaction_count,
                    'threshold', sr.threshold,
                    'estimated_liability', sr.estimated_liability,
                    'base_tax', sr.base_tax,
                    'interest', sr.interest,
                    'penalties', sr.penalties,
                    'penalty_breakdown', sr.penalty_breakdown,
                    'interest_rate', sr.interest_rate,
                    'interest_method', sr.interest_method,
                    'days_outstanding', sr.days_outstanding,
                    'penalty_rate', sr.penalty_rate
                ) ORDER BY sr.year
            ), '[]'::json)
            FROM state_results sr
            WHERE sr.analysis_id = p_analysis_id AND sr.state = p_state_code
        ),

        -- Transactions (limited to 500, ordered by date)
        'transactions', (
            SELECT COALESCE(json_agg(t ORDER BY t.transaction_date), '[]'::json)
            FROM (
                SELECT
                    st.transaction_id,
                    st.transaction_date,
                    st.sales_amount,
                    st.sales_channel,
                    st.taxable_amount,
                    st.exempt_amount,
                    st.is_taxable
                FROM sales_transactions st
                WHERE st.analysis_id = p_analysis_id
                  AND st.customer_state = p_state_code
                ORDER BY st.transaction_date
                LIMIT 500
            ) t
        ),

        -- Aggregated totals from view
        'aggregates', (
            SELECT json_build_object(
                'total_sales', sra.total_sales,
                'taxable_sales', sra.taxable_sales,
                'exempt_sales', sra.exempt_sales,
                'direct_sales', sra.direct_sales,
                'marketplace_sales', sra.marketplace_sales,
                'exposure_sales', sra.exposure_sales,
                'transaction_count', sra.transaction_count,
                'estimated_liability', sra.estimated_liability,
                'base_tax', sra.base_tax,
                'interest', sra.interest,
                'penalties', sra.penalties,
                'has_nexus', sra.has_nexus,
                'nexus_type', sra.nexus_type,
                'first_nexus_year', sra.first_nexus_year,
                'first_nexus_date', sra.first_nexus_date,
                'years_with_data', sra.years_with_data,
                'year_count', sra.year_count
            )
            FROM state_results_aggregated sra
            WHERE sra.analysis_id = p_analysis_id AND sra.state_code = p_state_code
        ),

        -- Monthly aggregates (reuse existing function)
        'monthly_aggregates', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'year', ma.year,
                    'month', ma.month,
                    'month_num', ma.month_num,
                    'total_sales', ma.total_sales,
                    'transaction_count', ma.transaction_count
                )
            ), '[]'::json)
            FROM get_monthly_sales_aggregates(p_analysis_id, p_state_code) ma
        ),

        -- Economic nexus thresholds
        'thresholds', (
            SELECT json_build_object(
                'revenue_threshold', ent.revenue_threshold,
                'transaction_threshold', ent.transaction_threshold,
                'threshold_operator', ent.threshold_operator
            )
            FROM economic_nexus_thresholds ent
            WHERE ent.state = p_state_code AND ent.effective_to IS NULL
            LIMIT 1
        ),

        -- Tax rates
        'tax_rates', (
            SELECT json_build_object(
                'state_rate', tr.state_rate,
                'avg_local_rate', tr.avg_local_rate,
                'combined_avg_rate', tr.combined_avg_rate
            )
            FROM tax_rates tr
            WHERE tr.state = p_state_code
            LIMIT 1
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- Add helpful comment
-- ============================================================================

COMMENT ON FUNCTION get_state_detail_complete IS
'Returns all data needed for the state detail endpoint in a single call.
Combines 7 separate queries into 1, reducing network round-trips.
Includes built-in security check for analysis ownership.
Parameters: p_analysis_id (UUID), p_state_code (CHAR(2)), p_user_id (UUID)
Returns: JSON object with state_info, state_results, transactions, aggregates,
         monthly_aggregates, thresholds, and tax_rates.
Returns error object if analysis not found or user lacks access.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    v_func_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc
        WHERE proname = 'get_state_detail_complete'
    ) INTO v_func_exists;

    IF v_func_exists THEN
        RAISE NOTICE 'SUCCESS: get_state_detail_complete function created';
        RAISE NOTICE 'Expected performance improvement: 7 round-trips -> 1 round-trip';
        RAISE NOTICE 'Expected latency: ~300-570ms -> ~100-150ms';
    ELSE
        RAISE EXCEPTION 'FAILED: get_state_detail_complete function was not created';
    END IF;
END $$;

-- ============================================================================
-- Usage example
-- ============================================================================
/*
-- Call from Supabase client:
result = supabase.rpc('get_state_detail_complete', {
    'p_analysis_id': 'uuid-here',
    'p_state_code': 'CA',
    'p_user_id': 'user-uuid-here'
}).execute()

-- Check for errors:
if result.data.get('error'):
    raise HTTPException(status_code=404, detail=result.data['message'])

-- Access data:
state_info = result.data['state_info']
state_results = result.data['state_results']
transactions = result.data['transactions']
aggregates = result.data['aggregates']
monthly_aggregates = result.data['monthly_aggregates']
thresholds = result.data['thresholds']
tax_rates = result.data['tax_rates']
*/
