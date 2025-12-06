'use client'

import { memo } from 'react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Info, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

export type SortColumn = 'state' | 'nexus_status' | 'threshold' | 'gross_sales' | 'taxable_sales' | 'exempt_sales' | 'tax_liability' | 'penalties_interest' | 'total_liability'
type SortDirection = 'asc' | 'desc'

interface StateTableHeaderProps {
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn) => void
}

export const StateTableHeader = memo(function StateTableHeader({
  sortColumn,
  sortDirection,
  onSort
}: StateTableHeaderProps) {
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 text-foreground" />
      : <ChevronDown className="h-4 w-4 text-foreground" />
  }

  return (
    <TableHeader className="bg-muted/80 border-b-2 border-border sticky top-0 z-10">
      <TableRow className="hover:bg-muted/80">
        {/* 1. State */}
        <TableHead className="w-48 px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('state')}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            State
            {getSortIcon('state')}
          </button>
        </TableHead>
        {/* 2. Status */}
        <TableHead className="w-48 px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('nexus_status')}
            className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors"
          >
            Status
            {getSortIcon('nexus_status')}
          </button>
        </TableHead>
        {/* 3. Threshold */}
        <TableHead className="w-28 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('threshold')}
            className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
          >
            Threshold
            {getSortIcon('threshold')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Economic nexus threshold for this state</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </TableHead>
        {/* 4. Gross Sales */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('gross_sales')}
            className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
          >
            Gross Sales
            {getSortIcon('gross_sales')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total revenue (used for nexus determination)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </TableHead>
        {/* 5. Taxable Sales */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('taxable_sales')}
            className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
          >
            Taxable Sales
            {getSortIcon('taxable_sales')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sales subject to tax (used for liability)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </TableHead>
        {/* 6. Exempt Sales */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('exempt_sales')}
            className="flex items-center gap-2 justify-end hover:text-foreground transition-colors"
          >
            Exempt Sales
            {getSortIcon('exempt_sales')}
          </button>
        </TableHead>
        {/* 7. Tax Liability */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('tax_liability')}
            className="flex items-center gap-2 justify-end hover:text-foreground transition-colors"
          >
            Tax Liability
            {getSortIcon('tax_liability')}
          </button>
        </TableHead>
        {/* 8. Penalties & Interest */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('penalties_interest')}
            className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
          >
            P&I
            {getSortIcon('penalties_interest')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Penalties and Interest</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </TableHead>
        {/* 9. Total Liability */}
        <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('total_liability')}
            className="flex items-center gap-1 justify-end hover:text-foreground transition-colors"
          >
            Total Liability
            {getSortIcon('total_liability')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tax liability plus penalties and interest</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
});
