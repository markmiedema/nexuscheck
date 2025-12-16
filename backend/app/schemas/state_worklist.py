"""Schemas for state worklist and action tracking."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


# --- State Assessment Schemas ---

class StateAssessmentBase(BaseModel):
    """Base fields for state assessment."""
    state: str = Field(..., min_length=2, max_length=2)
    nexus_status: str = "unknown"  # unknown, needs_data, no_nexus, approaching, has_nexus, excluded
    nexus_type: Optional[str] = None  # economic, physical, both
    nexus_reasons: List[str] = []
    first_exposure_date: Optional[date] = None
    threshold_percentage: Optional[float] = None
    total_sales: Optional[float] = None
    estimated_liability: Optional[float] = None
    confidence_level: Optional[str] = None  # high, medium, low
    notes: Optional[str] = None


class StateAssessmentCreate(StateAssessmentBase):
    """Create a state assessment."""
    client_id: UUID
    engagement_id: Optional[UUID] = None
    analysis_id: Optional[UUID] = None


class StateAssessmentUpdate(BaseModel):
    """Update a state assessment."""
    nexus_status: Optional[str] = None
    nexus_type: Optional[str] = None
    nexus_reasons: Optional[List[str]] = None
    first_exposure_date: Optional[date] = None
    threshold_percentage: Optional[float] = None
    total_sales: Optional[float] = None
    estimated_liability: Optional[float] = None
    confidence_level: Optional[str] = None
    notes: Optional[str] = None


class StateAssessmentResponse(StateAssessmentBase):
    """State assessment response with metadata."""
    id: UUID
    client_id: UUID
    engagement_id: Optional[UUID] = None
    analysis_id: Optional[UUID] = None
    organization_id: UUID
    assessed_at: Optional[datetime] = None
    assessed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    # Include current action if exists
    current_action: Optional["StateActionResponse"] = None

    class Config:
        from_attributes = True


# --- State Action Schemas ---

class StateActionBase(BaseModel):
    """Base fields for state action."""
    action_type: str  # register, vda, file_back_returns, marketplace_exception, monitor, no_action
    action_status: str = "not_started"  # not_started, in_progress, blocked, complete
    blocked_reason: Optional[str] = None
    blocked_since: Optional[date] = None
    assigned_to: Optional[UUID] = None
    target_date: Optional[date] = None
    strategy_notes: Optional[str] = None
    registration_effective_date: Optional[date] = None
    vda_submission_date: Optional[date] = None
    vda_approval_date: Optional[date] = None


class StateActionCreate(StateActionBase):
    """Create a state action."""
    state_assessment_id: UUID


class StateActionUpdate(BaseModel):
    """Update a state action."""
    action_type: Optional[str] = None
    action_status: Optional[str] = None
    blocked_reason: Optional[str] = None
    blocked_since: Optional[date] = None
    assigned_to: Optional[UUID] = None
    target_date: Optional[date] = None
    strategy_notes: Optional[str] = None
    registration_effective_date: Optional[date] = None
    vda_submission_date: Optional[date] = None
    vda_approval_date: Optional[date] = None


class StateActionResponse(StateActionBase):
    """State action response with metadata."""
    id: UUID
    state_assessment_id: UUID
    organization_id: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Include tasks
    tasks: List["StateActionTaskResponse"] = []

    class Config:
        from_attributes = True


# --- State Action Task Schemas ---

class StateActionTaskBase(BaseModel):
    """Base fields for action task."""
    title: str
    description: Optional[str] = None
    status: str = "pending"  # pending, in_progress, complete, skipped
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None
    sort_order: int = 0


class StateActionTaskCreate(StateActionTaskBase):
    """Create an action task."""
    state_action_id: UUID


class StateActionTaskUpdate(BaseModel):
    """Update an action task."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None
    sort_order: Optional[int] = None


class StateActionTaskResponse(StateActionTaskBase):
    """Action task response."""
    id: UUID
    state_action_id: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Worklist Summary Schemas ---

class StateWorklistItem(BaseModel):
    """Combined view for state worklist table."""
    id: UUID  # assessment id
    state: str
    nexus_status: str
    nexus_type: Optional[str] = None
    nexus_reasons: List[str] = []
    estimated_liability: Optional[float] = None
    threshold_percentage: Optional[float] = None
    first_exposure_date: Optional[date] = None

    # Current action info (if exists)
    action_id: Optional[UUID] = None
    action_type: Optional[str] = None
    action_status: Optional[str] = None
    target_date: Optional[date] = None
    blocked_reason: Optional[str] = None

    # Task progress
    tasks_total: int = 0
    tasks_complete: int = 0


class StateWorklistSummary(BaseModel):
    """Summary stats for the worklist."""
    total_states: int = 0
    states_with_nexus: int = 0
    states_approaching: int = 0
    states_no_nexus: int = 0
    states_unknown: int = 0

    actions_not_started: int = 0
    actions_in_progress: int = 0
    actions_blocked: int = 0
    actions_complete: int = 0

    total_estimated_liability: float = 0


class StateWorklistResponse(BaseModel):
    """Full worklist response."""
    items: List[StateWorklistItem]
    summary: StateWorklistSummary


# --- Action Templates ---

class ActionTaskTemplate(BaseModel):
    """Template for auto-creating tasks when an action is created."""
    title: str
    description: Optional[str] = None
    sort_order: int = 0


# Default task templates by action type
ACTION_TASK_TEMPLATES: dict[str, List[ActionTaskTemplate]] = {
    "register": [
        ActionTaskTemplate(title="Gather registration documents", sort_order=1),
        ActionTaskTemplate(title="Complete state registration application", sort_order=2),
        ActionTaskTemplate(title="Submit registration to state", sort_order=3),
        ActionTaskTemplate(title="Receive confirmation/permit number", sort_order=4),
        ActionTaskTemplate(title="Set up tax engine for state", sort_order=5),
    ],
    "vda": [
        ActionTaskTemplate(title="Review VDA program eligibility", sort_order=1),
        ActionTaskTemplate(title="Calculate lookback period liability", sort_order=2),
        ActionTaskTemplate(title="Prepare VDA application", sort_order=3),
        ActionTaskTemplate(title="Draft anonymous pre-clearance (if applicable)", sort_order=4),
        ActionTaskTemplate(title="Submit VDA application", sort_order=5),
        ActionTaskTemplate(title="Negotiate settlement terms", sort_order=6),
        ActionTaskTemplate(title="Execute VDA agreement", sort_order=7),
        ActionTaskTemplate(title="Submit payment", sort_order=8),
        ActionTaskTemplate(title="Register for prospective filing", sort_order=9),
    ],
    "file_back_returns": [
        ActionTaskTemplate(title="Determine filing periods owed", sort_order=1),
        ActionTaskTemplate(title="Calculate tax due per period", sort_order=2),
        ActionTaskTemplate(title="Prepare back returns", sort_order=3),
        ActionTaskTemplate(title="Submit returns to state", sort_order=4),
        ActionTaskTemplate(title="Submit payment with interest/penalties", sort_order=5),
    ],
    "marketplace_exception": [
        ActionTaskTemplate(title="Document marketplace facilitator status", sort_order=1),
        ActionTaskTemplate(title="Verify state marketplace facilitator law", sort_order=2),
        ActionTaskTemplate(title="Confirm no direct sales nexus", sort_order=3),
        ActionTaskTemplate(title="Document decision rationale", sort_order=4),
    ],
    "monitor": [
        ActionTaskTemplate(title="Set threshold monitoring alert", sort_order=1),
        ActionTaskTemplate(title="Document current sales levels", sort_order=2),
        ActionTaskTemplate(title="Schedule quarterly review", sort_order=3),
    ],
}


# Update forward references
StateAssessmentResponse.model_rebuild()
StateActionResponse.model_rebuild()
