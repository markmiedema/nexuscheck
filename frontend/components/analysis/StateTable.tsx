'use client'

import { useEffect, useState, useMemo } from 'react'
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
  const displayedStates = useMemo(() => {
    let filtered = [...states]

    // Apply nexus filter
    if (nexusFilter !== 'all') {
      filtered = filtered.filter(state => state.nexus_status === nexusFilter)
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

    return filtered
  }, [states, sortConfig, nexusFilter, searchQuery])

  const handleSort = (column: SortConfig['column']) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (column: SortConfig['column']) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-4 w-4 text-foreground" />
      : <ChevronDown className="h-4 w-4 text-foreground" />
  }

  const densityClasses = {
    compact: 'py-2',
    comfortable: 'py-3',
    spacious: 'py-4'
  }

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

          <Button variant="outline" size="sm" className="border-border">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/80 border-b-2 border-border sticky top-0 z-10">
              <TableRow className="hover:bg-muted/80">
                <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('state')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    State
                    {getSortIcon('state')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    Gross Sales
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total revenue (used for nexus determination)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1">
                    Taxable Sales
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sales subject to tax (used for liability)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  Exempt
                </TableHead>
                <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('nexus_status')}
                    className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors"
                  >
                    Status
                    {getSortIcon('nexus_status')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('sales')}
                    className="flex items-center gap-2 ml-auto hover:text-foreground transition-colors"
                  >
                    Total Sales
                    {getSortIcon('sales')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  <span>
                    Threshold
                  </span>
                </TableHead>
                <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('liability')}
                    className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors"
                  >
                    Est. Liability
                    {getSortIcon('liability')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No states found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                displayedStates.map((state) => (
                  <TableRow
                    key={state.state_code}
                    className="border-b border-border hover:bg-muted/30 transition-colors last:border-0 cursor-pointer"
                    onClick={() => {
                      setSelectedState({ code: state.state_code, name: state.state_name })
                      setQuickViewOpen(true)
                    }}
                  >
                    <TableCell className={`px-4 text-sm text-foreground ${densityClasses[density]}`}>
                      <div className="font-medium text-card-foreground">
                        {state.state_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({state.state_code})
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
                      {formatCurrency(state.total_sales || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
                      {formatCurrency(state.taxable_sales || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-right text-muted-foreground">
                      {state.exempt_sales > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          {formatCurrency(state.exempt_sales)}
                          <Badge variant="outline" className="text-xs">
                            {((state.exempt_sales / state.total_sales) * 100).toFixed(1)}% exempt
                          </Badge>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className={`px-4 text-sm text-foreground text-center ${densityClasses[density]}`}>
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 45%)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 45%)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 45%)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 50%)'
                                : 'hsl(142 71% 40%)'
                          }}
                        />
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border"
                          style={{
                            // Light mode colors (optimized)
                            '--badge-bg-light':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 45% / 0.1)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 45% / 0.1)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 45% / 0.1)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 50% / 0.1)'
                                : 'hsl(142 71% 40% / 0.1)',
                            '--badge-color-light':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 35%)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 35%)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 40%)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 40%)'
                                : 'hsl(142 71% 30%)',
                            '--badge-border-light':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 45% / 0.2)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 45% / 0.2)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 45% / 0.2)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 50% / 0.2)'
                                : 'hsl(142 71% 40% / 0.2)',
                            // Dark mode colors (optimized)
                            '--badge-bg-dark':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 45% / 0.15)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 45% / 0.15)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 45% / 0.15)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 50% / 0.15)'
                                : 'hsl(142 71% 40% / 0.15)',
                            '--badge-color-dark':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 70%)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 70%)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 70%)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 65%)'
                                : 'hsl(142 71% 65%)',
                            '--badge-border-dark':
                              state.nexus_type === 'both'
                                ? 'hsl(289 46% 45% / 0.3)'
                                : state.nexus_type === 'physical'
                                ? 'hsl(217 32.6% 45% / 0.3)'
                                : state.nexus_type === 'economic'
                                ? 'hsl(0 60% 45% / 0.3)'
                                : state.nexus_status === 'approaching'
                                ? 'hsl(38 92% 50% / 0.3)'
                                : 'hsl(142 71% 40% / 0.3)',
                            backgroundColor: 'var(--badge-bg-light)',
                            color: 'var(--badge-color-light)',
                            borderColor: 'var(--badge-border-light)',
                          } as React.CSSProperties & Record<string, string>}
                        >
                          {state.nexus_type === 'both'
                            ? 'Physical + Economic'
                            : state.nexus_type === 'physical'
                            ? 'Physical Nexus'
                            : state.nexus_type === 'economic'
                            ? 'Economic Nexus'
                            : getNexusStatusLabel(state.nexus_status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`px-4 text-sm text-right text-foreground ${densityClasses[density]}`}>
                      <div className="font-medium text-card-foreground">
                        ${state.total_sales.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Direct: ${(state.direct_sales / 1000).toFixed(0)}k | Mktp: ${(state.marketplace_sales / 1000).toFixed(0)}k
                      </div>
                    </TableCell>
                    <TableCell className={`px-4 text-sm text-right text-foreground ${densityClasses[density]}`}>
                      <div className="text-sm text-foreground">
                        ${state.threshold?.toLocaleString() || 'N/A'}
                      </div>
                      {state.threshold_percent !== undefined && state.threshold_percent !== null && (
                        <div className={`text-xs font-medium ${
                          state.threshold_percent >= 100
                            ? 'text-destructive'
                            : state.threshold_percent >= 80
                            ? 'text-warning'
                            : 'text-success'
                        }`}>
                          {state.threshold_percent.toFixed(0)}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`px-4 text-sm text-center text-card-foreground font-medium ${densityClasses[density]}`}>
                      ${state.estimated_liability.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className={`px-4 text-sm text-foreground text-center ${densityClasses[density]}`}>
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/analysis/${analysisId}/states/${state.state_code}`
                          }}
                          className="text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors font-medium inline-flex items-center gap-1 text-sm"
                        >
                          View Details
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Coming Soon
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              <FileText className="h-4 w-4 mr-2" />
                              Export State Data
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <Tag className="h-4 w-4 mr-2" />
                              Add Notes/Tags
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Compare with Previous
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{displayedStates.length}</span> of{' '}
          <span className="font-medium text-foreground">{states.length}</span> states
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-muted"
          disabled
        >
          Generate Report (Coming Soon)
        </Button>
      </div>

      {/* Quick View Modal */}
      {selectedState && (
        <StateQuickViewModal
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          analysisId={analysisId}
          stateCode={selectedState.code}
          stateName={selectedState.name}
        />
      )}
    </div>
  )
}
