# Screen 5: State-by-State Results Table - Design Document

**Date:** 2025-01-04
**Sprint:** Sprint 2
**Feature:** Screen 5 - Comprehensive state table with sorting, filtering, and search
**Status:** Design Complete - Ready for Implementation

---

## Overview

Screen 5 provides a comprehensive, sortable, and filterable table view of all 50+ states showing nexus determination results, revenue data, and estimated tax liability. This screen allows tax professionals to analyze all states at once, compare metrics, and drill down into individual state details.

---

## User Goals

1. **See all states at once** - Complete picture of nexus obligations across all jurisdictions
2. **Sort and filter** - Focus on states that matter (has nexus, high liability, etc.)
3. **Quick state lookup** - Search to find specific states instantly
4. **Navigate to details** - Click any state to see complete breakdown (Screen 6)
5. **Share views** - Bookmark or share specific filtered/sorted views via URL

---

## Design Decisions

### Data Scope
- **Show all 50+ states (including DC and territories)** - Even states with $0 sales
- Rationale: Professional tax analysis requires showing comprehensive coverage. Users need to confirm "yes, we analyzed all states and 35 have no nexus."

### Table Implementation
- **Use shadcn/ui Table component** for consistent styling
- **Client-side sorting/filtering** - All 50 states loaded at once, instant interactions
- **URL state management** - Save sort and filter state in URL params for shareable links
- Rationale: 50 rows is tiny, client-side provides snappy UX. URL params enable bookmarking specific views.

### Sorting Behavior
- **Single-column sort with "Reset to Default" button**
- Default sort: Nexus Status (Has→Approaching→None), then Liability (high→low)
- Clicking column header toggles asc/desc for that column
- Rationale: Simple interaction, easy to explore data, easy to restore optimal view

### Filtering Design
- **Dropdowns with one selection per category** (not multi-select)
- Categories: Nexus Status, Registration Status, Confidence Level
- Filters use AND logic (all must match)
- Rationale: Clean UI, predictable behavior, sufficient for 50 rows

### Search Scope
- **Search only matches state name/code** - Not amounts, not status
- Filters handle status/confidence filtering
- Rationale: Clear separation - search finds states, filters refine views

### Navigation
- **Entire row is clickable** - Navigate to Screen 6 (state detail)
- Hover effect with arrow icon (→) indicates clickable
- Rationale: Modern UX pattern, larger click target, cleaner than button in every row

---

## Technical Architecture

### Backend Changes

#### 1. Update NexusCalculator Service

**File:** `backend/app/services/nexus_calculator.py`

**Changes to `calculate_nexus_for_analysis()` method:**

```python
# After aggregating transactions by state:
# 1. Get list of states with transactions (current behavior)
states_with_transactions = aggregated_df['state'].unique()

# 2. Fetch ALL states from database
all_states = supabase.table('states').select('state_code').execute()
all_state_codes = [s['state_code'] for s in all_states.data]

# 3. Fetch thresholds for ALL states
all_thresholds = self._get_economic_nexus_thresholds()
all_tax_rates = self._get_tax_rates()

# 4. For states WITHOUT transactions, create default entries
for state_code in all_state_codes:
    if state_code not in states_with_transactions:
        # Create entry with $0 sales, no nexus
        state_results.append({
            'analysis_id': analysis_id,
            'state': state_code,
            'total_sales': 0,
            'direct_sales': 0,
            'marketplace_sales': 0,
            'transaction_count': 0,
            'nexus_type': 'none',
            'estimated_liability': 0,
            'threshold': all_thresholds.get(state_code, {}).get('revenue_threshold', 0),
            'approaching_threshold': False
        })

# 5. Save all 50+ states to state_results table (batch insert)
```

**Impact:**
- Saves 50+ rows per analysis instead of 10-20
- Negligible performance impact (< 1 second additional)
- Database size increase: ~1.5 KB per analysis

#### 2. New API Endpoint

**File:** `backend/app/api/v1/analyses.py`

**Endpoint:** `GET /api/v1/analyses/{analysis_id}/results/states`

**Implementation:**

```python
@router.get("/{analysis_id}/results/states")
async def get_state_results(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete state-by-state results for table display.
    Returns all 50+ states including those with $0 sales.
    """

    # 1. Verify analysis belongs to user
    analysis = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', current_user['id']).single().execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # 2. Fetch all state results
    state_results = supabase.table('state_results').select('*').eq('analysis_id', analysis_id).execute()

    # 3. Fetch state names
    states = supabase.table('states').select('state_code, state_name').execute()
    state_names = {s['state_code']: s['state_name'] for s in states.data}

    # 4. Check registration status (from physical_nexus table if exists)
    physical_nexus = supabase.table('physical_nexus').select('state_code').eq('analysis_id', analysis_id).execute()
    registered_states = {pn['state_code'] for pn in physical_nexus.data}

    # 5. Format response
    formatted_states = []
    for state in state_results.data:
        # Calculate threshold percentage
        threshold_percent = (state['total_sales'] / state['threshold'] * 100) if state['threshold'] > 0 else 0

        # Determine nexus status
        if state['nexus_type'] in ['physical', 'economic', 'both']:
            nexus_status = 'has_nexus'
        elif state['approaching_threshold']:
            nexus_status = 'approaching'
        else:
            nexus_status = 'no_nexus'

        formatted_states.append({
            'state_code': state['state'],
            'state_name': state_names.get(state['state'], state['state']),
            'nexus_status': nexus_status,
            'nexus_type': state['nexus_type'],
            'total_sales': float(state['total_sales'] or 0),
            'direct_sales': float(state['direct_sales'] or 0),
            'marketplace_sales': float(state['marketplace_sales'] or 0),
            'threshold': float(state['threshold'] or 0),
            'threshold_percent': round(threshold_percent, 1),
            'estimated_liability': float(state['estimated_liability'] or 0),
            'confidence_level': 'high',  # TODO: Implement confidence calculation
            'registration_status': 'registered' if state['state'] in registered_states else 'not_registered'
        })

    return {
        'analysis_id': analysis_id,
        'total_states': len(formatted_states),
        'states': formatted_states
    }
```

**Response Example:**

```json
{
  "analysis_id": "uuid-here",
  "total_states": 52,
  "states": [
    {
      "state_code": "CA",
      "state_name": "California",
      "nexus_status": "has_nexus",
      "nexus_type": "both",
      "total_sales": 2745000.00,
      "direct_sales": 1647000.00,
      "marketplace_sales": 1098000.00,
      "threshold": 500000.00,
      "threshold_percent": 549.0,
      "estimated_liability": 161695.00,
      "confidence_level": "high",
      "registration_status": "registered"
    },
    {
      "state_code": "AL",
      "state_name": "Alabama",
      "nexus_status": "no_nexus",
      "nexus_type": "none",
      "total_sales": 0,
      "direct_sales": 0,
      "marketplace_sales": 0,
      "threshold": 250000.00,
      "threshold_percent": 0,
      "estimated_liability": 0,
      "confidence_level": "high",
      "registration_status": "not_registered"
    }
  ]
}
```

---

### Frontend Implementation

#### 1. Page Component

**File:** `frontend/app/analysis/[id]/states/page.tsx`

**Route:** `/analysis/{analysis_id}/states`

**Component Structure:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface StateResult {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'no_nexus'
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  total_sales: number
  direct_sales: number
  marketplace_sales: number
  threshold: number
  threshold_percent: number
  estimated_liability: number
  confidence_level: 'high' | 'medium' | 'low'
  registration_status: 'registered' | 'not_registered' | null
}

export default function StateTablePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = params.id

  // State
  const [states, setStates] = useState<StateResult[]>([])
  const [filteredStates, setFilteredStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and sort from URL or defaults
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'nexus_status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('order') as 'asc' | 'desc' || 'desc')
  const [nexusFilter, setNexusFilter] = useState(searchParams.get('nexus') || 'all')
  const [registrationFilter, setRegistrationFilter] = useState(searchParams.get('registration') || 'all')
  const [confidenceFilter, setConfidenceFilter] = useState(searchParams.get('confidence') || 'all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch data, apply filters/sort, handle URL params...
  // (Implementation details below)

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      {/* Filter Bar */}
      {/* State Table */}
      {/* Actions */}
    </div>
  )
}
```

#### 2. Filter Bar Component

**Elements:**
- Nexus Status Dropdown: All | Has Nexus | Approaching | No Nexus
- Registration Dropdown: All | Registered | Not Registered
- Confidence Dropdown: All | High | Medium | Low
- Search Input: Free text search
- Reset Filters button

**Updates URL on change:**
```typescript
const updateFilters = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString())
  if (value === 'all') {
    params.delete(key)
  } else {
    params.set(key, value)
  }
  router.push(`?${params.toString()}`)
}
```

#### 3. Table Component

**Columns:**
1. **State** - Icon + name, sortable
2. **Nexus Status** - Status + type, sortable
3. **Revenue** - Total with breakdown, sortable
4. **Threshold** - Amount + percentage, sortable
5. **Est. Liability** - Currency, sortable
6. **Confidence** - Badge, sortable
7. **Arrow** - → icon on hover

**Row Implementation:**
```typescript
<TableRow
  key={state.state_code}
  onClick={() => router.push(`/analysis/${analysisId}/states/${state.state_code}`)}
  className="cursor-pointer hover:bg-gray-50 transition-colors group"
>
  <TableCell>
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${getNexusColor(state.nexus_status)}`} />
      <span className="font-medium">{state.state_name}</span>
    </div>
  </TableCell>

  <TableCell>
    <div className="text-sm">
      {getNexusStatusLabel(state.nexus_status)}
      <div className="text-xs text-gray-500">{getNexusTypeLabel(state.nexus_type)}</div>
    </div>
  </TableCell>

  <TableCell>
    <div className="text-sm">
      <div className="font-medium">${state.total_sales.toLocaleString()}</div>
      {state.direct_sales > 0 && (
        <div className="text-xs text-gray-500">
          Direct: ${state.direct_sales.toLocaleString()}
        </div>
      )}
      {state.marketplace_sales > 0 && (
        <div className="text-xs text-gray-500">
          Mktp: ${state.marketplace_sales.toLocaleString()}
        </div>
      )}
    </div>
  </TableCell>

  <TableCell>
    <div className="text-sm">
      <div>${state.threshold.toLocaleString()}</div>
      <div className={`text-xs ${getThresholdColor(state.threshold_percent)}`}>
        ({state.threshold_percent}%)
      </div>
    </div>
  </TableCell>

  <TableCell className="font-medium">
    ${state.estimated_liability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  </TableCell>

  <TableCell>
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getConfidenceBadge(state.confidence_level)}`}>
      {state.confidence_level}
    </span>
  </TableCell>

  <TableCell>
    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
  </TableCell>
</TableRow>
```

#### 4. Sorting Logic

```typescript
const sortStates = (states: StateResult[], sortBy: string, order: 'asc' | 'desc') => {
  const sorted = [...states].sort((a, b) => {
    let aVal: any, bVal: any

    switch (sortBy) {
      case 'nexus_status':
        // Custom order: has_nexus > approaching > no_nexus
        const statusOrder = { has_nexus: 3, approaching: 2, no_nexus: 1 }
        aVal = statusOrder[a.nexus_status]
        bVal = statusOrder[b.nexus_status]
        // Secondary sort by liability
        if (aVal === bVal) {
          return b.estimated_liability - a.estimated_liability
        }
        break
      case 'state':
        aVal = a.state_name
        bVal = b.state_name
        break
      case 'revenue':
        aVal = a.total_sales
        bVal = b.total_sales
        break
      case 'threshold':
        aVal = a.threshold_percent
        bVal = b.threshold_percent
        break
      case 'liability':
        aVal = a.estimated_liability
        bVal = b.estimated_liability
        break
      case 'confidence':
        const confOrder = { low: 1, medium: 2, high: 3 }
        aVal = confOrder[a.confidence_level]
        bVal = confOrder[b.confidence_level]
        break
      default:
        return 0
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
}
```

#### 5. Filtering Logic

```typescript
const applyFilters = (states: StateResult[]) => {
  let filtered = states

  // Nexus status filter
  if (nexusFilter !== 'all') {
    filtered = filtered.filter(s => s.nexus_status === nexusFilter)
  }

  // Registration filter
  if (registrationFilter !== 'all') {
    filtered = filtered.filter(s => s.registration_status === registrationFilter)
  }

  // Confidence filter
  if (confidenceFilter !== 'all') {
    filtered = filtered.filter(s => s.confidence_level === confidenceFilter)
  }

  // Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(s =>
      s.state_name.toLowerCase().includes(query) ||
      s.state_code.toLowerCase().includes(query)
    )
  }

  return filtered
}
```

#### 6. Helper Functions

```typescript
const getNexusColor = (status: string) => {
  switch (status) {
    case 'has_nexus': return 'bg-red-500'
    case 'approaching': return 'bg-yellow-500'
    case 'no_nexus': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

const getThresholdColor = (percent: number) => {
  if (percent >= 100) return 'text-red-600 font-semibold'
  if (percent >= 90) return 'text-yellow-600 font-semibold'
  return 'text-green-600'
}

const getNexusStatusLabel = (status: string) => {
  switch (status) {
    case 'has_nexus': return 'Has Nexus'
    case 'approaching': return 'Approaching'
    case 'no_nexus': return 'No Nexus'
    default: return 'Unknown'
  }
}

const getNexusTypeLabel = (type: string) => {
  switch (type) {
    case 'physical': return 'Physical'
    case 'economic': return 'Economic'
    case 'both': return 'Physical + Economic'
    case 'none': return ''
    default: return ''
  }
}

const getConfidenceBadge = (level: string) => {
  switch (level) {
    case 'high': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
```

---

## Visual Design

### Color Coding

**Nexus Status Icons:**
- 🔴 Red (`bg-red-500`): Has Nexus
- 🟡 Yellow (`bg-yellow-500`): Approaching threshold (90-100%)
- 🟢 Green (`bg-green-500`): No nexus

**Threshold Percentages:**
- Red text (bold): >= 100% (over threshold)
- Yellow text (bold): 90-99% (approaching)
- Green text: < 90% (safe)

**Confidence Badges:**
- Green badge: High confidence
- Yellow badge: Medium confidence
- Red badge: Low confidence

### Hover Effects

**Table Rows:**
- Default: white background
- Hover: light gray background (`hover:bg-gray-50`)
- Cursor changes to pointer
- Arrow icon (→) fades in on right side

### Typography

- State names: Medium weight, 14px
- Revenue total: Medium weight, 14px
- Revenue breakdown: Regular weight, 12px, gray text
- Threshold: Regular weight, 14px
- Liability: Medium weight, 14px
- Status labels: Regular weight, 14px

---

## Error Handling

### API Errors
- **404 Not Found:** Redirect to dashboard with toast: "Analysis not found"
- **500 Server Error:** Show error banner with retry button
- **Network Error:** Show offline message, enable retry

### Data Validation
- Missing state names: Use state code as fallback
- Undefined numbers: Default to 0
- Invalid nexus_status: Default to 'no_nexus'

### Edge Cases
- **No states returned:** Show message "No calculation results found. Please calculate nexus first."
- **Zero states match filters:** Show "No states match your filters" with "Clear Filters" button
- **Analysis not calculated:** Show banner "Nexus not calculated yet" with "Go to Mapping" button

---

## URL Parameters

### Supported Params

```
/analysis/{id}/states?sort=liability&order=desc&nexus=has_nexus&confidence=high&registration=registered
```

**Parameters:**
- `sort`: Column to sort by (nexus_status, state, revenue, threshold, liability, confidence)
- `order`: Sort direction (asc, desc)
- `nexus`: Filter by nexus status (has_nexus, approaching, no_nexus)
- `registration`: Filter by registration (registered, not_registered)
- `confidence`: Filter by confidence (high, medium, low)

**Default URL (no params):**
```
/analysis/{id}/states
```
- Sorts by nexus_status (default multi-level sort)
- No filters applied
- Shows all 52 states

### URL State Management

**On mount:**
1. Read URL params via `useSearchParams()`
2. Apply to filter/sort state
3. Fetch data and apply filters

**On filter/sort change:**
1. Update local state
2. Update URL params via `router.push()`
3. Re-apply filters to displayed data

**Benefits:**
- Shareable links: "Here's all high-confidence states with nexus sorted by liability"
- Bookmarkable views
- Browser back/forward works correctly
- Page refresh preserves view

---

## Navigation

### Entry Points
1. **From Screen 4 (Results Dashboard):** "View Detailed Table" button
2. **Direct URL:** `/analysis/{id}/states`
3. **Breadcrumb:** From state detail (Screen 6) back to table

### Exit Points
1. **Click state row:** Navigate to `/analysis/{id}/states/{state_code}` (Screen 6)
2. **Back to Dashboard button:** Return to `/analysis/{id}/results`
3. **Breadcrumb:** Click "Results" to go back to dashboard

### Breadcrumb
```
Results Dashboard > State Table
```

---

## Performance Considerations

### Data Loading
- Single API call fetches all 50 states
- No pagination needed (small dataset)
- Client-side filtering/sorting (instant)
- Total response size: ~15-20 KB

### Rendering
- 50 table rows render instantly (< 100ms)
- Virtual scrolling not needed (fits on screen with scroll)
- Skeleton loading while fetching

### Caching
- Could cache state results in React state
- No need to refetch unless user recalculates
- Consider adding "Recalculate" button if data might be stale

---

## Testing Strategy

### Backend Tests
1. Test NexusCalculator saves all 50 states
2. Test `/results/states` endpoint returns 52 states
3. Test states with $0 sales have correct defaults
4. Test threshold percentages calculated correctly
5. Test registration status lookup works

### Frontend Tests
1. Test table renders all 50 states
2. Test sorting by each column
3. Test filtering by each category
4. Test search finds states correctly
5. Test URL params applied on mount
6. Test URL updates on filter change
7. Test row click navigates correctly
8. Test empty states (no results, no calculation)

### E2E Tests
1. Navigate from dashboard → state table
2. Apply filters, verify URL updates
3. Sort columns, verify order changes
4. Search for state, verify found
5. Click state row, verify navigates to detail
6. Share URL, verify filters/sort preserved

---

## Implementation Order

1. **Backend - Update NexusCalculator** (1-2 hours)
   - Modify calculation to save all 50 states
   - Test with sample data
   - Verify database has 52 rows after calculation

2. **Backend - Create `/results/states` endpoint** (1 hour)
   - Implement endpoint
   - Test with Postman/curl
   - Verify response format matches spec

3. **Frontend - Page structure** (1 hour)
   - Create `app/analysis/[id]/states/page.tsx`
   - Basic layout (header, filter bar, table container)
   - Fetch data and display loading state

4. **Frontend - Install shadcn/ui Table** (15 min)
   - Run `npx shadcn-ui@latest add table`
   - Create basic table structure

5. **Frontend - Table display** (2 hours)
   - Map data to table rows
   - Format cells (revenue breakdown, threshold, etc.)
   - Add color coding and icons
   - Test with real data

6. **Frontend - Sorting** (1-2 hours)
   - Implement sort logic
   - Add sort indicators to headers
   - Add "Reset to Default Sort" button
   - Update URL params

7. **Frontend - Filtering** (2 hours)
   - Build filter dropdowns
   - Implement filter logic
   - Add search input
   - Update URL params
   - Add filter count display

8. **Frontend - URL state management** (1 hour)
   - Read params on mount
   - Update params on change
   - Test sharing URLs

9. **Frontend - Navigation** (30 min)
   - Make rows clickable
   - Add hover effects
   - Add arrow icon
   - Test navigation to Screen 6

10. **Frontend - Polish** (1-2 hours)
    - Error handling
    - Empty states
    - Loading skeletons
    - Responsive warnings
    - Accessibility

11. **Integration - Connect to Screen 4** (30 min)
    - Add "View Detailed Table" button to dashboard
    - Test navigation flow
    - Update breadcrumbs

12. **Testing & Bug Fixes** (2-3 hours)
    - Manual testing all features
    - Cross-browser testing
    - Fix bugs
    - Performance testing

**Total Estimated Time:** 14-18 hours

---

## Success Criteria

### Functional
- ✅ Table displays all 50+ states
- ✅ States with $0 sales show correctly
- ✅ All columns sortable
- ✅ All filters work correctly
- ✅ Search finds states by name/code
- ✅ URL params preserve view state
- ✅ Clicking row navigates to state detail
- ✅ "Reset Sort" button restores default view

### Visual
- ✅ Color coding matches nexus status
- ✅ Revenue breakdown stacks in cells
- ✅ Threshold percentages color-coded
- ✅ Hover effect shows row is clickable
- ✅ Arrow icon appears on hover
- ✅ Responsive on desktop (1280px+)

### Performance
- ✅ Table loads in < 2 seconds
- ✅ Sorting/filtering feels instant
- ✅ No jank when hovering/clicking rows

### UX
- ✅ Default view shows most important states first
- ✅ Filters are easy to understand
- ✅ Search finds states quickly
- ✅ Shared URLs work correctly
- ✅ Navigation is intuitive

---

## Future Enhancements (Not MVP)

- **Export table to Excel** - Download button
- **Select multiple states** - Checkboxes for batch operations
- **Custom column visibility** - Hide/show columns
- **Column resizing** - Drag to resize
- **Saved views** - Save filter/sort combinations
- **Mobile responsive table** - Stacked cards view
- **Advanced search** - Search by revenue range, liability range
- **Bulk actions** - Select states and generate report for subset

---

## Related Documents

- [PHASE_2B_SCREEN_SPECIFICATIONS.md](../../PHASE_2B_SCREEN_SPECIFICATIONS.md) - Original screen specs
- [PHASE_3_TECHNICAL_ARCHITECTURE.md](../../PHASE_3_TECHNICAL_ARCHITECTURE.md) - API endpoint specs
- [SPRINT_1_COMPLETE.md](../../SPRINT_1_COMPLETE.md) - Sprint 1 summary
- [data-model-specification.md](../../data-model-specification.md) - Database schema

---

**Design Status:** ✅ Complete and validated
**Ready for Implementation:** Yes
**Next Step:** Create implementation plan or begin development
