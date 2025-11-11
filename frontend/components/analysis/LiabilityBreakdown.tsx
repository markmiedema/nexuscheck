'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LiabilityBreakdownProps {
  taxableSales: number;
  taxRate: number; // Combined rate as percentage (e.g., 8.25)
  estimatedLiability: number;
  baseTax?: number; // Base tax amount (from Phase 2)
  interest?: number; // Interest amount (from Phase 2)
  penalties?: number; // Penalties amount (from Phase 2)
  marketplaceSales: number;
  nexusStatus: 'has_nexus' | 'approaching' | 'none';
  // Calculation metadata for transparency
  interestRate?: number; // Annual interest rate as percentage (e.g., 8.5)
  interestMethod?: string; // Calculation method (e.g., "compound_monthly", "simple")
  daysOutstanding?: number; // Number of days interest accrued
  penaltyRate?: number; // Penalty rate as percentage (e.g., 20)
}

export function LiabilityBreakdown({
  taxableSales,
  taxRate,
  estimatedLiability,
  baseTax,
  interest,
  penalties,
  marketplaceSales,
  nexusStatus,
  interestRate,
  interestMethod,
  daysOutstanding,
  penaltyRate,
}: LiabilityBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Only show for states with nexus
  if (nexusStatus !== 'has_nexus') {
    return null;
  }

  return (
    <Card className="border-gray-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-lg">Estimated Tax Liability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Liability Amount - Prominent Display */}
          <div className="text-center py-4 bg-white dark:bg-slate-700 rounded-lg border-2 border-gray-400 dark:border-slate-400">
            <p className="text-sm text-muted-foreground mb-1">
              Estimated Liability
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(estimatedLiability)}
            </p>
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Liability Breakdown:
            </div>

            {/* Base Tax */}
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
              <span className="text-gray-600 dark:text-gray-400">Base Tax</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(baseTax || estimatedLiability)}
              </span>
            </div>

            {/* Taxable Sales Note */}
            <div className="text-xs text-gray-500 dark:text-gray-400 pl-4 -mt-1 mb-2">
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
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                  <span className="text-gray-600 dark:text-gray-400">+ Interest</span>
                  <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(interest)}
                  </span>
                </div>
                {/* Interest Calculation Details */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-4 -mt-1 mb-2">
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
            {penalties !== undefined && penalties > 0 && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                  <span className="text-gray-600 dark:text-gray-400">+ Penalties</span>
                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(penalties)}
                  </span>
                </div>
                {/* Penalty Calculation Details */}
                {penaltyRate && baseTax && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-4 -mt-1 mb-2">
                    {formatCurrency(baseTax)} × {formatPercentage(penaltyRate)}
                    <span className="block mt-1 italic">
                      Maximum combined penalty (audit scenario)
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Total Result */}
            <div className="flex justify-between items-center py-3 bg-slate-100 dark:bg-slate-700 rounded px-3 mt-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                Total Estimated Liability
              </span>
              <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                {formatCurrency(estimatedLiability)}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
            <strong>Note:</strong> This is an estimated liability based on
            aggregate sales data. Actual liability may vary based on specific
            transaction details, exemptions, and local tax jurisdictions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
