'use client'

import { Card } from '@/components/ui/card'
import { DollarSign, MapPin, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import { ClientAnalysis } from '@/lib/api/clients'

interface ClientValueSummaryProps {
  analyses: ClientAnalysis[]
  notesCount: number
}

export function ClientValueSummary({ analyses, notesCount }: ClientValueSummaryProps) {
  // Get the most recent completed analysis for metrics
  const completedAnalyses = analyses.filter(a => a.status === 'complete')
  const latestAnalysis = analyses[0] // Most recent (assuming sorted by date desc)
  const latestComplete = completedAnalyses[0]

  // Aggregate metrics from latest complete analysis
  const totalNexusStates = latestComplete?.states_with_nexus || 0
  const estimatedLiability = latestComplete?.total_liability || 0

  // Calculate pending action items
  const pendingProjects = analyses.filter(a => a.status === 'draft' || a.status === 'processing').length
  const actionItems = pendingProjects + (notesCount > 0 ? 0 : 1) // +1 if no notes logged yet

  // Don't show if no analyses exist
  if (analyses.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latest Project</p>
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        <p className="font-semibold text-sm truncate text-foreground">
          {latestAnalysis?.client_company_name || 'Nexus Analysis'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(latestAnalysis.created_at).toLocaleDateString()}
        </p>
      </Card>

      <Card className="p-4 border-l-4 border-l-red-500 shadow-sm bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nexus States</p>
          <MapPin className="h-4 w-4 text-red-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {totalNexusStates}
        </p>
        <p className="text-xs text-muted-foreground">Physical & Economic</p>
      </Card>

      <Card className="p-4 border-l-4 border-l-amber-500 shadow-sm bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Est. Exposure</p>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {estimatedLiability > 0
            ? `$${estimatedLiability.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
            : '—'
          }
        </p>
        <p className="text-xs text-muted-foreground">Unregistered Liability</p>
      </Card>

      <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</p>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{analyses.length}</p>
        <p className="text-xs text-muted-foreground">
          {completedAnalyses.length} completed
        </p>
      </Card>
    </div>
  )
}
