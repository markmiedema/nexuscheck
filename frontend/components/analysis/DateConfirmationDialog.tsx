'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DateConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  detectedStart: string | null
  detectedEnd: string | null
  wasAutoPopulated: boolean
}

export default function DateConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  detectedStart,
  detectedEnd,
  wasAutoPopulated,
}: DateConfirmationDialogProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not detected'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {wasAutoPopulated ? 'Date Range Auto-Detected' : 'Date Range Detected'}
          </DialogTitle>
          <DialogDescription>
            {wasAutoPopulated
              ? 'We automatically detected and set the analysis period from your transaction data.'
              : 'We detected the following date range from your transaction data.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted border border-border p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Period Start:</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(detectedStart)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Period End:</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(detectedEnd)}
                </span>
              </div>
            </div>
          </div>

          {wasAutoPopulated && (
            <div className="rounded-lg bg-success/10 border border-success/20 p-3">
              <p className="text-sm text-success-foreground">
                ✓ Analysis period has been automatically set
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            This date range was extracted from the transaction_date column in your uploaded CSV file.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
