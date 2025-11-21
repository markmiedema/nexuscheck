from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientNoteCreate, ClientNoteResponse
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()

    try:
        # Prepare data
        new_client = client_data.model_dump()
        new_client["user_id"] = user_id

        # Insert into DB
        result = supabase.table('clients').insert(new_client).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create client")

        return result.data[0]

    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create client"
        )

@router.get("", response_model=List[ClientResponse])
async def list_clients(
    user_id: str = Depends(require_auth),
    skip: int = 0,
    limit: int = 100
):
    supabase = get_supabase()
    try:
        result = supabase.table('clients')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        return result.data
    except Exception as e:
        logger.error(f"Error listing clients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch clients")

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        result = supabase.table('clients')\
            .select('*')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        return result.data
    except Exception as e:
        logger.error(f"Error fetching client: {str(e)}")
        raise HTTPException(status_code=404, detail="Client not found")

@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Only include non-None fields in update
        update_data = {k: v for k, v in client_data.model_dump().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase.table('clients')\
            .update(update_data)\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update client")

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # First verify the client exists and belongs to the user
        existing = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Now delete it
        supabase.table('clients')\
            .delete()\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete client")

# Client Notes endpoints
@router.post("/{client_id}/notes", response_model=ClientNoteResponse)
async def create_client_note(
    client_id: str,
    note_data: ClientNoteCreate,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to user
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Create note
        new_note = note_data.model_dump()
        new_note["client_id"] = client_id
        new_note["user_id"] = user_id

        result = supabase.table('client_notes').insert(new_note).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create note")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating client note: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create note")

@router.get("/{client_id}/notes", response_model=List[ClientNoteResponse])
async def list_client_notes(
    client_id: str,
    user_id: str = Depends(require_auth),
    skip: int = 0,
    limit: int = 100
):
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to user
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get notes
        result = supabase.table('client_notes')\
            .select('*')\
            .eq('client_id', client_id)\
            .order('created_at', desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing client notes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notes")


@router.get("/{client_id}/analyses")
async def list_client_analyses(
    client_id: str,
    user_id: str = Depends(require_auth),
    skip: int = 0,
    limit: int = 100
):
    """List all analyses linked to a specific client"""
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to user
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get analyses linked to this client
        result = supabase.table('analyses')\
            .select('id, client_company_name, status, created_at, updated_at, analysis_period_start, analysis_period_end, total_liability, states_with_nexus')\
            .eq('client_id', client_id)\
            .eq('user_id', user_id)\
            .is_('deleted_at', 'null')\
            .order('created_at', desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing client analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")
