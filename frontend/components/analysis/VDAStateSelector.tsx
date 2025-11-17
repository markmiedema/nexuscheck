'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calculator } from 'lucide-react'

interface State {
  state_code: string
  state_name: string
  estimated_liability: number
}

interface VDAStateSelectorProps {
  states: State[]
  selectedStates: string[]
  calculating: boolean
  onToggleState: (stateCode: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
  onSelectTopN: (n: number) => void
  onCalculate: () => void
  onCancel: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const VDAStateSelector = memo(function VDAStateSelector({
  states,
  selectedStates,
  calculating,
  onToggleState,
  onSelectAll,
  onSelectNone,
  onSelectTopN,
  onCalculate,
  onCancel
}: VDAStateSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-card-foreground">
            Select States for VDA
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which states to include in voluntary disclosure
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Select Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={onSelectNone}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelectTopN(3)}>
              Top 3
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelectTopN(5)}>
              Top 5
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSelectTopN(10)}>
              Top 10
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedStates.length} state{selectedStates.length !== 1 ? 's' : ''} selected
          </div>

          {/* State List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {states.map((state) => (
              <div
                key={state.state_code}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => onToggleState(state.state_code)}
              >
                <Checkbox
                  checked={selectedStates.includes(state.state_code)}
                  onCheckedChange={() => onToggleState(state.state_code)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="font-medium text-card-foreground">
                    {state.state_name} ({state.state_code})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Liability: {formatCurrency(state.estimated_liability)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onCalculate}
            disabled={calculating || selectedStates.length === 0}
            className="flex-1 bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {calculating ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate VDA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
});
