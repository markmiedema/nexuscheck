# Critical Fixes for API Quality Issues
## Specific Code Examples and Implementation Guide

---

## FIX #1: Error Message Exposure (13 locations)

### BEFORE (Current - INSECURE):
```python
# Line 100-104 in analyses.py
except Exception as e:
    logger.error(f"Error listing analyses: {str(e)}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Failed to fetch analyses: {str(e)}"  # ❌ Exposes internals
    )
```

### AFTER (Fixed - SECURE):
```python
except Exception as e:
    # Log full details server-side
    logger.error(
        f"Error listing analyses for user {user_id}",
        exc_info=True,  # ✅ Includes full traceback
        extra={
            "user_id": user_id,
            "operation": "list_analyses",
            "error_type": type(e).__name__
        }
    )
    # Return generic message to client
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to fetch analyses. Please try again later."  # ✅ Generic
    )
```

### Implementation for ALL endpoints:

Create a helper decorator:
```python
# In app/core/errors.py
import functools
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

def handle_errors(operation_name: str):
    """Decorator to standardize error handling"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                raise  # Re-raise HTTP exceptions as-is
            except Exception as e:
                user_id = kwargs.get('user_id', 'unknown')
                logger.error(
                    f"Error in {operation_name}",
                    exc_info=True,
                    extra={
                        "user_id": user_id,
                        "operation": operation_name,
                        "error_type": type(e).__name__
                    }
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to {operation_name}. Please try again later."
                )
        return wrapper
    return decorator

# Usage:
@router.get("", response_model=AnalysesListResponse)
@handle_errors("list_analyses")
async def list_analyses(...):
    ...
```

**Files to update:** 13 error handlers
- analyses.py: Lines 100, 147, 233, 288, 349, 437, 489, 603, 651, 750, 871, 1055, 1125, 1209
- vda.py: Line 135, 237
- physical_nexus.py: Various locations

---

## FIX #2: CORS Configuration (main.py)

### BEFORE (Current - INSECURE):
```python
# Line 24-36 in main.py
cors_config = {
    "allow_origins": settings.allowed_origins_list,
    "allow_credentials": True,
    "allow_methods": ["*"],      # ❌ ALLOWS ALL HTTP METHODS
    "allow_headers": ["*"],      # ❌ ALLOWS ALL HEADERS
}
```

### AFTER (Fixed - SECURE):
```python
# In main.py
from fastapi.middleware.cors import CORSMiddleware

# Build CORS config
cors_config = {
    "allow_origins": settings.allowed_origins_list,
    "allow_credentials": True,
    # ✅ Explicitly list allowed methods
    "allow_methods": [
        "GET",      # Safe method for data retrieval
        "POST",     # Data creation
        "PATCH",    # Data updates
        "DELETE",   # Data deletion
    ],
    # ✅ Explicitly list allowed headers
    "allow_headers": [
        "Content-Type",      # Required for JSON
        "Authorization",     # Required for JWT tokens
        "Accept",           # Content negotiation
    ],
    "max_age": 3600,         # ✅ Cache preflight for 1 hour
    "expose_headers": ["Content-Length"],  # ✅ Expose response headers
}

# Add regex pattern for Vercel if configured
if settings.ALLOWED_ORIGIN_REGEX:
    cors_config["allow_origin_regex"] = settings.ALLOWED_ORIGIN_REGEX
    logger.info(f"CORS: Using origin regex: {settings.ALLOWED_ORIGIN_REGEX}")

# Add middleware
app.add_middleware(CORSMiddleware, **cors_config)
logger.info(f"CORS configured: Methods={cors_config['allow_methods']}, Headers={cors_config['allow_headers']}")
```

**Impact:** Prevents CSRF attacks and header injection vulnerabilities

---

## FIX #3: File Upload Validation (analyses.py)

### BEFORE (Current - INSUFFICIENT):
```python
# Line 316-327
file_extension = file.filename.split('.')[-1].lower()
if file_extension not in ['csv', 'xlsx', 'xls']:
    raise HTTPException(...)
```

### AFTER (Fixed - COMPLETE):
```python
import mimetypes
import uuid
from pathlib import Path

# Create this validation module: app/utils/file_validation.py
class FileValidator:
    """Validates file uploads for security"""
    
    # Allowed MIME types by extension
    ALLOWED_MIMES = {
        'csv': {'text/csv', 'text/plain'},
        'xlsx': {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
        'xls': {'application/vnd.ms-excel'}
    }
    
    # Dangerous patterns to check in content
    DANGEROUS_PATTERNS = [
        b'<?php',      # PHP code
        b'<%',         # ASP code
        b'<script',    # JavaScript
        b'PK\x03\x04', # Executable disguised as ZIP (some cases)
    ]
    
    @staticmethod
    def validate_file(file: UploadFile) -> tuple[str, str]:
        """
        Validate file upload
        Returns: (extension, safe_filename)
        Raises: HTTPException on validation failure
        """
        # 1. Check filename exists
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )
        
        # 2. Parse filename safely
        path = Path(file.filename)
        extension = path.suffix.lstrip('.').lower()
        
        # 3. Validate extension
        if extension not in FileValidator.ALLOWED_MIMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type .{extension} not allowed. Allowed types: csv, xlsx, xls"
            )
        
        # 4. Validate MIME type
        guessed_mime, _ = mimetypes.guess_type(file.filename)
        allowed_mimes = FileValidator.ALLOWED_MIMES[extension]
        
        if guessed_mime not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File MIME type mismatch. Expected {allowed_mimes}, got {guessed_mime}"
            )
        
        # 5. Generate safe filename
        safe_filename = f"{uuid.uuid4()}.{extension}"
        
        return extension, safe_filename
    
    @staticmethod
    def scan_content(content: bytes, extension: str):
        """Scan file content for dangerous patterns"""
        # 1. Check for dangerous content
        for pattern in FileValidator.DANGEROUS_PATTERNS:
            if pattern in content:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File contains potentially dangerous content. Upload rejected."
                )
        
        # 2. For CSV, try to parse to ensure it's valid
        if extension == 'csv':
            try:
                pd.read_csv(io.BytesIO(content), nrows=10)  # Just parse first few rows
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File does not appear to be a valid CSV file"
                )

# Updated endpoint:
@router.post("/{analysis_id}/upload", response_model=UploadResponse)
async def upload_transactions(
    analysis_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(require_auth)
):
    """Upload and process transaction data CSV file."""
    supabase = get_supabase()
    
    try:
        # Verify analysis exists
        analysis_result = supabase.table('analyses')\
            .select('*')\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # ✅ NEW: Validate file
        from app.utils.file_validation import FileValidator
        extension, safe_filename = FileValidator.validate_file(file)
        
        # Read file content
        content = await file.read()
        
        # ✅ NEW: Validate file size
        max_size = 50 * 1024 * 1024
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large ({len(content) / 1024 / 1024:.1f} MB). Maximum is 50 MB."
            )
        
        # ✅ NEW: Scan file content
        FileValidator.scan_content(content, extension)
        
        # ... rest of endpoint
        
        # ✅ NEW: Use safe filename
        storage_path = f"uploads/{user_id}/{analysis_id}/{safe_filename}"
        
```

**Impact:** Prevents file upload exploits and DOS attacks

---

## FIX #4: Rate Limiting (main.py)

### Implementation:

```bash
# Install required package
pip install slowapi
```

```python
# In main.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

# In analyses.py
@router.post("/{analysis_id}/upload", response_model=UploadResponse)
@limiter.limit("5/minute")  # 5 uploads per minute per IP
async def upload_transactions(...):
    """Upload transactions - rate limited to prevent DOS"""

@router.post("/{analysis_id}/calculate", response_model=CalculationResponse)
@limiter.limit("3/minute")  # Expensive operation
async def calculate_nexus(...):
    """Calculate nexus - rate limited due to expense"""

@router.get("", response_model=AnalysesListResponse)
@limiter.limit("100/minute")  # Read operation - more lenient
async def list_analyses(...):
    """List analyses - lenient rate limit"""

# In vda.py
@router.post("/{analysis_id}/vda", response_model=VDAResponse)
@limiter.limit("10/minute")  # VDA calculations are expensive
async def calculate_vda_scenario(...):
    """Calculate VDA - rate limited"""
```

**Impact:** Prevents DOS attacks and resource abuse

---

## FIX #5: Bare Except Clauses (3 locations)

### BEFORE (Current - DANGEROUS):
```python
# Line 426-427 in analyses.py
try:
    supabase.storage.from_('analysis-uploads').remove([storage_path])
except:  # ❌ BARE EXCEPT - catches EVERYTHING
    pass  # ❌ Silent failure
```

### AFTER (Fixed - PROPER):
```python
try:
    supabase.storage.from_('analysis-uploads').remove([storage_path])
    logger.info(f"Removed existing file at {storage_path}")
except FileNotFoundError:
    # Expected - file doesn't exist
    logger.debug(f"File {storage_path} not found (expected on first upload)")
except Exception as e:
    # Unexpected error
    logger.warning(f"Could not remove existing file {storage_path}: {str(e)}")
    # Don't fail - the new upload will overwrite anyway
```

**Similar fixes needed at:**
- Line 426-427: upload_transactions
- Line 1122: calculate_nexus
- Line 1207: recalculate_analysis

**Impact:** Better error visibility and debugging capability

---

## FIX #6: Missing Pydantic Validation

### Create new schema file: `app/schemas/column_mappings.py`

```python
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional

class ColumnMapping(BaseModel):
    """Single column mapping configuration"""
    source_column: str = Field(..., min_length=1)
    date_format: Optional[str] = None
    value_mappings: Optional[Dict[str, str]] = None

class PreviewNormalizationRequest(BaseModel):
    """Request for preview-normalization endpoint"""
    column_mappings: Dict[str, ColumnMapping] = Field(...)
    
    @field_validator('column_mappings')
    @classmethod
    def validate_mappings_not_empty(cls, v):
        if not v:
            raise ValueError("column_mappings cannot be empty")
        
        # Verify required fields are present
        required = {'transaction_date', 'customer_state', 'revenue_amount', 'sales_channel'}
        provided = set(v.keys())
        
        if not required.issubset(provided):
            missing = required - provided
            raise ValueError(f"Missing required mappings: {', '.join(missing)}")
        
        return v

class ValidateAndSaveRequest(BaseModel):
    """Request for validate-and-save endpoint"""
    column_mappings: Dict[str, ColumnMapping] = Field(...)

class ValidateDataRequest(BaseModel):
    """Request for validate endpoint"""
    column_mappings: Dict[str, str] = Field(
        ...,
        description="Mapping of field names to column names"
    )
```

### Update endpoints:

```python
# BEFORE
@router.post("/{analysis_id}/preview-normalization")
async def preview_normalization(
    analysis_id: str,
    request_body: dict,  # ❌ NO VALIDATION
    user_id: str = Depends(require_auth)
):

# AFTER
from app.schemas.column_mappings import PreviewNormalizationRequest

@router.post("/{analysis_id}/preview-normalization")
async def preview_normalization(
    analysis_id: str,
    request: PreviewNormalizationRequest,  # ✅ VALIDATED
    user_id: str = Depends(require_auth)
):
    # Access validated data
    column_mappings = request.column_mappings
    # ...
```

**Impact:** Type safety and better validation at API boundary

---

## FIX #7: Bare Except Clauses - Logging Issue (vda.py)

### BEFORE (Current):
```python
# Line 194-195, 234-235 in vda.py
def get_vda_status(...):
    import logging  # ❌ Import in function
    logger = logging.getLogger(__name__)  # ❌ Create logger in function
```

### AFTER (Fixed):
```python
# At module level in vda.py
import logging
logger = logging.getLogger(__name__)  # ✅ Module-level logger

@router.get("/{analysis_id}/vda/status", response_model=VDAStatusResponse)
async def get_vda_status(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get current VDA status for analysis."""
    try:
        logger.info(f"VDA status requested", extra={
            "analysis_id": analysis_id,
            "user_id": user_id
        })
        
        # ... rest of code
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting VDA status", exc_info=True, extra={
            "analysis_id": analysis_id,
            "user_id": user_id,
            "error_type": type(e).__name__
        })
        raise HTTPException(...)
```

**Impact:** Cleaner code, better performance, consistent logging

---

## FIX #8: Input Validation - Query Parameters

### BEFORE (Current - VULNERABLE TO DOS):
```python
# Line 50-51 in analyses.py
async def list_analyses(
    user_id: str = Depends(require_auth),
    limit: int = 50,          # ❌ No validation
    offset: int = 0,          # ❌ No validation
    search: Optional[str] = None,  # ❌ No length validation
    status_filter: Optional[str] = None
):
```

### AFTER (Fixed - PROTECTED):
```python
from fastapi import Query

async def list_analyses(
    user_id: str = Depends(require_auth),
    limit: int = Query(50, ge=1, le=1000, description="Max 1000 items per request"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    status_filter: Optional[str] = Query(None, regex="^(draft|processing|complete|error)$")
):
    """
    List all analyses for the current user.
    """
```

**Impact:** Prevents DOS attacks via parameter validation

---

## IMPLEMENTATION PRIORITY

### Must do immediately (before production):
1. Fix error message exposure (all 13 locations)
2. Fix CORS configuration  
3. Fix file upload validation
4. Add rate limiting
5. Fix bare except clauses

### Estimated time: 2-3 days

### Then do within 1 week:
6. Add Pydantic validation
7. Fix N+1 queries
8. Add transaction handling
9. Standardize authentication
10. Add request size validation

---

## TESTING CHECKLIST

After implementing fixes:

- [ ] Error messages don't expose internals (check logs, not responses)
- [ ] CORS test: `curl -H "Origin: http://evil.com" -v http://api/health`
- [ ] File upload test: Try uploading .exe, .php, .csv.exe files
- [ ] Rate limit test: Send 10 requests in 1 second
- [ ] Bare except test: Check logs when storage operation fails
- [ ] Input validation: Try `/analyses?limit=999999999&offset=-1`
- [ ] Pydantic validation: Send invalid column_mappings to validate endpoint

