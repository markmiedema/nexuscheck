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
} from 'lucide-react'
import {
  getNexusStatusLabel,
} from '@/app/analysis/[id]/states/helpers'

interface StateTableProps {
  analysisId: string
  embedded?: boolean
}

type SortConfig = {
  column: 'state' | 'nexus_status' | 'sales' | 'liability'
  direction: 'asc' | 'desc'
}

type Density = 'compact' | 'comfortable' | 'spacious'

export default function StateTable({ analysisId, embedded = false }: StateTableProps) {
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
  }, [analysisId])

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
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-4 w-4 text-gray-700" />
      : <ChevronDown className="h-4 w-4 text-gray-700" />
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading state results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          State-by-State Results
        </h3>
        <div className="text-sm text-gray-600">
          {displayedStates.length} of {states.length} states
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Left side - Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Right side - Filters and Actions */}
        <div className="flex gap-2">
          <Select value={nexusFilter} onValueChange={setNexusFilter}>
            <SelectTrigger className="w-40 border-gray-200">
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
            <SelectTrigger className="w-36 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow className="hover:bg-gray-50">
                <TableHead className="border-b border-gray-200">
                  <button
                    onClick={() => handleSort('state')}
                    className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    State
                    {getSortIcon('state')}
                  </button>
                </TableHead>
                <TableHead className="border-b border-gray-200">
                  <button
                    onClick={() => handleSort('nexus_status')}
                    className="flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Status
                    {getSortIcon('nexus_status')}
                  </button>
                </TableHead>
                <TableHead className="text-right border-b border-gray-200">
                  <button
                    onClick={() => handleSort('sales')}
                    className="flex items-center gap-2 ml-auto font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Total Sales
                    {getSortIcon('sales')}
                  </button>
                </TableHead>
                <TableHead className="text-right border-b border-gray-200">
                  <button
                    onClick={() => handleSort('liability')}
                    className="flex items-center gap-2 ml-auto font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Est. Liability
                    {getSortIcon('liability')}
                  </button>
                </TableHead>
                <TableHead className="border-b border-gray-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    No states found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                displayedStates.map((state) => (
                  <TableRow
                    key={state.state_code}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <TableCell className={`font-medium text-gray-900 ${densityClasses[density]}`}>
                      {state.state_name} ({state.state_code})
                    </TableCell>
                    <TableCell className={densityClasses[density]}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                        state.nexus_status === 'has_nexus'
                          ? 'bg-red-100 text-red-800'
                          : state.nexus_status === 'approaching'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getNexusStatusLabel(state.nexus_status)}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right text-gray-700 ${densityClasses[density]}`}>
                      ${state.total_sales.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right text-gray-900 font-medium ${densityClasses[density]}`}>
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
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors px-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{displayedStates.length}</span> of{' '}
          <span className="font-medium text-gray-900">{states.length}</span> states
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-200 text-gray-700 hover:bg-gray-50"
          disabled
        >
          Generate Report (Coming Soon)
        </Button>
      </div>
    </div>
  )
}
