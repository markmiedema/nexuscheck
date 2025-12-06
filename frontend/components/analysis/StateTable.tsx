'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'
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
import { SkeletonTable } from '@/components/ui/skeleton-table'

interface StateTableProps {
  analysisId: string
  embedded?: boolean
  refreshTrigger?: number
  companyName?: string
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

export default function StateTable({ analysisId, embedded = false, refreshTrigger, companyName }: StateTableProps) {
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Combined filtering and sorting logic
  const displayedStates = useMemo<{
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

    // Return grouped states instead of flat array
    // Pass true to preserve the user's sort order
    return groupStatesByPriority(filtered, true)
  }, [states, sortConfig, searchQuery])

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

  // Export state results to Excel with auto-width columns
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

    // Helper to format threshold percentage
    const formatThresholdPercent = (percent: number): string => {
      if (percent >= 100) {
        return 'Met'
      }
      return `${percent.toFixed(1)}%`
    }

    // Helper to get status label
    const getStatusLabel = (state: StateResult): string => {
      if (state.nexus_type === 'both') return 'Physical + Economic'
      if (state.nexus_type === 'physical') return 'Physical Nexus'
      if (state.nexus_type === 'economic') return 'Economic Nexus'
      if (state.nexus_status === 'approaching') return 'Approaching'
      return 'No Nexus'
    }

    // Helper to calculate liability breakdown
    const getLiabilityValues = (state: StateResult) => {
      const baseTax = state.base_tax ?? state.estimated_liability
      const interest = state.interest ?? 0
      const penalties = state.penalties ?? 0
      return {
        taxLiability: baseTax,
        penaltiesAndInterest: interest + penalties,
        totalLiability: baseTax + interest + penalties
      }
    }

    // Build data rows for Excel - matching table column order
    const data = allDisplayed.map(state => {
      const liability = getLiabilityValues(state)
      return {
        'State': `${state.state_name} (${state.state_code})`,
        'Status': getStatusLabel(state),
        'Operator': (state.threshold_operator || 'or').toUpperCase(),
        'Threshold': state.threshold,
        'Threshold %': formatThresholdPercent(state.threshold_percent),
        'Transactions': state.transaction_count || 0,
        'Gross Sales': state.total_sales,
        'Taxable Sales': state.taxable_sales,
        'Exempt Sales': state.exempt_sales,
        'Exposure Sales': state.exposure_sales || 0,
        'Tax Liability': liability.taxLiability,
        'Penalties & Interest': liability.penaltiesAndInterest,
        'Total Liability': liability.totalLiability
      }
    })

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Define column widths based on content
    const columnWidths = [
      { wch: 25 },  // State
      { wch: 18 },  // Status
      { wch: 10 },  // Operator
      { wch: 15 },  // Threshold
      { wch: 12 },  // Threshold %
      { wch: 14 },  // Transactions
      { wch: 16 },  // Gross Sales
      { wch: 16 },  // Taxable Sales
      { wch: 16 },  // Exempt Sales
      { wch: 16 },  // Exposure Sales
      { wch: 16 },  // Tax Liability
      { wch: 18 },  // Penalties & Interest
      { wch: 16 },  // Total Liability
    ]
    worksheet['!cols'] = columnWidths

    // Format currency columns (D, G-M are currency columns)
    const currencyColumns = ['D', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      currencyColumns.forEach(col => {
        const cellRef = `${col}${row + 1}`
        const cell = worksheet[cellRef]
        if (cell && typeof cell.v === 'number') {
          cell.z = '$#,##0.00'
        }
      })
      // Format Transactions column (F) as number with commas
      const transactionsCell = worksheet[`F${row + 1}`]
      if (transactionsCell && typeof transactionsCell.v === 'number') {
        transactionsCell.z = '#,##0'
      }
    }

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'State Results')

    // Generate filename with company name and current date
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const sanitizedCompanyName = companyName
      ? companyName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')
      : 'Analysis'
    const filename = `${sanitizedCompanyName}-State-Results-${currentDate}.xlsx`

    // Write and download file
    XLSX.writeFile(workbook, filename)
  }, [displayedStates, companyName])

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
