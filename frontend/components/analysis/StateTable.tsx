'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import apiClient from '@/lib/api/client'
import { getStateDetail, StateDetailResponse } from '@/lib/api'
import { queryKeys } from '@/lib/api/queryKeys'
import { StateResult } from '@/types/states'
import { Analysis } from '@/lib/api/analyses'
import { generateNexusExcelExport, generateExportFilename } from '@/lib/export/nexusExcelExport'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Download,
  FileCheck,
} from 'lucide-react'
import {
  getNexusStatusLabel,
} from '@/app/analysis/[id]/states/helpers'
import { StateQuickViewModal } from './StateQuickViewModal'
import { StateTableSection } from './StateTableSection'
import { StateTableRow } from './StateTableRow'
import { StateTableHeader, SortColumn } from './StateTableHeader'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { useRegistrations } from '@/hooks/queries'
import { US_STATE_CODES } from '@/lib/constants/states'

interface StateTableProps {
  analysisId: string
  embedded?: boolean
  refreshTrigger?: number
  companyName?: string
  clientId?: string  // If provided, registrations are stored on client; otherwise on analysis
  onRegistrationsChange?: () => void | Promise<void>  // Called when registrations change
}

type SortConfig = {
  column: SortColumn
  direction: 'asc' | 'desc'
}

type Density = 'compact' | 'comfortable' | 'spacious'

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`
}

// Helper function to group states by priority
// preserveOrder: if true, keeps the input order (for user-applied sorting)
const groupStatesByPriority = (states: StateResult[], preserveOrder = false) => {
  const hasNexus: StateResult[] = []
  const approaching: StateResult[] = []
  const salesNoNexus: StateResult[] = []
  const noSales: StateResult[] = []

  states.forEach(state => {
    if (state.nexus_status === 'has_nexus') {
      hasNexus.push(state)
    } else if (state.nexus_status === 'approaching') {
      approaching.push(state)
    } else if (state.total_sales > 10000) {
      // Sales > $10k but no nexus
      salesNoNexus.push(state)
    } else {
      // No sales or very minimal sales
      noSales.push(state)
    }
  })

  // Only apply default sorting if not preserving user's sort order
  if (!preserveOrder) {
    hasNexus.sort((a, b) => b.estimated_liability - a.estimated_liability)
    approaching.sort((a, b) => b.threshold_percent - a.threshold_percent)
    salesNoNexus.sort((a, b) => b.total_sales - a.total_sales)
    noSales.sort((a, b) => a.state_name.localeCompare(b.state_name))
  }

  return {
    hasNexus,
    approaching,
    salesNoNexus,
    noSales
  }
}

export default function StateTable({ analysisId, embedded = false, refreshTrigger, companyName, clientId, onRegistrationsChange }: StateTableProps) {
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use the registrations hook to manage registered states
  const {
    registeredStates,
    loading: registrationsLoading,
    saving: registrationsSaving,
    toggleRegistration
  } = useRegistrations(analysisId, clientId, { onUpdate: onRegistrationsChange })

  // Query client for prefetching
  const queryClient = useQueryClient()

  // Prefetch state detail data on row hover for instant modal opens
  const prefetchStateDetail = useCallback((stateCode: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.analyses.stateDetail(analysisId, stateCode),
      queryFn: () => getStateDetail(analysisId, stateCode),
      staleTime: 60 * 1000, // Don't refetch if less than 60 seconds old
    })
  }, [queryClient, analysisId])

  // Filters and sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'total_liability',
    direction: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const density: Density = 'comfortable'

  // Quick view modal state
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null)

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
  }, [analysisId, refreshTrigger])

  // Create a Set for quick registered state lookup
  // Defensive: ensure registeredStates is an array before creating Set
  const registeredSet = useMemo(() => {
    const states = Array.isArray(registeredStates) ? registeredStates : []
    return new Set(states)
  }, [registeredStates])

  // Combined filtering and sorting logic
  const displayedStates = useMemo<{
    registered: StateResult[]
    hasNexus: StateResult[]
    approaching: StateResult[]
    salesNoNexus: StateResult[]
    noSales: StateResult[]
  }>(() => {
    let filtered = [...states]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(state =>
        state.state_name.toLowerCase().includes(query) ||
        state.state_code.toLowerCase().includes(query)
      )
    }

    // Helper to get penalties + interest for sorting
    const getPenaltiesAndInterest = (state: StateResult): number => {
      return (state.interest ?? 0) + (state.penalties ?? 0)
    }

    // Helper to get total liability for sorting
    const getTotalLiability = (state: StateResult): number => {
      const baseTax = state.base_tax ?? state.estimated_liability
      const interest = state.interest ?? 0
      const penalties = state.penalties ?? 0
      return baseTax + interest + penalties
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortConfig.column) {
        case 'state':
          comparison = a.state_name.localeCompare(b.state_name)
          break
        case 'threshold':
          comparison = (a.threshold || 0) - (b.threshold || 0)
          break
        case 'gross_sales':
          comparison = a.total_sales - b.total_sales
          break
        case 'taxable_sales':
          comparison = (a.taxable_sales || 0) - (b.taxable_sales || 0)
          break
        case 'exempt_sales':
          comparison = (a.exempt_sales || 0) - (b.exempt_sales || 0)
          break
        case 'exposure_sales':
          comparison = (a.exposure_sales || 0) - (b.exposure_sales || 0)
          break
        case 'tax_liability':
          comparison = (a.base_tax ?? a.estimated_liability) - (b.base_tax ?? b.estimated_liability)
          break
        case 'penalties_interest':
          comparison = getPenaltiesAndInterest(a) - getPenaltiesAndInterest(b)
          break
        case 'total_liability':
          comparison = getTotalLiability(a) - getTotalLiability(b)
          break
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    // Separate registered states first, then group the rest
    const registered = filtered.filter(state => registeredSet.has(state.state_code))
    const unregistered = filtered.filter(state => !registeredSet.has(state.state_code))

    // Group unregistered states by priority
    const grouped = groupStatesByPriority(unregistered, true)

    return {
      registered,
      ...grouped
    }
  }, [states, sortConfig, searchQuery, registeredSet])

  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Callback for when user clicks on a state row
  const handleStateClick = useCallback((code: string, name: string) => {
    setSelectedState({ code, name })
    setQuickViewOpen(true)
  }, [])

  // Export state to track if export is in progress
  const [isExporting, setIsExporting] = useState(false)

  // Comprehensive Excel export with 5 sheets
  const handleExportExcel = useCallback(async () => {
    if (isExporting) return

    // Get all states from the data
    if (states.length === 0) {
      toast.error('No data to export')
      return
    }

    setIsExporting(true)
    const loadingToast = toast.loading('Generating comprehensive Excel report...')

    try {
      // Fetch analysis details for company name and period
      const analysisResponse = await apiClient.get<Analysis>(`/api/v1/analyses/${analysisId}`)
      const analysis = analysisResponse.data

      // Filter to nexus states for fetching detailed data
      const nexusStates = states.filter(
        s => s.nexus_status === 'has_nexus' || s.nexus_type !== 'none'
      )

      // Fetch state details for each nexus state (for tax rates and compliance info)
      const stateDetails = new Map<string, StateDetailResponse>()

      // Fetch state details in parallel (batch of 5 at a time to avoid overwhelming the API)
      const batchSize = 5
      for (let i = 0; i < nexusStates.length; i += batchSize) {
        const batch = nexusStates.slice(i, i + batchSize)
        const detailPromises = batch.map(state =>
          getStateDetail(analysisId, state.state_code)
            .then(detail => ({ code: state.state_code, detail }))
            .catch(() => ({ code: state.state_code, detail: null }))
        )
        const results = await Promise.all(detailPromises)
        results.forEach(({ code, detail }) => {
          if (detail) {
            stateDetails.set(code, detail)
          }
        })
      }

      // Generate the comprehensive Excel export
      const blob = await generateNexusExcelExport({
        analysis,
        states,
        stateDetails
      })

      // Download the file
      const filename = generateExportFilename(analysis.client_company_name || 'Analysis')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss(loadingToast)
      toast.success('Excel report downloaded successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to generate Excel report')
    } finally {
      setIsExporting(false)
    }
  }, [states, analysisId, isExporting])

  if (loading) {
    return <SkeletonTable rows={10} columns={9} />
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          State-by-State Results
        </h3>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Left side - Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input focus:border-ring focus:ring-ring"
          />
        </div>

        {/* Right side - Actions */}
        <div className="flex gap-2">
          {/* Registrations Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-border">
                <FileCheck className="h-4 w-4 mr-2" />
                Registrations
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">State Registrations</h4>
                  <p className="text-xs text-muted-foreground">
                    Select states where you are registered to collect sales tax
                  </p>
                </div>
                {registrationsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/30">
                      {US_STATE_CODES.map(state => (
                        <Badge
                          key={state}
                          variant="outline"
                          className={`cursor-pointer text-xs transition-all ${
                            registeredStates.includes(state)
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-200 shadow-sm'
                              : 'hover:bg-muted hover:border-muted-foreground/50'
                          } ${registrationsSaving ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={() => toggleRegistration(state)}
                        >
                          {state}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {registeredStates.length === 0 ? (
                        'No states registered'
                      ) : (
                        <>
                          <span className="font-medium text-foreground">{registeredStates.length}</span>
                          {' '}state{registeredStates.length !== 1 ? 's' : ''} registered
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Section 0: Registered */}
        <StateTableSection
          title="Registered"
          count={displayedStates.registered.length}
          states={displayedStates.registered}
          defaultExpanded={true}
        >
          <Table>
            <StateTableHeader
              sortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
            />
            <TableBody>
              {displayedStates.registered.map((state) => (
                <StateTableRow
                  key={state.state_code}
                  state={state}
                  density={density}
                  onStateClick={handleStateClick}
                  onMouseEnter={prefetchStateDetail}
                  isRegistered={true}
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>

        {/* Section 1: Has Nexus */}
        <StateTableSection
          title="Has Nexus"
          count={displayedStates.hasNexus.length}
          states={displayedStates.hasNexus}
          defaultExpanded={true}
        >
          <Table>
            <StateTableHeader
              sortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
            />
            <TableBody>
              {displayedStates.hasNexus.map((state) => (
                <StateTableRow
                  key={state.state_code}
                  state={state}
                  density={density}
                  onStateClick={handleStateClick}
                  onMouseEnter={prefetchStateDetail}
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>

        {/* Section 2: Approaching Threshold */}
        <StateTableSection
          title="Approaching Threshold"
          count={displayedStates.approaching.length}
          states={displayedStates.approaching}
          defaultExpanded={true}
        >
          <Table>
            <StateTableHeader
              sortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
            />
            <TableBody>
              {displayedStates.approaching.map((state) => (
                <StateTableRow
                  key={state.state_code}
                  state={state}
                  density={density}
                  onStateClick={handleStateClick}
                  onMouseEnter={prefetchStateDetail}
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>

        {/* Section 3: Sales, but No Nexus */}
        <StateTableSection
          title="Sales, but No Nexus"
          count={displayedStates.salesNoNexus.length}
          states={displayedStates.salesNoNexus}
          defaultExpanded={false}
        >
          <Table>
            <StateTableHeader
              sortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
            />
            <TableBody>
              {displayedStates.salesNoNexus.map((state) => (
                <StateTableRow
                  key={state.state_code}
                  state={state}
                  density={density}
                  onStateClick={handleStateClick}
                  onMouseEnter={prefetchStateDetail}
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>

        {/* Section 4: No Sales */}
        <StateTableSection
          title="No Sales"
          count={displayedStates.noSales.length}
          states={displayedStates.noSales}
          defaultExpanded={false}
        >
          <Table>
            <StateTableHeader
              sortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={handleSort}
            />
            <TableBody>
              {displayedStates.noSales.map((state) => (
                <StateTableRow
                  key={state.state_code}
                  state={state}
                  density={density}
                  onStateClick={handleStateClick}
                  onMouseEnter={prefetchStateDetail}
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{displayedStates.registered.length + displayedStates.hasNexus.length + displayedStates.approaching.length + displayedStates.salesNoNexus.length + displayedStates.noSales.length}</span> of{' '}
          <span className="font-medium text-foreground">{states.length}</span> states
        </p>
      </div>

      {/* Quick View Modal */}
      <StateQuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        analysisId={analysisId}
        stateCode={selectedState?.code || ''}
        stateName={selectedState?.name || ''}
      />
    </div>
  )
}
