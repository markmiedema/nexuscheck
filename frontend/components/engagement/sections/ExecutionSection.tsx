'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StateDetailDrawer } from '@/components/clients/StateDetailDrawer'
import { useStateWorklist } from '@/hooks/queries'
import { type StateWorklistItem } from '@/lib/api/stateWorklist'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatting'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronRight,
  FileText,
  Shield,
  Scale,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'

interface ExecutionSectionProps {
  clientId: string
}

// Status filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
]

// Action type filter options
const ACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'nexus_study', label: 'Nexus Study' },
  { value: 'vda', label: 'VDA' },
  { value: 'registration', label: 'Registration' },
  { value: 'compliance', label: 'Compliance' },
]

// Nexus status filter
const NEXUS_OPTIONS = [
  { value: 'all', label: 'All Nexus' },
  { value: 'nexus', label: 'Has Nexus' },
  { value: 'approaching', label: 'Approaching' },
  { value: 'no_nexus', label: 'No Nexus' },
]

// Get status config for display
function getStatusConfig(status?: string): { label: string; color: string; icon: typeof Clock } {
  switch (status) {
    case 'complete':
      return { label: 'Complete', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 }
    case 'in_progress':
      return { label: 'In Progress', color: 'text-blue-600 bg-blue-50', icon: Clock }
    case 'blocked':
      return { label: 'Blocked', color: 'text-red-600 bg-red-50', icon: Ban }
    case 'not_started':
    default:
      return { label: 'Not Started', color: 'text-gray-600 bg-gray-50', icon: AlertCircle }
  }
}

// Get nexus status config
function getNexusConfig(status: string): { label: string; color: string } {
  switch (status) {
    case 'nexus':
      return { label: 'Nexus', color: 'bg-red-100 text-red-700 border-red-200' }
    case 'approaching':
      return { label: 'Approaching', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    case 'no_nexus':
      return { label: 'No Nexus', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }
}

// Get action type config
function getActionTypeConfig(type?: string): { label: string; icon: typeof FileText } {
  switch (type) {
    case 'nexus_study':
      return { label: 'Study', icon: FileText }
    case 'vda':
      return { label: 'VDA', icon: Shield }
    case 'registration':
      return { label: 'Registration', icon: Scale }
    case 'compliance':
      return { label: 'Compliance', icon: Calendar }
    default:
      return { label: 'TBD', icon: FileText }
  }
}

// Format target date with urgency
function formatTargetDate(dateString?: string): { text: string; isOverdue: boolean } | null {
  if (!dateString) return null
  try {
    const date = parseISO(dateString)
    const isOverdue = isPast(date)
    const text = formatDistanceToNow(date, { addSuffix: true })
    return { text, isOverdue }
  } catch {
    return null
  }
}

// Single row component for the worklist
function WorklistRow({
  item,
  onClick,
}: {
  item: StateWorklistItem
  onClick: () => void
}) {
  const statusConfig = getStatusConfig(item.action_status)
  const nexusConfig = getNexusConfig(item.nexus_status)
  const actionConfig = getActionTypeConfig(item.action_type)
  const dueDateInfo = formatTargetDate(item.target_date)
  const StatusIcon = statusConfig.icon
  const ActionIcon = actionConfig.icon

  const taskProgress = item.tasks_total > 0
    ? Math.round((item.tasks_complete / item.tasks_total) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      className={cn(
        'grid grid-cols-[80px_1fr_100px_120px_100px_100px_80px_40px] gap-4 items-center px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors',
        item.action_status === 'blocked' && 'bg-red-50/30'
      )}
    >
      {/* State */}
      <div className="font-mono font-semibold text-sm">{item.state}</div>

      {/* Action Type + Nexus Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', nexusConfig.color)}>
          {nexusConfig.label}
        </Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ActionIcon className="h-3.5 w-3.5" />
          <span>{actionConfig.label}</span>
        </div>
        {item.blocked_reason && (
          <span className="text-xs text-red-600 truncate max-w-[150px]">— {item.blocked_reason}</span>
        )}
      </div>

      {/* Status */}
      <div className={cn('flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 w-fit', statusConfig.color)}>
        <StatusIcon className="h-3 w-3" />
        {statusConfig.label}
      </div>

      {/* Due Date */}
      <div className={cn('text-sm', dueDateInfo?.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
        {dueDateInfo?.text || '—'}
      </div>

      {/* Tasks Progress */}
      <div className="text-sm">
        <span className="font-medium">{item.tasks_complete}</span>
        <span className="text-muted-foreground">/{item.tasks_total}</span>
        {item.tasks_total > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({taskProgress}%)</span>
        )}
      </div>

      {/* Estimated Liability (risk indicator) */}
      <div className="text-sm text-muted-foreground">
        {item.estimated_liability ? formatCurrency(item.estimated_liability) : '—'}
      </div>

      {/* Threshold */}
      <div className="text-sm">
        {item.threshold_percentage !== undefined ? (
          <span className={cn(
            'font-medium',
            item.threshold_percentage >= 100 ? 'text-red-600' :
            item.threshold_percentage >= 75 ? 'text-orange-600' : 'text-muted-foreground'
          )}>
            {item.threshold_percentage}%
          </span>
        ) : '—'}
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

export function ExecutionSection({ clientId }: ExecutionSectionProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [nexusFilter, setNexusFilter] = useState('all')

  const { data: worklistData, isLoading, error } = useStateWorklist(clientId)

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    if (!worklistData?.items) return []

    return worklistData.items.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.action_status !== statusFilter) {
        return false
      }
      // Action type filter
      if (actionTypeFilter !== 'all' && item.action_type !== actionTypeFilter) {
        return false
      }
      // Nexus filter
      if (nexusFilter !== 'all' && item.nexus_status !== nexusFilter) {
        return false
      }
      return true
    })
  }, [worklistData?.items, statusFilter, actionTypeFilter, nexusFilter])

  // Sort: blocked first, then by status priority, then by state
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Blocked items first
      if (a.action_status === 'blocked' && b.action_status !== 'blocked') return -1
      if (b.action_status === 'blocked' && a.action_status !== 'blocked') return 1

      // Then by status priority
      const statusPriority: Record<string, number> = {
        'in_progress': 1,
        'not_started': 2,
        'complete': 3,
      }
      const aPriority = statusPriority[a.action_status || 'not_started'] || 2
      const bPriority = statusPriority[b.action_status || 'not_started'] || 2
      if (aPriority !== bPriority) return aPriority - bPriority

      // Then alphabetically by state
      return a.state.localeCompare(b.state)
    })
  }, [filteredItems])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500 opacity-50" />
        <p className="text-sm text-muted-foreground">Failed to load state worklist</p>
      </Card>
    )
  }

  const summary = worklistData?.summary

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {summary && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{summary.total_states} states</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {summary.states_with_nexus} nexus
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {summary.states_approaching} approaching
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {summary.actions_in_progress} in progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              {summary.actions_blocked} blocked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {summary.actions_complete} complete
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={nexusFilter} onValueChange={setNexusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NEXUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <span className="text-sm text-muted-foreground">
          {sortedItems.length} of {worklistData?.items?.length || 0} shown
        </span>
      </div>

      {/* Worklist table */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[80px_1fr_100px_120px_100px_100px_80px_40px] gap-4 items-center px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div>State</div>
          <div>Type / Status</div>
          <div>Action</div>
          <div>Due</div>
          <div>Tasks</div>
          <div>Est. Liability</div>
          <div>Threshold</div>
          <div></div>
        </div>

        {/* Rows */}
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
          {sortedItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No states match your filters</p>
            </div>
          ) : (
            sortedItems.map(item => (
              <WorklistRow
                key={item.id}
                item={item}
                onClick={() => setSelectedState(item.state)}
              />
            ))
          )}
        </div>
      </Card>

      {/* State detail drawer */}
      <StateDetailDrawer
        clientId={clientId}
        state={selectedState}
        open={!!selectedState}
        onClose={() => setSelectedState(null)}
      />
    </div>
  )
}

export default ExecutionSection
