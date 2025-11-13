# Tier 4 Polish Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement nice-to-have polish features that refine the user experience: smart empty states with illustrations, compact date displays, comparison views for analyses, saved filter presets, and loading skeletons that match content.

**Architecture:** Create reusable empty state components with conditional rendering, add date formatting utilities, build comparison view with side-by-side layout, implement filter preset management with localStorage, design skeleton components that match actual content structure.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React (icons), Zustand (for filter presets state management)

---

## Task 1: Smart Empty States with Illustrations

> **Sprint 1 Coordination:** Sprint 1 Days 9-10 will add basic text-based empty states. This task will REPLACE those with illustrated empty state components. Coordinate to ensure Sprint 1 uses simple messages that can be easily upgraded to this EmptyState component.

**Files:**
- Create: `frontend/components/ui/empty-state.tsx`
- Modify: `frontend/app/analyses/page.tsx:358-373`
- Add: Illustrations or use existing icon library
- Test: Manual testing with various empty states

**Step 1: Create EmptyState component**

Create new file `frontend/components/ui/empty-state.tsx`:

```typescript
import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  illustration?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="w-24 h-24 bg-muted/30 rounded-2xl flex items-center justify-center mb-6">
          <Icon className="w-12 h-12 text-muted-foreground/50" />
        </div>
      ) : null}

      {/* Content */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          size="lg"
          className="mt-6"
        >
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Create specialized empty state illustrations**

Create SVG illustrations component `frontend/components/ui/illustrations.tsx`:

```typescript
export function NoAnalysesIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/20"
    >
      {/* Simple document stack illustration */}
      <rect x="40" y="60" width="120" height="100" rx="8" fill="currentColor" opacity="0.3" />
      <rect x="50" y="50" width="120" height="100" rx="8" fill="currentColor" opacity="0.5" />
      <rect x="60" y="40" width="120" height="100" rx="8" fill="currentColor" />

      {/* Lines representing text */}
      <line x1="80" y1="60" x2="150" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="75" x2="140" y2="75" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="90" x2="160" y2="90" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="105" x2="130" y2="105" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function NoResultsIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/20"
    >
      {/* Magnifying glass */}
      <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="8" />
      <line x1="110" y1="110" x2="140" y2="140" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />

      {/* X mark inside magnifying glass */}
      <line x1="65" y1="65" x2="95" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
      <line x1="95" y1="65" x2="65" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function ErrorIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-destructive/30"
    >
      {/* Warning triangle */}
      <path
        d="M100 40 L160 150 L40 150 Z"
        stroke="currentColor"
        strokeWidth="6"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Exclamation mark */}
      <line x1="100" y1="80" x2="100" y2="110" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <circle cx="100" cy="130" r="5" fill="white" />
    </svg>
  )
}
```

**Step 3: Update analyses page empty state**

In `frontend/app/analyses/page.tsx`, replace the empty state (lines 358-373):

```typescript
import { EmptyState } from '@/components/ui/empty-state'
import { NoAnalysesIllustration, NoResultsIllustration } from '@/components/ui/illustrations'
import { FileText, Plus } from 'lucide-react'

// In the component rendering:
) : analyses.length === 0 ? (
  <div className="py-6">
    <EmptyState
      illustration={searchTerm ? <NoResultsIllustration /> : <NoAnalysesIllustration />}
      title={searchTerm ? 'No analyses found' : 'No analyses yet'}
      description={
        searchTerm
          ? `No analyses match "${searchTerm}". Try a different search term.`
          : 'Upload your sales data to get started with automated nexus determination and compliance insights.'
      }
      action={!searchTerm ? {
        label: 'Create Your First Analysis',
        onClick: () => router.push('/analysis/new'),
        icon: Plus
      } : undefined}
    />
  </div>
) : (
```

**Step 4: Add empty states to other pages**

Apply the same pattern to results page, states list, etc.

**Step 5: Test empty states**

Manual test checklist:
1. Navigate to `/analyses` with no analyses
2. Verify illustration appears
3. Verify clear call-to-action button
4. Search for non-existent company
5. Verify "no results" state appears
6. Click "Create First Analysis" - navigates to form
7. Test with different screen sizes
8. Verify illustrations scale properly

**Step 6: Commit**

```bash
git add frontend/components/ui/empty-state.tsx frontend/components/ui/illustrations.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add smart empty states with illustrations

- Custom illustrations for different empty scenarios
- Clear call-to-action buttons
- Contextual messaging based on user state
- Improved first-time user experience"
```

---

## Task 2: Compact Date Display in Tables

**Files:**
- Create: `frontend/lib/utils/dateFormat.ts`
- Modify: `frontend/app/analyses/page.tsx:116-122` and `frontend/app/analyses/page.tsx:438-439`
- Test: Manual testing with various date formats

**Step 1: Create date formatting utilities**

Create new file `frontend/lib/utils/dateFormat.ts`:

```typescript
import { format, isThisYear, formatDistanceToNow, differenceInDays } from 'date-fns'

export function formatCompactDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = differenceInDays(now, date)

  // If within last 7 days, show relative time
  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  // If this year, omit year
  if (isThisYear(date)) {
    return format(date, 'MMM d')
  }

  // Otherwise show short year
  return format(date, 'MMM d, yy')
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  // If same year, show year only once
  if (startYear === endYear) {
    if (isThisYear(startDate)) {
      return `${format(startDate, 'MMM d')} — ${format(endDate, 'MMM d')}`
    }
    return `${format(startDate, 'MMM d')} — ${format(endDate, 'MMM d, yyyy')}`
  }

  // Different years
  return `${format(startDate, 'MMM d, yy')} — ${format(endDate, 'MMM d, yy')}`
}

export function formatQuarter(dateString: string): string {
  const date = new Date(dateString)
  const quarter = Math.floor(date.getMonth() / 3) + 1
  const year = date.getFullYear()

  return `Q${quarter} ${year}`
}

export function formatMonthYear(dateString: string): string {
  const date = new Date(dateString)
  return format(date, 'MMM yyyy')
}
```

**Step 2: Update analyses table to use compact dates**

In `frontend/app/analyses/page.tsx`, import the utilities:

```typescript
import { formatCompactDate, formatDateRange } from '@/lib/utils/dateFormat'
```

Replace the formatDate function (around line 116):

```typescript
// Remove the old formatDate function
// Use the new utilities directly in the table
```

Update the "Period" column (around line 438):

```typescript
<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
  {formatDateRange(analysis.analysis_period_start, analysis.analysis_period_end)}
</TableCell>
```

Update the "Created" column (around line 461):

```typescript
<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
  {formatCompactDate(analysis.created_at)}
</TableCell>
```

**Step 3: Add tooltip for full date on hover**

Wrap compact dates with tooltips:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// In the table cell:
<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        {formatCompactDate(analysis.created_at)}
      </TooltipTrigger>
      <TooltipContent>
        {new Date(analysis.created_at).toLocaleString()}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</TableCell>
```

**Step 4: Test compact date formats**

Manual test checklist:
1. View analyses list
2. Verify recent dates show "2 days ago", "5 hours ago"
3. Verify current year dates show "Jan 15", "Mar 3"
4. Verify old dates show "Jan 15, 23"
5. Hover over dates - verify full timestamp in tooltip
6. Check period ranges display correctly
7. Test with dates spanning multiple years

**Step 5: Commit**

```bash
git add frontend/lib/utils/dateFormat.ts frontend/app/analyses/page.tsx
git commit -m "feat: add compact date display in tables

- Relative dates for recent items
- Shorter format for space efficiency
- Full date on hover tooltip
- Improved table readability"
```

---

## Task 3: Saved Filter Presets

**Files:**
- Create: `frontend/hooks/useFilterPresets.ts`
- Create: `frontend/components/FilterPresetManager.tsx`
- Modify: `frontend/app/analyses/page.tsx`
- Test: Manual testing with saving and loading presets

**Step 1: Create filter presets hook**

Create new file `frontend/hooks/useFilterPresets.ts`:

```typescript
import { useState, useEffect } from 'react'

export interface FilterPreset {
  id: string
  name: string
  filters: {
    search?: string
    status?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }
}

const STORAGE_KEY = 'nexus-check-filter-presets'

export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([])

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPresets(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
    }
  }, [])

  // Save preset
  const savePreset = (name: string, filters: FilterPreset['filters']) => {
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters
    }

    const updated = [...presets, newPreset]
    setPresets(updated)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save preset:', error)
    }

    return newPreset
  }

  // Delete preset
  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id)
    setPresets(updated)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to delete preset:', error)
    }
  }

  // Load preset (returns filters)
  const loadPreset = (id: string): FilterPreset['filters'] | null => {
    const preset = presets.find(p => p.id === id)
    return preset?.filters || null
  }

  return {
    presets,
    savePreset,
    deletePreset,
    loadPreset
  }
}
```

**Step 2: Create FilterPresetManager component**

Create new file `frontend/components/FilterPresetManager.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Star, StarOff, Save, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { useFilterPresets, type FilterPreset } from '@/hooks/useFilterPresets'

interface FilterPresetManagerProps {
  currentFilters: FilterPreset['filters']
  onLoadPreset: (filters: FilterPreset['filters']) => void
}

export function FilterPresetManager({
  currentFilters,
  onLoadPreset
}: FilterPresetManagerProps) {
  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets()
  const [isOpen, setIsOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const handleSave = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim(), currentFilters)
      setPresetName('')
      setShowSaveInput(false)
    }
  }

  const handleLoad = (id: string) => {
    const filters = loadPreset(id)
    if (filters) {
      onLoadPreset(filters)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Star className="h-4 w-4" />
          Presets
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filter Presets</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveInput(!showSaveInput)}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>

          {/* Save new preset */}
          {showSaveInput && (
            <div className="flex gap-2">
              <Input
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="h-8"
              />
              <Button size="sm" onClick={handleSave} className="h-8">
                Save
              </Button>
            </div>
          )}

          {/* Preset list */}
          <div className="space-y-2">
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved presets yet
              </p>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                >
                  <button
                    onClick={() => handleLoad(preset.id)}
                    className="flex-1 text-left text-sm font-medium"
                  >
                    {preset.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePreset(preset.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Common presets */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Quick Filters</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onLoadPreset({ status: 'complete' })}
            >
              Complete Analyses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onLoadPreset({ status: 'draft' })}
            >
              Drafts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onLoadPreset({ sortBy: 'total_liability', sortDir: 'desc' })}
            >
              Highest Liability
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Step 3: Add FilterPresetManager to analyses page**

In `frontend/app/analyses/page.tsx`, add the component:

```typescript
import { FilterPresetManager } from '@/components/FilterPresetManager'

// In the component, add handler:
const handleLoadPreset = (filters: any) => {
  if (filters.search !== undefined) setSearchTerm(filters.search)
  if (filters.status !== undefined) setActiveTab(filters.status)
  if (filters.sortBy && filters.sortDir) {
    setSortConfig({
      column: filters.sortBy,
      direction: filters.sortDir
    })
  }

  // Update URL
  updateURL(filters)
}

// Add to UI (next to search bar, around line 348):
<div className="flex items-center gap-3">
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search by client name..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value)
        updateURL({ search: e.target.value })
      }}
      className="w-full pl-10"
    />
  </div>
  <FilterPresetManager
    currentFilters={{
      search: searchTerm,
      status: activeTab !== 'all' ? activeTab : undefined,
      sortBy: sortConfig.column || undefined,
      sortDir: sortConfig.direction
    }}
    onLoadPreset={handleLoadPreset}
  />
</div>
```

**Step 4: Test filter presets**

Manual test checklist:
1. Navigate to `/analyses`
2. Apply filters (search + status + sort)
3. Click "Presets" button
4. Click "Save" icon
5. Enter "High Risk States"
6. Verify preset saves
7. Clear filters
8. Click "Presets" and load saved preset
9. Verify filters restore correctly
10. Delete a preset - verify it's removed
11. Try quick filters ("Complete Analyses", etc.)
12. Refresh page - verify presets persist

**Step 5: Commit**

```bash
git add frontend/hooks/useFilterPresets.ts frontend/components/FilterPresetManager.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add saved filter presets

- Save frequently-used filter combinations
- Quick access to common filters
- Persistent storage with localStorage
- Delete unwanted presets
- Improve efficiency for repeated workflows"
```

---

## Task 4: Loading Skeletons That Match Content

> **Sprint 1 Coordination:** Sprint 1 Days 9-10 will add basic loading states (simple spinners). This task will REPLACE those with proper skeleton components that match content structure. Coordinate to ensure Sprint 1 loading states are easy to replace with these skeleton variants.

**Files:**
- Create: `frontend/components/ui/skeleton-variants.tsx`
- Modify: `frontend/app/analyses/page.tsx:352-357`
- Test: Manual testing with throttled network

**Step 1: Create specialized skeleton components**

Create new file `frontend/components/ui/skeleton-variants.tsx`:

```typescript
import { Skeleton } from './skeleton'

export function TableRowSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

export function AnalysisTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StateTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-4 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResultsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Summary cards */}
      <SummaryCardsSkeleton />

      {/* Map */}
      <div className="border rounded-lg">
        <Skeleton className="h-96 w-full" />
      </div>

      {/* State table */}
      <StateTableSkeleton />
    </div>
  )
}
```

**Step 2: Update analyses page loading skeleton**

In `frontend/app/analyses/page.tsx`, replace generic skeletons (around line 352):

```typescript
import { AnalysisTableSkeleton } from '@/components/ui/skeleton-variants'

// Replace loading section:
{loading ? (
  <div className="p-6">
    <AnalysisTableSkeleton />
  </div>
) : analyses.length === 0 ? (
  // ... empty state
```

**Step 3: Add summary cards skeleton**

Add skeleton for summary cards at top of page:

```typescript
import { SummaryCardsSkeleton } from '@/components/ui/skeleton-variants'

// Before summary statistics cards (around line 230):
{loading ? (
  <SummaryCardsSkeleton />
) : (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    {/* Actual summary cards */}
  </div>
)}
```

**Step 4: Test loading skeletons**

Manual test with network throttling:
1. Open DevTools > Network tab
2. Set throttling to "Slow 3G"
3. Navigate to `/analyses`
4. Verify skeleton matches actual table layout
5. Verify no layout shift when data loads
6. Check summary cards skeleton
7. Test with fast connection - skeleton should be brief
8. Verify skeleton respects dark mode

**Step 5: Commit**

```bash
git add frontend/components/ui/skeleton-variants.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add content-matching loading skeletons

- Skeletons match actual content structure
- Reduce layout shift on load
- Improved perceived performance
- Consistent loading states across app"
```

---

## Task 5: Comparison View for Multiple Analyses (Bonus)

**Files:**
- Create: `frontend/app/analyses/compare/page.tsx`
- Create: `frontend/components/analysis/ComparisonTable.tsx`
- Modify: `frontend/app/analyses/page.tsx` (add compare selection)
- Test: Manual testing with 2-3 analyses

**Step 1: Add selection state to analyses list**

In `frontend/app/analyses/page.tsx`, add selection state:

```typescript
const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

const toggleSelection = (analysisId: string) => {
  setSelectedForCompare(prev =>
    prev.includes(analysisId)
      ? prev.filter(id => id !== analysisId)
      : [...prev, analysisId].slice(0, 3) // Max 3 for comparison
  )
}
```

**Step 2: Add checkboxes to table rows**

Update table rows with selection checkboxes:

```typescript
<TableRow key={analysis.id} className="group hover:bg-accent/50 transition-colors">
  <TableCell className="px-6 py-4 whitespace-nowrap">
    <input
      type="checkbox"
      checked={selectedForCompare.includes(analysis.id)}
      onChange={() => toggleSelection(analysis.id)}
      className="h-4 w-4 rounded border-input"
    />
  </TableCell>
  {/* Existing cells */}
</TableRow>
```

**Step 3: Add compare button**

Add floating action button when selections exist:

```typescript
{selectedForCompare.length >= 2 && (
  <div className="fixed bottom-6 right-6 z-40">
    <Button
      size="lg"
      onClick={() => {
        const ids = selectedForCompare.join(',')
        router.push(`/analyses/compare?ids=${ids}`)
      }}
      className="shadow-lg"
    >
      Compare {selectedForCompare.length} Analyses
    </Button>
  </div>
)}
```

**Step 4: Create comparison page**

Create new file `frontend/app/analyses/compare/page.tsx`:

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ComparisonTable } from '@/components/analysis/ComparisonTable'

export default function ComparePage() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',') || []
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true)
        const promises = ids.map(id =>
          apiClient.get(`/api/v1/analyses/${id}`)
        )
        const responses = await Promise.all(promises)
        setAnalyses(responses.map(r => r.data))
      } catch (error) {
        console.error('Failed to load analyses:', error)
      } finally {
        setLoading(false)
      }
    }

    if (ids.length > 0) {
      loadAnalyses()
    }
  }, [ids.join(',')])

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <h1 className="text-3xl font-bold mb-6">Compare Analyses</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <ComparisonTable analyses={analyses} />
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}
```

**Step 5: Create ComparisonTable component**

Create new file `frontend/components/analysis/ComparisonTable.tsx`:

```typescript
interface ComparisonTableProps {
  analyses: any[]
}

export function ComparisonTable({ analyses }: ComparisonTableProps) {
  const metrics = [
    { label: 'Total States', key: 'unique_states' },
    { label: 'States with Nexus', key: 'states_with_nexus' },
    { label: 'Total Liability', key: 'total_liability', format: 'currency' },
    { label: 'Total Transactions', key: 'total_transactions' },
    { label: 'Analysis Period', key: 'period', format: 'date-range' },
  ]

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">Metric</th>
            {analyses.map((analysis) => (
              <th key={analysis.id} className="px-6 py-3 text-left font-semibold">
                {analysis.client_company_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {metrics.map((metric) => (
            <tr key={metric.key}>
              <td className="px-6 py-4 font-medium text-muted-foreground">
                {metric.label}
              </td>
              {analyses.map((analysis) => (
                <td key={analysis.id} className="px-6 py-4">
                  {formatMetricValue(analysis, metric)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatMetricValue(analysis: any, metric: any): string {
  const value = analysis[metric.key]

  if (value === null || value === undefined) return '—'

  if (metric.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (metric.format === 'date-range') {
    return `${new Date(analysis.analysis_period_start).toLocaleDateString()} — ${new Date(analysis.analysis_period_end).toLocaleDateString()}`
  }

  return value.toString()
}
```

**Step 6: Test comparison view**

Manual test checklist:
1. Navigate to `/analyses`
2. Select 2-3 analyses via checkboxes
3. Click "Compare" button
4. Verify navigation to comparison page
5. Verify side-by-side comparison table
6. Verify all metrics display correctly
7. Test with different numbers of analyses
8. Verify layout works on mobile

**Step 7: Commit**

```bash
git add frontend/app/analyses/compare/page.tsx frontend/components/analysis/ComparisonTable.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add comparison view for multiple analyses

- Select up to 3 analyses for comparison
- Side-by-side metric comparison
- Helps identify patterns and outliers
- Useful for multi-client management"
```

---

## Final Steps

**Step 1: Run type check**

```bash
cd frontend && npm run type-check
```

Expected: No TypeScript errors

**Step 2: Test all Tier 4 polish features**

Manual test workflow:
1. View empty states in various contexts
2. Check compact date displays
3. Save and load filter presets
4. Verify loading skeletons match content
5. Test comparison view (if implemented)

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: add Tier 4 polish improvements implementation plan"
```

---

## Notes for Engineer

### When to Implement These Features

These are all polish features - nice to have but not critical:

**Smart Empty States:**
- High impact for first-time users
- Relatively low effort
- Recommended to implement

**Compact Dates:**
- Implement if tables feel cramped
- Good for improving scannability
- Low effort, decent impact

**Saved Presets:**
- Only useful for power users with repetitive workflows
- Ask users if they need this
- Medium effort

**Loading Skeletons:**
- Good for perceived performance
- Only matters if loading takes >500ms
- Measure actual load times first

**Comparison View:**
- Only useful for users managing multiple clients
- Complex feature, may not be needed
- Survey users before building

### Performance Considerations
- Empty state illustrations should be SVG (scalable, small)
- Date formatting functions are synchronous and fast
- Filter presets use localStorage (limited to ~5MB)
- Skeletons should render quickly (no complex logic)

### Accessibility Notes
- Empty states need proper heading hierarchy
- Date tooltips should be accessible
- Filter presets need keyboard navigation
- Comparison table needs proper table semantics

### Design Consistency
- Use existing design tokens (colors, spacing)
- Match illustration style to overall app aesthetic
- Keep skeleton colors consistent with theme
- Ensure dark mode compatibility

### Bundle Size Impact
All features use existing dependencies:
- No additional libraries needed
- Total impact: <5KB
- Tree-shakeable utility functions

## Task 6: Number Formatting Utilities (UI Integration)

**Files:**
- Create: `frontend/lib/utils/formatters.ts`
- Modify: `frontend/app/analyses/page.tsx` (use formatters)
- Modify: `frontend/components/analysis/StateTable.tsx` (use formatters)
- Test: Manual testing with various number values

**Step 1: Create formatting utilities**

Create new file `frontend/lib/utils/formatters.ts`:

```typescript
/**
 * Centralized number and currency formatting utilities
 */

export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatCurrencyPrecise(amount: number): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(value / 100)
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num)
}

/**
 * Format large numbers with abbreviated units
 * @example formatLargeNumber(1500000) => "1.5M"
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
```

**Step 2: Update analyses page to use formatters**

In `frontend/app/analyses/page.tsx`, replace inline formatting:

```typescript
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'

// Remove old formatCurrency function (around line 124-132)

// Update summary cards (around line 249):
<p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-3 tabular-nums">
  {formatCurrency(stats.totalLiability, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}
</p>

// Update table cells (around line 456):
<TableCell className="px-6 py-4 whitespace-nowrap text-right">
  {analysis.total_liability ? (
    <span className="text-sm font-semibold text-foreground tabular-nums">
      {formatCurrency(analysis.total_liability)}
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">Not calculated</span>
  )}
</TableCell>
```

**Step 3: Add tabular-nums to all number displays**

Ensure numeric displays use monospace numbers for alignment:

```typescript
// Summary cards
<p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-3 tabular-nums">
  {formatNumber(stats.total)}
</p>

// Table cells with numbers
<span className="text-sm font-semibold text-foreground tabular-nums">
  {analysis.states_with_nexus}
</span>
```

**Step 4: Update StateTable component**

In `frontend/components/analysis/StateTable.tsx`, use formatters for currency and percentages:

```typescript
import { formatCurrency, formatPercent } from '@/lib/utils/formatters'

// Replace inline currency formatting:
<span className="tabular-nums">{formatCurrency(state.total_sales)}</span>
<span className="tabular-nums">{formatCurrency(state.estimated_liability)}</span>

// For percentages:
<span className="tabular-nums">{formatPercent(proximityPercentage)}</span>
```

**Step 5: Test number formatting**

Manual test checklist:
1. Navigate to `/analyses`
2. Verify currency displays with $ symbol
3. Verify large numbers have comma separators
4. Verify decimal places are consistent
5. Check table column alignment - numbers should align right
6. Test with edge cases:
   - $0.00
   - $1,234,567.89
   - Very small decimals (0.01)
7. Verify tabular-nums keeps columns aligned when numbers change

**Step 6: Commit**

```bash
git add frontend/lib/utils/formatters.ts frontend/app/analyses/page.tsx frontend/components/analysis/StateTable.tsx
git commit -m "feat: add centralized number formatting utilities

- Create formatters for currency, numbers, percentages
- Add tabular-nums for column alignment
- Consistent decimal places across app
- Improve readability and professionalism"
```

---

## Task 7: Responsive Card Padding (UI Integration)

**Files:**
- Modify: All Card component usages across the app
- Update: `frontend/components/ui/card.tsx` (default padding)
- Test: Manual testing on mobile and desktop

**Step 1: Audit current card padding**

Search for Card usages:

```bash
grep -r "Card className" frontend/app/ frontend/components/ | grep -v node_modules
```

Look for inconsistent padding (p-4, p-6, p-8, etc.)

**Step 2: Update CardContent default padding**

In `frontend/components/ui/card.tsx`, update CardContent:

```typescript
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-4 sm:p-6 pt-0", className)} 
    {...props} 
  />
))
```

**Step 3: Update explicit Card padding**

In `frontend/app/analyses/page.tsx`, update summary cards (around line 231):

```typescript
// Before:
<div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">

// After:
<div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
```

**Step 4: Update other card usages**

Apply responsive padding to other cards:

```typescript
// Analysis results cards
<Card className="p-4 sm:p-6">
  {/* content */}
</Card>

// State detail cards
<Card className="p-4 sm:p-6">
  {/* content */}
</Card>
```

**Step 5: Test responsive padding**

Manual test checklist:
1. Open Chrome DevTools mobile view (375px)
2. Navigate to `/analyses`
3. Verify cards have compact padding on mobile
4. Verify content feels spacious but not cramped
5. Switch to tablet view (768px) - should use p-6
6. Switch to desktop (1440px) - should use p-6
7. Verify no horizontal scroll on mobile
8. Check that reduced padding doesn't cause touch target issues

**Step 6: Document padding standards**

Add comment to Card component or README:

```typescript
/**
 * Card padding standards:
 * - Mobile: p-4 (16px) - Saves screen space
 * - Desktop: p-6 (24px) - More generous spacing
 * - Use responsive: p-4 sm:p-6
 */
```

**Step 7: Commit**

```bash
git add frontend/components/ui/card.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add responsive card padding

- Reduce padding on mobile (p-4) to save space
- Maintain generous padding on desktop (p-6)
- Update CardContent default to be responsive
- Improve mobile screen utilization"
```

---

## Future Considerations (Scope Creep Prevention)

These are valuable ideas that aren't current priorities but worth revisiting later:

### 1. Comparison View for Multiple Analyses

**Recommendation:** Side-by-side comparison table for 2-3 analyses

**Why Defer:**
- Only useful for users managing multiple clients
- Complex feature requiring significant effort
- No user requests for this feature yet
- Better to validate need first

**When to Revisit:**
- Users explicitly request comparison feature
- Analytics show users switching between analyses frequently
- Multi-client management becomes primary use case

**Implementation Sketch:**
```typescript
// Would add selection checkboxes to analyses table
// Route: /analyses/compare?ids=1,2,3
// Show side-by-side metric comparison
```

---

### 2. Staggered List Animations

**Recommendation:** Animate table rows with stagger effect on load

**Why Defer:**
- Can feel gimmicky if overdone
- Performance impact on large tables
- May annoy users who load page frequently
- Novelty wears off quickly

**When to Revisit:**
- After implementing virtual scrolling (performance safe)
- If app feels too static in user testing
- As part of coordinated animation system

**Note:** Keep subtle (50ms delay max, fade-in only).

---

### 3. Enhanced Group Hover Visibility

**Recommendation:** Always show row actions but muted

**Why Defer:**
- Current hover-to-reveal works well
- Always-visible actions add visual clutter
- Mobile already shows actions (no hover)
- No user complaints about discoverability

**When to Revisit:**
- User testing shows actions are hard to find
- Analytics show low action button usage
- Accessibility audit recommends visible actions

**Options to Consider:**
- Opacity-based reveal (current approach)
- Small hint dot on hover-capable rows
- Show on focus-within for keyboard users

---

### 4. Quarter-Based Date Display

**Recommendation:** Show "Q4 2023" instead of date ranges where applicable

**Already Partially Implemented:** Tier 4, Task 2 includes this

**Additional Enhancement:**
- Auto-detect quarter boundaries in date ranges
- Fall back to month range if not exact quarter
- Add tooltip with exact dates

**When to Add:**
- After basic compact dates are working
- If users frequently work with quarterly data
- If analytics show Q1/Q2/Q3/Q4 patterns

---

### 5. Loading State Variants

**Recommendation:** Different skeleton styles for different content types

**Why Defer:**
- Current skeleton approach works
- Over-specialized skeletons are maintenance burden
- Generic skeletons are more flexible
- Diminishing returns on precision

**When to Revisit:**
- If layout shift remains an issue after basic skeletons
- When building design system with skeleton library
- If users complain about loading states

---

### 6. Advanced Number Formatting

**Recommendation:** Smart rounding, compact notation (1.5M vs 1,500,000)

**Partially Implemented:** formatCompactNumber and formatLargeNumber in Task 6

**Additional Features:**
- Smart rounding based on magnitude
- Locale-aware formatting (future international support)
- Cryptocurrency/alternative currency support

**When to Add:**
- International expansion requires locale support
- Very large numbers become common
- After basic formatters are stable

---

### 7. Card Shadow Standardization

**Recommendation:** Audit and standardize elevation system

**Why Defer:**
- Current shadows work fine
- No custom shadow classes to clean up (verified)
- Consistent use of shadow-sm, shadow-md
- Low impact on user experience

**When to Revisit:**
- During design system formalization
- If shadows become visually inconsistent
- When brand refresh requires elevation updates

**Note:** Current usage is already fairly consistent.

---

## Updated Implementation Timeline

With UI integration, Tier 4 now includes:

**Week 1 (Days 1-2):**
- Task 1: Smart Empty States
- Task 6: Number Formatting Utilities (NEW)
- Task 7: Responsive Card Padding (NEW)

**Week 2 (Days 3-4):**
- Task 2: Compact Date Display
- Task 3: Saved Filter Presets

**Week 3 (Day 5):**
- Task 4: Loading Skeletons
- Task 5: Comparison View (optional)

**Total Effort:** 2-4 days (was 2-4 days, unchanged)

The UI additions are lightweight and fit within existing timeline.

---

## Notes for Engineer

### Number Formatting Best Practices
- Always use `tabular-nums` for table columns
- Consistent decimal places (0 for counts, 2 for money)
- Include currency symbol ($) for all money values
- Use locale-appropriate separators (commas in US)

### Responsive Design Considerations
- Test at 375px (iPhone SE) minimum
- Verify no horizontal scroll
- Check that reduced padding doesn't harm usability
- Ensure touch targets remain 44px minimum

### Performance Notes
- Number formatters are fast (native Intl API)
- Responsive padding has zero performance impact
- Compact dates reduce visual clutter, improve scanning

### Accessibility
- Tabular numbers improve readability for dyslexic users
- Responsive padding maintains touch target sizes
- Currency symbols provide context for screen readers
- Number formatting should use proper locale

