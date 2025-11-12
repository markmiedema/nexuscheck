-- Add VDA (Voluntary Disclosure Agreement) columns to analyses table
-- VDA allows businesses to voluntarily report uncollected taxes with reduced penalties

-- Add VDA columns to analyses table
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS vda_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vda_selected_states TEXT[];

-- Add VDA calculations to state_results
ALTER TABLE state_results
  ADD COLUMN IF NOT EXISTS vda_penalty_waived DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vda_interest_waived DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vda_total_savings DECIMAL(12,2) DEFAULT 0;

-- Add helpful comments
COMMENT ON COLUMN analyses.vda_enabled IS 'Whether VDA scenario is active for this analysis';
COMMENT ON COLUMN analyses.vda_selected_states IS 'Array of state codes included in VDA';
COMMENT ON COLUMN state_results.vda_penalty_waived IS 'Amount of penalties waived under VDA';
COMMENT ON COLUMN state_results.vda_interest_waived IS 'Amount of interest waived under VDA (rare)';
COMMENT ON COLUMN state_results.vda_total_savings IS 'Total savings from VDA for this state';
