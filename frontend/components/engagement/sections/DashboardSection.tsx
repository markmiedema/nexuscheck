'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  useClientOverview,
  type ClientOverview,
  type NextAction,
  type Deadline,
  type BlockingItem,
} from '@/hooks/queries'
import {
  AlertCircle,
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bell,
  MapPin,
  Play,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow, isPast, parseISO, differenceInDays } from 'date-fns'

interface DashboardSectionProps {
  clientId: string
  onNavigateToExecution?: () => void
  onNavigateToData?: () => void
}

// Format due date with urgency
function formatDueDate(dateString?: string): { text: string; isOverdue: boolean; daysUntil: number } | null {
  if (!dateString) return null
  try {
    const date = parseISO(dateString)
    const isOverdue = isPast(date)
    const daysUntil = differenceInDays(date, new Date())
    const text = formatDistanceToNow(date, { addSuffix: true })
    return { text, isOverdue, daysUntil }
  } catch {
    return null
  }
}

// Blockers Section
function BlockersSection({ blockers }: { blockers: BlockingItem[] }) {
  if (!blockers?.length) return null

  return (
    <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h3 className="font-semibold text-red-800 dark:text-red-200">
          Blocking Progress ({blockers.length})
        </h3>
      </div>
      <div className="space-y-2">
        {blockers.map((blocker, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{blocker.item}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Category: {blocker.category}
                {blocker.blocking_states?.length > 0 && ` • Blocking: ${blocker.blocking_states.join(', ')}`}
              </p>
              {blocker.since && (
                <p className="text-xs text-red-600 mt-1">
                  Blocked {formatDistanceToNow(parseISO(blocker.since), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Resolve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Next Actions Section
function NextActionsSection({
  nextAction,
  secondaryActions,
}: {
  nextAction?: NextAction
  secondaryActions?: NextAction[]
}) {
  const allActions = [
    ...(nextAction ? [{ ...nextAction, isPrimary: true }] : []),
    ...(secondaryActions?.slice(0, 2).map(a => ({ ...a, isPrimary: false })) || []),
  ]

  if (allActions.length === 0) {
    return (
      <Card className="p-6 text-center border-dashed">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-50" />
        <p className="text-sm text-muted-foreground">No pending actions</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Next Actions
      </h3>
      <div className="space-y-2">
        {allActions.map((action, i) => {
          const dueDateInfo = formatDueDate(action.due_date)
          return (
            <Card
              key={i}
              className={`p-4 ${action.isPrimary ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {action.isPrimary ? (
                    <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${action.isPrimary ? 'text-primary' : ''}`}>
                      {action.action}
                    </p>
                    {action.context && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {action.context}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {dueDateInfo && (
                    <span className={`text-xs flex items-center gap-1 ${
                      dueDateInfo.isOverdue ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      {dueDateInfo.text}
                    </span>
                  )}
                  <Button variant={action.isPrimary ? 'default' : 'outline'} size="sm" className="h-7 text-xs">
                    {action.action_type === 'run_analysis' ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    ) : (
                      'View'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Deadlines Section
function DeadlinesSection({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines?.length) return null

  // Group by urgency
  const overdue = deadlines.filter(d => {
    const info = formatDueDate(d.due_date)
    return info?.isOverdue
  })
  const thisWeek = deadlines.filter(d => {
    const info = formatDueDate(d.due_date)
    return info && !info.isOverdue && info.daysUntil <= 7
  })
  const upcoming = deadlines.filter(d => {
    const info = formatDueDate(d.due_date)
    return info && !info.isOverdue && info.daysUntil > 7
  })

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Deadlines
      </h3>
      <div className="space-y-3">
        {overdue.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-600 mb-1">OVERDUE ({overdue.length})</p>
            <div className="space-y-1">
              {overdue.map((d, i) => (
                <DeadlineRow key={i} deadline={d} variant="overdue" />
              ))}
            </div>
          </div>
        )}
        {thisWeek.length > 0 && (
          <div>
            <p className="text-xs font-medium text-orange-600 mb-1">THIS WEEK ({thisWeek.length})</p>
            <div className="space-y-1">
              {thisWeek.map((d, i) => (
                <DeadlineRow key={i} deadline={d} variant="warning" />
              ))}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">UPCOMING ({upcoming.length})</p>
            <div className="space-y-1">
              {upcoming.slice(0, 3).map((d, i) => (
                <DeadlineRow key={i} deadline={d} variant="normal" />
              ))}
              {upcoming.length > 3 && (
                <p className="text-xs text-muted-foreground">+{upcoming.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function DeadlineRow({
  deadline,
  variant,
}: {
  deadline: Deadline
  variant: 'overdue' | 'warning' | 'normal'
}) {
  const dueDateInfo = formatDueDate(deadline.due_date)
  const colorClass =
    variant === 'overdue'
      ? 'text-red-600'
      : variant === 'warning'
      ? 'text-orange-600'
      : 'text-muted-foreground'

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="flex items-center gap-2 min-w-0">
        {deadline.state && (
          <Badge variant="outline" className="text-xs shrink-0">
            {deadline.state}
          </Badge>
        )}
        <span className="truncate">{deadline.title}</span>
      </div>
      <span className={`text-xs ${colorClass} shrink-0`}>
        {dueDateInfo?.text}
      </span>
    </div>
  )
}

// States Snapshot Section
function StatesSnapshotSection({
  statesSummary,
  onViewAll,
}: {
  statesSummary: ClientOverview['states_summary']
  onViewAll?: () => void
}) {
  if (!statesSummary) return null

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          States Snapshot
        </h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onViewAll}>
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 mb-3">
        <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
          <p className="text-lg font-bold text-red-600">{statesSummary.total_with_nexus}</p>
          <p className="text-xs text-muted-foreground">Nexus</p>
        </div>
        <div className="text-center p-2 rounded bg-orange-50 dark:bg-orange-900/20">
          <p className="text-lg font-bold text-orange-600">{statesSummary.approaching_threshold}</p>
          <p className="text-xs text-muted-foreground">Approaching</p>
        </div>
        <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
          <p className="text-lg font-bold text-blue-600">{statesSummary.in_progress}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="text-center p-2 rounded bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-lg font-bold text-yellow-600">{statesSummary.needing_action}</p>
          <p className="text-xs text-muted-foreground">Blocked</p>
        </div>
        <div className="text-center p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-lg font-bold text-emerald-600">{statesSummary.complete}</p>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>
      {statesSummary.states_needing_action?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {statesSummary.states_needing_action.slice(0, 8).map((state) => (
            <Badge key={state} variant="outline" className="text-xs">
              {state}
            </Badge>
          ))}
          {statesSummary.states_needing_action.length > 8 && (
            <Badge variant="secondary" className="text-xs">
              +{statesSummary.states_needing_action.length - 8} more
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}

// Main Dashboard Section
export function DashboardSection({
  clientId,
  onNavigateToExecution,
  onNavigateToData,
}: DashboardSectionProps) {
  const { data: overview, isLoading, error } = useClientOverview(clientId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !overview) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500 opacity-50" />
        <p className="text-sm text-muted-foreground">Failed to load dashboard data</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Blockers (top priority) */}
      <BlockersSection blockers={overview.blocking_items} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Next Actions */}
        <NextActionsSection
          nextAction={overview.next_action}
          secondaryActions={overview.secondary_actions}
        />

        {/* Right: Deadlines */}
        <DeadlinesSection deadlines={overview.upcoming_deadlines} />
      </div>

      {/* States Snapshot */}
      <StatesSnapshotSection
        statesSummary={overview.states_summary}
        onViewAll={onNavigateToExecution}
      />
    </div>
  )
}

export default DashboardSection
