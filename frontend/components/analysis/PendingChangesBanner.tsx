'use client'

import { memo } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PendingChangesSummary {
  added: number
  updated: number
  removed: number
  total: number
  totalAmount: number
}

interface PendingChangesBannerProps {
  summary: PendingChangesSummary
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

export const PendingChangesBanner = memo(function PendingChangesBanner({
  summary,
  isSaving,
  onSave,
  onDiscard,
}: PendingChangesBannerProps) {
  if (summary.total === 0) {
    return null
  }

  const parts: string[] = []
  if (summary.added > 0) parts.push(`${summary.added} added`)
  if (summary.updated > 0) parts.push(`${summary.updated} updated`)
  if (summary.removed > 0) parts.push(`${summary.removed} removed`)

  return (
    <div className="mx-4 mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="bg-warning/20">
          {summary.total} pending change{summary.total !== 1 ? 's' : ''}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {parts.join(', ')}
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save & Recalculate'}
        </Button>
      </div>
    </div>
  )
})
