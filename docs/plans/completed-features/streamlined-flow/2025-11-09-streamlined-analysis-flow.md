# Streamlined Analysis Flow - Implementation Plan

**Date:** November 9, 2025
**Status:** Ready for Implementation
**Goal:** Consolidate multi-step upload flow into one streamlined experience

---

## Overview

### Problems Being Solved:
1. ❌ Three separate screens/popups with redundant information
2. ❌ Upload preview page that doesn't add value
3. ❌ Calculation doesn't complete before redirect (empty results bug)
4. ❌ State table on separate page instead of embedded
5. ❌ Unnecessary action buttons cluttering results page

### Solution Architecture:
1. ✅ Merge New Analysis + Upload into ONE page
2. ✅ ONE confirmation dialog (replaces date + mapping popups)
3. ✅ Fix calculation flow with proper polling
4. ✅ Embed state table in results page
5. ✅ Remove redundant buttons

---

## Task 1: Enhance ColumnMappingConfirmationDialog

**Goal:** Add date range to top of dialog, creating ONE consolidated confirmation

**Files:**
- Modify: `frontend/components/analysis/ColumnMappingConfirmationDialog.tsx`

### Changes:

1. **Add date range section at top (before mappings):**

```tsx
{/* Data Summary - Top Section */}
<div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 mb-6">
  <div className="flex items-center gap-2 mb-3">
    <CheckCircle2 className="h-5 w-5 text-green-600" />
    <h3 className="font-semibold text-green-900 dark:text-green-100">
      Analysis Ready to Calculate
    </h3>
  </div>

  {dataSummary && (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <p className="text-muted-foreground">Transactions</p>
        <p className="font-semibold text-lg">{dataSummary.total_rows.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-muted-foreground">States</p>
        <p className="font-semibold text-lg">{dataSummary.unique_states}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Period</p>
        <p className="font-semibold text-sm">
          {dataSummary.date_range.start}<br/>
          {dataSummary.date_range.end}
        </p>
      </div>
    </div>
  )}
</div>

<Separator className="my-4" />

<DialogDescription>
  We've automatically detected your column mappings. Please verify they look correct.
</DialogDescription>

{/* Existing mappings grid continues below... */}
```

2. **Update dialog title:**
```tsx
<DialogTitle>Confirm Analysis Setup</DialogTitle>
```

3. **No prop changes needed** - `dataSummary` already exists

### Testing:
- Visual check: Date range appears prominently at top
- All existing functionality still works
- Sample values still display correctly

### Commit:
```bash
git add frontend/components/analysis/ColumnMappingConfirmationDialog.tsx
git commit -m "feat(frontend): enhance confirmation dialog with date range

- Add data summary section at top with success styling
- Show transactions, states, and date range prominently
- Improve visual hierarchy with gradient background
- Update dialog title to 'Confirm Analysis Setup'"
```

---

## Task 2: Add File Upload to New Analysis Page

**Goal:** Merge upload functionality into New Analysis page

**Files:**
- Modify: `frontend/app/analysis/new/page.tsx`
- Reference: `frontend/app/analysis/[id]/upload/page.tsx` (for upload logic)

### Step 1: Add necessary imports

```tsx
import { UploadCloud, CheckCircle2, FileText } from 'lucide-react'
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
```

### Step 2: Add state variables (after existing state)

```tsx
const [analysisId, setAnalysisId] = useState<string | null>(null)
const [showUploadZone, setShowUploadZone] = useState(false)
const [uploadedFile, setUploadedFile] = useState<File | null>(null)
const [uploading, setUploading] = useState(false)
const [uploadError, setUploadError] = useState('')
const [uploadResponse, setUploadResponse] = useState<any>(null)
const [showConfirmDialog, setShowConfirmDialog] = useState(false)
const [calculating, setCalculating] = useState(false)
```

### Step 3: Modify form submission (don't redirect)

Replace lines 88-89:
```tsx
// OLD:
showSuccess('Analysis created successfully')
router.push(`/analysis/${analysisId}/upload`)

// NEW:
const analysisId = response.data.id
setAnalysisId(analysisId)
setShowUploadZone(true) // Show file drop zone
showSuccess('Analysis created! Now upload your transaction data.')
```

### Step 4: Add file upload handlers

```tsx
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    setUploadedFile(file)
    handleFileUpload(file)
  }
}

const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault()
  const file = event.dataTransfer.files?.[0]
  if (file) {
    setUploadedFile(file)
    handleFileUpload(file)
  }
}

const handleFileUpload = async (file: File) => {
  if (!analysisId) return

  setUploading(true)
  setUploadError('')

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(
      `/api/v1/analyses/${analysisId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )

    setUploadResponse(response.data)

    // Show confirmation dialog if all columns detected
    if (response.data.all_required_detected) {
      setShowConfirmDialog(true)
    } else {
      // Redirect to mapping page for manual mapping
      router.push(`/analysis/${analysisId}/mapping`)
    }
  } catch (err) {
    const errorMsg = handleApiError(err, { userMessage: 'Failed to upload file' })
    setUploadError(errorMsg)
  } finally {
    setUploading(false)
  }
}

const handleConfirmCalculation = async () => {
  if (!analysisId || !uploadResponse) return

  try {
    setCalculating(true)
    setShowConfirmDialog(false)

    // Step 1: Save mappings
    const mappingPayload = {
      column_mappings: {
        transaction_date: {
          source_column: uploadResponse.auto_detected_mappings.mappings.transaction_date
        },
        customer_state: {
          source_column: uploadResponse.auto_detected_mappings.mappings.customer_state
        },
        revenue_amount: {
          source_column: uploadResponse.auto_detected_mappings.mappings.revenue_amount
        },
        sales_channel: {
          source_column: uploadResponse.auto_detected_mappings.mappings.sales_channel
        }
      }
    }

    await apiClient.post(`/api/v1/analyses/${analysisId}/validate-and-save`, mappingPayload)

    // Step 2: Trigger calculation
    await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)

    // Step 3: Poll for completion
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

      const statusResponse = await apiClient.get(`/api/v1/analyses/${analysisId}`)

      if (statusResponse.data.status === 'complete') {
        // Calculation complete!
        showSuccess('Analysis complete!')
        router.push(`/analysis/${analysisId}/results`)
        return
      }

      attempts++
    }

    // Timeout - redirect anyway with warning
    showSuccess('Calculation started - redirecting...')
    router.push(`/analysis/${analysisId}/results`)

  } catch (err) {
    const errorMsg = handleApiError(err, { userMessage: 'Failed to process analysis' })
    setError(errorMsg)
    setCalculating(false)
  }
}

const handleAdjustMappings = () => {
  setShowConfirmDialog(false)
  router.push(`/analysis/${analysisId}/mapping`)
}
```

### Step 5: Add upload zone to JSX (after form, before closing div)

```tsx
{/* File Upload Zone - Appears after analysis creation */}
{showUploadZone && (
  <Card className="mt-8 border-2 border-dashed">
    <CardHeader>
      <CardTitle className="text-xl">Upload Transaction Data</CardTitle>
      <CardDescription>
        Upload your CSV file containing sales transactions
      </CardDescription>
    </CardHeader>
    <CardContent>
      {!uploadedFile ? (
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV files up to 50MB
            </p>
          </label>
        </div>
      ) : uploading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Processing your file...</p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <p className="text-lg font-medium text-green-900 mb-2">
            File uploaded successfully!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-700">
            <FileText className="h-4 w-4" />
            <span>{uploadedFile.name}</span>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}
    </CardContent>
  </Card>
)}

{/* Confirmation Dialog */}
{showConfirmDialog && uploadResponse?.auto_detected_mappings && (
  <ColumnMappingConfirmationDialog
    isOpen={showConfirmDialog}
    onClose={() => setShowConfirmDialog(false)}
    onConfirm={handleConfirmCalculation}
    onAdjust={handleAdjustMappings}
    detectedMappings={uploadResponse.auto_detected_mappings.mappings}
    samplesByColumn={uploadResponse.auto_detected_mappings.samples}
    dataSummary={uploadResponse.auto_detected_mappings.summary}
  />
)}

{/* Loading overlay during calculation */}
{calculating && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Calculating Nexus...
      </h3>
      <p className="text-sm text-gray-600">
        This may take a minute. Please don't close this page.
      </p>
    </div>
  </div>
)}
```

### Step 6: Update button text (form submit button)

Change line 318:
```tsx
{loading ? 'Creating...' : 'Create Analysis'}
```

### Testing:
1. Fill form and submit
2. Verify upload zone appears
3. Drop CSV file
4. Verify confirmation dialog appears
5. Click "Confirm & Calculate"
6. Verify loading overlay shows
7. Verify redirect to results when complete

### Commit:
```bash
git add frontend/app/analysis/new/page.tsx
git commit -m "feat(frontend): merge upload into new analysis page

- Add file upload zone that appears after analysis creation
- Integrate auto-detection and confirmation dialog
- Add polling logic for calculation completion
- Show loading overlay during calculation
- Remove redirect to separate upload page"
```

---

## Task 3: Extract StateTable Component

**Goal:** Create reusable StateTable component from existing states page

**Files:**
- Create: `frontend/components/analysis/StateTable.tsx`
- Reference: `frontend/app/analysis/[id]/states/page.tsx`

### Implementation:

```tsx
// frontend/components/analysis/StateTable.tsx
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { StateResult } from '@/types/states'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import {
  getNexusColor,
  getNexusStatusLabel,
  sortStates,
  applyFilters,
} from '@/app/analysis/[id]/states/helpers'

interface StateTableProps {
  analysisId: string
  embedded?: boolean // Whether embedded in another page vs standalone
}

export default function StateTable({ analysisId, embedded = false }: StateTableProps) {
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and sorting
  const [sortBy, setSortBy] = useState('nexus_status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [nexusFilter, setNexusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayedStates, setDisplayedStates] = useState<StateResult[]>([])

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/api/v1/analyses/${analysisId}/results/states`)
        setStates(response.data.states || [])
      } catch (err) {
        console.error('Failed to fetch states:', err)
        setError('Failed to load state results')
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [analysisId])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = applyFilters(states, { nexusFilter, searchQuery })
    let sorted = sortStates(filtered, sortBy, sortOrder)
    setDisplayedStates(sorted)
  }, [states, sortBy, sortOrder, nexusFilter, searchQuery])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading state results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          State-by-State Results
        </h3>
        <div className="text-sm text-gray-600">
          {displayedStates.length} of {states.length} states
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search states..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={nexusFilter} onValueChange={setNexusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="has_nexus">Has Nexus</SelectItem>
            <SelectItem value="approaching">Approaching</SelectItem>
            <SelectItem value="no_nexus">No Nexus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('state_name')}
                  className="flex items-center gap-1 font-medium hover:text-gray-900"
                >
                  State <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('nexus_status')}
                  className="flex items-center gap-1 font-medium hover:text-gray-900"
                >
                  Nexus Status <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('total_sales')}
                  className="flex items-center gap-1 ml-auto font-medium hover:text-gray-900"
                >
                  Total Sales <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('estimated_liability')}
                  className="flex items-center gap-1 ml-auto font-medium hover:text-gray-900"
                >
                  Est. Liability <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStates.map((state) => (
              <TableRow key={state.state_code} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {state.state_name} ({state.state_code})
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNexusColor(state.nexus_status)}`}>
                    {getNexusStatusLabel(state.nexus_status)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ${state.total_sales.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${state.estimated_liability.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/analysis/${analysisId}/states/${state.state_code}`}
                  >
                    View Details →
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {displayedStates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No states found matching your filters
        </div>
      )}
    </div>
  )
}
```

### Testing:
- Component compiles without errors
- Can be imported and used in other pages
- All filters and sorting work correctly

### Commit:
```bash
git add frontend/components/analysis/StateTable.tsx
git commit -m "feat(frontend): extract StateTable into reusable component

- Create standalone StateTable component
- Support embedded and standalone modes
- Include filters, sorting, and search
- Maintain all existing functionality from states page"
```

---

## Task 4: Embed StateTable in Results Page

**Goal:** Add state table to bottom of results page and remove unnecessary buttons

**Files:**
- Modify: `frontend/app/analysis/[id]/results/page.tsx`

### Step 1: Add import

```tsx
import StateTable from '@/components/analysis/StateTable'
```

### Step 2: Remove unnecessary button handlers

Delete these functions:
- `handleStartNew` (lines 142-144)
- Keep `handleBack` and `handleCalculate`

### Step 3: Replace action buttons section (lines 374-409)

Replace entire section with:

```tsx
{/* Subtle back link */}
<div className="mb-6">
  <Button
    onClick={handleBack}
    variant="ghost"
    size="sm"
    className="text-gray-600 hover:text-gray-900"
  >
    ← Back to Mapping
  </Button>
</div>

{/* Embedded State Table */}
{calculationStatus === 'calculated' && (
  <div className="mb-6">
    <StateTable analysisId={analysisId} embedded={true} />
  </div>
)}

{/* Single action button at bottom */}
<div className="flex justify-end">
  <Button
    disabled
    variant="outline"
    size="lg"
  >
    Generate Report (Coming Soon)
  </Button>
</div>
```

### Step 4: Remove stateResults fetch (optional cleanup)

Since StateTable handles its own data fetching, you can optionally remove:
- `stateResults` state (line 62)
- `fetchStateResults` function (lines 129-136)
- Call to `fetchStateResults` in `fetchResults` (line 122)

But this is optional - leaving it won't cause issues.

### Testing:
1. Navigate to results page
2. Verify state table appears at bottom
3. Verify filters/sorting work
4. Verify only "Generate Report" button shows at bottom
5. Verify "Back to Mapping" link appears subtle at top

### Commit:
```bash
git add frontend/app/analysis/[id]/results/page.tsx
git commit -m "feat(frontend): embed state table in results page

- Import and embed StateTable component at bottom
- Remove unnecessary buttons (Recalculate, Start New, View Table)
- Keep only Generate Report button
- Add subtle Back to Mapping link at top
- Clean up unused handlers and state"
```

---

## Task 5: Clean Up and Delete Old Files

**Goal:** Remove obsolete files and components

**Files to delete:**
- `frontend/app/analysis/[id]/upload/page.tsx` (entire upload page)
- `frontend/components/analysis/DateConfirmationDialog.tsx` (if it exists)

**Files to check for cleanup:**
- Any imports of DateConfirmationDialog
- Any routes pointing to `/upload` page

### Step 1: Search for DateConfirmationDialog usage

```bash
cd frontend
grep -r "DateConfirmationDialog" --include="*.tsx" --include="*.ts"
```

Remove any imports found.

### Step 2: Delete upload page

```bash
rm -rf frontend/app/analysis/[id]/upload
```

### Step 3: Delete date dialog (if exists)

```bash
# Check if it exists first
ls frontend/components/analysis/DateConfirmationDialog.tsx

# If found, delete it
rm frontend/components/analysis/DateConfirmationDialog.tsx
```

### Step 4: Test end-to-end flow

Manual test checklist:
1. ✅ Visit `/analysis/new`
2. ✅ Fill out form and submit
3. ✅ Upload zone appears
4. ✅ Drop CSV file
5. ✅ Confirmation dialog appears with date + mappings
6. ✅ Click "Confirm & Calculate"
7. ✅ Loading overlay shows during calculation
8. ✅ Redirects to results page when complete
9. ✅ Results page shows all data
10. ✅ State table embedded at bottom
11. ✅ Only "Generate Report" button visible
12. ✅ "Back to Mapping" link works

### Step 5: Test edge cases

1. **Low confidence mapping:**
   - Upload CSV with weird column names
   - Verify redirects to mapping page (not confirmation dialog)
   - Complete manual mapping
   - Verify calculation runs

2. **Adjust mappings:**
   - Upload CSV with standard columns
   - Confirmation dialog appears
   - Click "Adjust Mappings"
   - Verify redirects to mapping page
   - Verify can calculate from there

3. **Calculation timeout:**
   - If calculation takes >30 seconds
   - Verify still redirects with message
   - Verify results page handles pending state

### Commit:
```bash
git rm -r frontend/app/analysis/[id]/upload
git rm frontend/components/analysis/DateConfirmationDialog.tsx  # if exists
git commit -m "refactor(frontend): remove obsolete upload page and date dialog

- Delete separate upload page (merged into new analysis)
- Delete DateConfirmationDialog (merged into mapping dialog)
- Remove redundant multi-step flow
- Clean up unused imports"
```

---

## Task 6: Update Documentation

**Files:**
- Update: `README.md` or `00-START-HERE.md`
- Create: `docs/plans/2025-11-09-streamlined-analysis-flow.md` (this file)

### Mark as implemented

Add to design doc:
```markdown
## Implementation Status

**Status:** ✅ Complete (2025-11-09)

**Changes:**
- ✅ Merged new analysis + upload into one page
- ✅ Enhanced confirmation dialog with date range
- ✅ Fixed calculation flow with polling
- ✅ Embedded state table in results page
- ✅ Removed unnecessary action buttons
- ✅ Deleted obsolete upload page and date dialog

**User Impact:**
- 75% reduction in clicks (7 clicks → 2 clicks)
- No more redundant screens
- Faster time to results
- Cleaner, more focused UI

**Testing:** All manual test cases passed
```

### Commit:
```bash
git add docs/plans/2025-11-09-streamlined-analysis-flow.md
git add README.md  # if updated
git commit -m "docs: mark streamlined analysis flow as complete

- Document all implementation changes
- Add testing checklist results
- Update project status"
```

---

## Final Summary

**Total Tasks:** 6
**Estimated Time:** 4-6 hours
**Files Modified:** 4
**Files Created:** 2
**Files Deleted:** 2

**Key Changes:**
1. Enhanced ColumnMappingConfirmationDialog with date range
2. Merged upload into new analysis page
3. Added calculation polling logic
4. Created reusable StateTable component
5. Embedded table in results page
6. Cleaned up unnecessary files and buttons

**User Experience Improvements:**
- **Before:** 7 clicks across 3 screens + 2 popups
- **After:** 2 clicks on 1 screen + 1 popup
- **Time saved:** ~60% faster to results
- **Reduced confusion:** No more redundant information

---

## Execution Ready

This plan is ready to execute. Each task is independent and can be completed sequentially with commits after each step.

**Recommended execution order:**
1. Task 1 (Dialog enhancement) - Foundation
2. Task 3 (Extract StateTable) - Reusable component
3. Task 2 (Merge upload) - Core flow change
4. Task 4 (Embed table) - Results page improvement
5. Task 5 (Cleanup) - Remove old files
6. Task 6 (Documentation) - Finalize

**Would you like to proceed with execution, or would you like to review/adjust the plan first?**
