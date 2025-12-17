from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Tuple
from app.core.auth import require_auth, require_organization, get_user_organization_id
from app.core.supabase import get_supabase
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientNoteCreate, ClientNoteResponse,
    ClientContactCreate, ClientContactResponse
)
from app.schemas.client_overview import (
    ClientOverviewResponse,
    IntakeItemResponse,
    IntakeItemCreate,
    IntakeItemUpdate,
    IntakeStatusResponse
)
from app.services.client_overview_service import ClientOverviewService
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

def _normalize_company_name(name: str) -> str:
    """Normalize company name for duplicate detection."""
    import re
    # Convert to lowercase and strip whitespace
    normalized = name.lower().strip()
    # Remove common suffixes
    suffixes = [
        r'\s+(inc\.?|llc\.?|corp\.?|corporation|company|co\.?|ltd\.?|limited|lp\.?|llp\.?)$',
        r'\s+(incorporated|enterprises?)$',
        r'[,\.]$'
    ]
    for suffix in suffixes:
        normalized = re.sub(suffix, '', normalized, flags=re.IGNORECASE)
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized


@router.post("", response_model=ClientResponse)
async def create_client(
    client_data: ClientCreate,
    auth: Tuple[str, str] = Depends(require_organization),
    force: bool = False  # Allow bypassing duplicate check
):
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Check for potential duplicate clients (unless force=True)
        if not force and client_data.company_name:
            existing_clients = supabase.table('clients')\
                .select('id, company_name')\
                .eq('organization_id', org_id)\
                .execute()

            normalized_new = _normalize_company_name(client_data.company_name)
            duplicates = []

            for existing in (existing_clients.data or []):
                normalized_existing = _normalize_company_name(existing['company_name'])
                # Check for exact match (case-insensitive, normalized)
                if normalized_new == normalized_existing:
                    duplicates.append({
                        'id': existing['id'],
                        'company_name': existing['company_name'],
                        'match_type': 'exact'
                    })
                # Check if one name contains the other (catches "Acme" vs "Acme Inc")
                elif normalized_new in normalized_existing or normalized_existing in normalized_new:
                    if len(normalized_new) >= 3 and len(normalized_existing) >= 3:  # Avoid false positives on short names
                        duplicates.append({
                            'id': existing['id'],
                            'company_name': existing['company_name'],
                            'match_type': 'similar'
                        })

            if duplicates:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        'message': f"Potential duplicate client(s) found for '{client_data.company_name}'",
                        'duplicates': duplicates,
                        'hint': "Use force=true query parameter to create anyway"
                    }
                )

        # 1. Separate the nested data from the main client data
        full_payload = client_data.model_dump()

        # Pop nested objects so they don't get sent to the 'clients' table
        business_profile_data = full_payload.pop('business_profile', None)
        tech_stack_data = full_payload.pop('tech_stack', None)

        # 2. Insert the main Client record
        full_payload["user_id"] = user_id
        full_payload["organization_id"] = org_id

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
    auth: Tuple[str, str] = Depends(require_organization),
    skip: int = 0,
    limit: int = 100
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Filter by organization_id to show all team members' clients
        result = supabase.table('clients')\
            .select('*')\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # 1. Fetch the Core Client (Must exist and belong to org)
        result = supabase.table('clients')\
            .select('*')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
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
            # Convert datetime objects to ISO strings for JSON serialization
            if hasattr(v, 'isoformat'):
                update_data[k] = v.isoformat()
            else:
                update_data[k] = v

        # Update main client record if there's data
        if update_data:
            logger.info(f"Sending update to DB for client {client_id}: {update_data}")
            result = supabase.table('clients')\
                .update(update_data)\
                .eq('id', client_id)\
                .eq('organization_id', org_id)\
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
        return await get_client(client_id, auth)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update client")

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # First verify the client exists and belongs to the organization
        existing = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Now delete it
        supabase.table('clients')\
            .delete()\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to organization
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Create note
        new_note = note_data.model_dump()
        new_note["client_id"] = client_id
        new_note["user_id"] = user_id
        new_note["organization_id"] = org_id

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
    auth: Tuple[str, str] = Depends(require_organization),
    skip: int = 0,
    limit: int = 100
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to organization
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization),
    skip: int = 0,
    limit: int = 100
):
    """List all analyses linked to a specific client"""
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client exists and belongs to organization
        client_result = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get analyses linked to this client (within same organization)
        result = supabase.table('analyses')\
            .select('id, client_company_name, status, created_at, updated_at, analysis_period_start, analysis_period_end, total_liability, states_with_nexus')\
            .eq('client_id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client access within organization
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client access within organization
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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
    auth: Tuple[str, str] = Depends(require_organization)
):
    user_id, org_id = auth
    supabase = get_supabase()
    try:
        # Verify client access within organization
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
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


# --- Client Overview Endpoints ---

@router.get("/{client_id}/overview", response_model=ClientOverviewResponse)
async def get_client_overview(
    client_id: str,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """
    Get comprehensive overview for a client.

    Returns:
    - Current workflow stage and progress
    - Next best action recommendation
    - Upcoming deadlines
    - States summary (nexus status)
    - Blocking items
    - Active engagement info
    - Intake progress
    """
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Use the overview service to compute all data
        service = ClientOverviewService(supabase)
        overview = service.get_client_overview(client_id, org_id)

        if not overview:
            raise HTTPException(status_code=404, detail="Client not found")

        return overview

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting client overview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get client overview"
        )


# --- Intake Items Endpoints ---

@router.get("/{client_id}/intake", response_model=List[IntakeItemResponse])
async def list_intake_items(
    client_id: str,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """List all intake items for a client."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to org
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .maybe_single()\
            .execute()

        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Fetch intake items
        result = supabase.table('intake_items')\
            .select('*')\
            .eq('client_id', client_id)\
            .eq('organization_id', org_id)\
            .order('category')\
            .order('item_key')\
            .execute()

        return result.data or []

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing intake items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch intake items")


@router.post("/{client_id}/intake/initialize", response_model=List[IntakeItemResponse])
async def initialize_intake_items(
    client_id: str,
    auth: Tuple[str, str] = Depends(require_organization),
    engagement_id: Optional[str] = None
):
    """Initialize default intake items for a client."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to org
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .maybe_single()\
            .execute()

        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Initialize using service
        service = ClientOverviewService(supabase)
        items = service.initialize_intake_items(client_id, org_id, engagement_id)

        return items

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing intake items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize intake items")


@router.patch("/{client_id}/intake/{item_id}", response_model=IntakeItemResponse)
async def update_intake_item(
    client_id: str,
    item_id: str,
    update_data: IntakeItemUpdate,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Update an intake item status or details."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to org
        client_check = supabase.table('clients')\
            .select('id')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .maybe_single()\
            .execute()

        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        # Update using service
        service = ClientOverviewService(supabase)
        updates = update_data.model_dump(exclude_unset=True)
        updated_item = service.update_intake_item(item_id, org_id, updates)

        if not updated_item:
            raise HTTPException(status_code=404, detail="Intake item not found")

        return updated_item

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating intake item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update intake item")


@router.get("/{client_id}/intake/status", response_model=IntakeStatusResponse)
async def get_intake_status(
    client_id: str,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Get intake completion status summary for a client."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to org
        client_result = supabase.table('clients')\
            .select('*')\
            .eq('id', client_id)\
            .eq('organization_id', org_id)\
            .maybe_single()\
            .execute()

        if not client_result.data:
            raise HTTPException(status_code=404, detail="Client not found")

        client = client_result.data

        # Fetch intake items
        items_result = supabase.table('intake_items')\
            .select('*')\
            .eq('client_id', client_id)\
            .eq('organization_id', org_id)\
            .execute()

        items = items_result.data or []

        # Compute status using service
        service = ClientOverviewService(supabase)
        progress = service._compute_intake_progress(client, items)

        # Compute by category
        by_category = {}
        for item in items:
            cat = item.get('category')
            if cat not in by_category:
                by_category[cat] = {"total": 0, "completed": 0, "status": "not_started"}

            by_category[cat]["total"] += 1
            if item.get('status') in ('received', 'validated', 'not_applicable'):
                by_category[cat]["completed"] += 1

        # Update category statuses
        for cat, data in by_category.items():
            if data["completed"] == data["total"]:
                data["status"] = "complete"
            elif data["completed"] > 0:
                data["status"] = "in_progress"
            else:
                data["status"] = "not_started"

        # Get blocking items (required items not yet received)
        blocking = [
            item for item in items
            if item.get('is_required') and item.get('status') not in ('received', 'validated', 'not_applicable')
        ]

        return {
            "total_items": progress["total_items"],
            "completed_items": progress["completed_items"],
            "completion_percentage": progress["completion_percentage"],
            "by_category": by_category,
            "blocking_items": blocking
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting intake status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get intake status")
