'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import ChannelMappingReview from './ChannelMappingReview'
import StateNormalizationReview from './StateNormalizationReview'
import ProblemRowsPreview from './ProblemRowsPreview'

interface ChannelMapping {
  original: string
  normalized: string
}

interface StateMapping {
  original: string
  normalized: string
}

interface ProblemRow {
  row: number
  field: string
  value: string
  message: string
}

interface ColumnMappingInfo {
  sourceColumn: string
  targetField: string
  isOptional: boolean
}

interface ReviewNormalizationsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (channelMappings: Record<string, string>) => void
  isLoading: boolean
  channelPreview: {
    recognized: ChannelMapping[]
    unrecognized: string[]
  }
  statePreview: {
    normalized: StateMapping[]
    unchanged: StateMapping[]
    unrecognized: string[]
  }
  validCount: number
  problems: ProblemRow[]
  dateRange: {
    start: string
    end: string
  }
  columnMappings?: ColumnMappingInfo[]
  onAdjust?: () => void
}

// Format ISO date to US format
const formatDateUS = (isoDate: string): string => {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

export default function ReviewNormalizationsModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  channelPreview,
  statePreview,
  validCount,
  problems,
  dateRange,
  columnMappings = [],
  onAdjust
}: ReviewNormalizationsModalProps) {
  const [userChannelMappings, setUserChannelMappings] = useState<Record<string, string>>({})

  const hasUnmappedChannels = channelPreview.unrecognized.length > 0 &&
    Object.keys(userChannelMappings).length < channelPreview.unrecognized.length

  const canProceed = !hasUnmappedChannels && validCount > 0

  const handleConfirm = () => {
    onConfirm(userChannelMappings)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Data Before Import</DialogTitle>
          <DialogDescription>
            Please review how your data will be processed before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range */}
          {dateRange.start && dateRange.end && (
            <div className="text-sm">
              <span className="font-medium">Date Range: </span>
              {formatDateUS(dateRange.start)} to {formatDateUS(dateRange.end)}
            </div>
          )}

          {/* Column Mappings */}
          {columnMappings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Column Mappings</h4>
              <div className="bg-muted/50 rounded-md p-3 space-y-2">
                {columnMappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="font-medium">{mapping.sourceColumn}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{mapping.targetField}</span>
                    {mapping.isOptional && (
                      <Badge variant="secondary" className="text-xs ml-auto">Optional</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel Mapping Review */}
          {(channelPreview.recognized.length > 0 || channelPreview.unrecognized.length > 0) && (
            <ChannelMappingReview
              recognized={channelPreview.recognized}
              unrecognized={channelPreview.unrecognized}
              onUnrecognizedMapped={setUserChannelMappings}
            />
          )}

          {/* State Normalization Review */}
          {(statePreview.normalized.length > 0 || statePreview.unrecognized.length > 0) && (
            <StateNormalizationReview
              normalized={statePreview.normalized}
              unchanged={statePreview.unchanged}
              unrecognized={statePreview.unrecognized}
            />
          )}

          {/* Problem Rows */}
          <ProblemRowsPreview
            validCount={validCount}
            problems={problems}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onAdjust && (
            <Button variant="outline" onClick={onAdjust} disabled={isLoading} className="mr-auto">
              Adjust Mappings
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canProceed || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${validCount.toLocaleString()} Rows`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
