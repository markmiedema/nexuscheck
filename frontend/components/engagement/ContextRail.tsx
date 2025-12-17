'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useClientOverview, type BlockingItem, type Deadline } from '@/hooks/queries'
import {
  AlertTriangle,
  Calendar,
  Clock,
  MessageSquare,
  ExternalLink,
  FileBarChart,
  Map,
  CalendarDays,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, isPast, parseISO, differenceInDays } from 'date-fns'

interface ContextRailProps {
  clientId: string
  engagementId?: string
  activeSection: 'overview' | 'intake' | 'execution' | 'history'
}

// Format due date with urgency info
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

// Blockers Card
function BlockersCard({ blockers }: { blockers: BlockingItem[] }) {
  if (!blockers?.length) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>No blockers</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-semibold text-red-800 dark:text-red-200">
            Blockers ({blockers.length})
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {blockers.slice(0, 3).map((blocker, i) => (
          <div key={i} className="text-xs">
            <p className="font-medium text-foreground truncate">{blocker.item}</p>
            <p className="text-muted-foreground">
              {blocker.category}
              {blocker.blocking_states?.length > 0 && ` • ${blocker.blocking_states.length} states`}
            </p>
          </div>
        ))}
        {blockers.length > 3 && (
          <Button variant="ghost" size="sm" className="h-6 text-xs w-full">
            +{blockers.length - 3} more
          </Button>
        )}
      </div>
    </Card>
  )
}

// Due Soon Card
function DueSoonCard({ deadlines }: { deadlines: Deadline[] }) {
  // Filter to overdue + next 7 days
  const urgentDeadlines = deadlines?.filter(d => {
    const info = formatDueDate(d.due_date)
    return info && (info.isOverdue || info.daysUntil <= 7)
  }) || []

  if (!urgentDeadlines.length) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>No upcoming deadlines</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold">Due Soon</span>
        </div>
      </div>
      <div className="space-y-2">
        {urgentDeadlines.slice(0, 4).map((deadline, i) => {
          const dueDateInfo = formatDueDate(deadline.due_date)
          return (
            <div key={i} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex-1 min-w-0">
                {deadline.state && (
                  <Badge variant="outline" className="text-[10px] mr-1 px-1 py-0">
                    {deadline.state}
                  </Badge>
                )}
                <span className="truncate">{deadline.title}</span>
              </div>
              <span className={`shrink-0 ${dueDateInfo?.isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                {dueDateInfo?.text}
              </span>
            </div>
          )
        })}
        {urgentDeadlines.length > 4 && (
          <p className="text-xs text-muted-foreground">+{urgentDeadlines.length - 4} more</p>
        )}
      </div>
    </Card>
  )
}

// Last Activity Card (placeholder - would need activity log endpoint)
function LastActivityCard({ clientId }: { clientId: string }) {
  // TODO: Hook into actual activity log when available
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Recent Activity</span>
        </div>
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="italic">Activity log coming soon</p>
      </div>
    </Card>
  )
}

// Notes Card (placeholder - would need notes endpoint)
function NotesCard({ clientId }: { clientId: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Notes</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="italic">No notes yet</p>
      </div>
    </Card>
  )
}

// Quick Links Card
function QuickLinksCard({ clientId }: { clientId: string }) {
  const links = [
    { label: 'Analysis Results', icon: FileBarChart, href: '#' },
    { label: 'Nexus Map', icon: Map, href: '#' },
    { label: 'Compliance Calendar', icon: CalendarDays, href: '#' },
  ]

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Quick Links</span>
      </div>
      <div className="space-y-1">
        {links.map((link, i) => {
          const Icon = link.icon
          return (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-xs"
              asChild
            >
              <a href={link.href}>
                <Icon className="h-3.5 w-3.5 mr-2" />
                {link.label}
                <ChevronRight className="h-3 w-3 ml-auto" />
              </a>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}

// Loading state
function ContextRailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

export function ContextRail({ clientId, engagementId, activeSection }: ContextRailProps) {
  const { data: overview, isLoading } = useClientOverview(clientId)

  if (isLoading) {
    return <ContextRailSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Blockers - always show if any */}
      <BlockersCard blockers={overview?.blocking_items || []} />

      {/* Due Soon */}
      <DueSoonCard deadlines={overview?.upcoming_deadlines || []} />

      {/* Recent Activity */}
      <LastActivityCard clientId={clientId} />

      {/* Notes */}
      <NotesCard clientId={clientId} />

      {/* Quick Links */}
      <QuickLinksCard clientId={clientId} />
    </div>
  )
}

export default ContextRail
