-- ============================================================================
-- Migration 049: Update Reference Data for 2026
-- ============================================================================
-- Created: 2026-02-26
-- Purpose: Update state tax reference data with changes since July 2025
--
-- Changes included:
--   1. Economic nexus thresholds: 5 states eliminated transaction thresholds
--      - Indiana (Jan 1, 2024), North Carolina (Jul 1, 2024),
--        Wyoming (Jul 1, 2024), Utah (Jul 1, 2025), Illinois (Jan 1, 2026)
--   2. Tax rates: Updated average local rates to January 2026 data
--      - No state base rates changed
--      - Average local rates updated per Tax Foundation Jan 2026 report
--   3. DC rate change scheduled for Oct 1, 2026 (6% → 7%) - added as future record
--
-- Data sources:
--   - Tax Foundation: 2026 State and Local Sales Tax Rates (Jan 2026)
--   - Sales Tax Institute: Economic Nexus State Guide (Jan 2026)
--   - Avalara: States Eliminating Transaction Thresholds (Jun 2025)
--   - State department of revenue announcements
--
-- Related legislation:
--   - UT SB 47: Eliminated transaction threshold effective Jul 1, 2025
--   - IL HB 2755: Eliminated transaction threshold effective Jan 1, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Economic Nexus Threshold Updates
-- ============================================================================
-- Five states eliminated their transaction-count thresholds, switching to
-- revenue-only economic nexus. This is the dominant national trend.
--
-- The old records are closed with effective_to dates and new revenue-only
-- records are inserted, preserving historical data for multi-year analyses.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1a. Indiana - Eliminated 200-transaction threshold (Jan 1, 2024)
-- ---------------------------------------------------------------------------
UPDATE economic_nexus_thresholds
SET effective_to = '2024-01-01',
    updated_at = NOW()
WHERE state = 'IN'
  AND effective_to IS NULL;

INSERT INTO economic_nexus_thresholds (
  state, threshold_type, revenue_threshold, transaction_threshold,
  threshold_operator, effective_from, notes
) VALUES (
  'IN', 'revenue', 100000.00, NULL,
  'or', '2024-01-01',
  'Eliminated 200-transaction threshold effective Jan 1, 2024. Revenue-only: $100K.'
);

-- ---------------------------------------------------------------------------
-- 1b. North Carolina - Eliminated 200-transaction threshold (Jul 1, 2024)
-- ---------------------------------------------------------------------------
UPDATE economic_nexus_thresholds
SET effective_to = '2024-07-01',
    updated_at = NOW()
WHERE state = 'NC'
  AND effective_to IS NULL;

INSERT INTO economic_nexus_thresholds (
  state, threshold_type, revenue_threshold, transaction_threshold,
  threshold_operator, effective_from, notes
) VALUES (
  'NC', 'revenue', 100000.00, NULL,
  'or', '2024-07-01',
  'Eliminated 200-transaction threshold effective Jul 1, 2024. Revenue-only: $100K.'
);

-- ---------------------------------------------------------------------------
-- 1c. Wyoming - Eliminated 200-transaction threshold (Jul 1, 2024)
-- ---------------------------------------------------------------------------
UPDATE economic_nexus_thresholds
SET effective_to = '2024-07-01',
    updated_at = NOW()
WHERE state = 'WY'
  AND effective_to IS NULL;

INSERT INTO economic_nexus_thresholds (
  state, threshold_type, revenue_threshold, transaction_threshold,
  threshold_operator, effective_from, notes
) VALUES (
  'WY', 'revenue', 100000.00, NULL,
  'or', '2024-07-01',
  'Eliminated 200-transaction threshold effective Jul 1, 2024. Revenue-only: $100K.'
);

-- ---------------------------------------------------------------------------
-- 1d. Utah - Eliminated 200-transaction threshold (Jul 1, 2025)
--     Legislation: SB 47
-- ---------------------------------------------------------------------------
UPDATE economic_nexus_thresholds
SET effective_to = '2025-07-01',
    updated_at = NOW()
WHERE state = 'UT'
  AND effective_to IS NULL;

INSERT INTO economic_nexus_thresholds (
  state, threshold_type, revenue_threshold, transaction_threshold,
  threshold_operator, effective_from, notes
) VALUES (
  'UT', 'revenue', 100000.00, NULL,
  'or', '2025-07-01',
  'SB 47: Eliminated 200-transaction threshold effective Jul 1, 2025. Revenue-only: $100K.'
);

-- ---------------------------------------------------------------------------
-- 1e. Illinois - Eliminated 200-transaction threshold (Jan 1, 2026)
--     Legislation: HB 2755 (signed Jun 16, 2025)
-- ---------------------------------------------------------------------------
UPDATE economic_nexus_thresholds
SET effective_to = '2026-01-01',
    updated_at = NOW()
WHERE state = 'IL'
  AND effective_to IS NULL;

INSERT INTO economic_nexus_thresholds (
  state, threshold_type, revenue_threshold, transaction_threshold,
  threshold_operator, effective_from, notes
) VALUES (
  'IL', 'revenue', 100000.00, NULL,
  'or', '2026-01-01',
  'HB 2755: Eliminated 200-transaction threshold effective Jan 1, 2026. Revenue-only: $100K. Threshold based on gross sales (including exempt items).'
);


-- ============================================================================
-- PART 2: Tax Rate Updates (January 2026)
-- ============================================================================
-- No state base rates changed between July 2025 and January 2026.
-- Average local rates are updated per Tax Foundation January 2026 data.
--
-- Methodology:
--   - State rates: Unchanged (verified against Sales Tax Institute Mar 2026)
--   - Avg local rates: Updated from Tax Foundation population-weighted averages
--   - CA, UT, VA state rates include mandatory statewide local add-ons
--     (CA +1.25%, UT +1.25%, VA +1.0%) per Tax Foundation methodology
--
-- Approach: Expire 2025 records and insert fresh 2026 records to preserve
-- historical data for multi-year analyses.
-- ============================================================================

-- Close out 2025 tax rate records
UPDATE tax_rates
SET effective_to = '2026-01-01',
    updated_at = NOW()
WHERE effective_to IS NULL
  AND effective_from = '2025-01-01';

-- Insert 2026 tax rate records
-- Sources: Tax Foundation Jan 2026 report, Sales Tax Institute state rates
INSERT INTO tax_rates (
  state, state_rate, avg_local_rate, effective_from, notes
) VALUES
  -- State rates verified against Sales Tax Institute (Mar 2026)
  -- Avg local rates from Tax Foundation (Jan 2026, population-weighted)
  ('AL', 0.0400, 0.0546, '2026-01-01', 'TF Jan 2026. Avg local 5.46% (highest in nation).'),
  ('AR', 0.0650, 0.0296, '2026-01-01', 'TF Jan 2026. State grocery tax eliminated Jan 1, 2026 (HB 1685).'),
  ('AZ', 0.0560, 0.0281, '2026-01-01', 'TF Jan 2026.'),
  ('CA', 0.0725, 0.0155, '2026-01-01', 'TF Jan 2026. State rate includes 1.25% mandatory county tax.'),
  ('CO', 0.0290, 0.0499, '2026-01-01', 'TF Jan 2026. Avg local 4.99% (3rd highest). Vendor fee eliminated Jan 2026.'),
  ('CT', 0.0635, 0.0000, '2026-01-01', 'TF Jan 2026. No local taxes.'),
  ('DC', 0.0600, 0.0000, '2026-01-01', 'TF Jan 2026. Rate increases to 7% on Oct 1, 2026.'),
  ('FL', 0.0600, 0.0095, '2026-01-01', 'TF Jan 2026. Combined rate decreased slightly.'),
  ('GA', 0.0400, 0.0342, '2026-01-01', 'TF Jan 2026. Many counties added Floating Local Option Sales Tax.'),
  ('HI', 0.0400, 0.0050, '2026-01-01', 'TF Jan 2026.'),
  ('IA', 0.0600, 0.0094, '2026-01-01', 'TF Jan 2026.'),
  ('ID', 0.0600, 0.0003, '2026-01-01', 'TF Jan 2026.'),
  ('IL', 0.0625, 0.0264, '2026-01-01', 'TF Jan 2026. 1% state food tax eliminated Jan 2026; some localities imposed own food tax.'),
  ('IN', 0.0700, 0.0000, '2026-01-01', 'TF Jan 2026. No local taxes.'),
  ('KS', 0.0650, 0.0219, '2026-01-01', 'TF Jan 2026. Largest avg local rate drop since Jul 2025 (-0.09pp).'),
  ('KY', 0.0600, 0.0000, '2026-01-01', 'TF Jan 2026. No local taxes.'),
  ('LA', 0.0500, 0.0511, '2026-01-01', 'TF Jan 2026. Highest combined rate in nation (10.11%). Electronic filing mandate effective Jan 2026.'),
  ('MA', 0.0625, 0.0000, '2026-01-01', 'TF Jan 2026. No local taxes.'),
  ('MD', 0.0600, 0.0000, '2026-01-01', 'TF Jan 2026. IT services subject to 3% tax since Jul 2025.'),
  ('ME', 0.0550, 0.0000, '2026-01-01', 'TF Jan 2026. Streaming services now taxable Jan 2026.'),
  ('MI', 0.0600, 0.0000, '2026-01-01', 'TF Jan 2026. No local taxes.'),
  ('MN', 0.0688, 0.0125, '2026-01-01', 'TF Jan 2026.'),
  ('MO', 0.0423, 0.0419, '2026-01-01', 'TF Jan 2026.'),
  ('MS', 0.0700, 0.0006, '2026-01-01', 'TF Jan 2026. Grocery rate reduced from 7% to 5% Jul 2025.'),
  ('NC', 0.0475, 0.0225, '2026-01-01', 'TF Jan 2026.'),
  ('ND', 0.0500, 0.0205, '2026-01-01', 'TF Jan 2026.'),
  ('NE', 0.0550, 0.0147, '2026-01-01', 'TF Jan 2026. Vendor discount reduced to 2.5% (max $75/mo) Jan 2026.'),
  ('NJ', 0.06625, -0.0002, '2026-01-01', 'TF Jan 2026. Salem County exempt from statewide rate (3.3125% local).'),
  ('NM', 0.04875, 0.0275, '2026-01-01', 'TF Jan 2026. GRT rate may revert to 5.125% if revenue drops 5%+ YoY (2026-2029).'),
  ('NV', 0.0685, 0.0139, '2026-01-01', 'TF Jan 2026.'),
  ('NY', 0.0400, 0.0453, '2026-01-01', 'TF Jan 2026. Avg local 4.53%.'),
  ('OH', 0.0575, 0.0148, '2026-01-01', 'TF Jan 2026. Vendor discount capped at $750/mo Jan 2026. Multiple exemptions repealed.'),
  ('OK', 0.0450, 0.0456, '2026-01-01', 'TF Jan 2026. Avg local 4.56% (4th highest).'),
  ('PA', 0.0600, 0.0034, '2026-01-01', 'TF Jan 2026.'),
  ('RI', 0.0700, 0.0000, '2026-01-01', 'TF Jan 2026. Hotel tax increased 1% to 2%; new 5% whole-home STR tax Jan 2026.'),
  ('SC', 0.0600, 0.0150, '2026-01-01', 'TF Jan 2026.'),
  ('SD', 0.0420, 0.0191, '2026-01-01', 'TF Jan 2026. Vendor discount suspended Jul 2025 - Jun 2028.'),
  ('TN', 0.0700, 0.0256, '2026-01-01', 'TF Jan 2026.'),
  ('TX', 0.0625, 0.0195, '2026-01-01', 'TF Jan 2026. R&D equipment sales tax exemption repealed Jan 2026.'),
  ('UT', 0.0610, 0.0122, '2026-01-01', 'TF Jan 2026. State rate includes 1.25% mandatory local. Customized food tax expanded Jan 2026.'),
  ('VA', 0.0530, 0.0047, '2026-01-01', 'TF Jan 2026. State rate includes 1.0% mandatory local.'),
  ('VT', 0.0600, 0.0037, '2026-01-01', 'TF Jan 2026.'),
  ('WA', 0.0650, 0.0293, '2026-01-01', 'TF Jan 2026. Rental car tax increased to 11.9%; luxury vehicle surcharge Jan 2026.'),
  ('WI', 0.0500, 0.0070, '2026-01-01', 'TF Jan 2026.'),
  ('WV', 0.0600, 0.0057, '2026-01-01', 'TF Jan 2026.'),
  ('WY', 0.0400, 0.0144, '2026-01-01', 'TF Jan 2026.');


-- ============================================================================
-- PART 3: DC Future Rate Change (October 1, 2026)
-- ============================================================================
-- Washington, D.C. has a scheduled rate increase from 6% to 7% on Oct 1, 2026.
-- Per the "Sales Tax Increase Delay Amendment Act of 2025", the 6.5% interim
-- step was skipped. Insert as a future record so it's ready when the date arrives.
-- ============================================================================

INSERT INTO tax_rates (
  state, state_rate, avg_local_rate, effective_from, notes
) VALUES (
  'DC', 0.0700, 0.0000, '2026-10-01',
  'Sales Tax Increase Delay Amendment Act of 2025: Rate increases from 6% to 7% (6.5% interim skipped).'
);


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  threshold_active INT;
  threshold_revenue_only INT;
  rate_2026_count INT;
  rate_active INT;
BEGIN
  -- Check active thresholds
  SELECT COUNT(*) INTO threshold_active
  FROM economic_nexus_thresholds
  WHERE effective_to IS NULL;

  -- Count revenue-only thresholds
  SELECT COUNT(*) INTO threshold_revenue_only
  FROM economic_nexus_thresholds
  WHERE effective_to IS NULL
    AND threshold_type = 'revenue';

  -- Count 2026 tax rate records
  SELECT COUNT(*) INTO rate_2026_count
  FROM tax_rates
  WHERE effective_from = '2026-01-01';

  -- Count all active rate records
  SELECT COUNT(*) INTO rate_active
  FROM tax_rates
  WHERE effective_to IS NULL;

  RAISE NOTICE 'Migration 049 Verification:';
  RAISE NOTICE '  Active nexus thresholds: % (expected 47)', threshold_active;
  RAISE NOTICE '  Revenue-only thresholds: % (expected ~32)', threshold_revenue_only;
  RAISE NOTICE '  2026 tax rate records: % (expected 46)', rate_2026_count;
  RAISE NOTICE '  Active tax rate records: % (expected 47, includes DC Oct 2026)', rate_active;

  -- Verify the 5 updated states are revenue-only
  IF (SELECT COUNT(*) FROM economic_nexus_thresholds
      WHERE state IN ('IN', 'NC', 'WY', 'UT', 'IL')
        AND effective_to IS NULL
        AND threshold_type = 'revenue') != 5 THEN
    RAISE WARNING 'Expected 5 updated states to be revenue-only';
  END IF;

  -- Verify DC has future rate record
  IF (SELECT COUNT(*) FROM tax_rates
      WHERE state = 'DC' AND effective_from = '2026-10-01') != 1 THEN
    RAISE WARNING 'Expected DC Oct 2026 rate record';
  END IF;
END $$;

COMMIT;
