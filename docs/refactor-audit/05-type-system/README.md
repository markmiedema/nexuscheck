# Type System Audit

**Focus**: Alignment between TypeScript (frontend) and Pydantic (backend)
**Impact**: 🟡 Important - Type safety prevents runtime errors
**Last Updated**: 2025-01-14

---

## Overview

The SALT Tax Tool uses:
- **Backend**: Pydantic schemas for request/response validation
- **Frontend**: TypeScript interfaces for type safety

**Current State**:
- ⚠️ Types are **manually maintained** (no code generation)
- ⚠️ Only **1 endpoint** uses Pydantic response model (`POST /analyses`)
- ⚠️ **14 of 15 endpoints** return untyped `dict`
- ⚠️ TypeScript types are **aspirational** (define what SHOULD be, not what IS)

**Risks**:
- Backend changes break frontend silently
- Runtime errors when fields are missing/renamed
- No single source of truth for API contracts

---

## Type Coverage Analysis

### Backend Pydantic Schemas

**Location**: `backend/app/schemas/`

**Files**:
1. `analysis.py` - Analysis CRUD schemas
2. `physical_nexus.py` - Physical nexus schemas
3. `__init__.py` - Empty

**Request Schemas** (Used):
- ✅ `AnalysisCreate` - Used in `POST /analyses`
- ✅ `AnalysisUpdate` - **NOT USED** (endpoint returns TODO)
- ✅ `PhysicalNexusCreate` - Used in physical nexus endpoints
- ✅ `PhysicalNexusUpdate` - Used in physical nexus endpoints

**Response Schemas** (Mostly Unused):
- ✅ `AnalysisResponse` - **NOT USED** (should be used but isn't)
- ✅ `PhysicalNexusResponse` - **NOT USED** (endpoints return raw dict)
- ❌ **Missing**: StateResultsResponse
- ❌ **Missing**: StateDetailResponse
- ❌ **Missing**: AnalysesListResponse
- ❌ **Missing**: SummaryResponse
- ❌ **Missing**: UploadResponse
- ❌ **Missing**: ValidationResponse
- ❌ **Missing**: CalculationResponse

**Coverage**:
- Request validation: **4 of 15 endpoints** (27%)
- Response validation: **0 of 15 endpoints** (0%) 🔴

---

### Frontend TypeScript Types

**Location**: `frontend/lib/` and `frontend/types/`

**Files**:
1. `lib/api.ts` - State detail types
2. `lib/api/analyses.ts` - Analysis types
3. `types/states.ts` - State result types

**Interfaces Defined**:
- `StateDetailResponse` (api.ts)
- `YearData` (api.ts)
- `ComplianceInfo` (api.ts)
- `Analysis` (api/analyses.ts)
- `AnalysesListResponse` (api/analyses.ts)
- `StateResult` (types/states.ts)
- `StateResultsResponse` (types/states.ts)
- `StateFilters` (types/states.ts) - Frontend-only
- `StateSort` (types/states.ts) - Frontend-only

**Coverage**:
- ✅ Main data structures typed
- ⚠️ Types manually maintained (no sync with backend)
- ⚠️ Missing types for upload/validation/calculation responses

---

## Type Mismatches Found

### 1. Analysis Interface

**Frontend** (`frontend/lib/api/analyses.ts:3-16`):
```typescript
export interface Analysis {
  id: string
  user_id: string
  client_company_name: string
  industry?: string
  business_type: string
  analysis_period_start: string        // ⚠️ Should be string | null
  analysis_period_end: string          // ⚠️ Should be string | null
  status: 'draft' | 'processing' | 'complete' | 'error'
  total_liability?: number
  states_with_nexus?: number
  created_at: string
  updated_at: string
}
```

**Backend Reality** (from database schema):
```sql
CREATE TABLE analyses (
  -- ... other fields
  analysis_period_start DATE,  -- NULLABLE (since migration 012)
  analysis_period_end DATE,    -- NULLABLE (since migration 012)
  -- ... other fields
)
```

**Backend Pydantic** (`backend/app/schemas/analysis.py:29-36`):
```python
class AnalysisCreate(BaseModel):
    company_name: str
    period_start: Optional[date] = None  # ✅ Correctly nullable
    period_end: Optional[date] = None    # ✅ Correctly nullable
    business_type: BusinessType
    retention_period: RetentionPeriod = RetentionPeriod.DAYS_90
```

**But No AnalysisResponse Schema Used!**

**Mismatch**:
- 🔴 Frontend types `analysis_period_start` as `string` (not nullable)
- 🔴 Frontend types `analysis_period_end` as `string` (not nullable)
- ✅ Backend database allows NULL
- ✅ Backend Pydantic schema correctly marks Optional
- 🔴 Backend API returns raw dict (no validation)

**Impact**: Frontend will error if dates are NULL

**Fix**:
```typescript
export interface Analysis {
  // ...
  analysis_period_start: string | null  // ← Add null
  analysis_period_end: string | null    // ← Add null
  // ...
}
```

---

### 2. StateResult Interface

**Frontend** (`frontend/types/states.ts:5-20`):
```typescript
export interface StateResult {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'no_nexus'
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  total_sales: number
  exempt_sales: number
  taxable_sales: number
  direct_sales: number
  marketplace_sales: number
  threshold: number
  threshold_percent: number
  estimated_liability: number
  confidence_level: 'high' | 'medium' | 'low'
  registration_status: 'registered' | 'not_registered' | null
}
```

**Backend Reality** (`analyses.py:1466-1485`):
```python
{
    'state_code': state_code,
    'state_name': state_names.get(state_code, state_code),
    'nexus_status': nexus_status,
    'nexus_type': nexus_type,
    'total_sales': total_sales_all_years,
    'exempt_sales': exempt_sales_all_years,
    'taxable_sales': taxable_sales_all_years,
    'direct_sales': direct_sales_all_years,
    'marketplace_sales': marketplace_sales_all_years,
    'threshold': float(threshold),
    'threshold_percent': threshold_percent,
    'estimated_liability': total_liability_all_years,
    'confidence_level': 'high',  # TODO: Implement confidence scoring
    'registration_status': (
        'registered' if state_code in registered_states
        else 'not_registered'
    ),
    'year_data': year_data  # ← MISSING IN FRONTEND TYPE!
}
```

**Mismatch**:
- 🔴 Frontend type is **MISSING `year_data` field**
- 🔴 Backend returns it but TypeScript doesn't know about it
- ⚠️ `confidence_level` is hard-coded to `'high'` (never varies)

**Fix**:
```typescript
export interface StateResult {
  // ... existing fields ...
  year_data: YearData[]  // ← Add this
}
```

---

### 3. StateDetailResponse

**Frontend** (`frontend/lib/api.ts:3-20`):
```typescript
export interface StateDetailResponse {
  state_code: string
  state_name: string
  analysis_id: string
  has_transactions: boolean
  analysis_period: {
    years_available: number[]
  }
  year_data: YearData[]
  compliance_info: ComplianceInfo
  // Aggregate totals across all years (for "All Years" view)
  total_sales?: number
  taxable_sales?: number
  exempt_sales?: number
  estimated_liability?: number
  nexus_type?: string
  first_nexus_year?: number
}
```

**Backend Reality** (`analyses.py:1804-1821`):
```python
{
    'state_code': state_code,
    'state_name': state_name,
    'analysis_id': analysis_id,
    'has_transactions': True,
    'analysis_period': {
        'years_available': years_available
    },
    'year_data': year_data,
    'compliance_info': compliance_info,
    # Aggregate totals for "All Years" view
    'total_sales': total_sales_all_years,
    'taxable_sales': total_taxable_sales_all_years,
    'exempt_sales': total_exempt_sales_all_years,
    'estimated_liability': total_liability_all_years,
    'nexus_type': aggregate_nexus_type,
    'first_nexus_year': first_nexus_year
}
```

**Mismatch**:
- ✅ Frontend correctly marks aggregates as optional (`?`)
- 🟡 But they're **ALWAYS** returned (not actually optional)
- 🔴 **Missing from frontend** (per audit 04): `direct_sales`, `marketplace_sales`, `exposure_sales`, `base_tax`, `interest`, `penalties`, `transaction_count`

**Fix**:
```typescript
export interface StateDetailResponse {
  // ... existing fields ...
  // Make non-optional (always returned):
  total_sales: number              // Remove ?
  taxable_sales: number            // Remove ?
  exempt_sales: number             // Remove ?
  estimated_liability: number      // Remove ?
  nexus_type: string               // Remove ?
  first_nexus_year: number | null  // Could be null if no nexus

  // Add missing fields:
  direct_sales: number
  marketplace_sales: number
  exposure_sales: number
  base_tax: number
  interest: number
  penalties: number
  transaction_count: number
}
```

---

### 4. YearData Summary Fields

**Frontend** (`frontend/lib/api.ts:28-46`):
```typescript
summary: {
  total_sales: number  // Gross sales (backward compat)
  gross_sales: number  // Explicit gross sales
  transaction_count: number
  direct_sales: number
  marketplace_sales: number
  taxable_sales: number  // All taxable sales for year
  exposure_sales: number  // Taxable sales during obligation
  exempt_sales: number   // Exempt sales (informational)
  estimated_liability: number
  base_tax: number
  interest?: number      // ⚠️ Optional
  penalties?: number     // ⚠️ Optional
  // Metadata
  interest_rate?: number
  interest_method?: string
  days_outstanding?: number
  penalty_rate?: number
}
```

**Backend Reality** (`analyses.py:1705-1720`):
```python
'summary': {
    'total_sales': total_sales,
    'transaction_count': len(year_transactions),
    'direct_sales': float(year_result.get('direct_sales', 0)),
    'marketplace_sales': float(year_result.get('marketplace_sales', 0)),
    'taxable_sales': float(year_result.get('taxable_sales', 0)),
    'exposure_sales': float(year_result.get('exposure_sales', 0)),
    'estimated_liability': float(year_result.get('estimated_liability', 0)),
    'base_tax': float(year_result.get('base_tax', 0)),
    'interest': float(year_result.get('interest', 0)),
    'penalties': float(year_result.get('penalties', 0)),
    # Calculation metadata for transparency
    'interest_rate': float(year_result.get('interest_rate', 0)) * 100 if year_result.get('interest_rate') else None,
    'interest_method': year_result.get('interest_method'),
    'days_outstanding': year_result.get('days_outstanding'),
    'penalty_rate': float(year_result.get('penalty_rate', 0)) * 100 if year_result.get('penalty_rate') else None
},
```

**Mismatch**:
- 🔴 Frontend marks `interest` and `penalties` as optional but they're ALWAYS returned (as 0 if no value)
- 🔴 Frontend defines `gross_sales` but backend doesn't return it!
- ⚠️ Metadata fields are correctly optional (could be None)

**Fix**:
```typescript
summary: {
  total_sales: number
  // gross_sales: number  ← REMOVE (backend doesn't send this)
  transaction_count: number
  direct_sales: number
  marketplace_sales: number
  taxable_sales: number
  exposure_sales: number
  exempt_sales: number
  estimated_liability: number
  base_tax: number
  interest: number         // Remove ? (always returned)
  penalties: number        // Remove ? (always returned)
  // Metadata (correctly optional)
  interest_rate?: number
  interest_method?: string
  days_outstanding?: number
  penalty_rate?: number
}
```

---

### 5. Missing Types for Upload/Validation Responses

**Frontend**: No types defined

**Backend Returns** (`analyses.py:444-465`):
```python
# POST /analyses/{id}/upload
{
    "message": str,
    "analysis_id": str,
    "auto_detected_mappings": {
        "mappings": dict,
        "confidence": dict,
        "samples": dict,
        "summary": dict,
        "required_detected": dict,
        "optional_detected": dict
    },
    "all_required_detected": bool,
    "optional_columns_found": int,
    "columns_detected": list,
    "date_range_detected": dict | None
}
```

**Issue**: Frontend uses `any` type or no type at all

**Fix**: Create TypeScript interfaces for all response types

---

## Enum Mismatches

### Analysis Status

**Frontend** (`frontend/lib/api/analyses.ts:11`):
```typescript
status: 'draft' | 'processing' | 'complete' | 'error'
```

**Backend Database Constraint** (`migrations/001:133`):
```sql
CONSTRAINT valid_status CHECK (
  status IN ('draft', 'processing', 'complete', 'error')
)
```

**✅ Match!** But these should be shared constants.

---

### Nexus Type

**Frontend** (`frontend/types/states.ts:9`):
```typescript
nexus_type: 'physical' | 'economic' | 'both' | 'none'
```

**Backend** (`analyses.py:199`):
```python
nexus_type VARCHAR(20), -- 'physical', 'economic', 'both', 'none'
```

**✅ Match!** But no backend enum enforcement.

---

### Business Type

**Frontend** (`frontend/lib/api/analyses.ts:8`):
```typescript
business_type: string  // ⚠️ Not typed as enum
```

**Backend Pydantic** (`backend/app/schemas/analysis.py:8-12`):
```python
class BusinessType(str, Enum):
    PRODUCT_SALES = "product_sales"
    DIGITAL_PRODUCTS = "digital_products"
    MIXED = "mixed"
```

**🔴 Mismatch**: Frontend should use enum

**Fix**:
```typescript
business_type: 'product_sales' | 'digital_products' | 'mixed'
```

---

## Missing Frontend Types

These backend responses have NO TypeScript types:

1. **Upload Response** - `POST /analyses/{id}/upload`
2. **Preview Normalization Response** - `POST /analyses/{id}/preview-normalization`
3. **Validation Response** - `POST /analyses/{id}/validate`
4. **Validate and Save Response** - `POST /analyses/{id}/validate-and-save`
5. **Calculation Response** - `POST /analyses/{id}/calculate`
6. **Recalculation Response** - `POST /analyses/{id}/recalculate`
7. **Summary Response** - `GET /analyses/{id}/results/summary`
8. **Columns Response** - `GET /analyses/{id}/columns`

**Impact**: Frontend code uses `any` or assumes structure

---

## Missing Backend Response Models

These endpoints return `dict` instead of Pydantic models:

1. `GET /analyses` - Should use `AnalysesListResponse`
2. `GET /analyses/{id}` - Should use `AnalysisDetailResponse`
3. `POST /analyses/{id}/upload` - Should use `UploadResponse`
4. `POST /analyses/{id}/preview-normalization` - Should use `PreviewResponse`
5. `POST /analyses/{id}/validate-and-save` - Should use `SaveResponse`
6. `GET /analyses/{id}/columns` - Should use `ColumnsResponse`
7. `POST /analyses/{id}/validate` - Should use `ValidationResponse`
8. `POST /analyses/{id}/calculate` - Should use `CalculationResponse`
9. `POST /analyses/{id}/recalculate` - Should use `RecalculationResponse`
10. `GET /analyses/{id}/results/summary` - Should use `SummaryResponse`
11. `GET /analyses/{id}/results/states` - Should use `StateResultsResponse`
12. `GET /analyses/{id}/states/{state_code}` - Should use `StateDetailResponse`

**Only 1 of 15 endpoints** uses `response_model` parameter!

---

## Recommendations

### Phase 1: Add Backend Response Models (3-5 days) 🔴 CRITICAL

**1. Create Response Schemas**

File: `backend/app/schemas/responses.py` (new file)
```python
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date, datetime

class AnalysesListResponse(BaseModel):
    total_count: int
    limit: int
    offset: int
    analyses: List['AnalysisDetail']

class AnalysisDetail(BaseModel):
    id: str
    user_id: str
    client_company_name: str
    industry: Optional[str] = None
    business_type: str
    analysis_period_start: Optional[date] = None
    analysis_period_end: Optional[date] = None
    status: str
    total_liability: Optional[float] = None
    states_with_nexus: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    # Computed fields
    total_transactions: Optional[int] = None
    unique_states: Optional[int] = None

class StateResultsResponse(BaseModel):
    analysis_id: str
    total_states: int
    states: List['StateResult']

class StateResult(BaseModel):
    state_code: str
    state_name: str
    nexus_status: str
    nexus_type: str
    total_sales: float
    exempt_sales: float
    taxable_sales: float
    direct_sales: float
    marketplace_sales: float
    threshold: float
    threshold_percent: float
    estimated_liability: float
    confidence_level: str
    registration_status: Optional[str] = None
    year_data: List['YearData']

# ... etc for all 15 endpoints
```

**2. Use Response Models in Endpoints**

```python
@router.get("", response_model=AnalysesListResponse)
async def list_analyses(...) -> AnalysesListResponse:
    # ... existing code ...
    return AnalysesListResponse(
        total_count=result.count,
        limit=limit,
        offset=offset,
        analyses=result.data
    )
```

**3. Enable OpenAPI Documentation**

Once all endpoints use `response_model`, FastAPI will auto-generate:
- Interactive API docs at `/docs`
- OpenAPI schema at `/openapi.json`

---

### Phase 2: Generate TypeScript Types (1-2 days)

**4. Use openapi-typescript-codegen**

```bash
npm install --save-dev openapi-typescript-codegen

# Generate types from backend
npx openapi-typescript-codegen \
  --input http://localhost:8000/openapi.json \
  --output ./frontend/lib/generated \
  --client axios
```

**5. Replace Manual Types with Generated**

```typescript
// BEFORE
import { Analysis } from './api/analyses'

// AFTER
import { AnalysisDetail } from './generated/models/AnalysisDetail'
```

**6. Add to Build Process**

```json
{
  "scripts": {
    "generate-types": "openapi-typescript-codegen --input http://localhost:8000/openapi.json --output ./frontend/lib/generated",
    "prebuild": "npm run generate-types"
  }
}
```

---

### Phase 3: Prevent Type Drift (ongoing)

**7. Add CI Check**

```yaml
# .github/workflows/type-check.yml
name: Type Check
on: [pull_request]
jobs:
  check-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start backend
        run: docker-compose up -d backend
      - name: Generate types
        run: npm run generate-types
      - name: Check for changes
        run: |
          if ! git diff --exit-code frontend/lib/generated; then
            echo "❌ Generated types don't match backend!"
            exit 1
          fi
```

**8. Add Pre-Commit Hook**

```bash
# .husky/pre-commit
npm run generate-types
git add frontend/lib/generated
```

---

### Phase 4: Improve Type Safety (2-3 days)

**9. Add Zod for Runtime Validation**

Sometimes you need to validate API responses at runtime:

```typescript
import { z } from 'zod'

const AnalysisSchema = z.object({
  id: z.string().uuid(),
  client_company_name: z.string(),
  analysis_period_start: z.string().nullable(),
  // ... etc
})

// Validate response
const data = await apiClient.get('/api/v1/analyses/123')
const analysis = AnalysisSchema.parse(data)  // Throws if invalid
```

**10. Use Discriminated Unions for Status**

```typescript
type AnalysisStatus =
  | { status: 'draft'; error_message: null }
  | { status: 'processing'; error_message: null }
  | { status: 'complete'; error_message: null }
  | { status: 'error'; error_message: string }

// TypeScript knows error_message exists only when status = 'error'
```

---

## Type Generation Tools Comparison

| Tool | Pros | Cons |
|------|------|------|
| **openapi-typescript-codegen** | Full client generation, well-maintained | Opinionated output structure |
| **openapi-typescript** | Lightweight, types only | No client code |
| **swagger-typescript-api** | Good for REST APIs | Less flexible |
| **orval** | Supports React Query | More complex setup |

**Recommendation**: Start with `openapi-typescript-codegen`

---

## Migration Strategy

**Step 1: Backend Response Models (Breaking? No)**
- Add Pydantic response models to all endpoints
- Use `response_model` parameter
- Existing responses still work (backward compatible)
- **Deploy**: Backend only

**Step 2: Fix Known Mismatches (Breaking? Maybe)**
- Fix nullable fields (`analysis_period_start`)
- Add missing fields (`year_data` in StateResult)
- Remove phantom fields (`gross_sales`)
- **Deploy**: Backend + Frontend together

**Step 3: Generate TypeScript Types (Breaking? No)**
- Install code generator
- Generate types
- Keep old types temporarily
- **Deploy**: Frontend only

**Step 4: Replace Manual Types (Breaking? No)**
- Gradually replace manual types with generated
- One file at a time
- **Deploy**: Frontend only, incrementally

**Step 5: Remove Manual Types (Breaking? No)**
- Delete old type files
- Update imports
- **Deploy**: Frontend only

---

## Testing Strategy

### Type Tests

**1. Schema Validation Tests**
```python
# Backend
def test_analysis_response_schema():
    response = AnalysisDetail(
        id="123",
        client_company_name="Test",
        # ... all required fields
    )
    assert response.model_dump()['id'] == "123"
```

**2. Response Contract Tests**
```python
@pytest.mark.parametrize("endpoint", [
    "/analyses",
    "/analyses/123",
    "/analyses/123/results/summary",
    # ... all endpoints
])
def test_endpoint_returns_valid_schema(endpoint):
    response = client.get(endpoint)
    # Pydantic will validate automatically
    assert response.status_code == 200
```

**3. TypeScript Type Tests**
```typescript
// Compile-time type checking
import { Analysis } from './generated'

const analysis: Analysis = {
  id: "123",
  // TypeScript will error if required fields missing
}
```

**4. Runtime Validation Tests**
```typescript
import { expect, test } from 'vitest'
import { AnalysisSchema } from './schemas'

test('API response matches schema', async () => {
  const response = await fetch('/api/v1/analyses/123')
  const data = await response.json()

  // Will throw if doesn't match
  expect(() => AnalysisSchema.parse(data)).not.toThrow()
})
```

---

## Metrics

- **Backend Pydantic Schemas**: 2 files, 9 classes
- **Frontend TypeScript Types**: 3 files, 9 interfaces
- **Endpoints with Request Validation**: 4 of 15 (27%)
- **Endpoints with Response Validation**: 0 of 15 (0%) 🔴
- **Type Mismatches Found**: 5 critical
- **Missing Frontend Types**: 8 responses
- **Lines of Manual Type Definitions**: ~200
- **Lines of Code Saved with Generation**: ~200 (50% reduction in type code)

---

## Critical Issues Summary

### 🔴 Critical

1. **Zero Response Validation**
   - 14 of 15 endpoints return untyped `dict`
   - No FastAPI response validation
   - **Risk**: Breaking changes deployed without notice

2. **Manual Type Maintenance**
   - Types drift from reality over time
   - Already found 5 mismatches
   - **Risk**: Runtime errors, incorrect assumptions

3. **Missing Optional Markers**
   - `analysis_period_start` typed as `string`, should be `string | null`
   - **Risk**: Null reference errors

4. **Phantom Types**
   - Frontend defines `gross_sales` but backend doesn't send it
   - **Risk**: Undefined errors

### 🟡 Important

5. **No Runtime Validation**
   - TypeScript types are compile-time only
   - API could send anything
   - **Risk**: Silent failures

6. **No Type Generation**
   - Manual work to keep types in sync
   - High chance of human error
   - **Risk**: Types become stale

7. **Enum Mismatches**
   - `business_type` is `string` instead of enum
   - **Risk**: Invalid values accepted

### 🟢 Nice to Have

8. **No OpenAPI Docs**
   - API not self-documenting
   - Frontend devs guess structure
   - **Risk**: Miscommunication

9. **No Discriminated Unions**
   - Status + error_message relationship not typed
   - **Risk**: Accessing undefined fields

---

## Next Steps

1. ✅ Complete this audit
2. ⏸️ Create Pydantic response models for all 15 endpoints
3. ⏸️ Fix known type mismatches
4. ⏸️ Set up openapi-typescript-codegen
5. ⏸️ Generate TypeScript types
6. ⏸️ Add CI check for type drift
7. ⏸️ Gradually replace manual types

---

*Continue to: `06-business-rules/` audit (optional)*
*Or skip to: `99-refactor-roadmap/` (recommended)*
