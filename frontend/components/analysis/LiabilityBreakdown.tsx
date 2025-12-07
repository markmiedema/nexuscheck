'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatting';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PenaltyBreakdown } from '@/lib/api';

// Re-export for backward compatibility
export type { PenaltyBreakdown } from '@/lib/api';

interface LiabilityBreakdownProps {
  taxableSales: number; // This is actually exposure_sales - sales during obligation period
  taxRate: number; // Combined rate as percentage (e.g., 8.25)
  estimatedLiability: number;
  baseTax?: number; // Base tax amount (from Phase 2)
  interest?: number; // Interest amount (from Phase 2)
  penalties?: number; // Total penalties amount (legacy support)
  penaltyBreakdown?: PenaltyBreakdown | null; // Detailed penalty breakdown (new)
  marketplaceSales: number;
  nexusStatus: 'has_nexus' | 'approaching' | 'none';
  // Calculation metadata for transparency (can be null from API)
  interestRate?: number | null; // Annual interest rate as percentage (e.g., 8.5)
  interestMethod?: string | null; // Calculation method (e.g., "compound_monthly", "simple")
  daysOutstanding?: number | null; // Number of days interest accrued
  penaltyRate?: number | null; // Penalty rate as percentage (e.g., 20) - legacy
}

/**
 * Helper to format penalty type names for display
 */
function formatPenaltyType(type: string): string {
  const labels: Record<string, string> = {
    late_filing: 'Late Filing',
    late_payment: 'Late Payment',
    negligence: 'Negligence',
    e_filing_failure: 'E-Filing Failure',
    fraud: 'Fraud',
    operating_without_permit: 'Operating Without Permit',
    late_registration: 'Late Registration',
    unregistered_business: 'Unregistered Business',
    cost_of_collection: 'Collection Costs',
    extended_delinquency: 'Extended Delinquency',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export const LiabilityBreakdown = memo(function LiabilityBreakdown({
  taxableSales, // Actually exposure_sales - keeping prop name for backward compatibility
  taxRate,
  estimatedLiability,
  baseTax,
  interest,
  penalties,
  penaltyBreakdown,
  marketplaceSales,
  nexusStatus,
  interestRate,
  interestMethod,
  daysOutstanding,
  penaltyRate,
}: LiabilityBreakdownProps) {
  const [showPenaltyDetails, setShowPenaltyDetails] = useState(false);

  // Only show for states with nexus
  if (nexusStatus !== 'has_nexus') {
    return null;
  }

  // Calculate total penalties from breakdown or use legacy prop
  const totalPenalties = penaltyBreakdown?.total ?? penalties ?? 0;

  // Get penalty items that have non-zero values for detailed breakdown
  const penaltyItems = penaltyBreakdown
    ? Object.entries(penaltyBreakdown)
        .filter(([key, value]) => key !== 'total' && value != null && value > 0)
        .map(([key, value]) => ({ type: key, amount: value as number }))
    : [];

  return (
    <Card className="border-border bg-card shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Estimated Tax Liability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Liability Amount - Prominent Display */}
          <div className="text-center py-4 bg-muted/50 rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Estimated Liability
            </p>
            <p className="text-4xl font-bold text-foreground">
              {formatCurrency(estimatedLiability)}
            </p>
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-2 text-sm bg-muted/50 rounded-lg border border-border p-6">
            <div className="font-semibold text-foreground mb-3">
              Liability Breakdown:
            </div>

            {/* Base Tax */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Base Tax</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(baseTax || estimatedLiability)}
              </span>
            </div>

            {/* Taxable Sales Note */}
            <div className="text-xs text-muted-foreground pl-4 -mt-1 mb-2">
              {formatCurrency(taxableSales)} × {formatPercentage(taxRate)}
              {marketplaceSales > 0 && (
                <span className="italic block mt-1">
                  (Excludes {formatCurrency(marketplaceSales)} marketplace sales)
                </span>
              )}
            </div>

            {/* Interest (if available) */}
            {interest !== undefined && interest > 0 && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">+ Interest</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(interest)}
                  </span>
                </div>
                {/* Interest Calculation Details */}
                <div className="text-xs text-muted-foreground pl-4 -mt-1 mb-2">
                  {interestRate && (
                    <>
                      {formatPercentage(interestRate)} annual rate
                      {interestMethod && interestMethod !== 'simple' && (
                        <span> ({interestMethod.replace('_', ' ')})</span>
                      )}
                      {daysOutstanding && (
                        <span> over {daysOutstanding} days</span>
                      )}
                    </>
                  )}
                  {baseTax && (
                    <span className="block mt-1 italic">
                      Applied to {formatCurrency(baseTax)} base tax
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Penalties (if available) */}
            {totalPenalties > 0 && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <div className="flex items-center gap-1">
                    {penaltyItems.length > 0 && (
                      <button
                        onClick={() => setShowPenaltyDetails(!showPenaltyDetails)}
                        className="p-0.5 hover:bg-muted rounded transition-colors"
                        aria-label={showPenaltyDetails ? 'Hide penalty details' : 'Show penalty details'}
                      >
                        {showPenaltyDetails ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <span className="text-muted-foreground">+ Penalties</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(totalPenalties)}
                  </span>
                </div>

                {/* Detailed Penalty Breakdown */}
                {showPenaltyDetails && penaltyItems.length > 0 && (
                  <div className="pl-6 space-y-1 py-2 bg-muted/30 rounded mb-2">
                    {penaltyItems.map(({ type, amount }) => (
                      <div key={type} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          {formatPenaltyType(type)}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy Penalty Calculation Details (when no breakdown available) */}
                {!penaltyBreakdown && penaltyRate && baseTax && (
                  <div className="text-xs text-muted-foreground pl-4 -mt-1 mb-2">
                    {formatCurrency(baseTax)} × {formatPercentage(penaltyRate)}
                    <span className="block mt-1 italic">
                      Maximum combined penalty (audit scenario)
                    </span>
                  </div>
                )}

                {/* Penalty Items Count Hint */}
                {!showPenaltyDetails && penaltyItems.length > 0 && (
                  <div className="text-xs text-muted-foreground pl-4 -mt-1 mb-2">
                    <button
                      onClick={() => setShowPenaltyDetails(true)}
                      className="hover:underline cursor-pointer"
                    >
                      {penaltyItems.length} penalty type{penaltyItems.length > 1 ? 's' : ''} applied
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Total Result */}
            <div className="flex justify-between items-center py-3 bg-muted rounded px-3 mt-2">
              <span className="font-semibold text-foreground">
                Total Estimated Liability
              </span>
              <span className="font-mono font-bold text-lg text-foreground">
                {formatCurrency(estimatedLiability)}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 border border-border rounded">
            <strong>Note:</strong> This is an estimated liability based on
            aggregate sales data. Actual liability may vary based on specific
            transaction details, exemptions, and local tax jurisdictions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
