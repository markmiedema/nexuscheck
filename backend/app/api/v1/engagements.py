"""
Engagements API - The "Gatekeeper Model"

Engagements are the container objects that sit between Clients and Projects.
They represent signed agreements that authorize specific work to be done.

Hierarchy: Client -> Engagement(s) -> Project(s)/Analyses
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.schemas.client import (
    EngagementCreate, EngagementUpdate, EngagementResponse,
    EngagementWithProjectsResponse, ScopeConfig
)
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=EngagementResponse)
async def create_engagement(
    engagement_data: EngagementCreate,
    user_id: str = Depends(require_auth)
):
    """Create a new engagement for a client."""
    supabase = get_supabase()

    try:
        # Verify client exists and belongs to user
        client_check = supabase.table('clients')\
            .select('id, company_name')\
            .eq('id', str(engagement_data.client_id))\
            .eq('user_id', user_id)\
            .execute()

        if not client_check.data:
            raise HTTPException(status_code=404, detail="Client not found")

        client = client_check.data[0]

        # Prepare engagement data
        insert_data = {
            'client_id': str(engagement_data.client_id),
            'user_id': user_id,
            'title': engagement_data.title,
            'status': engagement_data.status,
            'scope_summary': engagement_data.scope_summary,
            'document_url': engagement_data.document_url,
        }

        # Handle scope_config (convert to JSON if provided)
        if engagement_data.scope_config:
            insert_data['scope_config'] = engagement_data.scope_config.model_dump()

        # Handle dates
        if engagement_data.sent_at:
            insert_data['sent_at'] = engagement_data.sent_at.isoformat()
        if engagement_data.signed_at:
            insert_data['signed_at'] = engagement_data.signed_at.isoformat()
        if engagement_data.effective_date:
            insert_data['effective_date'] = engagement_data.effective_date.isoformat()
        if engagement_data.expiration_date:
            insert_data['expiration_date'] = engagement_data.expiration_date.isoformat()

        # Insert engagement
        result = supabase.table('engagements').insert(insert_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create engagement")

        engagement = result.data[0]
        engagement['client_name'] = client['company_name']

        return engagement

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating engagement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create engagement: {str(e)}"
        )


@router.get("", response_model=List[EngagementResponse])
async def list_engagements(
    user_id: str = Depends(require_auth),
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List engagements, optionally filtered by client or status."""
    supabase = get_supabase()

    try:
        query = supabase.table('engagements')\
            .select('*, clients(company_name)')\
            .eq('user_id', user_id)

        if client_id:
            query = query.eq('client_id', client_id)

        if status:
            query = query.eq('status', status)

        result = query\
            .order('created_at', desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        # Flatten the response to include client_name
        engagements = []
        for eng in result.data:
            client_data = eng.pop('clients', None)
            eng['client_name'] = client_data.get('company_name') if client_data else None
            engagements.append(eng)

        return engagements

    except Exception as e:
        logger.error(f"Error listing engagements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch engagements")


@router.get("/{engagement_id}", response_model=EngagementWithProjectsResponse)
async def get_engagement(
    engagement_id: str,
    user_id: str = Depends(require_auth)
):
    """Get a single engagement with its linked projects."""
    supabase = get_supabase()

    try:
        # Get engagement with client info
        result = supabase.table('engagements')\
            .select('*, clients(company_name)')\
            .eq('id', engagement_id)\
            .eq('user_id', user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Engagement not found")

        engagement = result.data[0]
        client_data = engagement.pop('clients', None)
        engagement['client_name'] = client_data.get('company_name') if client_data else None

        # Get linked projects/analyses
        projects_result = supabase.table('analyses')\
            .select('id, client_company_name, status, created_at, analysis_period_start, analysis_period_end')\
            .eq('engagement_id', engagement_id)\
            .order('created_at', desc=True)\
            .execute()

        engagement['projects'] = projects_result.data or []

        return engagement

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting engagement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch engagement")


@router.patch("/{engagement_id}", response_model=EngagementResponse)
async def update_engagement(
    engagement_id: str,
    engagement_data: EngagementUpdate,
    user_id: str = Depends(require_auth)
):
    """Update an engagement."""
    supabase = get_supabase()

    try:
        # Verify engagement exists and belongs to user
        check = supabase.table('engagements')\
            .select('id, client_id')\
            .eq('id', engagement_id)\
            .eq('user_id', user_id)\
            .execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="Engagement not found")

        # Build update data (only include non-None values)
        update_data = {}

        if engagement_data.title is not None:
            update_data['title'] = engagement_data.title
        if engagement_data.status is not None:
            update_data['status'] = engagement_data.status
            # If marking as signed, set signed_at
            if engagement_data.status == 'signed' and engagement_data.signed_at is None:
                update_data['signed_at'] = datetime.utcnow().isoformat()
        if engagement_data.scope_config is not None:
            update_data['scope_config'] = engagement_data.scope_config.model_dump()
        if engagement_data.scope_summary is not None:
            update_data['scope_summary'] = engagement_data.scope_summary
        if engagement_data.document_url is not None:
            update_data['document_url'] = engagement_data.document_url
        if engagement_data.sent_at is not None:
            update_data['sent_at'] = engagement_data.sent_at.isoformat()
        if engagement_data.signed_at is not None:
            update_data['signed_at'] = engagement_data.signed_at.isoformat()
        if engagement_data.effective_date is not None:
            update_data['effective_date'] = engagement_data.effective_date.isoformat()
        if engagement_data.expiration_date is not None:
            update_data['expiration_date'] = engagement_data.expiration_date.isoformat()

        update_data['updated_at'] = datetime.utcnow().isoformat()

        # Perform update
        result = supabase.table('engagements')\
            .update(update_data)\
            .eq('id', engagement_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update engagement")

        # Get client name for response
        client_result = supabase.table('clients')\
            .select('company_name')\
            .eq('id', check.data[0]['client_id'])\
            .execute()

        engagement = result.data[0]
        engagement['client_name'] = client_result.data[0]['company_name'] if client_result.data else None

        return engagement

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating engagement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update engagement: {str(e)}"
        )


@router.delete("/{engagement_id}")
async def delete_engagement(
    engagement_id: str,
    user_id: str = Depends(require_auth)
):
    """Delete an engagement (only if no linked projects)."""
    supabase = get_supabase()

    try:
        # Verify engagement exists and belongs to user
        check = supabase.table('engagements')\
            .select('id')\
            .eq('id', engagement_id)\
            .eq('user_id', user_id)\
            .execute()

        if not check.data:
            raise HTTPException(status_code=404, detail="Engagement not found")

        # Check for linked projects
        projects = supabase.table('analyses')\
            .select('id')\
            .eq('engagement_id', engagement_id)\
            .execute()

        if projects.data:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete engagement with linked projects. Archive it instead."
            )

        # Delete engagement
        supabase.table('engagements')\
            .delete()\
            .eq('id', engagement_id)\
            .execute()

        return {"message": "Engagement deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting engagement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete engagement")


# --- Engagement Gating Endpoints ---

@router.get("/client/{client_id}/active", response_model=Optional[EngagementResponse])
async def get_active_engagement(
    client_id: str,
    user_id: str = Depends(require_auth)
):
    """Get the active (signed) engagement for a client, if any."""
    supabase = get_supabase()

    try:
        result = supabase.table('engagements')\
            .select('*, clients(company_name)')\
            .eq('client_id', client_id)\
            .eq('user_id', user_id)\
            .eq('status', 'signed')\
            .order('signed_at', desc=True)\
            .limit(1)\
            .execute()

        if not result.data:
            return None

        engagement = result.data[0]
        client_data = engagement.pop('clients', None)
        engagement['client_name'] = client_data.get('company_name') if client_data else None

        return engagement

    except Exception as e:
        logger.error(f"Error getting active engagement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch active engagement")


@router.get("/client/{client_id}/can-create-project")
async def can_create_project(
    client_id: str,
    service_type: str,  # nexus_study, vda_remediation, etc.
    user_id: str = Depends(require_auth)
):
    """
    Check if a new project of the given type can be created for this client.

    Returns:
    - allowed: True if project creation is allowed
    - engagement_id: The engagement to link the project to (if allowed)
    - reason: Explanation if not allowed
    """
    supabase = get_supabase()

    try:
        # Check for signed engagement
        result = supabase.table('engagements')\
            .select('id, scope_config, status')\
            .eq('client_id', client_id)\
            .eq('user_id', user_id)\
            .eq('status', 'signed')\
            .order('signed_at', desc=True)\
            .limit(1)\
            .execute()

        if not result.data:
            return {
                "allowed": False,
                "engagement_id": None,
                "reason": "No signed engagement found. Please create and sign an engagement letter first."
            }

        engagement = result.data[0]
        scope_config = engagement.get('scope_config') or {}

        # Check if service type is authorized in the engagement
        authorized_services = scope_config.get('services', [])

        # Legacy engagements allow all services
        if scope_config.get('legacy', False):
            return {
                "allowed": True,
                "engagement_id": engagement['id'],
                "reason": "Legacy engagement - all services authorized"
            }

        if not authorized_services or service_type in authorized_services:
            return {
                "allowed": True,
                "engagement_id": engagement['id'],
                "reason": f"Service '{service_type}' is authorized under current engagement"
            }

        return {
            "allowed": False,
            "engagement_id": engagement['id'],
            "reason": f"Service '{service_type}' is not authorized under current engagement. Authorized services: {', '.join(authorized_services)}"
        }

    except Exception as e:
        logger.error(f"Error checking project creation permission: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check permissions")
