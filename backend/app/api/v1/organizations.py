"""Organization and team member management API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Tuple
from app.core.auth import require_auth, require_organization, get_user_organization_id
from app.core.supabase import get_supabase
from app.schemas.organization import (
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationMemberResponse,
    OrganizationMemberInvite,
    OrganizationMemberUpdate,
    OrganizationWithMembersResponse,
)
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)


# --- Organization Endpoints ---

@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Get the current user's organization."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        result = supabase.table('organizations')\
            .select('*')\
            .eq('id', org_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch organization")


@router.put("/current", response_model=OrganizationResponse)
async def update_current_organization(
    org_data: OrganizationUpdate,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Update the current user's organization. Requires admin or owner role."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Check user has admin/owner role
        member_check = supabase.table('organization_members')\
            .select('role')\
            .eq('organization_id', org_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not member_check.data or member_check.data['role'] not in ['owner', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can update organization settings"
            )

        # Prepare update data
        update_data = org_data.model_dump(exclude_unset=True)

        # Handle nested settings object - convert to dict for JSONB
        if 'settings' in update_data and update_data['settings'] is not None:
            settings_obj = update_data['settings']
            if hasattr(settings_obj, 'model_dump'):
                update_data['settings'] = settings_obj.model_dump(exclude_none=True)

        update_data['updated_at'] = datetime.utcnow().isoformat()

        if not update_data or len(update_data) == 1:  # Only updated_at
            return await get_current_organization(auth)

        result = supabase.table('organizations')\
            .update(update_data)\
            .eq('id', org_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update organization")


# --- Team Member Endpoints ---

@router.get("/current/members", response_model=List[OrganizationMemberResponse])
async def list_organization_members(
    auth: Tuple[str, str] = Depends(require_organization)
):
    """List all members of the current organization."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Fetch members
        result = supabase.table('organization_members')\
            .select('*')\
            .eq('organization_id', org_id)\
            .order('created_at', desc=False)\
            .execute()

        members = result.data or []

        # Fetch user details for each member from auth.users
        # Note: In production, you might want to use a join or view
        for member in members:
            try:
                # Try to get user info from auth metadata or a users table
                # For now, we'll leave user_email and user_name as None
                # until we implement a users profile table
                member['user_email'] = None
                member['user_name'] = None
            except Exception:
                pass

        return members
    except Exception as e:
        logger.error(f"Error listing organization members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list members")


@router.post("/current/members/invite", response_model=OrganizationMemberResponse)
async def invite_organization_member(
    invite_data: OrganizationMemberInvite,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """
    Invite a new member to the organization.
    Requires admin or owner role.

    Note: For now, this creates a placeholder membership that will be
    activated when the invited user signs up or accepts the invitation.
    """
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Check user has admin/owner role
        member_check = supabase.table('organization_members')\
            .select('role')\
            .eq('organization_id', org_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not member_check.data or member_check.data['role'] not in ['owner', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can invite members"
            )

        # Only owners can invite other admins/owners
        if invite_data.role in ['owner', 'admin'] and member_check.data['role'] != 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can invite admins"
            )

        # Check if user with this email already exists and is already a member
        # For now, we'll create a pending invitation record
        # In a full implementation, you'd check auth.users and send an email

        # Create the invitation/membership record
        # Note: user_id will be null until they accept the invite
        new_member = {
            'organization_id': org_id,
            'user_id': None,  # Will be set when user accepts
            'role': invite_data.role,
            'invited_by_user_id': user_id,
            'invited_at': datetime.utcnow().isoformat(),
            'invited_email': invite_data.email,  # Store email for lookup
        }

        result = supabase.table('organization_members')\
            .insert(new_member)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create invitation")

        # TODO: Send invitation email

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to invite member")


@router.put("/current/members/{member_id}/role", response_model=OrganizationMemberResponse)
async def update_member_role(
    member_id: str,
    role_data: OrganizationMemberUpdate,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Update a member's role. Requires owner role to change to/from admin."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Check requesting user's role
        requester_check = supabase.table('organization_members')\
            .select('role')\
            .eq('organization_id', org_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not requester_check.data or requester_check.data['role'] not in ['owner', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can change member roles"
            )

        # Get target member
        target_member = supabase.table('organization_members')\
            .select('*')\
            .eq('id', member_id)\
            .eq('organization_id', org_id)\
            .single()\
            .execute()

        if not target_member.data:
            raise HTTPException(status_code=404, detail="Member not found")

        # Role change restrictions
        requester_role = requester_check.data['role']
        target_role = target_member.data['role']
        new_role = role_data.role

        # Can't change owner's role
        if target_role == 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change owner's role"
            )

        # Only owners can promote to admin or demote from admin
        if (new_role in ['owner', 'admin'] or target_role == 'admin') and requester_role != 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can manage admin roles"
            )

        # Can't make someone else owner (transfer ownership is separate)
        if new_role == 'owner':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign owner role. Use transfer ownership instead."
            )

        # Update the role
        result = supabase.table('organization_members')\
            .update({
                'role': new_role,
                'updated_at': datetime.utcnow().isoformat()
            })\
            .eq('id', member_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update role")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating member role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update role")


@router.delete("/current/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_organization_member(
    member_id: str,
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Remove a member from the organization. Requires admin or owner role."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        # Check requesting user's role
        requester_check = supabase.table('organization_members')\
            .select('role')\
            .eq('organization_id', org_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not requester_check.data or requester_check.data['role'] not in ['owner', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can remove members"
            )

        # Get target member
        target_member = supabase.table('organization_members')\
            .select('*')\
            .eq('id', member_id)\
            .eq('organization_id', org_id)\
            .single()\
            .execute()

        if not target_member.data:
            raise HTTPException(status_code=404, detail="Member not found")

        # Can't remove owner
        if target_member.data['role'] == 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot remove organization owner"
            )

        # Only owners can remove admins
        if target_member.data['role'] == 'admin' and requester_check.data['role'] != 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can remove admins"
            )

        # Can't remove yourself (use leave organization instead)
        if target_member.data['user_id'] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove yourself. Use leave organization instead."
            )

        # Delete the membership
        supabase.table('organization_members')\
            .delete()\
            .eq('id', member_id)\
            .execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove member")


@router.get("/current/role")
async def get_current_user_role(
    auth: Tuple[str, str] = Depends(require_organization)
):
    """Get the current user's role in their organization."""
    user_id, org_id = auth
    supabase = get_supabase()

    try:
        result = supabase.table('organization_members')\
            .select('role')\
            .eq('organization_id', org_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Membership not found")

        return {"role": result.data['role']}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch role")
