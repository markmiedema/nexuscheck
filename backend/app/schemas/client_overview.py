"""
Client Overview Schemas

Schemas for the Client Overview feature including:
- Stage progress tracking
- Next best action recommendations
- Deadlines and blocking items
- States summary
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# --- Enums ---

class WorkflowStage(str, Enum):
    """Workflow stages for client engagements."""
    INTAKE = "intake"
    DATA_COLLECTION = "data_collection"
    ANALYSIS = "analysis"
    RECOMMENDATIONS = "recommendations"
    EXECUTION = "execution"
    MONITORING = "monitoring"
    COMPLETE = "complete"


class ActionType(str, Enum):
    """Types of actions that can be recommended."""
    DATA_REQUEST = "data_request"
    DISCOVERY = "discovery"
    ANALYSIS = "analysis"
    REVIEW = "review"
    PRESENTATION = "presentation"
    REGISTRATION = "registration"
    VDA = "vda"
    FILING = "filing"
    MONITOR = "monitor"


class ActionPriority(str, Enum):
    """Priority levels for actions."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DeadlineType(str, Enum):
    """Types of deadlines."""
    MILESTONE = "milestone"
    FILING = "filing"
    REGISTRATION = "registration"
    VDA = "vda"
    DATA_REQUEST = "data_request"
    PRESENTATION = "presentation"
    OTHER = "other"


class NexusStatus(str, Enum):
    """Nexus determination status for a state."""
    UNKNOWN = "unknown"
    NEEDS_DATA = "needs_data"
    NO_NEXUS = "no_nexus"
    APPROACHING = "approaching"
    HAS_NEXUS = "has_nexus"
    EXCLUDED = "excluded"


# --- Sub-schemas ---

class NextAction(BaseModel):
    """Represents the next recommended action for a client."""
    action: str = Field(..., description="Human-readable action description")
    action_type: ActionType = Field(..., description="Type of action")
    priority: ActionPriority = Field(default=ActionPriority.MEDIUM)
    target_url: Optional[str] = Field(None, description="Link to relevant page/action")
    context: Optional[str] = Field(None, description="Additional context for the action")
    due_date: Optional[date] = Field(None, description="When this action is due")


class Deadline(BaseModel):
    """Represents an upcoming deadline."""
    id: Optional[UUID] = None
    title: str
    due_date: date
    deadline_type: DeadlineType
    state: Optional[str] = Field(None, description="State code if state-specific")
    days_until: int = Field(..., description="Days until the deadline")
    is_overdue: bool = Field(default=False)
    client_name: Optional[str] = Field(None, description="Client name if showing practice-wide")


class BlockingItem(BaseModel):
    """Represents something blocking progress."""
    item: str = Field(..., description="What is blocking")
    category: str = Field(..., description="Category: data_request, discovery, client_response, etc.")
    since: Optional[date] = Field(None, description="When this became blocking")
    blocking_states: List[str] = Field(default_factory=list, description="States affected by this blocker")


class StatesSummary(BaseModel):
    """Summary of states for a client."""
    total_with_nexus: int = 0
    needing_action: int = 0
    approaching_threshold: int = 0
    in_progress: int = 0
    complete: int = 0
    states_needing_action: List[str] = Field(default_factory=list, description="State codes needing action")


class StageInfo(BaseModel):
    """Information about the current workflow stage."""
    current_stage: WorkflowStage
    stage_progress: int = Field(..., ge=0, le=100, description="Percentage progress through current stage")
    stage_started_at: Optional[datetime] = None
    stages_completed: List[WorkflowStage] = Field(default_factory=list)


class EngagementSummary(BaseModel):
    """Summary of an active engagement."""
    id: UUID
    title: str
    engagement_type: Optional[str] = None
    stage: WorkflowStage
    status: str
    next_milestone_name: Optional[str] = None
    next_milestone_date: Optional[date] = None


class IntakeProgress(BaseModel):
    """Progress through the intake process."""
    total_items: int = 0
    completed_items: int = 0
    completion_percentage: int = 0
    missing_required: List[str] = Field(default_factory=list, description="Missing required items")


# --- Main Response Schema ---

class ClientOverviewResponse(BaseModel):
    """Complete client overview response."""
    # Client identification
    client_id: UUID
    company_name: str
    lifecycle_status: str

    # Stage progress
    stage_info: StageInfo

    # Next best action
    next_action: Optional[NextAction] = None
    secondary_actions: List[NextAction] = Field(default_factory=list, max_length=3)

    # Deadlines
    upcoming_deadlines: List[Deadline] = Field(default_factory=list)
    overdue_count: int = 0

    # States summary
    states_summary: StatesSummary

    # Blocking items
    blocking_items: List[BlockingItem] = Field(default_factory=list)
    is_blocked: bool = False

    # Active engagement info
    active_engagement: Optional[EngagementSummary] = None

    # Intake progress
    intake_progress: Optional[IntakeProgress] = None

    # Metadata
    last_activity_at: Optional[datetime] = None
    last_analysis_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Intake Item Schemas ---

class IntakeItemBase(BaseModel):
    """Base schema for intake items."""
    category: str  # business_model, physical_presence, registrations, data_request
    item_key: str
    label: str
    description: Optional[str] = None
    is_required: bool = True


class IntakeItemCreate(IntakeItemBase):
    """Schema for creating an intake item."""
    engagement_id: Optional[UUID] = None
    due_date: Optional[date] = None
    assigned_to: Optional[UUID] = None


class IntakeItemUpdate(BaseModel):
    """Schema for updating an intake item."""
    status: Optional[str] = None  # not_requested, requested, received, validated, not_applicable
    due_date: Optional[date] = None
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None


class IntakeItemResponse(IntakeItemBase):
    """Response schema for intake items."""
    id: UUID
    client_id: UUID
    organization_id: UUID
    engagement_id: Optional[UUID] = None
    status: str
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None
    requested_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    uploaded_files: List[dict] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IntakeStatusResponse(BaseModel):
    """Response schema for intake status summary."""
    total_items: int
    completed_items: int
    completion_percentage: int
    by_category: dict  # category -> {total, completed, status}
    blocking_items: List[IntakeItemResponse] = Field(default_factory=list)


# --- State Assessment Schemas ---

class StateAssessmentBase(BaseModel):
    """Base schema for state assessments."""
    state: str = Field(..., min_length=2, max_length=2)
    nexus_status: NexusStatus = NexusStatus.UNKNOWN
    nexus_type: Optional[str] = None  # economic, physical, both
    nexus_reasons: List[str] = Field(default_factory=list)
    first_exposure_date: Optional[date] = None
    threshold_percentage: Optional[float] = None
    total_sales: Optional[float] = None
    estimated_liability: Optional[float] = None
    confidence_level: Optional[str] = None  # high, medium, low
    notes: Optional[str] = None


class StateAssessmentResponse(StateAssessmentBase):
    """Response schema for state assessments."""
    id: UUID
    client_id: UUID
    engagement_id: Optional[UUID] = None
    analysis_id: Optional[UUID] = None
    assessed_at: Optional[datetime] = None
    assessed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    # Include action info if exists
    action_type: Optional[str] = None
    action_status: Optional[str] = None
    action_target_date: Optional[date] = None
    action_assigned_to: Optional[UUID] = None

    class Config:
        from_attributes = True


# --- Deadline Schemas ---

class DeadlineCreate(BaseModel):
    """Schema for creating a deadline."""
    title: str
    description: Optional[str] = None
    deadline_type: DeadlineType
    due_date: date
    state: Optional[str] = None
    client_id: Optional[UUID] = None
    engagement_id: Optional[UUID] = None
    state_action_id: Optional[UUID] = None
    reminder_days: List[int] = Field(default=[7, 3, 1])
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None


class DeadlineUpdate(BaseModel):
    """Schema for updating a deadline."""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    reminder_days: Optional[List[int]] = None


class DeadlineResponse(BaseModel):
    """Response schema for deadlines."""
    id: UUID
    organization_id: UUID
    client_id: Optional[UUID] = None
    engagement_id: Optional[UUID] = None
    state_action_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    deadline_type: str
    due_date: date
    state: Optional[str] = None
    status: str
    completed_at: Optional[datetime] = None
    reminder_days: List[int]
    is_recurring: bool
    recurrence_pattern: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Computed fields
    days_until: Optional[int] = None
    is_overdue: bool = False

    # Include related names for display
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
