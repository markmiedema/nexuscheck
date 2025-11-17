# Rate Limiting Configuration

## Overview

Rate limiting is implemented using `slowapi` to prevent DoS attacks and API abuse.

## Default Limits

All endpoints have a default limit unless otherwise specified:
- **100 requests/minute** per IP address

## Endpoint-Specific Limits

### File Upload Endpoints
- **Limit:** 10 requests/minute
- **Endpoints:**
  - `POST /api/v1/analyses/{id}/upload`
- **Reason:** Large file uploads are resource-intensive

### Calculation Endpoints
- **Limit:** 20 requests/minute
- **Endpoints:**
  - `POST /api/v1/analyses/{id}/calculate`
  - `POST /api/v1/analyses/{id}/recalculate`
  - `POST /api/v1/analyses/{id}/vda`
- **Reason:** Complex calculations are CPU-intensive

### Authentication Endpoints
- **Limit:** 5 requests/minute
- **Endpoints:** (when implemented)
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/signup`
- **Reason:** Prevent brute force attacks

## Configuration

Rate limits are configurable via environment variables in `.env`:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Default limit for all endpoints
RATE_LIMIT_DEFAULT="100/minute"

# Authentication endpoints
RATE_LIMIT_AUTH="5/minute"

# File upload endpoints
RATE_LIMIT_UPLOAD="10/minute"

# Calculation endpoints
RATE_LIMIT_CALCULATE="20/minute"
```

## Rate Limit Response

When a rate limit is exceeded, the API returns:

**Status Code:** `429 Too Many Requests`

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

**Response Body:**
```json
{
  "error": "Rate limit exceeded",
  "detail": "100 per 1 minute"
}
```

## Testing Rate Limits

To test rate limits in development:

```bash
# Make 11 rapid file uploads (should hit limit on 11th)
for i in {1..11}; do
  curl -X POST http://localhost:8000/api/v1/analyses/123/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test.csv"
done
```

## Production Considerations

1. **Behind a Proxy/Load Balancer:**
   - Configure `slowapi` to use `X-Forwarded-For` header
   - Update `get_remote_address` function if needed

2. **Distributed Systems:**
   - Current implementation uses in-memory storage
   - For multi-server deployments, consider Redis-based rate limiting

3. **Monitoring:**
   - Monitor 429 responses in logs
   - Alert on unusual patterns
   - Adjust limits based on legitimate usage patterns

## Disabling Rate Limiting

For testing or specific environments:

```bash
RATE_LIMIT_ENABLED=false
```

Or remove the `@limiter.limit()` decorators from specific endpoints.
