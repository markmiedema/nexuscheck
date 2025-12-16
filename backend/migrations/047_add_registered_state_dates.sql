-- Migration: Add registered_state_dates to clients table
-- This adds registration dates per state, similar to remote_employee_state_dates and inventory_3pl_state_dates

-- Add the JSONB column to store state -> registration date mapping
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS registered_state_dates JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN clients.registered_state_dates IS 'Map of state code to registration date (ISO format string, e.g., {"CA": "2022-03-15", "TX": "2023-01-01"})';

-- Create index for querying by registration dates
CREATE INDEX IF NOT EXISTS idx_clients_registered_state_dates ON clients USING gin (registered_state_dates);
