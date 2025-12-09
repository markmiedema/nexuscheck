'use client'

import { memo } from 'react'
import { PenaltyBreakdown } from '@/lib/api'

interface CompliancePenaltiesInterestProps {
  stateName: string
  interestRate?: number | null
  interestMethod?: string | null
  penaltyBreakdown?: PenaltyBreakdown | null
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

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
}

const formatInterestMethod = (method: string | null | undefined) => {
  if (!method) return 'N/A'
  switch (method) {
    case 'simple': return 'Simple Interest'
    case 'compound_monthly': return 'Compounded Monthly'
    case 'compound_daily': return 'Compounded Daily'
    case 'compound_annually': return 'Compounded Annually'
    default: return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
}

export const CompliancePenaltiesInterest = memo(function CompliancePenaltiesInterest({
  stateName,
  interestRate,
  interestMethod,
  penaltyBreakdown,
}: CompliancePenaltiesInterestProps) {
  // Check if we have any data to show
  const hasInterestData = interestRate !== undefined && interestRate !== null
  const hasPenaltyData = penaltyBreakdown && (
    (penaltyBreakdown.late_filing !== undefined && penaltyBreakdown.late_filing > 0) ||
    (penaltyBreakdown.late_payment !== undefined && penaltyBreakdown.late_payment > 0)
  )

  if (!hasInterestData && !hasPenaltyData) {
    return null
  }

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Penalties & Interest</h3>
      <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
        {hasInterestData && (
          <>
            <div>
              <span className="text-muted-foreground">Interest Rate:</span>
              <span className="ml-2 font-medium">{formatPercentage(interestRate!)} per year</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interest Method:</span>
              <span className="ml-2 font-medium">{formatInterestMethod(interestMethod)}</span>
            </div>
          </>
        )}
        {penaltyBreakdown && (
          <>
            {penaltyBreakdown.late_filing !== undefined && penaltyBreakdown.late_filing > 0 && (
              <div>
                <span className="text-muted-foreground">Late Filing Penalty:</span>
                <span className="ml-2 font-medium">{formatCurrency(penaltyBreakdown.late_filing)}</span>
              </div>
            )}
            {penaltyBreakdown.late_payment !== undefined && penaltyBreakdown.late_payment > 0 && (
              <div>
                <span className="text-muted-foreground">Late Payment Penalty:</span>
                <span className="ml-2 font-medium">{formatCurrency(penaltyBreakdown.late_payment)}</span>
              </div>
            )}
          </>
        )}
        <div className="mt-3 p-3 bg-card rounded border border-border">
          <p className="text-muted-foreground text-xs">
            <strong>Note:</strong> Penalties and interest are calculated based on {stateName}'s
            current rates. Actual amounts may vary based on filing date, payment history,
            and any applicable waivers or VDA programs.
          </p>
        </div>
      </div>
    </div>
  )
})
