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
import { TabsCustom } from '@/components/ui/tabs-custom'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  Trash2,
  Search,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  AlertTriangle,
  MapPin,
  FolderOpen,
  Plus,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Building2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// --- CONFIGURATION ---
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
}

type SortConfig = {
  column: 'client_company_name' | 'states_with_nexus' | 'total_liability' | 'created_at' | null
  direction: 'asc' | 'desc'
}

type ViewMode = 'grid' | 'list'

export default function ClientsPage() {
  const router = useRouter()

  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadAnalyses()
  }, [debouncedSearchTerm])

  async function loadAnalyses() {
    try {
      setLoading(true)
      const data = await listAnalyses({ limit: 50, offset: 0, search: debouncedSearchTerm || undefined })
      setAnalyses(data.analyses)
      setTotalCount(data.total_count)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to load clients' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(analysisId: string, clientName: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!confirm(`Delete client "${clientName}"?`)) return

    try {
      setDeleteLoading(analysisId)
      await deleteAnalysis(analysisId)
      showSuccess(`Deleted client "${clientName}"`)
      await loadAnalyses()
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to delete client' })
    } finally {
      setDeleteLoading(null)
    }
  }

  function formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Stats calculation
  const stats = useMemo(() => ({
    totalFiles: totalCount,
    nexusFoundCount: analyses.filter(a => (a.states_with_nexus ?? 0) > 0).length,
    highPriorityCount: analyses.filter(a => (a.total_liability ?? 0) > 5000).length,
    inProgressCount: analyses.filter(a => ['draft', 'processing'].includes(a.status)).length
  }), [analyses, totalCount])

  const displayedAnalyses = useMemo(() => {
    let filtered = [...analyses]
    if (activeTab !== 'all') filtered = filtered.filter(a => a.status === activeTab)

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

  // --- CLIENT CARD COMPONENT ---
  const ClientCard = ({ analysis }: { analysis: Analysis }) => {
    const status = STATUS_CONFIG[analysis.status]
    const StatusIcon = status.icon
    const isHighRisk = (analysis.total_liability ?? 0) > 5000

    // Avatar Color Generator
    const initial = analysis.client_company_name.charAt(0).toUpperCase()
    const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700']
    const avatarColor = colors[analysis.client_company_name.length % colors.length]

    return (
      <div
        onClick={() => router.push(`/clients/${analysis.id}`)}
        className="group relative flex flex-col bg-card hover:shadow-card border border-border/60 rounded-xl p-5 transition-all cursor-pointer hover:-translate-y-1"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor} border border-white/10 shadow-sm`}>
              {initial}
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{analysis.client_company_name}</h3>
              <span className="text-xs text-muted-foreground">{new Date(analysis.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/clients/${analysis.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View Dossier
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(analysis.id, analysis.client_company_name, e as any)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-dashed border-border/60 my-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nexus</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {analysis.states_with_nexus ?? '-'} <span className="text-xs font-normal text-muted-foreground">States</span>
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Liability</p>
            <div className="flex items-center gap-1.5 mt-1">
              <AlertTriangle className={`h-3.5 w-3.5 ${isHighRisk ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className={`font-semibold ${isHighRisk ? 'text-orange-600' : 'text-foreground'}`}>
                {formatCurrency(analysis.total_liability)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            <StatusIcon className={`mr-1.5 h-3 w-3 ${analysis.status === 'processing' ? 'animate-spin' : ''}`} />
            {status.label}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-primary flex items-center">
            Open File &rarr;
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Client List</h1>
              <p className="text-muted-foreground mt-1">Manage your client nexus assessments.</p>
            </div>
            <Button onClick={() => router.push('/analysis/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Clients', value: stats.totalFiles, icon: Building2, color: 'text-blue-600' },
              { label: 'Nexus Found', value: stats.nexusFoundCount, icon: MapPin, color: 'text-orange-600' },
              { label: 'High Priority', value: stats.highPriorityCount, icon: AlertTriangle, color: 'text-red-600' },
              { label: 'In Progress', value: stats.inProgressCount, icon: Loader2, color: 'text-purple-600' },
            ].map((stat, i) => (
              <Card key={i} className="p-4 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-background ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <TabsCustom
                items={[
                  { id: 'all', label: 'All', content: null },
                  { id: 'complete', label: 'Complete', content: null },
                  { id: 'draft', label: 'Drafts', content: null },
                ]}
                defaultTab="all"
                variant="pills"
                onTabChange={setActiveTab}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>

              <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="List View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : displayedAnalyses.length === 0 ? (
             <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No clients found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first client.'}
              </p>
              <Button onClick={() => router.push('/analysis/new')}>
                <Plus className="mr-2 h-4 w-4" /> New Client
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                  {displayedAnalyses.map((analysis) => (
                    <ClientCard key={analysis.id} analysis={analysis} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm animate-in fade-in duration-500">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[30%]">Client</TableHead>
                        <TableHead className="w-[15%]">Status</TableHead>
                        <TableHead className="w-[15%] text-center">Nexus</TableHead>
                        <TableHead className="w-[20%] text-right">Liability</TableHead>
                        <TableHead className="w-[15%]">Date</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAnalyses.map((analysis) => {
                        const status = STATUS_CONFIG[analysis.status]
                        const StatusIcon = status.icon
                        return (
                          <TableRow
                            key={analysis.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/clients/${analysis.id}`)}
                          >
                            <TableCell className="font-medium">{analysis.client_company_name}</TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                <StatusIcon className="mr-1.5 h-3 w-3" /> {status.label}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{analysis.states_with_nexus ?? '-'}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(analysis.total_liability)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(analysis.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={(e) => handleDelete(analysis.id, analysis.client_company_name, e as any)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
