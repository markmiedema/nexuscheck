"""Pydantic schemas for API validation"""
from .analysis import (
    AnalysisCreate,
    AnalysisUpdate,
    AnalysisResponse,
    BusinessType,
    RetentionPeriod,
    KnownRegistration,
)
from .physical_nexus import (
    PhysicalNexusCreate,
    PhysicalNexusUpdate,
    PhysicalNexusResponse,
)
from .responses import (
    # Enums
    AnalysisStatus,
    NexusStatus,
    NexusType,
    ConfidenceLevel,
    RegistrationStatus,
    # Analysis responses
    AnalysisListItem,
    AnalysesListResponse,
    AnalysisDetailResponse,
    # Results responses
    YearSummary,
    ThresholdInfo,
    YearData,
    StateResult,
    StateResultsResponse,
    ResultsSummaryResponse,
    # State detail
    TaxRates,
    RegistrationInfo,
    ComplianceInfo,
    StateDetailResponse,
    # Upload/validation
    AutoDetectedMappings,
    DateRange,
    UploadResponse,
    # Other
    MessageResponse,
    DeleteResponse,
    CalculationResponse,
    CreateAnalysisResponse,
    UpdateAnalysisResponse,
    ColumnsResponse,
    ValidationResponse,
    NormalizationPreviewResponse,
    ValidateAndSaveResponse,
)

__all__ = [
    # Request schemas
    "AnalysisCreate",
    "AnalysisUpdate",
    "PhysicalNexusCreate",
    "PhysicalNexusUpdate",
    # Response schemas
    "AnalysisResponse",
    "PhysicalNexusResponse",
    "AnalysesListResponse",
    "AnalysisDetailResponse",
    "StateResultsResponse",
    "ResultsSummaryResponse",
    "StateDetailResponse",
    "UploadResponse",
    "MessageResponse",
    "DeleteResponse",
    "CalculationResponse",
    "CreateAnalysisResponse",
    "UpdateAnalysisResponse",
    "ColumnsResponse",
    "ValidationResponse",
    "NormalizationPreviewResponse",
    "ValidateAndSaveResponse",
    # Enums
    "BusinessType",
    "RetentionPeriod",
    "AnalysisStatus",
    "NexusStatus",
    "NexusType",
    "ConfidenceLevel",
    "RegistrationStatus",
]
