'use client'

import { memo } from 'react'
import { StateResult } from '@/types/states'
import { TableCell, TableRow } from '@/components/ui/table'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

type Density = 'compact' | 'comfortable' | 'spacious'

interface StateTableRowProps {
  state: StateResult
  density: Density
  onStateClick: (code: string, name: string) => void
}

const densityClasses = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const getNexusStatusLabel = (status: string) => {
  switch (status) {
    case 'has_nexus': return 'Has Nexus'
    case 'approaching': return 'Approaching'
    case 'no_nexus': return 'No Nexus'
    default: return status
  }
}

export const StateTableRow = memo(function StateTableRow({
  state,
  density,
  onStateClick
}: StateTableRowProps) {
  return (
    <TableRow
      className="hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onStateClick(state.state_code, state.state_name)}
    >
      {/* 1. State Name */}
      <TableCell className={`px-4 text-sm text-foreground ${densityClasses[density]}`}>
        <div className="font-medium text-foreground">
          {state.state_name}
        </div>
        <div className="text-xs text-muted-foreground">
          ({state.state_code})
        </div>
      </TableCell>

      {/* 2. Status Badge */}
      <TableCell className={`px-4 text-sm text-foreground text-center ${densityClasses[density]}`}>
        <div className="flex items-center justify-center">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border"
            style={{
              '--badge-bg-light':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 45% / 0.1)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 45% / 0.1)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 45% / 0.1)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 50% / 0.1)'
                  : 'hsl(142 71% 40% / 0.1)',
              '--badge-color-light':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 35%)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 35%)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 40%)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 40%)'
                  : 'hsl(142 71% 30%)',
              '--badge-border-light':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 45% / 0.3)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 45% / 0.3)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 45% / 0.3)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 50% / 0.3)'
                  : 'hsl(142 71% 40% / 0.3)',
              '--badge-bg-dark':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 45% / 0.15)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 45% / 0.15)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 45% / 0.15)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 50% / 0.15)'
                  : 'hsl(142 71% 40% / 0.15)',
              '--badge-color-dark':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 75%)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 75%)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 75%)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 70%)'
                  : 'hsl(142 71% 70%)',
              '--badge-border-dark':
                state.nexus_type === 'both'
                  ? 'hsl(289 46% 45% / 0.4)'
                  : state.nexus_type === 'physical'
                  ? 'hsl(217 32.6% 45% / 0.4)'
                  : state.nexus_type === 'economic'
                  ? 'hsl(0 60% 45% / 0.4)'
                  : state.nexus_status === 'approaching'
                  ? 'hsl(38 92% 50% / 0.4)'
                  : 'hsl(142 71% 40% / 0.4)',
              backgroundColor: 'var(--badge-bg-light)',
              color: 'var(--badge-color-light)',
              borderColor: 'var(--badge-border-light)',
            } as React.CSSProperties & Record<string, string>}
          >
            {state.nexus_type === 'both'
              ? 'Physical + Economic'
              : state.nexus_type === 'physical'
              ? 'Physical Nexus'
              : state.nexus_type === 'economic'
              ? 'Economic Nexus'
              : getNexusStatusLabel(state.nexus_status)}
          </span>
        </div>
      </TableCell>

      {/* 3. Threshold */}
      <TableCell className="px-4 py-2 text-sm text-right">
        {state.threshold ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-foreground cursor-help">
                  {formatCurrency(state.threshold)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  {state.threshold_percent.toFixed(0)}% of threshold reached
                  ({formatCurrency(state.total_sales)} of {formatCurrency(state.threshold)})
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* 4. Gross Sales */}
      <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
        {formatCurrency(state.total_sales || 0)}
      </TableCell>

      {/* 5. Taxable Sales */}
      <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
        {formatCurrency(state.taxable_sales || 0)}
      </TableCell>

      {/* 6. Exempt Sales */}
      <TableCell className="px-4 py-2 text-sm text-right">
        {state.exempt_sales > 0 ? (
          <div>
            <div className="font-medium text-foreground">{formatCurrency(state.exempt_sales)}</div>
            <div className="text-xs text-muted-foreground">
              ({((state.exempt_sales / state.total_sales) * 100).toFixed(0)}%)
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* 7. Tax Liability */}
      <TableCell className={`px-4 text-sm text-right text-card-foreground font-medium ${densityClasses[density]}`}>
        ${state.estimated_liability.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </TableCell>

      {/* 8. Penalties & Interest */}
      <TableCell className={`px-4 text-sm text-right ${densityClasses[density]}`}>
        <span className="text-muted-foreground">-</span>
      </TableCell>

      {/* 9. Total Liability */}
      <TableCell className={`px-4 text-sm text-right text-card-foreground font-medium ${densityClasses[density]}`}>
        ${state.estimated_liability.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </TableCell>
    </TableRow>
  )
});
