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
