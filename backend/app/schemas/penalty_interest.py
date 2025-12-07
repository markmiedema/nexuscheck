"""
Pydantic schemas for state penalty and interest configurations.

Comprehensive schema for state-specific penalty and interest calculations.
Supports all variations found across US states including:
- Simple and compound interest methods
- Split-year interest rates
- Flat, tiered, per-period, and per-day penalties
- Combined penalty caps
- Minimum/maximum thresholds with "greater of" logic
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal, Union, Annotated
from datetime import date, datetime
from enum import Enum


# ============================================
# INTEREST CONFIGURATION
# ============================================

class InterestPeriod(BaseModel):
    """
    Time period for interest rates that change during the year.
    Example: California has 11% Jan-Jun, 10% Jul-Dec
    """
    start_date: str = Field(..., description="ISO date: '2025-01-01'")
    end_date: str = Field(..., description="ISO date: '2025-06-30'")
    annual_rate: Optional[float] = Field(None, ge=0, le=1, description="0.11 for 11%")
    monthly_rate: Optional[float] = Field(None, ge=0, le=1, description="0.01 for 1%/month")

    @validator('annual_rate', 'monthly_rate')
    def at_least_one_rate(cls, v, values):
        # Allow None as we validate completeness at InterestConfig level
        return v


class InterestMethod(str, Enum):
    """Interest calculation methods"""
    SIMPLE = "simple"
    COMPOUND_MONTHLY = "compound_monthly"
    COMPOUND_DAILY = "compound_daily"


class InterestConfig(BaseModel):
    """
    Interest calculation configuration.
    Supports single rates, monthly rates, and time-varying rates.
    """
    # Option 1: Single annual rate (most states)
    annual_rate: Optional[float] = Field(None, ge=0, le=1, description="0.07 for 7%")

    # Option 2: Monthly rate (CT, MS, SD, WY, OK, NV, ND)
    monthly_rate: Optional[float] = Field(None, ge=0, le=1, description="0.01 for 1%/month")

    # Option 3: Time-varying rates (CA, MI, TN, WV)
    periods: Optional[List[InterestPeriod]] = None

    # Calculation method (required)
    method: InterestMethod = Field(..., description="How interest is calculated")

    # Minimum interest amount (SD: min $5)
    minimum_amount: Optional[float] = Field(None, ge=0)


# ============================================
# PENALTY RULE TYPES
# ============================================

class PenaltyType(str, Enum):
    """Discriminator for penalty rule types"""
    FLAT = "flat"
    FLAT_FEE = "flat_fee"
    PER_PERIOD = "per_period"
    PER_DAY = "per_day"
    TIERED = "tiered"
    BASE_PLUS_PER_PERIOD = "base_plus_per_period"


class PeriodType(str, Enum):
    """Period type for per-period penalties"""
    MONTH = "month"
    THIRTY_DAYS = "30_days"


class AdditionalAfterDays(BaseModel):
    """Additional penalty applied after X days (MS, MD style)"""
    days: int = Field(..., gt=0, description="Days after which additional penalty applies")
    additional_rate: float = Field(..., ge=0, le=1, description="Additional rate, e.g. 0.10 for +10%")


class FlatPenalty(BaseModel):
    """
    Flat percentage penalty.
    Examples:
    - AL: 10%
    - AL: 10% or $50 (greater of)
    - FL: 10% max 50%
    - MS: 10%, +10% after 60 days
    """
    type: Literal["flat"] = "flat"
    rate: float = Field(..., ge=0, le=1, description="0.10 for 10%")

    # Minimum handling
    minimum_amount: Optional[float] = Field(None, ge=0, description="$50 minimum")
    use_greater_of: Optional[bool] = Field(False, description="True = '10% OR $50, whichever greater'")

    # Maximum cap (FL late payment: 10% but max 50%)
    max_rate: Optional[float] = Field(None, ge=0, le=1, description="0.50 for max 50%")

    # Additional penalty after X days (MS, MD)
    additional_after_days: Optional[AdditionalAfterDays] = None


class FlatFeePenalty(BaseModel):
    """
    Flat fee only (no percentage).
    Examples:
    - TX late filing: $50
    - WI late filing: $20
    """
    type: Literal["flat_fee"] = "flat_fee"
    amount: float = Field(..., ge=0, description="50 for $50")


class PerPeriodPenalty(BaseModel):
    """
    Per period (month or 30 days) penalty.
    Examples:
    - AZ: 4.5%/month max 25%
    - AR: 5%/month max 35% min $50
    - KY: 2% per 30 days max 20% min $10
    - NJ: 5%/month max 25% + $100
    """
    type: Literal["per_period"] = "per_period"
    rate_per_period: float = Field(..., ge=0, le=1, description="0.045 for 4.5%")
    period_type: PeriodType = Field(..., description="'month' or '30_days'")

    # Caps and minimums
    max_rate: Optional[float] = Field(None, ge=0, le=1, description="0.25 for max 25%")
    minimum_amount: Optional[float] = Field(None, ge=0, description="$50 minimum")
    use_greater_of: Optional[bool] = Field(False, description="For min comparison")

    # Additional flat fee on top (NJ: 5%/month max 25% + $100)
    additional_flat_fee: Optional[float] = Field(None, ge=0, description="100 for +$100")


class PerDayPenalty(BaseModel):
    """
    Per day penalty.
    Example:
    - RI: $10/day max $500
    """
    type: Literal["per_day"] = "per_day"
    amount_per_day: float = Field(..., ge=0, description="10 for $10/day")
    max_amount: float = Field(..., ge=0, description="500 for $500 max")


class PenaltyTier(BaseModel):
    """Tier definition for tiered penalties"""
    start_day: int = Field(..., ge=0, description="1, 31, 61 etc")
    end_day: Optional[int] = Field(None, ge=0, description="30, 60, or null for infinity")
    rate: float = Field(..., ge=0, le=1, description="0.09, 0.19, 0.29")


class TieredPenalty(BaseModel):
    """
    Tiered by days penalty.
    Examples:
    - WA: 9% (1-30 days), 19% (31-60 days), 29% (61+ days)
    - IL: 2% (1-30 days), 10% (31+ days)
    - TX: 5% (1-30 days), 10% (31+ days)
    """
    type: Literal["tiered"] = "tiered"
    tiers: List[PenaltyTier] = Field(..., min_length=1, description="At least one tier required")


class EscalatingMinimum(BaseModel):
    """Escalating minimum for base+per-period penalties"""
    after_days: int = Field(..., gt=0, description="60 days")
    minimum_amount: float = Field(..., ge=0, description="100 for $100")


class BasePlusPerPeriodPenalty(BaseModel):
    """
    Base + per period penalty.
    Examples:
    - NY: 10% + 1%/month max 30%, min $50, $100 if >60 days
    - CO: 10% + 0.5%/month max 18%
    """
    type: Literal["base_plus_per_period"] = "base_plus_per_period"
    base_rate: float = Field(..., ge=0, le=1, description="0.10 for 10%")
    rate_per_period: float = Field(..., ge=0, le=1, description="0.01 for 1%")
    period_type: PeriodType = Field(..., description="'month' or '30_days'")
    max_rate: Optional[float] = Field(None, ge=0, le=1, description="0.30 for max 30%")

    # Simple minimum
    minimum_amount: Optional[float] = Field(None, ge=0, description="$50")

    # Escalating minimum by days (NY: $100 if >60 days)
    escalating_minimums: Optional[List[EscalatingMinimum]] = None


# Union type for all penalty rules
PenaltyRule = Annotated[
    Union[
        FlatPenalty,
        FlatFeePenalty,
        PerPeriodPenalty,
        PerDayPenalty,
        TieredPenalty,
        BasePlusPerPeriodPenalty
    ],
    Field(discriminator='type')
]


# ============================================
# COMBINED PENALTY RULES
# ============================================

class CombinedPenaltyRules(BaseModel):
    """
    Rules for combined penalty caps across penalty types.
    Examples:
    - GA: late filing + late payment combined max 25%
    - MS: combined max 20%
    """
    max_combined_rate: float = Field(..., ge=0, le=1, description="0.25 for max 25%")
    applies_to: List[Literal["late_filing", "late_payment"]] = Field(
        ...,
        min_length=1,
        description="Which penalties are combined"
    )


# ============================================
# PENALTY APPLICATION OPTIONS
# ============================================

class PenaltyBase(str, Enum):
    """What the penalty percentage is applied to"""
    TAX_ONLY = "tax_only"
    TAX_PLUS_INTEREST = "tax_plus_interest"


class PenaltyApplicationOptions(BaseModel):
    """Options for how penalties are calculated and applied"""
    penalty_base: PenaltyBase = Field(
        default=PenaltyBase.TAX_ONLY,
        description="What the penalty percentage is applied to"
    )

    # For states with discretionary ranges
    discretionary: Optional[bool] = Field(False)
    discretionary_note: Optional[str] = Field(
        None,
        description="'Up to 50% at department discretion'"
    )


# ============================================
# FULL STATE CONFIG
# ============================================

class StatePenaltyInterestConfig(BaseModel):
    """Complete penalty and interest configuration for a state"""

    # Interest configuration (required)
    interest: InterestConfig

    # Core penalties (null if not applicable)
    late_filing: Optional[PenaltyRule] = None
    late_payment: Optional[PenaltyRule] = None

    # Combined penalty rules (GA, MS)
    combined_rules: Optional[CombinedPenaltyRules] = None

    # Penalty application options
    penalty_options: Optional[PenaltyApplicationOptions] = None

    # Optional additional penalties
    negligence: Optional[PenaltyRule] = None
    e_filing_failure: Optional[PenaltyRule] = None
    fraud: Optional[PenaltyRule] = None
    operating_without_permit: Optional[PenaltyRule] = None
    late_registration: Optional[PenaltyRule] = None
    unregistered_business: Optional[PenaltyRule] = None
    cost_of_collection: Optional[PenaltyRule] = None
    extended_delinquency: Optional[PenaltyRule] = None
    repeated_failure: Optional[PenaltyRule] = None
    willful_disregard: Optional[PenaltyRule] = None

    # Non-calculable notes (e.g., "Criminal penalties possible")
    notes: Optional[str] = None


# ============================================
# DATABASE ROW SCHEMAS
# ============================================

class StatePenaltyInterestConfigCreate(BaseModel):
    """Schema for creating a new config row"""
    state: str = Field(..., min_length=2, max_length=2, description="Two-letter state code")
    effective_date: date = Field(..., description="When this config becomes effective")
    config: StatePenaltyInterestConfig
    source_url: Optional[str] = None
    notes: Optional[str] = None


class StatePenaltyInterestConfigResponse(BaseModel):
    """Schema for config response"""
    id: str
    state: str
    effective_date: date
    annual_interest_rate: Optional[float] = None  # Denormalized for quick queries
    config: StatePenaltyInterestConfig
    source_url: Optional[str] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# CALCULATION RESULT SCHEMAS
# ============================================

class PenaltyBreakdown(BaseModel):
    """Detailed breakdown of calculated penalties"""
    late_filing: float = 0
    late_payment: float = 0
    negligence: Optional[float] = None
    e_filing_failure: Optional[float] = None
    fraud: Optional[float] = None
    operating_without_permit: Optional[float] = None
    late_registration: Optional[float] = None
    unregistered_business: Optional[float] = None
    cost_of_collection: Optional[float] = None
    extended_delinquency: Optional[float] = None
    repeated_failure: Optional[float] = None
    willful_disregard: Optional[float] = None
    total: float = 0


class PenaltyInterestCalculationResult(BaseModel):
    """Complete calculation result with all details"""
    # Amounts
    interest: float
    penalties: PenaltyBreakdown
    total_penalties: float
    total_liability: float  # base_tax + interest + total_penalties

    # Calculation details
    interest_rate: float  # Effective annual rate used
    interest_method: InterestMethod
    days_outstanding: int
    years_outstanding: float

    # For display
    config_effective_date: date
    state: str
