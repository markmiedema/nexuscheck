'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  MoreHorizontal,
  FileText,
  Tag,
  TrendingUp,
  Info,
} from 'lucide-react'
import {
  getNexusStatusLabel,
} from '@/app/analysis/[id]/states/helpers'
import { StateQuickViewModal } from './StateQuickViewModal'
import { StateTableSection } from './StateTableSection'
import { StateTableRow } from './StateTableRow'
import { StateTableHeader } from './StateTableHeader'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SkeletonTable } from '@/components/ui/skeleton-table'

interface StateTableProps {
  analysisId: string
  embedded?: boolean
  refreshTrigger?: number
}

type SortConfig = {
  column: 'state' | 'nexus_status' | 'sales' | 'liability'
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
const groupStatesByPriority = (states: StateResult[]) => {
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

  // Sort each group
  hasNexus.sort((a, b) => b.estimated_liability - a.estimated_liability)
  approaching.sort((a, b) => b.threshold_percent - a.threshold_percent)
  salesNoNexus.sort((a, b) => b.total_sales - a.total_sales)
  noSales.sort((a, b) => a.state_name.localeCompare(b.state_name))

  return {
    hasNexus,
    approaching,
    salesNoNexus,
    noSales
  }
}

export default function StateTable({ analysisId, embedded = false, refreshTrigger }: StateTableProps) {
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'nexus_status',
    direction: 'desc'
  })
  const [nexusFilter, setNexusFilter] = useState('all')
  const [exemptFilter, setExemptFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [density, setDensity] = useState<Density>('comfortable')

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

  // Combined filtering and sorting logic
  const displayedStates = useMemo<{
    hasNexus: StateResult[]
    approaching: StateResult[]
    salesNoNexus: StateResult[]
    noSales: StateResult[]
  }>(() => {
    let filtered = [...states]

    // Apply nexus filter
    if (nexusFilter !== 'all') {
      filtered = filtered.filter(state => state.nexus_status === nexusFilter)
    }

    // Apply exempt sales filter
    if (exemptFilter !== 'all') {
      if (exemptFilter === 'has_exempt') {
        filtered = filtered.filter(state => state.exempt_sales > 0)
      } else if (exemptFilter === 'no_exempt') {
        filtered = filtered.filter(state => state.exempt_sales === 0)
      }
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(state =>
        state.state_name.toLowerCase().includes(query) ||
        state.state_code.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortConfig.column) {
        case 'state':
          comparison = a.state_name.localeCompare(b.state_name)
          break
        case 'nexus_status':
          const statusOrder = { has_nexus: 3, approaching: 2, no_nexus: 1 }
          comparison = statusOrder[a.nexus_status] - statusOrder[b.nexus_status]
          break
        case 'sales':
          comparison = a.total_sales - b.total_sales
          break
        case 'liability':
          comparison = a.estimated_liability - b.estimated_liability
          break
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    // Return grouped states instead of flat array
    return groupStatesByPriority(filtered)
  }, [states, sortConfig, nexusFilter, exemptFilter, searchQuery])

  const handleSort = useCallback((column: SortConfig['column']) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const getSortIcon = useCallback((column: SortConfig['column']) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-4 w-4 text-foreground" />
      : <ChevronDown className="h-4 w-4 text-foreground" />
  }, [sortConfig])

  // Callback for when user clicks on a state row
  const handleStateClick = useCallback((code: string, name: string) => {
    setSelectedState({ code, name })
    setQuickViewOpen(true)
  }, [])

  // Export state results to CSV
  const handleExportCSV = useCallback(() => {
    // Combine all displayed states in priority order
    const allDisplayed = [
      ...displayedStates.hasNexus,
      ...displayedStates.approaching,
      ...displayedStates.salesNoNexus,
      ...displayedStates.noSales
    ]

    if (allDisplayed.length === 0) {
      return
    }

    // CSV headers
    const headers = [
      'State',
      'State Code',
      'Nexus Status',
      'Nexus Type',
      'Gross Sales',
      'Taxable Sales',
      'Exempt Sales',
      'Direct Sales',
      'Marketplace Sales',
      'Threshold',
      'Threshold %',
      'Estimated Liability',
      'Confidence Level'
    ]

    // Build CSV rows
    const rows = allDisplayed.map(state => [
      state.state_name,
      state.state_code,
      state.nexus_status === 'has_nexus' ? 'Has Nexus' :
        state.nexus_status === 'approaching' ? 'Approaching' : 'No Nexus',
      state.nexus_type === 'none' ? 'None' :
        state.nexus_type === 'physical' ? 'Physical' :
        state.nexus_type === 'economic' ? 'Economic' : 'Both',
      state.total_sales.toFixed(2),
      state.taxable_sales.toFixed(2),
      state.exempt_sales.toFixed(2),
      state.direct_sales.toFixed(2),
      state.marketplace_sales.toFixed(2),
      state.threshold.toFixed(2),
      state.threshold_percent.toFixed(1),
      state.estimated_liability.toFixed(2),
      state.confidence_level
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `nexus-analysis-${analysisId}-state-results.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [displayedStates, analysisId])

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

        {/* Right side - Filters and Actions */}
        <div className="flex gap-2">
          <Select value={nexusFilter} onValueChange={setNexusFilter}>
            <SelectTrigger className="w-40 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="has_nexus">Has Nexus</SelectItem>
              <SelectItem value="approaching">Approaching</SelectItem>
              <SelectItem value="no_nexus">No Nexus</SelectItem>
            </SelectContent>
          </Select>

          <Select value={exemptFilter} onValueChange={setExemptFilter}>
            <SelectTrigger className="w-44 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sales Types</SelectItem>
              <SelectItem value="has_exempt">Has Exempt Sales</SelectItem>
              <SelectItem value="no_exempt">No Exempt Sales</SelectItem>
            </SelectContent>
          </Select>

          <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
            <SelectTrigger className="w-36 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-border" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
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
                />
              ))}
            </TableBody>
          </Table>
        </StateTableSection>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{displayedStates.hasNexus.length + displayedStates.approaching.length + displayedStates.salesNoNexus.length + displayedStates.noSales.length}</span> of{' '}
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
