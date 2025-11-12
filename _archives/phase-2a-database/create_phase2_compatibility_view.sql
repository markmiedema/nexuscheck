-- ============================================================================
-- Phase 2 Compatibility View
-- ============================================================================
--
-- This view maps the new detailed interest_penalty_rates and vda_programs
-- tables to the simpler schema that Phase 2 code expects.
--
-- Run this in Supabase SQL Editor after importing research data.
--
-- ============================================================================

-- Drop view if it exists
DROP VIEW IF EXISTS interest_penalty_rates_v2_compat;

-- Create compatibility view
CREATE VIEW interest_penalty_rates_v2_compat AS
SELECT
    ipr.id,
    ipr.state_code,

    -- Interest rate mapping
    ipr.annual_interest_rate,

    -- Map calculation_method to what Phase 2 expects
    -- simple_daily → simple
    -- simple_monthly → simple
    -- compound_monthly → compound_monthly
    -- compound_daily → compound_daily
    CASE
        WHEN ipr.calculation_method IN ('simple_daily', 'simple_monthly', 'simple') THEN 'simple'
        WHEN ipr.calculation_method = 'compound_monthly' THEN 'compound_monthly'
        WHEN ipr.calculation_method = 'compound_daily' THEN 'compound_daily'
        ELSE 'simple'  -- Default fallback
    END AS interest_calculation_method,

    -- Penalty rate mapping
    -- For MAXIMUM EXPOSURE (audit scenario), use combined max penalty
    -- For VDA scenarios, this will be reduced separately
    COALESCE(
        ipr.penalty_combined_max_pct,  -- Maximum total penalty (audit scenario)
        ipr.late_payment_penalty_rate, -- Fallback to late payment
        ipr.late_filing_penalty_rate,  -- Fallback to late filing
        0
    ) AS late_registration_penalty_rate,

    -- Penalty min/max (DOLLAR AMOUNTS, not percentages)
    COALESCE(
        ipr.late_payment_minimum,
        ipr.late_filing_minimum
    ) AS late_registration_penalty_min,

    -- Max should be NULL for most states (no dollar cap)
    -- Only use if there's an actual dollar maximum in the data
    NULL AS late_registration_penalty_max,

    -- Penalty applies to
    CASE
        WHEN ipr.penalty_basis = 'tax_plus_interest' THEN 'tax_plus_interest'
        ELSE 'tax'  -- Default to tax only
    END AS penalty_applies_to,

    -- VDA information (join from vda_programs table)
    COALESCE(vda.interest_waived, false) AS vda_interest_waived,
    COALESCE(vda.penalties_waived, false) AS vda_penalties_waived,
    vda.lookback_period_months AS vda_lookback_period_months,

    -- Effective dates
    ipr.effective_date AS effective_from,
    ipr.next_change_date AS effective_to,

    -- Audit fields
    ipr.created_at,
    ipr.updated_at

FROM interest_penalty_rates ipr
LEFT JOIN vda_programs vda ON ipr.state_code = vda.state_code;

-- Add comment
COMMENT ON VIEW interest_penalty_rates_v2_compat IS
'Compatibility view that maps new detailed schema to Phase 2 expected fields. Use this view in Phase 2 calculator queries.';

-- ============================================================================
-- Update Phase 2 code to use this view
-- ============================================================================
--
-- In interest_calculator.py, change:
--
-- FROM:
--   self.supabase.table('interest_penalty_rates')
--
-- TO:
--   self.supabase.from_('interest_penalty_rates_v2_compat')
--
-- (Note: Use from_() instead of table() for views)
--
-- ============================================================================

-- ============================================================================
-- Test the view
-- ============================================================================

-- Check that view works and returns expected fields
SELECT
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months
FROM interest_penalty_rates_v2_compat
WHERE state_code IN ('TX', 'CA', 'NY')
ORDER BY state_code;

-- Expected output:
-- TX: 0.085, simple, 0.05, false, true, 48
-- CA: 0.10, simple, 0.10, false, true, 36
-- NY: 0.145, compound_daily, 0.10, false, true, 36

-- ============================================================================
-- END
-- ============================================================================
