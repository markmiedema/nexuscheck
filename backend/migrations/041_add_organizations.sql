-- ============================================================================
-- Multi-Tenancy: Organizations and Team Members
-- ============================================================================
-- Created: 2025-12-09
-- Purpose: Add organization-based multi-tenancy for team collaboration
-- Phase: 1.4 Platform Foundation
--
-- This migration:
-- 1. Creates organizations table
-- 2. Creates organization_members table (team management)
-- 3. Adds organization_id to clients, analyses, engagements
-- 4. Migrates existing users to own organizations (as owner)
-- 5. Updates RLS policies for organization-based access
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE, -- URL-friendly identifier (e.g., "smith-tax")

  -- Ownership
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Billing & Subscription (placeholders for future)
  billing_email VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'past_due', 'cancelled'

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "portal_branding": {
  --     "logo_url": null,
  --     "primary_color": "#3b82f6",
  --     "company_name": "...",
  --     "support_email": "..."
  --   },
  --   "report_branding": {
  --     "logo_url": null,
  --     "company_name": "...",
  --     "footer_text": "..."
  --   }
  -- }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- PART 2: CREATE ORGANIZATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for pending invites

  -- Role within organization
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  -- 'owner'  : Full access + billing + delete org
  -- 'admin'  : Full access + team management
  -- 'staff'  : Assigned clients/projects only
  -- 'viewer' : Read-only access

  -- Invitation tracking
  invited_email VARCHAR(255), -- Email for pending invites (before user accepts)
  invited_by_user_id UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  -- Activity tracking
  last_active_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'staff', 'viewer')),
  CONSTRAINT unique_org_member UNIQUE (organization_id, user_id),
  CONSTRAINT unique_org_invite UNIQUE (organization_id, invited_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(organization_id, role);

-- ============================================================================
-- PART 3: ADD organization_id TO EXISTING TABLES
-- ============================================================================

-- Add organization_id to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

-- Add organization_id to analyses table
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_analyses_organization ON analyses(organization_id);

-- Add organization_id to engagements table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagements') THEN
    ALTER TABLE engagements
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_engagements_organization ON engagements(organization_id);
  END IF;
END $$;

-- Add organization_id to client_notes table
ALTER TABLE client_notes
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_client_notes_organization ON client_notes(organization_id);

-- ============================================================================
-- PART 4: MIGRATE EXISTING USERS TO ORGANIZATIONS
-- ============================================================================

-- Create an organization for each existing user in the users table
-- They become the owner of their organization
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
BEGIN
  FOR user_record IN
    SELECT id, email, company_name
    FROM users
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_members om WHERE om.user_id = users.id
    )
  LOOP
    -- Create organization
    INSERT INTO organizations (
      name,
      slug,
      owner_user_id,
      billing_email
    ) VALUES (
      COALESCE(user_record.company_name, split_part(user_record.email, '@', 1) || '''s Agency'),
      LOWER(REGEXP_REPLACE(
        COALESCE(user_record.company_name, split_part(user_record.email, '@', 1)),
        '[^a-zA-Z0-9]+', '-', 'g'
      )) || '-' || SUBSTRING(user_record.id::text, 1, 8),
      user_record.id,
      user_record.email
    )
    RETURNING id INTO new_org_id;

    -- Add user as owner member
    INSERT INTO organization_members (
      organization_id,
      user_id,
      role,
      accepted_at
    ) VALUES (
      new_org_id,
      user_record.id,
      'owner',
      NOW()
    );

    -- Update user's clients to belong to this org
    UPDATE clients
    SET organization_id = new_org_id
    WHERE user_id = user_record.id
      AND organization_id IS NULL;

    -- Update user's analyses to belong to this org
    UPDATE analyses
    SET organization_id = new_org_id
    WHERE user_id = user_record.id
      AND organization_id IS NULL;

    -- Update user's client_notes to belong to this org
    UPDATE client_notes
    SET organization_id = new_org_id
    WHERE user_id = user_record.id
      AND organization_id IS NULL;

  END LOOP;
END $$;

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin or owner of organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_org_role(org_id UUID)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 6: ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 7: RLS POLICIES FOR ORGANIZATIONS
-- ============================================================================

-- Organizations: Users can view orgs they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (is_org_member(id));

-- Organizations: Only owner can update
CREATE POLICY "Org owner can update organization"
  ON organizations
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Organizations: Only owner can delete
CREATE POLICY "Org owner can delete organization"
  ON organizations
  FOR DELETE
  USING (owner_user_id = auth.uid());

-- Organizations: Authenticated users can create (they become owner)
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- ============================================================================
-- PART 8: RLS POLICIES FOR ORGANIZATION MEMBERS
-- ============================================================================

-- Members: Can view members of orgs they belong to
CREATE POLICY "Users can view org members"
  ON organization_members
  FOR SELECT
  USING (is_org_member(organization_id));

-- Members: Admin+ can insert new members
CREATE POLICY "Admins can add org members"
  ON organization_members
  FOR INSERT
  WITH CHECK (is_org_admin(organization_id));

-- Members: Admin+ can update members (except promoting above own level)
CREATE POLICY "Admins can update org members"
  ON organization_members
  FOR UPDATE
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- Members: Admin+ can remove members
CREATE POLICY "Admins can remove org members"
  ON organization_members
  FOR DELETE
  USING (is_org_admin(organization_id));

-- ============================================================================
-- PART 9: UPDATE EXISTING RLS POLICIES FOR ORGANIZATION-BASED ACCESS
-- ============================================================================

-- Drop existing client policies
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- New org-based client policies
CREATE POLICY "Users can view org clients"
  ON clients
  FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Users can insert org clients"
  ON clients
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Users can update org clients"
  ON clients
  FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_organization_ids())
  )
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Admins can delete org clients"
  ON clients
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Drop existing analyses policies
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can create own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;

-- New org-based analyses policies
CREATE POLICY "Users can view org analyses"
  ON analyses
  FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR organization_id IS NULL AND user_id = auth.uid() -- Backward compat
  );

CREATE POLICY "Users can insert org analyses"
  ON analyses
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
    OR organization_id IS NULL AND user_id = auth.uid()
  );

CREATE POLICY "Users can update org analyses"
  ON analyses
  FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR organization_id IS NULL AND user_id = auth.uid()
  )
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
    OR organization_id IS NULL AND user_id = auth.uid()
  );

CREATE POLICY "Admins can delete org analyses"
  ON analyses
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR organization_id IS NULL AND user_id = auth.uid()
  );

-- Update client_notes policies
DROP POLICY IF EXISTS "Users can view client notes" ON client_notes;
DROP POLICY IF EXISTS "Users can insert client notes" ON client_notes;
DROP POLICY IF EXISTS "Users can update client notes" ON client_notes;
DROP POLICY IF EXISTS "Users can delete client notes" ON client_notes;

CREATE POLICY "Users can view org client notes"
  ON client_notes
  FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Users can insert org client notes"
  ON client_notes
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Users can update own client notes"
  ON client_notes
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT get_user_organization_ids())
  );

CREATE POLICY "Users can delete own client notes"
  ON client_notes
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT get_user_organization_ids())
  );

-- ============================================================================
-- PART 10: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- WHAT THIS MIGRATION DOES:
-- 1. Creates organizations table with settings JSONB for branding
-- 2. Creates organization_members table for team collaboration
-- 3. Adds organization_id to clients, analyses, client_notes
-- 4. Auto-migrates existing users to their own organization (as owner)
-- 5. Creates helper functions for org membership checks
-- 6. Updates RLS policies from user_id-based to org-based
--
-- ROLLBACK (if needed):
-- DROP TABLE IF EXISTS organization_members CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;
-- ALTER TABLE clients DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE analyses DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE client_notes DROP COLUMN IF EXISTS organization_id;
-- (Then re-apply old RLS policies from migration 002)
--
-- ============================================================================
