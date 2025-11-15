-- ============================================================================
-- Migration 020b: Update Marketplace Facilitator Threshold Rules (VERIFIED)
-- ============================================================================
-- Created: 2025-01-14 (Updated after verification)
-- Purpose: Correct count_toward_threshold based on Avalara + Tax Foundation sources
--
-- SOURCES VERIFIED:
-- - Avalara State-by-State Guide (2024/2025)
-- - Tax Foundation Economic Nexus Report
-- - Individual state DOR websites
--
-- IMPORTANT: Run this AFTER 020 to correct any errors
-- ============================================================================

-- Start fresh: Set ALL states to TRUE (default)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = TRUE
WHERE effective_to IS NULL;

-- Now set the 17 VERIFIED exception states to FALSE
-- These states exclude marketplace sales from SELLER'S economic nexus calculation

-- Alabama (Verified: Avalara, state DOR)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AL' AND effective_to IS NULL;

-- Arizona (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AZ' AND effective_to IS NULL;

-- Arkansas (Verified: Avalara)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AR' AND effective_to IS NULL;

-- Colorado (Verified: Avalara, Tax Foundation)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'CO' AND effective_to IS NULL;

-- Florida (Verified: Avalara, state DOR)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'FL' AND effective_to IS NULL;

-- Georgia (Verified: Avalara, state DOR)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'GA' AND effective_to IS NULL;

-- Illinois (Verified: Avalara)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'IL' AND effective_to IS NULL;

-- Indiana (Verified: Avalara, Tax Foundation, March 2024 update)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'IN' AND effective_to IS NULL;

-- Louisiana (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'LA' AND effective_to IS NULL;

-- Maine (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'ME' AND effective_to IS NULL;

-- Missouri (Verified: Avalara)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'MO' AND effective_to IS NULL;

-- North Dakota (Verified: Avalara)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'ND' AND effective_to IS NULL;

-- Oklahoma (Verified: Avalara)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'OK' AND effective_to IS NULL;

-- Tennessee (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'TN' AND effective_to IS NULL;

-- Utah (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'UT' AND effective_to IS NULL;

-- Virginia (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'VA' AND effective_to IS NULL;

-- Wyoming (Verified: Avalara, Sales Tax Institute)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'WY' AND effective_to IS NULL;

-- ============================================================================
-- REMOVED FROM ORIGINAL LIST (Conflicting sources - need individual verification):
-- - Massachusetts (MA) - Avalara says INCLUDED, Sales Tax Inst says EXCLUDED
-- - Michigan (MI) - Avalara says INCLUDED, Sales Tax Inst says EXCLUDED
-- - New Mexico (NM) - Avalara says INCLUDED, Sales Tax Inst says EXCLUDED
--
-- Default to INCLUDED (TRUE) for these 3 states until verified
-- ============================================================================

-- Update comment with verified count
COMMENT ON COLUMN marketplace_facilitator_rules.count_toward_threshold IS
'Do marketplace facilitator sales count toward economic nexus threshold for individual sellers?

TRUE (34+ states): MF sales count toward threshold. Seller with $80k direct + $30k MF = $110k total → has nexus.
FALSE (17 states): MF sales excluded from seller threshold. Seller with $80k direct + $30k MF → only $80k counts → no nexus.

VERIFIED Exception States (FALSE - 17 total):
AL, AR, AZ, CO, FL, GA, IL, IN, LA, ME, MO, ND, OK, TN, UT, VA, WY

UNVERIFIED (conflicting sources, defaulted to TRUE):
MA, MI, NM - Need individual state DOR verification

Note: exclude_from_liability is separate - almost always TRUE (MF sales not in YOUR liability).

Sources: Avalara State-by-State Guide, Tax Foundation Economic Nexus Report (2024/2025)
Last Verified: 2025-01-14';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run after migration to verify counts:
--
-- SELECT count_toward_threshold, COUNT(*) as state_count
-- FROM marketplace_facilitator_rules
-- WHERE effective_to IS NULL
-- GROUP BY count_toward_threshold;
--
-- Expected results:
-- FALSE: 17 states (verified exceptions)
-- TRUE: 34+ states (includes 3 unverified: MA, MI, NM)
-- ============================================================================

-- ============================================================================
-- TODO: Manual Verification Needed
-- ============================================================================
-- Research these 3 states individually to resolve conflicts:
-- 1. Massachusetts - Check MA DOR website for current policy
-- 2. Michigan - Check MI Treasury website for current policy
-- 3. New Mexico - Check NM Taxation & Revenue Dept website
--
-- Update this migration once verified.
-- ============================================================================
