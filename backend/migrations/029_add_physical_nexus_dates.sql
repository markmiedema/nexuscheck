-- Migration 029: Add establishment dates for physical nexus triggers
-- Purpose: Store when remote employees and 3PL inventory were established in each state
-- Format: JSONB object mapping state code to date, e.g. {"CA": "2020-01-01", "FL": "2021-06-15"}

-- Add columns for establishment dates
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS remote_employee_state_dates JSONB DEFAULT '{}'::jsonb;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS inventory_3pl_state_dates JSONB DEFAULT '{}'::jsonb;

-- Comments
COMMENT ON COLUMN clients.remote_employee_state_dates IS 'Map of state code to establishment date for remote employees, e.g. {"CA": "2020-01-01"}';
COMMENT ON COLUMN clients.inventory_3pl_state_dates IS 'Map of state code to establishment date for 3PL/FBA inventory, e.g. {"WA": "2021-03-15"}';
