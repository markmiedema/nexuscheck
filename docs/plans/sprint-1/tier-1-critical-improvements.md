# Tier 1 UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement five high-impact UX improvements: URL state persistence, better error messages, form auto-save, action priority summary, and calculation progress feedback.

**Architecture:** Add URL query param synchronization to Next.js router, enhance error handler with user-friendly mappings, implement localStorage-based auto-save with recovery UX, create priority action card component for results page, and build multi-step progress dialog for calculation polling.

**Tech Stack:** Next.js 14 App Router, React Hook Form, Zod, Zustand (optional for state), TypeScript, Tailwind CSS, Sonner (toast notifications)

---

## Task 1: URL State Persistence for Analyses List

**Files:**
- Modify: `frontend/app/analyses/page.tsx:52-213`
- Test: Manual testing (browser refresh, back button, bookmark sharing)

**Step 1: Add useSearchParams and sync URL on filter changes**

In `frontend/app/analyses/page.tsx`, import `useSearchParams` and add URL sync logic:

```typescript
// Add to imports at top of file (around line 4)
import { useRouter, useSearchParams } from 'next/navigation'

// In component (replace lines 52-63):
export default function AnalysesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('search') || '')
  const [limit] = useState(50)
  const [offset] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: (searchParams.get('sortBy') as SortConfig['column']) || null,
    direction: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc'
  })
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'all')
```

**Step 2: Create URL update helper function**

Add this function after state declarations (around line 75):

```typescript
// Add new function to sync URL
const updateURL = (updates: { search?: string; status?: string; sortBy?: string; sortDir?: string }) => {
  const params = new URLSearchParams(searchParams.toString())

  Object.entries(updates).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== 'null') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
  })

  const queryString = params.toString()
  router.push(queryString ? `?${queryString}` : '/analyses', { scroll: false })
}
```

**Step 3: Update search handler to sync URL**

Replace the existing `setSearchTerm` calls (line 344):

```typescript
// Around line 344, replace:
onChange={(e) => setSearchTerm(e.target.value)}

// With:
onChange={(e) => {
  setSearchTerm(e.target.value)
  updateURL({ search: e.target.value })
}}
```

**Step 4: Update tab filter handler to sync URL**

Replace tab `onClick` handlers (lines 279, 289, 299, 309):

```typescript
// Replace all tab onClick handlers like this:
onClick={() => {
  setActiveTab('all')
  updateURL({ status: 'all' })
}}

// Do this for: 'all', 'complete', 'draft', 'processing'
```

**Step 5: Update sort handler to sync URL**

Replace the `handleSort` function (around line 141):

```typescript
const handleSort = (column: SortConfig['column']) => {
  const newDirection = sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc'
  setSortConfig({
    column,
    direction: newDirection
  })
  updateURL({
    sortBy: column || undefined,
    sortDir: newDirection
  })
}
```

**Step 6: Test URL state persistence**

Manual test checklist:
1. Navigate to `/analyses`
2. Search for a company name - verify URL updates with `?search=...`
3. Refresh page - verify search persists
4. Click "Complete" tab - verify URL shows `?status=complete`
5. Sort by "Client" - verify URL shows `?sortBy=client_company_name&sortDir=asc`
6. Refresh page - verify all filters persist
7. Use browser back button - verify filters revert correctly
8. Copy URL and open in new tab - verify state is preserved

**Step 7: Commit**

```bash
git add frontend/app/analyses/page.tsx
git commit -m "feat: add URL state persistence for analyses filters

- Sync search, status filter, and sort to URL params
- Initialize state from URL on page load
- Enable bookmarking and back button navigation"
```

---

## Task 2: Enhanced Error Messages with User-Friendly Mappings

**Files:**
- Modify: `frontend/lib/utils/errorHandler.ts:17-51`
- Test: Manual testing with different error scenarios

**Step 1: Define error message mapping constants**

Add error mapping at top of `frontend/lib/utils/errorHandler.ts` (after imports, before line 3):

```typescript
import { toast } from 'sonner'

// Error message mappings for common HTTP and network errors
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Network errors
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'ECONNREFUSED': 'Cannot connect to server. Please check your connection or try again later.',
  'timeout': 'The request took too long. Please try again.',
  'ERR_NETWORK': 'Network error. Please check your internet connection.',

  // HTTP status codes
  '400': 'Invalid request. Please check your input and try again.',
  '401': 'Your session has expired. Please log in again.',
  '403': 'You do not have permission to perform this action.',
  '404': 'The requested resource was not found.',
  '409': 'This action conflicts with existing data. Please refresh and try again.',
  '422': 'The data provided is invalid. Please check your input.',
  '429': 'Too many requests. Please wait a moment and try again.',
  '500': 'Server error. Our team has been notified.',
  '502': 'Server is temporarily unavailable. Please try again in a moment.',
  '503': 'Service temporarily unavailable. Please try again later.',
}

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again or contact support.'
```

**Step 2: Create helper function to extract error details**

Add this helper function before `handleApiError` (around line 20):

```typescript
/**
 * Extracts error code and message from various error structures
 */
function extractErrorDetails(error: any): { code?: string; message?: string; statusCode?: number } {
  return {
    code: error?.code || error?.response?.data?.code,
    message: error?.response?.data?.detail || error?.response?.data?.message || error?.message,
    statusCode: error?.response?.status
  }
}
```

**Step 3: Update handleApiError to use mappings**

Replace the existing `handleApiError` function (lines 17-51):

```typescript
/**
 * Centralized error handler for API errors
 *
 * @param error - The error object from try-catch
 * @param options - Configuration options
 * @returns The error message string
 *
 * @example
 * try {
 *   await apiCall()
 * } catch (error) {
 *   handleApiError(error, { userMessage: 'Failed to load data' })
 * }
 */
export function handleApiError(
  error: any,
  options?: {
    userMessage?: string
    logToConsole?: boolean
    showToast?: boolean
    preserveDetailedErrors?: boolean
  }
): string {
  const defaultOptions = {
    logToConsole: true,
    showToast: true,
    preserveDetailedErrors: false,
    userMessage: undefined,
  }

  const opts = { ...defaultOptions, ...options }
  const { code, message, statusCode } = extractErrorDetails(error)

  // Determine user-facing error message
  let userFacingMessage: string

  // 1. Try to use backend-provided detailed message if preserveDetailedErrors is true
  if (opts.preserveDetailedErrors && message) {
    userFacingMessage = message
  }
  // 2. Check for status code mapping
  else if (statusCode && ERROR_MESSAGE_MAP[statusCode.toString()]) {
    userFacingMessage = ERROR_MESSAGE_MAP[statusCode.toString()]
  }
  // 3. Check for error code mapping (network errors)
  else if (code && ERROR_MESSAGE_MAP[code]) {
    userFacingMessage = ERROR_MESSAGE_MAP[code]
  }
  // 4. Check for error message mapping (like "Network Error")
  else if (message && ERROR_MESSAGE_MAP[message]) {
    userFacingMessage = ERROR_MESSAGE_MAP[message]
  }
  // 5. Use backend error message if it exists and seems user-friendly
  else if (message && !message.includes('stack') && message.length < 200) {
    userFacingMessage = message
  }
  // 6. Use custom user message if provided
  else if (opts.userMessage) {
    userFacingMessage = opts.userMessage
  }
  // 7. Fall back to default
  else {
    userFacingMessage = DEFAULT_ERROR_MESSAGE
  }

  // Log detailed error info in development
  if (opts.logToConsole && process.env.NODE_ENV !== 'production') {
    console.error('Error Details:', {
      code,
      statusCode,
      message,
      fullError: error,
      userFacingMessage
    })
  }

  // Show toast notification
  if (opts.showToast) {
    toast.error(userFacingMessage)
  }

  return userFacingMessage
}
```

**Step 4: Test error message mappings**

Create a test file to verify error mappings work (this is for manual testing during development):

Manual test scenarios:
1. Disconnect internet and try to load analyses - should show network error
2. Log out in another tab and try an action - should show session expired
3. Trigger a 500 error (if backend allows) - should show friendly server error
4. Trigger a validation error - should show the specific validation message

**Step 5: Update existing error handler calls to use preserveDetailedErrors where appropriate**

In `frontend/app/analyses/page.tsx`, update error handlers (lines 89, 106):

```typescript
// Line 89: Keep detailed errors for analysis loading
} catch (error) {
  handleApiError(error, {
    userMessage: 'Failed to load analyses',
    preserveDetailedErrors: true
  })
}

// Line 106: Keep user-friendly for delete
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to delete analysis' })
}
```

**Step 6: Commit**

```bash
git add frontend/lib/utils/errorHandler.ts frontend/app/analyses/page.tsx
git commit -m "feat: add user-friendly error message mappings

- Map common HTTP status codes to friendly messages
- Map network errors to actionable guidance
- Preserve detailed errors when needed via flag
- Log full error details in development"
```

---

## Task 3: Form Auto-Save for New Analysis Page

**Files:**
- Create: `frontend/hooks/useFormAutoSave.ts`
- Modify: `frontend/app/analysis/new/page.tsx:36-463`
- Test: Manual testing with navigation away and back

**Step 1: Create custom hook for auto-save functionality**

Create new file `frontend/hooks/useFormAutoSave.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { UseFormWatch, UseFormSetValue } from 'react-hook-form'

interface AutoSaveOptions<T> {
  watch: UseFormWatch<T>
  setValue: UseFormSetValue<T>
  storageKey: string
  debounceMs?: number
  fieldsToSave: (keyof T)[]
  onRestore?: (data: Partial<T>) => void
}

export function useFormAutoSave<T extends Record<string, any>>({
  watch,
  setValue,
  storageKey,
  debounceMs = 30000, // 30 seconds default
  fieldsToSave,
  onRestore
}: AutoSaveOptions<T>) {
  const hasMounted = useRef(false)
  const hasRestoredRef = useRef(false)

  // Restore saved draft on mount
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    try {
      const savedDraft = localStorage.getItem(storageKey)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        const savedAt = new Date(draft.savedAt)
        const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60)

        // Only restore if saved within last 24 hours
        if (hoursSince < 24) {
          fieldsToSave.forEach((field) => {
            if (draft[field] !== undefined) {
              setValue(field, draft[field])
            }
          })

          if (onRestore) {
            onRestore(draft)
          }
        } else {
          // Clean up old draft
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, setValue, fieldsToSave, onRestore])

  // Auto-save on interval
  useEffect(() => {
    // Don't start auto-saving until after first mount
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    const timer = setInterval(() => {
      const formData: Partial<T> = {}

      fieldsToSave.forEach((field) => {
        const value = watch(field as any)
        if (value !== undefined && value !== '' && value !== null) {
          formData[field] = value
        }
      })

      // Only save if there's actual data
      if (Object.keys(formData).length > 0) {
        const draft = {
          ...formData,
          savedAt: new Date().toISOString()
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(draft))
        } catch (error) {
          console.error('Failed to save draft:', error)
        }
      }
    }, debounceMs)

    return () => clearInterval(timer)
  }, [watch, storageKey, debounceMs, fieldsToSave])

  // Clear saved draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }

  return { clearDraft }
}
```

**Step 2: Add auto-save to new analysis form**

In `frontend/app/analysis/new/page.tsx`, add imports (around line 3):

```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { handleApiError, showSuccess, showInfo } from '@/lib/utils/errorHandler'
import { useFormAutoSave } from '@/hooks/useFormAutoSave'
```

**Step 3: Initialize auto-save in component**

In the component (after `useForm` initialization, around line 60):

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
  setValue,
} = useForm<ClientSetupForm>({
  resolver: zodResolver(clientSetupSchema),
})

// Add auto-save hook
const [draftRestored, setDraftRestored] = useState(false)

const { clearDraft } = useFormAutoSave({
  watch,
  setValue,
  storageKey: 'nexus-check-new-analysis-draft',
  debounceMs: 30000, // Save every 30 seconds
  fieldsToSave: ['companyName', 'businessType', 'notes'],
  onRestore: (draft) => {
    setDraftRestored(true)
    showInfo(`Restored unsaved changes from ${new Date(draft.savedAt).toLocaleString()}`)
  }
})
```

**Step 4: Clear draft on successful submission**

Update the `onSubmit` function (around line 81) to clear draft on success:

```typescript
const onSubmit = async (data: ClientSetupForm) => {
  setLoading(true)
  setError('')

  try {
    // Create analysis in backend
    const response = await apiClient.post('/api/v1/analyses', {
      company_name: data.companyName,
      // Dates will be auto-detected from CSV upload
      business_type: data.businessType,
      notes: data.notes || '',
      known_registrations: stateRegistrations.map((s) => ({
        state_code: s.stateCode,
        registration_date: s.registrationDate,
      })),
    })

    const newAnalysisId = response.data.id
    setAnalysisId(newAnalysisId)
    setShowUploadZone(true)

    // Clear the saved draft on successful creation
    clearDraft()

    showSuccess('Analysis created! Now upload your transaction data.')
  } catch (err) {
    const errorMsg = handleApiError(err, { userMessage: 'Failed to create analysis' })
    setError(errorMsg)
  } finally {
    setLoading(false)
  }
}
```

**Step 5: Add draft indicator to form**

Add a subtle indicator below the form title (around line 250):

```typescript
<div className="bg-card rounded-lg shadow-sm border border-border p-6">
  <h2 className="text-3xl font-bold text-card-foreground mb-6">
    New Nexus Analysis
  </h2>

  {draftRestored && (
    <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-3">
      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Draft restored. Your changes are being saved automatically every 30 seconds.
      </p>
    </div>
  )}

  {error && (
    <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-4">
      <p className="text-sm text-destructive-foreground">{error}</p>
    </div>
  )}
```

**Step 6: Test auto-save functionality**

Manual test checklist:
1. Navigate to `/analysis/new`
2. Fill in company name and select business type
3. Wait 30 seconds (or modify `debounceMs` to 5000 for testing)
4. Check localStorage in browser dev tools - should see saved draft
5. Navigate away to `/analyses`
6. Navigate back to `/analysis/new`
7. Verify form fields are restored and info toast appears
8. Submit the form successfully
9. Check localStorage - draft should be cleared
10. Fill form partially and wait 25 hours
11. Navigate back - draft should NOT be restored (expired)

**Step 7: Commit**

```bash
git add frontend/hooks/useFormAutoSave.ts frontend/app/analysis/new/page.tsx
git commit -m "feat: add auto-save for new analysis form

- Save form state to localStorage every 30 seconds
- Restore draft on page return with timestamp notification
- Clear draft after successful submission
- Auto-expire drafts older than 24 hours"
```

---

## Task 4: Action Priority Summary for Results Page

**Files:**
- Create: `frontend/components/analysis/ActionPrioritySummary.tsx`
- Modify: `frontend/app/analysis/[id]/results/page.tsx:59-250`
- Test: Manual testing with analysis that has multiple nexus states

**Step 1: Create ActionPrioritySummary component**

Create new file `frontend/components/analysis/ActionPrioritySummary.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ActionItem {
  state: string
  stateName: string
  sales: number
  liability?: number
  threshold?: number
  daysUntilThreshold?: number
}

interface ActionPrioritySummaryProps {
  analysisId: string
  urgentStates: ActionItem[]
  approachingStates: ActionItem[]
  totalLiability: number
}

export function ActionPrioritySummary({
  analysisId,
  urgentStates,
  approachingStates,
  totalLiability
}: ActionPrioritySummaryProps) {
  const router = useRouter()

  const hasUrgent = urgentStates.length > 0
  const hasApproaching = approachingStates.length > 0

  if (!hasUrgent && !hasApproaching) {
    return (
      <Card className="border-l-4 border-l-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            No Immediate Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All states are either below nexus thresholds or already registered.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Action Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent States */}
        {hasUrgent && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-0.5">Urgent</Badge>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {urgentStates.length} {urgentStates.length === 1 ? 'state needs' : 'states need'} immediate registration
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {urgentStates.map(s => s.state).join(', ')} - Already exceeded thresholds
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {urgentStates.slice(0, 3).map((state) => (
                    <Button
                      key={state.state}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => router.push(`/analysis/${analysisId}/states/${state.state}`)}
                    >
                      {state.state} - ${(state.sales || 0).toLocaleString()}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  ))}
                  {urgentStates.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => router.push(`/analysis/${analysisId}/states`)}
                    >
                      +{urgentStates.length - 3} more
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approaching States */}
        {hasApproaching && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mt-0.5 border-yellow-200 dark:border-yellow-800">
                Soon
              </Badge>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {approachingStates.length} {approachingStates.length === 1 ? 'state is' : 'states are'} approaching threshold
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {approachingStates.map(s => s.state).join(', ')} - Monitor and prepare for registration
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {approachingStates.slice(0, 3).map((state) => {
                    const percentOfThreshold = state.threshold
                      ? ((state.sales / state.threshold) * 100).toFixed(0)
                      : '0'
                    return (
                      <Button
                        key={state.state}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push(`/analysis/${analysisId}/states/${state.state}`)}
                      >
                        {state.state} - {percentOfThreshold}% of threshold
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    )
                  })}
                  {approachingStates.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => router.push(`/analysis/${analysisId}/states`)}
                    >
                      +{approachingStates.length - 3} more
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Liability Summary */}
        {totalLiability > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total estimated liability:
              </p>
              <p className="text-lg font-bold text-destructive">
                ${totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full"
            onClick={() => router.push(`/analysis/${analysisId}/states`)}
          >
            View All States
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Add action summary data processing to results page**

In `frontend/app/analysis/[id]/results/page.tsx`, add state for action items (around line 70):

```typescript
const [stateResults, setStateResults] = useState<StateResult[]>([])
const [calculationStatus, setCalculationStatus] = useState<'pending' | 'calculated' | 'error'>('pending')
const [refreshTrigger, setRefreshTrigger] = useState(0)
// Add these new state variables:
const [urgentStates, setUrgentStates] = useState<any[]>([])
const [approachingStates, setApproachingStates] = useState<any[]>([])
```

**Step 3: Process state results to identify action items**

Add this function after the `fetchResults` function (around line 130):

```typescript
const processActionItems = (states: StateResult[]) => {
  const urgent: any[] = []
  const approaching: any[] = []

  states.forEach((state) => {
    if (state.nexus_status === 'has_nexus' && state.estimated_liability > 0) {
      urgent.push({
        state: state.state_code,
        stateName: state.state_name,
        sales: state.total_sales,
        liability: state.estimated_liability
      })
    } else if (state.nexus_status === 'approaching') {
      // Estimate threshold (common thresholds are $100k or $200k)
      const estimatedThreshold = state.total_sales > 100000 ? 200000 : 100000
      approaching.push({
        state: state.state_code,
        stateName: state.state_name,
        sales: state.total_sales,
        threshold: estimatedThreshold
      })
    }
  })

  // Sort urgent states by liability (highest first)
  urgent.sort((a, b) => (b.liability || 0) - (a.liability || 0))

  // Sort approaching states by proximity to threshold (closest first)
  approaching.sort((a, b) => {
    const aProximity = a.threshold ? (a.sales / a.threshold) : 0
    const bProximity = b.threshold ? (b.sales / b.threshold) : 0
    return bProximity - aProximity
  })

  setUrgentStates(urgent)
  setApproachingStates(approaching)
}
```

**Step 4: Call processActionItems when state results are loaded**

Update the `fetchResults` function to process action items (find the `setStateResults` call and add processing):

```typescript
// Around line 125, after setStateResults:
const stateData = statesResponse.data.states || []
setStateResults(stateData)
processActionItems(stateData)
```

**Step 5: Import and render ActionPrioritySummary component**

Add import at top of results page (around line 10):

```typescript
import { VDAModePanel } from '@/components/analysis/VDAModePanel'
import { ActionPrioritySummary } from '@/components/analysis/ActionPrioritySummary'
```

Add the component to the page render (after loading check but before existing content, around line 170):

```typescript
{!loading && summary && calculationStatus === 'calculated' && results && (
  <>
    {/* Add Action Priority Summary at top */}
    <div className="mb-6">
      <ActionPrioritySummary
        analysisId={analysisId}
        urgentStates={urgentStates}
        approachingStates={approachingStates}
        totalLiability={results.summary.total_estimated_liability || 0}
      />
    </div>

    {/* Existing content below */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* ... existing summary cards ... */}
    </div>
```

**Step 6: Test action priority summary**

Manual test checklist:
1. Navigate to a completed analysis with nexus states: `/analysis/{id}/results`
2. Verify ActionPrioritySummary appears at top of results
3. Check "Urgent" section shows states with nexus
4. Check "Approaching" section shows states near threshold
5. Verify total liability is displayed correctly
6. Click on a state button - should navigate to state detail page
7. Click "View All States" - should navigate to states list
8. Test with analysis that has no urgent/approaching states - should show green "No Action Required" card

**Step 7: Commit**

```bash
git add frontend/components/analysis/ActionPrioritySummary.tsx frontend/app/analysis/[id]/results/page.tsx
git commit -m "feat: add action priority summary to results page

- Show urgent states needing immediate registration
- Display approaching states to monitor
- Calculate and display total estimated liability
- Add quick navigation to state details
- Show success message when no action needed"
```

---

## Task 5: Calculation Progress Feedback Dialog

**Files:**
- Create: `frontend/components/analysis/CalculationProgressDialog.tsx`
- Modify: `frontend/app/analysis/new/page.tsx:52-230`
- Test: Manual testing during calculation flow

**Step 1: Create CalculationProgressDialog component**

Create new file `frontend/components/analysis/CalculationProgressDialog.tsx`:

```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, Loader2, Circle, AlertCircle } from 'lucide-react'

type CalculationStep = 'validating' | 'analyzing' | 'calculating' | 'complete' | 'error'

interface CalculationProgressDialogProps {
  isOpen: boolean
  currentStep: CalculationStep
  error?: string
}

const STEPS = [
  { id: 'validating', label: 'Validating data', estimate: '5-10 seconds' },
  { id: 'analyzing', label: 'Analyzing transactions', estimate: '20-40 seconds' },
  { id: 'calculating', label: 'Calculating thresholds', estimate: '10-20 seconds' },
  { id: 'complete', label: 'Complete', estimate: '' },
]

export function CalculationProgressDialog({
  isOpen,
  currentStep,
  error
}: CalculationProgressDialogProps) {
  const getStepStatus = (stepId: string): 'complete' | 'in-progress' | 'pending' | 'error' => {
    if (currentStep === 'error') {
      if (stepId === currentStep) return 'error'
      const currentIndex = STEPS.findIndex(s => s.id === currentStep)
      const stepIndex = STEPS.findIndex(s => s.id === stepId)
      if (stepIndex < currentIndex) return 'complete'
      return 'pending'
    }

    if (stepId === currentStep) return 'in-progress'

    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    const stepIndex = STEPS.findIndex(s => s.id === stepId)

    if (stepIndex < currentIndex) return 'complete'
    return 'pending'
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'complete'
              ? 'Analysis Complete!'
              : currentStep === 'error'
              ? 'Calculation Error'
              : 'Calculating Nexus Analysis'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'complete'
              ? 'Your results are ready to view'
              : currentStep === 'error'
              ? 'An error occurred during calculation'
              : 'This usually takes 30-60 seconds'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentStep === 'error' ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive-foreground">
                {error || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
          ) : (
            STEPS.filter(step => step.id !== 'complete').map((step) => {
              const status = getStepStatus(step.id)

              return (
                <div key={step.id} className="flex items-center gap-3">
                  {status === 'complete' && (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  )}
                  {status === 'in-progress' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  )}
                  {status === 'pending' && (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      status === 'complete' ? 'text-foreground' :
                      status === 'in-progress' ? 'text-primary' :
                      status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {status === 'in-progress' && step.estimate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.estimate}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {currentStep === 'complete' && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-success-foreground">
                Analysis complete! Redirecting to results...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Add calculation progress state to new analysis page**

In `frontend/app/analysis/new/page.tsx`, add imports (around line 13):

```typescript
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'
import { CalculationProgressDialog } from '@/components/analysis/CalculationProgressDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
```

Add state for progress tracking (around line 52):

```typescript
const [showConfirmDialog, setShowConfirmDialog] = useState(false)
const [calculating, setCalculating] = useState(false)
// Add these:
const [calculationStep, setCalculationStep] = useState<'validating' | 'analyzing' | 'calculating' | 'complete' | 'error'>('validating')
const [calculationError, setCalculationError] = useState('')
```

**Step 3: Update calculation flow with progress steps**

Replace the `handleConfirmCalculation` function (around line 169) with stepped progress:

```typescript
const handleConfirmCalculation = async () => {
  if (!analysisId || !uploadResponse) return

  try {
    setCalculating(true)
    setCalculationError('')
    setShowConfirmDialog(false)
    setCalculationStep('validating')

    // Step 1: Save mappings (Validating)
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

    await apiClient.post(
      `/api/v1/analyses/${analysisId}/validate-and-save`,
      mappingPayload
    )

    // Small delay for UX (show validating step)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 2: Trigger calculation (Analyzing)
    setCalculationStep('analyzing')
    await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)

    // Step 3: Poll for completion (Calculating)
    setCalculationStep('calculating')
    let attempts = 0
    const maxAttempts = 30
    let lastStatus = ''

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

      const statusResponse = await apiClient.get(`/api/v1/analyses/${analysisId}`)
      const status = statusResponse.data.status

      // Update step based on progress (if backend provides status)
      if (status === 'processing' && lastStatus !== 'processing') {
        setCalculationStep('analyzing')
      }
      lastStatus = status

      if (status === 'complete') {
        // Calculation complete!
        setCalculationStep('complete')
        await new Promise(resolve => setTimeout(resolve, 1500)) // Show success for 1.5s
        showSuccess('Analysis complete!')
        router.push(`/analysis/${analysisId}/results`)
        return
      }

      if (status === 'error') {
        setCalculationStep('error')
        setCalculationError('Calculation failed. Please check your data and try again.')
        setCalculating(false)
        return
      }

      attempts++
    }

    // Timeout - redirect anyway with warning
    showSuccess('Calculation started - results may take a moment to appear')
    router.push(`/analysis/${analysisId}/results`)

  } catch (err) {
    const errorMsg = handleApiError(err, { userMessage: 'Failed to process analysis', showToast: false })
    setCalculationStep('error')
    setCalculationError(errorMsg)
    setCalculating(false)
  }
}
```

**Step 4: Replace loading overlay with progress dialog**

Remove the old loading overlay (lines 540-552) and replace with:

```typescript
{/* Calculation Progress Dialog */}
<CalculationProgressDialog
  isOpen={calculating}
  currentStep={calculationStep}
  error={calculationError}
/>
```

**Step 5: Test calculation progress dialog**

Manual test checklist:
1. Navigate to `/analysis/new`
2. Fill in form and upload CSV file
3. Confirm column mappings
4. Watch progress dialog show steps:
   - "Validating data" with spinner
   - "Analyzing transactions" with spinner
   - "Calculating thresholds" with spinner
   - "Complete" with green checkmark
5. Verify redirect to results page after completion
6. Test error scenario (if possible) - should show error state
7. Verify timing feels appropriate (not too fast, not too slow)

**Step 6: Commit**

```bash
git add frontend/components/analysis/CalculationProgressDialog.tsx frontend/app/analysis/new/page.tsx
git commit -m "feat: add calculation progress feedback dialog

- Show multi-step progress during calculation
- Display estimated time for each step
- Visual feedback with icons and colors
- Handle error states gracefully
- Smooth transition to results on completion"
```

---

## Final Steps

**Step 1: Run type check**

```bash
cd frontend && npm run type-check
```

Expected: No TypeScript errors

**Step 2: Test all features end-to-end**

Manual test workflow:
1. Navigate to `/analyses` and test URL persistence (search, filter, sort, refresh)
2. Test error messages (disconnect network, invalid actions)
3. Create new analysis, fill form, navigate away, return - verify auto-save
4. Complete an analysis and verify action priority summary appears
5. Watch calculation progress dialog during calculation

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: add Tier 1 UX improvements implementation plan"
```

---

## Notes for Engineer

### Testing Strategy
- All features require manual testing as they're UI/UX focused
- Test in both light and dark mode
- Test with different screen sizes (mobile, tablet, desktop)
- Test browser compatibility (Chrome, Firefox, Safari)

### Error Handling Philosophy
- Always provide actionable error messages
- Log detailed errors in development, show friendly messages in production
- Never expose technical details to end users unless they're actionable

### Performance Considerations
- Auto-save debounce is set to 30 seconds (adjust if needed)
- URL updates use `scroll: false` to prevent page jumps
- localStorage cleanup for expired drafts prevents accumulation

### Accessibility
- All interactive elements have proper focus states
- Error messages use appropriate ARIA roles
- Progress dialog prevents interaction during calculation
- Color contrast meets WCAG AA standards

### Future Enhancements
- Add keyboard shortcuts (Cmd+K for search)
- Implement optimistic updates for delete operations
- Add virtual scrolling if transaction tables grow large
- Consider SWR/React Query for request caching

---

## Future Considerations (Scope Creep Prevention)

These are valuable ideas related to Tier 1 features that aren't current priorities:

### 1. URL State Compression

**Recommendation:** Compress URL params for complex filter combinations

**Why Defer:**
- Current URL params are readable and shareable
- Only becomes issue with very complex filters
- No current evidence of URL length problems
- Simple approach works for now

**When to Revisit:**
- If URL length exceeds browser limits
- When adding many more filter options
- If URL sharing becomes common use case

**Implementation:**
```typescript
// Would use base64 encoding or URL-safe compression
const compressed = btoa(JSON.stringify(filters))
router.push(`?f=${compressed}`)
```

---

### 2. Server-Side Error Translation

**Recommendation:** Backend returns error codes, frontend translates to messages

**Why Defer:**
- Current approach with message mapping works
- Adds complexity to error handling
- Backend already provides good error messages
- No internationalization requirement yet

**When to Revisit:**
- Multi-language support required
- Backend error messages become inconsistent
- Need for A/B testing error messaging

---

### 3. Auto-Save Conflict Resolution

**Recommendation:** Handle cases where draft and server state conflict

**Why Defer:**
- Single-user app - no concurrent editing
- Simple "last saved wins" is sufficient
- Complex merge logic not needed yet

**When to Revisit:**
- Multi-user collaborative editing
- Long-form content with version history
- Offline-first requirements

---

### 4. Advanced Priority Scoring

**Recommendation:** ML-based urgency scoring for nexus states

**Why Defer:**
- Current threshold-based approach is clear
- ML adds complexity without proven benefit
- Tax rules are deterministic, not probabilistic
- Over-engineering for current scale

**When to Revisit:**
- After gathering significant usage data
- If simple thresholds prove insufficient
- When adding predictive features

---

### 5. Real-Time Calculation Progress

**Recommendation:** WebSocket-based live progress updates

**Why Defer:**
- Polling works fine for current calculation times
- WebSocket adds infrastructure complexity
- No user complaints about progress accuracy

**When to Revisit:**
- Calculations take >2 minutes regularly
- Need to show granular step progress
- After implementing job queue system

**Note:** Polling every 1 second is acceptable for 30-60 second tasks.

