from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


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
    status: Optional[str] = "active"  # active, prospect, churned
    fiscal_year_end: Optional[str] = "12-31"  # MM-DD format


class ClientCreate(ClientBase):
    # Allow creating profile info during initial onboarding
    business_profile: Optional[BusinessProfileBase] = None
    tech_stack: Optional[TechStackBase] = None


class ClientUpdate(ClientBase):
    company_name: Optional[str] = None
    # Allow updating profile info
    business_profile: Optional[BusinessProfileBase] = None
    tech_stack: Optional[TechStackBase] = None


class ClientResponse(ClientBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    # Nested profile data for dashboard population
    business_profile: Optional[BusinessProfileBase] = None
    tech_stack: Optional[TechStackBase] = None

    class Config:
        from_attributes = True


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
