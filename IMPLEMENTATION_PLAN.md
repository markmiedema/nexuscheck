# NexusCheck UX/UI Improvement Plan

## Executive Summary

Transform NexusCheck from a "data display tool" into a "workflow engine" that answers: **"What's the next step to get this client from intake → decision → execution (by state), on time."**

---

## Phase 1: Client Overview & Next Best Action (Week 1-2)

### Goal
Add a Client Overview tab that instantly answers:
1. What stage are we in?
2. What is the next action?
3. What is the next deadline/risk?

### 1.1 Database Changes

**Add fields to `clients` table:**
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'intake';
-- Stages: intake, data_collection, analysis, recommendations, execution, monitoring

ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_action_due DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
```

**Add fields to `engagements` table:**
```sql
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'intake';
-- Stages: intake, data_collection, analysis, recommendations, execution, complete

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS next_milestone_name VARCHAR(255);
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS next_milestone_date DATE;
```

### 1.2 Backend API Changes

**New endpoint: `GET /api/v1/clients/{id}/overview`**
```python
@router.get("/{client_id}/overview", response_model=ClientOverviewResponse)
async def get_client_overview(client_id: str, auth = Depends(require_organization)):
    """
    Returns:
    - current_stage
    - stage_progress (percentage)
    - next_best_action (computed from missing data, pending analyses, etc.)
    - upcoming_deadlines (from engagements + state filing dates)
    - states_to_address (count + list from latest analysis)
    - blocking_items (missing intake data, pending client responses)
    """
```

**Response schema:**
```python
class ClientOverviewResponse(BaseModel):
    client_id: str
    company_name: str
    current_stage: str  # intake | data_collection | analysis | recommendations | execution | monitoring
    stage_progress: int  # 0-100

    next_best_action: Optional[NextAction]
    upcoming_deadlines: List[Deadline]
    states_to_address: StatesOverview
    blocking_items: List[BlockingItem]

class NextAction(BaseModel):
    action: str  # "Request sales data", "Run nexus analysis", "Review CA results"
    action_type: str  # data_request | analysis | review | registration | filing
    target_url: Optional[str]  # Link to relevant page
    priority: str  # high | medium | low

class Deadline(BaseModel):
    name: str
    date: date
    type: str  # milestone | filing | registration
    state: Optional[str]  # For state-specific deadlines
    days_until: int

class StatesOverview(BaseModel):
    total_with_nexus: int
    needing_action: int
    states: List[str]  # State codes
```

### 1.3 Frontend Changes

**New component: `ClientOverview.tsx`**

Location: `frontend/src/components/clients/ClientOverview.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE PROGRESS                                                  │
│  ○ Intake → ● Data → ○ Analysis → ○ Recommendations → ○ Execute │
│  [==========>                                         ] 35%      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NEXT BEST ACTION                                    🔥  │   │
│  │                                                          │   │
│  │  Request Sales Data (2022-2024)                         │   │
│  │  Missing transaction data needed for nexus analysis      │   │
│  │                                                          │   │
│  │  [Send Data Request Email]  [Mark as Received]          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ UPCOMING DEADLINES  │  │ STATES TO ADDRESS               │   │
│  │                     │  │                                 │   │
│  │ • Data due    5d    │  │ 4 states need action            │   │
│  │ • CA filing  12d    │  │ CA, TX, NY, FL                  │   │
│  │ • TX VDA     30d    │  │                                 │   │
│  │                     │  │ [View State Worklist →]         │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ BLOCKING ITEMS                                      ⚠️   │   │
│  │                                                          │   │
│  │ • Missing: Sales data 2022-2023                         │   │
│  │ • Missing: Current state registrations                   │   │
│  │ • Waiting: Client response on remote employees          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Update client page tabs:**
```
Current: [Activity] [Projects] [Data Checklist] [Discovery] [Engagements]
New:     [Overview] [Activity] [Intake] [Work History] [Engagements]
```

### 1.4 Next Best Action Logic

Computed server-side based on:

```python
def compute_next_action(client, engagements, analyses, intake_status):
    # Priority order:

    # 1. Blocking items first
    if not intake_status.has_sales_data:
        return NextAction(
            action="Request sales data",
            action_type="data_request",
            priority="high"
        )

    # 2. Pending analysis
    if has_data and not has_analysis:
        return NextAction(
            action="Run nexus analysis",
            action_type="analysis",
            target_url=f"/analysis/new?clientId={client.id}",
            priority="high"
        )

    # 3. Analysis complete, needs review
    if analysis.status == "complete" and not analysis.presented_at:
        return NextAction(
            action=f"Review results with {client.company_name}",
            action_type="review",
            target_url=f"/analysis/{analysis.id}/results",
            priority="medium"
        )

    # 4. States needing registration/VDA
    states_needing_action = get_states_needing_action(analysis)
    if states_needing_action:
        return NextAction(
            action=f"Execute {len(states_needing_action)} state registrations",
            action_type="registration",
            priority="medium"
        )

    # 5. Monitoring mode
    return NextAction(
        action="Monitor threshold changes",
        action_type="monitor",
        priority="low"
    )
```

---

## Phase 2: Unified Intake Flow (Week 2-3)

### Goal
Merge Discovery + Data Checklist into a single stepped "Intake" flow with upload support.

### 2.1 Database Changes

**New table: `intake_items`**
```sql
CREATE TABLE intake_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Item definition
    category VARCHAR(50) NOT NULL,  -- business_model | physical_presence | registrations | data_request
    item_key VARCHAR(100) NOT NULL,  -- unique key like 'sales_data_2023', 'remote_employees'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'not_requested',
    -- not_requested | requested | received | validated | not_applicable

    -- Assignment & deadlines
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    requested_at TIMESTAMP,
    received_at TIMESTAMP,
    validated_at TIMESTAMP,

    -- Uploads
    uploaded_file_urls JSONB DEFAULT '[]',  -- Array of {url, filename, uploaded_at}

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_items_client ON intake_items(client_id);
CREATE INDEX idx_intake_items_engagement ON intake_items(engagement_id);
CREATE INDEX idx_intake_items_status ON intake_items(status);
CREATE INDEX idx_intake_items_due_date ON intake_items(due_date);
```

**Default intake template:**
```python
DEFAULT_INTAKE_ITEMS = [
    # Business Model (from Discovery)
    {"category": "business_model", "item_key": "sales_channels", "label": "Sales Channels", "is_required": True},
    {"category": "business_model", "item_key": "product_types", "label": "Product Types", "is_required": True},
    {"category": "business_model", "item_key": "tech_stack", "label": "Technology Stack", "is_required": False},

    # Physical Presence
    {"category": "physical_presence", "item_key": "remote_employees", "label": "Remote Employee Locations", "is_required": True},
    {"category": "physical_presence", "item_key": "inventory_3pl", "label": "Inventory/3PL Locations", "is_required": True},
    {"category": "physical_presence", "item_key": "office_locations", "label": "Office Locations", "is_required": False},

    # Registrations
    {"category": "registrations", "item_key": "current_registrations", "label": "Current State Registrations", "is_required": True},
    {"category": "registrations", "item_key": "filing_history", "label": "Filing History", "is_required": False},

    # Data Requests
    {"category": "data_request", "item_key": "sales_data", "label": "Sales Transaction Data", "is_required": True},
    {"category": "data_request", "item_key": "prior_returns", "label": "Prior Tax Returns", "is_required": False},
    {"category": "data_request", "item_key": "exemption_certificates", "label": "Exemption Certificates", "is_required": False},
    {"category": "data_request", "item_key": "nexus_questionnaire", "label": "Nexus Questionnaire", "is_required": False},
]
```

### 2.2 Backend API Changes

**New endpoints:**
```python
# List intake items for a client
GET /api/v1/clients/{client_id}/intake

# Update an intake item
PATCH /api/v1/clients/{client_id}/intake/{item_id}

# Upload file to intake item
POST /api/v1/clients/{client_id}/intake/{item_id}/upload

# Initialize default intake items for a client
POST /api/v1/clients/{client_id}/intake/initialize

# Get intake completion percentage
GET /api/v1/clients/{client_id}/intake/status
```

**Intake status response:**
```python
class IntakeStatusResponse(BaseModel):
    total_items: int
    completed_items: int
    completion_percentage: int

    by_category: Dict[str, CategoryStatus]
    blocking_items: List[IntakeItem]  # Required items not yet received

class CategoryStatus(BaseModel):
    category: str
    total: int
    completed: int
    status: str  # not_started | in_progress | complete
```

### 2.3 Frontend Changes

**New component: `IntakeStepper.tsx`**

Location: `frontend/src/components/clients/IntakeStepper.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│  INTAKE PROGRESS                                                │
│  [Step 1: Business Model] → [Step 2: Physical Presence] →      │
│  [Step 3: Registrations] → [Step 4: Data Requests]             │
│                                                                 │
│  ━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│              Step 2 of 4                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHYSICAL PRESENCE                                              │
│                                                                 │
│  Does this client have remote employees?                        │
│  ○ Yes  ○ No  ○ Unknown                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ REMOTE EMPLOYEE STATES                                    │ │
│  │                                                           │ │
│  │  State          │ Since      │ Status     │              │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  California     │ 2022-03    │ ✓ Verified │ [Remove]     │ │
│  │  Texas          │ 2023-01    │ ✓ Verified │ [Remove]     │ │
│  │  New York       │ 2023-06    │ ⚠ Pending  │ [Remove]     │ │
│  │                                                           │ │
│  │  [+ Add State]                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Does this client have inventory or 3PL?                        │
│  ○ Yes  ○ No  ○ Unknown                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 3PL/INVENTORY STATES                                      │ │
│  │  [Similar table structure]                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [← Back]  [Continue →]             │
└─────────────────────────────────────────────────────────────────┘
```

**Step 4: Data Requests with uploads**

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA REQUESTS                                                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ Sales Transaction Data *                        Required │ │
│  │   Status: ⬤ Received                                      │ │
│  │   Due: Dec 15, 2025                                        │ │
│  │   Files: sales_2023.csv, sales_2024.csv                   │ │
│  │   [Upload More] [Mark Validated]                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☐ Prior Tax Returns                              Optional │ │
│  │   Status: ○ Not Requested                                 │ │
│  │   [Request from Client] [Upload] [Mark N/A]              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☐ Exemption Certificates                         Optional │ │
│  │   Status: ◐ Requested (Dec 10)                           │ │
│  │   Assigned to: John Smith                                 │ │
│  │   [Upload] [Send Reminder]                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: State Worklist with Dual Statuses (Week 3-4)

### Goal
Transform "4 states to address" into an actionable execution board with separate nexus and action tracking.

### 3.1 Database Changes

**New table: `state_assessments`**
```sql
CREATE TABLE state_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    state CHAR(2) NOT NULL,

    -- Nexus Determination (the "why")
    nexus_status VARCHAR(50) DEFAULT 'unknown',
    -- unknown | needs_data | no_nexus | approaching | has_nexus | excluded

    nexus_type VARCHAR(50),  -- economic | physical | both

    nexus_reasons JSONB DEFAULT '[]',
    -- ["remote_employee", "inventory", "exceeded_threshold", "marketplace_facilitator"]

    first_exposure_date DATE,
    threshold_percentage DECIMAL(5,2),  -- e.g., 85.5% of threshold

    -- Financials (copied from latest state_results or computed)
    total_sales DECIMAL(12,2),
    estimated_liability DECIMAL(12,2),

    -- Assessment metadata
    assessed_at TIMESTAMP,
    assessed_by UUID REFERENCES users(id),
    confidence_level VARCHAR(20),  -- high | medium | low
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_client_state UNIQUE (client_id, state)
);

CREATE INDEX idx_state_assessments_client ON state_assessments(client_id);
CREATE INDEX idx_state_assessments_nexus_status ON state_assessments(nexus_status);
CREATE INDEX idx_state_assessments_engagement ON state_assessments(engagement_id);
```

**New table: `state_actions`**
```sql
CREATE TABLE state_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_assessment_id UUID REFERENCES state_assessments(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Action definition
    action_type VARCHAR(50) NOT NULL,
    -- register | vda | file_back_returns | marketplace_exception | monitor | no_action

    action_status VARCHAR(50) DEFAULT 'not_started',
    -- not_started | in_progress | blocked | complete

    -- Blocking
    blocked_reason TEXT,
    blocked_since DATE,

    -- Assignment
    assigned_to UUID REFERENCES users(id),

    -- Deadlines
    target_date DATE,
    completed_at TIMESTAMP,

    -- Strategy notes
    strategy_notes TEXT,

    -- Outcome tracking
    registration_effective_date DATE,
    vda_submission_date DATE,
    vda_approval_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_state_actions_assessment ON state_actions(state_assessment_id);
CREATE INDEX idx_state_actions_status ON state_actions(action_status);
CREATE INDEX idx_state_actions_target_date ON state_actions(target_date);
CREATE INDEX idx_state_actions_assigned ON state_actions(assigned_to);
```

**New table: `state_action_tasks`**
```sql
CREATE TABLE state_action_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_action_id UUID REFERENCES state_actions(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(50) DEFAULT 'pending',
    -- pending | in_progress | complete | skipped

    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMP,

    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_state_action_tasks_action ON state_action_tasks(state_action_id);
CREATE INDEX idx_state_action_tasks_status ON state_action_tasks(status);
```

**Default task templates per action type:**
```python
ACTION_TASK_TEMPLATES = {
    "register": [
        {"title": "Gather required documents", "sort_order": 1},
        {"title": "Complete state registration application", "sort_order": 2},
        {"title": "Submit application", "sort_order": 3},
        {"title": "Receive confirmation/account number", "sort_order": 4},
        {"title": "Update tax engine configuration", "sort_order": 5},
    ],
    "vda": [
        {"title": "Calculate exposure period", "sort_order": 1},
        {"title": "Prepare VDA application", "sort_order": 2},
        {"title": "Compile supporting documentation", "sort_order": 3},
        {"title": "Submit VDA application", "sort_order": 4},
        {"title": "Negotiate with state (if needed)", "sort_order": 5},
        {"title": "Receive VDA approval", "sort_order": 6},
        {"title": "Pay settlement amount", "sort_order": 7},
        {"title": "Complete registration", "sort_order": 8},
    ],
    "file_back_returns": [
        {"title": "Identify periods to file", "sort_order": 1},
        {"title": "Gather sales data by period", "sort_order": 2},
        {"title": "Prepare returns", "sort_order": 3},
        {"title": "Calculate tax due + interest + penalties", "sort_order": 4},
        {"title": "File returns", "sort_order": 5},
        {"title": "Pay amounts due", "sort_order": 6},
    ],
    "monitor": [
        {"title": "Set threshold alert", "sort_order": 1},
        {"title": "Schedule quarterly review", "sort_order": 2},
    ],
}
```

### 3.2 Backend API Changes

**New endpoints:**
```python
# Get state worklist for a client
GET /api/v1/clients/{client_id}/state-worklist
# Query params: ?nexus_status=has_nexus&action_status=not_started

# Get single state assessment with action details
GET /api/v1/clients/{client_id}/states/{state_code}

# Update state assessment
PATCH /api/v1/clients/{client_id}/states/{state_code}

# Create/update state action
PUT /api/v1/clients/{client_id}/states/{state_code}/action

# Update action task status
PATCH /api/v1/state-actions/{action_id}/tasks/{task_id}

# Sync state assessments from analysis results
POST /api/v1/clients/{client_id}/sync-state-assessments
# Called after analysis completes to populate/update state_assessments
```

**State worklist response:**
```python
class StateWorklistResponse(BaseModel):
    client_id: str
    total_states: int

    summary: WorklistSummary
    states: List[StateWorklistItem]

class WorklistSummary(BaseModel):
    has_nexus: int
    approaching: int
    needs_data: int
    no_nexus: int

    not_started: int
    in_progress: int
    blocked: int
    complete: int

class StateWorklistItem(BaseModel):
    state: str
    state_name: str

    # Nexus status
    nexus_status: str
    nexus_type: Optional[str]
    nexus_reasons: List[str]
    threshold_percentage: Optional[float]

    # Financials
    total_sales: Optional[Decimal]
    estimated_liability: Optional[Decimal]

    # Action status
    action_type: Optional[str]
    action_status: str
    assigned_to: Optional[UserSummary]
    target_date: Optional[date]
    blocked_reason: Optional[str]

    # Task progress
    tasks_total: int
    tasks_complete: int
```

### 3.3 Frontend Changes

**New component: `StateWorklist.tsx`**

Location: `frontend/src/components/clients/StateWorklist.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  STATE WORKLIST                                           [Filter ▼] [Export]       │
│                                                                                      │
│  Summary: 4 need action │ 2 in progress │ 1 blocked │ 8 complete                    │
│                                                                                      │
├──────┬─────────────┬───────────┬──────────────┬────────────┬──────────┬────────────┤
│State │ Nexus       │ Why       │ Strategy     │ Status     │ Deadline │ Owner      │
├──────┼─────────────┼───────────┼──────────────┼────────────┼──────────┼────────────┤
│ CA   │ ⬤ Has Nexus │ Threshold │ VDA          │ ◐ Progress │ Jan 15   │ John S.    │
│      │   Economic  │ Employee  │              │   3/8 tasks│          │            │
├──────┼─────────────┼───────────┼──────────────┼────────────┼──────────┼────────────┤
│ TX   │ ⬤ Has Nexus │ Threshold │ Register     │ ○ Not      │ -        │ Unassigned │
│      │   Economic  │           │              │   Started  │          │            │
├──────┼─────────────┼───────────┼──────────────┼────────────┼──────────┼────────────┤
│ NY   │ ⬤ Has Nexus │ Inventory │ VDA          │ ⚠ Blocked  │ Feb 1    │ Sarah M.   │
│      │   Physical  │           │              │   Missing  │          │            │
│      │             │           │              │   data     │          │            │
├──────┼─────────────┼───────────┼──────────────┼────────────┼──────────┼────────────┤
│ FL   │ ◐ Approach  │ 87% of    │ Monitor      │ ✓ Complete │ -        │ Auto       │
│      │   85%       │ threshold │              │            │          │            │
├──────┼─────────────┼───────────┼──────────────┼────────────┼──────────┼────────────┤
│ WA   │ ○ No Nexus  │ -         │ -            │ -          │ -        │ -          │
└──────┴─────────────┴───────────┴──────────────┴────────────┴──────────┴────────────┘
```

**Row click → Side drawer:**

```
┌──────────────────────────────────────────────────┐
│  CALIFORNIA                              [Close] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│  NEXUS DETERMINATION                             │
│  Status: Has Nexus (Economic + Physical)         │
│  Since: March 2022                               │
│                                                  │
│  Reasons:                                        │
│  • Exceeded $500K revenue threshold (2022)       │
│  • Remote employee since 2022-03                 │
│                                                  │
│  Financials:                                     │
│  • Total Sales: $1,245,000                       │
│  • Estimated Liability: $87,150                  │
│  • Interest: $12,400                             │
│  • Penalties: $8,715                             │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│  ACTION PLAN                                     │
│                                                  │
│  Strategy: [VDA ▼]                               │
│  Status:   [In Progress ▼]                       │
│  Owner:    [John Smith ▼]                        │
│  Deadline: [Jan 15, 2026    📅]                  │
│                                                  │
│  TASKS                                           │
│  ☑ Calculate exposure period                    │
│  ☑ Prepare VDA application                      │
│  ☑ Compile supporting documentation             │
│  ☐ Submit VDA application          Due: Jan 10  │
│  ☐ Negotiate with state                         │
│  ☐ Receive VDA approval                         │
│  ☐ Pay settlement amount                        │
│  ☐ Complete registration                        │
│                                                  │
│  [+ Add Task]                                    │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│  NOTES                                           │
│  ┌────────────────────────────────────────────┐ │
│  │ VDA contact: Jane Doe (916-555-0123)       │ │
│  │ Spoke with agent, expecting 60-day review  │ │
│  └────────────────────────────────────────────┘ │
│  [+ Add Note]                                    │
│                                                  │
│  DOCUMENTS                                       │
│  📎 ca_vda_application.pdf                      │
│  📎 ca_sales_data_2022_2024.xlsx                │
│  [+ Upload Document]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Phase 4: Deadline & Calendar Integration (Week 4-5)

### Goal
Make deadlines first-class citizens with a practice-wide calendar view.

### 4.1 Database Changes

**New table: `deadlines`**
```sql
CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Linkage (at least one required)
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    state_action_id UUID REFERENCES state_actions(id) ON DELETE CASCADE,

    -- Deadline info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_type VARCHAR(50) NOT NULL,
    -- milestone | filing | registration | vda | data_request | other

    due_date DATE NOT NULL,

    -- State-specific (optional)
    state CHAR(2),

    -- Status
    status VARCHAR(50) DEFAULT 'upcoming',
    -- upcoming | due_soon | overdue | complete | cancelled

    completed_at TIMESTAMP,

    -- Reminders
    reminder_days INTEGER[] DEFAULT '{7, 3, 1}',  -- Days before to remind
    last_reminder_sent_at TIMESTAMP,

    -- Recurrence (for filing deadlines)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),  -- monthly | quarterly | annual

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deadlines_org ON deadlines(organization_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_client ON deadlines(client_id);
CREATE INDEX idx_deadlines_status ON deadlines(status);
```

### 4.2 Backend API Changes

**New endpoints:**
```python
# Get all deadlines for organization (practice-wide)
GET /api/v1/deadlines
# Query params: ?days=14&client_id=xxx&status=upcoming

# Get deadlines for specific client
GET /api/v1/clients/{client_id}/deadlines

# Create deadline
POST /api/v1/deadlines

# Update deadline
PATCH /api/v1/deadlines/{deadline_id}

# Complete deadline
POST /api/v1/deadlines/{deadline_id}/complete
```

### 4.3 Frontend Changes

**Dashboard widget: `UpcomingDeadlines.tsx`**

```
┌─────────────────────────────────────────────────┐
│  UPCOMING DEADLINES                    [See All]│
│                                                 │
│  TODAY                                          │
│  ⚠️ Acme Corp - CA VDA submission              │
│                                                 │
│  THIS WEEK                                      │
│  📅 TechStart - Data due (3 days)              │
│  📅 BigRetail - TX registration (5 days)       │
│                                                 │
│  NEXT 14 DAYS                                   │
│  📅 Acme Corp - NY filing (12 days)            │
│  📅 TechStart - Presentation (14 days)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**New page: `/deadlines` (Calendar/List view)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRACTICE CALENDAR                                                      │
│                                                                         │
│  [List View] [Calendar View]              [+ Add Deadline]              │
│                                                                         │
│  Filter: [All Clients ▼] [All Types ▼] [Next 30 Days ▼]                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OVERDUE (2)                                                       🔴  │
│  ├─ Dec 10 │ Acme Corp    │ CA VDA Submission    │ John S. │ [Complete]│
│  └─ Dec 12 │ TechStart    │ Data Request         │ Sarah M.│ [Complete]│
│                                                                         │
│  THIS WEEK (3)                                                     🟡  │
│  ├─ Dec 16 │ BigRetail    │ TX Registration      │ John S. │           │
│  ├─ Dec 18 │ Acme Corp    │ NY Filing Q4         │ Sarah M.│           │
│  └─ Dec 20 │ NewClient    │ Discovery Call       │ -       │           │
│                                                                         │
│  NEXT WEEK (2)                                                     🟢  │
│  ├─ Dec 23 │ TechStart    │ Analysis Review      │ John S. │           │
│  └─ Dec 27 │ BigRetail    │ FL VDA Deadline      │ Sarah M.│           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Engagement Restructure (Week 5-6)

### Goal
Make Engagement the primary work container, with Analyses, Intake, State Actions, and Deliverables nested under it.

### 5.1 Database Changes

**Update `engagements` table:**
```sql
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS engagement_type VARCHAR(50);
-- nexus_study | vda | registrations | ongoing_compliance | audit_defense | advisory

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'intake';
-- intake | data_collection | analysis | recommendations | execution | complete

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMP;
```

**New table: `deliverables`**
```sql
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    deliverable_type VARCHAR(50) NOT NULL,
    -- memo | presentation | report | spreadsheet | letter | other

    status VARCHAR(50) DEFAULT 'not_started',
    -- not_started | in_progress | review | delivered

    -- File
    file_url TEXT,
    file_name VARCHAR(255),

    -- Tracking
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    delivered_at TIMESTAMP,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deliverables_engagement ON deliverables(engagement_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
```

### 5.2 Migration Strategy

**Auto-create engagements for existing analyses:**
```sql
-- Create engagement for each analysis that doesn't have one
INSERT INTO engagements (
    id,
    client_id,
    user_id,
    organization_id,
    title,
    engagement_type,
    status,
    stage,
    created_at
)
SELECT
    gen_random_uuid(),
    a.client_id,
    a.user_id,
    a.organization_id,
    CONCAT('Nexus Study - ', TO_CHAR(a.created_at, 'Mon YYYY')),
    'nexus_study',
    CASE
        WHEN a.status = 'complete' THEN 'signed'
        ELSE 'draft'
    END,
    CASE
        WHEN a.status = 'complete' THEN 'complete'
        WHEN a.status = 'processing' THEN 'analysis'
        ELSE 'data_collection'
    END,
    a.created_at
FROM analyses a
WHERE a.engagement_id IS NULL
AND a.client_id IS NOT NULL;

-- Link analyses to new engagements
UPDATE analyses a
SET engagement_id = e.id
FROM engagements e
WHERE e.client_id = a.client_id
AND a.engagement_id IS NULL;
```

### 5.3 Frontend Changes

**Update client page structure:**

```
BEFORE:
[Activity] [Projects] [Data Checklist] [Discovery] [Engagements]

AFTER:
[Overview] [Activity] [Engagements]

Where each Engagement expands to show:
├── Intake (stepper)
├── Analyses (list of calculation runs)
├── State Worklist (per engagement)
└── Deliverables
```

**Engagement detail view:**

```
┌─────────────────────────────────────────────────────────────────┐
│  NEXUS STUDY - Q4 2024                                         │
│  Acme Corporation                                               │
│                                                                 │
│  Stage: [Intake] → [Data] → [Analysis] → [Recommendations] → [Execute]
│         ━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  [Intake] [Analyses] [State Worklist] [Deliverables] [Settings] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (Tab content here based on selection)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Practice-Wide Views (Week 6-7)

### Goal
Add multi-client views for practice management.

### 6.1 New Pages

**`/practice/states` - All clients by state exposure**

```
┌─────────────────────────────────────────────────────────────────┐
│  PRACTICE STATE EXPOSURE                                        │
│                                                                 │
│  Filter: [Has Nexus ▼]                    [Export]             │
│                                                                 │
├─────────┬────────────────────────────────────────────────────── │
│ State   │ Clients with Exposure                                │
├─────────┼────────────────────────────────────────────────────── │
│ CA (12) │ Acme Corp, TechStart, BigRetail, ...                 │
│ TX (8)  │ Acme Corp, NewClient, RetailCo, ...                  │
│ NY (7)  │ TechStart, BigRetail, FinanceInc, ...                │
│ FL (6)  │ Acme Corp, TechStart, ...                            │
└─────────┴───────────────────────────────────────────────────────┘
```

**`/practice/pipeline` - Work pipeline**

```
┌─────────────────────────────────────────────────────────────────┐
│  WORK PIPELINE                                                  │
│                                                                 │
│  WAITING ON CLIENT (3)                                          │
│  ├─ Acme Corp     │ Missing: Sales data 2024                   │
│  ├─ TechStart     │ Missing: POA                               │
│  └─ NewClient     │ Missing: Discovery call                    │
│                                                                 │
│  IN ANALYSIS (2)                                                │
│  ├─ BigRetail     │ Processing... (75%)                        │
│  └─ FinanceInc    │ Ready for review                           │
│                                                                 │
│  AWAITING PRESENTATION (1)                                      │
│  └─ RetailCo      │ Analysis complete, schedule call           │
│                                                                 │
│  IN EXECUTION (4)                                               │
│  ├─ OldClient     │ 3 states in VDA                            │
│  └─ ...                                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order Summary

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| **1** | Client Overview + Next Best Action | Week 1-2 | None |
| **2** | Unified Intake Flow | Week 2-3 | Phase 1 |
| **3** | State Worklist with Dual Statuses | Week 3-4 | Phase 1 |
| **4** | Deadlines & Calendar | Week 4-5 | Phase 1 |
| **5** | Engagement Restructure | Week 5-6 | Phases 1-4 |
| **6** | Practice-Wide Views | Week 6-7 | Phase 5 |

---

## File Structure for New Components

```
frontend/src/
├── components/
│   ├── clients/
│   │   ├── ClientOverview.tsx          # Phase 1
│   │   ├── NextBestAction.tsx          # Phase 1
│   │   ├── StageProgress.tsx           # Phase 1
│   │   ├── IntakeStepper.tsx           # Phase 2
│   │   ├── IntakeItemCard.tsx          # Phase 2
│   │   ├── StateWorklist.tsx           # Phase 3
│   │   ├── StateWorklistRow.tsx        # Phase 3
│   │   ├── StateDetailDrawer.tsx       # Phase 3
│   │   └── StateActionTasks.tsx        # Phase 3
│   ├── deadlines/
│   │   ├── DeadlineWidget.tsx          # Phase 4
│   │   ├── DeadlineList.tsx            # Phase 4
│   │   └── DeadlineCalendar.tsx        # Phase 4
│   ├── engagements/
│   │   ├── EngagementDetail.tsx        # Phase 5
│   │   ├── EngagementStage.tsx         # Phase 5
│   │   └── DeliverablesList.tsx        # Phase 5
│   └── practice/
│       ├── StateExposureView.tsx       # Phase 6
│       └── WorkPipeline.tsx            # Phase 6
├── hooks/
│   ├── useClientOverview.ts            # Phase 1
│   ├── useIntakeItems.ts               # Phase 2
│   ├── useStateWorklist.ts             # Phase 3
│   ├── useStateAssessment.ts           # Phase 3
│   ├── useDeadlines.ts                 # Phase 4
│   └── usePracticeViews.ts             # Phase 6
└── pages/
    ├── clients/
    │   └── [id]/
    │       ├── overview/               # Phase 1
    │       ├── intake/                 # Phase 2
    │       └── states/                 # Phase 3
    ├── deadlines/                      # Phase 4
    └── practice/                       # Phase 6

backend/app/
├── api/v1/
│   ├── client_overview.py              # Phase 1
│   ├── intake.py                       # Phase 2
│   ├── state_worklist.py               # Phase 3
│   ├── deadlines.py                    # Phase 4
│   └── practice.py                     # Phase 6
├── schemas/
│   ├── client_overview.py              # Phase 1
│   ├── intake.py                       # Phase 2
│   ├── state_worklist.py               # Phase 3
│   └── deadlines.py                    # Phase 4
└── services/
    ├── next_action_calculator.py       # Phase 1
    ├── intake_manager.py               # Phase 2
    ├── state_assessment_sync.py        # Phase 3
    └── deadline_manager.py             # Phase 4
```

---

## Technical Notes

### API Patterns
- All new endpoints use organization scoping via `require_organization` dependency
- Soft deletes with `deleted_at` timestamp where applicable
- JSONB for flexible arrays (nexus_reasons, reminder_days, etc.)

### Frontend Patterns
- TanStack Query for all data fetching with appropriate cache invalidation
- Optimistic updates for task completion toggles
- Debounced search/filter inputs
- Skeleton loaders for initial page loads

### Migration Safety
- All schema changes are additive (new tables, new columns)
- No breaking changes to existing tables
- Backfill scripts for auto-creating engagements from existing analyses
- Feature flags for gradual rollout if needed

---

## Success Metrics

After implementation, the application should:

1. **Reduce time-to-action** - Users know what to do next without hunting through tabs
2. **Improve deadline compliance** - No missed filing dates or VDA windows
3. **Enable team collaboration** - Clear ownership and status visibility
4. **Support practice growth** - Multi-client views for managing larger client bases
5. **Increase client throughput** - Streamlined intake reduces data gathering friction
