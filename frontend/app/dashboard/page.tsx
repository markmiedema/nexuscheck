'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useClients, useAnalyses } from '@/hooks/queries'
import type { Analysis } from '@/lib/api/analyses'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Target,
  FolderKanban,
  AlertCircle,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  FileWarning,
  Building2,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: analysesData, isLoading: analysesLoading } = useAnalyses()

  const analyses = analysesData?.analyses ?? []
  const isLoading = clientsLoading || analysesLoading

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active' || c.status === 'paused')
    const prospects = clients.filter(c => c.status === 'prospect' || !c.status)

    // Recent analyses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentAnalyses = analyses.filter(a => new Date(a.created_at) > thirtyDaysAgo)

    // Pending analyses (not complete)
    const pendingAnalyses = analyses.filter(a => a.status !== 'complete' && a.status !== 'error')

    // Completed analyses
    const completedAnalyses = analyses.filter(a => a.status === 'complete')

    return {
      activeClients: activeClients.length,
      prospects: prospects.length,
      totalProjects: analyses.length,
      pendingProjects: pendingAnalyses.length,
      completedProjects: completedAnalyses.length,
      recentProjects: recentAnalyses.length,
    }
  }, [clients, analyses])

  // Action items - things that need attention
  const actionItems = useMemo(() => {
    const items: Array<{
      id: string
      title: string
      description: string
      type: 'warning' | 'info' | 'action'
      href: string
    }> = []

    // Check for draft/incomplete analyses
    const incompleteAnalyses = analyses.filter(a => a.status === 'draft' || a.status === 'processing')
    incompleteAnalyses.forEach(analysis => {
      items.push({
        id: `analysis-${analysis.id}`,
        title: `Complete analysis for ${analysis.client_company_name || 'Untitled'}`,
        description: analysis.status === 'processing' ? 'Analysis is processing' : 'Analysis needs configuration',
        type: 'action',
        href: analysis.status === 'draft' ? `/analysis/${analysis.id}/mapping` : `/analysis/${analysis.id}/results`,
      })
    })

    // Check for prospects without recent activity (simplified check)
    const prospects = clients.filter(c => c.status === 'prospect' || !c.status)
    if (prospects.length > 0) {
      items.push({
        id: 'prospects-followup',
        title: `${prospects.length} prospect${prospects.length > 1 ? 's' : ''} in pipeline`,
        description: 'Review and follow up with prospects',
        type: 'info',
        href: '/clients?tab=prospects',
      })
    }

    return items.slice(0, 5) // Limit to 5 items
  }, [analyses, clients])

  // Recent activity - recent analyses
  const recentActivity = useMemo(() => {
    return analyses
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(analysis => ({
        id: analysis.id,
        title: analysis.client_company_name || 'Quick Analysis',
        status: analysis.status,
        date: new Date(analysis.created_at),
        href: `/analysis/${analysis.id}/results`,
      }))
  }, [analyses])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Complete</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Processing</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of your practice</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/clients/new')}>
                <Plus className="mr-2 h-4 w-4" /> New Client
              </Button>
              <Button onClick={() => router.push('/analysis/new')}>
                <Plus className="mr-2 h-4 w-4" /> New Analysis
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </>
            ) : (
              <>
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push('/clients?tab=active')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                        <p className="text-3xl font-bold">{metrics.activeClients}</p>
                      </div>
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push('/clients?tab=prospects')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pipeline</p>
                        <p className="text-3xl font-bold">{metrics.prospects}</p>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push('/projects')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                        <p className="text-3xl font-bold">{metrics.totalProjects}</p>
                      </div>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FolderKanban className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="text-3xl font-bold">{metrics.completedProjects}</p>
                      </div>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Action Items
                </CardTitle>
                <CardDescription>Things that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : actionItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(item.href)}
                      >
                        <div className="flex items-center gap-3">
                          {item.type === 'warning' ? (
                            <FileWarning className="h-5 w-5 text-amber-500 shrink-0" />
                          ) : item.type === 'action' ? (
                            <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                          ) : (
                            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
                <CardDescription>Latest analyses and projects</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-2" />
                    <p>No projects yet</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => router.push('/analysis/new')}
                    >
                      Create your first analysis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(activity.href)}
                      >
                        <div className="flex items-center gap-3">
                          <FolderKanban className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.date.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(activity.status)}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
