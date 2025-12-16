-- ============================================================================
-- Migration 046: Add Client Overview and Workflow Fields
-- ============================================================================
-- Created: 2025-12-15
-- Purpose: Support Client Overview feature with stages, next actions, deadlines
--
-- This migration adds:
-- 1. Workflow stage fields to clients and engagements
-- 2. Next action tracking fields
-- 3. Engagement type and milestone tracking
-- 4. intake_items table for unified intake flow (Phase 2 prep)
-- 5. state_assessments table for state worklist (Phase 3 prep)
-- 6. state_actions table for action tracking (Phase 3 prep)
-- 7. deadlines table for practice-wide deadline management (Phase 4 prep)
-- ============================================================================

-- ============================================================================
-- PART 1: ADD WORKFLOW STAGE FIELDS TO ENGAGEMENTS
-- ============================================================================

-- Engagement type (what kind of work)
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS engagement_type VARCHAR(50);
COMMENT ON COLUMN engagements.engagement_type IS 'Type of engagement: nexus_study, vda, registrations, ongoing_compliance, audit_defense, advisory';

-- Workflow stage
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'intake';
COMMENT ON COLUMN engagements.stage IS 'Current workflow stage: intake, data_collection, analysis, recommendations, execution, complete';

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ;
COMMENT ON COLUMN engagements.stage_updated_at IS 'When the stage was last changed';

-- Milestone tracking
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS next_milestone_name VARCHAR(255);
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS next_milestone_date DATE;
COMMENT ON COLUMN engagements.next_milestone_name IS 'Name of the next upcoming milestone';
COMMENT ON COLUMN engagements.next_milestone_date IS 'Due date for the next milestone';

-- Create index for stage queries
CREATE INDEX IF NOT EXISTS idx_engagements_stage ON engagements(stage);
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);

-- ============================================================================
-- PART 2: CREATE INTAKE_ITEMS TABLE
-- ============================================================================
-- Unified table for tracking discovery profile items and data requests

CREATE TABLE IF NOT EXISTS intake_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Item definition
    category VARCHAR(50) NOT NULL,
    -- Categories: business_model, physical_presence, registrations, data_request

    item_key VARCHAR(100) NOT NULL,
    -- Unique key like 'sales_data_2023', 'remote_employees', 'current_registrations'

    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'not_requested',
    -- Statuses: not_requested, requested, received, validated, not_applicable

    -- Assignment & deadlines
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    requested_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,

    -- Uploads (array of file references)
    uploaded_files JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{"url": "...", "filename": "...", "uploaded_at": "...", "uploaded_by": "..."}]

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_intake_category CHECK (category IN ('business_model', 'physical_presence', 'registrations', 'data_request')),
    CONSTRAINT valid_intake_status CHECK (status IN ('not_requested', 'requested', 'received', 'validated', 'not_applicable')),
    CONSTRAINT unique_client_item UNIQUE (client_id, item_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intake_items_client ON intake_items(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_items_engagement ON intake_items(engagement_id);
CREATE INDEX IF NOT EXISTS idx_intake_items_org ON intake_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_items_status ON intake_items(status);
CREATE INDEX IF NOT EXISTS idx_intake_items_due_date ON intake_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_items_category ON intake_items(category);

-- RLS
ALTER TABLE intake_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org intake items"
    ON intake_items FOR SELECT
    USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can insert org intake items"
    ON intake_items FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can update org intake items"
    ON intake_items FOR UPDATE
    USING (organization_id IN (SELECT get_user_organization_ids()))
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can delete org intake items"
    ON intake_items FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE intake_items IS 'Unified intake tracking for discovery profile items and data requests';

-- ============================================================================
-- PART 3: CREATE STATE_ASSESSMENTS TABLE
-- ============================================================================
-- Tracks nexus determination status per state per client

CREATE TABLE IF NOT EXISTS state_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    state CHAR(2) NOT NULL,

    -- Nexus Determination (the "why")
    nexus_status VARCHAR(50) DEFAULT 'unknown',
    -- Statuses: unknown, needs_data, no_nexus, approaching, has_nexus, excluded

    nexus_type VARCHAR(50),
    -- Types: economic, physical, both

    nexus_reasons JSONB DEFAULT '[]'::jsonb,
    -- Array of reasons: ["remote_employee", "inventory", "exceeded_threshold", "marketplace_facilitator"]

    first_exposure_date DATE,
    threshold_percentage DECIMAL(5,2),
    -- e.g., 85.50 = 85.5% of threshold reached

    -- Financials (copied from latest state_results or computed)
    total_sales DECIMAL(12,2),
    estimated_liability DECIMAL(12,2),

    -- Assessment metadata
    assessed_at TIMESTAMPTZ,
    assessed_by UUID REFERENCES users(id),
    confidence_level VARCHAR(20),
    -- Levels: high, medium, low

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_nexus_status CHECK (nexus_status IN ('unknown', 'needs_data', 'no_nexus', 'approaching', 'has_nexus', 'excluded')),
    CONSTRAINT valid_nexus_type CHECK (nexus_type IS NULL OR nexus_type IN ('economic', 'physical', 'both')),
    CONSTRAINT valid_confidence CHECK (confidence_level IS NULL OR confidence_level IN ('high', 'medium', 'low')),
    CONSTRAINT unique_client_state UNIQUE (client_id, state)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_state_assessments_client ON state_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_state_assessments_engagement ON state_assessments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_state_assessments_analysis ON state_assessments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_state_assessments_org ON state_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_state_assessments_nexus_status ON state_assessments(nexus_status);
CREATE INDEX IF NOT EXISTS idx_state_assessments_state ON state_assessments(state);

-- RLS
ALTER TABLE state_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org state assessments"
    ON state_assessments FOR SELECT
    USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can insert org state assessments"
    ON state_assessments FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can update org state assessments"
    ON state_assessments FOR UPDATE
    USING (organization_id IN (SELECT get_user_organization_ids()))
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can delete org state assessments"
    ON state_assessments FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE state_assessments IS 'Nexus determination status per state per client';

-- ============================================================================
-- PART 4: CREATE STATE_ACTIONS TABLE
-- ============================================================================
-- Tracks remediation actions (Register, VDA, etc.) for each state assessment

CREATE TABLE IF NOT EXISTS state_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_assessment_id UUID NOT NULL REFERENCES state_assessments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Action definition
    action_type VARCHAR(50) NOT NULL,
    -- Types: register, vda, file_back_returns, marketplace_exception, monitor, no_action

    action_status VARCHAR(50) DEFAULT 'not_started',
    -- Statuses: not_started, in_progress, blocked, complete

    -- Blocking info
    blocked_reason TEXT,
    blocked_since DATE,

    -- Assignment
    assigned_to UUID REFERENCES users(id),

    -- Deadlines
    target_date DATE,
    completed_at TIMESTAMPTZ,

    -- Strategy notes
    strategy_notes TEXT,

    -- Outcome tracking
    registration_effective_date DATE,
    vda_submission_date DATE,
    vda_approval_date DATE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_action_type CHECK (action_type IN ('register', 'vda', 'file_back_returns', 'marketplace_exception', 'monitor', 'no_action')),
    CONSTRAINT valid_action_status CHECK (action_status IN ('not_started', 'in_progress', 'blocked', 'complete'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_state_actions_assessment ON state_actions(state_assessment_id);
CREATE INDEX IF NOT EXISTS idx_state_actions_org ON state_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_state_actions_status ON state_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_state_actions_target_date ON state_actions(target_date) WHERE target_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_state_actions_assigned ON state_actions(assigned_to) WHERE assigned_to IS NOT NULL;

-- RLS
ALTER TABLE state_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org state actions"
    ON state_actions FOR SELECT
    USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can insert org state actions"
    ON state_actions FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can update org state actions"
    ON state_actions FOR UPDATE
    USING (organization_id IN (SELECT get_user_organization_ids()))
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Admins can delete org state actions"
    ON state_actions FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

COMMENT ON TABLE state_actions IS 'Remediation actions for state assessments';

-- ============================================================================
-- PART 5: CREATE STATE_ACTION_TASKS TABLE
-- ============================================================================
-- Task checklists for each state action

CREATE TABLE IF NOT EXISTS state_action_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_action_id UUID NOT NULL REFERENCES state_actions(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(50) DEFAULT 'pending',
    -- Statuses: pending, in_progress, complete, skipped

    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,

    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_state_action_tasks_action ON state_action_tasks(state_action_id);
CREATE INDEX IF NOT EXISTS idx_state_action_tasks_status ON state_action_tasks(status);
CREATE INDEX IF NOT EXISTS idx_state_action_tasks_due ON state_action_tasks(due_date) WHERE due_date IS NOT NULL;

-- RLS (inherits from parent state_action via join)
ALTER TABLE state_action_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org state action tasks"
    ON state_action_tasks FOR SELECT
    USING (
        state_action_id IN (
            SELECT id FROM state_actions
            WHERE organization_id IN (SELECT get_user_organization_ids())
        )
    );

CREATE POLICY "Users can insert org state action tasks"
    ON state_action_tasks FOR INSERT
    WITH CHECK (
        state_action_id IN (
            SELECT id FROM state_actions
            WHERE organization_id IN (SELECT get_user_organization_ids())
        )
    );

CREATE POLICY "Users can update org state action tasks"
    ON state_action_tasks FOR UPDATE
    USING (
        state_action_id IN (
            SELECT id FROM state_actions
            WHERE organization_id IN (SELECT get_user_organization_ids())
        )
    );

CREATE POLICY "Users can delete org state action tasks"
    ON state_action_tasks FOR DELETE
    USING (
        state_action_id IN (
            SELECT id FROM state_actions
            WHERE organization_id IN (SELECT get_user_organization_ids())
        )
    );

COMMENT ON TABLE state_action_tasks IS 'Task checklists for state remediation actions';

-- ============================================================================
-- PART 6: CREATE DEADLINES TABLE
-- ============================================================================
-- Practice-wide deadline management

CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Linkage (at least one should be set)
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    state_action_id UUID REFERENCES state_actions(id) ON DELETE CASCADE,

    -- Deadline info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_type VARCHAR(50) NOT NULL,
    -- Types: milestone, filing, registration, vda, data_request, presentation, other

    due_date DATE NOT NULL,

    -- State-specific (optional)
    state CHAR(2),

    -- Status
    status VARCHAR(50) DEFAULT 'upcoming',
    -- Statuses: upcoming, due_soon, overdue, complete, cancelled

    completed_at TIMESTAMPTZ,

    -- Reminders
    reminder_days INTEGER[] DEFAULT '{7, 3, 1}',
    last_reminder_sent_at TIMESTAMPTZ,

    -- Recurrence (for filing deadlines)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),
    -- Patterns: monthly, quarterly, annual

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_deadline_type CHECK (deadline_type IN ('milestone', 'filing', 'registration', 'vda', 'data_request', 'presentation', 'other')),
    CONSTRAINT valid_deadline_status CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'complete', 'cancelled')),
    CONSTRAINT valid_recurrence CHECK (recurrence_pattern IS NULL OR recurrence_pattern IN ('monthly', 'quarterly', 'annual'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_org ON deadlines(organization_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_client ON deadlines(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deadlines_engagement ON deadlines(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON deadlines(status);
CREATE INDEX IF NOT EXISTS idx_deadlines_state ON deadlines(state) WHERE state IS NOT NULL;

-- Compound index for common query: upcoming deadlines for org
CREATE INDEX IF NOT EXISTS idx_deadlines_org_upcoming ON deadlines(organization_id, due_date)
    WHERE status IN ('upcoming', 'due_soon');

-- RLS
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org deadlines"
    ON deadlines FOR SELECT
    USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can insert org deadlines"
    ON deadlines FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can update org deadlines"
    ON deadlines FOR UPDATE
    USING (organization_id IN (SELECT get_user_organization_ids()))
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can delete org deadlines"
    ON deadlines FOR DELETE
    USING (organization_id IN (SELECT get_user_organization_ids()));

COMMENT ON TABLE deadlines IS 'Practice-wide deadline management for all client work';

-- ============================================================================
-- PART 7: CREATE DELIVERABLES TABLE
-- ============================================================================
-- Track engagement deliverables (memos, reports, presentations)

CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    deliverable_type VARCHAR(50) NOT NULL,
    -- Types: memo, presentation, report, spreadsheet, letter, other

    status VARCHAR(50) DEFAULT 'not_started',
    -- Statuses: not_started, in_progress, review, delivered

    -- File
    file_url TEXT,
    file_name VARCHAR(255),

    -- Tracking
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    delivered_at TIMESTAMPTZ,

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_deliverable_type CHECK (deliverable_type IN ('memo', 'presentation', 'report', 'spreadsheet', 'letter', 'other')),
    CONSTRAINT valid_deliverable_status CHECK (status IN ('not_started', 'in_progress', 'review', 'delivered'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_engagement ON deliverables(engagement_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_org ON deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);

-- RLS
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org deliverables"
    ON deliverables FOR SELECT
    USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can insert org deliverables"
    ON deliverables FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can update org deliverables"
    ON deliverables FOR UPDATE
    USING (organization_id IN (SELECT get_user_organization_ids()))
    WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Users can delete org deliverables"
    ON deliverables FOR DELETE
    USING (organization_id IN (SELECT get_user_organization_ids()));

COMMENT ON TABLE deliverables IS 'Engagement deliverables like memos, reports, and presentations';

-- ============================================================================
-- PART 8: ADD UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger for intake_items
DROP TRIGGER IF EXISTS update_intake_items_updated_at ON intake_items;
CREATE TRIGGER update_intake_items_updated_at
    BEFORE UPDATE ON intake_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for state_assessments
DROP TRIGGER IF EXISTS update_state_assessments_updated_at ON state_assessments;
CREATE TRIGGER update_state_assessments_updated_at
    BEFORE UPDATE ON state_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for state_actions
DROP TRIGGER IF EXISTS update_state_actions_updated_at ON state_actions;
CREATE TRIGGER update_state_actions_updated_at
    BEFORE UPDATE ON state_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for state_action_tasks
DROP TRIGGER IF EXISTS update_state_action_tasks_updated_at ON state_action_tasks;
CREATE TRIGGER update_state_action_tasks_updated_at
    BEFORE UPDATE ON state_action_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for deadlines
DROP TRIGGER IF EXISTS update_deadlines_updated_at ON deadlines;
CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for deliverables
DROP TRIGGER IF EXISTS update_deliverables_updated_at ON deliverables;
CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 9: SET DEFAULT engagement_type FOR EXISTING ENGAGEMENTS
-- ============================================================================

UPDATE engagements
SET engagement_type = 'nexus_study',
    stage = CASE
        WHEN status = 'signed' THEN 'analysis'
        WHEN status = 'archived' THEN 'complete'
        ELSE 'intake'
    END,
    stage_updated_at = NOW()
WHERE engagement_type IS NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- TABLES CREATED:
-- - intake_items: Unified intake tracking (discovery + data requests)
-- - state_assessments: Nexus determination per state per client
-- - state_actions: Remediation actions (Register, VDA, etc.)
-- - state_action_tasks: Task checklists for actions
-- - deadlines: Practice-wide deadline management
-- - deliverables: Engagement outputs (memos, reports)
--
-- COLUMNS ADDED TO ENGAGEMENTS:
-- - engagement_type: Type of work (nexus_study, vda, etc.)
-- - stage: Workflow stage (intake → complete)
-- - stage_updated_at: When stage changed
-- - next_milestone_name: Upcoming milestone
-- - next_milestone_date: Milestone due date
--
-- ============================================================================
