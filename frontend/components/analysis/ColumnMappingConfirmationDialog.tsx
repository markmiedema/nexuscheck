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
import { Separator } from '@/components/ui/separator'
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
          <DialogTitle>Confirm Analysis Setup</DialogTitle>
        </DialogHeader>

        {/* Data Summary - Top Section */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              Analysis Ready to Calculate
            </h3>
          </div>

          {dataSummary && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-semibold text-lg text-foreground">{dataSummary.total_rows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">States</p>
                <p className="font-semibold text-lg text-foreground">{dataSummary.unique_states}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-semibold text-sm leading-tight text-foreground">
                  {dataSummary.date_range.start}
                  <br />
                  {dataSummary.date_range.end}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <DialogDescription>
          We've automatically detected your column mappings. Please verify they look correct.
        </DialogDescription>

        {/* Mappings Grid */}
        <div className="space-y-3 py-4">
          {Object.entries(REQUIRED_FIELDS).map(([key, label]) => {
            const detectedColumn = detectedMappings[key as keyof typeof detectedMappings]
            const samples = detectedColumn ? samplesByColumn[detectedColumn] || [] : []

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 grid grid-cols-[120px_auto_1fr] gap-3 items-center">
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">{detectedColumn}</span>
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
