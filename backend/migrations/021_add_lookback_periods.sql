-- ============================================================================
-- Migration 021: Add Lookback Periods for All States
-- ============================================================================
-- Created: 2025-01-14
-- Purpose: Populate lookback_period column with correct values for each state
--
-- Background:
-- - Column was added in migration 010 but never populated
-- - Most states use "Current or Previous Calendar Year" (default)
-- - NY, VT use quarterly lookback
-- - CT uses fixed Sept 30 period
-- - Some states use rolling 12 months
-- ============================================================================

-- Set default for all states first
UPDATE economic_nexus_thresholds
SET lookback_period = 'Current or Previous Calendar Year'
WHERE effective_to IS NULL AND lookback_period IS NULL;

-- ============================================================================
-- States with Quarterly Lookback (2 states)
-- ============================================================================

-- New York: Preceding 4 Sales Tax Quarters
UPDATE economic_nexus_thresholds
SET lookback_period = 'Preceding 4 Sales Tax Quarters'
WHERE state = 'NY' AND effective_to IS NULL;

-- Vermont: Preceding 4 Calendar Quarters
UPDATE economic_nexus_thresholds
SET lookback_period = 'Preceding 4 Sales Tax Quarters'
WHERE state = 'VT' AND effective_to IS NULL;

-- ============================================================================
-- States with Fixed Period Ending Sept 30
-- ============================================================================

-- Connecticut: 12-month period ending on September 30
UPDATE economic_nexus_thresholds
SET lookback_period = '12-month period ending on September 30'
WHERE state = 'CT' AND effective_to IS NULL;

-- ============================================================================
-- States with Rolling 12 Months (documented for future)
-- ============================================================================
-- Note: These states technically use rolling 12-month lookback
-- For now, "Current or Previous Calendar Year" is acceptable approximation
-- Consider updating these in future for exact accuracy:
--
-- Potential rolling states (need verification):
-- - Alabama
-- - California
-- - Texas
-- ============================================================================

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run after migration to verify:
--
-- SELECT lookback_period, COUNT(*) as state_count
-- FROM economic_nexus_thresholds
-- WHERE effective_to IS NULL
-- GROUP BY lookback_period
-- ORDER BY state_count DESC;
--
-- Expected results:
-- - "Current or Previous Calendar Year": 42+ states (most common)
-- - "Preceding 4 Sales Tax Quarters": 2 states (NY, VT)
-- - "12-month period ending on September 30": 1 state (CT)
--
-- List specific states by lookback type:
-- SELECT state, lookback_period
-- FROM economic_nexus_thresholds
-- WHERE effective_to IS NULL
-- ORDER BY lookback_period, state;
-- ============================================================================
