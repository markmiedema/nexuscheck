'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

export type ExemptionReason =
  | 'resale_certificate'
  | 'government_nonprofit'
  | 'product_exempt'
  | 'manufacturing_exemption'
  | 'agricultural_exemption'
  | 'other'

export interface ExemptionData {
  transactionId: string
  salesAmount: number
  currentExemptAmount: number
  exemptAmount: number
  reason: ExemptionReason | null
  reasonOther: string
  note: string
}

interface ExemptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    transaction_id: string
    sales_amount: number
    exempt_amount: number
    exemption_reason?: string
    exemption_reason_other?: string
    exemption_note?: string
  } | null
  onSave: (data: ExemptionData) => void
  mode: 'create' | 'edit'
}

const REASON_OPTIONS: { value: ExemptionReason; label: string }[] = [
  { value: 'resale_certificate', label: 'Resale Certificate on File' },
  { value: 'government_nonprofit', label: 'Government/Nonprofit Purchaser' },
  { value: 'product_exempt', label: 'Product Exempt in This State' },
  { value: 'manufacturing_exemption', label: 'Manufacturing Exemption' },
  { value: 'agricultural_exemption', label: 'Agricultural Exemption' },
  { value: 'other', label: 'Other (specify below)' },
]

export function ExemptionModal({
  open,
  onOpenChange,
  transaction,
  onSave,
  mode,
}: ExemptionModalProps) {
  const [exemptAmount, setExemptAmount] = useState<string>('')
  const [reason, setReason] = useState<ExemptionReason | ''>('')
  const [reasonOther, setReasonOther] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      if (mode === 'edit' && transaction.exempt_amount > 0) {
        setExemptAmount(transaction.exempt_amount.toFixed(2))
        setReason((transaction.exemption_reason as ExemptionReason) || '')
        setReasonOther(transaction.exemption_reason_other || '')
        setNote(transaction.exemption_note || '')
      } else {
        // Default to full amount for new exemption
        setExemptAmount(transaction.sales_amount.toFixed(2))
        setReason('')
        setReasonOther('')
        setNote('')
      }
      setError(null)
    }
  }, [transaction, mode])

  const handleSetFullAmount = () => {
    if (transaction) {
      setExemptAmount(transaction.sales_amount.toFixed(2))
    }
  }

  const handleSave = () => {
    if (!transaction) return

    const amount = parseFloat(exemptAmount)

    // Validation
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid exempt amount greater than 0')
      return
    }

    if (amount > transaction.sales_amount) {
      setError(`Exempt amount cannot exceed sales amount ($${transaction.sales_amount.toFixed(2)})`)
      return
    }

    if (!reason) {
      setError('Please select an exemption reason')
      return
    }

    if (reason === 'other' && !reasonOther.trim()) {
      setError('Please specify the exemption reason')
      return
    }

    onSave({
      transactionId: transaction.transaction_id,
      salesAmount: transaction.sales_amount,
      currentExemptAmount: transaction.exempt_amount,
      exemptAmount: amount,
      reason: reason as ExemptionReason,
      reasonOther: reason === 'other' ? reasonOther.trim() : '',
      note: note.trim(),
    })

    onOpenChange(false)
  }

  if (!transaction) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Exemption' : 'Mark Transaction as Exempt'}
          </DialogTitle>
          <DialogDescription>
            Transaction: {transaction.transaction_id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Gross Sales</p>
              <p className="font-semibold">{formatCurrency(transaction.sales_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Exempt</p>
              <p className="font-semibold">{formatCurrency(transaction.exempt_amount)}</p>
            </div>
          </div>

          {/* Exempt Amount */}
          <div className="grid gap-2">
            <Label htmlFor="exemptAmount">Exempt Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="exemptAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={transaction.sales_amount}
                  value={exemptAmount}
                  onChange={(e) => {
                    setExemptAmount(e.target.value)
                    setError(null)
                  }}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSetFullAmount}
              >
                Full Amount
              </Button>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="grid gap-2">
            <Label htmlFor="reason">Exemption Reason</Label>
            <Select
              value={reason}
              onValueChange={(value) => {
                setReason(value as ExemptionReason)
                setError(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Other Reason Input */}
          {reason === 'other' && (
            <div className="grid gap-2">
              <Label htmlFor="reasonOther">Specify Reason</Label>
              <Input
                id="reasonOther"
                value={reasonOther}
                onChange={(e) => {
                  setReasonOther(e.target.value)
                  setError(null)
                }}
                placeholder="Enter the exemption reason..."
                maxLength={255}
              />
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="note">Notes (for your records)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional notes about this exemption..."
              rows={2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong>Important:</strong> You are responsible for verifying that this exemption is valid and properly documented. NexusCheck does not validate exemption eligibility.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'edit' ? 'Save Changes' : 'Mark as Exempt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
