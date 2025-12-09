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

    For now, returns the first organization the user is a member of.
    In the future, this could respect a "current organization" selection.

    Args:
        user_id: The authenticated user's ID

    Returns:
        organization_id: The user's organization ID, or None if not found
    """
    from app.core.supabase import get_supabase

    supabase = get_supabase()
    try:
        result = supabase.table('organization_members')\
            .select('organization_id')\
            .eq('user_id', user_id)\
            .limit(1)\
            .execute()

        if result.data and len(result.data) > 0:
            return result.data[0]['organization_id']
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
