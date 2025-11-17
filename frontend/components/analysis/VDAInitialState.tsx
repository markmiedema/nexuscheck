'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'

interface VDAInitialStateProps {
  onEnable: () => void
}

export const VDAInitialState = memo(function VDAInitialState({
  onEnable
}: VDAInitialStateProps) {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-2">
          What is VDA?
        </h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
            <span><strong>Reduced/Waived Penalties</strong> - Most states waive penalties entirely</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
            <span><strong>Limited Lookback</strong> - 3-4 years vs. unlimited audit period</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
            <span><strong>No Criminal Liability</strong> - Protection from fraud prosecution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
            <span><strong>Reduced Interest</strong> - Some states offer interest reductions</span>
          </li>
        </ul>
      </div>

      <Button
        onClick={onEnable}
        className="w-full bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_17.5%)]/90 dark:bg-[hsl(217.2_32.6%_17.5%)] dark:text-[hsl(210_40%_98%)] border border-border/40"
      >
        <Calculator className="mr-2 h-4 w-4" />
        Enable VDA Mode
      </Button>
    </div>
  )
});
