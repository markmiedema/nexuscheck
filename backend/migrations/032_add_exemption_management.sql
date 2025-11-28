-- ============================================================================
-- Migration 032: Add Exemption Management
-- ============================================================================
-- Created: 2024-11-28
-- Purpose: Add columns for user-controlled exemption marking and audit history
--
-- Features:
--   1. Exemption metadata on sales_transactions (reason, notes, who/when)
--   2. Full audit history table for compliance tracking
--   3. Support for partial exemptions and custom "other" reasons
-- ============================================================================

BEGIN;

-- ============================================================================
-- Part 1: Add exemption metadata columns to sales_transactions
-- ============================================================================

-- Exemption reason (predefined values)
-- Values: 'resale_certificate', 'government_nonprofit', 'product_exempt',
--         'manufacturing_exemption', 'agricultural_exemption', 'other'
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS exemption_reason VARCHAR(100);

-- Custom reason text when exemption_reason = 'other'
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS exemption_reason_other VARCHAR(255);

-- User notes for their records
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS exemption_note TEXT;

-- When the exemption was marked (NULL if not user-marked)
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS exemption_marked_at TIMESTAMPTZ;

-- Who marked the exemption (NULL if from original CSV import)
ALTER TABLE sales_transactions
ADD COLUMN IF NOT EXISTS exemption_marked_by UUID;

-- Add comment for documentation
COMMENT ON COLUMN sales_transactions.exemption_reason IS
'Predefined exemption reason: resale_certificate, government_nonprofit, product_exempt, manufacturing_exemption, agricultural_exemption, other';

COMMENT ON COLUMN sales_transactions.exemption_reason_other IS
'Custom reason text when exemption_reason = other';

COMMENT ON COLUMN sales_transactions.exemption_marked_at IS
'Timestamp when user marked this transaction as exempt (NULL if from CSV import)';

-- ============================================================================
-- Part 2: Create exemption audit log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS exemption_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to analysis and transaction
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,

  -- Action type: 'created', 'updated', 'removed'
  action VARCHAR(20) NOT NULL,

  -- What changed - before values (NULL for 'created' action)
  exempt_amount_before DECIMAL(15,2),
  reason_before VARCHAR(100),
  reason_other_before VARCHAR(255),
  note_before TEXT,

  -- What changed - after values (NULL for 'removed' action)
  exempt_amount_after DECIMAL(15,2),
  reason_after VARCHAR(100),
  reason_other_after VARCHAR(255),
  note_after TEXT,

  -- Who and when
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'removed'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_exemption_audit_analysis
ON exemption_audit_log(analysis_id);

CREATE INDEX IF NOT EXISTS idx_exemption_audit_transaction
ON exemption_audit_log(analysis_id, transaction_id);

CREATE INDEX IF NOT EXISTS idx_exemption_audit_changed_at
ON exemption_audit_log(changed_at DESC);

-- Add comment for documentation
COMMENT ON TABLE exemption_audit_log IS
'Audit trail for all exemption changes. Tracks who changed what and when for compliance.';

-- ============================================================================
-- Part 3: Row Level Security for audit log
-- ============================================================================

-- Enable RLS
ALTER TABLE exemption_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their own analyses
CREATE POLICY exemption_audit_log_select_policy ON exemption_audit_log
  FOR SELECT
  USING (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only insert audit logs for their own analyses
CREATE POLICY exemption_audit_log_insert_policy ON exemption_audit_log
  FOR INSERT
  WITH CHECK (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Part 4: Create helper function for audit logging
-- ============================================================================

CREATE OR REPLACE FUNCTION log_exemption_change(
  p_analysis_id UUID,
  p_transaction_id VARCHAR(255),
  p_action VARCHAR(20),
  p_exempt_amount_before DECIMAL(15,2),
  p_exempt_amount_after DECIMAL(15,2),
  p_reason_before VARCHAR(100),
  p_reason_after VARCHAR(100),
  p_reason_other_before VARCHAR(255),
  p_reason_other_after VARCHAR(255),
  p_note_before TEXT,
  p_note_after TEXT,
  p_changed_by UUID
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO exemption_audit_log (
    analysis_id, transaction_id, action,
    exempt_amount_before, exempt_amount_after,
    reason_before, reason_after,
    reason_other_before, reason_other_after,
    note_before, note_after,
    changed_by
  ) VALUES (
    p_analysis_id, p_transaction_id, p_action,
    p_exempt_amount_before, p_exempt_amount_after,
    p_reason_before, p_reason_after,
    p_reason_other_before, p_reason_other_after,
    p_note_before, p_note_after,
    p_changed_by
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  col_count INT;
  table_exists BOOLEAN;
BEGIN
  -- Check new columns on sales_transactions
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'sales_transactions'
  AND column_name IN ('exemption_reason', 'exemption_reason_other', 'exemption_note', 'exemption_marked_at', 'exemption_marked_by');

  IF col_count = 5 THEN
    RAISE NOTICE 'Migration 032: All 5 new columns added to sales_transactions';
  ELSE
    RAISE WARNING 'Migration 032: Expected 5 columns, found %', col_count;
  END IF;

  -- Check audit table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'exemption_audit_log'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE 'Migration 032: exemption_audit_log table created successfully';
  ELSE
    RAISE WARNING 'Migration 032: exemption_audit_log table NOT created';
  END IF;
END $$;

COMMIT;
