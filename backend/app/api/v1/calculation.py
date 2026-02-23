"""Nexus calculation trigger endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.config import settings
from app.schemas.responses import CalculationResponse
from app.services.nexus_calculator_v2 import NexusCalculatorV2
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/{analysis_id}/calculate", response_model=CalculationResponse)
@limiter.limit(settings.RATE_LIMIT_CALCULATE)
async def calculate_nexus(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Run nexus calculation engine for this analysis.

    Determines economic nexus status and calculates estimated tax liability
    for each state based on uploaded transaction data.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Check if there are transactions to analyze
        transactions_result = supabase.table('sales_transactions') \
            .select('id') \
            .eq('analysis_id', analysis_id) \
            .limit(1) \
            .execute()

        if not transactions_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data found. Please upload data first."
            )

        # Initialize calculator and run calculation
        calculator = NexusCalculatorV2(supabase)
        result = calculator.calculate_nexus_for_analysis(analysis_id)

        logger.info(f"Nexus calculation completed for analysis {analysis_id}")

        return CalculationResponse(
            message="Nexus calculation completed successfully",
            analysis_id=analysis_id,
            summary=result
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating nexus for analysis {analysis_id}: {str(e)}")

        # Update analysis status to error
        try:
            supabase.table('analyses').update({
                "status": "error",
                "error_message": str(e),
                "last_error_at": datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate nexus. The analysis has been marked as failed. Please check your data and try again."
        )


@router.post("/{analysis_id}/recalculate", response_model=CalculationResponse)
@limiter.limit(settings.RATE_LIMIT_CALCULATE)
async def recalculate_analysis(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Recalculate analysis results after configuration changes.

    This endpoint re-runs the nexus calculator with the current data and
    configuration (including physical nexus settings). Use this endpoint
    after:
    - Adding/updating/deleting physical nexus configurations
    - Changing VDA settings
    - Modifying any other analysis parameters

    ENHANCEMENT: Enables real-time result updates without page refresh
    when physical nexus or other configurations change.

    Returns:
        Summary of recalculation with states updated count
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Check if there are transactions to analyze
        transactions_result = supabase.table('sales_transactions') \
            .select('id') \
            .eq('analysis_id', analysis_id) \
            .limit(1) \
            .execute()

        if not transactions_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data found. Cannot recalculate without data."
            )

        # Initialize calculator and run recalculation
        # Note: This uses the same calculation logic as initial calculation
        # but the calculator will pick up any updated physical nexus configs
        calculator = NexusCalculatorV2(supabase)
        result = calculator.calculate_nexus_for_analysis(analysis_id)

        logger.info(f"Analysis recalculated for {analysis_id} (triggered after config change)")

        return {
            "message": "Analysis recalculated successfully",
            "analysis_id": analysis_id,
            "states_updated": result.get('states_calculated', 0) if isinstance(result, dict) else 0,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recalculating analysis {analysis_id}: {str(e)}")

        # Update analysis status to error
        try:
            supabase.table('analyses').update({
                "status": "error",
                "error_message": str(e),
                "last_error_at": datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
        except Exception as db_error:
            logger.error(f"Failed to update analysis status to error in database: {str(db_error)}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to recalculate analysis. The analysis has been marked as failed. Please try again."
        )
