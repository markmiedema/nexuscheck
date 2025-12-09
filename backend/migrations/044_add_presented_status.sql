-- ============================================================================
-- Migration 044: Add 'presented' status to analyses
-- ============================================================================
-- Purpose: Allow marking completed analyses as "presented" to client
-- This enables tracking the project delivery workflow
-- ============================================================================

-- Step 1: Drop the existing status constraint
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS valid_status;

-- Step 2: Add the new constraint including 'presented' status
ALTER TABLE analyses ADD CONSTRAINT valid_status CHECK (
  status IN ('draft', 'processing', 'complete', 'error', 'presented')
);

-- Step 3: Add presented_at timestamp column
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS presented_at TIMESTAMP;

-- Step 4: Add index for presented analyses (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_analyses_presented ON analyses(presented_at)
  WHERE status = 'presented';

-- ============================================================================
-- Notes:
-- - Status workflow: draft -> processing -> complete -> presented
-- - presented_at tracks when the report was marked as delivered to client
-- - Only 'complete' analyses can be marked as 'presented'
-- ============================================================================
