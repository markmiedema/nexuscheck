// frontend/components/analysis/ColumnMappingConfirmationDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface ColumnMappingConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onAdjust: () => void
  detectedMappings: {
    transaction_date?: string
    customer_state?: string
    revenue_amount?: string
    sales_channel?: string
  }
  samplesByColumn: Record<string, string[]>
  dataSummary?: {
    total_rows: number
    unique_states: number
    date_range: { start: string; end: string }
  }
}

const REQUIRED_FIELDS = {
  transaction_date: 'Transaction Date',
  customer_state: 'Customer State',
  revenue_amount: 'Revenue Amount',
  sales_channel: 'Sales Channel',
}

export default function ColumnMappingConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onAdjust,
  detectedMappings,
  samplesByColumn,
  dataSummary,
}: ColumnMappingConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Column Mappings</DialogTitle>
          <DialogDescription>
            We've automatically detected your column mappings. Please verify they look correct.
          </DialogDescription>
        </DialogHeader>

        {/* Mappings Grid */}
        <div className="space-y-3 py-4">
          {Object.entries(REQUIRED_FIELDS).map(([key, label]) => {
            const detectedColumn = detectedMappings[key as keyof typeof detectedMappings]
            const samples = detectedColumn ? samplesByColumn[detectedColumn] || [] : []

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />

                <div className="flex-1 grid grid-cols-[120px_auto_1fr] gap-3 items-center">
                  <span className="text-sm font-medium">{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-semibold">{detectedColumn}</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {samples.slice(0, 3).map((val, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {val}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Data Summary */}
        {dataSummary && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-semibold">{dataSummary.total_rows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">States</p>
                <p className="font-semibold">{dataSummary.unique_states}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Range</p>
                <p className="font-semibold text-xs">
                  {dataSummary.date_range.start} - {dataSummary.date_range.end}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onAdjust}>
            Adjust Mappings
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Calculate Nexus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
