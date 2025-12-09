'use client'

import { memo } from 'react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export type SortField = 'date' | 'amount'
export type SortDirection = 'asc' | 'desc'

interface TransactionTableHeaderProps {
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  selectionMode: boolean
  allSelected: boolean
  onSelectAll: () => void
  showActions: boolean
}

export const TransactionTableHeader = memo(function TransactionTableHeader({
  sortField,
  sortDirection,
  onSort,
  selectionMode,
  allSelected,
  onSelectAll,
  showActions,
}: TransactionTableHeaderProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <TableHeader className="bg-muted/80 border-b-2 border-border">
      <TableRow className="hover:bg-muted/80">
        {selectionMode && (
          <TableHead className="px-4 py-3 w-[50px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
        )}
        <TableHead
          className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer select-none"
          onClick={() => onSort('date')}
        >
          <div className="flex items-center">
            Date
            {getSortIcon('date')}
          </div>
        </TableHead>
        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
          Transaction ID
        </TableHead>
        <TableHead
          className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer select-none"
          onClick={() => onSort('amount')}
        >
          <div className="flex items-center justify-end">
            Gross Sales
            {getSortIcon('amount')}
          </div>
        </TableHead>
        <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          Taxable Sales
        </TableHead>
        <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          Exempt
        </TableHead>
        <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
          Channel
        </TableHead>
        <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          Running Total
        </TableHead>
        {showActions && (
          <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider w-[80px]">
            Actions
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  )
})
