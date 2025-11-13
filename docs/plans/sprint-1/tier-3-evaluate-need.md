# Tier 3 Evaluate-Need Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement four features that should be evaluated based on actual usage patterns: virtual scrolling for large tables, request caching with SWR, keyboard shortcuts for power users, and date range picker.

**Architecture:** Add @tanstack/react-virtual for virtualized tables, implement SWR for intelligent request caching, create global keyboard shortcut system with command palette, build date range picker component with presets.

**Tech Stack:** Next.js 14 App Router, SWR (for caching), @tanstack/react-virtual (for virtualization), React Hook Form, TypeScript, Tailwind CSS, cmdk (for command palette)

---

## Task 1: Virtual Scrolling for Transaction Tables (Only if needed)

**Prerequisites:** Measure first - only implement if transaction tables have >200 rows and show performance issues

**Files:**
- Modify: `frontend/components/analysis/TransactionTable.tsx`
- Add dependency: `@tanstack/react-virtual`
- Test: Manual testing with large datasets (500+ transactions)

**Step 1: Install dependencies**

```bash
cd frontend && npm install @tanstack/react-virtual
```

Expected: Package installed successfully

**Step 2: Read current TransactionTable implementation**

```bash
# First, check current implementation
cat frontend/components/analysis/TransactionTable.tsx | head -100
```

**Step 3: Add virtual scrolling to TransactionTable**

In `frontend/components/analysis/TransactionTable.tsx`, add imports:

```typescript
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
```

**Step 4: Implement virtualizer in component**

Replace the table rendering with virtualized version:

```typescript
export function TransactionTable({ transactions }: TransactionTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above and below
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Customer State
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Channel
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized scrollable body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const transaction = transactions[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border hover:bg-accent/50">
                  <div className="text-sm text-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-foreground">
                    {transaction.state}
                  </div>
                  <div className="text-sm text-foreground text-right">
                    ${transaction.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.channel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Test virtual scrolling**

Manual test checklist:
1. Navigate to analysis with >200 transactions
2. Open transaction table
3. Verify smooth scrolling
4. Verify only visible rows are rendered (check DevTools)
5. Scroll to bottom quickly - verify rows load
6. Test browser Ctrl+F search - note limitations
7. Compare performance vs. non-virtualized version

Performance measurement:
1. Open DevTools Performance tab
2. Record scrolling through table
3. Check frame rate (should be 60fps)
4. Check memory usage (should be constant, not growing)

**Step 6: Add fallback for small datasets**

Wrap virtualization with conditional logic:

```typescript
export function TransactionTable({ transactions }: TransactionTableProps) {
  const shouldVirtualize = transactions.length > 200

  if (!shouldVirtualize) {
    // Use simple table rendering for small datasets
    return (
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            {/* Standard table headers */}
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-accent/50">
                {/* Standard table row */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Use virtualized rendering for large datasets
  return (
    // ... virtualized implementation from Step 4
  )
}
```

**Step 7: Commit**

```bash
git add frontend/components/analysis/TransactionTable.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add virtual scrolling for large transaction tables

- Use @tanstack/react-virtual for tables >200 rows
- Maintain 60fps scrolling with thousands of rows
- Fallback to standard rendering for small datasets
- Reduce memory usage for large datasets"
```

---

## Task 2: Request Caching with SWR

**Prerequisites:** Identify frequently-accessed endpoints that would benefit from caching

**Files:**
- Add dependency: `swr`
- Create: `frontend/hooks/useAnalyses.ts`
- Create: `frontend/hooks/useAnalysisResults.ts`
- Modify: `frontend/app/analyses/page.tsx:74-93`
- Test: Manual testing with navigation patterns

**Step 1: Install SWR**

```bash
cd frontend && npm install swr
```

Expected: Package installed successfully

**Step 2: Create SWR hook for analyses list**

Create new file `frontend/hooks/useAnalyses.ts`:

```typescript
import useSWR from 'swr'
import { listAnalyses, type AnalysesListResponse } from '@/lib/api/analyses'

interface UseAnalysesOptions {
  limit?: number
  offset?: number
  search?: string
  status?: string
}

const fetcher = async (key: string, options: UseAnalysesOptions) => {
  return listAnalyses(options)
}

export function useAnalyses(options: UseAnalysesOptions = {}) {
  const key = ['analyses', options.limit, options.offset, options.search, options.status]
    .filter(v => v !== undefined)
    .join('-')

  const { data, error, isLoading, mutate } = useSWR<AnalysesListResponse>(
    [key, options],
    ([_, opts]) => fetcher(key, opts),
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
      revalidateOnReconnect: true, // Refetch when connection restored
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  )

  return {
    analyses: data?.analyses || [],
    totalCount: data?.total_count || 0,
    isLoading,
    isError: error,
    mutate, // Manually trigger refetch
  }
}
```

**Step 3: Create SWR hook for analysis results**

Create new file `frontend/hooks/useAnalysisResults.ts`:

```typescript
import useSWR from 'swr'
import apiClient from '@/lib/api/client'

export function useAnalysisResults(analysisId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    analysisId ? `/api/v1/analyses/${analysisId}` : null,
    async (url: string) => {
      const response = await apiClient.get(url)
      return response.data
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      refreshInterval: 0, // Don't auto-refresh
    }
  )

  return {
    analysis: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
```

**Step 4: Update analyses page to use SWR**

In `frontend/app/analyses/page.tsx`, replace manual fetching with SWR hook:

```typescript
import { useAnalyses } from '@/hooks/useAnalyses'

export default function AnalysesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('search') || '')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: (searchParams.get('sortBy') as SortConfig['column']) || null,
    direction: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc'
  })
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Use SWR hook for data fetching
  const {
    analyses,
    totalCount,
    isLoading: loading,
    isError,
    mutate: refreshAnalyses
  } = useAnalyses({
    limit: 50,
    offset: 0,
    search: debouncedSearchTerm || undefined,
    status: activeTab !== 'all' ? activeTab : undefined
  })

  // Delete handler with cache mutation
  async function handleDelete(analysisId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete the analysis for "${clientName}"?`)) {
      return
    }

    // Store backup for rollback
    const backup = analyses.find(a => a.id === analysisId)
    if (!backup) return

    try {
      // Optimistically update cache
      refreshAnalyses(
        (current) => ({
          analyses: current?.analyses.filter(a => a.id !== analysisId) || [],
          total_count: (current?.total_count || 1) - 1,
          limit: current?.limit || 50,
          offset: current?.offset || 0,
        }),
        false // Don't revalidate immediately
      )

      setDeleteLoading(analysisId)
      await deleteAnalysis(analysisId)

      showSuccess(`Analysis for "${clientName}" deleted successfully`)

      // Revalidate to ensure consistency
      refreshAnalyses()
    } catch (error) {
      // Rollback optimistic update
      refreshAnalyses()
      handleApiError(error, { userMessage: 'Failed to delete analysis' })
    } finally {
      setDeleteLoading(null)
    }
  }

  // ... rest of component
}
```

**Step 5: Test SWR caching behavior**

Manual test checklist:
1. Navigate to `/analyses`
2. Note initial load time
3. Navigate to `/analysis/new`
4. Navigate back to `/analyses`
5. Verify instant load (cached data)
6. Wait 11 seconds (past deduping interval)
7. Refresh page - should use cache first, then update
8. Delete an analysis - verify optimistic update
9. Disconnect network and navigate back/forth
10. Verify cached data still displays
11. Reconnect network - verify data updates

Performance measurement:
1. Open DevTools Network tab
2. Navigate to /analyses - see API call
3. Navigate away and back within 10s
4. Verify NO new API call (dedupe working)
5. Check console - should see SWR cache hits

**Step 6: Add global SWR configuration (optional)**

Create `frontend/app/providers.tsx` for SWR configuration:

```typescript
'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        dedupingInterval: 10000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

Then wrap app in `frontend/app/layout.tsx`:

```typescript
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
```

**Step 7: Commit**

```bash
git add frontend/hooks/useAnalyses.ts frontend/hooks/useAnalysisResults.ts frontend/app/analyses/page.tsx frontend/app/providers.tsx frontend/app/layout.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add request caching with SWR

- Cache frequently-accessed API responses
- Reduce redundant network requests
- Optimistic updates with automatic rollback
- Improve perceived performance
- Smart revalidation on reconnect"
```

---

## Task 3: Keyboard Shortcuts and Command Palette

**Prerequisites:** Determine if power users exist and would use shortcuts

**Files:**
- Add dependency: `cmdk`
- Create: `frontend/components/CommandPalette.tsx`
- Create: `frontend/hooks/useKeyboardShortcuts.ts`
- Modify: `frontend/components/layout/AppLayout.tsx`
- Test: Manual testing with keyboard shortcuts

**Step 1: Install command palette library**

```bash
cd frontend && npm install cmdk
```

Expected: Package installed successfully

**Step 2: Create keyboard shortcuts hook**

Create new file `frontend/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true
        const metaMatch = shortcut.meta ? e.metaKey : true
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        // Check if all conditions match
        const isModifierKey = shortcut.ctrl || shortcut.meta
        const hasRequiredModifier = (shortcut.ctrl && e.ctrlKey) || (shortcut.meta && e.metaKey)

        if (keyMatch && isModifierKey && hasRequiredModifier && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler()
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
```

**Step 3: Create CommandPalette component**

Create new file `frontend/components/CommandPalette.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { FileText, Search, Home, BarChart3, Settings } from 'lucide-react'

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/analyses'))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Go to Analyses</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/analysis/new'))}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>New Analysis</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => {
              // Focus search input if on analyses page
              const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
              if (searchInput) searchInput.focus()
            })}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Analyses</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Step 4: Create Command UI components (if not exist)**

Create `frontend/components/ui/command.tsx`:

```typescript
'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}
```

**Step 5: Add CommandPalette to AppLayout**

In `frontend/components/layout/AppLayout.tsx`:

```typescript
import { CommandPalette } from '@/components/CommandPalette'

export default function AppLayout({ children, maxWidth = '7xl', breadcrumbs }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <CommandPalette />

      {/* Existing navigation and content */}
      {/* ... */}
    </div>
  )
}
```

**Step 6: Add keyboard shortcut hints to UI**

Update the navigation or footer to show available shortcuts:

```typescript
{/* Add to AppLayout footer or help section */}
<div className="text-xs text-muted-foreground">
  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
  </kbd>
  {' + '}
  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
    K
  </kbd>
  {' '}to open command palette
</div>
```

**Step 7: Test keyboard shortcuts**

Manual test checklist:
1. Press Cmd/Ctrl+K - command palette opens
2. Type "new" - "New Analysis" appears
3. Press Enter - navigates to /analysis/new
4. Press Cmd/Ctrl+K again - palette opens
5. Type "dashboard" - "Dashboard" appears
6. Press Escape - palette closes
7. Test on Mac (Cmd) and Windows (Ctrl)
8. Verify shortcuts don't interfere with browser defaults
9. Test with screen reader - verify palette is accessible

**Step 8: Commit**

```bash
git add frontend/components/CommandPalette.tsx frontend/components/ui/command.tsx frontend/hooks/useKeyboardShortcuts.ts frontend/components/layout/AppLayout.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add keyboard shortcuts and command palette

- Cmd/Ctrl+K to open command palette
- Quick navigation to common pages
- Search and action shortcuts
- Improve power user efficiency
- Accessible keyboard-first interface"
```

---

## Task 4: Date Range Picker Component

**Files:**
- Create: `frontend/components/ui/date-range-picker.tsx`
- Modify: `frontend/app/analysis/new/page.tsx` (if date inputs exist)
- Test: Manual testing with date selection

**Step 1: Create DateRangePicker component**

Create new file `frontend/components/ui/date-range-picker.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format, subMonths, subQuarters, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface Preset {
  label: string
  getValue: () => DateRange
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: Preset[]
  placeholder?: string
  className?: string
}

const DEFAULT_PRESETS: Preset[] = [
  {
    label: 'Last 12 months',
    getValue: () => ({
      from: subMonths(new Date(), 12),
      to: new Date()
    })
  },
  {
    label: 'Last quarter',
    getValue: () => {
      const today = new Date()
      const lastQuarter = subQuarters(today, 1)
      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter)
      }
    }
  },
  {
    label: 'Year to date',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date()
    })
  },
  {
    label: 'Last year',
    getValue: () => {
      const lastYear = subMonths(new Date(), 12)
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear)
      }
    }
  },
]

export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  placeholder = 'Select date range',
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const displayText = value.from && value.to
    ? `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
    : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-2 space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              Presets
            </div>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => {
                  const range = preset.getValue()
                  onChange(range)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar - Note: Requires shadcn calendar component */}
          <div className="p-3">
            <div className="text-sm font-medium mb-2">Custom Range</div>
            {/* Placeholder for calendar - implement based on your calendar component */}
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    onChange({ ...value, from: date })
                  }}
                  className="w-full px-2 py-1 border border-input rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    onChange({ ...value, to: date })
                  }}
                  className="w-full px-2 py-1 border border-input rounded text-sm"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Step 2: Install date-fns if not already installed**

```bash
cd frontend && npm install date-fns
```

**Step 3: Use DateRangePicker in forms (example)**

In any page that needs date range selection:

```typescript
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useState } from 'react'

export default function SomePage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  return (
    <div>
      <label>Analysis Period</label>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        placeholder="Select period"
      />
    </div>
  )
}
```

**Step 4: Test date range picker**

Manual test checklist:
1. Click date range picker button
2. Verify popover opens with presets sidebar
3. Click "Last 12 months" - verify dates populate
4. Click "Year to date" - verify correct range
5. Click "Last quarter" - verify previous quarter
6. Select custom dates using inputs
7. Click Apply - verify popover closes
8. Verify selected range displays correctly
9. Test keyboard navigation
10. Test with different screen sizes

**Step 5: Commit**

```bash
git add frontend/components/ui/date-range-picker.tsx frontend/package.json
git commit -m "feat: add date range picker component

- Quick presets for common ranges
- Custom date selection
- Improved UX over separate inputs
- Accessible and keyboard-friendly"
```

---

## Final Steps

**Step 1: Evaluate which features to implement**

Review actual usage data:
- Virtual scrolling: Check transaction count in typical analyses
- SWR caching: Monitor network tab for duplicate requests
- Keyboard shortcuts: Survey users about power user features
- Date range picker: Check if current date inputs cause friction

**Step 2: Run type check**

```bash
cd frontend && npm run type-check
```

Expected: No TypeScript errors

**Step 3: Test implemented features**

Only test features you chose to implement based on evaluation

**Step 4: Final commit**

```bash
git add -A
git commit -m "docs: add Tier 3 evaluate-need improvements implementation plan"
```

---

## Notes for Engineer

### When to Implement These Features

**Virtual Scrolling:**
- ONLY if tables regularly have >200 rows
- ONLY if users report performance issues
- Measure first, optimize second

**SWR Caching:**
- Implement if users navigate back/forth frequently
- Useful for dashboards with real-time updates
- May be overkill for mostly read-once data

**Keyboard Shortcuts:**
- Ask users if they want them
- Power users will request this
- Don't implement "just in case"

**Date Range Picker:**
- Implement if users frequently need preset ranges
- May be overkill if users always select custom dates
- Current separate inputs might be sufficient

### Performance Considerations
- Virtual scrolling has tradeoffs (breaks Ctrl+F, adds complexity)
- SWR adds bundle size (~12KB)
- Command palette adds ~45KB (cmdk library)
- Measure impact vs. benefit

### Accessibility Notes
- Virtual scrolling can break screen reader table navigation
- Command palette must be keyboard accessible
- Date pickers need proper ARIA labels
- Test all features with screen readers

### Bundle Size Impact
- @tanstack/react-virtual: ~8KB
- swr: ~12KB
- cmdk: ~45KB
- date-fns: ~70KB (tree-shakeable)

Consider code splitting for features not used on every page.

---

## Future Considerations (Scope Creep Prevention)

These are advanced features that may never be needed:

### 1. Infinite Scroll / Pagination

**Recommendation:** Add pagination for analyses list

**Why Defer:**
- Most users will have <100 analyses
- Current load-all approach is simpler
- No performance issues observed
- Virtual scrolling handles large lists if needed

**When to Revisit:**
- Users regularly have >500 analyses
- Initial load becomes slow
- Analytics show scrolling to find items

---

### 2. Advanced Query Builder

**Recommendation:** Visual query builder for complex filters

**Why Defer:**
- Current filter UI is sufficient
- Query builders have steep learning curve
- Most users don't need complex queries
- Over-engineering for current use case

**When to Revisit:**
- Power users request advanced filtering
- Analytics show complex filter patterns
- After basic saved presets prove popular

---

### 3. Offline Mode with Service Workers

**Recommendation:** Full offline support with sync

**Why Defer:**
- Tax calculations require server
- Most users have reliable internet
- Adds significant complexity
- Minimal benefit for current use case

**When to Revisit:**
- Users work in low-connectivity environments
- Mobile app development
- After PWA becomes priority

---

### 4. Customizable Dashboard Widgets

**Recommendation:** Drag-and-drop dashboard customization

**Why Defer:**
- No dashboard in current design
- Customization adds UX complexity
- Standard layout works for most users
- Maintenance burden high

**When to Revisit:**
- Power users request customization
- Different user roles need different views
- After analytics show usage patterns

---

### 5. Export/Import Filter Presets

**Recommendation:** Share filter presets between users

**Why Defer:**
- Currently single-user localStorage
- No team/sharing features yet
- Preset sharing has security implications

**When to Revisit:**
- Team collaboration features added
- Multi-user organizations
- Template marketplace concept

---

### 6. Advanced Keyboard Navigation

**Recommendation:** Vim-style keyboard navigation, custom key bindings

**Why Defer:**
- Basic keyboard shortcuts are sufficient
- Vim navigation has steep learning curve
- Most users prefer mouse/touch
- Command palette covers main use cases

**When to Revisit:**
- Power user community requests it
- After basic shortcuts prove popular
- Accessibility audit recommends more shortcuts

