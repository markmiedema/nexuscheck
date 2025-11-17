"""VDA Scenario API

Endpoints for Voluntary Disclosure Agreement (VDA) scenario modeling.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.services.vda_calculator import VDACalculator
from app.schemas import MessageResponse
from app.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class VDARequest(BaseModel):
    """Request to calculate VDA scenario."""
    selected_states: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "selected_states": ["CA", "NY", "TX"]
            }
        }


class StateVDABreakdown(BaseModel):
    """Per-state VDA breakdown."""
    state_code: str
    state_name: str
    before_vda: float
    with_vda: float
    savings: float
    penalty_waived: float
    interest_waived: float
    base_tax: float
    interest: float
    penalties: float


class VDAResponse(BaseModel):
    """VDA calculation response."""
    total_savings: float
    before_vda: float
    with_vda: float
    savings_percentage: float
    state_breakdown: List[StateVDABreakdown]


class VDAStatusResponse(BaseModel):
    """VDA status response."""
    vda_enabled: bool
    vda_selected_states: List[str]
    total_savings: float


@router.post("/{analysis_id}/vda", response_model=VDAResponse)
@limiter.limit(settings.RATE_LIMIT_CALCULATE)
async def calculate_vda_scenario(
    http_request: Request,
    analysis_id: str,
    request: VDARequest,
    user_id: str = Depends(get_current_user)
):
    """
    Calculate VDA scenario with selected states.

    VDA (Voluntary Disclosure Agreement) allows businesses to voluntarily
    report uncollected taxes with reduced penalties and limited lookback.

    **Benefits:**
    - Penalties typically waived (most states)
    - Limited lookback (3-4 years vs unlimited)
    - No criminal liability
    - Interest sometimes reduced

    **This endpoint:**
    - Calculates savings for selected states
    - Shows before/after comparison
    - Updates state_results with VDA calculations
    - Marks analysis as VDA-enabled

    **Request Body:**
    ```json
    {
        "selected_states": ["CA", "NY", "TX"]
    }
    ```

    **Response:**
    ```json
    {
        "total_savings": 15000.00,
        "before_vda": 50000.00,
        "with_vda": 35000.00,
        "savings_percentage": 30.0,
        "state_breakdown": [...]
    }
    ```
    """
    # Validate analysis ownership
    analysis_response = supabase.table('analyses')\
        .select('*')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Validate at least one state selected
    if not request.selected_states:
        raise HTTPException(
            status_code=400,
            detail="At least one state must be selected for VDA"
        )

    # Validate state codes are uppercase 2-letter codes
    invalid_states = [s for s in request.selected_states if len(s) != 2 or not s.isupper()]
    if invalid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state codes: {', '.join(invalid_states)}. Must be uppercase 2-letter codes (e.g., 'CA', 'NY')"
        )

    # Calculate VDA
    calculator = VDACalculator(supabase)
    try:
        results = calculator.calculate_vda_scenario(
            analysis_id,
            request.selected_states
        )
    except ValueError as e:
        logger.error(f"VDA calculation validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid VDA configuration. Please check your selected states and try again.")

    return VDAResponse(**results)


@router.delete("/{analysis_id}/vda", response_model=MessageResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def disable_vda(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Disable VDA mode for analysis.

    Clears:
    - VDA enabled flag
    - Selected states list
    - VDA calculations from state_results

    Returns to normal liability calculations.
    """
    # Validate ownership
    analysis_response = supabase.table('analyses')\
        .select('*')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Disable VDA
    calculator = VDACalculator(supabase)
    calculator.disable_vda(analysis_id)

    return {"message": "VDA disabled successfully"}


@router.get("/{analysis_id}/vda/status", response_model=VDAStatusResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_vda_status(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get current VDA status for analysis.

    Returns:
    - vda_enabled: Boolean indicating if VDA is active
    - vda_selected_states: List of state codes included in VDA
    - total_savings: Current total savings amount

    **Response:**
    ```json
    {
        "vda_enabled": true,
        "vda_selected_states": ["CA", "NY", "TX"],
        "total_savings": 15000.00
    }
    ```
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"VDA status endpoint called for analysis {analysis_id} by user {user_id}")

    try:
        # Validate ownership - select all columns to avoid field not found errors
        analysis_response = supabase.table('analyses')\
            .select('*')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()

        if not analysis_response.data:
            raise HTTPException(status_code=404, detail="Analysis not found")

        analysis = analysis_response.data[0]

        # If VDA enabled, get total savings
        total_savings = 0
        if analysis.get('vda_enabled', False):
            savings_response = supabase.table('state_results')\
                .select('vda_total_savings')\
                .eq('analysis_id', analysis_id)\
                .execute()

            total_savings = sum(
                row.get('vda_total_savings', 0) or 0
                for row in savings_response.data
            )

        return VDAStatusResponse(
            vda_enabled=analysis.get('vda_enabled', False),
            vda_selected_states=analysis.get('vda_selected_states', []) or [],
            total_savings=total_savings
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log and return more helpful error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting VDA status for analysis {analysis_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get VDA status. Please try again."
        )
