"""Pydantic schemas for analysis endpoints"""
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional, List
from enum import Enum


class BusinessType(str, Enum):
    """Business type options"""
    PRODUCT_SALES = "product_sales"
    DIGITAL_PRODUCTS = "digital_products"
    MIXED = "mixed"


class RetentionPeriod(str, Enum):
    """Data retention period options"""
    DELETE_IMMEDIATE = "delete_immediate"
    DAYS_90 = "90_days"
    YEAR_1 = "1_year"


class KnownRegistration(BaseModel):
    """Known state registration"""
    state_code: str = Field(..., min_length=2, max_length=2)
    registration_date: date
    permit_number: Optional[str] = None


class AnalysisCreate(BaseModel):
    """Schema for creating new analysis"""
    company_name: str = Field(..., min_length=1, max_length=200)
    period_start: Optional[date] = None  # Optional - will be auto-detected from CSV
    period_end: Optional[date] = None    # Optional - will be auto-detected from CSV
    business_type: BusinessType
    retention_period: RetentionPeriod = RetentionPeriod.DAYS_90
    known_registrations: List[KnownRegistration] = []
    notes: Optional[str] = None
    client_id: Optional[str] = None  # Link to CRM client

    @validator('period_end')
    def validate_period_end(cls, v, values):
        """Ensure period_end is after period_start (only if both provided)"""
        # Only validate if both dates are provided
        if v and 'period_start' in values and values['period_start']:
            if v <= values['period_start']:
                raise ValueError('period_end must be after period_start')
        return v


class AnalysisUpdate(BaseModel):
    """Schema for updating analysis"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    notes: Optional[str] = None
    retention_period: Optional[RetentionPeriod] = None


class AnalysisResponse(BaseModel):
    """Schema for analysis response"""
    analysis_id: str
    company_name: str
    period_start: date
    period_end: date
    business_type: BusinessType
    status: str
    created_at: str
    updated_at: str
    retention_period: RetentionPeriod
    auto_delete_at: Optional[str] = None

    class Config:
        from_attributes = True
