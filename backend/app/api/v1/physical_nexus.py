"""Physical Nexus API Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.config import settings
from app.schemas.physical_nexus import (
    PhysicalNexusCreate,
    PhysicalNexusUpdate,
    PhysicalNexusResponse,
    PhysicalNexusImportRequest,
    PhysicalNexusImportResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


@router.post("/{analysis_id}/physical-nexus", response_model=PhysicalNexusResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def create_physical_nexus(
    request: Request,
    analysis_id: str,
    nexus_data: PhysicalNexusCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Create physical nexus configuration for a state.

    Physical nexus means you have a physical presence in a state
    (office, warehouse, employees, etc.) requiring sales tax registration.

    **This endpoint:**
    - Creates new physical nexus record
    - Prevents duplicates (one config per state per analysis)
    - Validates state code
    - Requires analysis ownership
    """
    # Verify analysis ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Check for duplicate
    existing = supabase.table('physical_nexus')\
        .select('state_code')\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', nexus_data.state_code)\
        .execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail=f"Physical nexus already exists for {nexus_data.state_code}. Use PATCH to update."
        )

    # Create record
    data = {
        'analysis_id': analysis_id,
        'state_code': nexus_data.state_code,
        'nexus_date': nexus_data.nexus_date.isoformat(),
        'reason': nexus_data.reason,
        'nexus_type': nexus_data.nexus_type,
        'registration_date': nexus_data.registration_date.isoformat() if nexus_data.registration_date else None,
        'permit_number': nexus_data.permit_number,
        'notes': nexus_data.notes
    }

    result = supabase.table('physical_nexus').insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create physical nexus")

    logger.info(f"Created physical nexus for {analysis_id} - {nexus_data.state_code}")

    return PhysicalNexusResponse(**result.data[0])


@router.get("/{analysis_id}/physical-nexus", response_model=List[PhysicalNexusResponse])
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def list_physical_nexus(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    List all physical nexus configurations for an analysis.

    Returns all states where physical nexus has been configured.
    Empty list if no physical nexus exists.
    """
    # Verify ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Get all physical nexus configs
    result = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .order('state_code')\
        .execute()

    return [PhysicalNexusResponse(**row) for row in result.data]


@router.patch("/{analysis_id}/physical-nexus/{state_code}", response_model=PhysicalNexusResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def update_physical_nexus(
    request: Request,
    analysis_id: str,
    state_code: str,
    nexus_data: PhysicalNexusUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update physical nexus configuration for a state.

    Allows updating any field except state_code.
    Only updates fields provided in request (partial update).
    """
    # Verify ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Check if config exists
    existing = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail=f"Physical nexus not found for {state_code}"
        )

    # Build update data (only include provided fields)
    update_data = {}
    if nexus_data.nexus_date is not None:
        update_data['nexus_date'] = nexus_data.nexus_date.isoformat()
    if nexus_data.reason is not None:
        update_data['reason'] = nexus_data.reason
    if nexus_data.nexus_type is not None:
        update_data['nexus_type'] = nexus_data.nexus_type
    if nexus_data.registration_date is not None:
        update_data['registration_date'] = nexus_data.registration_date.isoformat()
    if nexus_data.permit_number is not None:
        update_data['permit_number'] = nexus_data.permit_number
    if nexus_data.notes is not None:
        update_data['notes'] = nexus_data.notes

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update record
    result = supabase.table('physical_nexus')\
        .update(update_data)\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update physical nexus")

    logger.info(f"Updated physical nexus for {analysis_id} - {state_code}")

    return PhysicalNexusResponse(**result.data[0])


@router.delete("/{analysis_id}/physical-nexus/{state_code}", status_code=204)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def delete_physical_nexus(
    request: Request,
    analysis_id: str,
    state_code: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete physical nexus configuration for a state.

    Removes the physical nexus record. The state will revert to
    economic nexus calculation only (if applicable).
    """
    # Verify ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Check if exists
    existing = supabase.table('physical_nexus')\
        .select('state_code')\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail=f"Physical nexus not found for {state_code}"
        )

    # Delete record
    supabase.table('physical_nexus')\
        .delete()\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    logger.info(f"Deleted physical nexus for {analysis_id} - {state_code}")

    return None


@router.post("/{analysis_id}/physical-nexus/import", response_model=PhysicalNexusImportResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def import_physical_nexus(
    request: Request,
    analysis_id: str,
    import_data: PhysicalNexusImportRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Import physical nexus configurations from JSON.

    **Expected format:**
    ```json
    {
      "configs": {
        "CA": {
          "nexus_date": "2020-01-15",
          "reason": "Office opened in Los Angeles",
          "registration_date": "2020-02-01",
          "permit_number": "CA-123456",
          "notes": "Main office location"
        },
        "NY": {
          "nexus_date": "2021-06-01",
          "reason": "Warehouse in Brooklyn"
        }
      }
    }
    ```

    **Behavior:**
    - Creates new configs for states not yet configured
    - Updates existing configs for states already configured
    - Validates all data before importing
    - Returns count of imported/updated and any errors
    """
    # Verify ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Get existing configs
    existing_response = supabase.table('physical_nexus')\
        .select('state_code')\
        .eq('analysis_id', analysis_id)\
        .execute()

    existing_states = {row['state_code'] for row in existing_response.data}

    imported_count = 0
    updated_count = 0
    errors = []

    # Process each config
    for state_code, config in import_data.configs.items():
        try:
            state_code_upper = state_code.upper()

            data = {
                'analysis_id': analysis_id,
                'state_code': state_code_upper,
                'nexus_date': config['nexus_date'],
                'reason': config['reason'],
                'nexus_type': config.get('nexus_type', 'other'),
                'registration_date': config.get('registration_date'),
                'permit_number': config.get('permit_number'),
                'notes': config.get('notes')
            }

            if state_code_upper in existing_states:
                # Update existing
                supabase.table('physical_nexus')\
                    .update(data)\
                    .eq('analysis_id', analysis_id)\
                    .eq('state_code', state_code_upper)\
                    .execute()
                updated_count += 1
            else:
                # Create new
                supabase.table('physical_nexus').insert(data).execute()
                imported_count += 1

        except Exception as e:
            errors.append({
                'state_code': state_code,
                'error': str(e)
            })

    logger.info(
        f"Import complete for {analysis_id}: "
        f"{imported_count} new, {updated_count} updated, {len(errors)} errors"
    )

    return PhysicalNexusImportResponse(
        imported_count=imported_count,
        updated_count=updated_count,
        errors=errors
    )


@router.get("/{analysis_id}/physical-nexus/export")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def export_physical_nexus(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Export physical nexus configurations as JSON.

    Returns format compatible with import endpoint.
    Can be saved and imported into another analysis or
    used as a backup/template.

    **Example response:**
    ```json
    {
      "CA": {
        "nexus_date": "2020-01-15",
        "reason": "Office opened",
        "registration_date": "2020-02-01",
        "permit_number": "CA-123456",
        "notes": "Main office"
      }
    }
    ```
    """
    # Verify ownership
    analysis_response = supabase.table('analyses')\
        .select('id')\
        .eq('id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .execute()

    # Format as {state_code: {data}}
    config = {}
    for row in result.data:
        state_code = row.pop('state_code')
        # Remove internal fields
        row.pop('analysis_id', None)
        row.pop('created_at', None)
        config[state_code] = row

    return config
