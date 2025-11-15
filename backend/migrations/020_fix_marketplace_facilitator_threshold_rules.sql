-- ============================================================================
-- Migration 020: Fix Marketplace Facilitator Threshold Rules
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Correct count_toward_threshold based on actual state rules
--
-- RULE CLARIFICATION:
-- - count_toward_threshold: Do MF sales count for ESTABLISHING nexus?
-- - exclude_from_liability: Do MF sales count for YOUR tax liability?
--
-- Most states: MF sales count toward threshold BUT excluded from your liability
-- Exception: 15 states exclude MF sales from threshold calculation entirely
-- ============================================================================

-- First, set ALL states to TRUE (default: MF sales count toward threshold)
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = TRUE
WHERE effective_to IS NULL;

-- Now flip the 15 exception states to FALSE
-- These states exclude marketplace sales from seller's economic nexus calculation

-- Alabama
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AL'
AND effective_to IS NULL;

-- Arizona
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AZ'
AND effective_to IS NULL;

-- Arkansas
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'AR'
AND effective_to IS NULL;

-- Colorado
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'CO'
AND effective_to IS NULL;

-- Florida
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'FL'
AND effective_to IS NULL;

-- Georgia
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'GA'
AND effective_to IS NULL;

-- Louisiana
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'LA'
AND effective_to IS NULL;

-- Maine
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'ME'
AND effective_to IS NULL;

-- Massachusetts
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'MA'
AND effective_to IS NULL;

-- Michigan
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'MI'
AND effective_to IS NULL;

-- New Mexico
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'NM'
AND effective_to IS NULL;

-- Tennessee
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'TN'
AND effective_to IS NULL;

-- Utah
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'UT'
AND effective_to IS NULL;

-- Virginia
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'VA'
AND effective_to IS NULL;

-- Wyoming
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'WY'
AND effective_to IS NULL;

-- Add helpful comment
COMMENT ON COLUMN marketplace_facilitator_rules.count_toward_threshold IS
'Do marketplace facilitator sales count toward economic nexus threshold for individual sellers?

TRUE (36 states): MF sales count toward threshold. If seller has $80k direct + $30k MF = $110k total, they have nexus.
FALSE (15 states): MF sales excluded from seller threshold. If seller has $80k direct + $30k MF, only $80k counts (no nexus).

States where FALSE (15 total):
AL, AR, AZ, CO, FL, GA, LA, MA, ME, MI, NM, TN, UT, VA, WY

Note: exclude_from_liability is separate - almost always TRUE (MF sales not in YOUR liability).';

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
-- FALSE: 15 states
-- TRUE: 36 states (or however many you have data for)
-- ============================================================================
