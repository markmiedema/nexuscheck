'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { getStateDetail, StateDetailResponse, YearData } from '@/lib/api';
import { StateDetailHeader } from '@/components/analysis/StateDetailHeader';
import { SummaryCards } from '@/components/analysis/SummaryCards';
import { LiabilityBreakdown } from '@/components/analysis/LiabilityBreakdown';
import { ThresholdProgressBar } from '@/components/analysis/ThresholdProgressBar';
import { MonthlyTrendChart } from '@/components/analysis/MonthlyTrendChart';
import TransactionTable from '@/components/analysis/TransactionTable';
import { ComplianceSection } from '@/components/analysis/ComplianceSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StateDetailPageProps {
  params: {
    id: string;
    stateCode: string;
  };
}

export default function StateDetailPage({ params }: StateDetailPageProps) {
  const [data, setData] = useState<StateDetailResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getStateDetail(params.id, params.stateCode);
        setData(response);

        // Default to "All Years" if multiple years, otherwise show the single year
        if (response.analysis_period.years_available.length > 1) {
          setSelectedYear('all');
        } else if (response.analysis_period.years_available.length === 1) {
          setSelectedYear(response.analysis_period.years_available[0]);
        }
      } catch (err) {
        console.error('Error fetching state detail:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load state details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.stateCode]);

  // Loading skeleton
  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="7xl"
          breadcrumbs={[
            { label: 'Analyses', href: '/analyses' },
            { label: 'Analysis Results', href: `/analysis/${params.id}/results` },
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
            { label: 'Analyses', href: '/analyses' },
            { label: 'Analysis Results', href: `/analysis/${params.id}/results` },
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
        <div className="space-y-6">
          {/* Header Section - only show if has transactions */}
      {data.has_transactions && (yearData || isAllYearsView) && (
        <StateDetailHeader
          stateName={data.state_name}
          stateCode={data.state_code}
          nexusStatus={nexusStatus === 'zero_sales' ? 'none' : nexusStatus}
          nexusType={
            isAllYearsView
              ? data.nexus_type
              : yearData?.nexus_type
          }
          totalSales={
            isAllYearsView
              ? data.total_sales || 0
              : yearData?.summary.total_sales || 0
          }
          transactionCount={
            isAllYearsView
              ? data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)
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
              ? data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)
              : yearData?.summary.transaction_count || 0
          }
          directSales={
            isAllYearsView
              ? data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
              : yearData?.summary.direct_sales || 0
          }
          marketplaceSales={
            isAllYearsView
              ? data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
              : yearData?.summary.marketplace_sales || 0
          }
        />
      )}

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
                ? data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0)
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
                ? data.year_data.reduce((sum, yr) => sum + (yr.summary.base_tax || 0), 0)
                : yearData?.summary.base_tax
            }
            interest={
              isAllYearsView
                ? data.year_data.reduce((sum, yr) => sum + (yr.summary.interest || 0), 0)
                : yearData?.summary.interest
            }
            penalties={
              isAllYearsView
                ? data.year_data.reduce((sum, yr) => sum + (yr.summary.penalties || 0), 0)
                : yearData?.summary.penalties
            }
            marketplaceSales={
              isAllYearsView
                ? data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
                : yearData?.summary.marketplace_sales || 0
            }
            nexusStatus={isAllYearsView ? aggregateNexusStatus : yearData?.nexus_status || 'none'}
            interestRate={isAllYearsView ? latestYear?.summary.interest_rate : yearData?.summary.interest_rate}
            interestMethod={isAllYearsView ? latestYear?.summary.interest_method : yearData?.summary.interest_method}
            daysOutstanding={isAllYearsView ? earliestYearWithNexus?.summary.days_outstanding : yearData?.summary.days_outstanding}
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
              initiallyExpanded={false}
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
              initiallyExpanded={false}
              stateCode={data.state_code}
              year={yearData.year}
            />
          )
        }
      })()}

      {/* All Years Summary - show year breakdown when in aggregate view */}
      {isAllYearsView && data.has_transactions && (
        <Card className="border-border bg-card shadow-md">
          <CardHeader>
            <CardTitle>Year-by-Year Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 bg-muted/50 rounded-lg border border-border p-6">
              {data.year_data.map((yearItem) => (
                <div
                  key={yearItem.year}
                  className="flex items-center justify-between p-4 bg-background dark:bg-card border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedYear(yearItem.year)}
                >
                  <div>
                    <div className="font-semibold">{yearItem.year}</div>
                    <div className="text-sm text-muted-foreground">
                      {yearItem.nexus_status === 'has_nexus' ? 'Has Nexus' : 'No Nexus'}
                      {yearItem.first_nexus_year && yearItem.first_nexus_year < yearItem.year && (
                        <span className="ml-2 text-xs">(Sticky from {yearItem.first_nexus_year})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(yearItem.summary.total_sales)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Liability: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(yearItem.summary.estimated_liability)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Section - always show with correct variant */}
      <ComplianceSection
        nexusStatus={nexusStatus}
        stateName={data.state_name}
        nexusFirstEstablishedYear={
          isAllYearsView
            ? data.first_nexus_year
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
            ? data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)
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
      />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
