-- ============================================================================
-- Migration 034: Create State Penalty Interest Configs Table
-- ============================================================================
-- Created: 2025-12-07
-- Purpose: Add comprehensive penalty and interest configuration system
--          with JSON config for handling complex state-specific rules
--
-- This table replaces the simpler interest_penalty_rates table with a more
-- flexible structure that can handle:
--   - Split-year interest rates (CA, MI, TN, WV)
--   - Monthly vs annual rates (CT, MS, SD)
--   - Tiered penalties by days (WA, IL, TX)
--   - Per-period penalties with caps (AZ, AR, KY)
--   - Per-day penalties (RI)
--   - Combined penalty caps (GA, MS)
--   - Minimums with "greater of" logic (AL, ME, UT)
--   - Historical versioning for VDA calculations
--
-- The old interest_penalty_rates table is preserved for backward compatibility
-- during the transition period.
-- ============================================================================

BEGIN;

-- ============================================================================
-- CREATE NEW TABLE: state_penalty_interest_configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_penalty_interest_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- State reference
  state CHAR(2) NOT NULL REFERENCES states(code) ON DELETE CASCADE,

  -- Effective date for this configuration (for historical lookups)
  effective_date DATE NOT NULL,

  -- Denormalized annual interest rate for quick queries
  -- This is the primary/default rate from the config
  annual_interest_rate DECIMAL(6,4),

  -- Full configuration as structured JSON
  -- See StatePenaltyInterestConfig schema for structure
  config JSONB NOT NULL,

  -- Source and verification metadata
  source_url TEXT,
  verified_at TIMESTAMPTZ,

  -- Additional notes (non-calculable info like "Criminal penalties possible")
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique state + effective_date combinations
  CONSTRAINT unique_state_effective_date UNIQUE(state, effective_date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: Get current config for a state (most recent effective_date <= today)
CREATE INDEX idx_penalty_config_state_date
ON state_penalty_interest_configs(state, effective_date DESC);

-- For historical VDA lookups: find config effective at a specific date
CREATE INDEX idx_penalty_config_lookup
ON state_penalty_interest_configs(state, effective_date);

-- For admin: find configs that need verification
CREATE INDEX idx_penalty_config_unverified
ON state_penalty_interest_configs(verified_at)
WHERE verified_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_penalty_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_penalty_config_updated_at
  BEFORE UPDATE ON state_penalty_interest_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_penalty_config_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Get config for a state as of a specific date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_penalty_interest_config(
  p_state CHAR(2),
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT config INTO v_config
  FROM state_penalty_interest_configs
  WHERE state = p_state
    AND effective_date <= p_as_of_date
  ORDER BY effective_date DESC
  LIMIT 1;

  RETURN v_config;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER FUNCTION: Get annual interest rate for a state as of a specific date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_annual_interest_rate(
  p_state CHAR(2),
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(6,4) AS $$
DECLARE
  v_rate DECIMAL(6,4);
  v_config JSONB;
  v_period JSONB;
BEGIN
  -- Get the config
  SELECT config, annual_interest_rate INTO v_config, v_rate
  FROM state_penalty_interest_configs
  WHERE state = p_state
    AND effective_date <= p_as_of_date
  ORDER BY effective_date DESC
  LIMIT 1;

  -- If no config found, return NULL
  IF v_config IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if there are time-varying periods
  IF v_config->'interest'->'periods' IS NOT NULL THEN
    -- Find the period that contains the as_of_date
    FOR v_period IN SELECT * FROM jsonb_array_elements(v_config->'interest'->'periods')
    LOOP
      IF p_as_of_date >= (v_period->>'start_date')::DATE
         AND p_as_of_date <= (v_period->>'end_date')::DATE THEN
        -- Return the annual rate from this period
        IF v_period->>'annual_rate' IS NOT NULL THEN
          RETURN (v_period->>'annual_rate')::DECIMAL(6,4);
        ELSIF v_period->>'monthly_rate' IS NOT NULL THEN
          -- Convert monthly to annual
          RETURN ((v_period->>'monthly_rate')::DECIMAL(6,4) * 12);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Fall back to the denormalized rate or calculate from monthly
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  ELSIF v_config->'interest'->>'monthly_rate' IS NOT NULL THEN
    RETURN ((v_config->'interest'->>'monthly_rate')::DECIMAL(6,4) * 12);
  ELSIF v_config->'interest'->>'annual_rate' IS NOT NULL THEN
    RETURN (v_config->'interest'->>'annual_rate')::DECIMAL(6,4);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE state_penalty_interest_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read penalty configs (public reference data)
CREATE POLICY "Anyone can read penalty configs"
  ON state_penalty_interest_configs
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete
CREATE POLICY "Service role can manage penalty configs"
  ON state_penalty_interest_configs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE state_penalty_interest_configs IS
'Comprehensive penalty and interest configurations for each state.
Supports complex rules like tiered penalties, split-year rates, and combined caps.
Use get_penalty_interest_config() function for lookups.';

COMMENT ON COLUMN state_penalty_interest_configs.config IS
'JSON config following StatePenaltyInterestConfig schema. Contains interest rates,
late filing/payment penalties, negligence penalties, and other state-specific rules.';

COMMENT ON COLUMN state_penalty_interest_configs.effective_date IS
'Date when this configuration becomes effective. For historical VDA calculations,
query for configs where effective_date <= target_date.';

COMMENT ON COLUMN state_penalty_interest_configs.annual_interest_rate IS
'Denormalized primary annual interest rate for quick queries.
For split-year states, this is the rate for the first period.';

COMMENT ON FUNCTION get_penalty_interest_config IS
'Get the full penalty/interest config for a state as of a specific date.
Returns the most recent config where effective_date <= as_of_date.';

COMMENT ON FUNCTION get_annual_interest_rate IS
'Get the annual interest rate for a state as of a specific date.
Handles split-year rates by finding the correct period.';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table was created
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'state_penalty_interest_configs'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'state_penalty_interest_configs';

-- Check functions
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name IN ('get_penalty_interest_config', 'get_annual_interest_rate');
