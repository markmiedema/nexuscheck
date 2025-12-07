'use client'

import { memo } from 'react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Info, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

export type SortColumn = 'state' | 'threshold' | 'gross_sales' | 'taxable_sales' | 'exempt_sales' | 'exposure_sales' | 'tax_liability' | 'penalties_interest' | 'total_liability'
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
    <TooltipProvider delayDuration={300}>
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
            Status
          </TableHead>
          {/* 3. Threshold */}
          <TableHead className="w-28 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('threshold')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Threshold
                {getSortIcon('threshold')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Economic nexus threshold for this state</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 4. Operator */}
          <TableHead className="w-20 px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-center">
              <span>Operator</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>AND = must meet both thresholds; OR = meet either threshold</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 5. Gross Sales */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('gross_sales')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Gross Sales
                {getSortIcon('gross_sales')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Total revenue (used for nexus determination)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 6. Taxable Sales */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('taxable_sales')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Taxable Sales
                {getSortIcon('taxable_sales')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Sales subject to tax (used for liability)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 7. Exempt Sales */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('exempt_sales')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Exempt Sales
                {getSortIcon('exempt_sales')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Sales exempt from tax</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 8. Exposure Sales */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('exposure_sales')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Exposure Sales
                {getSortIcon('exposure_sales')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Taxable sales during obligation period (used for liability calculation)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 9. Tax Liability */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('tax_liability')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Tax Liability
                {getSortIcon('tax_liability')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Base tax owed (excludes penalties and interest)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 10. Penalties & Interest */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('penalties_interest')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                P&I
                {getSortIcon('penalties_interest')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Penalties and Interest combined</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          {/* 11. Total Liability */}
          <TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => onSort('total_liability')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Total Liability
                {getSortIcon('total_liability')}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Tax liability plus penalties and interest</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
    </TooltipProvider>
  )
});
