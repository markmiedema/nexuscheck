from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientNoteCreate, ClientNoteResponse,
    ClientContactCreate, ClientContactResponse
)
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
        # 1. Separate the nested data from the main client data
        full_payload = client_data.model_dump()

        # Pop nested objects so they don't get sent to the 'clients' table
        business_profile_data = full_payload.pop('business_profile', None)
        tech_stack_data = full_payload.pop('tech_stack', None)

        # 2. Insert the main Client record
        full_payload["user_id"] = user_id

        # Clean up any None values to let DB defaults take over
        client_insert_data = {k: v for k, v in full_payload.items() if v is not None}

        result = supabase.table('clients').insert(client_insert_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create client")

        new_client = result.data[0]
        new_client_id = new_client['id']

        # 3. Insert Business Profile (if provided)
        if business_profile_data:
            # Filter out None values
            profile_insert = {k: v for k, v in business_profile_data.items() if v is not None}
            if profile_insert:
                profile_insert['client_id'] = new_client_id
                supabase.table('client_profiles').insert(profile_insert).execute()

                # Attach to response so frontend sees it immediately
                new_client['business_profile'] = business_profile_data

        # 4. Insert Tech Stack (if provided)
        if tech_stack_data:
            stack_insert = {k: v for k, v in tech_stack_data.items() if v is not None}
            if stack_insert:
                stack_insert['client_id'] = new_client_id
                supabase.table('client_tech_stacks').insert(stack_insert).execute()

                # Attach to response
                new_client['tech_stack'] = tech_stack_data

        return new_client

    except Exception as e:
        logger.error(f"Error creating client: {str(e)}")
        print(f"DEBUG ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create client: {str(e)}"
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
        # 1. Fetch the Core Client (Must exist)
        result = supabase.table('clients')\
            .select('*')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        client = result.data

        # 2. Safely Fetch Optional Business Profile
        # We use .select().limit(1).execute() instead of .single() to avoid crashes if 0 rows found
        profile_res = supabase.table('client_profiles')\
            .select('*')\
            .eq('client_id', client_id)\
            .limit(1)\
            .execute()

        if profile_res.data:
            client['business_profile'] = profile_res.data[0]

        # 3. Safely Fetch Optional Tech Stack
        stack_res = supabase.table('client_tech_stacks')\
            .select('*')\
            .eq('client_id', client_id)\
            .limit(1)\
            .execute()

        if stack_res.data:
            client['tech_stack'] = stack_res.data[0]

        return client

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch client details")

@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Use exclude_unset=True to only include fields that were actually sent in the request
        full_payload = client_data.model_dump(exclude_unset=True)
        logger.info(f"Update payload for client {client_id}: {full_payload}")

        business_profile_data = full_payload.pop('business_profile', None)
        tech_stack_data = full_payload.pop('tech_stack', None)

        # With exclude_unset=True, all fields in the payload were explicitly sent
        # Keep everything except None (which might be accidental - we don't want to clear fields)
        # But DO keep empty lists [] (intentionally clearing arrays)
        update_data = {}
        for k, v in full_payload.items():
            if v is None:
                continue  # Skip None to avoid accidentally clearing fields
            update_data[k] = v

        # Update main client record if there's data
        if update_data:
            logger.info(f"Sending update to DB for client {client_id}: {update_data}")
            result = supabase.table('clients')\
                .update(update_data)\
                .eq('id', client_id)\
                .eq('user_id', user_id)\
                .execute()
            logger.info(f"DB update result for client {client_id}: {result.data}")

            if not result.data:
                raise HTTPException(status_code=404, detail="Client not found")
        else:
            logger.warning(f"No update_data for client {client_id} - nothing to update")

        # Update or insert business profile
        if business_profile_data:
            profile_update = {k: v for k, v in business_profile_data.items() if v is not None}
            if profile_update:
                # Check if profile exists
                existing_profile = supabase.table('client_profiles')\
                    .select('id')\
                    .eq('client_id', client_id)\
                    .maybe_single()\
                    .execute()

                if existing_profile.data:
                    # Update existing profile
                    supabase.table('client_profiles')\
                        .update(profile_update)\
                        .eq('client_id', client_id)\
                        .execute()
                else:
                    # Insert new profile
                    profile_update['client_id'] = client_id
                    supabase.table('client_profiles').insert(profile_update).execute()

        # Update or insert tech stack
        if tech_stack_data:
            stack_update = {k: v for k, v in tech_stack_data.items() if v is not None}
            if stack_update:
                # Check if tech stack exists
                existing_stack = supabase.table('client_tech_stacks')\
                    .select('id')\
                    .eq('client_id', client_id)\
                    .maybe_single()\
                    .execute()

                if existing_stack.data:
                    # Update existing tech stack
                    supabase.table('client_tech_stacks')\
                        .update(stack_update)\
                        .eq('client_id', client_id)\
                        .execute()
                else:
                    # Insert new tech stack
                    stack_update['client_id'] = client_id
                    supabase.table('client_tech_stacks').insert(stack_update).execute()

        # Fetch and return the updated client with nested data
        return await get_client(client_id, user_id)

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


# --- Client Contacts Endpoints ---

@router.get("/{client_id}/contacts", response_model=List[ClientContactResponse])
async def list_client_contacts(
    client_id: str,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Verify client access
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .maybe_single()\
            .execute()
        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Fetch contacts
        result = supabase.table('client_contacts')\
            .select('*')\
            .eq('client_id', client_id)\
            .order('is_primary', desc=True)\
            .order('created_at', desc=True)\
            .execute()

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list contacts")


@router.post("/{client_id}/contacts", response_model=ClientContactResponse)
async def create_client_contact(
    client_id: str,
    contact_data: ClientContactCreate,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Verify client access
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .maybe_single()\
            .execute()
        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Prepare data
        new_contact = contact_data.model_dump()
        new_contact['client_id'] = client_id

        # Insert
        result = supabase.table('client_contacts').insert(new_contact).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create contact")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create contact")


@router.delete("/{client_id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_contact(
    client_id: str,
    contact_id: str,
    user_id: str = Depends(require_auth)
):
    supabase = get_supabase()
    try:
        # Verify client access
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('user_id', user_id)\
            .maybe_single()\
            .execute()
        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Delete
        supabase.table('client_contacts')\
            .delete()\
            .eq('id', contact_id)\
            .eq('client_id', client_id)\
            .execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete contact")
