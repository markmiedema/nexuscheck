'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useClientIntakeItems,
  useClientIntakeStatus,
  useUpdateClientIntakeItem,
  useClient,
} from '@/hooks/queries'
import { type IntakeItem } from '@/lib/api/clients'
import { DiscoveryProfile } from '@/components/clients/DiscoveryProfile'
import { IntakeStepper } from '@/components/clients/IntakeStepper'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Clock,
  FileQuestion,
  Send,
  Download,
  ShieldCheck,
  Minus,
  AlertTriangle,
  ChevronRight,
  Edit3,
  ListChecks,
  Building2,
  Globe,
  Package,
  Users,
  FileText,
  MoreHorizontal,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

// Status configuration
const STATUS_CONFIG = {
  not_requested: { label: 'Not Requested', icon: FileQuestion, color: 'text-muted-foreground', bg: 'bg-muted' },
  requested: { label: 'Requested', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  received: { label: 'Received', icon: Download, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  validated: { label: 'Validated', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  na: { label: 'N/A', icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
} as const

type IntakeStatusFilter = keyof typeof STATUS_CONFIG | 'all' | 'blocking'

// Category icons
const CATEGORY_ICONS: Record<string, typeof Building2> = {
  business_info: Building2,
  financials: FileText,
  sales_data: Globe,
  inventory: Package,
  employees: Users,
}

interface IntakeHubProps {
  clientId: string
  clientName: string
  discoveryInitialData?: any
  onRefreshClient: () => void
}

// Completeness Meter Component
function CompletenessMeter({
  total,
  completed,
  percentage,
  blocking
}: {
  total: number
  completed: number
  percentage: number
  blocking: number
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Intake Progress</h3>
        </div>
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2 mb-3" />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{completed} of {total} items complete</span>
        {blocking > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {blocking} blocking
          </span>
        )}
      </div>
    </Card>
  )
}

// Business Profile Snapshot Component
function ProfileSnapshot({
  client,
  onEdit
}: {
  client: any
  onEdit: () => void
}) {
  const hasProfile = client?.discovery_completed_at

  if (!hasProfile) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Business Profile</p>
              <p className="text-sm text-muted-foreground">Not yet completed</p>
            </div>
          </div>
          <Button onClick={onEdit} size="sm">
            <Edit3 className="h-4 w-4 mr-1.5" />
            Start Profile
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Business Profile</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Channels</p>
          <p className="font-medium">{client?.channels?.length || 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Product Types</p>
          <p className="font-medium">{client?.product_types?.length || 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Remote States</p>
          <p className="font-medium">{client?.remote_employee_states?.length || 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Registered</p>
          <p className="font-medium">{client?.registered_states?.length || 0} states</p>
        </div>
      </div>
    </Card>
  )
}

// Status Filter Tabs
function StatusFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: IntakeStatusFilter
  onFilterChange: (filter: IntakeStatusFilter) => void
  counts: Record<string, number>
}) {
  const filters: { id: IntakeStatusFilter; label: string }[] = [
    { id: 'all', label: `All (${counts.all || 0})` },
    { id: 'blocking', label: `Blocking (${counts.blocking || 0})` },
    { id: 'not_requested', label: `Not Requested (${counts.not_requested || 0})` },
    { id: 'requested', label: `Requested (${counts.requested || 0})` },
    { id: 'received', label: `Received (${counts.received || 0})` },
    { id: 'validated', label: `Validated (${counts.validated || 0})` },
  ]

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'shrink-0 text-xs h-8',
            filter.id === 'blocking' && counts.blocking > 0 && activeFilter !== 'blocking' && 'text-red-600'
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}

// Intake Item Row
function IntakeItemRow({
  item,
  onStatusChange,
}: {
  item: IntakeItem
  onStatusChange: (itemId: string, status: string) => void
}) {
  const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_requested
  const StatusIcon = statusConfig.icon
  const CategoryIcon = CATEGORY_ICONS[item.category] || FileText

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Category icon */}
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{item.label}</p>
          {item.is_required && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">Required</Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>

      {/* Status */}
      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shrink-0', statusConfig.bg)}>
        <StatusIcon className={cn('h-3.5 w-3.5', statusConfig.color)} />
        <span className={statusConfig.color}>{statusConfig.label}</span>
      </div>

      {/* Quick status change */}
      <Select
        value={item.status}
        onValueChange={(value) => onStatusChange(item.id, value)}
      >
        <SelectTrigger className="w-8 h-8 p-0 border-0 bg-transparent hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                  {config.label}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

// Items grouped by category
function IntakeItemsList({
  items,
  onStatusChange,
}: {
  items: IntakeItem[]
  onStatusChange: (itemId: string, status: string) => void
}) {
  // Group by category
  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const cat = item.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {} as Record<string, IntakeItem[]>)
  }, [items])

  const categoryLabels: Record<string, string> = {
    business_info: 'Business Information',
    financials: 'Financial Data',
    sales_data: 'Sales & Transactions',
    inventory: 'Inventory & 3PL',
    employees: 'Employee Data',
    other: 'Other',
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No items match the current filter</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category} className="overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold">{categoryLabels[category] || category}</h4>
          </div>
          <div className="divide-y">
            {categoryItems.map((item) => (
              <IntakeItemRow
                key={item.id}
                item={item}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

// Loading skeleton
function IntakeHubSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
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
  const [activeFilter, setActiveFilter] = useState<IntakeStatusFilter>('all')
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [wizardDrawerOpen, setWizardDrawerOpen] = useState(false)

  const { data: intakeItems, isLoading: itemsLoading } = useClientIntakeItems(clientId)
  const { data: intakeStatus, isLoading: statusLoading } = useClientIntakeStatus(clientId)
  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const updateItem = useUpdateClientIntakeItem(clientId)

  // Filter items
  const filteredItems = useMemo(() => {
    if (!intakeItems) return []

    switch (activeFilter) {
      case 'all':
        return intakeItems
      case 'blocking':
        return intakeItems.filter(item =>
          item.is_required &&
          (item.status === 'not_requested' || item.status === 'requested')
        )
      default:
        return intakeItems.filter(item => item.status === activeFilter)
    }
  }, [intakeItems, activeFilter])

  // Count items by status
  const statusCounts = useMemo(() => {
    if (!intakeItems) return {}

    const counts: Record<string, number> = {
      all: intakeItems.length,
      blocking: intakeItems.filter(item =>
        item.is_required &&
        (item.status === 'not_requested' || item.status === 'requested')
      ).length,
    }

    Object.keys(STATUS_CONFIG).forEach(status => {
      counts[status] = intakeItems.filter(item => item.status === status).length
    })

    return counts
  }, [intakeItems])

  // Handle status change
  const handleStatusChange = (itemId: string, status: string) => {
    updateItem.mutate({ itemId, data: { status } })
  }

  if (itemsLoading || statusLoading || clientLoading) {
    return <IntakeHubSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Top row: Completeness + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletenessMeter
          total={intakeStatus?.total_items || 0}
          completed={intakeStatus?.completed_items || 0}
          percentage={intakeStatus?.completion_percentage || 0}
          blocking={intakeStatus?.blocking_items?.length || 0}
        />
        <ProfileSnapshot
          client={client}
          onEdit={() => setProfileDrawerOpen(true)}
        />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4">
        <StatusFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={statusCounts}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWizardDrawerOpen(true)}
        >
          <ListChecks className="h-4 w-4 mr-1.5" />
          Open Wizard
        </Button>
      </div>

      {/* Intake items list */}
      <IntakeItemsList
        items={filteredItems}
        onStatusChange={handleStatusChange}
      />

      {/* Profile Edit Drawer */}
      <Sheet open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Business Profile</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <DiscoveryProfile
              clientId={clientId}
              initialData={discoveryInitialData}
              onUpdate={() => {
                onRefreshClient()
              }}
              onComplete={() => {
                onRefreshClient()
                setProfileDrawerOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Wizard Drawer */}
      <Sheet open={wizardDrawerOpen} onOpenChange={setWizardDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Data Collection Wizard</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <IntakeStepper
              clientId={clientId}
              onComplete={() => {
                onRefreshClient()
                setWizardDrawerOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default IntakeHub
