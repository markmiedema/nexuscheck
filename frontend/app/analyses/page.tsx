'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { listAnalyses, deleteAnalysis, type Analysis } from '@/lib/api/analyses'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { TabsCustom } from '@/components/ui/tabs-custom'
import {
  Eye,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar
} from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
  processing: { label: 'Processing', color: 'bg-primary/10 text-primary border-primary/20', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-destructive/10 text-destructive-foreground border-destructive/20', icon: AlertCircle },
}

type SortConfig = {
  column: 'client_company_name' | 'states_with_nexus' | 'total_liability' | 'created_at' | null
  direction: 'asc' | 'desc'
}

export default function AnalysesPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [limit] = useState(50)
  const [offset] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'desc' })
  const [activeTab, setActiveTab] = useState<string>('all')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadAnalyses()
  }, [debouncedSearchTerm])

  async function loadAnalyses() {
    try {
      setLoading(true)
      const data = await listAnalyses({
        limit,
        offset,
        search: debouncedSearchTerm || undefined,
      })
      setAnalyses(data.analyses)
      setTotalCount(data.total_count)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to load analyses' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(analysisId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete the analysis for "${clientName}"?`)) {
      return
    }

    try {
      setDeleteLoading(analysisId)
      await deleteAnalysis(analysisId)
      showSuccess(`Analysis for "${clientName}" deleted successfully`)
      await loadAnalyses()
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to delete analysis' })
    } finally {
      setDeleteLoading(null)
    }
  }

  function handleView(analysisId: string) {
    router.push(`/analysis/${analysisId}/results`)
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount?: number): string | null {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function isNewAnalysis(createdAt: string): boolean {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 48 // New if created within 48 hours
  }

  const handleSort = (column: SortConfig['column']) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (column: SortConfig['column']) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      : <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
  }

  // Calculate summary statistics
  const stats = useMemo(() => {
    const completeCount = analyses.filter(a => a.status === 'complete').length
    const draftCount = analyses.filter(a => a.status === 'draft').length
    const processingCount = analyses.filter(a => a.status === 'processing').length
    const totalLiability = analyses
      .filter(a => a.total_liability)
      .reduce((sum, a) => sum + (a.total_liability || 0), 0)
    const avgStates = analyses
      .filter(a => a.states_with_nexus)
      .reduce((sum, a, _, arr) => sum + (a.states_with_nexus || 0) / arr.length, 0)
    const thisMonth = analyses.filter(a => {
      const created = new Date(a.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length

    return {
      total: totalCount,
      complete: completeCount,
      draft: draftCount,
      processing: processingCount,
      totalLiability,
      avgStates: avgStates || 0,
      thisMonth
    }
  }, [analyses, totalCount])

  // Filter and sort analyses - now takes optional status filter
  const getFilteredAnalyses = (statusFilter?: string) => {
    let filtered = [...analyses]

    // Apply tab filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // Apply sorting
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.column!] ?? 0
        const bVal = b[sortConfig.column!] ?? 0

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        const comparison = Number(aVal) - Number(bVal)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }

  const displayedAnalyses = useMemo(() => {
    return getFilteredAnalyses(activeTab)
  }, [analyses, sortConfig, activeTab])

  // Render table content for a given status filter
  const renderTableContent = (statusFilter: string) => {
    const filteredData = getFilteredAnalyses(statusFilter)

    if (loading) {
      return <SkeletonTable rows={8} columns={7} />
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 px-6">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground dark:text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No analyses found</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
            {searchTerm
              ? 'No analyses match your search.'
              : statusFilter === 'all'
              ? 'Get started by creating your first analysis.'
              : `No ${statusFilter} analyses found.`}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button className="mt-4" onClick={() => router.push('/analysis/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Analysis
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="bg-muted/50 border border-border rounded-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/80 border-b-2 border-border sticky top-0 z-10">
              <TableRow className="hover:bg-muted/80">
                <TableHead className="px-4 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('client_company_name')}
                    className="flex items-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    Client
                    {getSortIcon('client_company_name')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Period</TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-2 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('states_with_nexus')}
                    className="flex items-center justify-center cursor-pointer hover:bg-accent transition-colors mx-auto"
                  >
                    States with Nexus
                    {getSortIcon('states_with_nexus')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('total_liability')}
                    className="flex items-center justify-end cursor-pointer hover:bg-accent transition-colors ml-auto"
                  >
                    Est. Liability
                    {getSortIcon('total_liability')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    Created
                    {getSortIcon('created_at')}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((analysis) => {
                const statusConfig = STATUS_CONFIG[analysis.status]
                const StatusIcon = statusConfig.icon
                const isNew = isNewAnalysis(analysis.created_at)

                return (
                  <TableRow key={analysis.id} className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{analysis.client_company_name}</span>
                        {isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            New
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(analysis.analysis_period_start)} — {formatDate(analysis.analysis_period_end)}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                        <StatusIcon className={`mr-1.5 h-3 w-3 ${analysis.status === 'processing' ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-center">
                      {analysis.states_with_nexus !== null ? (
                        <span className="text-sm font-semibold text-foreground">{analysis.states_with_nexus}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not calculated</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-right">
                      {formatCurrency(analysis.total_liability) ? (
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(analysis.total_liability)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not calculated</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(analysis.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleView(analysis.id)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(analysis.id, analysis.client_company_name)}
                          disabled={deleteLoading === analysis.id}
                          className="p-2 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
                          title="Delete"
                        >
                          {deleteLoading === analysis.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredData.length}</span> of <span className="font-medium text-foreground">{totalCount}</span> analyses
              {statusFilter !== 'all' && (
                <span className="ml-2 text-muted-foreground">
                  (filtered by {statusFilter})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {totalCount === 0 ? 'Welcome to Nexus Check' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? 'Get started by creating your first sales tax nexus analysis'
              : 'Manage your sales tax nexus analyses and view compliance insights'}
          </p>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Analyses
              </p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground mt-3">{stats.total}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Liability
              </p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground mt-3">
              ${stats.totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Avg States/Analysis
              </p>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground mt-3">
              {stats.avgStates.toFixed(1)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                This Month
              </p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground mt-3">{stats.thisMonth}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Analysis History</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage your previous sales tax nexus analyses
                </p>
              </div>
              <Button
                onClick={() => router.push('/analysis/new')}
              >
                <FileText className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4">
            <TabsCustom
              items={[
                {
                  id: 'all',
                  label: 'All',
                  badge: <span className="text-muted-foreground">({stats.total})</span>,
                  content: renderTableContent('all')
                },
                {
                  id: 'complete',
                  label: 'Complete',
                  badge: <span className="text-muted-foreground">({stats.complete})</span>,
                  content: renderTableContent('complete')
                },
                {
                  id: 'draft',
                  label: 'Draft',
                  badge: <span className="text-muted-foreground">({stats.draft})</span>,
                  content: renderTableContent('draft')
                },
                {
                  id: 'processing',
                  label: 'Processing',
                  badge: <span className="text-muted-foreground">({stats.processing})</span>,
                  content: renderTableContent('processing')
                }
              ]}
              defaultTab="all"
              variant="underline"
              onTabChange={(tabId) => setActiveTab(tabId)}
            />
          </div>
        </div>
      </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
