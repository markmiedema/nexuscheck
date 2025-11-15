# Frontend-Backend Data Synchronization Audit

**Focus**: Identify where frontend duplicates backend calculations
**Impact**: 🔴 Critical - Violates single source of truth
**Last Updated**: 2025-01-14

---

## Overview

The SALT Tax Tool has a **critical architectural issue**: the frontend frequently re-aggregates data that the backend has already calculated and stored in the database. This creates:

- **Triple aggregation**: Database → Backend API → Frontend (all doing the same math)
- **Risk of inconsistency**: If rounding differs, totals won't match
- **Performance waste**: CPU cycles spent on duplicate calculations
- **Maintenance burden**: Same logic in 3 places
- **Trust issues**: Which number is "correct"?

---

## The Problem: Frontend Aggregation

### Pattern Found: Manual `.reduce()` on `year_data`

**Backend provides**:
```typescript
{
  total_sales: 150000,          // ✅ Already aggregated across all years
  taxable_sales: 120000,        // ✅ Already aggregated
  exempt_sales: 30000,          // ✅ Already aggregated
  estimated_liability: 9500,    // ✅ Already aggregated
  year_data: [
    { year: 2023, summary: { total_sales: 50000, ... } },
    { year: 2024, summary: { total_sales: 100000, ... } }
  ]
}
```

**Frontend does ANYWAY**:
```typescript
const totalSales = data.year_data.reduce((sum, yr) => sum + yr.summary.total_sales, 0)
// ❌ Ignores data.total_sales which is already correct!
```

**Why this is bad**:
1. Backend already did this calculation (in `state_results` table)
2. Backend API re-aggregated it again (in `get_state_detail` endpoint)
3. Frontend aggregates it a THIRD time
4. If any calculation differs (rounding, null handling), we have 3 different answers

---

## Instances of Frontend Aggregation

### 1. StateQuickViewModal.tsx

**File**: `frontend/components/analysis/StateQuickViewModal.tsx`

**Lines with Manual Aggregation**:
```typescript
// Line 124-125: Sales breakdown
const directSales = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
const marketplaceSales = data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)

// Line 128: Exposure sales
const exposureSales = data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0)

// Line 377: Taxable sales
{formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.taxable_sales || 0), 0))}

// Line 383: Transaction count
{data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0).toLocaleString()}

// Line 395: Direct sales (again!)
{formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0))}

// Line 399: Direct sales percentage
{((data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0) / data.total_sales) * 100).toFixed(0)}%

// Line 406: Marketplace sales (again!)
{formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0))}

// Line 410: Marketplace sales percentage
{((data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0) / data.total_sales) * 100).toFixed(0)}%

// Line 425: Exposure sales (again!)
{formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0))}

// Line 431: Base tax
{formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.base_tax || 0), 0))}

// Line 437: Interest
{formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.interest || 0), 0))}

// Line 443: Penalties
{formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.penalties || 0), 0))}
```

**What Backend Already Provides** (from `GET /analyses/{id}/states/{state_code}`):
```typescript
{
  total_sales: number,              // ✅ Line 1815
  taxable_sales: number,            // ✅ Line 1816
  exempt_sales: number,             // ✅ Line 1817
  estimated_liability: number,      // ✅ Line 1818
  // Missing aggregates that SHOULD be added:
  // direct_sales_total: number,      ❌ Not provided
  // marketplace_sales_total: number, ❌ Not provided
  // exposure_sales_total: number,    ❌ Not provided
  // transaction_count_total: number, ❌ Not provided
  // base_tax_total: number,          ❌ Not provided
  // interest_total: number,          ❌ Not provided
  // penalties_total: number,         ❌ Not provided
}
```

**Issue Analysis**:
- 🔴 Frontend aggregates `directSales` **3 times** (lines 124, 395, 399)
- 🔴 Frontend aggregates `marketplaceSales` **3 times** (lines 125, 406, 410)
- 🔴 Frontend aggregates `exposureSales` **2 times** (lines 128, 425)
- 🔴 Backend provides `total_sales` but it's NOT USED (frontend prefers to aggregate manually)
- 🟡 Backend doesn't provide `direct_sales_total`, `marketplace_sales_total` - **should add these**

---

### 2. State Detail Page

**File**: `frontend/app/analysis/[id]/states/[stateCode]/page.tsx`

**Lines with Manual Aggregation**:
```typescript
// Line 235: Transaction count
data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)

// Line 264: Transaction count (again!)
data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)

// Line 269: Direct sales
data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)

// Line 274: Marketplace sales
data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)

// Line 293: Total sales
data.year_data.reduce((sum, yr) => sum + (yr.summary.total_sales || 0), 0)

// Line 374: Exposure sales
data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0)

// Line 385: Base tax
data.year_data.reduce((sum, yr) => sum + (yr.summary.base_tax || 0), 0)

// Line 390: Interest
data.year_data.reduce((sum, yr) => sum + (yr.summary.interest || 0), 0)

// Line 395: Penalties
data.year_data.reduce((sum, yr) => sum + (yr.summary.penalties || 0), 0)

// Line 400: Marketplace sales (again!)
data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)

// Line 529: Transaction count (THIRD time!)
data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)
```

**Issue Analysis**:
- 🔴 Frontend aggregates `transaction_count` **3 times** in the same file!
- 🔴 Frontend aggregates `marketplace_sales` **2 times**
- 🔴 Backend provides `total_sales` at line 1815 but **Line 293 ignores it**
- 🔴 All these aggregates could come from backend

---

### 3. Analyses List Page

**File**: `frontend/app/analyses/page.tsx`

**Lines with Manual Aggregation**:
```typescript
// Line 166: Total liability across all analyses
.reduce((sum, a) => sum + (a.total_liability || 0), 0)

// Line 169: Average states with nexus
.reduce((sum, a, _, arr) => sum + (a.states_with_nexus || 0) / arr.length, 0)
```

**Issue Analysis**:
- ✅ This is **acceptable** - Frontend is aggregating across multiple analyses
- ✅ Backend can't pre-aggregate this (user-level stats, not analysis-level)
- ⚠️ Could be moved to a dashboard summary API endpoint if needed

---

### 4. US Map Component

**File**: `frontend/components/dashboard/USMap.tsx`

**Line with Manual Aggregation**:
```typescript
// Line 46: Convert array to map for O(1) lookup
const stateDataMap = stateData.reduce((acc, state) => {
  acc[state.state_code] = state
  return acc
}, {} as Record<string, typeof stateData[0]>)
```

**Issue Analysis**:
- ✅ This is **acceptable** - Data structure transformation, not aggregation
- ✅ Building a lookup map for performance

---

## What Backend SHOULD Provide (But Doesn't)

### Missing Aggregate Fields in `GET /analyses/{id}/states/{state_code}`

Currently backend provides:
```typescript
{
  total_sales: number,          // ✅ Provided
  taxable_sales: number,        // ✅ Provided
  exempt_sales: number,         // ✅ Provided
  estimated_liability: number,  // ✅ Provided
}
```

**Should also provide**:
```typescript
{
  // Sales channel aggregates
  direct_sales_total: number,        // ❌ Missing
  marketplace_sales_total: number,   // ❌ Missing

  // Liability breakdown aggregates
  exposure_sales_total: number,      // ❌ Missing
  base_tax_total: number,            // ❌ Missing
  interest_total: number,            // ❌ Missing
  penalties_total: number,           // ❌ Missing

  // Transaction metadata
  transaction_count_total: number,   // ❌ Missing
}
```

**Backend Already Calculates These** (in `get_state_detail()` at lines 1764-1767):
```python
# Backend already does this math!
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
total_taxable_sales_all_years = sum(yr['summary']['taxable_sales'] for yr in year_data)
total_exempt_sales_all_years = total_sales_all_years - total_taxable_sales_all_years
total_liability_all_years = sum(yr['summary']['estimated_liability'] for yr in year_data)
```

**But it doesn't calculate**:
- `direct_sales_total`
- `marketplace_sales_total`
- `exposure_sales_total`
- `base_tax_total`
- `interest_total`
- `penalties_total`
- `transaction_count_total`

**Solution**: Add these 7 fields to the backend response at lines 1815-1820.

---

## The Triple Aggregation Problem

### Example: Total Sales for a State

**Step 1: Database Calculation** (`NexusCalculatorV2._save_results_to_database`)
```python
# state_results table stores per-year totals
INSERT INTO state_results (analysis_id, state, year, total_sales, ...)
VALUES (uuid, 'CA', 2023, 50000, ...)
VALUES (uuid, 'CA', 2024, 100000, ...)
```

**Step 2: Backend API Re-Aggregation** (`analyses.py:1764`)
```python
# Backend sums across years AGAIN
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
# Result: 150000
```

**Step 3: Frontend Re-Aggregation** (`StateQuickViewModal.tsx:293`)
```typescript
// Frontend sums across years YET AGAIN
const total = data.year_data.reduce((sum, yr) => sum + yr.summary.total_sales, 0)
// Result: 150000 (hopefully!)
```

**Problem**:
- Same math done 3 times
- If any rounding differs, we get 3 different answers
- Frontend wastes cycles on calculation backend already did
- Hard to debug: "Which total is correct?"

**Solution**:
```typescript
// Frontend should TRUST backend
const total = data.total_sales  // ✅ Use pre-calculated value
```

---

## Where Backend RE-Aggregates (Unnecessarily)

### API Endpoint: `GET /analyses/{id}/states/{state_code}`

**Backend does aggregation at lines 1764-1767**:
```python
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
total_taxable_sales_all_years = sum(yr['summary']['taxable_sales'] for yr in year_data)
total_exempt_sales_all_years = total_sales_all_years - total_taxable_sales_all_years
total_liability_all_years = sum(yr['summary']['estimated_liability'] for yr in year_data)
```

**Issue**: This data ALREADY EXISTS in `state_results` table!

**Why Backend Re-Aggregates**:
- `state_results` is per-year (one row per state per year)
- API needs all-years totals
- No database view or query to get all-years totals directly

**Solutions**:

**Option A: Database View** (Best)
```sql
CREATE VIEW state_results_all_years AS
SELECT
  analysis_id,
  state,
  SUM(total_sales) AS total_sales_all_years,
  SUM(taxable_sales) AS taxable_sales_all_years,
  SUM(exempt_sales) AS exempt_sales_all_years,
  SUM(estimated_liability) AS estimated_liability_all_years,
  SUM(direct_sales) AS direct_sales_all_years,
  SUM(marketplace_sales) AS marketplace_sales_all_years,
  SUM(exposure_sales) AS exposure_sales_all_years,
  SUM(base_tax) AS base_tax_all_years,
  SUM(interest) AS interest_all_years,
  SUM(penalties) AS penalties_all_years,
  SUM(transaction_count) AS transaction_count_all_years
FROM state_results
GROUP BY analysis_id, state;
```

Then API just queries the view:
```python
# No aggregation in Python needed!
all_years_totals = supabase.table('state_results_all_years') \
    .select('*') \
    .eq('analysis_id', analysis_id) \
    .eq('state', state_code) \
    .execute()
```

**Option B: Aggregate in SQL** (Good)
```python
# Let PostgreSQL do the aggregation
totals = supabase.rpc('get_state_totals', {
    'analysis_id': analysis_id,
    'state_code': state_code
}).execute()
```

**Option C: Keep in Python but Add More Fields** (Acceptable)
```python
# Calculate all aggregates, not just some
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
direct_sales_all_years = sum(yr['summary']['direct_sales'] for yr in year_data)
marketplace_sales_all_years = sum(yr['summary']['marketplace_sales'] for yr in year_data)
# ... etc for all 10 fields
```

---

## API Endpoint: `GET /analyses/{id}/results/states`

**Backend does aggregation at lines 1416-1421**:
```python
# Aggregate totals across all years (per state)
total_sales_all_years = sum(float(r.get('total_sales', 0)) for r in year_results)
total_liability_all_years = sum(float(r.get('estimated_liability', 0)) for r in year_results)
direct_sales_all_years = sum(float(r.get('direct_sales', 0)) for r in year_results)
marketplace_sales_all_years = sum(float(r.get('marketplace_sales', 0)) for r in year_results)
exempt_sales_all_years = sum(float(r.get('exempt_sales', 0)) for r in year_results)
taxable_sales_all_years = sum(float(r.get('taxable_sales', 0)) for r in year_results)
```

**Issue**: Same problem - this data exists in `state_results` table

**Frontend Usage**: `StateTable.tsx` uses this data
- ✅ Frontend does **NOT** re-aggregate this endpoint's response
- ✅ Frontend trusts backend values
- ✅ This is the correct pattern!

**Recommendation**: Use same solution (database view or SQL aggregation)

---

## Recommendations

### Phase 1: Stop Frontend Aggregation (1-2 days) 🔴 CRITICAL

**1. Add Missing Aggregate Fields to Backend**

Update `GET /analyses/{id}/states/{state_code}` response (lines 1815-1820):
```python
return {
    # ... existing fields ...
    'total_sales': total_sales_all_years,
    'taxable_sales': total_taxable_sales_all_years,
    'exempt_sales': total_exempt_sales_all_years,
    'estimated_liability': total_liability_all_years,

    # ADD THESE 7 FIELDS:
    'direct_sales': sum(yr['summary']['direct_sales'] for yr in year_data),
    'marketplace_sales': sum(yr['summary']['marketplace_sales'] for yr in year_data),
    'exposure_sales': sum(yr['summary'].get('exposure_sales', 0) for yr in year_data),
    'base_tax': sum(yr['summary'].get('base_tax', 0) for yr in year_data),
    'interest': sum(yr['summary'].get('interest', 0) for yr in year_data),
    'penalties': sum(yr['summary'].get('penalties', 0) for yr in year_data),
    'transaction_count': sum(yr['summary']['transaction_count'] for yr in year_data),
}
```

**2. Update TypeScript Types**

Add fields to `StateDetailResponse` in `frontend/lib/api.ts`:
```typescript
export interface StateDetailResponse {
  // ... existing fields ...
  total_sales: number
  taxable_sales: number
  exempt_sales: number
  estimated_liability: number

  // ADD THESE:
  direct_sales: number           // ← NEW
  marketplace_sales: number      // ← NEW
  exposure_sales: number         // ← NEW
  base_tax: number              // ← NEW
  interest: number              // ← NEW
  penalties: number             // ← NEW
  transaction_count: number     // ← NEW
}
```

**3. Update Frontend to Use Backend Values**

**StateQuickViewModal.tsx** changes:
```typescript
// BEFORE (lines 124-125):
const directSales = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
const marketplaceSales = data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)

// AFTER:
const directSales = data.direct_sales          // ✅ Trust backend
const marketplaceSales = data.marketplace_sales // ✅ Trust backend
```

Do this for all 14 instances of `.reduce()` in the file.

**State Detail Page** changes:
```typescript
// BEFORE (line 293):
? data.year_data.reduce((sum, yr) => sum + (yr.summary.total_sales || 0), 0)

// AFTER:
? data.total_sales  // ✅ Trust backend
```

Do this for all 11 instances.

**Deploy**: Backend + Frontend together (coordinated deploy)

---

### Phase 2: Move Aggregation to Database (3-5 days)

**4. Create Database View**

```sql
-- Migration: 020_create_state_results_aggregates_view.sql
CREATE OR REPLACE VIEW state_results_all_years AS
SELECT
  analysis_id,
  state,
  SUM(total_sales) AS total_sales,
  SUM(taxable_sales) AS taxable_sales,
  SUM(exempt_sales) AS exempt_sales,
  SUM(direct_sales) AS direct_sales,
  SUM(marketplace_sales) AS marketplace_sales,
  SUM(exposure_sales) AS exposure_sales,
  SUM(estimated_liability) AS estimated_liability,
  SUM(base_tax) AS base_tax,
  SUM(interest) AS interest,
  SUM(penalties) AS penalties,
  COUNT(*) AS year_count,
  SUM(transaction_count) AS transaction_count,
  MIN(year) AS first_year,
  MAX(year) AS last_year,
  -- Metadata
  MAX(nexus_type) AS nexus_type,        -- 'both' > 'physical' > 'economic'
  MIN(first_nexus_year) AS first_nexus_year
FROM state_results
GROUP BY analysis_id, state;
```

**5. Update API to Use View**

Replace aggregation code at lines 1764-1767:
```python
# BEFORE: Python aggregation
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
# ... etc

# AFTER: Query database view
aggregates = supabase.table('state_results_all_years') \
    .select('*') \
    .eq('analysis_id', analysis_id) \
    .eq('state', state_code) \
    .single() \
    .execute()

if aggregates.data:
    return {
        # Use view data directly
        'total_sales': aggregates.data['total_sales'],
        'taxable_sales': aggregates.data['taxable_sales'],
        # ... all fields from view
    }
```

**6. Consider Materialized View for Performance**

If queries are slow:
```sql
CREATE MATERIALIZED VIEW state_results_all_years_mat AS
SELECT * FROM state_results_all_years;

CREATE INDEX idx_state_results_all_years_analysis
ON state_results_all_years_mat(analysis_id);

-- Refresh after calculation
REFRESH MATERIALIZED VIEW state_results_all_years_mat;
```

---

### Phase 3: Prevent Regressions (ongoing)

**7. Add Linting Rule**

Create ESLint rule to prevent `.reduce()` on `year_data`:
```javascript
// .eslintrc.js
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'CallExpression[callee.property.name="reduce"][callee.object.property.name="year_data"]',
      message: 'Do not manually aggregate year_data. Use pre-calculated fields from backend instead.'
    }
  ]
}
```

**8. Add Code Review Checklist**

When reviewing PRs, check:
- [ ] No `.reduce()` on `year_data` arrays
- [ ] Using backend aggregate fields instead of manual calculation
- [ ] If aggregation is needed, is it truly frontend-only logic?

**9. Document Pattern**

Add to developer docs:
```markdown
## Data Aggregation Guidelines

**RULE**: Always use backend-provided aggregate fields.

**NEVER**:
```typescript
const total = data.year_data.reduce((sum, yr) => sum + yr.summary.total_sales, 0)
```

**ALWAYS**:
```typescript
const total = data.total_sales  // Backend already calculated this
```

**Why**: Single source of truth. Backend calculations are authoritative.
```

---

## Impact Analysis

### Current State

**Endpoints with Aggregation Issues**:
- `GET /analyses/{id}/states/{state_code}` - ⚠️ Missing 7 aggregate fields
- `GET /analyses/{id}/results/states` - ✅ Provides aggregates correctly

**Frontend Files with Manual Aggregation**:
- `StateQuickViewModal.tsx` - 🔴 14 instances
- `app/analysis/[id]/states/[stateCode]/page.tsx` - 🔴 11 instances
- `app/analyses/page.tsx` - ✅ Acceptable (user-level stats)
- `components/dashboard/USMap.tsx` - ✅ Acceptable (data structure transformation)

**Total Unnecessary Aggregations**: 25 instances

---

### After Fix

**Backend Changes**:
- Add 7 fields to `GET /analyses/{id}/states/{state_code}` response
- Optionally: Create database view for better performance

**Frontend Changes**:
- Remove 25 `.reduce()` calls
- Replace with direct field access (`data.total_sales` instead of aggregating `year_data`)
- Update TypeScript types

**Benefits**:
- ✅ Single source of truth (database)
- ✅ Faster frontend rendering (no aggregation loops)
- ✅ Consistent numbers (no rounding discrepancies)
- ✅ Easier to debug (one calculation, not three)
- ✅ Easier to maintain (change once in backend, not everywhere)

---

## Testing Strategy

### Before & After Tests

**Test 1: Verify Aggregates Match**
```typescript
// Ensure backend aggregates equal manual aggregation (during migration)
describe('Backend aggregates', () => {
  it('total_sales should equal sum of year_data', () => {
    const manual = data.year_data.reduce((sum, yr) => sum + yr.summary.total_sales, 0)
    expect(data.total_sales).toEqual(manual)
  })

  it('direct_sales should equal sum of year_data', () => {
    const manual = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
    expect(data.direct_sales).toEqual(manual)
  })

  // ... repeat for all 10 fields
})
```

**Test 2: Integration Test**
```typescript
// After migration, verify no manual aggregation
describe('StateQuickViewModal', () => {
  it('should use backend aggregates, not manual reduce', () => {
    const { container } = render(<StateQuickViewModal data={mockData} />)

    // Check that displayed values match backend-provided aggregates
    expect(screen.getByText(formatCurrency(mockData.direct_sales))).toBeInTheDocument()
    // NOT: expect(screen.getByText(formatCurrency(calculated))).toBeInTheDocument()
  })
})
```

**Test 3: Performance Test**
```typescript
// Measure render time before/after
describe('Performance', () => {
  it('should render faster without manual aggregation', () => {
    const start = performance.now()
    render(<StateQuickViewModal data={largeDataset} />)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100) // ms
  })
})
```

---

## Metrics

- **Frontend files with aggregation**: 2 (StateQuickViewModal, StateDetailPage)
- **Instances of unnecessary `.reduce()`**: 25
- **Backend endpoints providing aggregates**: 1 of 2 (50%)
- **Missing aggregate fields**: 7
- **Lines of frontend code that can be deleted**: ~50
- **Estimated performance improvement**: 10-20% faster rendering

---

## Critical Issues Summary

### 🔴 Critical

1. **Frontend Re-Aggregates Backend Data**
   - 25 instances of `.reduce()` on `year_data`
   - Violates single source of truth
   - **Risk**: Inconsistent totals, wasted CPU

2. **Backend Missing Aggregate Fields**
   - 7 fields not provided but should be
   - Forces frontend to aggregate manually
   - **Risk**: Incomplete API contract

3. **Backend Re-Aggregates Database Data**
   - API aggregates data that's already in `state_results`
   - Should use database view or SQL aggregation
   - **Risk**: Performance, duplicate logic

### 🟡 Important

4. **No Linting to Prevent Regressions**
   - Easy for developers to add new `.reduce()` calls
   - No automated checks
   - **Risk**: Problem reoccurs

5. **No Documentation of Pattern**
   - Developers don't know they should trust backend
   - No guidelines on when aggregation is acceptable
   - **Risk**: Confusion, inconsistent approach

---

## Next Steps

1. ✅ Complete this audit
2. ⏸️ Add 7 missing fields to backend response
3. ⏸️ Update TypeScript types
4. ⏸️ Remove 25 frontend `.reduce()` calls
5. ⏸️ Deploy backend + frontend together
6. ⏸️ Create database view (optional performance improvement)
7. ⏸️ Add ESLint rule to prevent regressions

---

*Continue to: `05-type-system/` audit*
