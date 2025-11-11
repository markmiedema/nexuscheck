# UI Navigation Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create consistent navigation, add breadcrumb trails, and improve accessibility across the Nexus Check frontend

**Architecture:** Build reusable layout components (AppLayout, Breadcrumbs) that wrap all authenticated pages, providing consistent navigation, user context, and visual hierarchy. Follow existing shadcn/ui patterns for consistency.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui components, Lucide icons

---

## Task 1: Create AppLayout Component with Consistent Navigation

**Goal:** Replace inconsistent navigation patterns with a unified AppLayout component

**Files:**
- Create: `frontend/components/layout/AppLayout.tsx`
- Create: `frontend/components/layout/AppNav.tsx`

### Step 1: Create AppNav component with consistent navigation bar

**Create:** `frontend/components/layout/AppNav.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Home, LogOut } from 'lucide-react'

export default function AppNav() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleHome = () => {
    router.push('/dashboard')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Clickable to Dashboard */}
          <button
            onClick={handleHome}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold text-gray-900">Nexus Check</h1>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
              className="hidden sm:flex"
              aria-label="Go to dashboard"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <span className="text-sm text-gray-700 hidden sm:inline">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### Step 2: Create AppLayout component wrapper

**Create:** `frontend/components/layout/AppLayout.tsx`

```tsx
'use client'

import { ReactNode } from 'react'
import AppNav from './AppNav'

interface AppLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export default function AppLayout({ children, maxWidth = '7xl' }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {children}
      </main>
    </div>
  )
}
```

### Step 3: Update dashboard to use AppLayout

**Modify:** `frontend/app/dashboard/page.tsx`

Replace the custom nav and layout structure with AppLayout:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Nexus Check
          </h2>
          <p className="text-gray-600 mb-6">
            You're successfully logged in! This is your dashboard.
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <button
              onClick={() => router.push('/analysis/new')}
              className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                New Analysis
              </h3>
              <p className="text-sm text-gray-600">
                Start a new SALT nexus analysis
              </p>
            </button>

            <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg mb-4">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Recent Analyses
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                View and manage your previous sales tax nexus analyses
              </p>
              <Button
                onClick={() => router.push('/analyses')}
                variant="outline"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                View All Analyses
              </Button>
            </div>

            <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Settings
              </h3>
              <p className="text-sm text-gray-500">
                Manage your account settings (coming soon)
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
```

### Step 4: Update analyses list page to use AppLayout

**Modify:** `frontend/app/analyses/page.tsx`

Add AppLayout wrapper and ProtectedRoute:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listAnalyses, deleteAnalysis, type Analysis } from '@/lib/api/analyses'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-green-500', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle },
}

export default function AnalysesPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [limit] = useState(50)
  const [offset] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [searchTerm])

  async function loadAnalyses() {
    try {
      setLoading(true)
      const data = await listAnalyses({
        limit,
        offset,
        search: searchTerm || undefined,
      })
      setAnalyses(data.analyses)
      setTotalCount(data.total_count)
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(analysisId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete the analysis for "${clientName}"?`)) {
      return
    }

    try {
      setDeleteLoading(analysisId)
      await deleteAnalysis(analysisId)
      await loadAnalyses()
    } catch (error) {
      console.error('Failed to delete analysis:', error)
      alert('Failed to delete analysis. Please try again.')
    } finally {
      setDeleteLoading(null)
    }
  }

  function handleView(analysisId: string) {
    router.push(`/analysis/${analysisId}/results`)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount?: number): string {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Analysis History</CardTitle>
                <CardDescription>
                  View and manage your previous sales tax nexus analyses
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/analysis/new')}>
                <FileText className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 flex items-center gap-2 max-w-md">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No analyses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? 'No analyses match your search.'
                    : 'Get started by creating your first analysis.'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => router.push('/analysis/new')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Analysis
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">States with Nexus</TableHead>
                        <TableHead className="text-right">Est. Liability</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((analysis) => {
                        const statusConfig = STATUS_CONFIG[analysis.status]
                        const StatusIcon = statusConfig.icon

                        return (
                          <TableRow key={analysis.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {analysis.client_company_name}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(analysis.analysis_period_start)} —{' '}
                              {formatDate(analysis.analysis_period_end)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig.color} text-white`}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {analysis.states_with_nexus ?? '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(analysis.total_liability)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-gray-600">
                              {formatDate(analysis.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(analysis.id)}
                                  aria-label={`View analysis for ${analysis.client_company_name}`}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(analysis.id, analysis.client_company_name)
                                  }
                                  disabled={deleteLoading === analysis.id}
                                  aria-label={`Delete analysis for ${analysis.client_company_name}`}
                                >
                                  {deleteLoading === analysis.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Showing {analyses.length} of {totalCount} analyses
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </AppLayout>
    </ProtectedRoute>
  )
}
```

### Step 5: Run TypeScript check

**Run:** `npx tsc --noEmit` from `frontend/` directory

**Expected:** No type errors

### Step 6: Commit Task 1

```bash
git add frontend/components/layout/AppLayout.tsx frontend/components/layout/AppNav.tsx frontend/app/dashboard/page.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add consistent AppLayout with unified navigation

- Create reusable AppLayout component with AppNav
- Clickable logo returns to dashboard
- User email and logout button always visible
- Dashboard button for quick navigation
- Update dashboard and analyses pages to use AppLayout
- Add overflow-x-auto to analyses table for mobile
- Add ARIA labels to icon buttons for accessibility

Addresses HIGH priority items from UI/UX audit"
```

---

## Task 2: Create Breadcrumb Navigation Component

**Goal:** Add visual progress indicator for multi-step analysis workflow

**Files:**
- Create: `frontend/components/layout/Breadcrumbs.tsx`
- Modify: `frontend/components/layout/AppLayout.tsx`

### Step 1: Create Breadcrumbs component

**Create:** `frontend/components/layout/Breadcrumbs.tsx`

```tsx
'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

### Step 2: Update AppLayout to support breadcrumbs

**Modify:** `frontend/components/layout/AppLayout.tsx`

```tsx
'use client'

import { ReactNode } from 'react'
import AppNav from './AppNav'
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs'

interface AppLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl' | 'full'
  breadcrumbs?: BreadcrumbItem[]
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export default function AppLayout({ children, maxWidth = '7xl', breadcrumbs }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {children}
      </main>
    </div>
  )
}
```

### Step 3: Update analysis/new page with breadcrumbs

**Modify:** `frontend/app/analysis/new/page.tsx`

Add AppLayout with breadcrumbs (replace the existing nav and layout structure):

```tsx
// At the top of the file, add import:
import AppLayout from '@/components/layout/AppLayout'

// In the return statement, replace the entire structure:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="4xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New Analysis' },
      ]}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          New Nexus Analysis
        </h2>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Rest of the form content remains the same */}
        {/* ... */}
      </div>
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 4: Update analysis/[id]/upload page with breadcrumbs

**Modify:** `frontend/app/analysis/[id]/upload/page.tsx`

```tsx
// At the top, add import:
import AppLayout from '@/components/layout/AppLayout'

// In the return statement, replace nav and layout:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="5xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New Analysis', href: '/analysis/new' },
        { label: 'Upload Data' },
      ]}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Upload Transaction Data
        </h2>

        {/* Rest of content remains the same */}
        {/* ... */}
      </div>

      {/* DateConfirmationDialog stays at the end */}
      <DateConfirmationDialog
        isOpen={showDateDialog}
        onClose={handleDateDialogClose}
        onConfirm={handleDateDialogClose}
        detectedStart={detectedDates?.start || null}
        detectedEnd={detectedDates?.end || null}
        wasAutoPopulated={detectedDates?.auto_populated || false}
      />
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 5: Update analysis/[id]/mapping page with breadcrumbs

**Modify:** `frontend/app/analysis/[id]/mapping/page.tsx`

```tsx
// Add imports:
import AppLayout from '@/components/layout/AppLayout'

// In return statement:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="7xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New Analysis', href: '/analysis/new' },
        { label: 'Upload Data', href: `/analysis/${analysisId}/upload` },
        { label: 'Column Mapping' },
      ]}
    >
      {/* Rest of content */}
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 6: Update analysis/[id]/results page with breadcrumbs

**Modify:** `frontend/app/analysis/[id]/results/page.tsx`

```tsx
// Add import:
import AppLayout from '@/components/layout/AppLayout'

// In return statement for loading state:
if (loading) {
  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// In main return statement:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="7xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New Analysis', href: '/analysis/new' },
        { label: 'Upload Data', href: `/analysis/${analysisId}/upload` },
        { label: 'Column Mapping', href: `/analysis/${analysisId}/mapping` },
        { label: 'Results' },
      ]}
    >
      {/* Rest of content */}
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 7: Run TypeScript check

**Run:** `npx tsc --noEmit` from `frontend/` directory

**Expected:** No type errors

### Step 8: Commit Task 2

```bash
git add frontend/components/layout/Breadcrumbs.tsx frontend/components/layout/AppLayout.tsx frontend/app/analysis/new/page.tsx frontend/app/analysis/[id]/upload/page.tsx frontend/app/analysis/[id]/mapping/page.tsx frontend/app/analysis/[id]/results/page.tsx
git commit -m "feat: add breadcrumb navigation to analysis workflow

- Create Breadcrumbs component with Lucide icons
- Update AppLayout to accept optional breadcrumbs prop
- Add breadcrumbs to all analysis flow pages
- Shows user progress through multi-step workflow
- Clickable breadcrumbs for easy navigation

Addresses HIGH priority item from UI/UX audit"
```

---

## Task 3: Add Search Debouncing

**Goal:** Prevent excessive API calls from search inputs

**Files:**
- Modify: `frontend/app/analyses/page.tsx`

### Step 1: Add debounce logic to search

**Modify:** `frontend/app/analyses/page.tsx`

Replace the search effect with debounced version:

```tsx
// Update the useEffect for search
useEffect(() => {
  const timer = setTimeout(() => {
    loadAnalyses()
  }, 300) // Wait 300ms after user stops typing

  return () => clearTimeout(timer)
}, [searchTerm])
```

### Step 2: Test the debounce behavior

**Manual Test:**
1. Start dev server: `npm run dev`
2. Navigate to `/analyses`
3. Type quickly in search box
4. Verify API calls only fire 300ms after stopping typing
5. Check browser DevTools Network tab

**Expected:** Fewer API requests, only triggers after 300ms pause

### Step 3: Commit Task 3

```bash
git add frontend/app/analyses/page.tsx
git commit -m "perf: add search debouncing to analyses list

- Add 300ms debounce to search input
- Reduces API calls during fast typing
- Improves performance and reduces backend load

Addresses MEDIUM priority item from UI/UX audit"
```

---

## Task 4: Update Remaining Analysis Pages

**Goal:** Apply AppLayout to all remaining analysis pages for consistency

**Files:**
- Modify: `frontend/app/analysis/[id]/states/page.tsx`
- Modify: `frontend/app/analysis/[id]/states/[stateCode]/page.tsx`

### Step 1: Update states list page

**Modify:** `frontend/app/analysis/[id]/states/page.tsx`

```tsx
// Add import at top:
import AppLayout from '@/components/layout/AppLayout'

// Wrap return in AppLayout:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="7xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
        { label: 'States' },
      ]}
    >
      {/* Existing content */}
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 2: Update state detail page

**Modify:** `frontend/app/analysis/[id]/states/[stateCode]/page.tsx`

```tsx
// Add import:
import AppLayout from '@/components/layout/AppLayout'

// Wrap return in AppLayout with dynamic breadcrumbs:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="7xl"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
        { label: 'States', href: `/analysis/${analysisId}/states` },
        { label: stateCode },
      ]}
    >
      {/* Existing content */}
    </AppLayout>
  </ProtectedRoute>
)
```

### Step 3: Run TypeScript check

**Run:** `npx tsc --noEmit` from `frontend/` directory

**Expected:** No type errors

### Step 4: Commit Task 4

```bash
git add frontend/app/analysis/[id]/states/page.tsx frontend/app/analysis/[id]/states/[stateCode]/page.tsx
git commit -m "feat: add AppLayout to state detail pages

- Update states list and state detail pages
- Add breadcrumb navigation
- Consistent layout across all analysis pages

Completes navigation consistency improvements"
```

---

## Task 5: Documentation Updates

**Goal:** Document the new layout components and patterns

**Files:**
- Create: `frontend/components/layout/README.md`
- Modify: `docsplans/UI_UX_AUDIT_2025-11-08.md`

### Step 1: Create layout components README

**Create:** `frontend/components/layout/README.md`

```markdown
# Layout Components

Reusable layout components for consistent navigation and structure across the Nexus Check.

## Components

### AppLayout

Main layout wrapper for all authenticated pages. Provides:
- Consistent navigation bar with AppNav
- User context (email, logout)
- Optional breadcrumb navigation
- Responsive container width

**Usage:**

\`\`\`tsx
import AppLayout from '@/components/layout/AppLayout'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Current Page' },
        ]}
      >
        <div>Your page content</div>
      </AppLayout>
    </ProtectedRoute>
  )
}
\`\`\`

**Props:**

- `children` (ReactNode, required) - Page content
- `maxWidth` (string, optional) - Container max-width class. Options: sm, md, lg, xl, 2xl, 4xl, 5xl, 7xl, full. Default: 7xl
- `breadcrumbs` (BreadcrumbItem[], optional) - Breadcrumb items to display

**Max-Width Guidelines:**

- `7xl` - List pages, dashboards (default)
- `5xl` - Upload pages with large forms
- `4xl` - Simple forms, detail pages

### AppNav

Navigation bar component. Automatically included in AppLayout.

Features:
- Clickable logo → Dashboard
- Dashboard button (hidden on mobile)
- User email display (hidden on mobile)
- Logout button with icon

**Note:** This component is used internally by AppLayout. You typically don't import it directly.

### Breadcrumbs

Breadcrumb navigation component showing page hierarchy.

**Usage:**

\`\`\`tsx
import Breadcrumbs, { BreadcrumbItem } from '@/components/layout/Breadcrumbs'

const items: BreadcrumbItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analyses', href: '/analyses' },
  { label: 'Details' }, // Last item has no href (current page)
]

<Breadcrumbs items={items} />
\`\`\`

**BreadcrumbItem Interface:**

\`\`\`tsx
interface BreadcrumbItem {
  label: string  // Display text
  href?: string  // Link URL (optional for current page)
}
\`\`\`

## Patterns

### Multi-Step Workflow Breadcrumbs

For analysis creation flow:

\`\`\`tsx
// Step 1: New Analysis
breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis' },
]}

// Step 2: Upload
breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis', href: '/analysis/new' },
  { label: 'Upload Data' },
]}

// Step 3: Mapping
breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis', href: '/analysis/new' },
  { label: 'Upload Data', href: \`/analysis/\${analysisId}/upload\` },
  { label: 'Column Mapping' },
]}

// Step 4: Results
breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis', href: '/analysis/new' },
  { label: 'Upload Data', href: \`/analysis/\${analysisId}/upload\` },
  { label: 'Column Mapping', href: \`/analysis/\${analysisId}/mapping\` },
  { label: 'Results' },
]}
\`\`\`

### Accessibility

All components follow accessibility best practices:
- Proper ARIA labels on navigation elements
- Screen reader text for icon buttons
- Semantic HTML structure
- Keyboard navigation support

## Migration Guide

To update an existing page to use AppLayout:

1. **Remove old nav structure:**
   \`\`\`tsx
   // DELETE this:
   <nav className="bg-white shadow-sm border-b border-gray-200">
     {/* ... nav content ... */}
   </nav>
   <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
     {/* content */}
   </main>
   \`\`\`

2. **Add AppLayout import:**
   \`\`\`tsx
   import AppLayout from '@/components/layout/AppLayout'
   \`\`\`

3. **Wrap content with AppLayout:**
   \`\`\`tsx
   <ProtectedRoute>
     <AppLayout maxWidth="7xl">
       {/* Your page content */}
     </AppLayout>
   </ProtectedRoute>
   \`\`\`

4. **Add breadcrumbs if part of a workflow:**
   \`\`\`tsx
   <AppLayout
     maxWidth="7xl"
     breadcrumbs={[
       { label: 'Dashboard', href: '/dashboard' },
       { label: 'Current Page' },
     ]}
   >
   \`\`\`

## Styling

Components use Tailwind CSS and shadcn/ui design tokens:
- Primary color: Indigo (indigo-600)
- Neutral colors: Gray scale
- Spacing: Consistent with Tailwind defaults
- Typography: Tailwind font classes

## Testing

When adding new pages:
1. Verify navigation bar appears correctly
2. Test logo click → returns to dashboard
3. Test logout button
4. Check breadcrumb links work
5. Verify responsive behavior on mobile
6. Test keyboard navigation
7. Run accessibility audit (Lighthouse)
\`\`\`

### Step 2: Update audit document with completion status

**Modify:** `docsplans/UI_UX_AUDIT_2025-11-08.md`

Add completion notes at the top:

```markdown
# UI/UX Audit - Nexus Check
**Date:** 2025-11-08
**Auditor:** Claude Code
**Scope:** Complete frontend application review
**Status:** HIGH priority items completed 2025-11-08

---

## Implementation Status

### ✅ Completed (2025-11-08)

1. **Consistent AppLayout Component** - DONE
   - Created unified AppNav and AppLayout components
   - Applied to all authenticated pages
   - User email + logout always visible
   - Clickable logo returns to dashboard

2. **Breadcrumb Navigation** - DONE
   - Created Breadcrumbs component
   - Added to all analysis workflow pages
   - Shows user progress through multi-step flows

3. **Search Debouncing** - DONE
   - Added 300ms debounce to analyses search
   - Reduces API calls during fast typing

4. **Table Overflow Fix** - DONE
   - Added overflow-x-auto to analyses table
   - Handles mobile responsiveness

5. **ARIA Labels** - DONE
   - Added aria-labels to icon buttons
   - Added sr-only text for screen readers

### 🟡 Remaining Work

- Replace browser alerts with toast notifications (MEDIUM)
- Standardize button components (MEDIUM)
- Custom confirmation dialogs (LOW)
- Dashboard enhancements (LOW)

---
```

### Step 3: Commit documentation

```bash
git add frontend/components/layout/README.md docsplans/UI_UX_AUDIT_2025-11-08.md
git commit -m "docs: add layout components documentation

- Create comprehensive README for layout components
- Document AppLayout, AppNav, and Breadcrumbs usage
- Add migration guide for existing pages
- Update UI/UX audit with completion status

Completes HIGH priority navigation improvements"
```

---

## Testing Checklist

After completing all tasks, verify:

### Navigation
- [ ] Logo click returns to dashboard from any page
- [ ] Dashboard button works from any page
- [ ] Logout button works and redirects to login
- [ ] User email displays on desktop
- [ ] Navigation is responsive on mobile

### Breadcrumbs
- [ ] Breadcrumbs show on all analysis workflow pages
- [ ] Breadcrumb links navigate correctly
- [ ] Current page shows in bold without link
- [ ] Breadcrumbs are responsive on mobile

### Accessibility
- [ ] Icon buttons have aria-labels
- [ ] Screen reader text present on icon-only buttons
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Run Lighthouse accessibility audit (score > 90)

### Performance
- [ ] Search debouncing works (check Network tab)
- [ ] No excessive API calls during typing
- [ ] Page loads are fast

### Responsive Design
- [ ] Table scrolls horizontally on mobile
- [ ] Navigation adapts to mobile (icons only for logout)
- [ ] Breadcrumbs readable on mobile
- [ ] All pages tested at 375px, 768px, 1024px, 1920px

### TypeScript
- [ ] No type errors: `npx tsc --noEmit`
- [ ] All imports resolve correctly

---

## Summary

**Total Tasks:** 5
**Estimated Time:** 7-11 hours
**Components Created:**
- AppLayout
- AppNav
- Breadcrumbs
- Layout README

**Pages Updated:** 8
- Dashboard
- Analyses list
- Analysis new
- Analysis upload
- Analysis mapping
- Analysis results
- States list
- State detail

**Improvements:**
- ✅ Consistent navigation across all pages
- ✅ Visual progress indicator (breadcrumbs)
- ✅ Better accessibility (ARIA labels)
- ✅ Search performance (debouncing)
- ✅ Mobile responsiveness (table overflow)
- ✅ Comprehensive documentation

---

## Next Steps

After completing this plan, consider:

1. **MEDIUM Priority Items** from audit:
   - Replace `alert()` with toast notifications
   - Standardize button components (use shadcn Button everywhere)

2. **LOW Priority Items**:
   - Custom confirmation dialogs
   - Dashboard statistics widgets

3. **Testing**:
   - Run full accessibility audit
   - User testing of navigation flow
   - Mobile device testing
