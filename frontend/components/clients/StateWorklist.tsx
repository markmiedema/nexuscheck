'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useStateWorklist,
  useImportStatesFromAnalysis,
  useClientAnalyses,
  NEXUS_STATUS_LABELS,
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  type StateWorklistItem,
} from '@/hooks/queries'
import {
  Loader2,
  AlertCircle,
  MapPin,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Import,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StateWorklistProps {
  clientId: string
  onSelectState: (state: string) => void
}

// Summary Cards
function WorklistSummary({ summary }: { summary: ReturnType<typeof useStateWorklist>['data'] extends infer T ? T extends { summary: infer S } ? S : never : never }) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium">Has Nexus</span>
        </div>
        <p className="text-2xl font-bold">{summary.states_with_nexus}</p>
        <p className="text-xs text-muted-foreground">states require action</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium">Approaching</span>
        </div>
        <p className="text-2xl font-bold">{summary.states_approaching}</p>
        <p className="text-xs text-muted-foreground">near threshold</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium">In Progress</span>
        </div>
        <p className="text-2xl font-bold">{summary.actions_in_progress}</p>
        <p className="text-xs text-muted-foreground">actions underway</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium">Blocked</span>
        </div>
        <p className="text-2xl font-bold">{summary.actions_blocked}</p>
        <p className="text-xs text-muted-foreground">need attention</p>
      </Card>
    </div>
  )
}

// Nexus Status Badge
function NexusStatusBadge({ status }: { status: string }) {
  const config = NEXUS_STATUS_LABELS[status] || NEXUS_STATUS_LABELS.unknown
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <Badge variant="outline" className={`text-xs ${colorMap[config.color] || colorMap.gray}`}>
      {config.label}
    </Badge>
  )
}

// Action Status Badge
function ActionStatusBadge({ status, type }: { status?: string; type?: string }) {
  if (!status || !type) {
    return <span className="text-xs text-muted-foreground">No action</span>
  }

  const typeLabel = ACTION_TYPE_LABELS[type as keyof typeof ACTION_TYPE_LABELS]?.label || type
  const statusConfig = ACTION_STATUS_LABELS[status as keyof typeof ACTION_STATUS_LABELS] || ACTION_STATUS_LABELS.not_started

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium">{typeLabel}</span>
      <Badge variant="outline" className={`text-xs ${colorMap[statusConfig.color] || colorMap.gray}`}>
        {statusConfig.label}
      </Badge>
    </div>
  )
}

// State Row
function StateRow({ item, onClick }: { item: StateWorklistItem; onClick: () => void }) {
  const taskProgress = item.tasks_total > 0
    ? Math.round((item.tasks_complete / item.tasks_total) * 100)
    : 0

  return (
    <div
      className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* State Code */}
      <div className="w-16 shrink-0">
        <Badge variant="outline" className="text-lg font-bold px-3 py-1">
          {item.state}
        </Badge>
      </div>

      {/* Nexus Status */}
      <div className="w-28 shrink-0">
        <NexusStatusBadge status={item.nexus_status} />
      </div>

      {/* Liability */}
      <div className="w-28 shrink-0 text-right">
        {item.estimated_liability ? (
          <span className="font-medium">{formatCurrency(item.estimated_liability)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>

      {/* Action Status */}
      <div className="flex-1 min-w-0">
        <ActionStatusBadge status={item.action_status} type={item.action_type} />
        {item.blocked_reason && (
          <p className="text-xs text-red-600 mt-1 truncate">{item.blocked_reason}</p>
        )}
      </div>

      {/* Task Progress */}
      <div className="w-32 shrink-0">
        {item.tasks_total > 0 ? (
          <div className="space-y-1">
            <Progress value={taskProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {item.tasks_complete}/{item.tasks_total} tasks
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No tasks</span>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}

// Import Dialog
function ImportSection({ clientId }: { clientId: string }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('')
  const { data: analyses = [] } = useClientAnalyses(clientId)
  const importMutation = useImportStatesFromAnalysis(clientId)

  const completedAnalyses = analyses.filter(a => a.status === 'complete')

  if (completedAnalyses.length === 0) return null

  return (
    <Card className="p-4 bg-muted/30 border-dashed mb-6">
      <div className="flex items-center gap-4">
        <Import className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Import from Nexus Analysis</p>
          <p className="text-xs text-muted-foreground">
            Auto-create state assessments from a completed analysis
          </p>
        </div>
        <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select analysis..." />
          </SelectTrigger>
          <SelectContent>
            {completedAnalyses.map(a => (
              <SelectItem key={a.id} value={a.id}>
                {new Date(a.created_at).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!selectedAnalysis || importMutation.isPending}
          onClick={() => importMutation.mutate(selectedAnalysis)}
        >
          {importMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Import'
          )}
        </Button>
      </div>
    </Card>
  )
}

// Main Component
export function StateWorklist({ clientId, onSelectState }: StateWorklistProps) {
  const [nexusFilter, setNexusFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const { data, isLoading, error } = useStateWorklist(clientId, {
    nexus_status: nexusFilter !== 'all' ? nexusFilter : undefined,
    action_status: actionFilter !== 'all' ? actionFilter : undefined,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
        <p className="text-red-600">Failed to load state worklist</p>
      </Card>
    )
  }

  const { items = [], summary } = data || {}

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && <WorklistSummary summary={summary} />}

      {/* Import Section */}
      <ImportSection clientId={clientId} />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={nexusFilter} onValueChange={setNexusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Nexus Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Nexus</SelectItem>
            <SelectItem value="has_nexus">Has Nexus</SelectItem>
            <SelectItem value="approaching">Approaching</SelectItem>
            <SelectItem value="no_nexus">No Nexus</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <p className="text-sm text-muted-foreground">
          {items.length} state{items.length !== 1 ? 's' : ''}
          {summary?.total_estimated_liability ? (
            <> • {formatCurrency(summary.total_estimated_liability)} total liability</>
          ) : null}
        </p>
      </div>

      {/* State List */}
      {items.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">No State Assessments</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import states from a nexus analysis or add them manually.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
            <div className="w-16">State</div>
            <div className="w-28">Nexus Status</div>
            <div className="w-28 text-right">Est. Liability</div>
            <div className="flex-1">Current Action</div>
            <div className="w-32 text-center">Tasks</div>
            <div className="w-4" />
          </div>

          {/* Rows */}
          {items.map(item => (
            <StateRow
              key={item.id}
              item={item}
              onClick={() => onSelectState(item.state)}
            />
          ))}
        </Card>
      )}
    </div>
  )
}

export default StateWorklist
