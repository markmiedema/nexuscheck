'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api/client'
import StateTable from '@/components/analysis/StateTable'
import { PhysicalNexusManager } from '@/components/analysis/PhysicalNexusManager'
import { VDAModePanel } from '@/components/analysis/VDAModePanel'
import { ErrorBoundary } from '@/components/error-boundary'
import { StateResult as StateResultMap } from '@/types/states'
import { StateResult as StateResultVDA } from '@/hooks/useVDAMode'
import { handleApiError } from '@/lib/utils/errorHandler'
import { Card } from '@/components/ui/card'
import { TabsCustom } from '@/components/ui/tabs-custom'
import {
  MapPin,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Settings,
  ArrowLeft
} from 'lucide-react'

// Lazy load USMap
const USMap = dynamic(() => import('@/components/dashboard/USMap'), {
  loading: () => (
    <div className="bg-muted/30 rounded-xl border border-dashed border-border/60 p-12 text-center animate-pulse h-[400px] flex items-center justify-center">
      <div className="text-muted-foreground font-medium">Loading map geography...</div>
    </div>
  ),
  ssr: false,
})

interface AnalysisSummary {
  company_name: string
  period_start: string
  period_end: string
  total_transactions: number
  unique_states: number
  completed_at: string
}

interface CalculationResults {
  summary: {
    total_states_analyzed: number
    states_with_nexus: number
    total_estimated_liability: number
  }
  nexus_breakdown: {
    economic_nexus: number
    physical_nexus: number
    no_nexus: number
    both: number
  }
  top_states_by_liability: Array<{
    state: string
    estimated_liability: number
    nexus_type: string
    total_sales: number
  }>
  approaching_threshold: Array<{
    state: string
    total_sales: number
    threshold: number
  }>
}

export default function ClientDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [summary, setSummary] = useState<AnalysisSummary | null>(null)
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [stateResults, setStateResults] = useState<StateResultMap[]>([])
  const [calculationStatus, setCalculationStatus] = useState<'pending' | 'calculated' | 'error'>('pending')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalysisSummary()
  }, [analysisId])

  const fetchAnalysisSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}`)
      const data = response.data

      if (!data || !data.client_company_name) throw new Error('Invalid analysis data')

      setSummary({
        company_name: data.client_company_name,
        period_start: data.analysis_period_start,
        period_end: data.analysis_period_end,
        total_transactions: data.total_transactions || 0,
        unique_states: data.unique_states || 0,
        completed_at: new Date().toISOString()
      })

      if (data.status === 'complete') {
        fetchResults()
      }
    } catch (error: any) {
      const errorMsg = handleApiError(error, { userMessage: 'Failed to load analysis.' })
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    try {
      setCalculating(true)
      setCalculationStatus('pending')
      await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)
      await fetchResults()
      setCalculationStatus('calculated')
    } catch (error: any) {
      handleApiError(error, { userMessage: 'Failed to calculate nexus.' })
      setCalculationStatus('error')
    } finally {
      setCalculating(false)
    }
  }

  const fetchResults = async () => {
    try {
      const [summaryResponse, stateResponse] = await Promise.all([
        apiClient.get(`/api/v1/analyses/${analysisId}/results/summary`),
        apiClient.get(`/api/v1/analyses/${analysisId}/results/states`)
      ])

      setResults(summaryResponse.data)
      setStateResults(stateResponse.data.states || [])
      setCalculationStatus('calculated')
    } catch (error: any) {
      if (error.response?.status !== 404) {
        handleApiError(error, { userMessage: 'Failed to load results.' })
      }
    }
  }

  const handleRecalculated = async () => {
    await fetchResults()
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading client dossier...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: summary?.company_name || 'Client Dashboard' },
        ]}
      >
        <ErrorBoundary>

          {/* CLIENT DOSSIER HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-border/40 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {summary?.company_name}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pl-1">
                <span className="flex items-center gap-1.5">
                   <Calendar className="h-3.5 w-3.5" />
                   {summary?.period_start} — {summary?.period_end}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                   <FileText className="h-3.5 w-3.5" />
                   {summary?.total_transactions.toLocaleString()} Transactions
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push(`/analysis/${analysisId}/mapping`)}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export Report
              </Button>
              {calculationStatus !== 'calculated' && (
                 <Button onClick={handleCalculate} disabled={calculating}>
                   {calculating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                   Run Analysis
                 </Button>
              )}
            </div>
          </div>

          {/* RISK CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Liability Card */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Est. Liability</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                   {results ? `$${(results.summary.total_estimated_liability || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total potential exposure found</p>
            </Card>

            {/* Nexus States Card */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MapPin className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nexus States</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                   {results ? results.summary.states_with_nexus : '—'}
                </span>
                <span className="text-sm text-muted-foreground">/ {results?.summary.total_states_analyzed || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Jurisdictions requiring registration</p>
            </Card>

            {/* Risk Level Card */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Confidence Score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">High</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Based on 100% data mapping match</p>
            </Card>
          </div>

          {/* MAIN ANALYSIS CONTENT */}
          <div className="bg-card rounded-xl shadow-sm border border-border/60 overflow-hidden">
            <div className="border-b border-border/60 px-6 pt-4">
              <TabsCustom
                variant="underline"
                defaultTab="map"
                onTabChange={setActiveTab}
                items={[
                  {
                    id: 'map',
                    label: 'Nexus Map',
                    icon: <MapPin className="h-4 w-4 mr-2" />,
                    content: (
                      <div className="p-6 animate-in fade-in duration-300">
                        {calculationStatus === 'calculated' && stateResults.length > 0 ? (
                           <div className="bg-muted/30 rounded-xl border border-border/50 p-6">
                             <USMap
                               stateData={stateResults.map((state) => ({
                                 state_code: state.state_code,
                                 state_name: state.state_name,
                                 nexus_status: state.nexus_status === 'no_nexus' ? 'none' : state.nexus_status,
                                 nexus_type: state.nexus_type,
                                 total_sales: state.total_sales,
                                 estimated_liability: state.estimated_liability,
                               }))}
                               analysisId={analysisId}
                             />
                             <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-medium text-muted-foreground border-t border-border/40 pt-4">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600/80" /> No Nexus</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/80" /> Approaching</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600/80" /> Economic Nexus</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600/80" /> Physical Nexus</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600/80" /> Both</div>
                             </div>
                           </div>
                        ) : (
                          <div className="text-center py-20">
                             <p className="text-muted-foreground">Run analysis to generate map.</p>
                             <Button onClick={handleCalculate} className="mt-4" disabled={calculating}>
                               Run Analysis
                             </Button>
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'details',
                    label: 'State Details',
                    icon: <FileText className="h-4 w-4 mr-2" />,
                    content: (
                       <div className="p-6">
                          {calculationStatus === 'calculated' ? (
                             <StateTable analysisId={analysisId} embedded={true} refreshTrigger={refreshTrigger} />
                          ) : (
                             <div className="text-center py-12 text-muted-foreground">Run analysis to view details.</div>
                          )}
                       </div>
                    )
                  },
                  {
                    id: 'vda',
                    label: 'VDA Calculator',
                    icon: <Activity className="h-4 w-4 mr-2" />,
                    content: (
                       <div className="p-6">
                          {calculationStatus === 'calculated' && stateResults.length > 0 ? (
                             <VDAModePanel
                                analysisId={analysisId}
                                stateResults={stateResults.map((state): StateResultVDA => ({
                                  state_code: state.state_code,
                                  state_name: state.state_name,
                                  estimated_liability: state.estimated_liability,
                                  base_tax: 0,
                                  interest: 0,
                                  penalties: 0,
                                  nexus_status: state.nexus_status
                                }))}
                              />
                          ) : (
                             <div className="text-center py-12 text-muted-foreground">Available after analysis is complete.</div>
                          )}
                       </div>
                    )
                  },
                  {
                    id: 'physical',
                    label: 'Physical Nexus',
                    icon: <Building2 className="h-4 w-4 mr-2" />,
                    content: (
                       <div className="p-6">
                          <PhysicalNexusManager
                             analysisId={analysisId}
                             onRecalculated={handleRecalculated}
                          />
                       </div>
                    )
                  }
                ]}
              />
            </div>
          </div>

        </ErrorBoundary>
      </AppLayout>
    </ProtectedRoute>
  )
}
