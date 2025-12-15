'use client'

import { useRouter } from 'next/navigation'
import { useClientOverview } from '@/hooks/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  Target,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import type { NextAction, Deadline, BlockingItem, StageInfo, StatesSummary } from '@/lib/api/clients'

interface ClientOverviewProps {
  clientId: string
}

// Stage display configuration
const STAGES = [
  { id: 'intake', label: 'Intake' },
  { id: 'data_collection', label: 'Data' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'recommendations', label: 'Review' },
  { id: 'execution', label: 'Execute' },
  { id: 'monitoring', label: 'Monitor' },
]

// Action type icons and colors
const ACTION_CONFIG: Record<string, { icon: React.ReactNode; bgColor: string; textColor: string }> = {
  data_request: { icon: <Clock className="h-4 w-4" />, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  discovery: { icon: <Target className="h-4 w-4" />, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  analysis: { icon: <Target className="h-4 w-4" />, bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  review: { icon: <CheckCircle2 className="h-4 w-4" />, bgColor: 'bg-green-50', textColor: 'text-green-700' },
  presentation: { icon: <CheckCircle2 className="h-4 w-4" />, bgColor: 'bg-green-50', textColor: 'text-green-700' },
  registration: { icon: <MapPin className="h-4 w-4" />, bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  vda: { icon: <AlertTriangle className="h-4 w-4" />, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  filing: { icon: <Calendar className="h-4 w-4" />, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  monitor: { icon: <Circle className="h-4 w-4" />, bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
}

// Stage Progress Component
function StageProgress({ stageInfo }: { stageInfo: StageInfo }) {
  const currentIndex = STAGES.findIndex(s => s.id === stageInfo.current_stage)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Workflow Progress</span>
        <span className="font-medium">{stageInfo.stage_progress}%</span>
      </div>

      {/* Stage indicators */}
      <div className="flex items-center justify-between">
        {STAGES.map((stage, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isPending = index > currentIndex

          return (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isComplete
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {index < STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-8 mx-1 ${
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <Progress value={stageInfo.stage_progress} className="h-2" />
    </div>
  )
}

// Next Action Card Component
function NextActionCard({
  action,
  isPrimary = false,
  onNavigate,
}: {
  action: NextAction
  isPrimary?: boolean
  onNavigate: (url: string) => void
}) {
  const config = ACTION_CONFIG[action.action_type] || ACTION_CONFIG.monitor

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isPrimary ? 'border-primary/50 bg-primary/5' : ''
      }`}
      onClick={() => action.target_url && onNavigate(action.target_url)}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${config.bgColor} ${config.textColor}`}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{action.action}</h4>
            {isPrimary && (
              <Badge variant="default" className="text-xs shrink-0">
                Next
              </Badge>
            )}
            {action.priority === 'high' && !isPrimary && (
              <Badge variant="destructive" className="text-xs shrink-0">
                High
              </Badge>
            )}
          </div>
          {action.context && (
            <p className="text-xs text-muted-foreground truncate">
              {action.context}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  )
}

// Deadlines Widget Component
function DeadlinesWidget({ deadlines, overdueCount }: { deadlines: Deadline[]; overdueCount: number }) {
  if (deadlines.length === 0 && overdueCount === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming deadlines</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {overdueCount > 0 && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{overdueCount} overdue</span>
          </div>
        </div>
      )}

      {deadlines.slice(0, 5).map((deadline, index) => (
        <div
          key={deadline.id || index}
          className={`flex items-center justify-between py-2 ${
            index < deadlines.length - 1 ? 'border-b border-border/50' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {deadline.state && (
              <Badge variant="outline" className="text-xs">
                {deadline.state}
              </Badge>
            )}
            <span className="text-sm truncate">{deadline.title}</span>
          </div>
          <span
            className={`text-xs font-medium ${
              deadline.is_overdue
                ? 'text-destructive'
                : deadline.days_until <= 7
                ? 'text-amber-600'
                : 'text-muted-foreground'
            }`}
          >
            {deadline.is_overdue
              ? `${Math.abs(deadline.days_until)}d overdue`
              : deadline.days_until === 0
              ? 'Today'
              : `${deadline.days_until}d`}
          </span>
        </div>
      ))}
    </div>
  )
}

// States Summary Widget Component
function StatesSummaryWidget({
  summary,
  onViewStates,
}: {
  summary: StatesSummary
  onViewStates: () => void
}) {
  const total = summary.total_with_nexus + summary.approaching_threshold

  if (total === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No states require attention</p>
        <p className="text-xs">Run an analysis to determine nexus</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {summary.total_with_nexus}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">Has Nexus</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {summary.approaching_threshold}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">Approaching</div>
        </div>
      </div>

      {/* Action breakdown */}
      {summary.needing_action > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Needing action</span>
            <span className="font-medium">{summary.needing_action}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">In progress</span>
            <span className="font-medium">{summary.in_progress}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Complete</span>
            <span className="font-medium text-green-600">{summary.complete}</span>
          </div>
        </div>
      )}

      {/* States list */}
      {summary.states_needing_action.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-1">
            {summary.states_needing_action.map((state) => (
              <Badge
                key={state}
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200"
              >
                {state}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={onViewStates}>
        View State Worklist
        <ArrowRight className="h-3 w-3 ml-2" />
      </Button>
    </div>
  )
}

// Blocking Items Widget Component
function BlockingItemsWidget({ items }: { items: BlockingItem[] }) {
  if (items.length === 0) return null

  return (
    <Card className="p-4 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <h4 className="font-medium text-sm text-amber-700 dark:text-amber-300">
          Blocking Progress
        </h4>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-amber-600 mt-1">•</span>
            <span className="text-amber-800 dark:text-amber-200">{item.item}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Main ClientOverview Component
export function ClientOverview({ clientId }: ClientOverviewProps) {
  const router = useRouter()
  const { data: overview, isLoading, error } = useClientOverview(clientId)

  const handleNavigate = (url: string) => {
    router.push(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Unable to load client overview</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Stage Progress */}
      <Card className="p-6">
        <StageProgress stageInfo={overview.stage_info} />
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Next Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Next Actions
          </h3>

          {overview.next_action ? (
            <div className="space-y-3">
              <NextActionCard
                action={overview.next_action}
                isPrimary
                onNavigate={handleNavigate}
              />

              {overview.secondary_actions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {overview.secondary_actions.map((action, index) => (
                      <NextActionCard
                        key={index}
                        action={action}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All caught up! No immediate actions required.</p>
            </Card>
          )}

          {/* Blocking Items */}
          <BlockingItemsWidget items={overview.blocking_items} />
        </div>

        {/* Right: Deadlines & States */}
        <div className="space-y-6">
          {/* Deadlines */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Deadlines
            </h4>
            <DeadlinesWidget
              deadlines={overview.upcoming_deadlines}
              overdueCount={overview.overdue_count}
            />
          </Card>

          {/* States Summary */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              States to Address
            </h4>
            <StatesSummaryWidget
              summary={overview.states_summary}
              onViewStates={() => handleNavigate(`/clients/${clientId}?tab=states`)}
            />
          </Card>

          {/* Intake Progress (if applicable) */}
          {overview.intake_progress && overview.intake_progress.completion_percentage < 100 && (
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Intake Progress
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">
                    {overview.intake_progress.completion_percentage}%
                  </span>
                </div>
                <Progress value={overview.intake_progress.completion_percentage} className="h-2" />
                {overview.intake_progress.missing_required.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Missing: {overview.intake_progress.missing_required.slice(0, 3).join(', ')}
                    {overview.intake_progress.missing_required.length > 3 && '...'}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientOverview
