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
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  AlertTriangle,
  MapPin,
  FolderOpen,
  Plus
} from 'lucide-react'

// Status Badge Config - Softer Colors
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' })
  const [activeTab, setActiveTab] = useState<string>('all')

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

  async function handleDelete(analysisId: string, clientName: string, e: React.MouseEvent) {
    e.stopPropagation() // Prevent row click
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

  function formatCurrency(amount?: number): string | null {
    if (amount === undefined || amount === null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSort = (column: SortConfig['column']) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (column: SortConfig['column']) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/50" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
      : <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
  }

  // --- NEW: WORKFLOW METRICS ---
  const stats = useMemo(() => {
    // 1. Active Files: Total volume
    const totalFiles = totalCount

    // 2. Nexus Found: The "Book of Business" (Clients who owe taxes)
    const nexusFoundCount = analyses.filter(a => (a.states_with_nexus || 0) > 0).length

    // 3. High Priority: Clients with > $5,000 liability (Urgent VDA needed)
    const highPriorityCount = analyses.filter(a => (a.total_liability || 0) > 5000).length

    // 4. In Progress: Drafts or Processing (To-Do List)
    const inProgressCount = analyses.filter(a => ['draft', 'processing'].includes(a.status)).length

    return {
      totalFiles,
      nexusFoundCount,
      highPriorityCount,
      inProgressCount
    }
  }, [analyses, totalCount])

  const displayedAnalyses = useMemo(() => {
    let filtered = [...analyses]
    if (activeTab !== 'all') {
      filtered = filtered.filter(a => a.status === activeTab)
    }
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.column!] ?? 0
        const bVal = b[sortConfig.column!] ?? 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        const comparison = Number(aVal) - Number(bVal)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }
    return filtered
  }, [analyses, sortConfig, activeTab])

  // --- RENDER TABLE ---
  const renderTableContent = () => {
    if (loading) return <SkeletonTable rows={8} columns={6} />

    if (displayedAnalyses.length === 0) {
      // Enhanced Empty State
      return (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No analyses found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Get started by uploading a transaction file to analyze nexus exposure.'}
          </p>
          {!searchTerm && activeTab === 'all' && (
            <Button onClick={() => router.push('/analysis/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create First Analysis
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[30%] cursor-pointer" onClick={() => handleSort('client_company_name')}>
                <div className="flex items-center">Client {getSortIcon('client_company_name')}</div>
              </TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[15%] cursor-pointer text-center" onClick={() => handleSort('states_with_nexus')}>
                <div className="flex items-center justify-center">Nexus States {getSortIcon('states_with_nexus')}</div>
              </TableHead>
              <TableHead className="w-[20%] cursor-pointer text-right" onClick={() => handleSort('total_liability')}>
                <div className="flex items-center justify-end">Est. Liability {getSortIcon('total_liability')}</div>
              </TableHead>
              <TableHead className="w-[15%] cursor-pointer" onClick={() => handleSort('created_at')}>
                <div className="flex items-center">Date {getSortIcon('created_at')}</div>
              </TableHead>
              <TableHead className="w-[5%] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedAnalyses.map((analysis) => {
              const status = STATUS_CONFIG[analysis.status]
              const StatusIcon = status.icon
              const isHighRisk = (analysis.total_liability || 0) > 5000

              return (
                <TableRow
                  key={analysis.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleView(analysis.id)}
                >
                  <TableCell className="font-medium">
                    {analysis.client_company_name}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className={`mr-1.5 h-3 w-3 ${analysis.status === 'processing' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {analysis.states_with_nexus !== null ? (
                      <Badge variant="outline" className={analysis.states_with_nexus > 0 ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' : ''}>
                        {analysis.states_with_nexus} States
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {analysis.total_liability !== null ? (
                      <span className={isHighRisk ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(analysis.total_liability)}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(analysis.id, analysis.client_company_name, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of your client nexus analyses.</p>
            </div>
            <Button onClick={() => router.push('/analysis/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> New Analysis
            </Button>
          </div>

          {/* STATS GRID - "Glass" Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Active Files */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Active Files</span>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.totalFiles}</div>
            </Card>

            {/* Card 2: Nexus Found (Action Items) */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Nexus Found</span>
                <MapPin className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.nexusFoundCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Clients with exposure</p>
            </Card>

            {/* Card 3: High Priority (Risk) */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">High Priority</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.highPriorityCount}</div>
              <p className="text-xs text-muted-foreground mt-1">&gt;$5k Liability</p>
            </Card>

            {/* Card 4: In Progress */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">In Progress</span>
                <Loader2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.inProgressCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Drafts & processing</p>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <TabsCustom
                items={[
                  { id: 'all', label: 'All Files', content: null },
                  { id: 'complete', label: 'Complete', content: null },
                  { id: 'draft', label: 'Drafts', content: null },
                ]}
                defaultTab="all"
                variant="pills"
                onTabChange={setActiveTab}
              />
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>

            {/* Table */}
            {renderTableContent()}
          </div>

        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
