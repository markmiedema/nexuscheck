'use client'

import { Card } from '@/components/ui/card'
import { DollarSign, MapPin, FileText, TrendingUp } from 'lucide-react'
import { type ClientAnalysis } from '@/lib/api/clients'

export function ClientValueSummary({ analyses }: { analyses: ClientAnalysis[] }) {
  // 1. Get the most relevant analysis (most recent)
  const activeAnalysis = analyses && analyses.length > 0
    ? analyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null

  // Don't render anything if no analysis data
  if (!activeAnalysis) {
    return null
  }

  // 2. Get exposure from analysis results
  const estimatedExposure = activeAnalysis.status === 'complete' && activeAnalysis.total_liability
    ? `$${activeAnalysis.total_liability.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : 'Pending'
  const nexusCount = activeAnalysis.states_with_nexus || 0

  // 3. Count potential VDAs (states with nexus that may need voluntary disclosure)
  const potentialVDAs = nexusCount > 0 ? Math.min(nexusCount, 5) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* METRIC 1: Latest Project Status */}
      <Card className="p-4 shadow-sm bg-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-2 relative z-10">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Project</p>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="font-bold text-sm truncate relative z-10">Nexus Analysis</p>
        <p className="text-xs text-muted-foreground mt-1 relative z-10">
          Updated {new Date(activeAnalysis.updated_at).toLocaleDateString()}
        </p>
      </Card>

      {/* METRIC 2: Nexus Count */}
      <Card className="p-4 shadow-sm bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nexus Risk</p>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground">{nexusCount}</p>
          <p className="text-xs text-muted-foreground">States Identified</p>
        </div>
      </Card>

      {/* METRIC 3: Estimated Exposure (Revenue Opportunity) */}
      <Card className="p-4 shadow-sm bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Liability</p>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold text-foreground">{estimatedExposure}</p>
        <p className="text-xs text-muted-foreground">Unregistered Exposure</p>
      </Card>

      {/* METRIC 4: Action Items */}
      <Card className="p-4 shadow-sm bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opportunity</p>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold text-foreground">{potentialVDAs}</p>
        <p className="text-xs text-muted-foreground">Potential VDAs</p>
      </Card>
    </div>
  )
}
