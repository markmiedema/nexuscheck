'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useClientEngagements,
  useClientOverview,
  type Engagement,
  type ClientOverview,
} from '@/hooks/queries'
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  AlertTriangle,
  Target,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

// Stage configuration
const STAGE_CONFIG: Record<string, {
  label: string
  color: string
  icon: typeof Clock
  order: number
}> = {
  intake: { label: 'Data Collection', color: 'bg-blue-500', icon: FileText, order: 1 },
  data: { label: 'Data Validation', color: 'bg-blue-500', icon: FileText, order: 2 },
  analysis: { label: 'Analysis', color: 'bg-purple-500', icon: Play, order: 3 },
  recommendations: { label: 'Review', color: 'bg-orange-500', icon: Target, order: 4 },
  execution: { label: 'Execution', color: 'bg-emerald-500', icon: CheckCircle2, order: 5 },
  monitoring: { label: 'Monitoring', color: 'bg-gray-500', icon: Clock, order: 6 },
}

// Engagement status badge config
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'outline' },
  signed: { label: 'Signed', variant: 'default' },
  archived: { label: 'Archived', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

interface EngagementHeaderProps {
  clientId: string
  engagementId?: string
  onEngagementChange?: (engagementId: string) => void
}

export function EngagementHeader({
  clientId,
  engagementId,
  onEngagementChange,
}: EngagementHeaderProps) {
  const router = useRouter()

  // Fetch data
  const { data: engagements, isLoading: engagementsLoading } = useClientEngagements(clientId)
  const { data: overview, isLoading: overviewLoading } = useClientOverview(clientId)

  // Determine active engagement
  const activeEngagement = useMemo(() => {
    if (!engagements?.length) return null

    // If engagementId is provided, find that one
    if (engagementId) {
      return engagements.find(e => e.id === engagementId) || null
    }

    // Otherwise, find the most recent signed engagement
    const signed = engagements.filter(e => e.status === 'signed')
    if (signed.length > 0) {
      return signed.sort((a, b) =>
        new Date(b.signed_at || b.created_at).getTime() -
        new Date(a.signed_at || a.created_at).getTime()
      )[0]
    }

    // Fall back to most recent engagement
    return engagements.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }, [engagements, engagementId])

  // Get stage info
  const stageInfo = overview?.stage_info
  const currentStage = stageInfo?.current_stage || 'intake'
  const stageProgress = stageInfo?.stage_progress || 0
  const stageConfig = STAGE_CONFIG[currentStage] || STAGE_CONFIG.intake

  // Get next action
  const nextAction = overview?.next_action

  // Format due date
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = parseISO(dateString)
      const isOverdue = isPast(date)
      const distance = formatDistanceToNow(date, { addSuffix: true })
      return { text: distance, isOverdue }
    } catch {
      return null
    }
  }

  const dueDateInfo = nextAction?.due_date ? formatDueDate(nextAction.due_date) : null

  // Handle engagement change
  const handleEngagementChange = (newEngagementId: string) => {
    if (onEngagementChange) {
      onEngagementChange(newEngagementId)
    }
    // Could also update URL if using route-based engagement
  }

  // Loading state
  if (engagementsLoading || overviewLoading) {
    return (
      <div className="bg-card border-b sticky top-0 z-40">
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-4" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-2 w-full max-w-xs" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border-b sticky top-0 z-40">
      <div className="px-6 py-4">
        {/* Row 1: Client > Engagement Picker > Status */}
        <div className="flex items-center gap-2 mb-3">
          {/* Client name link */}
          <Link
            href="/clients"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {overview?.company_name || 'Client'}
          </Link>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />

          {/* Engagement picker */}
          {engagements && engagements.length > 0 ? (
            <Select
              value={activeEngagement?.id || ''}
              onValueChange={handleEngagementChange}
            >
              <SelectTrigger className="w-auto min-w-[200px] h-8 text-sm font-semibold border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
                <SelectValue placeholder="Select engagement..." />
              </SelectTrigger>
              <SelectContent>
                {engagements.map((engagement) => (
                  <SelectItem key={engagement.id} value={engagement.id}>
                    <div className="flex items-center gap-2">
                      <span>{engagement.title}</span>
                      <Badge
                        variant={STATUS_CONFIG[engagement.status]?.variant || 'secondary'}
                        className="text-xs"
                      >
                        {STATUS_CONFIG[engagement.status]?.label || engagement.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">No engagement</span>
          )}

          {/* Engagement status badge (for quick glance) */}
          {activeEngagement && (
            <Badge
              variant={STATUS_CONFIG[activeEngagement.status]?.variant || 'secondary'}
              className="ml-2"
            >
              {STATUS_CONFIG[activeEngagement.status]?.label || activeEngagement.status}
            </Badge>
          )}
        </div>

        {/* Row 2: Stage Progress */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-2 h-2 rounded-full ${stageConfig.color}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current stage: {stageConfig.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm font-medium">
              Stage: {stageConfig.label}
            </span>
            <span className="text-sm text-muted-foreground">
              ({stageProgress}%)
            </span>
          </div>

          <div className="flex-1 max-w-xs">
            <Progress value={stageProgress} className="h-1.5" />
          </div>

          {/* KPI badges */}
          {overview?.states_summary && (
            <div className="flex items-center gap-3 text-xs">
              {overview.states_summary.total_with_nexus > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="font-normal">
                        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                        {overview.states_summary.total_with_nexus} nexus
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>States with nexus requiring action</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {overview.states_summary.approaching_threshold > 0 && (
                <Badge variant="outline" className="font-normal">
                  <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
                  {overview.states_summary.approaching_threshold} approaching
                </Badge>
              )}
              {overview.is_blocked && (
                <Badge variant="destructive" className="font-normal">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Row 3: Next Action */}
        {nextAction && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Target className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">
                {nextAction.action}
              </span>
              {nextAction.context && (
                <span className="text-sm text-muted-foreground ml-2">
                  — {nextAction.context}
                </span>
              )}
            </div>
            {dueDateInfo && (
              <div className={`flex items-center gap-1 text-xs ${
                dueDateInfo.isOverdue ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                <Calendar className="h-3 w-3" />
                <span>{dueDateInfo.text}</span>
              </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View
              </Button>
              <Button variant="default" size="sm" className="h-7 text-xs">
                Done
              </Button>
            </div>
          </div>
        )}

        {/* No engagement warning */}
        {!activeEngagement && engagements?.length === 0 && (
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                No engagement created yet
              </span>
              <span className="text-sm text-orange-600 dark:text-orange-300 ml-2">
                — Create an engagement to unlock analysis and remediation tools
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Create Engagement
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EngagementHeader
