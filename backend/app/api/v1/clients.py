"""Client and CRM endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.config import settings
from app.schemas.crm import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientNoteCreate,
    ClientNoteResponse
)
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=ClientResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def create_client(
    request: Request,
    client_data: ClientCreate,
    user_id: str = Depends(require_auth)
):
    """
    Create a new client.

    Args:
        client_data: Client information
        user_id: Current authenticated user ID

    Returns:
        Created client data
    """
    supabase = get_supabase()

    try:
        client = client_data.model_dump()
        client['id'] = str(uuid.uuid4())
        client['user_id'] = user_id
        client['created_at'] = datetime.utcnow().isoformat()

        result = supabase.table('clients').insert(client).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create client"
            )

        return result.data[0]

    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create client: {str(e)}"
        )


@router.get("", response_model=List[ClientResponse])
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def list_clients(
    request: Request,
    user_id: str = Depends(require_auth),
    limit: int = 100,
    offset: int = 0,
    search: str = None
):
    """
    List all clients for the current user.

    Args:
        user_id: Current authenticated user ID
        limit: Max number of clients to return (default: 100)
        offset: Number of clients to skip (default: 0)
        search: Optional search term for company name

    Returns:
        List of clients
    """
    supabase = get_supabase()

    try:
        query = supabase.table('clients')\
            .select('*')\
            .eq('user_id', user_id)

        if search:
            query = query.ilike('company_name', f'%{search}%')

        result = query.order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        return result.data

    except Exception as e:
        logger.error(f"Error listing clients: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch clients"
        )


@router.get("/{client_id}", response_model=ClientResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_client(
    request: Request,
    client_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get a specific client by ID.

    Args:
        client_id: Client ID
        user_id: Current authenticated user ID

    Returns:
        Client data
    """
    supabase = get_supabase()

    try:
        result = supabase.table('clients')\
            .select('*')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Client not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch client"
        )


@router.patch("/{client_id}", response_model=ClientResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def update_client(
    request: Request,
    client_id: str,
    client_data: ClientUpdate,
    user_id: str = Depends(require_auth)
):
    """
    Update a client.

    Args:
        client_id: Client ID
        client_data: Updated client information
        user_id: Current authenticated user ID

    Returns:
        Updated client data
    """
    supabase = get_supabase()

    try:
        # Verify ownership
        existing = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Client not found"
            )

        # Update only provided fields
        update_data = client_data.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow().isoformat()

        result = supabase.table('clients')\
            .update(update_data)\
            .eq('id', client_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update client"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update client"
        )


@router.delete("/{client_id}", status_code=204)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def delete_client(
    request: Request,
    client_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Delete a client.

    Args:
        client_id: Client ID
        user_id: Current authenticated user ID
    """
    supabase = get_supabase()

    try:
        # Verify ownership
        existing = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Client not found"
            )

        supabase.table('clients')\
            .delete()\
            .eq('id', client_id)\
            .execute()

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete client"
        )


# ============================================================================
# CLIENT NOTES ENDPOINTS
# ============================================================================


@router.post("/{client_id}/notes", response_model=ClientNoteResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def create_client_note(
    request: Request,
    client_id: str,
    note_data: ClientNoteCreate,
    user_id: str = Depends(require_auth)
):
    """
    Create a note for a client.

    Args:
        client_id: Client ID
        note_data: Note information
        user_id: Current authenticated user ID

    Returns:
        Created note data
    """
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to user
        client = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not client.data:
            raise HTTPException(
                status_code=404,
                detail="Client not found"
            )

        note = note_data.model_dump()
        note['id'] = str(uuid.uuid4())
        note['client_id'] = client_id
        note['user_id'] = user_id
        note['created_at'] = datetime.utcnow().isoformat()

        result = supabase.table('client_notes').insert(note).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create note"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating note: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save note: {str(e)}"
        )


@router.get("/{client_id}/notes", response_model=List[ClientNoteResponse])
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def list_client_notes(
    request: Request,
    client_id: str,
    user_id: str = Depends(require_auth)
):
    """
    List all notes for a client.

    Args:
        client_id: Client ID
        user_id: Current authenticated user ID

    Returns:
        List of notes ordered by newest first
    """
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to user
        client = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .execute()

        if not client.data:
            raise HTTPException(
                status_code=404,
                detail="Client not found"
            )

        # Fetch notes (ordered by newest first)
        result = supabase.table('client_notes')\
            .select('*')\
            .eq('client_id', client_id)\
            .order('created_at', desc=True)\
            .execute()

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch notes"
        )
