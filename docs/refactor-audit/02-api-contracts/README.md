# API Contracts Audit

**File**: `backend/app/api/v1/analyses.py`
**Size**: 1,830 lines
**Endpoints**: 15 total
**Complexity**: 🔴 High (God Object)
**Last Updated**: 2025-01-14

---

## Overview

This file contains ALL API endpoints for the SALT Tax Tool. It's a classic **God Object anti-pattern** - one file doing everything from CRUD operations to complex calculations to data transformations.

**What this file does**:
- Analysis CRUD (create, read, update, delete)
- CSV file upload and parsing
- Column detection and mapping
- Data normalization and validation
- Nexus calculation orchestration
- Results aggregation and formatting

**What this file SHOULD do**: Just route requests to appropriate services.

---

## Endpoint Inventory

### 1. Analysis CRUD Operations

#### `GET /analyses`
**Purpose**: List all analyses for current user with pagination and filtering

**Request Parameters**:
```typescript
{
  limit?: number = 50      // Max results (default 50)
  offset?: number = 0      // Pagination offset
  search?: string          // Search by company name (ILIKE)
  status_filter?: string   // Filter by status
}
```

**Response**:
```typescript
{
  total_count: number,
  limit: number,
  offset: number,
  analyses: Analysis[]  // Array of analysis records
}
```

**Status Codes**:
- 200: Success
- 500: Database error

**Issues**:
- ⚠️ No Pydantic response model (returns raw dict)
- ⚠️ Status filter accepts ANY string (not validated against enum)
- ⚠️ No max limit enforcement (user could request 1 million records)

---

#### `GET /analyses/{analysis_id}`
**Purpose**: Get single analysis with computed stats

**Response**:
```typescript
Analysis & {
  total_transactions: number,  // Computed: count of transactions
  unique_states: number        // Computed: distinct states
}
```

**Status Codes**:
- 200: Success
- 404: Analysis not found or doesn't belong to user
- 500: Database error

**Issues**:
- ⚠️ Makes 2 database queries (could be optimized with JOIN)
- ⚠️ No Pydantic response model
- ✅ Good: Properly checks ownership (user_id match)

---

#### `POST /analyses`
**Purpose**: Create new analysis project

**Request Body** (Pydantic validated):
```typescript
{
  company_name: string,           // 1-200 chars, required
  period_start?: date,            // Optional (auto-detected from CSV)
  period_end?: date,              // Optional (auto-detected from CSV)
  business_type: "product_sales" | "digital_products" | "mixed",
  retention_period: "delete_immediate" | "90_days" | "1_year",
  known_registrations?: Array<{
    state_code: string,
    registration_date: date,
    permit_number?: string
  }>,
  notes?: string
}
```

**Response**:
```typescript
{
  id: string,              // UUID
  status: "setup",
  message: "Analysis created successfully"
}
```

**Status Codes**:
- 200: Success
- 400: Validation error (e.g., period_end before period_start)
- 500: Database error

**Issues**:
- ⚠️ Response says `status: "setup"` but database has `status: "draft"` (inconsistency!)
- ⚠️ TODO comment at line 187: "Insert known registrations when physical_nexus table schema is finalized"
- ⚠️ Creates placeholder user record if doesn't exist (`{user_id}@temp.com`) - hack for FK constraint
- ✅ Good: Uses Pydantic schema for validation

---

#### `PATCH /analyses/{analysis_id}`
**Purpose**: Update analysis metadata

**Status**: ⚠️ **NOT IMPLEMENTED** (returns TODO message)

**Issues**:
- 🔴 Endpoint exists but does nothing
- 🔴 Frontend may be calling this expecting it to work

---

#### `DELETE /analyses/{analysis_id}`
**Purpose**: Soft delete analysis (sets `deleted_at`)

**Response**:
```typescript
{
  message: "Analysis deleted successfully",
  id: string,
  deleted_at: string  // ISO timestamp
}
```

**Status Codes**:
- 200: Success
- 404: Analysis not found or already deleted
- 500: Database error

**Issues**:
- ✅ Good: Soft delete (can be recovered)
- ✅ Good: Checks ownership
- ⚠️ Comment mentions "Hard deletion happens after 30 days via scheduled job" - is this job implemented?

---

### 2. Data Upload & Processing

#### `POST /analyses/{analysis_id}/upload`
**Purpose**: Upload CSV/Excel file, auto-detect columns, store raw file

**Request**: Multipart form data with file

**Accepts**:
- `.csv`, `.xlsx`, `.xls`
- Max size: 50 MB

**Response**:
```typescript
{
  message: string,
  analysis_id: string,
  auto_detected_mappings: {
    mappings: Record<string, string>,      // field_name -> source_column
    confidence: Record<string, number>,    // 0.0 to 1.0
    samples: Record<string, string[]>,     // Sample values
    summary: {
      total_rows: number,
      unique_states: number,
      date_range: {
        start: string,
        end: string
      }
    },
    required_detected: Record<string, string>,  // Required columns found
    optional_detected: Record<string, string>   // Optional columns found
  },
  all_required_detected: boolean,
  optional_columns_found: number,
  columns_detected: string[],  // All column names
  date_range_detected?: {
    start: string,
    end: string,
    auto_populated: boolean  // Did we update analysis table?
  }
}
```

**Status Codes**:
- 200: Success
- 400: Invalid file type, file too large, or parse error
- 404: Analysis not found
- 500: Storage error or processing error

**What This Endpoint Does** (lines 271-474):
1. Validates file type and size
2. Parses CSV/Excel into DataFrame
3. Runs column detection (`ColumnDetector`)
4. Stores raw file in Supabase Storage (`analysis-uploads` bucket)
5. Auto-detects date range and updates `analyses` table if dates not set
6. Returns column mappings and preview data

**Issues**:
- 🟡 Very long method (200+ lines) - should be split
- ⚠️ Storage path is hard-coded: `uploads/{user_id}/{analysis_id}/raw_data.csv`
- ⚠️ If storage upload fails, it's now a critical error (good) but error message mentions checking bucket exists
- ⚠️ Auto-populates date range silently - could surprise users
- ✅ Good: Try/except to remove old file before upload (handles re-uploads)

---

#### `POST /analyses/{analysis_id}/preview-normalization`
**Purpose**: Preview what data will look like after normalization

**Request Body**:
```typescript
{
  column_mappings: {
    transaction_date: { source_column: string },
    customer_state: { source_column: string },
    revenue_amount: { source_column: string },
    sales_channel: { source_column: string },
    revenue_stream?: { source_column: string },
    is_taxable?: { source_column: string },
    exempt_amount?: { source_column: string }
  }
}
```

**Response**:
```typescript
{
  preview_data: Array<Record<string, any>>,  // First 10 rows
  transformations: string[],                 // List of transformations applied
  validation: {
    valid: boolean,
    errors: Array<{
      row: number,
      column: string,
      value: any,
      message: string
    }>,
    warnings: Array<{...}>,
    valid_rows: number
  },
  warnings: string[],
  summary: {
    total_rows: number,
    valid_rows: number,
    invalid_rows: number,
    columns_mapped: number,
    preview_rows_shown: number
  }
}
```

**Status Codes**:
- 200: Success
- 404: Analysis or raw data file not found
- 500: Processing error

**What This Endpoint Does** (lines 477-589):
1. Downloads raw CSV from storage
2. Applies column mappings
3. Runs normalization (dates, states, channels, exempt sales)
4. Validates normalized data
5. Returns preview + validation results

**Issues**:
- ⚠️ Loads entire file into memory (could be 1M rows)
- ⚠️ No caching (re-downloads file every preview)
- ✅ Good: Shows user exactly what will be saved

---

#### `POST /analyses/{analysis_id}/validate-and-save`
**Purpose**: Apply mappings, normalize data, validate, and save to database

**Request Body**: Same as `/preview-normalization`

**Response**:
```typescript
{
  message: "Mappings validated and data saved successfully",
  transactions_saved: number
}
```

**Status Codes**:
- 200: Success
- 400: Validation failed or no valid transactions
- 404: Analysis or raw data file not found
- 500: Database insert error

**What This Endpoint Does** (lines 592-736):
1. Downloads raw CSV from storage
2. Validates required mappings exist
3. Applies normalization
4. Validates normalized data (returns 400 if errors)
5. Removes rows with null required fields
6. Inserts transactions in batches of 1,000
7. Updates analysis status to "processing"

**Issues**:
- ⚠️ Loads entire file into memory
- ⚠️ No progress updates for large files
- ⚠️ If insert fails mid-batch, partial data could be saved (no transaction rollback)
- ⚠️ Updates status to "processing" but should it be "ready" or "complete"?
- ✅ Good: Batched inserts (1,000 rows at a time)

---

### 3. Column Mapping

#### `GET /analyses/{analysis_id}/columns`
**Purpose**: Get column info and samples for mapping UI

**Response**:
```typescript
{
  columns: Array<{
    name: string,
    sample_values: string[],  // Up to 10 unique values
    data_type: "string" | "date" | "number"
  }>,
  summary: {
    total_rows: number,
    estimated_time: string,  // e.g., "30-45 seconds"
    date_range?: {
      start: string,
      end: string
    },
    unique_states?: number
  }
}
```

**Status Codes**:
- 200: Success
- 400: No transaction data found
- 404: Analysis not found
- 500: Processing error

**What This Endpoint Does** (lines 739-854):
1. Tries to load from stored CSV (new workflow)
2. Falls back to `sales_transactions` table (old workflow)
3. Analyzes columns to infer types
4. Returns sample values for each column
5. Uses `ColumnDetector` to enhance summary

**Issues**:
- ⚠️ Dual workflow (new vs old) adds complexity
- ⚠️ Data type inference is simplistic (only checks column name)
- ⚠️ `estimated_time` formula is arbitrary: `max(30, min(120, total_rows // 100))`

---

#### `POST /analyses/{analysis_id}/validate`
**Purpose**: Validate transaction data with column mappings

**Status**: ⚠️ **DEPRECATED** (replaced by `/validate-and-save`)

**Issues**:
- 🔴 This endpoint validates data from `sales_transactions` table (old workflow)
- 🔴 New workflow validates BEFORE saving to database
- 🔴 Endpoint should probably be removed or marked deprecated

---

### 4. Calculation

#### `POST /analyses/{analysis_id}/calculate`
**Purpose**: Run nexus calculation engine

**Response**:
```typescript
{
  message: "Nexus calculation completed successfully",
  analysis_id: string,
  summary: {
    // Result from NexusCalculatorV2.calculate_nexus_for_analysis()
    // Shape is not well-documented
  }
}
```

**Status Codes**:
- 200: Success
- 400: No transaction data found
- 404: Analysis not found
- 500: Calculation error (also sets analysis.status = "error")

**What This Endpoint Does** (lines 1040-1108):
1. Verifies analysis exists
2. Checks that transactions exist
3. Initializes `NexusCalculatorV2`
4. Calls `calculate_nexus_for_analysis()`
5. Returns summary (shape undefined)
6. On error: updates analysis status to "error"

**Issues**:
- 🔴 No Pydantic response model for `summary` - shape is unknown
- 🔴 Frontend doesn't know what fields to expect
- ⚠️ Calculation could take minutes - should this be async with polling?
- ✅ Good: Error handling updates analysis status

---

#### `POST /analyses/{analysis_id}/recalculate`
**Purpose**: Re-run calculation after config changes (e.g., physical nexus added)

**Response**: Same as `/calculate` but includes `states_updated` count

**Status Codes**: Same as `/calculate`

**Issues**:
- ⚠️ Identical logic to `/calculate` - should they be the same endpoint?
- ⚠️ When should users use `/calculate` vs `/recalculate`?
- ⚠️ No way to track if recalculation is needed (stale results)

---

### 5. Results

#### `GET /analyses/{analysis_id}/results/summary`
**Purpose**: Get high-level summary for dashboard

**Response**:
```typescript
{
  analysis_id: string,
  company_name: string,
  period_start: string,
  period_end: string,
  status: string,
  completed_at: string,
  summary: {
    total_states_analyzed: number,
    states_with_nexus: number,
    states_approaching_threshold: number,  // TODO: Always 0
    states_no_nexus: number,
    total_estimated_liability: number,
    total_revenue: number,
    confidence_level: "high",  // Hard-coded
    manual_review_required: 0  // Hard-coded
  },
  nexus_breakdown: {
    physical_nexus: number,
    economic_nexus: number,
    no_nexus: number,
    both: number
  },
  top_states_by_liability: Array<{
    state: string,
    state_name: string,
    estimated_liability: number,
    total_sales: number,
    nexus_type: string
  }>,
  approaching_threshold: []  // TODO: Always empty
}
```

**Status Codes**:
- 200: Success
- 400: No results found (calculation not run)
- 404: Analysis not found
- 500: Database error

**What This Endpoint Does** (lines 1196-1336):
1. Fetches all `state_results` for analysis
2. Groups by state (multi-year support)
3. Aggregates across years
4. Determines nexus status per state
5. Calculates summary statistics
6. Returns top 5 states by liability

**Issues**:
- 🔴 TODO at line 1312: `states_approaching_threshold: 0  // TODO: Calculate`
- 🔴 TODO at line 1326: `approaching_threshold: []  // TODO: Calculate`
- ⚠️ Hard-coded `confidence_level: "high"` and `manual_review_required: 0`
- ⚠️ Complex aggregation logic (60+ lines) - should be in service layer
- ⚠️ Loads all state results into memory (could be 51 states × 5 years = 255 rows)

---

#### `GET /analyses/{analysis_id}/results/states`
**Purpose**: Get complete state-by-state results for table display

**Response**:
```typescript
{
  analysis_id: string,
  total_states: number,
  states: Array<{
    state_code: string,
    state_name: string,
    nexus_status: "has_nexus" | "approaching" | "no_nexus",
    nexus_type: "economic" | "physical" | "both" | "none",
    total_sales: number,        // Aggregated across all years
    exempt_sales: number,
    taxable_sales: number,
    direct_sales: number,
    marketplace_sales: number,
    threshold: number,
    threshold_percent: number,
    estimated_liability: number,
    confidence_level: "high",   // Hard-coded
    registration_status: "registered" | "not_registered",
    year_data: Array<{
      year: number,
      nexus_type: string,
      nexus_date: string,
      obligation_start_date: string,
      first_nexus_year: number,
      total_sales: number,
      exempt_sales: number,
      taxable_sales: number,
      exposure_sales: number,
      direct_sales: number,
      marketplace_sales: number,
      estimated_liability: number,
      base_tax: number
    }>
  }>
}
```

**Status Codes**:
- 200: Success
- 404: Analysis not found or no results
- 500: Database error

**What This Endpoint Does** (lines 1339-1500):
1. Fetches `state_results` for analysis
2. Fetches state names from `states` table
3. Checks physical nexus from `physical_nexus` table
4. Groups results by state
5. Aggregates totals across years
6. Builds `year_data` array for each state
7. Returns all states

**Issues**:
- ⚠️ Returns ALL states (could be 51 × many fields) - should support pagination
- ⚠️ Complex aggregation logic (150+ lines) in API layer
- ⚠️ Hard-coded `confidence_level: "high"`
- ⚠️ Makes 3 separate database queries (could be optimized)
- ✅ Good: Groups by state for multi-year support
- ✅ Good: Includes year-by-year breakdown

---

#### `GET /analyses/{analysis_id}/states/{state_code}`
**Purpose**: Get detailed analysis for specific state

**Response**: See `StateDetailResponse` type in `frontend/lib/api.ts`

**Response Structure**:
```typescript
{
  state_code: string,
  state_name: string,
  analysis_id: string,
  has_transactions: boolean,
  analysis_period: {
    years_available: number[]
  },
  year_data: Array<{
    year: number,
    nexus_status: string,
    nexus_type: string,
    summary: {
      total_sales: number,
      transaction_count: number,
      direct_sales: number,
      marketplace_sales: number,
      taxable_sales: number,
      exposure_sales: number,
      estimated_liability: number,
      base_tax: number,
      interest: number,
      penalties: number,
      interest_rate: number,     // Converted to percentage
      interest_method: string,
      days_outstanding: number,
      penalty_rate: number       // Converted to percentage
    },
    threshold_info: {
      revenue_threshold: number,
      transaction_threshold: number,
      threshold_operator: string,
      percentage_of_threshold: number,
      amount_until_nexus: number,
      amount_over_nexus: number,
      approaching: boolean
    },
    monthly_sales: Array<{
      month: string,
      sales: number,
      transaction_count: number
    }>,
    transactions: Array<{
      transaction_id: string,
      transaction_date: string,
      sales_amount: number,
      taxable_amount: number,
      exempt_amount: number,
      is_taxable: boolean,
      sales_channel: string,
      running_total: number
    }>
  }>,
  compliance_info: {
    tax_rates: {
      state_rate: number,      // Converted to percentage
      avg_local_rate: number,
      combined_rate: number
    },
    threshold_info: {...},
    registration_info: {
      registration_fee: number,
      filing_frequencies: string[],
      registration_url: string,
      dor_website: string
    }
  },
  // Aggregate totals
  total_sales: number,
  taxable_sales: number,
  exempt_sales: number,
  estimated_liability: number,
  nexus_type: string,
  first_nexus_year: number
}
```

**Status Codes**:
- 200: Success
- 404: Analysis or state not found
- 500: Database error

**What This Endpoint Does** (lines 1503-1830):
1. Verifies analysis ownership
2. Fetches state metadata (name, URLs)
3. Fetches `state_results` for state
4. Fetches all transactions for state
5. Builds year-by-year data with:
   - Running total calculations
   - Monthly aggregates
   - Transaction lists
   - Threshold metrics
6. Fetches compliance info (tax rates, thresholds)
7. Calculates aggregate totals across years
8. Returns comprehensive state detail

**Issues**:
- 🔴 **EXTREMELY COMPLEX** (330+ lines of aggregation logic)
- 🔴 Loads all transactions for state into memory (could be thousands)
- 🔴 Recalculates aggregates that backend already calculated
- 🔴 Frontend sometimes re-aggregates this data AGAIN (triple aggregation!)
- ⚠️ Debug logging still present (lines 1560-1562, 1798-1802)
- ⚠️ Makes 5 separate database queries
- ⚠️ No pagination for transactions list
- ⚠️ Tax rates converted from decimal to percentage (0.0825 → 8.25) - could be done in frontend
- ✅ Good: Handles "no transactions" case
- ✅ Good: Includes compliance information

**This is the WORST offender** - 330 lines of business logic in an API endpoint!

---

## Type System Analysis

### Python → TypeScript Mismatches

**Missing Pydantic Response Models**:
- ❌ `GET /analyses` response
- ❌ `GET /analyses/{id}` response
- ❌ `POST /analyses/{id}/upload` response
- ❌ `POST /analyses/{id}/preview-normalization` response
- ❌ `POST /analyses/{id}/validate-and-save` response
- ❌ `GET /analyses/{id}/columns` response
- ❌ `POST /analyses/{id}/calculate` response
- ❌ `GET /analyses/{id}/results/summary` response
- ❌ `GET /analyses/{id}/results/states` response
- ❌ `GET /analyses/{id}/states/{state_code}` response

**Only 1 endpoint uses Pydantic for response**: None! All return raw dicts.

**Request validation**:
- ✅ `POST /analyses` - Uses `AnalysisCreate` schema
- ❌ All others - Accept raw `dict`

### Frontend Types

**TypeScript definitions exist for**:
- `StateDetailResponse` (frontend/lib/api.ts)
- `YearData`
- `ComplianceInfo`

**But these are MANUALLY maintained** - no guarantee they match backend!

**Known mismatches** (recently fixed):
- `StateResult` was missing `exempt_sales`, `taxable_sales`
- `StateDetailResponse` was missing aggregate fields

**Likely mismatches** (not yet discovered):
- Upload response structure
- Column detection response
- Validation response
- Summary response

---

## God Object Analysis

### Why `analyses.py` is a God Object

**Lines of Code**: 1,830 lines in one file

**Responsibilities** (violates Single Responsibility Principle):
1. **Request routing** (what APIs should do)
2. **Business logic** (belongs in services)
3. **Data aggregation** (belongs in services or database views)
4. **File I/O** (belongs in storage service)
5. **Data transformation** (belongs in services)
6. **Database queries** (belongs in repository layer)
7. **Validation** (partially in schemas, partially inline)
8. **Error handling** (scattered throughout)

**Longest Methods**:
1. `get_state_detail()` - 330 lines 🔴
2. `get_state_results()` - 160 lines 🔴
3. `upload_transactions()` - 200 lines 🔴
4. `get_results_summary()` - 140 lines 🔴
5. `validate_and_save_mappings()` - 140 lines 🔴

**Average method length**: 122 lines (should be <30)

---

## Critical Issues Summary

### 🔴 Critical

1. **No Pydantic Response Models**
   - Frontend has no contract guarantees
   - Runtime errors when backend changes
   - No auto-generated API docs

2. **God Object Anti-Pattern**
   - 1,830 lines in one file
   - Impossible to test in isolation
   - Hard to modify without breaking things

3. **Business Logic in API Layer**
   - 330 lines of aggregation in `get_state_detail()`
   - Should be in service layer
   - Can't reuse logic elsewhere

4. **Duplicate Data Aggregation**
   - Backend calculates totals
   - API layer re-aggregates
   - Frontend sometimes aggregates again
   - Three sources of truth!

5. **TODOs in Production**
   - Line 187: Known registrations not implemented
   - Line 213: Update endpoint not implemented
   - Line 1312: `states_approaching_threshold` always 0
   - Line 1326: `approaching_threshold` always empty array

6. **No Async/Background Jobs**
   - Calculation could take minutes
   - User waits with no feedback
   - Should use Celery or similar

### 🟡 Important

7. **Memory Issues**
   - Loads entire CSV into memory
   - Loads all transactions for state
   - No pagination on large lists

8. **Error Handling Inconsistent**
   - Some endpoints return 400, some 500
   - Error messages vary in detail
   - No standard error response format

9. **No API Versioning Strategy**
   - All endpoints are `/v1/`
   - No plan for breaking changes
   - How to migrate to v2?

10. **Security Concerns**
    - File upload validation is basic
    - No rate limiting
    - No file type verification beyond extension
    - CSV parsing could crash on malicious input

### 🟢 Nice to Have

11. **No OpenAPI Documentation**
    - API is not self-documenting
    - Frontend devs guess response structure
    - No automatic client generation

12. **Debug Logging Still Present**
    - Lines 1560-1562: `[STATE DETAIL API]` logs
    - Lines 1798-1802: Debug logs
    - Should be removed or use proper log levels

13. **Hard-Coded Values**
    - `confidence_level: "high"` everywhere
    - `manual_review_required: 0`
    - `estimated_time` formula is arbitrary

---

## Data Flow Issues

### The Triple Aggregation Problem

**Example: Total sales for a state**

1. **Database**: `sales_transactions` table has raw transactions
2. **NexusCalculatorV2**: Calculates `total_sales` and saves to `state_results`
3. **API `/states/{state_code}`**: Re-aggregates from `state_results` to build response
4. **Frontend**: Sometimes re-aggregates from `year_data` array

**Why this is bad**:
- Wasted computation (doing same math 3 times)
- Risk of inconsistency (rounding errors, different logic)
- Hard to debug ("which total is correct?")

**Solution**: Single source of truth in database, API just returns it.

---

## Recommendations

### Phase 1: Emergency Fixes (1-2 days)

1. **Add Pydantic Response Models**
   - Create schemas for ALL responses
   - Use `response_model` parameter in FastAPI
   - Generate TypeScript types from Pydantic

2. **Document TODOs**
   - Create tickets for each TODO
   - Add comments explaining workarounds
   - Communicate to frontend what's not implemented

3. **Remove Duplicate Aggregation**
   - Trust `state_results` table values
   - Stop re-calculating in API layer
   - Frontend should NEVER aggregate backend data

### Phase 2: Refactor Structure (1 week)

4. **Split God Object**
   ```python
   # NEW structure
   api/v1/
     analyses/
       __init__.py          # Router registration
       crud.py              # CRUD endpoints only
       uploads.py           # File upload endpoints
       calculations.py      # Calculation endpoints
       results.py           # Results endpoints

   services/
     analysis_service.py     # Business logic
     upload_service.py       # File handling
     results_service.py      # Data aggregation

   repositories/
     analysis_repository.py  # Database queries
   ```

5. **Create Service Layer**
   - Move all business logic to services
   - API endpoints become thin routers
   - Services handle orchestration

6. **Create Repository Layer**
   - All database queries in repositories
   - Services call repositories
   - Makes testing easier

### Phase 3: Improve Reliability (3-5 days)

7. **Add Background Jobs**
   - Use Celery or FastAPI BackgroundTasks
   - Calculation runs async
   - Poll for completion

8. **Add Pagination**
   - State results should paginate
   - Transaction lists should paginate
   - Add `limit` and `offset` to all list endpoints

9. **Standardize Error Responses**
   - Create error response schema
   - Use consistent status codes
   - Include error codes for frontend handling

### Phase 4: Type Safety (2-3 days)

10. **Auto-Generate TypeScript Types**
    - Use tool like `datamodel-codegen` or `fastapi-code-generator`
    - Generate types from Pydantic models
    - Add to build process

11. **API Contract Tests**
    - Test that responses match schemas
    - Test that frontend types match backend
    - Fail build on mismatch

### Phase 5: Documentation (1-2 days)

12. **Enable OpenAPI Docs**
    - FastAPI auto-generates at `/docs`
    - Add descriptions to all endpoints
    - Add examples to schemas

13. **Create API Changelog**
    - Document all changes
    - Track breaking changes
    - Plan migration path to v2

---

## Migration Strategy

### How to Refactor Without Breaking Production

**Step 1: Add Response Models (No Breaking Changes)**
- Add Pydantic response models to all endpoints
- Use `response_model` parameter
- Existing responses still work
- Now we have validation

**Step 2: Create Service Layer (No Breaking Changes)**
- Create new service classes
- Move logic from API to services
- API calls services, returns same data
- Endpoints still work identically

**Step 3: Create Repository Layer (No Breaking Changes)**
- Extract database queries to repositories
- Services call repositories
- API still returns same data

**Step 4: Fix Data Aggregation (Breaking Change - Coordinate with Frontend)**
- Remove duplicate aggregation from API
- Trust database values
- Frontend must be updated to use correct fields
- Deploy backend + frontend together

**Step 5: Background Jobs (Breaking Change - New Flow)**
- Calculation becomes async
- Add polling endpoint
- Frontend must be updated to poll
- Keep synchronous endpoint for backward compatibility

---

## Testing Strategy

### What Should Be Tested

**Unit Tests** (for services):
- Data aggregation logic
- Business rule validation
- Error handling

**Integration Tests** (for API):
- All endpoints return expected structure
- Auth works correctly
- Ownership checks work
- Error responses are correct

**Contract Tests** (for types):
- Response matches Pydantic model
- Frontend TypeScript types match backend
- No extra/missing fields

**End-to-End Tests**:
- Upload → Normalize → Save → Calculate → View Results
- Full user workflow

---

## Metrics

- **Total Lines**: 1,830
- **Endpoints**: 15
- **Average Lines/Endpoint**: 122
- **Longest Endpoint**: 330 lines (`get_state_detail`)
- **Database Queries**: ~25 total across all endpoints
- **TODO Count**: 4
- **Debug Logs**: 8 statements
- **Pydantic Request Models**: 1 (only `AnalysisCreate`)
- **Pydantic Response Models**: 0 ⚠️
- **Test Coverage**: Unknown (likely 0%)

---

## Dependencies

### Internal
- `NexusCalculatorV2` - Core calculation engine
- `ColumnDetector` - CSV column detection
- `supabase_client` - Database access
- `require_auth` - Authentication middleware

### External
- `fastapi` - Web framework
- `pandas` - Data processing
- `pydantic` - Request validation (response validation missing!)

### Database Tables Accessed
- `analyses`
- `sales_transactions`
- `state_results`
- `states`
- `physical_nexus`
- `economic_nexus_thresholds`
- `tax_rates`
- `users`

### Storage
- Supabase Storage bucket: `analysis-uploads`
- Path pattern: `uploads/{user_id}/{analysis_id}/raw_data.csv`

---

## Next Steps

1. ✅ Complete this audit
2. ⏸️ Create Pydantic response models for all endpoints
3. ⏸️ Extract business logic to service layer
4. ⏸️ Create repository layer for database access
5. ⏸️ Add unit tests for services
6. ⏸️ Generate TypeScript types from Pydantic models

---

*Continue to: `03-data-models/` audit*
