"""
Compliance Data API endpoints

Provides access to state compliance reference data including:
- Economic nexus thresholds
- Tax rates
- VDA program information
- Penalty and interest rates

This data is used by the nexus calculator and exposed here
so users can verify the data being used is accurate.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date
from app.core.supabase import get_supabase
from app.core.auth import require_auth
from app.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# Response Models
class ThresholdData(BaseModel):
    state_code: str
    state_name: str
    has_sales_tax: bool
    # Economic nexus thresholds
    revenue_threshold: Optional[Decimal] = None
    transaction_threshold: Optional[int] = None
    threshold_operator: Optional[str] = None  # 'and' or 'or'
    effective_date: Optional[date] = None
    lookback_period: Optional[str] = None
    # Exclusions - what doesn't count toward threshold
    marketplace_excluded: bool = False
    nontaxable_excluded: bool = False
    resale_excluded: bool = False
    # Tax rate
    combined_rate: Optional[Decimal] = None


class StateDetailData(BaseModel):
    state_code: str
    state_name: str
    has_sales_tax: bool
    economic_nexus_effective_date: Optional[date] = None
    # Thresholds
    revenue_threshold: Optional[Decimal] = None
    transaction_threshold: Optional[int] = None
    threshold_operator: Optional[str] = None
    threshold_effective_from: Optional[date] = None
    # Tax structure
    has_local_taxes: bool = False
    has_home_rule_cities: bool = False
    state_tax_rate: Optional[Decimal] = None
    avg_local_rate: Optional[Decimal] = None
    combined_rate: Optional[Decimal] = None
    # VDA program
    has_vda_program: bool = False
    vda_contact_email: Optional[str] = None
    vda_contact_phone: Optional[str] = None
    # Registration
    state_tax_website: Optional[str] = None
    registration_url: Optional[str] = None
    typical_processing_time_days: Optional[int] = None
    # Penalties and interest
    annual_interest_rate: Optional[Decimal] = None
    interest_calculation_method: Optional[str] = None
    late_filing_penalty_rate: Optional[Decimal] = None
    late_payment_penalty_rate: Optional[Decimal] = None
    # Notes
    notes: Optional[str] = None


class ThresholdsResponse(BaseModel):
    success: bool
    data: List[ThresholdData]
    total_count: int


class StateDetailResponse(BaseModel):
    success: bool
    data: StateDetailData


@router.get("/thresholds", response_model=ThresholdsResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_all_thresholds(
    request: Request,
    user_id: str = Depends(require_auth)
):
    """
    Get economic nexus thresholds for all states.

    Returns a comprehensive list of all states with their current
    economic nexus thresholds, tax rates, and basic compliance info.
    This allows users to verify the data being used in calculations.
    """
    supabase = get_supabase()

    # Query states with their current thresholds and tax rates
    # Using a single query with joins would be ideal but Supabase client
    # doesn't support complex joins well, so we'll do multiple queries

    # Get all states
    states_response = supabase.table("states").select("*").order("name").execute()

    if not states_response.data:
        return ThresholdsResponse(success=True, data=[], total_count=0)

    states = {s["code"]: s for s in states_response.data}

    # Get current thresholds (where effective_to is null)
    thresholds_response = supabase.table("economic_nexus_thresholds")\
        .select("*")\
        .is_("effective_to", "null")\
        .execute()

    thresholds = {t["state"]: t for t in (thresholds_response.data or [])}

    # Get current tax rates (where effective_to is null)
    rates_response = supabase.table("tax_rates")\
        .select("*")\
        .is_("effective_to", "null")\
        .execute()

    rates = {r["state"]: r for r in (rates_response.data or [])}

    # Build response
    result = []
    for code, state in states.items():
        threshold = thresholds.get(code, {})
        rate = rates.get(code, {})

        result.append(ThresholdData(
            state_code=code,
            state_name=state["name"],
            has_sales_tax=state.get("has_sales_tax", True),
            revenue_threshold=threshold.get("revenue_threshold"),
            transaction_threshold=threshold.get("transaction_threshold"),
            threshold_operator=threshold.get("threshold_operator"),
            effective_date=threshold.get("effective_from"),
            lookback_period=threshold.get("lookback_period"),
            marketplace_excluded=threshold.get("marketplace_excluded", False),
            nontaxable_excluded=threshold.get("nontaxable_excluded", False),
            resale_excluded=threshold.get("resale_excluded", False),
            combined_rate=rate.get("combined_avg_rate"),
        ))

    return ThresholdsResponse(
        success=True,
        data=result,
        total_count=len(result)
    )


@router.get("/states/{state_code}", response_model=StateDetailResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_state_detail(
    request: Request,
    state_code: str,
    user_id: str = Depends(require_auth)
):
    """
    Get detailed compliance information for a specific state.

    Returns comprehensive state data including thresholds, tax rates,
    VDA program details, registration info, and penalty/interest rates.
    """
    state_code = state_code.upper()

    if len(state_code) != 2:
        raise HTTPException(status_code=400, detail="Invalid state code")

    supabase = get_supabase()

    # Get state info
    state_response = supabase.table("states")\
        .select("*")\
        .eq("code", state_code)\
        .single()\
        .execute()

    if not state_response.data:
        raise HTTPException(status_code=404, detail=f"State {state_code} not found")

    state = state_response.data

    # Get current threshold
    threshold_response = supabase.table("economic_nexus_thresholds")\
        .select("*")\
        .eq("state", state_code)\
        .is_("effective_to", "null")\
        .execute()

    threshold = threshold_response.data[0] if threshold_response.data else {}

    # Get current tax rate
    rate_response = supabase.table("tax_rates")\
        .select("*")\
        .eq("state", state_code)\
        .is_("effective_to", "null")\
        .execute()

    rate = rate_response.data[0] if rate_response.data else {}

    # Get current interest/penalty rates
    penalty_response = supabase.table("interest_penalty_rates")\
        .select("*")\
        .eq("state", state_code)\
        .is_("effective_to", "null")\
        .execute()

    penalty = penalty_response.data[0] if penalty_response.data else {}

    return StateDetailResponse(
        success=True,
        data=StateDetailData(
            state_code=state_code,
            state_name=state["name"],
            has_sales_tax=state.get("has_sales_tax", True),
            economic_nexus_effective_date=state.get("economic_nexus_effective_date"),
            revenue_threshold=threshold.get("revenue_threshold"),
            transaction_threshold=threshold.get("transaction_threshold"),
            threshold_operator=threshold.get("threshold_operator"),
            threshold_effective_from=threshold.get("effective_from"),
            has_local_taxes=state.get("has_local_taxes", False),
            has_home_rule_cities=state.get("has_home_rule_cities", False),
            state_tax_rate=rate.get("state_rate"),
            avg_local_rate=rate.get("avg_local_rate"),
            combined_rate=rate.get("combined_avg_rate"),
            has_vda_program=state.get("has_vda_program", False),
            vda_contact_email=state.get("vda_contact_email"),
            vda_contact_phone=state.get("vda_contact_phone"),
            state_tax_website=state.get("state_tax_website"),
            registration_url=state.get("registration_url"),
            typical_processing_time_days=state.get("typical_processing_time_days"),
            annual_interest_rate=penalty.get("annual_interest_rate"),
            interest_calculation_method=penalty.get("interest_calculation_method"),
            late_filing_penalty_rate=penalty.get("late_filing_penalty_rate"),
            late_payment_penalty_rate=penalty.get("late_payment_penalty_rate"),
            notes=state.get("notes"),
        )
    )
