"""JWT authentication and authorization"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate JWT token and extract user_id.

    Args:
        credentials: JWT token from Authorization header

    Returns:
        user_id: The authenticated user's ID

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        # Verify JWT with Supabase secret
        # Add leeway to handle minor clock sync issues (up to 10 seconds)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            leeway=10
        )

        # Extract user ID from claims
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Token missing user ID (sub claim)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )

        logger.debug(f"User authenticated: {user_id}")
        return user_id

    except jwt.ExpiredSignatureError:
        logger.warning("Expired token presented")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed token"
        )
    except Exception as e:
        logger.error(f"Unexpected error validating token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


# Dependency for protected endpoints
async def require_auth(user_id: str = Depends(get_current_user)) -> str:
    """Require authentication for an endpoint"""
    return user_id


async def get_user_organization_id(user_id: str) -> str | None:
    """
    Get the primary organization ID for a user.

    This function also auto-accepts any pending invitations that match
    the user's email address.

    For now, returns the first organization the user is a member of.
    In the future, this could respect a "current organization" selection.

    Args:
        user_id: The authenticated user's ID

    Returns:
        organization_id: The user's organization ID, or None if not found
    """
    from app.core.supabase import get_supabase
    from datetime import datetime

    supabase = get_supabase()
    try:
        # First, check for existing active membership
        result = supabase.table('organization_members')\
            .select('organization_id')\
            .eq('user_id', user_id)\
            .limit(1)\
            .execute()

        if result.data and len(result.data) > 0:
            return result.data[0]['organization_id']

        # No active membership found - check for pending invitations
        # First, get the user's email from the users table
        user_result = supabase.table('users')\
            .select('email')\
            .eq('id', user_id)\
            .single()\
            .execute()

        if not user_result.data or not user_result.data.get('email'):
            logger.debug(f"Could not find email for user {user_id}")
            return None

        user_email = user_result.data['email']

        # Look for pending invitation with this email
        invite_result = supabase.table('organization_members')\
            .select('id, organization_id')\
            .is_('user_id', 'null')\
            .eq('invited_email', user_email)\
            .limit(1)\
            .execute()

        if invite_result.data and len(invite_result.data) > 0:
            invite = invite_result.data[0]
            logger.info(f"Auto-accepting invitation for {user_email} to org {invite['organization_id']}")

            # Accept the invitation by updating user_id and accepted_at
            supabase.table('organization_members')\
                .update({
                    'user_id': user_id,
                    'accepted_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat(),
                })\
                .eq('id', invite['id'])\
                .execute()

            return invite['organization_id']

        return None
    except Exception as e:
        logger.error(f"Error getting user organization: {str(e)}")
        return None


async def require_organization(user_id: str = Depends(require_auth)) -> tuple[str, str]:
    """
    Require authentication AND organization membership.

    Returns:
        tuple: (user_id, organization_id)

    Raises:
        HTTPException: If user has no organization
    """
    org_id = await get_user_organization_id(user_id)
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of any organization"
        )
    return (user_id, org_id)
