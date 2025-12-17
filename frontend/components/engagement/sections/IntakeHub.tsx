'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useClientIntakeItems,
  useClientIntakeStatus,
  useUpdateClientIntakeItem,
} from '@/hooks/queries'
import { type IntakeItem } from '@/lib/api/clients'
import { IntakeDetailDrawer } from './IntakeDetailDrawer'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  ClipboardCheck,
  Play,
  FileText,
  ChevronRight,
} from 'lucide-react'

// Complete statuses (item is "done")
const COMPLETE_STATUSES = ['received', 'validated', 'not_applicable']

// Category configuration - only data_request is tracked via intake_items
// Discovery profile data (business model, physical presence, registrations)
// is stored directly in the clients table and managed via the Discovery tab
const CATEGORY_CONFIG = {
  data_request: {
    id: 'data_request',
    label: 'Data Requests',
    icon: FileText,
    description: 'Sales data, tax returns, exemption certificates',
  },
} as const

type IntakeFocus = keyof typeof CATEGORY_CONFIG

interface IntakeHubProps {
  clientId: string
  clientName: string
  discoveryInitialData?: any
  onRefreshClient: () => void
}

// Compute derived intake metrics
function useIntakeMetrics(items: IntakeItem[] | undefined) {
  return useMemo(() => {
    if (!items) {
      return {
        total: 0,
        requiredTotal: 0,
        requiredComplete: 0,
        openRequests: 0,
        percentage: 0,
        requiredItems: [],
        requiredIncompleteItems: [],
        requestedOpenItems: [],
        blockers: [],
        byCategory: {} as Record<string, { total: number; complete: number; required: number; requiredComplete: number; items: IntakeItem[] }>,
      }
    }

    const requiredItems = items.filter(i => i.is_required)
    const requiredIncompleteItems = requiredItems.filter(i => !COMPLETE_STATUSES.includes(i.status))
    const requestedOpenItems = items.filter(i => i.status === 'requested')
    const blockers = requiredIncompleteItems.slice(0, 5) // Top 5 blockers

    // Group by category
    const byCategory: Record<string, { total: number; complete: number; required: number; requiredComplete: number; items: IntakeItem[] }> = {}

    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      const catItems = items.filter(i => i.category === cat)
      const catRequired = catItems.filter(i => i.is_required)
      const catComplete = catItems.filter(i => COMPLETE_STATUSES.includes(i.status))
      const catRequiredComplete = catRequired.filter(i => COMPLETE_STATUSES.includes(i.status))

      byCategory[cat] = {
        total: catItems.length,
        complete: catComplete.length,
        required: catRequired.length,
        requiredComplete: catRequiredComplete.length,
        items: catItems,
      }
    })

    const requiredComplete = requiredItems.filter(i => COMPLETE_STATUSES.includes(i.status)).length
    const percentage = requiredItems.length > 0
      ? Math.round((requiredComplete / requiredItems.length) * 100)
      : 100

    return {
      total: items.length,
      requiredTotal: requiredItems.length,
      requiredComplete,
      openRequests: requestedOpenItems.length,
      percentage,
      requiredItems,
      requiredIncompleteItems,
      requestedOpenItems,
      blockers,
      byCategory,
    }
  }, [items])
}

// Determine primary CTA based on intake state
function usePrimaryCTA(metrics: ReturnType<typeof useIntakeMetrics>) {
  return useMemo(() => {
    const { requiredIncompleteItems, percentage } = metrics

    // Priority 1: Required items not yet requested
    const notRequested = requiredIncompleteItems.filter(i => i.status === 'not_requested')
    if (notRequested.length > 0) {
      return {
        label: 'Request missing items',
        description: `${notRequested.length} required item${notRequested.length > 1 ? 's' : ''} not yet requested`,
        icon: Send,
        action: 'request_items' as const,
        targetCategory: notRequested[0]?.category as IntakeFocus | undefined,
      }
    }

    // Priority 2: Items requested but not received/validated
    const pendingItems = requiredIncompleteItems.filter(i => i.status === 'requested')
    if (pendingItems.length > 0) {
      return {
        label: 'Mark received / validate',
        description: `${pendingItems.length} item${pendingItems.length > 1 ? 's' : ''} awaiting data`,
        icon: ClipboardCheck,
        action: 'validate_items' as const,
        targetCategory: pendingItems[0]?.category as IntakeFocus | undefined,
      }
    }

    // Priority 3: All done - ready for analysis
    if (percentage === 100) {
      return {
        label: 'Start nexus analysis',
        description: 'All intake items complete',
        icon: Play,
        action: 'start_analysis' as const,
        targetCategory: undefined,
      }
    }

    // Fallback
    return {
      label: 'Review intake items',
      description: 'Check item status',
      icon: ArrowRight,
      action: 'review' as const,
      targetCategory: undefined,
    }
  }, [metrics])
}

// Progress Card
function ProgressCard({ metrics }: { metrics: ReturnType<typeof useIntakeMetrics> }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Intake Progress</h3>
        <span className="text-2xl font-bold">{metrics.percentage}%</span>
      </div>
      <Progress value={metrics.percentage} className="h-2 mb-3" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Required: </span>
          <span className="font-medium">{metrics.requiredComplete}/{metrics.requiredTotal}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Open requests: </span>
          <span className="font-medium">{metrics.openRequests}</span>
        </div>
      </div>
    </Card>
  )
}

// Primary CTA Card
function PrimaryCTACard({
  cta,
  onAction
}: {
  cta: ReturnType<typeof usePrimaryCTA>
  onAction: (action: string, category?: IntakeFocus) => void
}) {
  const Icon = cta.icon

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary">{cta.label}</p>
          <p className="text-xs text-muted-foreground truncate">{cta.description}</p>
        </div>
        <Button
          size="sm"
          onClick={() => onAction(cta.action, cta.targetCategory)}
        >
          Go
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Card>
  )
}

// Blockers Card
function BlockersCard({
  blockers,
  onBlockerClick
}: {
  blockers: IntakeItem[]
  onBlockerClick: (item: IntakeItem) => void
}) {
  if (blockers.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>No blockers</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
          Blocking ({blockers.length})
        </h3>
      </div>
      <div className="space-y-1">
        {blockers.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => onBlockerClick(item)}
            className="w-full text-left flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <span className="truncate flex-1">{item.label}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {CATEGORY_CONFIG[item.category as IntakeFocus]?.label || item.category}
            </Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>
        ))}
        {blockers.length > 3 && (
          <p className="text-xs text-red-600 px-2">+{blockers.length - 3} more</p>
        )}
      </div>
    </Card>
  )
}

// Category Tile
function CategoryTile({
  category,
  stats,
  onViewItems
}: {
  category: typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]
  stats: { total: number; complete: number; required: number; requiredComplete: number; items: IntakeItem[] }
  onViewItems: () => void
}) {
  const Icon = category.icon
  const missingRequired = stats.items
    .filter(i => i.is_required && !COMPLETE_STATUSES.includes(i.status))
    .slice(0, 2)

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{category.label}</h3>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {/* Micro-metric */}
      <div className="text-xs mb-2">
        <span className="text-muted-foreground">Required: </span>
        <span className={cn(
          'font-medium',
          stats.requiredComplete === stats.required ? 'text-emerald-600' : 'text-foreground'
        )}>
          {stats.requiredComplete}/{stats.required} complete
        </span>
      </div>

      {/* Missing items preview */}
      {missingRequired.length > 0 && (
        <div className="space-y-1 mb-3">
          {missingRequired.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full h-8"
        onClick={onViewItems}
      >
        View items
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </Card>
  )
}

// Loading skeleton
function IntakeHubSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-40" />
    </div>
  )
}

// Main IntakeHub Component
export function IntakeHub({
  clientId,
  clientName,
  discoveryInitialData,
  onRefreshClient,
}: IntakeHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerCategory, setDrawerCategory] = useState<IntakeFocus | null>(null)
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null)

  // Data fetching
  const { data: intakeItems, isLoading: itemsLoading } = useClientIntakeItems(clientId)
  const { data: intakeStatus, isLoading: statusLoading } = useClientIntakeStatus(clientId)
  const updateItem = useUpdateClientIntakeItem(clientId)

  // Computed metrics
  const metrics = useIntakeMetrics(intakeItems)
  const primaryCTA = usePrimaryCTA(metrics)

  // Handle deep-link focus param
  useEffect(() => {
    const focus = searchParams.get('focus') as IntakeFocus | null
    const itemId = searchParams.get('item')

    if (focus && CATEGORY_CONFIG[focus]) {
      setDrawerCategory(focus)
      setDrawerOpen(true)
      if (itemId) {
        setHighlightItemId(itemId)
      }
    }
  }, [searchParams])

  // Open drawer for a category
  const openDrawer = (category: IntakeFocus, itemId?: string) => {
    setDrawerCategory(category)
    setHighlightItemId(itemId || null)
    setDrawerOpen(true)

    // Update URL with focus param
    const url = new URL(window.location.href)
    url.searchParams.set('focus', category)
    if (itemId) {
      url.searchParams.set('item', itemId)
    } else {
      url.searchParams.delete('item')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Close drawer and clear URL params
  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerCategory(null)
    setHighlightItemId(null)

    // Clear focus param from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('focus')
    url.searchParams.delete('item')
    window.history.replaceState({}, '', url.toString())
  }

  // Handle blocker click
  const handleBlockerClick = (item: IntakeItem) => {
    const category = item.category as IntakeFocus
    if (CATEGORY_CONFIG[category]) {
      openDrawer(category, item.id)
    }
  }

  // Handle primary CTA action
  const handleCTAAction = (action: string, category?: IntakeFocus) => {
    if (action === 'start_analysis') {
      // Navigate to analysis creation (you can adjust this route)
      router.push(`/clients/${clientId}?section=execution`)
      return
    }

    if (category && CATEGORY_CONFIG[category]) {
      openDrawer(category)
    } else {
      // Open first category with issues
      const firstIncomplete = Object.entries(metrics.byCategory).find(
        ([_, stats]) => stats.requiredComplete < stats.required
      )
      if (firstIncomplete) {
        openDrawer(firstIncomplete[0] as IntakeFocus)
      }
    }
  }

  // Handle status change from drawer
  const handleStatusChange = (itemId: string, status: string) => {
    updateItem.mutate({ itemId, data: { status } })
  }

  if (itemsLoading || statusLoading) {
    return <IntakeHubSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Top row: 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard metrics={metrics} />
        <PrimaryCTACard cta={primaryCTA} onAction={handleCTAAction} />
        <BlockersCard blockers={metrics.blockers} onBlockerClick={handleBlockerClick} />
      </div>

      {/* Data Requests tile - single category now */}
      <CategoryTile
        category={CATEGORY_CONFIG.data_request}
        stats={metrics.byCategory.data_request || { total: 0, complete: 0, required: 0, requiredComplete: 0, items: [] }}
        onViewItems={() => openDrawer('data_request')}
      />

      {/* Intake Detail Drawer */}
      <IntakeDetailDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        category={drawerCategory}
        items={drawerCategory ? (metrics.byCategory[drawerCategory]?.items || []) : []}
        highlightItemId={highlightItemId}
        onStatusChange={handleStatusChange}
        isUpdating={updateItem.isPending}
      />
    </div>
  )
}

export default IntakeHub
