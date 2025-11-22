-- ============================================================================
-- Engagement System Migration - The "Gatekeeper Model"
-- ============================================================================
-- Created: 2025-11-22
-- Purpose: Add engagement hierarchy and discovery profile for client lifecycle
--
-- Architecture:
--   Client (Prospect → Scoping → Active)
--     └── Discovery Profile (structured business data)
--     └── Engagement(s) (Draft → Sent → Signed → Archived)
--           └── Project(s) / Analyses
-- ============================================================================

-- ============================================================================
-- PART 1: Add Discovery Profile fields to clients table
-- ============================================================================
-- These fields capture the structured data from the Discovery Meeting

-- Lifecycle status
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(20)
  DEFAULT 'prospect'
  CHECK (lifecycle_status IN ('prospect', 'scoping', 'active', 'inactive', 'churned'));

COMMENT ON COLUMN clients.lifecycle_status IS 'Client lifecycle stage: prospect (new), scoping (discovery done), active (signed engagement), inactive (paused), churned (lost)';

-- Sales Channels (from Discovery)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.channels IS 'Sales channels array: ["dtc", "amazon_fba", "amazon_fbm", "wholesale", "retail", "marketplace_other"]';

-- Product Types (from Discovery)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS product_types JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.product_types IS 'Product type array: ["physical_goods", "digital_goods", "saas", "services", "mixed"]';

-- Tech Stack / Systems (from Discovery)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.tech_stack IS 'Technology systems array: ["shopify", "woocommerce", "bigcommerce", "amazon", "netsuite", "quickbooks", "xero", "stripe", "other"]';

-- Physical Presence Indicators (Critical for Nexus - "Silent Killers")
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_remote_employees BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS remote_employee_states JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.has_remote_employees IS 'Whether client has remote employees (triggers physical nexus)';
COMMENT ON COLUMN clients.remote_employee_states IS 'Array of state codes where remote employees are located';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_inventory_3pl BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inventory_3pl_states JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.has_inventory_3pl IS 'Whether client uses 3PL/FBA inventory storage (triggers physical nexus)';
COMMENT ON COLUMN clients.inventory_3pl_states IS 'Array of state codes where inventory is stored';

-- Volume Indicators (for scoping/pricing)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimated_annual_revenue VARCHAR(50);
COMMENT ON COLUMN clients.estimated_annual_revenue IS 'Revenue range: "under_100k", "100k_500k", "500k_1m", "1m_5m", "5m_10m", "over_10m"';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS transaction_volume VARCHAR(20);
COMMENT ON COLUMN clients.transaction_volume IS 'Transaction volume: "low" (<1000/yr), "medium" (1000-10000/yr), "high" (>10000/yr)';

-- Current Filing Status
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_registration_count INTEGER DEFAULT 0;
COMMENT ON COLUMN clients.current_registration_count IS 'Number of states client is currently registered in';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS registered_states JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN clients.registered_states IS 'Array of state codes where client is currently registered';

-- Discovery completion tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS discovery_completed_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS discovery_notes TEXT;
COMMENT ON COLUMN clients.discovery_completed_at IS 'When discovery profile was completed';
COMMENT ON COLUMN clients.discovery_notes IS 'Freeform notes from discovery meeting';

-- ============================================================================
-- PART 2: Create engagements table (The Container)
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'signed', 'archived', 'cancelled')),

  -- Scope definition (structured for feature gating)
  scope_config JSONB DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "services": ["nexus_study", "vda_remediation", "state_registration", "monthly_compliance", "audit_defense"],
  --   "tier": "implementation" | "compliance" | "advisory",
  --   "pricing_model": "fixed_fee" | "hourly" | "subscription",
  --   "authorized_states": ["CA", "NY", "TX"], -- limits scope creep
  --   "estimated_fee": 5000.00,
  --   "retainer_monthly": null
  -- }

  -- Human-readable summary
  scope_summary TEXT,

  -- Document tracking
  document_url TEXT, -- Link to signed PDF in storage

  -- Timeline
  sent_at TIMESTAMP,
  signed_at TIMESTAMP,
  effective_date DATE, -- When engagement begins
  expiration_date DATE, -- For time-limited engagements

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for engagements
CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_user_id ON engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_created_at ON engagements(created_at DESC);

-- Comments
COMMENT ON TABLE engagements IS 'Engagement letters/contracts - the container for projects. Must be signed before projects can be created.';
COMMENT ON COLUMN engagements.scope_config IS 'Structured scope configuration for feature gating and authorized services';

-- ============================================================================
-- PART 3: Add engagement_id to analyses table
-- ============================================================================

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_engagement_id ON analyses(engagement_id);
COMMENT ON COLUMN analyses.engagement_id IS 'Parent engagement that authorizes this analysis/project';

-- ============================================================================
-- PART 4: Row Level Security for engagements
-- ============================================================================

ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own engagements
DROP POLICY IF EXISTS engagements_user_isolation ON engagements;
CREATE POLICY engagements_user_isolation ON engagements
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PART 5: Legacy Data Migration - Create container engagements for orphan analyses
-- ============================================================================

-- This creates a "Legacy Import" engagement for each client that has analyses
-- without an engagement_id, preserving the data hierarchy

DO $$
DECLARE
  client_rec RECORD;
  new_engagement_id UUID;
  oldest_analysis_date TIMESTAMP;
BEGIN
  -- Find all clients that have analyses without engagement_id
  -- Get user_id from the clients table (analyses doesn't have user_id directly)
  FOR client_rec IN
    SELECT DISTINCT a.client_id, c.user_id
    FROM analyses a
    JOIN clients c ON c.id = a.client_id
    WHERE a.client_id IS NOT NULL
      AND a.engagement_id IS NULL
  LOOP
    -- Get the oldest analysis date for this client
    SELECT MIN(created_at) INTO oldest_analysis_date
    FROM analyses
    WHERE client_id = client_rec.client_id
      AND engagement_id IS NULL;

    -- Create a legacy engagement container
    INSERT INTO engagements (
      client_id,
      user_id,
      title,
      status,
      scope_config,
      scope_summary,
      signed_at,
      effective_date,
      created_at
    ) VALUES (
      client_rec.client_id,
      client_rec.user_id,
      'Legacy Import',
      'signed',
      '{"services": ["nexus_study"], "tier": "implementation", "pricing_model": "fixed_fee", "legacy": true}'::jsonb,
      'Auto-generated container for pre-existing analyses imported before engagement tracking was implemented.',
      oldest_analysis_date,
      oldest_analysis_date::date,
      oldest_analysis_date
    )
    RETURNING id INTO new_engagement_id;

    -- Link all orphan analyses for this client to the new engagement
    UPDATE analyses
    SET engagement_id = new_engagement_id
    WHERE client_id = client_rec.client_id
      AND engagement_id IS NULL;

    RAISE NOTICE 'Created legacy engagement % for client %', new_engagement_id, client_rec.client_id;
  END LOOP;
END $$;

-- ============================================================================
-- PART 6: Update clients with analyses to 'active' status
-- ============================================================================

UPDATE clients
SET lifecycle_status = 'active'
WHERE id IN (
  SELECT DISTINCT client_id
  FROM analyses
  WHERE client_id IS NOT NULL
);

-- ============================================================================
-- PART 7: Trigger to auto-update client lifecycle when engagement signed
-- ============================================================================

CREATE OR REPLACE FUNCTION update_client_lifecycle_on_engagement_signed()
RETURNS TRIGGER AS $$
BEGIN
  -- When engagement is marked as signed, update client to active
  IF NEW.status = 'signed' AND (OLD.status IS NULL OR OLD.status != 'signed') THEN
    UPDATE clients
    SET lifecycle_status = 'active',
        updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_engagement_signed ON engagements;
CREATE TRIGGER trigger_engagement_signed
  AFTER INSERT OR UPDATE OF status ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_client_lifecycle_on_engagement_signed();

-- ============================================================================
-- PART 8: Trigger to update client lifecycle when discovery completed
-- ============================================================================

CREATE OR REPLACE FUNCTION update_client_lifecycle_on_discovery()
RETURNS TRIGGER AS $$
BEGIN
  -- When discovery_completed_at is set, move client to scoping
  IF NEW.discovery_completed_at IS NOT NULL
     AND OLD.discovery_completed_at IS NULL
     AND NEW.lifecycle_status = 'prospect' THEN
    NEW.lifecycle_status := 'scoping';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_discovery_completed ON clients;
CREATE TRIGGER trigger_discovery_completed
  BEFORE UPDATE OF discovery_completed_at ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_lifecycle_on_discovery();
