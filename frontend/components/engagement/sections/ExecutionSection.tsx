'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { StateDetailDrawer } from '@/components/clients/StateDetailDrawer'
import { useStateWorklist } from '@/hooks/queries'
import { type StateWorklistItem, ACTION_TYPE_LABELS } from '@/lib/api/stateWorklist'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatting'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  X,
  Calendar,
  AlertTriangle,
  Play,
  Circle,
} from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast, differenceInDays } from 'date-fns'

interface ExecutionSectionProps {
  clientId: string
}

// Bucket types for grouping
type ExecutionBucket = 'blocked' | 'due_soon' | 'in_progress' | 'not_started' | 'complete'

// Bucket configuration
const BUCKET_CONFIG: Record<ExecutionBucket, { label: string; icon: typeof Clock; color: string; emptyMessage: string }> = {
  blocked: { label: 'Blocked', icon: Ban, color: 'text-red-600', emptyMessage: 'No blocked items 🎉' },
  due_soon: { label: 'Due Soon', icon: Calendar, color: 'text-orange-600', emptyMessage: 'Nothing due soon' },
  in_progress: { label: 'In Progress', icon: Play, color: 'text-blue-600', emptyMessage: 'Nothing in progress' },
  not_started: { label: 'Not Started', icon: Circle, color: 'text-gray-500', emptyMessage: 'All items started' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-emerald-600', emptyMessage: 'No completed items yet' },
}

// Status display config
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  complete: { label: 'Complete', color: 'bg-emerald-100 text-emerald-700' },
}

// Nexus status config
const NEXUS_CONFIG: Record<string, { label: string; color: string }> = {
  has_nexus: { label: 'Nexus', color: 'bg-red-100 text-red-700 border-red-200' },
  approaching: { label: 'Approaching', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  no_nexus: { label: 'No Nexus', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  needs_data: { label: 'Needs Data', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

// Format target date with urgency
function formatTargetDate(dateString?: string): { text: string; isOverdue: boolean; daysUntil: number } | null {
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

// Determine bucket for an item
function getBucket(item: StateWorklistItem): ExecutionBucket {
  // Blocked takes priority
  if (item.action_status === 'blocked') return 'blocked'

  // Complete
  if (item.action_status === 'complete') return 'complete'

  // Due soon (next 7 days or overdue)
  if (item.target_date) {
    const dueDateInfo = formatTargetDate(item.target_date)
    if (dueDateInfo && (dueDateInfo.isOverdue || dueDateInfo.daysUntil <= 7)) {
      return 'due_soon'
    }
  }

  // In progress
  if (item.action_status === 'in_progress') return 'in_progress'

  // Default to not started
  return 'not_started'
}

// Parse URL filters
function parseFilters(searchParams: URLSearchParams): {
  bucket: ExecutionBucket | 'all'
  states: string[]
  types: string[]
  search: string
} {
  const bucket = (searchParams.get('bucket') as ExecutionBucket | 'all') || 'all'
  const states = searchParams.get('state')?.split(',').filter(Boolean) || []
  const types = searchParams.get('type')?.split(',').filter(Boolean) || []
  const search = searchParams.get('q') || ''

  return { bucket, states, types, search }
}

// Serialize filters to URL
function serializeFilters(filters: {
  bucket: ExecutionBucket | 'all'
  states: string[]
  types: string[]
  search: string
}): URLSearchParams {
  const params = new URLSearchParams()
  params.set('section', 'execution')
  if (filters.bucket !== 'all') params.set('bucket', filters.bucket)
  if (filters.states.length > 0) params.set('state', filters.states.join(','))
  if (filters.types.length > 0) params.set('type', filters.types.join(','))
  if (filters.search) params.set('q', filters.search)
  return params
}

// Dense row component
function WorklistRow({
  item,
  onClick,
}: {
  item: StateWorklistItem
  onClick: () => void
}) {
  const statusConfig = STATUS_CONFIG[item.action_status || 'not_started'] || STATUS_CONFIG.not_started
  const nexusConfig = NEXUS_CONFIG[item.nexus_status] || NEXUS_CONFIG.unknown
  const actionLabel = item.action_type ? ACTION_TYPE_LABELS[item.action_type]?.label : 'TBD'
  const dueDateInfo = item.target_date ? formatTargetDate(item.target_date) : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-b-0',
        item.action_status === 'blocked' && 'bg-red-50/50 dark:bg-red-900/10'
      )}
    >
      {/* State badge */}
      <Badge variant="outline" className="font-mono font-semibold shrink-0 w-10 justify-center">
        {item.state}
      </Badge>

      {/* Action type + Nexus */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <Badge variant="outline" className={cn('text-xs', nexusConfig.color)}>
          {nexusConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{actionLabel}</span>
      </div>

      {/* Status */}
      <Badge className={cn('text-xs shrink-0', statusConfig.color)}>
        {statusConfig.label}
      </Badge>

      {/* Due date */}
      <div className={cn(
        'text-xs min-w-[80px]',
        dueDateInfo?.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
      )}>
        {dueDateInfo?.text || '—'}
      </div>

      {/* Blocked reason or summary */}
      <div className="flex-1 min-w-0">
        {item.blocked_reason && (
          <span className="text-xs text-red-600 truncate block">{item.blocked_reason}</span>
        )}
      </div>

      {/* Tasks progress */}
      <div className="text-xs text-muted-foreground shrink-0">
        {item.tasks_complete}/{item.tasks_total}
      </div>

      {/* Liability */}
      <div className="text-xs text-muted-foreground w-20 text-right shrink-0">
        {item.estimated_liability ? formatCurrency(item.estimated_liability) : '—'}
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}

// Collapsible bucket group
function BucketGroup({
  bucket,
  items,
  defaultOpen = true,
  onItemClick,
}: {
  bucket: ExecutionBucket
  items: StateWorklistItem[]
  defaultOpen?: boolean
  onItemClick: (state: string) => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const config = BUCKET_CONFIG[bucket]
  const Icon = config.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors">
            <Icon className={cn('h-4 w-4', config.color)} />
            <span className="font-semibold text-sm">{config.label}</span>
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
            <div className="flex-1" />
            <ChevronDown className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {config.emptyMessage}
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <WorklistRow
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item.state)}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Filters popover
function FiltersPopover({
  filters,
  onFilterChange,
  availableStates,
  availableTypes,
}: {
  filters: { bucket: ExecutionBucket | 'all'; states: string[]; types: string[] }
  onFilterChange: (filters: Partial<{ bucket: ExecutionBucket | 'all'; states: string[]; types: string[] }>) => void
  availableStates: string[]
  availableTypes: string[]
}) {
  const hasFilters = filters.bucket !== 'all' || filters.states.length > 0 || filters.types.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {hasFilters && (
            <Badge variant="secondary" className="ml-1.5 text-xs h-5 px-1.5">
              {(filters.bucket !== 'all' ? 1 : 0) + filters.states.length + filters.types.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bucket</label>
            <Select
              value={filters.bucket}
              onValueChange={(v) => onFilterChange({ bucket: v as ExecutionBucket | 'all' })}
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(BUCKET_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Action Type</label>
            <Select
              value={filters.types[0] || 'all'}
              onValueChange={(v) => onFilterChange({ types: v === 'all' ? [] : [v] })}
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ACTION_TYPE_LABELS[type as keyof typeof ACTION_TYPE_LABELS]?.label || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">State</label>
            <Select
              value={filters.states[0] || 'all'}
              onValueChange={(v) => onFilterChange({ states: v === 'all' ? [] : [v] })}
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onFilterChange({ bucket: 'all', states: [], types: [] })}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Summary counts bar
function SummaryCounts({
  counts,
  onBucketClick,
}: {
  counts: Record<ExecutionBucket, number>
  onBucketClick: (bucket: ExecutionBucket) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(BUCKET_CONFIG).map(([key, config]) => {
        const count = counts[key as ExecutionBucket]
        const Icon = config.icon
        return (
          <button
            key={key}
            onClick={() => onBucketClick(key as ExecutionBucket)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted transition-colors',
              config.color
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium">{config.label}</span>
            <span className="text-muted-foreground">({count})</span>
          </button>
        )
      })}
    </div>
  )
}

// Main component
export function ExecutionSection({ clientId }: ExecutionSectionProps) {
  const searchParams = useSearchParams()

  // Parse filters from URL
  const urlFilters = useMemo(() => parseFilters(searchParams), [searchParams])

  // Local state
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(urlFilters.search)
  const [filters, setFilters] = useState(urlFilters)

  // Sync local filters with URL on mount
  useEffect(() => {
    setFilters(urlFilters)
    setSearchQuery(urlFilters.search)
  }, [urlFilters])

  // Data fetching
  const { data: worklistData, isLoading, error } = useStateWorklist(clientId)

  // Update URL when filters change
  const updateURL = useCallback((newFilters: typeof filters, search: string) => {
    const params = serializeFilters({ ...newFilters, search })
    const url = new URL(window.location.href)
    url.search = params.toString()
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<typeof filters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    updateURL(newFilters, searchQuery)
  }, [filters, searchQuery, updateURL])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    updateURL(filters, query)
  }, [filters, updateURL])

  // Handle bucket click from summary
  const handleBucketClick = useCallback((bucket: ExecutionBucket) => {
    handleFilterChange({ bucket })
  }, [handleFilterChange])

  // Process items into buckets
  const { bucketedItems, filteredItems, counts, availableStates, availableTypes } = useMemo(() => {
    if (!worklistData?.items) {
      return {
        bucketedItems: {} as Record<ExecutionBucket, StateWorklistItem[]>,
        filteredItems: [],
        counts: { blocked: 0, due_soon: 0, in_progress: 0, not_started: 0, complete: 0 },
        availableStates: [],
        availableTypes: [],
      }
    }

    const items = worklistData.items

    // Collect available filter options
    const availableStates = [...new Set(items.map(i => i.state))].sort()
    const availableTypes = [...new Set(items.map(i => i.action_type).filter(Boolean))] as string[]

    // Apply search filter
    let filtered = items
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.state.toLowerCase().includes(q) ||
        item.action_type?.toLowerCase().includes(q) ||
        item.blocked_reason?.toLowerCase().includes(q)
      )
    }

    // Apply state filter
    if (filters.states.length > 0) {
      filtered = filtered.filter(item => filters.states.includes(item.state))
    }

    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(item => item.action_type && filters.types.includes(item.action_type))
    }

    // Group into buckets
    const buckets: Record<ExecutionBucket, StateWorklistItem[]> = {
      blocked: [],
      due_soon: [],
      in_progress: [],
      not_started: [],
      complete: [],
    }

    filtered.forEach(item => {
      const bucket = getBucket(item)
      buckets[bucket].push(item)
    })

    // Apply bucket filter
    let finalFiltered = filtered
    if (filters.bucket !== 'all') {
      finalFiltered = buckets[filters.bucket]
    }

    // Counts for all items (not just filtered)
    const allBuckets: Record<ExecutionBucket, StateWorklistItem[]> = {
      blocked: [],
      due_soon: [],
      in_progress: [],
      not_started: [],
      complete: [],
    }
    items.forEach(item => {
      allBuckets[getBucket(item)].push(item)
    })
    const counts = {
      blocked: allBuckets.blocked.length,
      due_soon: allBuckets.due_soon.length,
      in_progress: allBuckets.in_progress.length,
      not_started: allBuckets.not_started.length,
      complete: allBuckets.complete.length,
    }

    return {
      bucketedItems: buckets,
      filteredItems: finalFiltered,
      counts,
      availableStates,
      availableTypes,
    }
  }, [worklistData?.items, searchQuery, filters])

  // Handle drawer state from URL
  useEffect(() => {
    const drawerState = searchParams.get('drawerState')
    if (drawerState) {
      setSelectedState(drawerState)
    }
  }, [searchParams])

  // Open drawer and update URL
  const openDrawer = (state: string) => {
    setSelectedState(state)
    const url = new URL(window.location.href)
    url.searchParams.set('drawerState', state)
    window.history.replaceState({}, '', url.toString())
  }

  // Close drawer and update URL
  const closeDrawer = () => {
    setSelectedState(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('drawerState')
    window.history.replaceState({}, '', url.toString())
  }

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

  const showGroupedView = filters.bucket === 'all' && !searchQuery && filters.states.length === 0 && filters.types.length === 0

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <SummaryCounts counts={counts} onBucketClick={handleBucketClick} />

      {/* Filters bar */}
      <div className="flex items-center gap-3">
        <FiltersPopover
          filters={filters}
          onFilterChange={handleFilterChange}
          availableStates={availableStates}
          availableTypes={availableTypes}
        />

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search states, types..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        <span className="text-sm text-muted-foreground">
          {filteredItems.length} of {worklistData?.items?.length || 0} shown
        </span>
      </div>

      {/* Content */}
      {showGroupedView ? (
        // Grouped view (default)
        <div className="space-y-4">
          <BucketGroup
            bucket="blocked"
            items={bucketedItems.blocked}
            defaultOpen={true}
            onItemClick={openDrawer}
          />
          <BucketGroup
            bucket="due_soon"
            items={bucketedItems.due_soon}
            defaultOpen={true}
            onItemClick={openDrawer}
          />
          <BucketGroup
            bucket="in_progress"
            items={bucketedItems.in_progress}
            defaultOpen={true}
            onItemClick={openDrawer}
          />
          <BucketGroup
            bucket="not_started"
            items={bucketedItems.not_started}
            defaultOpen={bucketedItems.not_started.length < 20}
            onItemClick={openDrawer}
          />
          <BucketGroup
            bucket="complete"
            items={bucketedItems.complete}
            defaultOpen={false}
            onItemClick={openDrawer}
          />
        </div>
      ) : (
        // Filtered/flat view
        <Card className="overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No items match your filters</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => handleFilterChange({ bucket: 'all', states: [], types: [] })}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredItems.map((item) => (
                <WorklistRow
                  key={item.id}
                  item={item}
                  onClick={() => openDrawer(item.state)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* State detail drawer */}
      <StateDetailDrawer
        clientId={clientId}
        state={selectedState}
        open={!!selectedState}
        onClose={closeDrawer}
      />
    </div>
  )
}

export default ExecutionSection
