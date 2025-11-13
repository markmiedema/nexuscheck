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
  Eye,
  MoreHorizontal,
  FileText,
  Tag,
  TrendingUp,
} from 'lucide-react'
import {
  getNexusStatusLabel,
} from '@/app/analysis/[id]/states/helpers'

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading state results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          State-by-State Results
        </h3>
        <div className="text-sm text-muted-foreground">
          {displayedStates.length} of {states.length} states
        </div>
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
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className="hover:bg-muted/70">
                <TableHead className="border-b border-border">
                  <button
                    onClick={() => handleSort('state')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    State
                    {getSortIcon('state')}
                  </button>
                </TableHead>
                <TableHead className="border-b border-border">
                  <button
                    onClick={() => handleSort('nexus_status')}
                    className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Status
                    {getSortIcon('nexus_status')}
                  </button>
                </TableHead>
                <TableHead className="text-right border-b border-border">
                  <button
                    onClick={() => handleSort('sales')}
                    className="flex items-center gap-2 ml-auto font-medium text-card-foreground hover:text-foreground transition-colors"
                  >
                    Total Sales
                    {getSortIcon('sales')}
                  </button>
                </TableHead>
                <TableHead className="text-right border-b border-border">
                  <span className="font-medium text-muted-foreground">
                    Threshold
                  </span>
                </TableHead>
                <TableHead className="text-right border-b border-border">
                  <button
                    onClick={() => handleSort('liability')}
                    className="flex items-center gap-2 ml-auto font-medium text-card-foreground hover:text-foreground transition-colors"
                  >
                    Est. Liability
                    {getSortIcon('liability')}
                  </button>
                </TableHead>
                <TableHead className="border-b border-border">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No states found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                displayedStates.map((state) => (
                  <TableRow
                    key={state.state_code}
                    className="hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                  >
                    <TableCell className={`${densityClasses[density]}`}>
                      <div className="font-medium text-card-foreground">
                        {state.state_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({state.state_code})
                      </div>
                    </TableCell>
                    <TableCell className={densityClasses[density]}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          state.nexus_status === 'has_nexus'
                            ? 'bg-destructive'
                            : 'bg-success'
                        }`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border ${
                          state.nexus_type === 'both'
                            ? 'bg-info/10 text-info-foreground border-info/20'
                            : state.nexus_type === 'physical'
                            ? 'bg-info/5 text-info-foreground border-info/10'
                            : state.nexus_type === 'economic'
                            ? 'bg-destructive/10 text-destructive-foreground border-destructive/20'
                            : state.nexus_status === 'approaching'
                            ? 'bg-warning/10 text-warning-foreground border-warning/20'
                            : 'bg-success/10 text-success-foreground border-success/20'
                        }`}>
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
                    <TableCell className={`text-right ${densityClasses[density]}`}>
                      <div className="font-medium text-card-foreground">
                        ${state.total_sales.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Direct: ${(state.direct_sales / 1000).toFixed(0)}k | Mktp: ${(state.marketplace_sales / 1000).toFixed(0)}k
                      </div>
                    </TableCell>
                    <TableCell className={`text-right ${densityClasses[density]}`}>
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
                    <TableCell className={`text-right text-card-foreground font-medium ${densityClasses[density]}`}>
                      ${state.estimated_liability.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className={densityClasses[density]}>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/analysis/${analysisId}/states/${state.state_code}`}
                          className="text-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-2"
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
    </div>
  )
}
