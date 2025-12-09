'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useStateDetail } from '@/hooks/queries';
import { type YearData } from '@/lib/api';
import { StateDetailHeader } from '@/components/analysis/StateDetailHeader';
import { SummaryCards } from '@/components/analysis/SummaryCards';
import { LiabilityBreakdown } from '@/components/analysis/LiabilityBreakdown';
import { ThresholdProgressBar } from '@/components/analysis/ThresholdProgressBar';
import TransactionTable from '@/components/analysis/TransactionTable';
import { ComplianceSection } from '@/components/analysis/ComplianceSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

// Lazy load MonthlyTrendChart to reduce initial bundle size (saves ~250KB from recharts)
const MonthlyTrendChart = dynamic(() => import('@/components/analysis/MonthlyTrendChart').then(mod => ({ default: mod.MonthlyTrendChart })), {
  loading: () => (
    <div className="h-64 bg-muted/30 rounded-md border border-dashed border-border flex items-center justify-center animate-pulse">
      <div className="text-muted-foreground">Loading chart...</div>
    </div>
  ),
  ssr: false,
});

interface StateDetailPageProps {
  params: {
    id: string;
    stateCode: string;
  };
}

export default function StateDetailPage({ params }: StateDetailPageProps) {
  // Note: params.id here is a client ID, but we use it as an analysis ID
  // This is because client-linked analyses share the same state detail endpoint
  const { data, isLoading: loading, error: queryError } = useStateDetail(params.id, params.stateCode);
  const [selectedYear, setSelectedYear] = useState<number | 'all' | null>(null);

  // Derive error message from query error
  const error = queryError
    ? (queryError instanceof Error ? queryError.message : 'Failed to load state details')
    : null;

  // Set default year when data loads
  useEffect(() => {
    if (data && selectedYear === null) {
      if (data.analysis_period.years_available.length > 1) {
        setSelectedYear('all');
      } else if (data.analysis_period.years_available.length === 1) {
        setSelectedYear(data.analysis_period.years_available[0]);
      }
    }
  }, [data, selectedYear]);

  // Loading skeleton
  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Clients', href: '/clients' },
            { label: 'Client Dashboard', href: `/clients/${params.id}` },
            { label: params.stateCode.toUpperCase() },
          ]}
        >
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Clients', href: '/clients' },
            { label: 'Client Dashboard', href: `/clients/${params.id}` },
            { label: params.stateCode.toUpperCase() },
          ]}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-destructive-foreground mb-2">Error</h2>
                <p className="text-muted-foreground">
                  {error || 'Failed to load state details'}
                </p>
              </div>
            </CardContent>
          </Card>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Find year data for selected year, or create aggregate for "all"
  const yearData: YearData | undefined =
    selectedYear === 'all'
      ? undefined // Will use aggregate data from response root
      : data.year_data.find((yd) => yd.year === selectedYear);

  // For "all years" mode, create aggregate view
  const isAllYearsView = selectedYear === 'all';
  const aggregateNexusStatus: 'has_nexus' | 'approaching' | 'none' =
    data.nexus_type === 'economic' || data.nexus_type === 'physical' || data.nexus_type === 'both'
      ? 'has_nexus'
      : 'none';

  // Determine nexus status based on has_transactions flag
  const nexusStatus: 'has_nexus' | 'approaching' | 'none' | 'zero_sales' =
    !data.has_transactions
      ? 'zero_sales'
      : isAllYearsView
      ? aggregateNexusStatus
      : yearData?.nexus_status || 'none';

  // Determine threshold status for progress bar
  const getThresholdStatus = (): 'safe' | 'approaching' | 'exceeded' => {
    if (!yearData) return 'safe';
    if (yearData.threshold_info.approaching) return 'approaching';
    if (yearData.nexus_status === 'has_nexus') return 'exceeded';
    return 'safe';
  };

  // Find the month when nexus was crossed (if any)
  const findNexusCrossedMonth = (): string | undefined => {
    if (
      !yearData ||
      yearData.nexus_status !== 'has_nexus' ||
      !yearData.threshold_info.revenue_threshold
    ) {
      return undefined;
    }

    let runningTotal = 0;
    for (const monthData of yearData.monthly_sales) {
      runningTotal += monthData.sales;
      if (runningTotal >= yearData.threshold_info.revenue_threshold) {
        return monthData.month;
      }
    }
    return undefined;
  };

  const nexusCrossedMonth = findNexusCrossedMonth();

  // Get current year for zero-sales states
  const currentYear = yearData?.year || new Date().getFullYear();

  // Format date for breadcrumb display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate analysis period for breadcrumb
  const getAnalysisPeriod = () => {
    if (!data) return null;

    const startDate = isAllYearsView
      ? `${Math.min(...data.analysis_period.years_available)}-01-01`
      : `${selectedYear}-01-01`;
    const endDate = isAllYearsView
      ? `${Math.max(...data.analysis_period.years_available)}-12-31`
      : `${selectedYear}-12-31`;

    return `Analysis Period: ${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Analyses', href: '/analyses' },
          { label: 'Analysis Results', href: `/analysis/${params.id}/results` },
          { label: `${params.stateCode.toUpperCase()} - ${data.state_name}` },
        ]}
        breadcrumbsRightContent={getAnalysisPeriod()}
      >
        <ErrorBoundary>
          <div className="space-y-6">
          {/* Header Section - only show if has transactions */}
      {data.has_transactions && (yearData || isAllYearsView) && (
        <StateDetailHeader
          stateName={data.state_name}
          stateCode={data.state_code}
          nexusStatus={nexusStatus === 'zero_sales' ? 'none' : nexusStatus}
          nexusType={data.nexus_type}
          totalSales={
            isAllYearsView
              ? data.total_sales || 0
              : yearData?.summary.total_sales || 0
          }
          transactionCount={
            isAllYearsView
              ? data.transaction_count || 0
              : yearData?.summary.transaction_count || 0
          }
          yearsAvailable={data.analysis_period.years_available}
          selectedYear={selectedYear || data.analysis_period.years_available[0]}
          onYearChange={setSelectedYear}
          analysisName={`Analysis ${params.id}`}
          analysisId={params.id}
          analysisPeriod={{
            start_date: isAllYearsView
              ? `${Math.min(...data.analysis_period.years_available)}-01-01`
              : `${selectedYear}-01-01`,
            end_date: isAllYearsView
              ? `${Math.max(...data.analysis_period.years_available)}-12-31`
              : `${selectedYear}-12-31`,
          }}
        />
      )}

      {/* Summary Cards - only show if has transactions */}
      {data.has_transactions && (yearData || isAllYearsView) && (
        <SummaryCards
          totalSales={
            isAllYearsView
              ? data.total_sales || 0
              : yearData?.summary.total_sales || 0
          }
          transactionCount={
            isAllYearsView
              ? data.transaction_count || 0
              : yearData?.summary.transaction_count || 0
          }
          directSales={
            isAllYearsView
              ? data.direct_sales || 0
              : yearData?.summary.direct_sales || 0
          }
          marketplaceSales={
            isAllYearsView
              ? data.marketplace_sales || 0
              : yearData?.summary.marketplace_sales || 0
          }
          taxableSales={
            isAllYearsView
              ? data.taxable_sales || 0
              : yearData?.summary.taxable_sales || 0
          }
          exemptSales={
            isAllYearsView
              ? data.exempt_sales || 0
              : yearData?.summary.exempt_sales || 0
          }
        />
      )}

      {/* Sales Breakdown - Show if has exempt sales */}
      {data.has_transactions && (() => {
        const grossSales = isAllYearsView
          ? data.total_sales || 0
          : yearData?.summary.total_sales || 0

        const taxableSales = isAllYearsView
          ? data.taxable_sales || 0
          : yearData?.summary.taxable_sales || 0

        const exemptSales = isAllYearsView
          ? data.exempt_sales || 0
          : yearData?.summary.exempt_sales || 0

        // Only show if there are exempt sales
        if (exemptSales === 0) return null

        return (
          <Card className="border-border bg-card shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Sales Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Visual equation */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 bg-muted/50 border border-border rounded p-3">
                    <div className="text-xs text-muted-foreground mb-1">Gross Sales</div>
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(grossSales)}
                    </div>
                  </div>
                  <div className="text-muted-foreground">−</div>
                  <div className="flex-1 bg-muted/50 border border-border rounded p-3">
                    <div className="text-xs text-muted-foreground mb-1">Exempt Sales</div>
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(exemptSales)}
                    </div>
                  </div>
                  <div className="text-muted-foreground">=</div>
                  <div className="flex-1 bg-primary/10 border border-primary/30 rounded p-3">
                    <div className="text-xs text-primary mb-1">Taxable Sales</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(taxableSales)}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
                  <p className="text-foreground">
                    <strong>Why the distinction matters:</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• <strong>Gross sales</strong> are used to determine if economic nexus thresholds are crossed</li>
                    <li>• <strong>Taxable sales</strong> are used to calculate your actual tax liability</li>
                    <li>• <strong>Exempt sales</strong> include items not subject to tax (groceries, clothing, manufacturing inputs, etc.)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Liability Breakdown - only show if has nexus */}
      {data.has_transactions && (isAllYearsView ? aggregateNexusStatus === 'has_nexus' : yearData?.nexus_status === 'has_nexus') && (() => {
        // For "All Years" view metadata:
        // - Use earliest year for days_outstanding (interest accrues from first exposure sale)
        // - Use latest year for interest_rate, interest_method, penalty_rate (current rates)
        const latestYear = isAllYearsView && data.year_data.length > 0
          ? data.year_data[data.year_data.length - 1]
          : null;
        const earliestYearWithNexus = isAllYearsView && data.year_data.length > 0
          ? data.year_data.find(yr => yr.nexus_status === 'has_nexus')
          : null;

        return (
          <LiabilityBreakdown
            taxableSales={
              isAllYearsView
                ? data.exposure_sales || 0
                : yearData?.summary.exposure_sales || 0
            }
            taxRate={data.compliance_info.tax_rates.combined_rate}
            estimatedLiability={
              isAllYearsView
                ? data.estimated_liability || 0
                : yearData?.summary.estimated_liability || 0
            }
            baseTax={
              isAllYearsView
                ? data.base_tax || 0
                : yearData?.summary.base_tax
            }
            interest={
              isAllYearsView
                ? data.interest || 0
                : yearData?.summary.interest
            }
            penalties={
              isAllYearsView
                ? data.penalties || 0
                : yearData?.summary.penalties
            }
            penaltyBreakdown={
              isAllYearsView
                ? data.penalty_breakdown
                : yearData?.summary.penalty_breakdown
            }
            marketplaceSales={
              isAllYearsView
                ? data.marketplace_sales || 0
                : yearData?.summary.marketplace_sales || 0
            }
            nexusStatus={isAllYearsView ? aggregateNexusStatus : yearData?.nexus_status || 'none'}
            interestRate={isAllYearsView ? data.interest_rate : yearData?.summary.interest_rate}
            interestMethod={isAllYearsView ? data.interest_method : yearData?.summary.interest_method}
            daysOutstanding={isAllYearsView ? data.days_outstanding : yearData?.summary.days_outstanding}
            penaltyRate={isAllYearsView ? latestYear?.summary.penalty_rate : yearData?.summary.penalty_rate}
          />
        );
      })()}

      {/* Threshold Progress Bar - only show for individual years (not all years view) */}
      {!isAllYearsView && data.has_transactions && yearData && yearData.threshold_info.revenue_threshold && (
        <ThresholdProgressBar
          currentSales={yearData.summary.total_sales}
          threshold={yearData.threshold_info.revenue_threshold}
          status={getThresholdStatus()}
          firstNexusYear={yearData.first_nexus_year}
          currentYear={yearData.year}
        />
      )}

      {/* Monthly Trend Chart - only show for individual years */}
      {!isAllYearsView && data.has_transactions && yearData && yearData.monthly_sales.length > 0 && (
        <MonthlyTrendChart
          monthlyData={yearData.monthly_sales}
          threshold={yearData.threshold_info.revenue_threshold || 0}
          nexusCrossedMonth={nexusCrossedMonth}
        />
      )}

      {/* Transaction Table - show for both individual years and All Years */}
      {data.has_transactions && (() => {
        if (isAllYearsView) {
          // Aggregate all transactions from all years
          const allTransactions = data.year_data.flatMap(yr => yr.transactions || [])
          if (allTransactions.length === 0) return null

          return (
            <TransactionTable
              transactions={allTransactions}
              threshold={undefined} // No threshold for aggregate view
              initiallyExpanded={true}
              stateCode={data.state_code}
              year={undefined} // Show "All Years" in filename
            />
          )
        } else {
          // Individual year view
          if (!yearData || yearData.transactions.length === 0) return null

          return (
            <TransactionTable
              transactions={yearData.transactions}
              threshold={yearData.threshold_info.revenue_threshold || undefined}
              initiallyExpanded={true}
              stateCode={data.state_code}
              year={yearData.year}
            />
          )
        }
      })()}

      {/* Compliance Section - always show with correct variant */}
      <ComplianceSection
        nexusStatus={nexusStatus}
        stateName={data.state_name}
        nexusFirstEstablishedYear={
          isAllYearsView
            ? data.first_nexus_year ?? undefined
            : yearData?.first_nexus_year || yearData?.year
        }
        currentYear={
          isAllYearsView
            ? Math.max(...data.analysis_period.years_available)
            : currentYear
        }
        summary={{
          totalSales: isAllYearsView
            ? data.total_sales || 0
            : yearData?.summary.total_sales || 0,
          transactionCount: isAllYearsView
            ? data.transaction_count || 0
            : yearData?.summary.transaction_count || 0,
        }}
        thresholdInfo={{
          revenue_threshold: yearData?.threshold_info.revenue_threshold || data.compliance_info.threshold_info.revenue_threshold || null,
          transaction_threshold: yearData?.threshold_info.transaction_threshold || data.compliance_info.threshold_info.transaction_threshold || null,
          threshold_operator:
            (yearData?.threshold_info.threshold_operator as 'or' | 'and') || (data.compliance_info.threshold_info.threshold_operator as 'or' | 'and') || 'or',
          percentage_of_threshold: yearData?.threshold_info.percentage_of_threshold || 0,
          amount_until_nexus: yearData?.threshold_info.amount_until_nexus || data.compliance_info.threshold_info.revenue_threshold || 0,
          amount_over_nexus: yearData?.threshold_info.amount_over_nexus || null,
        }}
        complianceInfo={data.compliance_info}
        interestRate={isAllYearsView ? data.interest_rate : yearData?.summary.interest_rate}
        interestMethod={isAllYearsView ? data.interest_method : yearData?.summary.interest_method}
        penaltyBreakdown={isAllYearsView ? data.penalty_breakdown : yearData?.summary.penalty_breakdown}
      />
          </div>
        </ErrorBoundary>
      </AppLayout>
    </ProtectedRoute>
  );
}
