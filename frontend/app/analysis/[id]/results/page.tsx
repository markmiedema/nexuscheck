'use client'

import { useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useQueryClient } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import StateTable from '@/components/analysis/StateTable'
import { PhysicalNexusManager } from '@/components/analysis/PhysicalNexusManager'
import { ReportDownload } from '@/components/analysis/ReportDownload'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  useAnalysis,
  useAnalysisResultsSummary,
  useCalculateAnalysis,
  useStateResults,
  useRegistrationsQuery,
  queryKeys,
} from '@/hooks/queries'

// Format ISO date to US format (MM/DD/YYYY)
const formatDateUS = (isoDate: string): string => {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

// Stable empty arrays to avoid creating new references on each render
const EMPTY_REGISTERED_STATES: string[] = []
const EMPTY_STATE_RESULTS: any[] = []

// Lazy load USMap to reduce initial bundle size (saves ~200KB from react-simple-maps)
const USMap = dynamic(() => import('@/components/dashboard/USMap'), {
  loading: () => (
    <div className="bg-muted/30 rounded-md border border-dashed border-border p-12 text-center animate-pulse">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  ),
  ssr: false,
})

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const analysisId = params.id as string

  // Fetch analysis data
  const {
    data: analysis,
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useAnalysis(analysisId)

  // Determine if analysis is complete
  const isComplete = analysis?.status === 'complete'

  // Fetch results summary (only if analysis is complete)
  const {
    data: results,
    isLoading: resultsLoading,
  } = useAnalysisResultsSummary(isComplete ? analysisId : undefined)

  // Fetch state results (only if analysis is complete)
  const {
    data: stateResultsData,
  } = useStateResults(isComplete ? analysisId : undefined)

  const stateResults = stateResultsData?.states || EMPTY_STATE_RESULTS

  // Memoize transformed state data to prevent USMap re-renders
  const mappedStateData = useMemo(() => {
    return stateResults.map((state) => ({
      state_code: state.state_code,
      state_name: state.state_name,
      nexus_status: (state.nexus_status === 'no_nexus' ? 'none' : state.nexus_status) as 'has_nexus' | 'approaching' | 'none',
      nexus_type: state.nexus_type,
      total_sales: state.total_sales,
      estimated_liability: state.estimated_liability,
    }))
  }, [stateResults])

  // Fetch registered states - use client storage if linked, otherwise analysis storage
  const {
    data: registeredStatesData,
  } = useRegistrationsQuery(analysisId, analysis?.client_id || undefined)

  // Normalize registeredStates - the query may return a Client object (from shared cache)
  // instead of string[] when using client storage, so we need to handle both cases
  const registeredStates = useMemo(() => {
    if (!registeredStatesData) return EMPTY_REGISTERED_STATES
    // If it's already an array, use it directly
    if (Array.isArray(registeredStatesData)) return registeredStatesData
    // If it's a Client object, extract registered_states
    if (typeof registeredStatesData === 'object' && 'registered_states' in registeredStatesData) {
      return (registeredStatesData as { registered_states?: string[] }).registered_states || EMPTY_REGISTERED_STATES
    }
    return EMPTY_REGISTERED_STATES
  }, [registeredStatesData])

  // Calculate mutation
  const calculateMutation = useCalculateAnalysis()

  // Derive calculation status from data availability
  const calculationStatus = useMemo(() => {
    if (analysisLoading || resultsLoading) return 'pending'
    if (results) return 'calculated'
    return 'pending'
  }, [analysisLoading, resultsLoading, results])

  const handleCalculate = () => {
    calculateMutation.mutate(analysisId)
  }

  const handleBack = () => {
    router.push(`/analysis/${analysisId}/mapping`)
  }

  const handleRecalculated = useCallback(async () => {
    // Invalidate queries to refetch fresh data after physical nexus changes
    await queryClient.invalidateQueries({ queryKey: queryKeys.analyses.results(analysisId) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.analyses.states(analysisId) })
  }, [queryClient, analysisId])

  const handleRegistrationsUpdate = useCallback(async () => {
    // Refresh registered states when registrations change
    if (analysis?.client_id) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(analysis.client_id) })
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.analyses.registrations(analysisId) })
    }
  }, [queryClient, analysis?.client_id, analysisId])

  // Build summary object from analysis data
  const summary = useMemo(() => {
    if (!analysis) return null
    return {
      company_name: analysis.client_company_name,
      period_start: analysis.analysis_period_start,
      period_end: analysis.analysis_period_end,
      total_transactions: analysis.total_transactions || 0,
      unique_states: analysis.unique_states || 0,
      completed_at: new Date().toISOString(),
      client_id: analysis.client_id || undefined,
    }
  }, [analysis])

  // Generate breadcrumbs based on whether analysis is linked to a client
  const getBreadcrumbs = () => {
    if (summary?.client_id) {
      return [
        { label: 'Clients', href: '/clients' },
        { label: summary.company_name, href: `/clients/${summary.client_id}` },
        { label: 'Analysis Results' },
      ]
    }
    return [
      { label: 'Clients', href: '/clients' },
      { label: 'Analysis Results' },
    ]
  }

  if (analysisLoading) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Clients', href: '/clients' },
            { label: 'Analysis Results' },
          ]}
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading results...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // Error state - show error message if initial load failed
  if (analysisError && !analysis) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Clients', href: '/clients' },
            { label: 'Analysis Results' },
          ]}
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive-foreground mb-2">
              Error Loading Analysis
            </h3>
            <p className="text-sm text-destructive-foreground mb-4">
              {(analysisError as Error)?.message || 'Failed to load analysis summary. Please try refreshing the page.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetchAnalysis()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/clients')} variant="ghost">
                Back to Clients
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={getBreadcrumbs()}
      >
        <ErrorBoundary>
          {/* Header Section */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-card-foreground">
                {calculationStatus === 'calculated' ? 'Analysis Complete' : 'Data Processed - Ready to Calculate'}
              </h2>
              <div className="flex items-center gap-4">
                <ReportDownload
                  analysisId={analysisId}
                  companyName={summary?.company_name || 'Analysis'}
                  hasResults={calculationStatus === 'calculated'}
                />
                <span className="text-sm text-muted-foreground">
                  {summary && new Date(summary.completed_at).toLocaleString()}
                </span>
              </div>
            </div>
            {summary && (
              <div className="text-muted-foreground">
                <p className="text-lg font-medium">{summary.company_name}</p>
                <p className="text-sm">
                  {formatDateUS(summary.period_start || '')} to {formatDateUS(summary.period_end || '')}
                </p>
                <p className="text-sm mt-2">
                  Processed {summary.total_transactions} transactions across {summary.unique_states} states
                </p>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* States with Nexus */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-md hover:shadow-lg transition-all">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">States w/ Nexus</h3>
              <div className="text-4xl font-bold text-foreground mt-3">
                {results ? results.summary.states_with_nexus : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {results ? `out of ${results.summary.total_states_analyzed} analyzed` : 'Run calculation to see results'}
              </p>
            </div>

            {/* Estimated Liability */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-md hover:shadow-lg transition-all">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Est. Liability</h3>
              <div className="text-4xl font-bold text-foreground mt-3">
                {results ? `$${(results.summary.total_estimated_liability || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {results ? 'Total estimated tax liability' : 'Run calculation to see results'}
              </p>
            </div>

            {/* VDA Opportunity */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-md hover:shadow-lg transition-all">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">VDA Opportunity</h3>
              <div className="text-4xl font-bold text-foreground mt-3">
                {results && stateResults.length > 0
                  ? `$${stateResults.reduce((sum, state) => sum + (state.penalties || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {results ? 'Total penalties savings via VDA' : 'Run calculation to see results'}
              </p>
            </div>
          </div>

          {/* US Map */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">United States Nexus Map</h3>
            {calculationStatus === 'calculated' && stateResults.length > 0 ? (
              <>
                <USMap
                  stateData={mappedStateData}
                  analysisId={analysisId}
                  registeredStates={registeredStates}
                />
                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(215 15% 35%)' }}></div>
                    <span className="text-muted-foreground">Registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 71% 40%)' }}></div>
                    <span className="text-muted-foreground">No Nexus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(38 92% 50%)' }}></div>
                    <span className="text-muted-foreground">Approaching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0 60% 45%)' }}></div>
                    <span className="text-muted-foreground">Economic Nexus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(217 32.6% 45%)' }}></div>
                    <span className="text-muted-foreground">Physical Nexus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(289 46% 45%)' }}></div>
                    <span className="text-muted-foreground">Both Nexus Types</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-muted/50 rounded-md border border-border p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">Run Calculation to View Map</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The interactive map will show nexus status by state once calculation is complete.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Nexus Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted/50 rounded-md border border-border p-4">
                <h4 className="text-sm font-medium text-foreground mb-3">By Type:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex justify-between">
                    <span>• Physical Nexus Only:</span>
                    <span className="font-medium">{results ? results.nexus_breakdown.physical_nexus : '—'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Economic Nexus Only:</span>
                    <span className="font-medium">{results ? results.nexus_breakdown.economic_nexus : '—'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Both Physical & Economic:</span>
                    <span className="font-medium">{results ? results.nexus_breakdown.both : '—'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• No Nexus:</span>
                    <span className="font-medium">{results ? results.nexus_breakdown.no_nexus : '—'}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 rounded-md border border-border p-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Approaching Threshold:</h4>
                {results && results.approaching_threshold.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {results.approaching_threshold.map((state) => (
                      <li key={state.state}>
                        {state.state}: ${(state.total_sales || 0).toLocaleString()} / ${(state.threshold || 0).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {results ? 'No states approaching threshold' : 'Run calculation to see results'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Physical Nexus Configuration */}
          <div className="mb-6">
            <PhysicalNexusManager
              analysisId={analysisId}
              clientId={summary?.client_id}
              onRecalculated={handleRecalculated}
            />
          </div>

          {/* Calculate Button */}
          {calculationStatus === 'pending' && (
            <div className="bg-warning/10 rounded-lg border border-warning/20 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-warning-foreground mb-2">
                    Calculation Not Yet Run
                  </h3>
                  <p className="text-sm text-warning-foreground">
                    The calculation should have run automatically. If you're seeing this, click the button to calculate now.
                  </p>
                </div>
                <Button
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {calculateMutation.isPending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Calculating...
                    </>
                  ) : (
                    'Calculate Nexus'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Subtle back link */}
          <div className="mb-6">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Mapping
            </Button>
          </div>

          {/* Embedded State Table */}
          {calculationStatus === 'calculated' && (
            <div className="mb-6">
              <StateTable
                analysisId={analysisId}
                embedded={true}
                companyName={summary?.company_name}
                clientId={summary?.client_id}
                onRegistrationsChange={handleRegistrationsUpdate}
              />
            </div>
          )}
        </ErrorBoundary>
      </AppLayout>
    </ProtectedRoute>
  )
}
