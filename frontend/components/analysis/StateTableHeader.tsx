'use client'

import { memo } from 'react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Info, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

type SortColumn = 'state' | 'sales' | 'nexus_status' | 'liability'
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
        <TableHead className="w-48 px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('state')}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            State
            {getSortIcon('state')}
          </button>
        </TableHead>
        <TableHead className="w-32 px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <div className="flex items-center justify-end gap-1">
            Gross Sales
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total revenue (used for nexus determination)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead className="w-32 px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <div className="flex items-center justify-end gap-1">
            Taxable Sales
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sales subject to tax (used for liability)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead className="w-32 px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          Exempt
        </TableHead>
        <TableHead className="w-28 px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
          <div className="flex items-center justify-end gap-1">
            Threshold
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Economic nexus threshold for this state</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead className="w-48 px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('nexus_status')}
            className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors"
          >
            Status
            {getSortIcon('nexus_status')}
          </button>
        </TableHead>
        <TableHead className="w-32 px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
          <button
            onClick={() => onSort('liability')}
            className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors"
          >
            Est. Liability
            {getSortIcon('liability')}
          </button>
        </TableHead>
        <TableHead className="w-24 px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  )
});
