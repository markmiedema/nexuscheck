-- Add missing fields to state_results table for comprehensive state tracking
ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0;

ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS approaching_threshold BOOLEAN DEFAULT FALSE;

ALTER TABLE state_results
ADD COLUMN IF NOT EXISTS threshold DECIMAL(12,2) DEFAULT 100000;

-- Add comment explaining the fields
COMMENT ON COLUMN state_results.transaction_count IS 'Number of transactions for this state in the analysis period';
COMMENT ON COLUMN state_results.approaching_threshold IS 'True if sales are 90-100% of economic nexus threshold';
COMMENT ON COLUMN state_results.threshold IS 'Economic nexus revenue threshold for this state';
