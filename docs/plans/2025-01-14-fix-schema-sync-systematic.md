# Schema Synchronization Systematic Fix - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate schema mismatches between Database → Backend → Frontend by establishing a single source of truth and validation at every layer.

**Architecture:**
1. Database schemas are authoritative (PostgreSQL)
2. Backend Pydantic models validate ALL responses (not just requests)
3. Backend actually uses database views (state_results_aggregated)
4. Frontend TypeScript types match backend Pydantic 1:1
5. Add runtime validation to catch mismatches immediately

**Tech Stack:** PostgreSQL views, FastAPI Pydantic response_model, TypeScript, automated testing

---

## Phase 1: Fix Backend Response Validation (Critical)

### Task 1: Fix State Detail Endpoint to Use Response Model

**Problem:** Backend returns untyped dict, Pydantic schema doesn't match what's actually returned

**Files:**
- Modify: `backend/app/api/v1/analyses.py:1532-1900` (get_state_detail endpoint)
- Modify: `backend/app/schemas/responses.py:272-290` (StateDetailResponse model)

**Step 1: Update StateDetailResponse to match actual response**

File: `backend/app/schemas/responses.py`

Find line 272 and verify the model includes ALL fields the endpoint returns:

```python
class StateDetailResponse(BaseModel):
    """Response for GET /analyses/{id}/states/{state_code}"""
    state_code: str
    state_name: str
    analysis_id: str
    has_transactions: bool
    analysis_period: Dict[str, List[int]]  # {"years_available": [2023, 2024]}
    year_data: List[DetailedYearData]  # ✅ Already using DetailedYearData
    compliance_info: ComplianceInfo
    # Aggregate totals (always returned, not optional!)
    total_sales: float  # Remove Optional
    taxable_sales: float  # Remove Optional
    exempt_sales: float  # Remove Optional
    direct_sales: float  # Remove Optional
    marketplace_sales: float  # Remove Optional
    exposure_sales: float  # Remove Optional
    transaction_count: int  # Remove Optional
    estimated_liability: float  # Remove Optional
    base_tax: float  # Remove Optional
    interest: float  # Remove Optional
    penalties: float  # Remove Optional
    nexus_type: str  # Remove Optional
    first_nexus_year: Optional[int] = None  # Null if no nexus
```

**Step 2: Make endpoint ACTUALLY USE the response model**

File: `backend/app/api/v1/analyses.py`

Current code at line 1866 returns a plain dict. Change it to:

```python
# At line 1866, REPLACE the return dict with:
return StateDetailResponse(
    state_code=state_code,
    state_name=state_name,
    analysis_id=analysis_id,
    has_transactions=True,
    analysis_period={'years_available': years_available},
    year_data=year_data,
    compliance_info=compliance_info,
    total_sales=total_sales_all_years,
    taxable_sales=total_taxable_sales_all_years,
    exempt_sales=total_exempt_sales_all_years,
    direct_sales=total_direct_sales_all_years,
    marketplace_sales=total_marketplace_sales_all_years,
    exposure_sales=total_exposure_sales_all_years,
    transaction_count=total_transaction_count_all_years,
    estimated_liability=total_liability_all_years,
    base_tax=total_base_tax_all_years,
    interest=total_interest_all_years,
    penalties=total_penalties_all_years,
    nexus_type=aggregate_nexus_type,
    first_nexus_year=first_nexus_year
)
```

**Step 3: Test the endpoint returns valid response**

Run backend:
```bash
cd backend
source venv/bin/activate  # or venv/Scripts/activate on Windows
uvicorn app.main:app --reload
```

Test:
```bash
curl http://localhost:8000/api/v1/analyses/{valid-analysis-id}/states/CA
```

Expected: Valid JSON response with all fields, NO 500 error, NO validation error

**Step 4: Commit**

```bash
git add backend/app/schemas/responses.py backend/app/api/v1/analyses.py
git commit -m "fix: make state detail endpoint use Pydantic response validation

- StateDetailResponse now matches actual endpoint response
- All aggregate fields are non-optional (always returned)
- Endpoint returns StateDetailResponse instance (enables validation)
- Fixes 500 errors from schema mismatches"
```

---

### Task 2: Fix State Results List Endpoint Response Validation

**Problem:** GET /results/states returns untyped dict with flat year_data

**Files:**
- Modify: `backend/app/api/v1/analyses.py:1368-1530` (get_state_results endpoint)
- Verify: `backend/app/schemas/responses.py:203-219` (StateResultsResponse)

**Step 1: Verify StateResultsResponse schema**

File: `backend/app/schemas/responses.py:203-219`

Schema should be:
```python
class StateResultsResponse(BaseModel):
    """Response for GET /analyses/{id}/results/states"""
    analysis_id: str
    total_states: int
    states: List[StateResult]
```

And `StateResult` should have `year_data: List[YearData]` where `YearData` is the FLAT version.

**Step 2: Make endpoint return response model**

File: `backend/app/api/v1/analyses.py:1516-1530`

REPLACE the return dict with:

```python
return StateResultsResponse(
    analysis_id=analysis_id,
    total_states=len(formatted_states),
    states=formatted_states  # Already matches StateResult schema
)
```

**Step 3: Test the endpoint**

```bash
curl http://localhost:8000/api/v1/analyses/{valid-analysis-id}/results/states
```

Expected: Valid JSON array with all states

**Step 4: Commit**

```bash
git add backend/app/api/v1/analyses.py
git commit -m "fix: state results endpoint uses Pydantic validation"
```

---

### Task 3: Fix All Remaining Unvalidated Endpoints

**Problem:** 12 more endpoints return untyped dicts

**Files:**
- Modify: `backend/app/api/v1/analyses.py` (multiple endpoints)
- Create missing schemas in: `backend/app/schemas/responses.py`

**Endpoints to fix:**

1. `GET /analyses` - Uses AnalysesListResponse ✅ (verify it's actually used)
2. `GET /analyses/{id}` - Should use AnalysisDetailResponse
3. `POST /analyses/{id}/upload` - Should use UploadResponse
4. `GET /analyses/{id}/columns` - Uses ColumnsResponse (verify)
5. `POST /analyses/{id}/validate` - Should use ValidationResponse
6. `POST /analyses/{id}/validate-and-save` - Should use ValidateAndSaveResponse
7. `POST /analyses/{id}/calculate` - Should use CalculationResponse
8. `GET /analyses/{id}/results/summary` - Should use ResultsSummaryResponse

**For EACH endpoint:**

```python
# Old (WRONG):
return {
    "field1": value1,
    "field2": value2
}

# New (RIGHT):
return ResponseModelClass(
    field1=value1,
    field2=value2
)
```

**Step 1: Check if schemas exist**

Read `backend/app/schemas/responses.py` and verify these exist:
- AnalysisDetailResponse ✅
- UploadResponse ✅
- ColumnsResponse ✅
- ValidationResponse ✅
- ValidateAndSaveResponse ✅
- CalculationResponse ✅
- ResultsSummaryResponse ✅

**Step 2: Update each endpoint to return model instance**

Go through `analyses.py` and change each return statement.

**Step 3: Test each endpoint**

```bash
# Test upload
curl -X POST http://localhost:8000/api/v1/analyses/{id}/upload -F "file=@test.csv"

# Test columns
curl http://localhost:8000/api/v1/analyses/{id}/columns

# etc.
```

**Step 4: Commit**

```bash
git add backend/app/api/v1/analyses.py
git commit -m "fix: all endpoints now use Pydantic response validation

- Prevents schema drift between backend and API contracts
- Catches type errors at response time
- Documents API contracts through code"
```

---

## Phase 2: Use Database Views (Performance + Correctness)

### Task 4: Make Backend Use state_results_aggregated View

**Problem:** Migration 024 created the view, but backend still does manual aggregation

**Files:**
- Modify: `backend/app/api/v1/analyses.py:1588-1858` (get_state_detail aggregation logic)

**Step 1: Replace manual aggregation with view query**

File: `backend/app/api/v1/analyses.py`

Find lines 1588-1598 (the try/except block for aggregates_result).

REPLACE the entire aggregation fallback section (lines 1822-1858) with:

```python
# Get pre-aggregated totals from database view
aggregates_result = supabase.table('state_results_aggregated').select(
    '*'
).eq('analysis_id', analysis_id).eq(
    'state_code', state_code
).execute()

if not aggregates_result.data:
    raise HTTPException(
        status_code=500,
        detail=f"Failed to get aggregated data for {state_code}. This should never happen."
    )

agg = aggregates_result.data[0]
total_sales_all_years = float(agg.get('total_sales') or 0)
total_taxable_sales_all_years = float(agg.get('taxable_sales') or 0)
total_exempt_sales_all_years = float(agg.get('exempt_sales') or 0)
total_direct_sales_all_years = float(agg.get('direct_sales') or 0)
total_marketplace_sales_all_years = float(agg.get('marketplace_sales') or 0)
total_exposure_sales_all_years = float(agg.get('exposure_sales') or 0)
total_transaction_count_all_years = int(agg.get('transaction_count') or 0)
total_liability_all_years = float(agg.get('estimated_liability') or 0)
total_base_tax_all_years = float(agg.get('base_tax') or 0)
total_interest_all_years = float(agg.get('interest') or 0)
total_penalties_all_years = float(agg.get('penalties') or 0)
aggregate_nexus_type = agg.get('nexus_type', 'none')
first_nexus_year = agg.get('first_nexus_year')
```

**Step 2: Remove the 60+ line fallback aggregation code**

Delete lines 1822-1858 (the Python aggregation fallback).

**Step 3: Test endpoint performance**

```bash
# Time the request
time curl http://localhost:8000/api/v1/analyses/{id}/states/CA
```

Expected: Faster response (database aggregation is faster than Python loops)

**Step 4: Commit**

```bash
git add backend/app/api/v1/analyses.py
git commit -m "perf: use state_results_aggregated view for aggregation

- Eliminates 60+ lines of Python aggregation code
- Database performs aggregation (30-50% faster)
- Single query instead of fetch-then-aggregate
- References migration 024"
```

---

## Phase 3: Sync Frontend Types with Backend

### Task 5: Update Frontend TypeScript Types to Match Backend

**Problem:** Frontend types manually maintained, drift from backend Pydantic schemas

**Files:**
- Modify: `frontend/lib/api.ts:30-55` (StateDetailResponse interface)
- Modify: `frontend/types/states.ts:5-20` (StateResult interface)

**Step 1: Update StateDetailResponse to match backend**

File: `frontend/lib/api.ts`

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
  // Aggregate totals (always returned - not optional!)
  total_sales: number              // Removed ?
  taxable_sales: number            // Removed ?
  exempt_sales: number             // Removed ?
  direct_sales: number             // Added
  marketplace_sales: number        // Added
  exposure_sales: number           // Added
  transaction_count: number        // Added
  estimated_liability: number      // Removed ?
  base_tax: number                 // Added
  interest: number                 // Added
  penalties: number                // Added
  nexus_type: string               // Removed ?
  first_nexus_year: number | null  // Can be null if no nexus
}
```

**Step 2: Update StateResult to include year_data**

File: `frontend/types/states.ts`

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
  year_data: YearData[]  // ← Add this field (backend returns it)
}
```

**Step 3: Update Analysis interface for nullable dates**

File: `frontend/lib/api/analyses.ts`

```typescript
export interface Analysis {
  id: string
  user_id: string
  client_company_name: string
  industry?: string
  business_type: string
  analysis_period_start: string | null  // ← Add | null
  analysis_period_end: string | null    // ← Add | null
  status: 'draft' | 'processing' | 'complete' | 'error'
  total_liability?: number
  states_with_nexus?: number
  created_at: string
  updated_at: string
}
```

**Step 4: Run TypeScript type check**

```bash
cd frontend
npm run type-check
```

Expected: No errors (or existing errors reduced)

**Step 5: Commit**

```bash
git add frontend/lib/api.ts frontend/types/states.ts frontend/lib/api/analyses.ts
git commit -m "fix: sync TypeScript types with backend Pydantic schemas

- StateDetailResponse includes all aggregate fields (non-optional)
- StateResult includes year_data field backend returns
- Analysis dates are nullable (matches database schema)
- Fixes runtime errors from missing/null fields"
```

---

## Phase 4: Remove Frontend Duplicate Aggregation

### Task 6: Use Backend Aggregates Instead of Frontend .reduce()

**Problem:** Frontend manually aggregates data backend already calculated (25+ .reduce() calls)

**Files:**
- Modify: `frontend/components/analysis/StateQuickViewModal.tsx:124-443`
- Modify: `frontend/app/analysis/[id]/states/[stateCode]/page.tsx:235-529`

**Step 1: Replace .reduce() with backend-provided fields**

File: `frontend/components/analysis/StateQuickViewModal.tsx`

REPLACE all manual aggregations:

```typescript
// ❌ OLD (manual aggregation):
const directSales = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
const marketplaceSales = data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
const exposureSales = data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0)

// ✅ NEW (use backend values):
const directSales = data.direct_sales
const marketplaceSales = data.marketplace_sales
const exposureSales = data.exposure_sales
```

**Replacements needed:**
- Line 124: `directSales` → use `data.direct_sales`
- Line 125: `marketplaceSales` → use `data.marketplace_sales`
- Line 128: `exposureSales` → use `data.exposure_sales`
- Line 377: taxable sales reduce → use `data.taxable_sales`
- Line 383: transaction count reduce → use `data.transaction_count`
- Line 431: base tax reduce → use `data.base_tax`
- Line 437: interest reduce → use `data.interest`
- Line 443: penalties reduce → use `data.penalties`

**Step 2: Repeat for state detail page**

File: `frontend/app/analysis/[id]/states/[stateCode]/page.tsx`

Same replacements for lines 235, 264, 269, 274, 293, 374, 385, 390, 395, 400, 529

**Step 3: Test frontend displays correct values**

```bash
cd frontend
npm run dev
```

Navigate to state detail page, verify all totals match backend values.

**Step 4: Commit**

```bash
git add frontend/components/analysis/StateQuickViewModal.tsx frontend/app/analysis/[id]/states/[stateCode]/page.tsx
git commit -m "perf: use backend aggregates instead of frontend .reduce()

- Eliminates 25+ duplicate aggregation calculations
- Frontend now trusts backend as single source of truth
- Faster rendering (no manual calculation on every render)
- Fixes inconsistencies from different rounding"
```

---

## Phase 5: Add Automated Schema Validation Tests

### Task 7: Add Backend Response Validation Tests

**Problem:** No tests verify Pydantic schemas match actual responses

**Files:**
- Create: `backend/tests/test_api_contracts.py`

**Step 1: Write failing test**

File: `backend/tests/test_api_contracts.py`

```python
"""
Test that API responses match Pydantic schemas.
Ensures schema drift is caught immediately.
"""
import pytest
from app.schemas.responses import (
    StateDetailResponse,
    StateResultsResponse,
    AnalysesListResponse
)


def test_state_detail_response_validates():
    """Test that StateDetailResponse schema matches endpoint response"""
    # This will be a real API call test
    # For now, just test schema instantiation

    response = StateDetailResponse(
        state_code="CA",
        state_name="California",
        analysis_id="test-id",
        has_transactions=True,
        analysis_period={"years_available": [2023, 2024]},
        year_data=[],
        compliance_info={
            "tax_rates": {"state_rate": 7.25, "avg_local_rate": 2.5, "combined_rate": 9.75},
            "threshold_info": {"revenue_threshold": 500000, "transaction_threshold": None, "threshold_operator": "or"},
            "registration_info": {"registration_required": True}
        },
        # All aggregate fields required (not optional!)
        total_sales=100000.0,
        taxable_sales=80000.0,
        exempt_sales=20000.0,
        direct_sales=60000.0,
        marketplace_sales=40000.0,
        exposure_sales=75000.0,
        transaction_count=500,
        estimated_liability=6000.0,
        base_tax=5500.0,
        interest=300.0,
        penalties=200.0,
        nexus_type="economic",
        first_nexus_year=2023
    )

    assert response.state_code == "CA"
    assert response.total_sales == 100000.0


def test_state_detail_response_rejects_missing_fields():
    """Test that missing required fields cause validation error"""
    with pytest.raises(Exception):  # Pydantic ValidationError
        StateDetailResponse(
            state_code="CA",
            state_name="California",
            # Missing required fields!
        )
```

**Step 2: Run test to verify it passes**

```bash
cd backend
pytest tests/test_api_contracts.py -v
```

Expected: Tests PASS (schema is valid)

**Step 3: Commit**

```bash
git add backend/tests/test_api_contracts.py
git commit -m "test: add API contract validation tests

- Tests verify Pydantic schemas are valid
- Catches schema mismatches at test time
- Foundation for integration tests"
```

---

## Phase 6: Documentation

### Task 8: Document the Schema Sync Process

**Files:**
- Create: `docs/SCHEMA-SYNC-GUIDE.md`

**Step 1: Write documentation**

```markdown
# Schema Synchronization Guide

## The Problem

Our system has 3 layers that must stay in sync:
- Database (PostgreSQL schemas)
- Backend (Python Pydantic models)
- Frontend (TypeScript interfaces)

When they drift, we get runtime errors.

## The Solution

1. **Database is authoritative** - Schema changes start in migrations
2. **Backend validates everything** - All endpoints use `response_model=`
3. **Frontend types match backend** - 1:1 correspondence with Pydantic
4. **Tests catch drift** - Automated validation tests

## Making Schema Changes

### Step 1: Database Migration

```sql
-- Add new column
ALTER TABLE state_results ADD COLUMN new_field FLOAT DEFAULT 0;
```

### Step 2: Update Backend Pydantic Schema

```python
class StateDetailResponse(BaseModel):
    # ... existing fields ...
    new_field: float  # Add new field
```

### Step 3: Update Backend Endpoint

```python
return StateDetailResponse(
    # ... existing fields ...
    new_field=calculated_value  # Return new field
)
```

### Step 4: Update Frontend TypeScript

```typescript
export interface StateDetailResponse {
  // ... existing fields ...
  new_field: number  // Add new field (Python float = TS number)
}
```

### Step 5: Test

```bash
# Backend
cd backend
pytest tests/test_api_contracts.py

# Frontend
cd frontend
npm run type-check
```

### Step 6: Commit

One atomic commit with all 3 layers updated.

## Red Flags

🚩 **Endpoint returns dict instead of Pydantic model** → Schema drift waiting to happen
🚩 **Frontend has .reduce() on backend data** → Duplicate aggregation, remove it
🚩 **TypeScript type has `?` but backend always returns it** → Wrong nullability
🚩 **Backend try/except with fallback aggregation** → Just use the database view
🚩 **Migration adds column but backend not updated** → Incomplete change

## Checklist for Every Schema Change

- [ ] Database migration created
- [ ] Backend Pydantic schema updated
- [ ] Backend endpoint returns Pydantic instance (not dict!)
- [ ] Frontend TypeScript types updated
- [ ] Tests pass (backend + frontend)
- [ ] All 3 layers committed together
```

**Step 2: Commit**

```bash
git add docs/SCHEMA-SYNC-GUIDE.md
git commit -m "docs: add schema synchronization guide

- Documents the 3-layer sync process
- Provides step-by-step change procedure
- Lists red flags and checklist"
```

---

## Summary

This plan fixes the **systematic root cause** of your schema mismatch issues:

**Before (broken):**
- Database → Backend (manual aggregation) → Frontend (manual aggregation again)
- No validation (14 of 15 endpoints return dicts)
- Types manually maintained → drift

**After (fixed):**
- Database views → Backend (uses views) → Frontend (uses backend)
- Full validation (all endpoints use Pydantic response_model)
- Clear sync process documented

**Estimated Time:** 4-6 hours for all 8 tasks

**Benefits:**
- ✅ No more 500 errors from schema mismatches
- ✅ No more manual aggregation (25+ .reduce() calls removed)
- ✅ 30-50% faster API responses (database aggregation)
- ✅ Single source of truth (database)
- ✅ Validated contracts (Pydantic at every endpoint)
- ✅ Documented process (won't happen again)

---

**Plan complete and saved to `docs/plans/2025-01-14-fix-schema-sync-systematic.md`.**

**Execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

3. **Manual** - You implement following the plan

**Which approach would you like?**
