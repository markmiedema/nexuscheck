from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from uuid import UUID


# --- Discovery Profile Schemas ---

class DiscoveryProfile(BaseModel):
    """Structured discovery data captured during initial client meeting."""
    # Sales Channels
    channels: List[str] = []  # ["dtc", "amazon_fba", "amazon_fbm", "wholesale", "retail", "marketplace_other"]

    # Product Types
    product_types: List[str] = []  # ["physical_goods", "digital_goods", "saas", "services", "mixed"]

    # Systems (Tech Stack from discovery - renamed to avoid collision with TechStack object)
    systems: List[str] = []  # ["shopify", "woocommerce", "bigcommerce", "amazon", "netsuite", "quickbooks", "xero", "stripe"]

    # Physical Presence (Critical for Nexus)
    has_remote_employees: bool = False
    remote_employee_states: List[str] = []  # State codes

    has_inventory_3pl: bool = False
    inventory_3pl_states: List[str] = []  # State codes

    # Volume Indicators
    estimated_annual_revenue: Optional[str] = None  # "under_100k", "100k_500k", "500k_1m", "1m_5m", "5m_10m", "over_10m"
    transaction_volume: Optional[str] = None  # "low", "medium", "high"

    # Current Filing Status
    current_registration_count: int = 0
    registered_states: List[str] = []

    # Notes
    discovery_notes: Optional[str] = None
    discovery_completed_at: Optional[datetime] = None


# --- Profile Schemas ---

class BusinessProfileBase(BaseModel):
    """Business profile for understanding client's commerce model."""
    is_marketplace_seller: bool = False
    marketplace_channels: List[str] = []
    percent_marketplace_revenue: Optional[float] = Field(None, ge=0, le=100)
    sells_tpp: bool = True  # Tangible Personal Property
    sells_saas: bool = False
    sells_digital_goods: bool = False
    has_inventory_3pl: bool = False  # Has 3PL/warehouse inventory (physical nexus indicator)
    uses_fba: bool = False  # Fulfillment by Amazon


class TechStackBase(BaseModel):
    """Client's technology stack for integration planning."""
    erp_system: Optional[str] = None
    ecommerce_platform: Optional[str] = None
    tax_engine: Optional[str] = None
    data_hygiene_score: Optional[int] = Field(None, ge=1, le=10)


# --- Client Schemas ---

class ClientBase(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    # CRM Fields
    status: Optional[str] = "active"  # active, prospect, churned (legacy)
    fiscal_year_end: Optional[str] = "12-31"  # MM-DD format
    # Lifecycle stage
    lifecycle_status: Optional[str] = "prospect"  # prospect, scoping, active, inactive, churned


class ClientCreate(ClientBase):
    # Simplified creation - just the basics
    # Business details are captured during Discovery meeting
    pass


class ClientUpdate(ClientBase):
    company_name: Optional[str] = None
    # Legacy profile info (kept for backward compatibility)
    business_profile: Optional[BusinessProfileBase] = None
    tech_stack: Optional[TechStackBase] = None

    # Discovery Profile fields (updated via Discovery tab)
    channels: Optional[List[str]] = None
    product_types: Optional[List[str]] = None
    systems: Optional[List[str]] = None
    has_remote_employees: Optional[bool] = None
    remote_employee_states: Optional[List[str]] = None
    has_inventory_3pl: Optional[bool] = None
    inventory_3pl_states: Optional[List[str]] = None
    estimated_annual_revenue: Optional[str] = None
    transaction_volume: Optional[str] = None
    current_registration_count: Optional[int] = None
    registered_states: Optional[List[str]] = None
    discovery_notes: Optional[str] = None
    discovery_completed_at: Optional[datetime] = None


class ClientResponse(ClientBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    # Nested profile data for dashboard population
    business_profile: Optional[BusinessProfileBase] = None
    tech_stack: Optional[TechStackBase] = None

    # Discovery profile data
    channels: Optional[List[str]] = None
    product_types: Optional[List[str]] = None
    systems: Optional[List[str]] = None  # Tech systems from discovery (renamed from tech_stack)
    has_remote_employees: Optional[bool] = None
    remote_employee_states: Optional[List[str]] = None
    has_inventory_3pl: Optional[bool] = None
    inventory_3pl_states: Optional[List[str]] = None
    estimated_annual_revenue: Optional[str] = None
    transaction_volume: Optional[str] = None
    current_registration_count: Optional[int] = None
    registered_states: Optional[List[str]] = None
    discovery_completed_at: Optional[datetime] = None
    discovery_notes: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# --- Client Note Schemas ---

class ClientNoteBase(BaseModel):
    content: str
    note_type: Optional[str] = None  # e.g., 'discovery', 'email', 'call', 'meeting'


class ClientNoteCreate(ClientNoteBase):
    pass


class ClientNoteResponse(ClientNoteBase):
    id: UUID
    client_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Client Contact Schemas ---

class ClientContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_primary: bool = False


class ClientContactCreate(ClientContactBase):
    pass


class ClientContactResponse(ClientContactBase):
    id: UUID
    client_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# --- Engagement Schemas ---

class ScopeConfig(BaseModel):
    """Structured scope configuration for feature gating."""
    services: List[str] = []  # ["nexus_study", "vda_remediation", "state_registration", "monthly_compliance", "audit_defense"]
    tier: Optional[str] = None  # "implementation", "compliance", "advisory"
    pricing_model: Optional[str] = None  # "fixed_fee", "hourly", "subscription"
    authorized_states: List[str] = []  # Limits scope creep
    estimated_fee: Optional[float] = None
    retainer_monthly: Optional[float] = None
    legacy: bool = False  # True for auto-migrated legacy engagements


class EngagementBase(BaseModel):
    title: str
    status: str = "draft"  # draft, sent, signed, archived, cancelled
    scope_config: Optional[ScopeConfig] = None
    scope_summary: Optional[str] = None
    document_url: Optional[str] = None
    sent_at: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None


class EngagementCreate(EngagementBase):
    client_id: UUID


class EngagementUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    scope_config: Optional[ScopeConfig] = None
    scope_summary: Optional[str] = None
    document_url: Optional[str] = None
    sent_at: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None


class EngagementResponse(EngagementBase):
    id: UUID
    client_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    # Include client info for convenience
    client_name: Optional[str] = None

    class Config:
        from_attributes = True


class EngagementWithProjectsResponse(EngagementResponse):
    """Engagement with linked projects/analyses."""
    projects: List[Dict[str, Any]] = []  # List of linked analyses
