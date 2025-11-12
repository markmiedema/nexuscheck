-- ============================================================================
-- Populate interest_penalty_rates table for Phase 2 testing
-- ============================================================================
--
-- ⚠️ WARNING: These rates are APPROXIMATE PLACEHOLDER VALUES for testing only!
--
-- DO NOT USE IN PRODUCTION without verifying actual state rates.
--
-- Current rates are educated guesses based on general knowledge:
-- - Texas: ~18% annual (1.5% per month) - APPROXIMATE, may be lower
-- - CA/FL/IL: ~3% annual - LIKELY TOO LOW, real rates are 4-12% annual
-- - Penalties: 5-10% - APPROXIMATE, need to verify per state
--
-- TODO BEFORE PRODUCTION:
-- 1. Research actual rates from each state's DOR website
-- 2. Verify calculation methods (simple/compound/daily)
-- 3. Check for minimum/maximum penalty caps
-- 4. Document sources and verification dates
-- 5. Update this file with verified rates
--
-- See: PHASE_2_IMPLEMENTATION_SUMMARY.md - "Known Limitations" section
--
-- ============================================================================
--
-- Run this in Supabase SQL Editor

-- Texas (TX) - Compound Monthly Interest at 1.5% per month (18% annual)
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'TX',
    0.18,  -- 1.5% per month = 18% annual equivalent
    'compound_monthly',
    0.05,  -- 5% penalty
    NULL,
    NULL,
    'tax',
    false,
    true,
    48,
    '2019-01-01',
    NULL  -- Current (no end date)
) ON CONFLICT (state_code, effective_from) DO UPDATE SET
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    interest_calculation_method = EXCLUDED.interest_calculation_method,
    late_registration_penalty_rate = EXCLUDED.late_registration_penalty_rate;

-- California (CA) - Simple Interest at 3% annual
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'CA',
    0.03,  -- 3% annual
    'simple',
    0.10,  -- 10% penalty
    NULL,
    NULL,
    'tax',
    false,
    true,
    48,
    '2019-04-01',
    NULL
) ON CONFLICT (state_code, effective_from) DO UPDATE SET
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    interest_calculation_method = EXCLUDED.interest_calculation_method,
    late_registration_penalty_rate = EXCLUDED.late_registration_penalty_rate;

-- Florida (FL) - Simple Interest at 3% annual
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'FL',
    0.03,  -- 3% annual
    'simple',
    0.10,  -- 10% penalty
    NULL,
    NULL,
    'tax',
    false,
    true,
    48,
    '2019-07-01',
    NULL
) ON CONFLICT (state_code, effective_from) DO UPDATE SET
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    interest_calculation_method = EXCLUDED.interest_calculation_method,
    late_registration_penalty_rate = EXCLUDED.late_registration_penalty_rate;

-- Illinois (IL) - Simple Interest at 3% annual
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'IL',
    0.03,  -- 3% annual
    'simple',
    0.10,  -- 10% penalty
    NULL,
    NULL,
    'tax',
    false,
    true,
    48,
    '2019-10-01',
    NULL
) ON CONFLICT (state_code, effective_from) DO UPDATE SET
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    interest_calculation_method = EXCLUDED.interest_calculation_method,
    late_registration_penalty_rate = EXCLUDED.late_registration_penalty_rate;

-- New York (NY) - Compound Daily Interest at 3% annual
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'NY',
    0.03,  -- 3% annual
    'compound_daily',
    0.10,  -- 10% penalty
    50.00,  -- $50 minimum
    NULL,
    'tax',
    false,
    true,
    48,
    '2019-01-01',
    NULL
) ON CONFLICT (state_code, effective_from) DO UPDATE SET
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    interest_calculation_method = EXCLUDED.interest_calculation_method,
    late_registration_penalty_rate = EXCLUDED.late_registration_penalty_rate;

-- Verify the inserts
SELECT
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    effective_from,
    effective_to
FROM interest_penalty_rates
WHERE state_code IN ('TX', 'CA', 'FL', 'IL', 'NY')
ORDER BY state_code;
