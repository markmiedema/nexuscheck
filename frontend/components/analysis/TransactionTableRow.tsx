'use client'

import { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ShieldCheck, ShieldX } from 'lucide-react'

export interface Transaction {
  transaction_id: string
  transaction_date: string
  sales_amount: number
  taxable_amount: number
  exempt_amount: number
  is_taxable: boolean
  sales_channel: 'direct' | 'marketplace'
  running_total: number
  exemption_reason?: string
  exemption_reason_other?: string
  exemption_note?: string
  exemption_marked_at?: string
}

interface TransactionTableRowProps {
  transaction: Transaction
  isThresholdCrossing: boolean
  hasPendingChange: boolean
  selectionMode: boolean
  isSelected: boolean
  showActions: boolean
  onToggleSelection: (transactionId: string) => void
  onOpenExemptionModal: (transaction: Transaction, mode: 'create' | 'edit') => void
  onRemoveExemption: (transactionId: string) => void
}

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const TransactionTableRow = memo(function TransactionTableRow({
  transaction,
  isThresholdCrossing,
  hasPendingChange,
  selectionMode,
  isSelected,
  showActions,
  onToggleSelection,
  onOpenExemptionModal,
  onRemoveExemption,
}: TransactionTableRowProps) {
  const isExempt = transaction.exempt_amount > 0

  return (
    <TableRow
      className={`
        ${isThresholdCrossing ? 'bg-warning/10 border-l-4 border-l-warning' : ''}
        ${hasPendingChange ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
        border-b border-border hover:bg-muted/30 transition-colors
      `}
    >
      {selectionMode && (
        <TableCell className="px-4 py-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(transaction.transaction_id)}
          />
        </TableCell>
      )}
      <TableCell className="px-4 py-3 text-sm text-foreground">
        {formatDate(transaction.transaction_date)}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-foreground font-mono">
        <div className="flex items-center gap-2">
          {transaction.transaction_id}
          {isExempt && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Exempt
            </Badge>
          )}
          {hasPendingChange && (
            <Badge variant="outline" className="text-xs">
              Pending
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-right font-medium text-foreground">
        {formatCurrency(transaction.sales_amount)}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-right text-foreground">
        {transaction.taxable_amount !== 0 ? formatCurrency(transaction.taxable_amount) : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-right text-foreground">
        {transaction.exempt_amount !== 0 ? (
          <span className="text-green-600 dark:text-green-400 font-medium">
            {formatCurrency(transaction.exempt_amount)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-center text-foreground">
        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold shadow-sm bg-muted text-foreground">
          {transaction.sales_channel === 'direct' ? 'Direct' : 'Marketplace'}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-right font-semibold text-foreground">
        {formatCurrency(transaction.running_total)}
      </TableCell>
      {showActions && (
        <TableCell className="px-4 py-3 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isExempt ? (
                <>
                  <DropdownMenuItem onClick={() => onOpenExemptionModal(transaction, 'edit')}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Edit Exemption
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRemoveExemption(transaction.transaction_id)}
                    className="text-destructive"
                  >
                    <ShieldX className="h-4 w-4 mr-2" />
                    Remove Exemption
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onOpenExemptionModal(transaction, 'create')}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Mark as Exempt
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  )
})
