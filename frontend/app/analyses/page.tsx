'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listAnalyses, deleteAnalysis, type Analysis } from '@/lib/api/analyses'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
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
import {
  Eye,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-slate-500', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-green-500', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle },
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

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount?: number): string {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Analysis History</CardTitle>
                <CardDescription>
                  View and manage your previous sales tax nexus analyses
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/analysis/new')}>
                <FileText className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 flex items-center gap-2 max-w-md">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No analyses found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'No analyses match your search.'
                    : 'Get started by creating your first analysis.'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => router.push('/analysis/new')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Analysis
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">States with Nexus</TableHead>
                        <TableHead className="text-right">Est. Liability</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((analysis) => {
                        const statusConfig = STATUS_CONFIG[analysis.status]
                        const StatusIcon = statusConfig.icon

                        return (
                          <TableRow key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {analysis.client_company_name}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(analysis.analysis_period_start)} —{' '}
                              {formatDate(analysis.analysis_period_end)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig.color} text-white`}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-900 dark:text-gray-100">
                              {analysis.states_with_nexus ?? '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(analysis.total_liability)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(analysis.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(analysis.id)}
                                  aria-label={`View analysis for ${analysis.client_company_name}`}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(analysis.id, analysis.client_company_name)
                                  }
                                  disabled={deleteLoading === analysis.id}
                                  aria-label={`Delete analysis for ${analysis.client_company_name}`}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {deleteLoading === analysis.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  )}
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Showing {analyses.length} of {totalCount} analyses
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </AppLayout>
    </ProtectedRoute>
  )
}
