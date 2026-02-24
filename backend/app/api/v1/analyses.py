"""Analysis CRUD endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional, Tuple
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth, require_organization
from app.core.supabase import get_supabase
from app.config import settings
from app.schemas.analysis import AnalysisCreate
from app.schemas.responses import (
    AnalysesListResponse,
    AnalysisDetailResponse,
    DeleteResponse,
    CreateAnalysisResponse,
)
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=AnalysesListResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def list_analyses(
    request: Request,
    auth: Tuple[str, str] = Depends(require_organization),
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    status_filter: Optional[str] = None
):
    """
    List all analyses for the current organization.

    Supports pagination, search, and filtering.

    Args:
        auth: Tuple of (user_id, organization_id)
        limit: Max number of analyses to return (default: 50)
        offset: Number of analyses to skip (default: 0)
        search: Optional search term for client company name
        status_filter: Optional filter by status (draft, processing, complete, error)

    Returns:
        Paginated list of analyses with metadata
    """
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Build query - filter by organization to show all team members' analyses
        query = supabase.table('analyses')\
            .select('*', count='exact')\
            .eq('organization_id', org_id)\
            .is_('deleted_at', 'null')  # Exclude soft-deleted

        # Apply search filter if provided
        if search:
            query = query.ilike('client_company_name', f'%{search}%')

        # Apply status filter if provided
        if status_filter:
            query = query.eq('status', status_filter)

        # Apply ordering and pagination
        result = query.order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        return AnalysesListResponse(
            total_count=result.count,
            limit=limit,
            offset=offset,
            analyses=result.data
        )

    except Exception as e:
        logger.error(f"Error listing analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analyses. Please try again or contact support."
        )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_analysis(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get analysis details by ID.
    """
    try:
        supabase = get_supabase()

        # Get analysis
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get transaction stats if available
        transactions_result = supabase.table('sales_transactions') \
            .select('customer_state') \
            .eq('analysis_id', analysis_id) \
            .execute()

        total_transactions = len(transactions_result.data) if transactions_result.data else 0
        unique_states = len(set(t['customer_state'] for t in transactions_result.data)) if transactions_result.data else 0

        # Add computed fields
        analysis['total_transactions'] = total_transactions
        analysis['unique_states'] = unique_states

        return AnalysisDetailResponse(**analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis. Please try again or contact support."
        )


@router.post("", response_model=CreateAnalysisResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def create_analysis(
    request: Request,
    analysis_data: AnalysisCreate,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """
    Create a new analysis project.

    Request body should contain:
    - company_name: Company name (1-200 characters)
    - period_start: Analysis start date
    - period_end: Analysis end date (must be after start date)
    - business_type: Type of business (product_sales, digital_products, or mixed)
    - known_registrations: List of known state registrations (optional)
    - notes: Internal notes (optional)
    """
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Ensure user exists in users table (Supabase auth creates users in auth.users only)
        # We need a corresponding record in our users table for foreign key constraint
        try:
            existing_user = supabase.table('users').select('id').eq('id', user_id).execute()

            if not existing_user.data:
                # Create minimal user record (email can be updated later via profile)
                supabase.table('users').upsert({
                    "id": user_id,
                    "email": f"{user_id}@temp.com",  # Placeholder, will be updated
                    "created_at": datetime.utcnow().isoformat()
                }, on_conflict="id").execute()
                logger.info(f"Created user record for {user_id}")
        except Exception as user_err:
            logger.warning(f"Could not create/check user record: {user_err}")

        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())

        # Prepare analysis data for database (matching actual schema)
        analysis_record = {
            "id": analysis_id,
            "user_id": user_id,
            "organization_id": org_id,
            "client_company_name": analysis_data.company_name,
            # Use .isoformat() only if date exists, otherwise None (will be auto-detected from CSV)
            "analysis_period_start": analysis_data.period_start.isoformat() if analysis_data.period_start else None,
            "analysis_period_end": analysis_data.period_end.isoformat() if analysis_data.period_end else None,
            "business_type": analysis_data.business_type.value,
            "retention_policy": analysis_data.retention_period.value,
            "status": "draft",  # Initial status
            "client_id": analysis_data.client_id,  # Link to client if provided
        }

        # Insert analysis into database
        result = supabase.table('analyses').insert(analysis_record).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create analysis"
            )

        # Auto-populate physical nexus from client's Discovery Profile
        # This connects the CRM data to the calculation engine ("Intelligence Integration")
        physical_nexus_auto_created = []

        if analysis_data.client_id:
            try:
                # Fetch client's discovery profile
                logger.info(f"Fetching discovery profile for client_id: {analysis_data.client_id}")
                client_result = supabase.table('clients')\
                    .select('has_remote_employees, remote_employee_states, remote_employee_state_dates, has_inventory_3pl, inventory_3pl_states, inventory_3pl_state_dates')\
                    .eq('id', analysis_data.client_id)\
                    .eq('user_id', user_id)\
                    .execute()

                logger.info(f"Client discovery data: {client_result.data}")

                if client_result.data:
                    client = client_result.data[0]
                    # Default date if no establishment date provided in Discovery
                    default_nexus_date = "2020-01-01"

                    # Get date dictionaries (state code -> establishment date)
                    remote_dates = client.get('remote_employee_state_dates') or {}
                    inventory_dates = client.get('inventory_3pl_state_dates') or {}

                    logger.info(f"has_remote_employees: {client.get('has_remote_employees')}, remote_employee_states: {client.get('remote_employee_states')}")
                    logger.info(f"remote_employee_state_dates: {remote_dates}")
                    logger.info(f"has_inventory_3pl: {client.get('has_inventory_3pl')}, inventory_3pl_states: {client.get('inventory_3pl_states')}")
                    logger.info(f"inventory_3pl_state_dates: {inventory_dates}")

                    # Remote Employees trigger physical nexus (the "Silent Killer")
                    if client.get('has_remote_employees') and client.get('remote_employee_states'):
                        for state_code in client['remote_employee_states']:
                            # Use date from Discovery if provided, otherwise default
                            nexus_date = remote_dates.get(state_code, default_nexus_date)
                            try:
                                supabase.table('physical_nexus').insert({
                                    'analysis_id': analysis_id,
                                    'state_code': state_code,
                                    'nexus_date': nexus_date,
                                    'reason': 'Remote Employee',
                                    'notes': 'Auto-populated from client Discovery Profile'
                                }).execute()
                                physical_nexus_auto_created.append(state_code)
                                logger.info(f"Auto-created physical nexus for {state_code} (Remote Employee) with date {nexus_date}")
                            except Exception as pn_err:
                                logger.warning(f"Could not auto-create physical nexus for {state_code}: {pn_err}")
                    else:
                        logger.info("No remote employee states to auto-populate")

                    # 3PL/FBA Inventory triggers physical nexus
                    if client.get('has_inventory_3pl') and client.get('inventory_3pl_states'):
                        for state_code in client['inventory_3pl_states']:
                            # Skip if already created (might overlap with employee states)
                            if state_code in physical_nexus_auto_created:
                                continue
                            # Use date from Discovery if provided, otherwise default
                            nexus_date = inventory_dates.get(state_code, default_nexus_date)
                            try:
                                supabase.table('physical_nexus').insert({
                                    'analysis_id': analysis_id,
                                    'state_code': state_code,
                                    'nexus_date': nexus_date,
                                    'reason': '3PL/FBA Inventory',
                                    'notes': 'Auto-populated from client Discovery Profile'
                                }).execute()
                                physical_nexus_auto_created.append(state_code)
                                logger.info(f"Auto-created physical nexus for {state_code} (3PL/FBA Inventory) with date {nexus_date}")
                            except Exception as pn_err:
                                logger.warning(f"Could not auto-create physical nexus for {state_code}: {pn_err}")
                    else:
                        logger.info("No 3PL/inventory states to auto-populate")
                else:
                    logger.warning(f"No client data found for client_id: {analysis_data.client_id}")

            except Exception as client_err:
                logger.warning(f"Could not fetch client discovery profile: {client_err}")

        logger.info(f"Created analysis {analysis_id} for user {user_id}")
        if physical_nexus_auto_created:
            logger.info(f"Auto-populated physical nexus for {len(physical_nexus_auto_created)} states: {physical_nexus_auto_created}")

        return {
            "id": analysis_id,
            "status": "setup",
            "message": "Analysis created successfully",
            "physical_nexus_auto_populated": physical_nexus_auto_created
        }

    except ValueError as e:
        logger.error(f"Validation error creating analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input data. Please check your analysis configuration."
        )
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create analysis. Please try again or contact support."
        )


@router.delete("/{analysis_id}", response_model=DeleteResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def delete_analysis(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Soft delete an analysis (sets deleted_at timestamp).

    Only the owner can delete their analysis.
    Hard deletion happens after 30 days via scheduled job.

    Args:
        analysis_id: UUID of the analysis to delete
        user_id: Current authenticated user ID

    Returns:
        Confirmation message with deleted analysis ID

    Raises:
        HTTPException 404: Analysis not found or user doesn't own it
    """
    supabase = get_supabase()

    try:
        # Soft delete: Set deleted_at timestamp
        # Filter by both analysis_id AND user_id for security
        result = supabase.table('analyses')\
            .update({'deleted_at': datetime.now().isoformat()})\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .is_('deleted_at', 'null')\
            .execute()

        # Check if analysis was found and deleted
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis {analysis_id} not found or already deleted"
            )

        return DeleteResponse(
            message="Analysis deleted successfully",
            deleted_id=analysis_id
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis. Please try again or contact support.")



# ============================================================================
# REGISTRATIONS ENDPOINTS (for standalone analyses without client)
# ============================================================================

@router.get("/{analysis_id}/registrations")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_analysis_registrations(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get registered states for an analysis.

    Returns the list of state codes where the client is registered to collect tax.
    This is used for standalone analyses not linked to a client.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        result = supabase.table('analyses')\
            .select('registered_states')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )

        registered_states = result.data[0].get('registered_states') or []

        return {
            "registered_states": registered_states
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis registrations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch registrations"
        )


@router.post("/{analysis_id}/mark-presented")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def mark_analysis_presented(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Mark a completed analysis as presented to the client.

    This updates the status from 'complete' to 'presented' and records
    the presentation timestamp. Only analyses with 'complete' status
    can be marked as presented.

    Returns:
        Updated analysis data
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        result = supabase.table('analyses')\
            .select('*')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )

        analysis = result.data[0]

        # Only complete analyses can be marked as presented
        if analysis['status'] != 'complete':
            raise HTTPException(
                status_code=400,
                detail=f"Only completed analyses can be marked as presented. Current status: {analysis['status']}"
            )

        # Update status to presented
        update_result = supabase.table('analyses').update({
            'status': 'presented',
            'presented_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', analysis_id).execute()

        if not update_result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update analysis status"
            )

        logger.info(f"Analysis {analysis_id} marked as presented")

        return update_result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking analysis as presented: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to mark analysis as presented"
        )


@router.post("/{analysis_id}/unmark-presented")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def unmark_analysis_presented(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Revert a presented analysis back to complete status.

    This allows correcting if an analysis was mistakenly marked as presented.

    Returns:
        Updated analysis data
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        result = supabase.table('analyses')\
            .select('*')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )

        analysis = result.data[0]

        # Only presented analyses can be unmarked
        if analysis['status'] != 'presented':
            raise HTTPException(
                status_code=400,
                detail=f"Only presented analyses can be unmarked. Current status: {analysis['status']}"
            )

        # Update status back to complete
        update_result = supabase.table('analyses').update({
            'status': 'complete',
            'presented_at': None,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', analysis_id).execute()

        if not update_result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update analysis status"
            )

        logger.info(f"Analysis {analysis_id} unmarked as presented (reverted to complete)")

        return update_result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unmarking analysis as presented: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to unmark analysis as presented"
        )


@router.patch("/{analysis_id}/registrations")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def update_analysis_registrations(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Update registered states for an analysis.

    Accepts a JSON body with `registered_states` array of state codes.
    This is used for standalone analyses not linked to a client.
    """
    try:
        supabase = get_supabase()
        body = await request.json()

        registered_states = body.get('registered_states', [])

        # Validate state codes (should be 2-letter uppercase)
        valid_states = [s.upper() for s in registered_states if isinstance(s, str) and len(s) == 2]

        # Verify analysis exists and belongs to user
        result = supabase.table('analyses')\
            .select('id')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )

        # Update registered_states
        supabase.table('analyses').update({
            'registered_states': valid_states,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', analysis_id).execute()

        return {
            "registered_states": valid_states,
            "message": f"Updated registrations ({len(valid_states)} states)"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating analysis registrations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update registrations"
        )
