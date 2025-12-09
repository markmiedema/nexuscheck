'use client'

import { memo } from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

type NexusStatus = 'has_nexus' | 'approaching' | 'none' | 'zero_sales'

interface ComplianceStatusBannerProps {
  nexusStatus: NexusStatus
  stateName: string
  currentYear: number
  totalSales: number
  percentageOfThreshold: number
  amountUntilNexus: number | null
}

// Format helpers
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const ComplianceStatusBanner = memo(function ComplianceStatusBanner({
  nexusStatus,
  stateName,
  currentYear,
  totalSales,
  percentageOfThreshold,
  amountUntilNexus,
}: ComplianceStatusBannerProps) {
  // Approaching Nexus - Yellow Warning
  if (nexusStatus === 'approaching') {
    return (
      <div className="rounded-md bg-warning/10 border border-warning/20 p-4">
        <h3 className="font-semibold text-warning-foreground mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Approaching Nexus Threshold
        </h3>
        <div className="space-y-1 text-sm text-warning-foreground">
          <p>
            <strong>Your sales:</strong> {formatCurrency(totalSales)} (
            {percentageOfThreshold.toFixed(0)}% of threshold)
          </p>
          <p>
            <strong>Amount until nexus:</strong> {formatCurrency(amountUntilNexus)}
          </p>
          <p className="mt-2">
            You're close to triggering economic nexus in {stateName}. With just{' '}
            <strong>{formatCurrency(amountUntilNexus)}</strong> more in sales,
            you'll need to register and collect tax.
          </p>
        </div>
      </div>
    )
  }

  // No Nexus - Green Success
  if (nexusStatus === 'none') {
    return (
      <div
        className="rounded-md p-4 border"
        style={{
          '--banner-bg-light': 'hsl(142 71% 40% / 0.1)',
          '--banner-border-light': 'hsl(142 71% 40% / 0.2)',
          '--banner-bg-dark': 'hsl(142 71% 40% / 0.15)',
          '--banner-border-dark': 'hsl(142 71% 40% / 0.3)',
          backgroundColor: 'var(--banner-bg-light)',
          borderColor: 'var(--banner-border-light)',
        } as React.CSSProperties & Record<string, string>}
      >
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
          <CheckCircle className="h-5 w-5" />
          No Nexus - No Action Required
        </h3>
        <div className="space-y-1 text-sm text-foreground">
          <p>
            <strong>Your sales:</strong> {formatCurrency(totalSales)} (
            {percentageOfThreshold.toFixed(0)}% of threshold)
          </p>
          <p>
            <strong>Amount until nexus:</strong> {formatCurrency(amountUntilNexus)}
          </p>
          <p className="mt-2">
            You have not established economic nexus in {stateName}. No compliance
            obligations at this time.
          </p>
        </div>
      </div>
    )
  }

  // Zero Sales - Info
  if (nexusStatus === 'zero_sales') {
    return (
      <div className="rounded-md bg-muted border border-border p-4">
        <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" />
          No Sales Activity
        </h3>
        <div className="space-y-1 text-sm text-foreground">
          <p>
            No transactions recorded in {stateName} for {currentYear}.
          </p>
          <p className="mt-2">
            Ready to expand to this state? Here's what you'll need to know when you
            reach the nexus threshold.
          </p>
        </div>
      </div>
    )
  }

  // has_nexus doesn't show a banner - it shows the Required Actions checklist
  return null
})
