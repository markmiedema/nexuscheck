'use client'

import { memo } from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenaltyBreakdown } from '@/lib/api'
import {
  ComplianceStateTaxInfo,
  ComplianceResources,
  ComplianceRequiredActions,
  CompliancePenaltiesInterest,
  ComplianceStatusBanner,
  CompliancePrepareForNexus,
} from './compliance'

interface ComplianceSectionProps {
  nexusStatus: 'has_nexus' | 'approaching' | 'none' | 'zero_sales'
  stateName: string
  nexusFirstEstablishedYear?: number
  currentYear: number
  summary: {
    totalSales: number
    transactionCount: number
  }
  thresholdInfo: {
    revenue_threshold: number | null
    transaction_threshold: number | null
    threshold_operator: 'or' | 'and'
    percentage_of_threshold: number
    amount_until_nexus: number | null
    amount_over_nexus: number | null
  }
  complianceInfo: {
    tax_rates: {
      state_rate: number
      avg_local_rate: number | null
      combined_rate: number
    }
    threshold_info: {
      revenue_threshold: number | null
      transaction_threshold: number | null
      threshold_operator: 'or' | 'and' | null
    }
    registration_info: {
      registration_fee: number
      filing_frequencies: string[]
      registration_url: string | null
      dor_website: string | null
    }
  }
  // Penalty and interest information
  interestRate?: number | null
  interestMethod?: string | null
  penaltyBreakdown?: PenaltyBreakdown | null
}

// Get the header icon based on nexus status
function getHeaderIcon(nexusStatus: string) {
  switch (nexusStatus) {
    case 'has_nexus':
      return <AlertCircle className="h-5 w-5" />
    case 'approaching':
      return <AlertCircle className="h-5 w-5 text-warning-foreground" />
    case 'none':
      return <CheckCircle className="h-5 w-5 text-success-foreground" />
    case 'zero_sales':
      return <Info className="h-5 w-5 text-muted-foreground" />
    default:
      return null
  }
}

export const ComplianceSection = memo(function ComplianceSection({
  nexusStatus,
  stateName,
  currentYear,
  summary,
  thresholdInfo,
  complianceInfo,
  interestRate,
  interestMethod,
  penaltyBreakdown,
}: ComplianceSectionProps) {
  // Common props for child components
  const taxRates = complianceInfo.tax_rates
  const thresholdInfoForTax = complianceInfo.threshold_info
  const registrationInfo = complianceInfo.registration_info

  // Determine what to show based on nexus status
  const showRequiredActions = nexusStatus === 'has_nexus'
  const showStatusBanner = nexusStatus !== 'has_nexus'
  const showPrepareForNexus = nexusStatus === 'approaching'
  const showPenaltiesInterest = nexusStatus === 'has_nexus'
  const showRegistrationFee = nexusStatus === 'has_nexus' || nexusStatus === 'approaching'
  const showFilingFrequencies = nexusStatus === 'has_nexus'
  const showVdaLinks = nexusStatus === 'has_nexus' || nexusStatus === 'approaching'
  const showRegistrationLinks = nexusStatus === 'has_nexus' || nexusStatus === 'approaching'

  // Note for non-nexus states
  const taxInfoNote = nexusStatus === 'none'
    ? "If you reach the threshold, you'll need to register within 30 days and begin collecting tax."
    : undefined

  return (
    <Card className="border-border bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getHeaderIcon(nexusStatus)}
          Compliance Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status-specific banner (approaching, none, zero_sales) */}
        {showStatusBanner && (
          <ComplianceStatusBanner
            nexusStatus={nexusStatus}
            stateName={stateName}
            currentYear={currentYear}
            totalSales={summary.totalSales}
            percentageOfThreshold={thresholdInfo.percentage_of_threshold}
            amountUntilNexus={thresholdInfo.amount_until_nexus}
          />
        )}

        {/* Required Actions Checklist (has_nexus only) */}
        {showRequiredActions && (
          <ComplianceRequiredActions
            stateName={stateName}
            registrationInfo={registrationInfo}
          />
        )}

        {/* Prepare for Nexus (approaching only) */}
        {showPrepareForNexus && (
          <CompliancePrepareForNexus stateName={stateName} />
        )}

        {/* State Tax Information (all statuses) */}
        <ComplianceStateTaxInfo
          taxRates={taxRates}
          thresholdInfo={thresholdInfoForTax}
          registrationInfo={registrationInfo}
          showRegistrationFee={showRegistrationFee}
          showFilingFrequencies={showFilingFrequencies}
          note={taxInfoNote}
        />

        {/* Penalties & Interest (has_nexus only) */}
        {showPenaltiesInterest && (
          <CompliancePenaltiesInterest
            stateName={stateName}
            interestRate={interestRate}
            interestMethod={interestMethod}
            penaltyBreakdown={penaltyBreakdown}
          />
        )}

        {/* Helpful Resources (all statuses) */}
        <ComplianceResources
          stateName={stateName}
          registrationInfo={registrationInfo}
          showRegistrationLinks={showRegistrationLinks}
          showVdaLinks={showVdaLinks}
        />
      </CardContent>
    </Card>
  )
})
