'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { AccordionCustom } from '@/components/ui/accordion-custom'

interface VDAResult {
  before_vda: number
  with_vda: number
  total_savings: number
  savings_percentage: number
  state_breakdown: Array<{
    state_code: string
    state_name: string
    before_vda: number
    with_vda: number
    savings: number
    penalty_waived: number
    interest_waived: number
  }>
}

interface VDAResultsProps {
  vdaResults: VDAResult | null
  onChangeStates: () => void
  onDisable: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const VDAResults = memo(function VDAResults({
  vdaResults,
  onChangeStates,
  onDisable
}: VDAResultsProps) {
  if (!vdaResults) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Before VDA
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(vdaResults.before_vda)}
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            With VDA
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(vdaResults.with_vda)}
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Savings
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(vdaResults.total_savings)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {vdaResults.savings_percentage.toFixed(1)}% reduction
          </div>
        </div>
      </div>

      {/* Top States Breakdown */}
      {vdaResults.state_breakdown.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <h3 className="font-semibold text-card-foreground mb-4">
            Top States by Savings
          </h3>
          <AccordionCustom
            items={vdaResults.state_breakdown.slice(0, 5).map((state) => ({
              id: state.state_code,
              title: (
                <div className="flex items-center justify-between w-full pr-8">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-card-foreground">
                      {state.state_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({state.state_code})
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground ml-4">
                    {formatCurrency(state.savings)}
                  </span>
                </div>
              ) as any,
              content: (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Before VDA:</span>
                    <span className="font-medium text-foreground">{formatCurrency(state.before_vda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With VDA:</span>
                    <span className="font-medium text-foreground">{formatCurrency(state.with_vda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalties Waived:</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(state.penalty_waived)}
                    </span>
                  </div>
                  {state.interest_waived > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Waived:</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(state.interest_waived)}
                      </span>
                    </div>
                  )}
                </div>
              )
            }))}
            allowMultiple={false}
            variant="bordered"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onChangeStates}
          className="flex-1"
        >
          Change States
        </Button>
        <Button
          variant="outline"
          onClick={onDisable}
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Disable VDA
        </Button>
      </div>
    </div>
  )
});
