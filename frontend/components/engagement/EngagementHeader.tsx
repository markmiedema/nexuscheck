'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useClientEngagements,
  useClientOverview,
} from '@/hooks/queries'
import {
  ChevronRight,
  AlertCircle,
  ChevronDown,
  Info,
  Target,
  Play,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

// Stage configuration - simplified
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  intake: { label: 'Intake', color: 'bg-blue-500' },
  data: { label: 'Data', color: 'bg-blue-500' },
  analysis: { label: 'Analysis', color: 'bg-purple-500' },
  recommendations: { label: 'Review', color: 'bg-orange-500' },
  execution: { label: 'Execution', color: 'bg-emerald-500' },
  monitoring: { label: 'Monitoring', color: 'bg-gray-500' },
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
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch data
  const { data: engagements, isLoading: engagementsLoading } = useClientEngagements(clientId)
  const { data: overview, isLoading: overviewLoading } = useClientOverview(clientId)

  // Determine active engagement
  const activeEngagement = useMemo(() => {
    if (!engagements?.length) return null
    if (engagementId) {
      return engagements.find(e => e.id === engagementId) || null
    }
    const signed = engagements.filter(e => e.status === 'signed')
    if (signed.length > 0) {
      return signed.sort((a, b) =>
        new Date(b.signed_at || b.created_at).getTime() -
        new Date(a.signed_at || a.created_at).getTime()
      )[0]
    }
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
  }

  // Loading state - compact
  if (engagementsLoading || overviewLoading) {
    return (
      <div className="h-14 bg-card border-b flex items-center px-6 gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-20" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-32" />
      </div>
    )
  }

  return (
    <div className="h-14 bg-card border-b flex items-center px-6 gap-3">
      {/* Client name */}
      <Link
        href="/clients"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        {overview?.company_name || 'Client'}
      </Link>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Engagement picker */}
      {engagements && engagements.length > 0 ? (
        <Select
          value={activeEngagement?.id || ''}
          onValueChange={handleEngagementChange}
        >
          <SelectTrigger className="w-auto min-w-[180px] h-8 text-sm font-semibold border-0 bg-muted/50 hover:bg-muted focus:ring-0 shrink-0">
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
        <Button variant="outline" size="sm" className="h-8 text-sm">
          + Create Engagement
        </Button>
      )}

      {/* Stage pill */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-2 h-2 rounded-full ${stageConfig.color}`} />
        <span className="text-sm font-medium">{stageConfig.label}</span>
        <span className="text-xs text-muted-foreground">({stageProgress}%)</span>
      </div>

      {/* Quick KPI badges - only show if notable */}
      {overview?.states_summary?.total_with_nexus ? (
        <Badge variant="outline" className="shrink-0 text-xs font-normal">
          <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
          {overview.states_summary.total_with_nexus} nexus
        </Badge>
      ) : null}

      {overview?.is_blocked && (
        <Badge variant="destructive" className="shrink-0 text-xs font-normal">
          Blocked
        </Badge>
      )}

      {/* Details popover for extras */}
      <Popover open={detailsOpen} onOpenChange={setDetailsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0">
            <Info className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stageConfig.color}`}
                    style={{ width: `${stageProgress}%` }}
                  />
                </div>
                <span className="text-xs">{stageProgress}%</span>
              </div>
            </div>
            {overview?.states_summary && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{overview.states_summary.total_with_nexus}</p>
                  <p className="text-xs text-muted-foreground">Nexus</p>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{overview.states_summary.approaching_threshold}</p>
                  <p className="text-xs text-muted-foreground">Approaching</p>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{overview.states_summary.in_progress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{overview.states_summary.complete}</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Next action - compact CTA */}
      {nextAction && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium max-w-[200px] truncate">{nextAction.action}</span>
            {dueDateInfo && (
              <span className={`text-xs ${dueDateInfo.isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                {dueDateInfo.text}
              </span>
            )}
          </div>
          <Button size="sm" className="h-7">
            {nextAction.action_type === 'run_analysis' ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Start
              </>
            ) : (
              'Go'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EngagementHeader
