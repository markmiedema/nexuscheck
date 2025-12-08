"""Pydantic schemas for Physical Nexus API"""
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional, Literal

# Valid physical nexus types
PhysicalNexusType = Literal['remote_employee', 'inventory_3pl', 'office', 'other']


class PhysicalNexusCreate(BaseModel):
    """Request schema for creating physical nexus configuration."""

    state_code: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Two-letter state code (e.g., CA, NY)"
    )
    nexus_date: date = Field(
        ...,
        description="Date physical nexus was established"
    )
    reason: Optional[str] = Field(
        None,
        description="Reason for physical nexus (e.g., 'Office opened', 'Warehouse established')"
    )
    nexus_type: PhysicalNexusType = Field(
        default='other',
        description="Type of physical nexus (remote_employee, inventory_3pl, office, other)"
    )
    registration_date: Optional[date] = Field(
        None,
        description="Date registered with state (if applicable)"
    )
    permit_number: Optional[str] = Field(
        None,
        max_length=50,
        description="State tax permit/registration number"
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Additional notes"
    )

    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v: str) -> str:
        """Ensure state code is uppercase and valid."""
        v = v.upper().strip()

        # Valid US state codes + DC
        valid_states = {
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
        }

        if v not in valid_states:
            raise ValueError(f"Invalid state code: {v}")

        return v

    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from reason if provided."""
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v


class PhysicalNexusUpdate(BaseModel):
    """Request schema for updating physical nexus configuration."""

    nexus_date: Optional[date] = None
    reason: Optional[str] = None
    nexus_type: Optional[PhysicalNexusType] = None
    registration_date: Optional[date] = None
    permit_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: Optional[str]) -> Optional[str]:
        """Ensure reason is not empty if provided."""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Reason cannot be empty")
        return v


class PhysicalNexusResponse(BaseModel):
    """Response schema for physical nexus configuration."""

    analysis_id: str
    state_code: str
    nexus_date: date
    reason: Optional[str] = None
    nexus_type: Optional[PhysicalNexusType] = 'other'
    registration_date: Optional[date]
    permit_number: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PhysicalNexusImportRequest(BaseModel):
    """Request schema for importing physical nexus configurations."""

    configs: dict = Field(
        ...,
        description="Dictionary mapping state codes to configuration objects"
    )

    @field_validator('configs')
    @classmethod
    def validate_configs(cls, v: dict) -> dict:
        """Ensure configs is not empty and has valid structure."""
        if not v:
            raise ValueError("Configs cannot be empty")

        # Validate each config has required fields
        for state_code, config in v.items():
            if not isinstance(config, dict):
                raise ValueError(f"Config for {state_code} must be a dictionary")

            if 'nexus_date' not in config:
                raise ValueError(f"Config for {state_code} missing required field: nexus_date")

        return v


class PhysicalNexusImportResponse(BaseModel):
    """Response schema for import operation."""

    imported_count: int = Field(
        ...,
        description="Number of new configurations imported"
    )
    updated_count: int = Field(
        ...,
        description="Number of existing configurations updated"
    )
    errors: list[dict] = Field(
        default_factory=list,
        description="List of errors encountered during import"
    )
