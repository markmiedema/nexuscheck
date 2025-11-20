-- ============================================================================
-- CRM System Migration - Add clients and client_notes tables
-- ============================================================================
-- Created: 2025-11-20
-- Purpose: Add CRM tables for client management and timeline notes
-- ============================================================================

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  industry VARCHAR(100),
  website VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Create client_notes table for timeline-based notes
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(50), -- 'discovery', 'call', 'email', 'meeting', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for client_notes table
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON client_notes(created_at DESC);

-- Add client_id column to analyses table to link analyses to clients
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for client_id in analyses table
CREATE INDEX IF NOT EXISTS idx_analyses_client_id ON analyses(client_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN analyses.client_id IS 'Optional link to a client in the CRM system';
