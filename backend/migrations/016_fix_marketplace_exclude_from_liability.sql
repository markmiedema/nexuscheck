-- ============================================================================
-- Fix marketplace_facilitator_rules: exclude_from_liability should be TRUE
-- ============================================================================
-- Created: 2025-01-13
-- Purpose: Correct the exclude_from_liability field for all states with MF laws
--
-- Background:
-- Nearly all states with marketplace facilitator laws require the marketplace
-- (Amazon, Etsy, eBay, etc.) to collect and remit sales tax on behalf of sellers.
-- This means sellers do NOT owe tax on marketplace sales in these states.
--
-- Marketplace sales:
-- - DO count toward establishing economic nexus thresholds (count_toward_threshold = true)
-- - DO NOT create tax liability for the seller (exclude_from_liability = true)
--
-- Rare Exceptions (still setting to true as default):
-- - Maryland: Seller can request waiver to collect themselves (requires special agreement)
-- - Minnesota: Written agreement possible for seller to collect (requires permit & filing)
-- - Alaska: No statewide sales tax, local jurisdictions vary
--
-- For our tool, we default to exclude_from_liability = true since the exceptions
-- require special agreements that sellers would be aware of.
-- ============================================================================

-- Update all active MF rules to exclude marketplace sales from liability
UPDATE marketplace_facilitator_rules
SET exclude_from_liability = true
WHERE effective_to IS NULL
  AND has_mf_law = true;

-- Verify the update
SELECT
    state,
    has_mf_law,
    count_toward_threshold,
    exclude_from_liability,
    effective_from
FROM marketplace_facilitator_rules
WHERE effective_to IS NULL
  AND has_mf_law = true
ORDER BY state;
