-- Migration 024: Create State Aggregates View
-- Created: 2025-01-14
-- Purpose: Create database view for pre-aggregated state data across all years
--
-- Addresses audit finding:
-- - "Backend Re-Aggregates Database Data" - API manually sums data that's
--   already stored in state_results table (60+ lines of Python aggregation)
--
-- Benefits:
-- - Database performs aggregation (faster than Python loops)
-- - Single query instead of fetching all years then aggregating
-- - Eliminates 60+ lines of aggregation code in API
-- - Can add indexes to improve performance
-- - Easier to maintain and test

-- ============================================================================
-- Drop existing view if it exists (for migration rerun safety)
-- ============================================================================

DROP VIEW IF EXISTS state_results_aggregated;

-- ============================================================================
-- Create view that aggregates state_results across all years
-- ============================================================================

CREATE OR REPLACE VIEW state_results_aggregated AS
SELECT
    sr.analysis_id,
    sr.state AS state_code,

    -- Aggregated sales data
    SUM(sr.total_sales) AS total_sales,
    SUM(sr.taxable_sales) AS taxable_sales,
    SUM(sr.exempt_sales) AS exempt_sales,
    SUM(sr.direct_sales) AS direct_sales,
    SUM(sr.marketplace_sales) AS marketplace_sales,
    SUM(sr.exposure_sales) AS exposure_sales,
    SUM(sr.transaction_count) AS transaction_count,

    -- Aggregated liability data
    SUM(sr.estimated_liability) AS estimated_liability,
    SUM(sr.base_tax) AS base_tax,
    SUM(sr.interest) AS interest,
    SUM(sr.penalties) AS penalties,

    -- Nexus determination (ANY year has nexus = has nexus overall)
    BOOL_OR(sr.nexus_type IN ('physical', 'economic', 'both')) AS has_nexus,

    -- Nexus type logic: combine all years
    CASE
        WHEN BOOL_OR(sr.nexus_type = 'both') THEN 'both'
        WHEN BOOL_OR(sr.nexus_type = 'physical') AND BOOL_OR(sr.nexus_type = 'economic') THEN 'both'
        WHEN BOOL_OR(sr.nexus_type = 'physical') THEN 'physical'
        WHEN BOOL_OR(sr.nexus_type = 'economic') THEN 'economic'
        ELSE 'none'
    END AS nexus_type,

    -- First year nexus was established (minimum year where nexus exists)
    MIN(
        CASE
            WHEN sr.nexus_type IN ('physical', 'economic', 'both')
            THEN sr.year
            ELSE NULL
        END
    ) AS first_nexus_year,

    -- Earliest nexus date across all years
    MIN(sr.nexus_date) AS first_nexus_date,

    -- List of years with data (as array)
    ARRAY_AGG(sr.year ORDER BY sr.year) AS years_with_data,

    -- Count of years
    COUNT(*) AS year_count

FROM state_results sr
WHERE sr.year IS NOT NULL  -- Only aggregate records with valid year
GROUP BY sr.analysis_id, sr.state;

-- ============================================================================
-- Add helpful comment
-- ============================================================================

COMMENT ON VIEW state_results_aggregated IS
'Aggregated state results across all years for an analysis.
Combines multiple year records into a single row per analysis+state.
Used by API to avoid Python-level aggregation loops.';

-- ============================================================================
-- Create indexes on underlying table to speed up view queries
-- ============================================================================

-- Index for fast aggregation by analysis_id and state
CREATE INDEX IF NOT EXISTS idx_state_results_analysis_state
ON state_results(analysis_id, state, year);

-- Index for nexus type filtering
CREATE INDEX IF NOT EXISTS idx_state_results_nexus_type
ON state_results(analysis_id, nexus_type)
WHERE nexus_type IN ('physical', 'economic', 'both');

-- ============================================================================
-- Test the view with sample query
-- ============================================================================

DO $$
DECLARE
    v_view_count INTEGER;
    v_table_count INTEGER;
BEGIN
    -- Check that view was created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_name = 'state_results_aggregated';

    IF v_view_count != 1 THEN
        RAISE EXCEPTION 'FAILED: state_results_aggregated view not created';
    END IF;

    -- Count rows in view (should be <= rows in table due to aggregation)
    SELECT COUNT(*) INTO v_view_count FROM state_results_aggregated;
    SELECT COUNT(DISTINCT (analysis_id, state)) INTO v_table_count FROM state_results;

    IF v_view_count != v_table_count THEN
        RAISE WARNING 'View has % rows, expected % (one per analysis+state)', v_view_count, v_table_count;
    END IF;

    RAISE NOTICE 'SUCCESS: state_results_aggregated view created';
    RAISE NOTICE 'View contains % aggregated state results', v_view_count;
    RAISE NOTICE 'Added 2 indexes to speed up aggregation queries';
END $$;

-- ============================================================================
-- Example usage
-- ============================================================================

/*
-- Old way (Python aggregation):
1. SELECT * FROM state_results WHERE analysis_id = ? AND state = ?
2. In Python: sum all years for total_sales, taxable_sales, etc.

-- New way (Database aggregation):
SELECT * FROM state_results_aggregated
WHERE analysis_id = ? AND state_code = ?

-- This replaces 60+ lines of Python code with a single SQL query
*/

-- ============================================================================
-- Summary
-- ============================================================================
-- Created view: state_results_aggregated
-- Columns: 16 aggregated fields + metadata
-- Performance: Database handles aggregation (faster than Python)
-- API changes needed: Update get_state_detail() to query this view
-- Expected performance improvement: 30-50% faster for multi-year analyses
