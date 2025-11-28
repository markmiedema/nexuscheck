"""Pydantic schemas for exemption management"""
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class ExemptionReason(str, Enum):
    """Predefined exemption reasons"""
    RESALE_CERTIFICATE = "resale_certificate"
    GOVERNMENT_NONPROFIT = "government_nonprofit"
    PRODUCT_EXEMPT = "product_exempt"
    MANUFACTURING_EXEMPTION = "manufacturing_exemption"
    AGRICULTURAL_EXEMPTION = "agricultural_exemption"
    OTHER = "other"


class ExemptionAuditAction(str, Enum):
    """Types of exemption changes"""
    CREATED = "created"
    UPDATED = "updated"
    REMOVED = "removed"


# =============================================================================
# Request Schemas
# =============================================================================

class ExemptionUpdate(BaseModel):
    """Request to mark a transaction as exempt"""
    exempt_amount: Decimal = Field(..., ge=0, description="Amount to mark as exempt")
    reason: ExemptionReason = Field(..., description="Reason for exemption")
    reason_other: Optional[str] = Field(None, max_length=255, description="Custom reason when reason='other'")
    note: Optional[str] = Field(None, description="User notes for their records")

    @field_validator('reason_other')
    @classmethod
    def validate_reason_other(cls, v, info):
        """Require reason_other when reason is 'other'"""
        if info.data.get('reason') == ExemptionReason.OTHER and not v:
            raise ValueError("reason_other is required when reason is 'other'")
        return v


class BulkExemptionUpdate(BaseModel):
    """Request to mark multiple transactions as exempt"""
    transaction_ids: List[str] = Field(..., min_length=1, description="List of transaction IDs to mark")
    exempt_full_amount: bool = Field(True, description="If true, exempt full amount; if false, use exempt_amount")
    exempt_amount: Optional[Decimal] = Field(None, ge=0, description="Amount to exempt (when exempt_full_amount=False)")
    reason: ExemptionReason = Field(..., description="Reason for exemption")
    reason_other: Optional[str] = Field(None, max_length=255, description="Custom reason when reason='other'")
    note: Optional[str] = Field(None, description="User notes for their records")

    @field_validator('exempt_amount')
    @classmethod
    def validate_exempt_amount(cls, v, info):
        """Require exempt_amount when exempt_full_amount is False"""
        if not info.data.get('exempt_full_amount', True) and v is None:
            raise ValueError("exempt_amount is required when exempt_full_amount is False")
        return v

    @field_validator('reason_other')
    @classmethod
    def validate_reason_other(cls, v, info):
        """Require reason_other when reason is 'other'"""
        if info.data.get('reason') == ExemptionReason.OTHER and not v:
            raise ValueError("reason_other is required when reason is 'other'")
        return v


# =============================================================================
# Response Schemas
# =============================================================================

class ExemptionResponse(BaseModel):
    """Response after updating an exemption"""
    success: bool
    transaction_id: str
    exempt_amount: Decimal
    reason: Optional[str] = None
    reason_other: Optional[str] = None
    note: Optional[str] = None
    marked_at: Optional[datetime] = None


class BulkExemptionResponse(BaseModel):
    """Response after bulk updating exemptions"""
    success: bool
    updated_count: int
    failed_count: int = 0
    failed_ids: List[str] = Field(default_factory=list)


class ExemptionRemoveResponse(BaseModel):
    """Response after removing an exemption"""
    success: bool
    transaction_id: str
    previous_exempt_amount: Decimal


class ExemptionAuditEntry(BaseModel):
    """Single audit log entry"""
    id: str
    transaction_id: str
    action: ExemptionAuditAction
    exempt_amount_before: Optional[Decimal] = None
    exempt_amount_after: Optional[Decimal] = None
    reason_before: Optional[str] = None
    reason_after: Optional[str] = None
    reason_other_before: Optional[str] = None
    reason_other_after: Optional[str] = None
    note_before: Optional[str] = None
    note_after: Optional[str] = None
    changed_by: Optional[str] = None
    changed_at: datetime


class ExemptionAuditResponse(BaseModel):
    """Response with audit history"""
    analysis_id: str
    transaction_id: Optional[str] = None  # None if fetching all
    entries: List[ExemptionAuditEntry]
    total_count: int


class ExemptionSummaryByReason(BaseModel):
    """Summary for a single reason category"""
    reason: str
    reason_display: str
    amount: Decimal
    count: int


class ExemptionSummaryResponse(BaseModel):
    """Summary of all exemptions for an analysis"""
    analysis_id: str
    total_exempt_amount: Decimal
    exempt_transaction_count: int
    by_reason: List[ExemptionSummaryByReason]


class PendingExemptionChange(BaseModel):
    """A pending exemption change (not yet saved)"""
    transaction_id: str
    action: ExemptionAuditAction
    exempt_amount: Decimal
    reason: Optional[str] = None
    reason_other: Optional[str] = None
    note: Optional[str] = None


class SaveExemptionsRequest(BaseModel):
    """Request to save pending exemption changes and trigger recalculation"""
    changes: List[PendingExemptionChange]
    trigger_recalculation: bool = True


class SaveExemptionsResponse(BaseModel):
    """Response after saving exemption changes"""
    success: bool
    saved_count: int
    recalculation_triggered: bool
    recalculation_status: Optional[str] = None  # 'started', 'completed', 'failed'
