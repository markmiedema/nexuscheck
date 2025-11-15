"""Pydantic response models for API endpoints"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class AnalysisStatus(str, Enum):
    """Analysis status values"""
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETE = "complete"
    ERROR = "error"


class NexusStatus(str, Enum):
    """Nexus determination status"""
    HAS_NEXUS = "has_nexus"
    APPROACHING = "approaching"
    NO_NEXUS = "no_nexus"
    NONE = "none"


class NexusType(str, Enum):
    """Type of nexus established"""
    PHYSICAL = "physical"
    ECONOMIC = "economic"
    BOTH = "both"
    NONE = "none"


class ConfidenceLevel(str, Enum):
    """Confidence in nexus determination"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RegistrationStatus(str, Enum):
    """State registration status"""
    REGISTERED = "registered"
    NOT_REGISTERED = "not_registered"


# ============================================================================
# Response Models - Analyses
# ============================================================================

class AnalysisListItem(BaseModel):
    """Single analysis in list response"""
    id: str
    user_id: str
    client_company_name: str
    industry: Optional[str] = None
    business_type: str
    analysis_period_start: Optional[str] = None  # Can be null in VDA mode
    analysis_period_end: Optional[str] = None    # Can be null in VDA mode
    status: AnalysisStatus
    total_liability: Optional[float] = None
    states_with_nexus: Optional[int] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AnalysesListResponse(BaseModel):
    """Response for GET /analyses"""
    total_count: int
    limit: int
    offset: int
    analyses: List[AnalysisListItem]


class AnalysisDetailResponse(BaseModel):
    """Response for GET /analyses/{id}"""
    id: str
    user_id: str
    client_company_name: str
    industry: Optional[str] = None
    business_type: str
    analysis_period_start: Optional[str] = None
    analysis_period_end: Optional[str] = None
    status: AnalysisStatus
    total_liability: Optional[float] = None
    states_with_nexus: Optional[int] = None
    created_at: str
    updated_at: str
    retention_policy: str
    auto_delete_at: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Response Models - Results
# ============================================================================

class YearSummary(BaseModel):
    """Summary data for a single year"""
    total_sales: float
    transaction_count: int
    direct_sales: float
    marketplace_sales: float
    taxable_sales: float
    exposure_sales: float
    exempt_sales: float
    estimated_liability: float
    base_tax: float
    interest: float
    penalties: float
    # Metadata
    interest_rate: Optional[float] = None
    interest_method: Optional[str] = None
    days_outstanding: Optional[int] = None
    penalty_rate: Optional[float] = None


class ThresholdInfo(BaseModel):
    """Threshold information for a state"""
    revenue_threshold: Optional[float] = None
    transaction_threshold: Optional[int] = None
    threshold_operator: Optional[str] = None


class YearData(BaseModel):
    """Year-by-year nexus data"""
    year: int
    nexus_type: Optional[str] = None
    nexus_date: Optional[str] = None
    obligation_start_date: Optional[str] = None
    first_nexus_year: Optional[int] = None
    # Sales data (flattened from YearSummary)
    total_sales: float
    direct_sales: float
    marketplace_sales: float
    taxable_sales: float
    exposure_sales: float
    exempt_sales: float
    # Liability data (flattened from YearSummary)
    estimated_liability: float
    base_tax: float
    interest: Optional[float] = None
    penalties: Optional[float] = None
    # Optional fields (may not be included in year_data)
    transaction_count: Optional[int] = None
    interest_rate: Optional[float] = None
    interest_method: Optional[str] = None
    days_outstanding: Optional[int] = None
    penalty_rate: Optional[float] = None
    revenue_threshold: Optional[float] = None
    transaction_threshold: Optional[int] = None
    threshold_operator: Optional[str] = None


class StateResult(BaseModel):
    """Single state result in list"""
    state_code: str
    state_name: str
    nexus_status: NexusStatus
    nexus_type: NexusType
    total_sales: float
    exempt_sales: float
    taxable_sales: float
    direct_sales: float
    marketplace_sales: float
    threshold: float
    threshold_percent: float
    estimated_liability: float
    confidence_level: ConfidenceLevel
    registration_status: Optional[RegistrationStatus] = None
    year_data: List[YearData]


class StateResultsResponse(BaseModel):
    """Response for GET /analyses/{id}/results/states"""
    analysis_id: str
    total_states: int
    states: List[StateResult]


class ResultsSummaryResponse(BaseModel):
    """Response for GET /analyses/{id}/results/summary"""
    analysis_id: str
    company_name: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    status: str
    completed_at: str
    summary: Dict[str, Any]  # total_states_analyzed, states_with_nexus, states_approaching_threshold, etc.
    nexus_breakdown: Dict[str, int]  # physical_nexus, economic_nexus, no_nexus, both
    top_states_by_liability: List[Dict[str, Any]]
    approaching_threshold: List[Dict[str, Any]]


# ============================================================================
# Response Models - State Detail
# ============================================================================

class TaxRates(BaseModel):
    """Tax rate information"""
    state_rate: float
    avg_local_rate: float
    combined_rate: float
    max_local_rate: float


class RegistrationInfo(BaseModel):
    """State registration information"""
    registration_required: bool
    registration_threshold: Optional[str] = None
    estimated_timeline: Optional[str] = None


class ComplianceInfo(BaseModel):
    """Compliance requirements for a state"""
    tax_rates: TaxRates
    threshold_info: ThresholdInfo
    registration_info: RegistrationInfo
    filing_frequency: str
    filing_method: str
    sstm_member: bool


class StateDetailResponse(BaseModel):
    """Response for GET /analyses/{id}/states/{state_code}"""
    state_code: str
    state_name: str
    analysis_id: str
    has_transactions: bool
    analysis_period: Dict[str, List[int]]  # {"years_available": [2023, 2024]}
    year_data: List[YearData]
    compliance_info: ComplianceInfo
    # Aggregate totals (always returned)
    total_sales: float
    taxable_sales: float
    exempt_sales: float
    direct_sales: float
    marketplace_sales: float
    exposure_sales: float
    transaction_count: int
    estimated_liability: float
    base_tax: float
    interest: float
    penalties: float
    nexus_type: str
    first_nexus_year: Optional[int] = None


# ============================================================================
# Response Models - Upload/Validation
# ============================================================================

class AutoDetectedMappings(BaseModel):
    """Auto-detected column mappings"""
    mappings: Dict[str, str]
    confidence: Dict[str, str]  # "high", "medium", "low" confidence levels
    samples: Dict[str, List[Any]]
    summary: Optional[Dict[str, Any]] = None  # Can be None if not all required detected
    required_detected: Dict[str, str]  # Maps field name to detected column name
    optional_detected: Dict[str, str]  # Maps field name to detected column name


class DateRange(BaseModel):
    """Detected date range from data"""
    start: str
    end: str
    auto_populated: bool


class UploadResponse(BaseModel):
    """Response for POST /analyses/{id}/upload"""
    message: str
    analysis_id: str
    auto_detected_mappings: AutoDetectedMappings
    all_required_detected: bool
    optional_columns_found: int
    columns_detected: List[str]
    date_range_detected: Optional[DateRange] = None


# ============================================================================
# Response Models - Other Operations
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str


class DeleteResponse(BaseModel):
    """Response for DELETE operations"""
    message: str
    deleted_id: str


class CalculationResponse(BaseModel):
    """Response for POST /analyses/{id}/calculate"""
    message: str
    analysis_id: str
    summary: Dict[str, Any]  # Contains: total_states_analyzed, states_with_nexus, total_estimated_liability, status


class CreateAnalysisResponse(BaseModel):
    """Response for POST /analyses"""
    id: str
    status: str
    message: str


class UpdateAnalysisResponse(BaseModel):
    """Response for PATCH /analyses/{id}"""
    message: str


class ColumnsResponse(BaseModel):
    """Response for GET /analyses/{id}/columns"""
    columns: List[Dict[str, Any]]  # List of {name, sample_values, data_type}
    summary: Dict[str, Any]  # {total_rows, estimated_time, date_range?, unique_states?}


class ValidationResponse(BaseModel):
    """Response for POST /analyses/{id}/validate"""
    message: str
    is_valid: bool
    errors: List[str]
    warnings: List[str]


class NormalizationPreviewResponse(BaseModel):
    """Response for POST /analyses/{id}/preview-normalization"""
    preview_data: List[Dict[str, Any]]
    transformations: List[str]
    validation: Dict[str, Any]
    warnings: List[str]
    summary: Dict[str, Any]


class ValidateAndSaveResponse(BaseModel):
    """Response for POST /analyses/{id}/validate-and-save"""
    message: str
    transactions_saved: int
