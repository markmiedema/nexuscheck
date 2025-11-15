# High-Level System Overview

**Date**: 2025-01-14
**Purpose**: Map the system architecture, data flow, and identify structural concerns

---

## System Architecture

### Technology Stack
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **State Management**: React hooks (no global state manager)

### Backend Structure (Python FastAPI)

```
backend/app/
├── api/v1/
│   ├── analyses.py (1,830 lines) ⚠️ LARGE FILE
│   ├── physical_nexus.py
│   └── vda.py
├── services/
│   ├── nexus_calculator_v2.py (1,168 lines) ⚠️ COMPLEX
│   ├── column_detector.py (712 lines)
│   ├── interest_calculator.py
│   └── vda_calculator.py
├── schemas/
│   ├── analysis.py
│   └── physical_nexus.py
└── core/
    ├── auth.py
    └── supabase.py
```

**Key Observations:**
- ⚠️ **`analyses.py` is 1,830 lines** - likely doing too much (God Object anti-pattern)
- ⚠️ **No models layer** - Using Supabase directly (ORM-less)
- ✅ Services are separated (good separation of concerns)
- ⚠️ Schemas exist but may not match TypeScript types

### API Endpoints (15 total)

**Analysis Management** (CRUD):
1. `GET /analyses` - List all analyses
2. `GET /analyses/{id}` - Get single analysis
3. `POST /analyses` - Create new analysis
4. `PATCH /analyses/{id}` - Update analysis
5. `DELETE /analyses/{id}` - Delete analysis

**Data Upload & Processing**:
6. `POST /analyses/{id}/upload` - Upload CSV file
7. `POST /analyses/{id}/preview-normalization` - Preview data transformation
8. `POST /analyses/{id}/validate-and-save` - Save normalized data

**Column Mapping**:
9. `GET /analyses/{id}/columns` - Get detected columns
10. `POST /analyses/{id}/validate` - Validate column mapping

**Calculation**:
11. `POST /analyses/{id}/calculate` - Run nexus calculation
12. `POST /analyses/{id}/recalculate` - Re-run calculation

**Results**:
13. `GET /analyses/{id}/results/summary` - Get summary results
14. `GET /analyses/{id}/results/states` - Get all states results
15. `GET /analyses/{id}/states/{state_code}` - Get single state detail

### Frontend Structure

```
frontend/
├── app/ (Next.js 14 App Router)
│   ├── analysis/[id]/
│   │   ├── results/page.tsx
│   │   ├── states/[stateCode]/page.tsx
│   │   └── ...
│   └── ...
├── components/
│   ├── analysis/
│   │   ├── StateTable.tsx
│   │   ├── StateQuickViewModal.tsx
│   │   └── ...
│   └── ui/ (shadcn components)
├── lib/
│   ├── api.ts (API client + types)
│   └── api/client.ts
└── types/
    └── states.ts
```

---

## Data Flow Analysis

### Upload & Processing Flow
```
1. User uploads CSV
   ↓
2. POST /analyses/{id}/upload
   ↓
3. column_detector.py analyzes CSV
   ↓
4. Frontend shows column mapping UI
   ↓
5. POST /analyses/{id}/validate-and-save
   ↓
6. Data saved to sales_transactions table
```

### Calculation Flow
```
1. User clicks "Calculate"
   ↓
2. POST /analyses/{id}/calculate
   ↓
3. nexus_calculator_v2.py runs
   ↓
4. Results saved to state_results table
   ↓
5. Frontend fetches GET /analyses/{id}/results/states
   ↓
6. StateTable displays results
```

### State Detail Flow
```
1. User clicks state row
   ↓
2. StateQuickViewModal opens
   ↓
3. GET /analyses/{id}/states/{state_code}
   ↓
4. Backend aggregates from state_results + sales_transactions
   ↓
5. Frontend displays (sometimes re-aggregates!) ⚠️
```

**🚨 CRITICAL ISSUE IDENTIFIED**: Frontend is manually re-aggregating data that backend already calculated!

---

## Database Schema (Inferred from Code)

### Core Tables
1. **`analyses`** - Analysis metadata (user_id, name, date_range, etc.)
2. **`sales_transactions`** - Individual transactions (raw upload data)
3. **`state_results`** - Calculated nexus results per state per year
4. **`states`** - State reference data (thresholds, tax rates, rules)
5. **`physical_nexus_config`** - User-defined physical nexus
6. **`users`** - User accounts (via Supabase Auth)

**Missing Documentation**:
- ❌ No ER diagram
- ❌ No schema documentation
- ❌ Column definitions unclear

---

## Type System Analysis

### Backend Types (Python)
- Uses Pydantic schemas in `backend/app/schemas/`
- Type hints in function signatures
- No central type definitions

### Frontend Types (TypeScript)
- Types defined in `frontend/lib/api.ts` and `frontend/types/`
- **🚨 CRITICAL**: Frontend types don't match backend responses!

**Known Mismatches Discovered**:
1. `StateResult` missing `exempt_sales`, `taxable_sales` (fixed in recent work)
2. `StateDetailResponse` missing aggregate fields (fixed in recent work)
3. Pre-existing TypeScript errors indicate more mismatches exist

---

## Business Logic Distribution

### Where Logic Lives:

**Nexus Determination** (Backend Only - Good ✅):
- `nexus_calculator_v2.py` - All nexus calculation logic
- Handles: threshold crossing, lookback periods, sticky nexus, physical vs economic

**Data Aggregation** (Mixed - Bad ⚠️):
- Backend calculates: total_sales, taxable_sales, exempt_sales, liability
- **But**: Frontend ALSO aggregates manually using `.reduce()` in many places
- **Result**: Duplicate logic, potential for mismatches

**UI Logic** (Frontend - Good ✅):
- State grouping (Has Nexus, Approaching, etc.)
- Filtering, sorting, display
- Dark mode, theming

**🎯 RECOMMENDATION**: Move ALL aggregation to backend, frontend should only display

---

## Identified Issues (High-Level)

### 🔴 Critical
1. **Frontend re-aggregating backend data** - Violates single source of truth
2. **Type mismatches between frontend/backend** - Runtime errors waiting to happen
3. **`analyses.py` is 1,830 lines** - Needs to be split up
4. **No API contract documentation** - What fields are guaranteed?

### 🟡 Important
5. **No database schema documentation** - Hard to understand data model
6. **Complex business logic in one file** - `nexus_calculator_v2.py` is 1,168 lines
7. **No clear separation of concerns** - API file doing business logic
8. **Frontend trying to explain backend decisions** - "Why This Determination" issue

### 🟢 Nice to Have
9. **No unit tests for business logic** - Nexus calculation should be tested
10. **No API versioning strategy** - All endpoints are `/v1/` but no plan for v2
11. **No error handling standards** - Inconsistent error responses

---

## Architectural Patterns Observed

### Good Patterns ✅
- Service layer separated from API layer
- Async/await used properly
- Supabase client abstraction
- Frontend component composition

### Anti-Patterns ⚠️
- **God Object**: `analyses.py` doing too much
- **Shotgun Surgery**: Changing one thing requires changes in many files
- **Leaky Abstraction**: Frontend knows about backend calculation details
- **Duplicate Logic**: Aggregation in both frontend and backend

---

## Performance Concerns

### Potential Bottlenecks
1. **N+1 queries**: State detail endpoint may be doing multiple DB queries per state
2. **Large API responses**: Returning all transactions for a state (could be thousands)
3. **Frontend re-calculations**: Manual aggregation on every render

### Optimization Opportunities
- Add caching layer (Redis)
- Paginate transaction lists
- Pre-calculate common aggregations
- Use database views for complex queries

---

## Security Observations

### Good ✅
- Auth middleware (`require_auth`)
- User ownership verification on all endpoints
- Supabase RLS (Row Level Security) likely enabled

### Needs Review ⚠️
- SQL injection risk (if any raw SQL)
- File upload validation (CSV parsing)
- Rate limiting?
- Input sanitization

---

## Next Steps

This overview has identified several areas for deep-dive audits:

1. **Priority 1**: `nexus-calculation/` - Core business logic (1,168 lines to review)
2. **Priority 2**: `api-contracts/` - Document what each endpoint returns
3. **Priority 3**: `data-models/` - Map database schema and relationships
4. **Priority 4**: `frontend-backend-sync/` - Find all manual aggregations
5. **Priority 5**: `type-system/` - Align TypeScript with Python types
6. **Priority 6**: `business-rules/` - Document SALT tax rules implemented

Each area will get its own folder with detailed findings.

---

## Metrics Summary

- **Backend Files**: 17 Python files (excluding venv)
- **API Endpoints**: 15 endpoints in analyses.py
- **Largest File**: analyses.py (1,830 lines) ⚠️
- **Most Complex Service**: nexus_calculator_v2.py (1,168 lines)
- **TypeScript Errors**: 12+ pre-existing errors
- **Estimated Technical Debt**: Medium-High

---

*Next: Deep dive into nexus calculation subsystem*
