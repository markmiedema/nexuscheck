"""
Organization and Team Member schemas for multi-tenancy support.
Phase 1.4 of Platform Foundation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# --- Portal Branding Settings ---

class PortalBranding(BaseModel):
    """Branding configuration for client portal."""
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str = "#3b82f6"  # Default blue
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    custom_domain: Optional[str] = None  # Future: portal.clientfirm.com


class ReportBranding(BaseModel):
    """Branding configuration for generated reports."""
    logo_url: Optional[str] = None
    company_name: Optional[str] = None
    address_block: Optional[str] = None
    footer_text: Optional[str] = None


class OrganizationSettings(BaseModel):
    """Settings JSONB structure for organizations."""
    portal_branding: Optional[PortalBranding] = None
    report_branding: Optional[ReportBranding] = None


# --- Organization Schemas ---

class OrganizationBase(BaseModel):
    """Base organization fields."""
    name: str
    slug: Optional[str] = None
    billing_email: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    """Create a new organization."""
    pass


class OrganizationUpdate(BaseModel):
    """Update organization fields."""
    name: Optional[str] = None
    slug: Optional[str] = None
    billing_email: Optional[str] = None
    settings: Optional[OrganizationSettings] = None


class OrganizationResponse(OrganizationBase):
    """Organization response with all fields."""
    id: UUID
    owner_user_id: UUID
    subscription_tier: str = "free"
    subscription_status: str = "active"
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Organization Member Schemas ---

class OrganizationMemberBase(BaseModel):
    """Base member fields."""
    role: str = Field(default="staff", pattern="^(owner|admin|staff|viewer)$")


class OrganizationMemberInvite(OrganizationMemberBase):
    """Invite a new member to an organization."""
    email: str
    role: str = "staff"


class OrganizationMemberUpdate(BaseModel):
    """Update member role."""
    role: str = Field(pattern="^(owner|admin|staff|viewer)$")


class OrganizationMemberResponse(OrganizationMemberBase):
    """Member response with user info."""
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID] = None  # Nullable for pending invites
    role: str
    invited_email: Optional[str] = None  # Email for pending invites
    invited_by_user_id: Optional[UUID] = None
    invited_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # User info (joined from users table)
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Organization with Members ---

class OrganizationWithMembersResponse(OrganizationResponse):
    """Organization response including team members."""
    members: List[OrganizationMemberResponse] = []
