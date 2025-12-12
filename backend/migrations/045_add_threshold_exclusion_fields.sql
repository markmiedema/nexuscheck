-- ============================================================================
-- Migration 045: Add Threshold Exclusion Fields and Update Lookback Periods
-- ============================================================================
-- Created: 2025-12-12
-- Purpose: Add fields for threshold calculation exclusions and update data
--
-- New fields on economic_nexus_thresholds:
-- - marketplace_excluded: Whether marketplace sales are excluded from threshold
-- - nontaxable_excluded: Whether non-taxable transactions are excluded
-- - resale_excluded: Whether resale/wholesale transactions are excluded
--
-- Also updates lookback_period with more accurate values per state
-- ============================================================================

-- Add new columns
ALTER TABLE economic_nexus_thresholds
ADD COLUMN IF NOT EXISTS marketplace_excluded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nontaxable_excluded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resale_excluded BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN economic_nexus_thresholds.marketplace_excluded IS
'Whether sales through marketplaces (Amazon, Etsy, etc.) are excluded from threshold calculation. If TRUE, marketplace facilitator sales do not count toward the threshold.';

COMMENT ON COLUMN economic_nexus_thresholds.nontaxable_excluded IS
'Whether non-taxable/exempt transactions are excluded from threshold calculation.';

COMMENT ON COLUMN economic_nexus_thresholds.resale_excluded IS
'Whether wholesale/resale transactions are excluded from threshold calculation.';

-- ============================================================================
-- UPDATE LOOKBACK PERIODS (more accurate data)
-- ============================================================================

-- Previous Calendar Year only states
UPDATE economic_nexus_thresholds SET lookback_period = 'Previous Calendar Year'
WHERE state IN ('AL', 'FL', 'MI', 'NM', 'PA', 'RI') AND effective_to IS NULL;

-- Preceding 12 calendar months (rolling)
UPDATE economic_nexus_thresholds SET lookback_period = 'Preceding 12 calendar months'
WHERE state IN ('IL', 'MN', 'MS', 'TN', 'TX') AND effective_to IS NULL;

-- Connecticut: Fixed Sept 30 period
UPDATE economic_nexus_thresholds SET lookback_period = '12-month period ending on September 30'
WHERE state = 'CT' AND effective_to IS NULL;

-- New York: Preceding 4 Sales Tax Quarters
UPDATE economic_nexus_thresholds SET lookback_period = 'Preceding 4 Sales Tax Quarters'
WHERE state = 'NY' AND effective_to IS NULL;

-- Vermont: Preceding 4 calendar Quarters
UPDATE economic_nexus_thresholds SET lookback_period = 'Preceding 4 calendar Quarters'
WHERE state = 'VT' AND effective_to IS NULL;

-- Puerto Rico: Seller's accounting year
UPDATE economic_nexus_thresholds SET lookback_period = 'Seller''s accounting year'
WHERE state = 'PR' AND effective_to IS NULL;

-- Default: Current or Previous Calendar Year (all others)
UPDATE economic_nexus_thresholds SET lookback_period = 'Current or Previous Calendar Year'
WHERE lookback_period IS NULL AND effective_to IS NULL;

-- ============================================================================
-- UPDATE MARKETPLACE EXCLUSIONS
-- States where marketplace sales DO NOT count toward threshold (excluded = TRUE)
-- ============================================================================

UPDATE economic_nexus_thresholds SET marketplace_excluded = TRUE
WHERE state IN (
  'AL',  -- Alabama
  'AZ',  -- Arizona
  'AR',  -- Arkansas
  'CO',  -- Colorado
  'FL',  -- Florida
  'GA',  -- Georgia
  'IL',  -- Illinois
  'IN',  -- Indiana
  'LA',  -- Louisiana
  'ME',  -- Maine
  'MA',  -- Massachusetts
  'MS',  -- Mississippi
  'ND',  -- North Dakota
  'OK',  -- Oklahoma
  'PA',  -- Pennsylvania
  'PR',  -- Puerto Rico
  'TN',  -- Tennessee
  'UT',  -- Utah
  'VA',  -- Virginia
  'WY'   -- Wyoming
) AND effective_to IS NULL;

-- ============================================================================
-- UPDATE NON-TAXABLE EXCLUSIONS
-- States where non-taxable sales DO NOT count toward threshold
-- ============================================================================

UPDATE economic_nexus_thresholds SET nontaxable_excluded = TRUE
WHERE state IN (
  'AR',  -- Arkansas
  'FL',  -- Florida
  'MO',  -- Missouri
  'NM',  -- New Mexico
  'ND',  -- North Dakota
  'OK'   -- Oklahoma
) AND effective_to IS NULL;

-- ============================================================================
-- UPDATE RESALE EXCLUSIONS
-- States where resale/wholesale sales DO NOT count toward threshold
-- ============================================================================

UPDATE economic_nexus_thresholds SET resale_excluded = TRUE
WHERE state IN (
  'AL',  -- Alabama
  'AR',  -- Arkansas
  'CA',  -- California
  'CO',  -- Colorado
  'CT',  -- Connecticut
  'DC',  -- District of Columbia
  'FL',  -- Florida
  'GA',  -- Georgia
  'IL',  -- Illinois
  'LA',  -- Louisiana
  'MN',  -- Minnesota
  'MO',  -- Missouri
  'NE',  -- Nebraska
  'NV',  -- Nevada
  'NM',  -- New Mexico
  'ND',  -- North Dakota
  'OH',  -- Ohio
  'OK',  -- Oklahoma
  'TN',  -- Tennessee
  'VA'   -- Virginia
) AND effective_to IS NULL;

-- ============================================================================
-- Set defaults for states not explicitly listed (FALSE)
-- ============================================================================

UPDATE economic_nexus_thresholds
SET marketplace_excluded = FALSE
WHERE marketplace_excluded IS NULL AND effective_to IS NULL;

UPDATE economic_nexus_thresholds
SET nontaxable_excluded = FALSE
WHERE nontaxable_excluded IS NULL AND effective_to IS NULL;

UPDATE economic_nexus_thresholds
SET resale_excluded = FALSE
WHERE resale_excluded IS NULL AND effective_to IS NULL;

-- ============================================================================
-- Verification query
-- ============================================================================
-- SELECT state, lookback_period, marketplace_excluded, nontaxable_excluded, resale_excluded
-- FROM economic_nexus_thresholds
-- WHERE effective_to IS NULL
-- ORDER BY state;
-- ============================================================================
