'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalyses, useDeleteAnalysis } from '@/hooks/queries'
import type { Analysis } from '@/lib/api/analyses'
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
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  Search,
  Plus,
  FolderOpen,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
} from 'lucide-react'

type SortConfig = {
  column: 'client_company_name' | 'status' | 'created_at' | null
  direction: 'asc' | 'desc'
}

export default function ProjectsPage() {
  const router = useRouter()

  const { data: analysesData, isLoading: loading } = useAnalyses()
  const deleteAnalysisMutation = useDeleteAnalysis()

  const analyses = analysesData?.analyses ?? []

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' })
  const [activeTab, setActiveTab] = useState('all')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  function handleDelete(analysisId: string, analysisName: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!confirm(`Delete project "${analysisName}"?`)) return
    deleteAnalysisMutation.mutate(analysisId)
  }

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

  const { displayedProjects, stats } = useMemo(() => {
    // 1. Filter by Search Term
    let filtered = analyses.filter((a: Analysis) =>
      a.client_company_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      a.industry?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )

    // 2. Filter by Tab
    if (activeTab === 'complete') {
      filtered = filtered.filter((a: Analysis) => a.status === 'complete')
    } else if (activeTab === 'active') {
      filtered = filtered.filter((a: Analysis) => a.status === 'draft' || a.status === 'processing')
    }

    // 3. Sort
    if (sortConfig.column) {
      filtered.sort((a: Analysis, b: Analysis) => {
        const aVal = a[sortConfig.column!] ?? ''
        const bVal = b[sortConfig.column!] ?? ''
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        return 0
      })
    }

    return {
      displayedProjects: filtered,
      stats: {
        totalProjects: analyses.length,
        activeCount: analyses.filter((a: Analysis) => a.status === 'draft' || a.status === 'processing').length,
        completeCount: analyses.filter((a: Analysis) => a.status === 'complete').length,
        errorCount: analyses.filter((a: Analysis) => a.status === 'error').length,
      }
    }
  }, [analyses, sortConfig, debouncedSearchTerm, activeTab])

  const StatusBadge = ({ status }: { status: Analysis['status'] }) => {
    switch (status) {
      case 'complete':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none">
            <Clock className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Draft
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function getProjectLink(analysis: Analysis): string {
    if (analysis.status === 'draft') {
      return `/analysis/${analysis.id}/mapping`
    }
    return `/analysis/${analysis.id}/results`
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Projects</h1>
              <p className="text-muted-foreground mt-1">Nexus analyses and compliance projects</p>
            </div>
            <Button onClick={() => router.push('/analysis/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active', value: stats.activeCount, icon: Clock, color: 'text-blue-600' },
              { label: 'Completed', value: stats.completeCount, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'Errors', value: stats.errorCount, icon: AlertCircle, color: 'text-red-500' },
              { label: 'Total', value: stats.totalProjects, icon: FolderKanban, color: 'text-purple-600' },
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

          {/* Tabs & Filters */}
          <div className="space-y-4 mb-6">
            <TabsCustom
              defaultTab="all"
              onTabChange={setActiveTab}
              variant="pills"
              items={[
                { id: 'all', label: 'All Projects', content: null },
                { id: 'active', label: 'In Progress', content: null },
                { id: 'complete', label: 'Completed', content: null },
              ]}
            />

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : displayedProjects.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                {activeTab === 'complete' ? 'No completed projects' :
                 activeTab === 'active' ? 'No active projects' :
                 'No projects yet'}
              </h3>

              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'Create your first nexus analysis to get started.'}
              </p>

              <Button onClick={() => router.push('/analysis/new')}>
                <Zap className="mr-2 h-4 w-4" /> New Analysis
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm animate-in fade-in duration-500">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <SortableHeader column="client_company_name" className="w-[35%]">Project / Client</SortableHeader>
                    <SortableHeader column="status" className="w-[15%]">Status</SortableHeader>
                    <TableHead className="w-[15%]">Results</TableHead>
                    <SortableHeader column="created_at" className="w-[20%]">Created</SortableHeader>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedProjects.map((analysis: Analysis) => (
                    <TableRow
                      key={analysis.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(getProjectLink(analysis))}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{analysis.client_company_name || 'Quick Analysis'}</p>
                          {analysis.industry && (
                            <p className="text-sm text-muted-foreground">{analysis.industry}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={analysis.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {analysis.status === 'complete' ? (
                          <span>
                            {analysis.states_with_nexus ?? 0} states with nexus
                          </span>
                        ) : analysis.status === 'processing' ? (
                          <span className="text-blue-600">Calculating...</span>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(analysis.id, analysis.client_company_name || 'Analysis', e)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
