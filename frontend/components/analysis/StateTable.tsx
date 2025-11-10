'use client'

import { useEffect, useState } from 'react'
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
import { ArrowUpDown } from 'lucide-react'
import {
  getNexusColor,
  getNexusStatusLabel,
  sortStates,
  applyFilters,
} from '@/app/analysis/[id]/states/helpers'

interface StateTableProps {
  analysisId: string
  embedded?: boolean
}

export default function StateTable({ analysisId, embedded = false }: StateTableProps) {
  const [states, setStates] = useState<StateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and sorting
  const [sortBy, setSortBy] = useState('nexus_status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [nexusFilter, setNexusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayedStates, setDisplayedStates] = useState<StateResult[]>([])

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

  // Apply filters and sorting
  useEffect(() => {
    const filtered = applyFilters(states, {
      nexus: nexusFilter,
      registration: 'all',
      confidence: 'all',
      search: searchQuery
    })
    const sorted = sortStates(filtered, sortBy, sortOrder)
    setDisplayedStates(sorted)
  }, [states, sortBy, sortOrder, nexusFilter, searchQuery])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
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
    <div className={embedded ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          State-by-State Results
        </h3>
        <div className="text-sm text-gray-600">
          {displayedStates.length} of {states.length} states
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search states..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={nexusFilter} onValueChange={setNexusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="has_nexus">Has Nexus</SelectItem>
            <SelectItem value="approaching">Approaching</SelectItem>
            <SelectItem value="no_nexus">No Nexus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center gap-1 font-medium hover:text-gray-900"
                >
                  State <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('nexus_status')}
                  className="flex items-center gap-1 font-medium hover:text-gray-900"
                >
                  Nexus Status <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('revenue')}
                  className="flex items-center gap-1 ml-auto font-medium hover:text-gray-900"
                >
                  Total Sales <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('liability')}
                  className="flex items-center gap-1 ml-auto font-medium hover:text-gray-900"
                >
                  Est. Liability <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStates.map((state) => (
              <TableRow key={state.state_code} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {state.state_name} ({state.state_code})
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    state.nexus_status === 'has_nexus'
                      ? 'bg-red-100 text-red-800'
                      : state.nexus_status === 'approaching'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getNexusStatusLabel(state.nexus_status)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ${state.total_sales.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${state.estimated_liability.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/analysis/${analysisId}/states/${state.state_code}`}
                  >
                    View Details →
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {displayedStates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No states found matching your filters
        </div>
      )}
    </div>
  )
}
