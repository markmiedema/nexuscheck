'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import apiClient from '@/lib/api/client'
import { StateResult, StateResultsResponse } from '@/types/states'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  getNexusColor,
  getNexusStatusLabel,
  getNexusTypeLabel,
  getThresholdColor,
  getConfidenceBadge,
  sortStates,
  applyFilters,
} from './helpers'

export default function StateTablePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = params.id

  // Data state
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort state (initialized from URL params)
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'nexus_status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  )
  const [nexusFilter, setNexusFilter] = useState(
    searchParams.get('nexus') || 'all'
  )
  const [registrationFilter, setRegistrationFilter] = useState(
    searchParams.get('registration') || 'all'
  )
  const [confidenceFilter, setConfidenceFilter] = useState(
    searchParams.get('confidence') || 'all'
  )
  // Note: searchQuery is NOT synced to URL (stays ephemeral)
  const [searchQuery, setSearchQuery] = useState('')

  // Computed filtered and sorted states
  const [displayedStates, setDisplayedStates] = useState<StateResult[]>([])

  // Sort handler functions
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const resetSort = () => {
    setSortBy('nexus_status')
    setSortOrder('desc')
  }

  // Fetch state results
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get<StateResultsResponse>(
          `/api/v1/analyses/${analysisId}/results/states`
        )

        setStates(response.data.states)
      } catch (err: any) {
        console.error('Failed to fetch states:', err)

        if (err.response?.status === 404) {
          // Check if it's "no calculation" vs "analysis not found"
          const detail = err.response?.data?.detail || ''
          if (detail.includes('calculation')) {
            setError('no_calculation')
          } else {
            setError('not_found')
          }
        } else {
          setError(err.response?.data?.detail || 'Failed to load state data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [analysisId])

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = states

    // Apply filters
    result = applyFilters(result, {
      nexus: nexusFilter,
      registration: registrationFilter,
      confidence: confidenceFilter,
      search: searchQuery,
    })

    // Apply sorting
    result = sortStates(result, sortBy, sortOrder)

    setDisplayedStates(result)
  }, [states, sortBy, sortOrder, nexusFilter, registrationFilter, confidenceFilter, searchQuery])

  // Update URL params when filters or sort change
  useEffect(() => {
    const params = new URLSearchParams()

    // Add sort params (only if not default)
    if (sortBy !== 'nexus_status') {
      params.set('sort', sortBy)
    }
    if (sortOrder !== 'desc') {
      params.set('order', sortOrder)
    }

    // Add filter params (only if not 'all')
    if (nexusFilter !== 'all') {
      params.set('nexus', nexusFilter)
    }
    if (registrationFilter !== 'all') {
      params.set('registration', registrationFilter)
    }
    if (confidenceFilter !== 'all') {
      params.set('confidence', confidenceFilter)
    }

    // Update URL without full page reload
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname

    window.history.replaceState({}, '', newUrl)
  }, [sortBy, sortOrder, nexusFilter, registrationFilter, confidenceFilter])

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Analyses', href: '/analyses' },
            { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
            { label: 'State Table' },
          ]}
        >
          {/* Header skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Filter bar skeleton */}
          <div className="bg-card rounded-lg border p-4 mb-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Error state - No calculation error (yellow)
  if (error === 'no_calculation') {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Analyses', href: '/analyses' },
            { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
            { label: 'State Table' },
          ]}
        >
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-warning-foreground mb-2">
              Nexus Not Calculated Yet
            </h3>
            <p className="text-warning-foreground mb-4">
              Please calculate nexus results before viewing the state table.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/analysis/${analysisId}/mapping`)}
                className="px-4 py-2 bg-warning text-warning-foreground rounded-md hover:opacity-90"
              >
                Go to Mapping Page
              </button>
              <button
                onClick={() => router.push(`/analysis/${analysisId}/results`)}
                className="px-4 py-2 border border-warning/30 text-warning-foreground rounded-md hover:bg-warning/20"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Error state - Not found error (red)
  if (error === 'not_found') {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Analyses', href: '/analyses' },
            { label: 'State Table' },
          ]}
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-destructive-foreground mb-2">
              Analysis Not Found
            </h3>
            <p className="text-destructive-foreground mb-4">
              This analysis does not exist or you don't have permission to access it.
            </p>
            <button
              onClick={() => router.push('/analyses')}
              className="px-4 py-2 bg-destructive text-white rounded-md hover:opacity-90"
            >
              Go to Analyses
            </button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Error state - Generic error (red) with retry button
  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Analyses', href: '/analyses' },
            { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
            { label: 'State Table' },
          ]}
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-destructive-foreground mb-2">
              Error Loading States
            </h3>
            <p className="text-destructive-foreground mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-destructive text-white rounded-md hover:opacity-90"
              >
                Retry
              </button>
              <button
                onClick={() => router.push(`/analysis/${analysisId}/results`)}
                className="px-4 py-2 border border-destructive/30 text-destructive-foreground rounded-md hover:bg-destructive/20"
              >
                Back to Results
              </button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Main render
  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Analyses', href: '/analyses' },
          { label: 'Analysis Results', href: `/analysis/${analysisId}/results` },
          { label: 'State Table' },
        ]}
      >
        <div className="mb-6">
        <h1 className="text-2xl font-bold text-card-foreground mb-2">
          State-by-State Results
        </h1>
        <p className="text-muted-foreground">
          Showing {displayedStates.length} {displayedStates.length !== states.length ? `of ${states.length}` : ''} states
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Nexus Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-1">
              Nexus Status
            </label>
            <Select value={nexusFilter} onValueChange={setNexusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="has_nexus">Has Nexus</SelectItem>
                <SelectItem value="approaching">Approaching</SelectItem>
                <SelectItem value="no_nexus">No Nexus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registration Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-1">
              Registration
            </label>
            <Select
              value={registrationFilter}
              onValueChange={setRegistrationFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="not_registered">Not Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-1">
              Confidence
            </label>
            <Select
              value={confidenceFilter}
              onValueChange={setConfidenceFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-foreground mb-1">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search state name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Clear Filters Button */}
          {(nexusFilter !== 'all' ||
            registrationFilter !== 'all' ||
            confidenceFilter !== 'all' ||
            searchQuery !== '') && (
            <Button
              variant="outline"
              onClick={() => {
                setNexusFilter('all')
                setRegistrationFilter('all')
                setConfidenceFilter('all')
                setSearchQuery('')
              }}
              className="mb-0"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* State Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[200px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('state')}
              >
                <div className="flex items-center gap-2">
                  State
                  {sortBy === 'state' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('nexus_status')}
              >
                <div className="flex items-center gap-2">
                  Nexus Status
                  {sortBy === 'nexus_status' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center gap-2">
                  Revenue
                  {sortBy === 'revenue' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('threshold')}
              >
                <div className="flex items-center gap-2">
                  Threshold
                  {sortBy === 'threshold' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[150px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('liability')}
              >
                <div className="flex items-center gap-2">
                  Est. Liability
                  {sortBy === 'liability' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('confidence')}
              >
                <div className="flex items-center gap-2">
                  Confidence
                  {sortBy === 'confidence' && (
                    <span className="text-card-foreground">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No states match your filters
                </TableCell>
              </TableRow>
            ) : (
              displayedStates.map((state) => (
                <TableRow
                  key={state.state_code}
                  onClick={() =>
                    router.push(`/analysis/${analysisId}/states/${state.state_code}`)
                  }
                  className="cursor-pointer hover:bg-accent transition-colors group"
                >
                  {/* State Column */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${getNexusColor(
                          state.nexus_status
                        )}`}
                      />
                      <span className="font-medium text-card-foreground">
                        {state.state_name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Nexus Status Column */}
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-card-foreground">
                        {getNexusStatusLabel(state.nexus_status)}
                      </div>
                      {state.nexus_type !== 'none' && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {getNexusTypeLabel(state.nexus_type)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Revenue Column */}
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-card-foreground">
                        ${state.total_sales.toLocaleString()}
                      </div>
                      {state.direct_sales > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Direct: ${state.direct_sales.toLocaleString()}
                        </div>
                      )}
                      {state.marketplace_sales > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Mktp: ${state.marketplace_sales.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Threshold Column */}
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-card-foreground">
                        ${state.threshold.toLocaleString()}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${getThresholdColor(
                          state.threshold_percent
                        )}`}
                      >
                        ({state.threshold_percent}%)
                      </div>
                    </div>
                  </TableCell>

                  {/* Liability Column */}
                  <TableCell>
                    <div className="font-medium text-card-foreground">
                      $
                      {state.estimated_liability.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>

                  {/* Confidence Column */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getConfidenceBadge(
                        state.confidence_level
                      )}`}
                    >
                      {state.confidence_level.charAt(0).toUpperCase() +
                        state.confidence_level.slice(1)}
                    </span>
                  </TableCell>

                  {/* Arrow Column */}
                  <TableCell>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                      →
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Count */}
      {displayedStates.length !== states.length && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {displayedStates.length} of {states.length} states
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={resetSort}
        >
          Reset to Default Sort
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/analysis/${analysisId}/results`)}
        >
          Back to Results
        </Button>
      </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
