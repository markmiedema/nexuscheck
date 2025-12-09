'use client'

import { memo } from 'react'

interface TaxRates {
  state_rate: number
  avg_local_rate: number | null
  combined_rate: number
}

interface ThresholdInfo {
  revenue_threshold: number | null
  transaction_threshold: number | null
  threshold_operator: 'or' | 'and' | null
}

interface RegistrationInfo {
  registration_fee: number
  filing_frequencies: string[]
}

interface ComplianceStateTaxInfoProps {
  taxRates: TaxRates
  thresholdInfo: ThresholdInfo
  registrationInfo: RegistrationInfo
  showRegistrationFee?: boolean
  showFilingFrequencies?: boolean
  note?: string
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

const formatThreshold = (info: ThresholdInfo) => {
  const { revenue_threshold, transaction_threshold, threshold_operator } = info

  if (revenue_threshold && transaction_threshold) {
    const operator = threshold_operator === 'or' ? 'OR' : 'AND'
    return `${formatCurrency(revenue_threshold)} revenue ${operator} ${transaction_threshold.toLocaleString()} transactions`
  } else if (revenue_threshold) {
    return `${formatCurrency(revenue_threshold)} revenue`
  } else if (transaction_threshold) {
    return `${transaction_threshold.toLocaleString()} transactions`
  }
  return 'N/A'
}

export const ComplianceStateTaxInfo = memo(function ComplianceStateTaxInfo({
  taxRates,
  thresholdInfo,
  registrationInfo,
  showRegistrationFee = true,
  showFilingFrequencies = false,
  note,
}: ComplianceStateTaxInfoProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">State Tax Information</h3>
      <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
        <div>
          <span className="text-muted-foreground">Economic Nexus Threshold:</span>
          <span className="ml-2 font-medium">{formatThreshold(thresholdInfo)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">State Tax Rate:</span>
          <span className="ml-2 font-medium">{formatPercentage(taxRates.state_rate)}</span>
        </div>
        {taxRates.avg_local_rate !== null && (
          <div>
            <span className="text-muted-foreground">Average Local Rate:</span>
            <span className="ml-2 font-medium">{formatPercentage(taxRates.avg_local_rate)}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Combined Rate:</span>
          <span className="ml-2 font-medium">{formatPercentage(taxRates.combined_rate)}</span>
        </div>
        {showRegistrationFee && (
          <div>
            <span className="text-muted-foreground">Registration Fee:</span>
            <span className="ml-2 font-medium">{formatCurrency(registrationInfo.registration_fee)}</span>
          </div>
        )}
        {showFilingFrequencies && registrationInfo.filing_frequencies.length > 0 && (
          <div>
            <span className="text-muted-foreground">Filing Frequencies:</span>
            <span className="ml-2 font-medium">{registrationInfo.filing_frequencies.join(', ')}</span>
          </div>
        )}
        {note && (
          <div className="mt-4 p-3 bg-card rounded border border-border">
            <p className="text-foreground">
              <strong>Note:</strong> {note}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
