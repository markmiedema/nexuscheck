'use client'

import { useState, useMemo, useEffect } from 'react'
import { useComplianceThresholds, type ThresholdData } from '@/hooks/queries'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Info,
  Check,
  X,
} from 'lucide-react'

type SortConfig = {
  column: 'state_name' | 'revenue_threshold' | 'combined_rate' | null
  direction: 'asc' | 'desc'
}

// Format currency
function formatCurrency(amount: number | null): string {
  if (amount === null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format number with commas
function formatNumber(num: number | null): string {
  if (num === null) return ''
  return new Intl.NumberFormat('en-US').format(num)
}

// Format percentage
function formatPercent(rate: number | null): string {
  if (rate === null) return '-'
  return `${(rate * 100).toFixed(2)}%`
}

// Format threshold as combined string like "$100,000 OR 200 transactions"
function formatThreshold(state: ThresholdData): string {
  if (!state.has_sales_tax) return '-'

  const revenue = state.revenue_threshold ? formatCurrency(state.revenue_threshold) : null
  const transactions = state.transaction_threshold ? `${formatNumber(state.transaction_threshold)} transactions` : null

  if (revenue && transactions) {
    const operator = (state.threshold_operator || 'or').toUpperCase()
    return `${revenue} ${operator} ${transactions}`
  }
  if (revenue) return revenue
  if (transactions) return transactions
  return '-'
}

export default function CompliancePage() {
  const { data: thresholds, isLoading, error } = useComplianceThresholds()

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'state_name', direction: 'asc' })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  function handleSort(column: SortConfig['column']) {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortableHeader = ({ column, children, className = '' }: { column: SortConfig['column'], children: React.ReactNode, className?: string }) => {
    const isActive = sortConfig.column === column
    return (
      <TableHead
        className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortConfig.direction === 'asc' ?
              <ArrowUp className="h-3 w-3 text-primary" /> :
              <ArrowDown className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
          )}
        </div>
      </TableHead>
    )
  }

  const displayedStates = useMemo(() => {
    if (!thresholds) return []

    // Filter by search
    let filtered = thresholds.filter((s: ThresholdData) =>
      s.state_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      s.state_code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )

    // Sort
    if (sortConfig.column) {
      filtered = [...filtered].sort((a: ThresholdData, b: ThresholdData) => {
        const aVal = a[sortConfig.column!]
        const bVal = b[sortConfig.column!]

        // Handle nulls
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return sortConfig.direction === 'asc' ? 1 : -1
        if (bVal === null) return sortConfig.direction === 'asc' ? -1 : 1

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }

        // Number comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
        }

        return 0
      })
    }

    return filtered
  }, [thresholds, sortConfig, debouncedSearchTerm])

  // Yes/No indicator component
  const YesNo = ({ value }: { value: boolean }) => (
    value ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <X className="h-4 w-4" /> No
      </span>
    )
  )

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="full">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Compliance Data
              </h1>
              <p className="text-muted-foreground mt-1">
                State economic nexus thresholds and rules used in calculations
              </p>
            </div>

            {/* Info banner */}
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">This data drives nexus calculations</p>
                    <p className="text-blue-600 dark:text-blue-300 mt-0.5">
                      If you notice any data that appears incorrect or outdated, please let us know so we can verify and update it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Economic Nexus Thresholds</CardTitle>
                  <CardDescription>
                    Threshold rules determine when you have nexus in a state
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search states..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-medium">Failed to load compliance data</p>
                  <p className="text-muted-foreground mt-1">Please try refreshing the page</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableHeader column="state_name" className="min-w-[140px]">
                          State
                        </SortableHeader>
                        <SortableHeader column="revenue_threshold" className="min-w-[200px]">
                          Economic Nexus Threshold
                        </SortableHeader>
                        <TableHead className="min-w-[180px]">
                          Lookback Period
                        </TableHead>
                        <TableHead className="text-center min-w-[120px]">
                          Marketplace Excluded
                        </TableHead>
                        <TableHead className="text-center min-w-[100px]">
                          Resale Excluded
                        </TableHead>
                        <SortableHeader column="combined_rate" className="text-right min-w-[100px]">
                          Combined Rate
                        </SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedStates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            {debouncedSearchTerm ? 'No states match your search' : 'No state data available'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedStates.map((state: ThresholdData) => (
                          <TableRow key={state.state_code} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground/70 w-6">{state.state_code}</span>
                                <span className={!state.has_sales_tax ? 'text-muted-foreground' : ''}>
                                  {state.state_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatThreshold(state)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {state.has_sales_tax ? (state.lookback_period || '-') : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {state.has_sales_tax ? <YesNo value={state.marketplace_excluded} /> : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {state.has_sales_tax ? <YesNo value={state.resale_excluded} /> : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {state.has_sales_tax ? formatPercent(state.combined_rate) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Data is regularly verified against official state sources.
          </p>
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
