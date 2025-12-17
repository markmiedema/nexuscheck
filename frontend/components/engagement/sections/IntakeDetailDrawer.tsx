'use client'

import { useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type IntakeItem } from '@/lib/api/clients'
import { cn } from '@/lib/utils'
import {
  FileQuestion,
  Send,
  Download,
  ShieldCheck,
  Minus,
  Loader2,
  Calendar,
  User,
  FileText,
} from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'

// Status configuration
const STATUS_CONFIG = {
  not_requested: { label: 'Not Requested', icon: FileQuestion, color: 'text-muted-foreground', bg: 'bg-muted' },
  requested: { label: 'Requested', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  received: { label: 'Received', icon: Download, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  validated: { label: 'Validated', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  not_applicable: { label: 'N/A', icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
} as const

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  business_model: 'Business Model',
  physical_presence: 'Physical Presence',
  registrations: 'Registrations',
  data_requests: 'Data Requests',
}

interface IntakeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: string | null
  items: IntakeItem[]
  highlightItemId: string | null
  onStatusChange: (itemId: string, status: string) => void
  isUpdating: boolean
}

// Single intake item row
function IntakeItemDetail({
  item,
  isHighlighted,
  onStatusChange,
  isUpdating,
}: {
  item: IntakeItem
  isHighlighted: boolean
  onStatusChange: (status: string) => void
  isUpdating: boolean
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_requested
  const StatusIcon = statusConfig.icon

  // Scroll into view when highlighted
  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  // Format due date
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = parseISO(dateString)
      const isOverdue = isPast(date)
      return {
        text: formatDistanceToNow(date, { addSuffix: true }),
        isOverdue,
      }
    } catch {
      return null
    }
  }

  const dueDateInfo = item.due_date ? formatDueDate(item.due_date) : null

  return (
    <div
      ref={itemRef}
      className={cn(
        'p-4 rounded-lg border transition-colors',
        isHighlighted && 'ring-2 ring-primary bg-primary/5',
        !isHighlighted && 'hover:bg-muted/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{item.label}</h4>
            {item.is_required && (
              <Badge variant="outline" className="text-[10px]">Required</Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>

        {/* Current status badge */}
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shrink-0', statusConfig.bg)}>
          <StatusIcon className={cn('h-3.5 w-3.5', statusConfig.color)} />
          <span className={statusConfig.color}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
        {item.assigned_to && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {item.assigned_to}
          </span>
        )}
        {dueDateInfo && (
          <span className={cn('flex items-center gap-1', dueDateInfo.isOverdue && 'text-red-600')}>
            <Calendar className="h-3 w-3" />
            {dueDateInfo.text}
          </span>
        )}
        {item.requested_at && (
          <span className="flex items-center gap-1">
            <Send className="h-3 w-3" />
            Requested {formatDistanceToNow(parseISO(item.requested_at), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="flex items-start gap-2 text-xs bg-muted/50 rounded p-2 mb-3">
          <FileText className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground">{item.notes}</p>
        </div>
      )}

      {/* Status change actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Change status:</span>
        <Select
          value={item.status}
          onValueChange={onStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}

export function IntakeDetailDrawer({
  open,
  onOpenChange,
  category,
  items,
  highlightItemId,
  onStatusChange,
  isUpdating,
}: IntakeDetailDrawerProps) {
  const categoryLabel = category ? CATEGORY_LABELS[category] || category : 'Items'

  // Sort items: required first, then by status priority
  const sortedItems = [...items].sort((a, b) => {
    // Required items first
    if (a.is_required && !b.is_required) return -1
    if (!a.is_required && b.is_required) return 1

    // Then by status priority
    const statusOrder = ['not_requested', 'requested', 'received', 'validated', 'not_applicable']
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{categoryLabel}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No items in this category</p>
            </div>
          ) : (
            sortedItems.map((item) => (
              <IntakeItemDetail
                key={item.id}
                item={item}
                isHighlighted={item.id === highlightItemId}
                onStatusChange={(status) => onStatusChange(item.id, status)}
                isUpdating={isUpdating}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default IntakeDetailDrawer
