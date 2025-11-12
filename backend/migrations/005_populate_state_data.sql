-- ============================================================================
-- SALT Tax Tool - State Data Population
-- ============================================================================
-- Created: 2025-11-02
-- Purpose: Populate state reference tables with initial data
-- Database: Supabase (PostgreSQL)
--
-- Tables populated:
--   1. states (51 entries)
--   2. economic_nexus_thresholds (47 entries)
--   3. marketplace_facilitator_rules (47 entries)
--   4. tax_rates (46 entries)
--
-- Note: States without sales tax (AK, DE, MT, NH, OR) are in states table
--       but may not have entries in rules tables
-- ============================================================================

-- Make script idempotent (can run multiple times)
DELETE FROM tax_rates;
DELETE FROM marketplace_facilitator_rules;
DELETE FROM economic_nexus_thresholds;
DELETE FROM states WHERE code != 'XX';  -- Preserve any test data if exists


-- ============================================================================
-- TABLE 1: states
-- ============================================================================

INSERT INTO states (
  code,
  name,
  has_sales_tax,
  has_local_taxes,
  has_home_rule_cities,
  has_vda_program
) VALUES

  ('AK', 'Alaska', FALSE, FALSE, FALSE, TRUE),
  ('AL', 'Alabama', TRUE, TRUE, FALSE, TRUE),
  ('AR', 'Arkansas', TRUE, TRUE, FALSE, TRUE),
  ('AZ', 'Arizona', TRUE, TRUE, FALSE, TRUE),
  ('CA', 'California', TRUE, TRUE, FALSE, TRUE),
  ('CO', 'Colorado', TRUE, TRUE, FALSE, TRUE),
  ('CT', 'Connecticut', TRUE, TRUE, FALSE, TRUE),
  ('DC', 'District of Columbia', TRUE, TRUE, FALSE, TRUE),
  ('DE', 'Delaware', FALSE, FALSE, FALSE, TRUE),
  ('FL', 'Florida', TRUE, TRUE, FALSE, TRUE),
  ('GA', 'Georgia', TRUE, TRUE, FALSE, TRUE),
  ('HI', 'Hawaii', TRUE, TRUE, FALSE, TRUE),
  ('IA', 'Iowa', TRUE, TRUE, FALSE, TRUE),
  ('ID', 'Idaho', TRUE, TRUE, FALSE, TRUE),
  ('IL', 'Illinois', TRUE, TRUE, FALSE, TRUE),
  ('IN', 'Indiana', TRUE, TRUE, FALSE, TRUE),
  ('KS', 'Kansas', TRUE, TRUE, FALSE, TRUE),
  ('KY', 'Kentucky', TRUE, TRUE, FALSE, TRUE),
  ('LA', 'Louisiana', TRUE, TRUE, FALSE, TRUE),
  ('MA', 'Massachusetts', TRUE, TRUE, FALSE, TRUE),
  ('MD', 'Maryland', TRUE, TRUE, FALSE, TRUE),
  ('ME', 'Maine', TRUE, TRUE, FALSE, TRUE),
  ('MI', 'Michigan', TRUE, TRUE, FALSE, TRUE),
  ('MN', 'Minnesota', TRUE, TRUE, FALSE, TRUE),
  ('MO', 'Missouri', TRUE, TRUE, FALSE, TRUE),
  ('MS', 'Mississippi', TRUE, TRUE, FALSE, TRUE),
  ('MT', 'Montana', FALSE, FALSE, FALSE, TRUE),
  ('NC', 'North Carolina', TRUE, TRUE, FALSE, TRUE),
  ('ND', 'North Dakota', TRUE, TRUE, FALSE, TRUE),
  ('NE', 'Nebraska', TRUE, TRUE, FALSE, TRUE),
  ('NH', 'New Hampshire', FALSE, FALSE, FALSE, TRUE),
  ('NJ', 'New Jersey', TRUE, TRUE, FALSE, TRUE),
  ('NM', 'New Mexico', TRUE, TRUE, FALSE, TRUE),
  ('NV', 'Nevada', TRUE, TRUE, FALSE, TRUE),
  ('NY', 'New York', TRUE, TRUE, FALSE, TRUE),
  ('OH', 'Ohio', TRUE, TRUE, FALSE, TRUE),
  ('OK', 'Oklahoma', TRUE, TRUE, FALSE, TRUE),
  ('OR', 'Oregon', FALSE, FALSE, FALSE, TRUE),
  ('PA', 'Pennsylvania', TRUE, TRUE, FALSE, TRUE),
  ('PR', 'Puerto Rico', TRUE, TRUE, FALSE, TRUE),
  ('RI', 'Rhode Island', TRUE, TRUE, FALSE, TRUE),
  ('SC', 'South Carolina', TRUE, TRUE, FALSE, TRUE),
  ('SD', 'South Dakota', TRUE, TRUE, FALSE, TRUE),
  ('TN', 'Tennessee', TRUE, TRUE, FALSE, TRUE),
  ('TX', 'Texas', TRUE, TRUE, FALSE, TRUE),
  ('UT', 'Utah', TRUE, TRUE, FALSE, TRUE),
  ('VA', 'Virginia', TRUE, TRUE, FALSE, TRUE),
  ('VT', 'Vermont', TRUE, TRUE, FALSE, TRUE),
  ('WA', 'Washington', TRUE, TRUE, FALSE, TRUE),
  ('WI', 'Wisconsin', TRUE, TRUE, FALSE, TRUE),
  ('WV', 'West Virginia', TRUE, TRUE, FALSE, TRUE),
  ('WY', 'Wyoming', TRUE, TRUE, FALSE, TRUE);



-- ============================================================================
-- TABLE 2: economic_nexus_thresholds
-- ============================================================================
-- Note: States without sales tax (AK, DE, MT, NH, OR) are not included

INSERT INTO economic_nexus_thresholds (
  state,
  threshold_type,
  revenue_threshold,
  transaction_threshold,
  threshold_operator,
  effective_from,
  notes
) VALUES

  ('AL', 'revenue', 250000.00, NULL, 'or', '2019-01-01', NULL),
  ('AR', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('AZ', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('CA', 'revenue', 500000.00, NULL, 'or', '2019-01-01', NULL),
  ('CO', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('CT', 'both', 100000.00, 200, 'and', '2019-01-01', NULL),
  ('DC', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('FL', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('GA', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('HI', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('IA', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('ID', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('IL', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('IN', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('KS', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('KY', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('LA', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('MA', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('MD', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('ME', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('MI', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('MN', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('MO', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('MS', 'revenue', 250000.00, NULL, 'or', '2019-01-01', NULL),
  ('NC', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('ND', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('NE', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('NJ', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('NM', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('NV', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('NY', 'both', 500000.00, 100, 'and', '2019-01-01', NULL),
  ('OH', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('OK', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('PA', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('PR', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('RI', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('SC', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('SD', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('TN', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('TX', 'revenue', 500000.00, NULL, 'or', '2019-01-01', NULL),
  ('UT', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('VA', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('VT', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('WA', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('WI', 'revenue', 100000.00, NULL, 'or', '2019-01-01', NULL),
  ('WV', 'or', 100000.00, 200, 'or', '2019-01-01', NULL),
  ('WY', 'or', 100000.00, 200, 'or', '2019-01-01', NULL);



-- ============================================================================
-- TABLE 3: marketplace_facilitator_rules
-- ============================================================================
-- Note: States without sales tax (AK, DE, MT, NH, OR) are not included

INSERT INTO marketplace_facilitator_rules (
  state,
  has_mf_law,
  mf_law_effective_date,
  count_toward_threshold,
  exclude_from_liability,
  remote_seller_must_register,
  effective_from
) VALUES

  ('AL', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('AR', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('AZ', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('CA', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('CO', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('CT', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('DC', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('FL', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('GA', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('HI', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('IA', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('ID', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('IL', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('IN', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('KS', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('KY', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('LA', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('MA', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('MD', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('ME', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('MI', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('MN', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('MO', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('MS', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('NC', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('ND', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('NE', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('NJ', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('NM', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('NV', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('NY', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('OH', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('OK', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('PA', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('PR', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('RI', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('SC', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('SD', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('TN', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('TX', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('UT', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('VA', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01'),
  ('VT', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('WA', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('WI', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('WV', TRUE, '2019-10-01', TRUE, FALSE, FALSE, '2019-10-01'),
  ('WY', TRUE, '2019-10-01', FALSE, TRUE, FALSE, '2019-10-01');



-- ============================================================================
-- TABLE 4: tax_rates
-- ============================================================================
-- Note: States without sales tax (AK, DE, MT, NH, OR) are not included
-- Data source: Tax Foundation, January 2025

INSERT INTO tax_rates (
  state,
  state_rate,
  avg_local_rate,
  effective_from,
  notes
) VALUES

  ('AL', 0.04, 0.0544, '2025-01-01', NULL),
  ('AR', 0.065, 0.0298, '2025-01-01', NULL),
  ('AZ', 0.056, 0.0292, '2025-01-01', NULL),
  ('CA', 0.0725, 0.0173, '2025-01-01', NULL),
  ('CO', 0.029, 0.0496, '2025-01-01', NULL),
  ('CT', 0.0635, 0.00, '2025-01-01', NULL),
  ('DC', 0.06, 0.00, '2025-01-01', NULL),
  ('FL', 0.06, 0.0102, '2025-01-01', NULL),
  ('GA', 0.04, 0.0344, '2025-01-01', NULL),
  ('HI', 0.04, 0.005, '2025-01-01', NULL),
  ('IA', 0.06, 0.0094, '2025-01-01', NULL),
  ('ID', 0.06, 0.0003, '2025-01-01', NULL),
  ('IL', 0.0625, 0.0267, '2025-01-01', NULL),
  ('IN', 0.07, 0.00, '2025-01-01', NULL),
  ('KS', 0.065, 0.0228, '2025-01-01', NULL),
  ('KY', 0.06, 0.00, '2025-01-01', NULL),
  ('LA', 0.05, 0.0511, '2025-01-01', NULL),
  ('MA', 0.0625, 0.00, '2025-01-01', NULL),
  ('MD', 0.06, 0.00, '2025-01-01', NULL),
  ('ME', 0.055, 0.00, '2025-01-01', NULL),
  ('MI', 0.06, 0.00, '2025-01-01', NULL),
  ('MN', 0.06875, 0.0126, '2025-01-01', NULL),
  ('MO', 0.04225, 0.0419, '2025-01-01', NULL),
  ('MS', 0.07, 0.0006, '2025-01-01', NULL),
  ('NC', 0.0475, 0.0225, '2025-01-01', NULL),
  ('ND', 0.05, 0.0208, '2025-01-01', NULL),
  ('NE', 0.055, 0.0148, '2025-01-01', NULL),
  ('NJ', 0.06625, -0.0002, '2025-01-01', NULL),
  ('NM', 0.04875, 0.0279, '2025-01-01', NULL),
  ('NV', 0.0685, 0.0139, '2025-01-01', NULL),
  ('NY', 0.04, 0.0454, '2025-01-01', NULL),
  ('OH', 0.0575, 0.0155, '2025-01-01', NULL),
  ('OK', 0.045, 0.0455, '2025-01-01', NULL),
  ('PA', 0.06, 0.0034, '2025-01-01', NULL),
  ('RI', 0.07, 0.00, '2025-01-01', NULL),
  ('SC', 0.06, 0.0149, '2025-01-01', NULL),
  ('SD', 0.042, 0.0191, '2025-01-01', NULL),
  ('TN', 0.07, 0.0261, '2025-01-01', NULL),
  ('TX', 0.0625, 0.0195, '2025-01-01', NULL),
  ('UT', 0.061, 0.0132, '2025-01-01', NULL),
  ('VA', 0.053, 0.0047, '2025-01-01', NULL),
  ('VT', 0.06, 0.0039, '2025-01-01', NULL),
  ('WA', 0.065, 0.0297, '2025-01-01', NULL),
  ('WI', 0.05, 0.0072, '2025-01-01', NULL),
  ('WV', 0.06, 0.0058, '2025-01-01', NULL),
  ('WY', 0.04, 0.0156, '2025-01-01', NULL);


-- ============================================================================
-- Verification
-- ============================================================================

-- Verify row counts
DO $$
DECLARE
  states_count INT;
  nexus_count INT;
  mf_count INT;
  tax_count INT;
BEGIN
  SELECT COUNT(*) INTO states_count FROM states;
  SELECT COUNT(*) INTO nexus_count FROM economic_nexus_thresholds;
  SELECT COUNT(*) INTO mf_count FROM marketplace_facilitator_rules;
  SELECT COUNT(*) INTO tax_count FROM tax_rates;

  RAISE NOTICE 'Migration 005 Complete:';
  RAISE NOTICE '  - states: % rows', states_count;
  RAISE NOTICE '  - economic_nexus_thresholds: % rows', nexus_count;
  RAISE NOTICE '  - marketplace_facilitator_rules: % rows', mf_count;
  RAISE NOTICE '  - tax_rates: % rows', tax_count;
  RAISE NOTICE '  - Total: % rows', states_count + nexus_count + mf_count + tax_count;

  IF states_count != 52 THEN
    RAISE WARNING 'Expected 52 states, got %', states_count;
  END IF;

  IF nexus_count != 47 THEN
    RAISE WARNING 'Expected 47 economic nexus entries, got %', nexus_count;
  END IF;

  IF mf_count != 47 THEN
    RAISE WARNING 'Expected 47 marketplace facilitator entries, got %', mf_count;
  END IF;

  IF tax_count != 46 THEN
    RAISE WARNING 'Expected 46 tax rate entries, got %', tax_count;
  END IF;
END $$;
