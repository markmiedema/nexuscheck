from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
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
