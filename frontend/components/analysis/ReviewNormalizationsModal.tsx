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
import { Loader2 } from 'lucide-react'
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
  dateRange
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

        <DialogFooter>
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
