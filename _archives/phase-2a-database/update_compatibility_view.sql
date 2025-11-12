-- ============================================================================
-- Update Phase 2 Compatibility View for Maximum Exposure Penalties
-- ============================================================================
--
-- This updates the view to use penalty_combined_max_pct for maximum exposure
-- scenarios (unregistered businesses being audited).
--
-- Run this in Supabase SQL Editor to update the view.
--
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS interest_penalty_rates_v2_compat;

-- Recreate with updated penalty logic
CREATE VIEW interest_penalty_rates_v2_compat AS
SELECT
    ipr.id,
    ipr.state_code,

    -- Interest rate mapping
    ipr.annual_interest_rate,

    -- Map calculation_method to what Phase 2 expects
    CASE
        WHEN ipr.calculation_method IN ('simple_daily', 'simple_monthly', 'simple') THEN 'simple'
        WHEN ipr.calculation_method = 'compound_monthly' THEN 'compound_monthly'
        WHEN ipr.calculation_method = 'compound_daily' THEN 'compound_daily'
        ELSE 'simple'
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
        ELSE 'tax'
    END AS penalty_applies_to,

    -- VDA information
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

-- Test query to verify penalty rates
SELECT
    state_code,
    annual_interest_rate * 100 AS interest_pct,
    late_registration_penalty_rate * 100 AS penalty_pct,
    CASE
        WHEN state_code = 'TX' THEN 'Should be 20%'
        WHEN state_code = 'FL' THEN 'Should be 10%'
        WHEN state_code = 'CA' THEN 'Should be 10%'
        ELSE 'Check value'
    END AS expected
FROM interest_penalty_rates_v2_compat
WHERE state_code IN ('TX', 'CA', 'FL', 'NY')
ORDER BY state_code;

-- ============================================================================
-- Expected Output:
--
-- TX: interest_pct = 8.5,  penalty_pct = 20.0 (combined max)
-- CA: interest_pct = 10.0, penalty_pct = 10.0 (late payment = combined max)
-- FL: interest_pct = 12.0, penalty_pct = 10.0 (late payment, no combined max)
-- NY: interest_pct = 14.5, penalty_pct = 30.0 (combined max)
--
-- ============================================================================
