'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComplianceSectionProps {
  nexusStatus: 'has_nexus' | 'approaching' | 'none' | 'zero_sales';
  stateName: string;
  nexusFirstEstablishedYear?: number;
  currentYear: number;
  summary: {
    totalSales: number;
    transactionCount: number;
  };
  thresholdInfo: {
    revenue_threshold: number | null;
    transaction_threshold: number | null;
    threshold_operator: 'or' | 'and';
    percentage_of_threshold: number;
    amount_until_nexus: number | null;
    amount_over_nexus: number | null;
  };
  complianceInfo: {
    tax_rates: {
      state_rate: number;
      avg_local_rate: number | null;
      combined_rate: number;
    };
    threshold_info: {
      revenue_threshold: number | null;
      transaction_threshold: number | null;
      threshold_operator: 'or' | 'and';
    };
    registration_info: {
      registration_fee: number;
      filing_frequencies: string[];
      registration_url: string | null;
      dor_website: string | null;
    };
  };
}

export function ComplianceSection({
  nexusStatus,
  stateName,
  nexusFirstEstablishedYear,
  currentYear,
  summary,
  thresholdInfo,
  complianceInfo,
}: ComplianceSectionProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatThreshold = () => {
    const { revenue_threshold, transaction_threshold, threshold_operator } =
      complianceInfo.threshold_info;

    if (revenue_threshold && transaction_threshold) {
      const operator = threshold_operator === 'or' ? 'OR' : 'AND';
      return `${formatCurrency(revenue_threshold)} revenue ${operator} ${transaction_threshold.toLocaleString()} transactions`;
    } else if (revenue_threshold) {
      return `${formatCurrency(revenue_threshold)} revenue`;
    } else if (transaction_threshold) {
      return `${transaction_threshold.toLocaleString()} transactions`;
    }
    return 'N/A';
  };

  // Variant 1: Has Nexus (Red Status)
  if (nexusStatus === 'has_nexus') {
    return (
      <Card className="border-border bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Actions Checklist */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Required Actions</h3>
            <div className="space-y-3 bg-muted/50 rounded-lg border border-border p-6">
              <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  disabled
                  aria-label="Register for sales tax permit"
                />
                <div className="flex-1">
                  <p className="font-medium">Register for {stateName} sales tax permit</p>
                  <p className="text-sm text-muted-foreground">
                    Register by: 30 days from nexus date
                  </p>
                  {complianceInfo.registration_info.registration_url && (
                    <a
                      href={complianceInfo.registration_info.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground hover:underline"
                    >
                      → Register Online - {stateName} Portal
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  disabled
                  aria-label="Collect sales tax"
                />
                <div className="flex-1">
                  <p className="font-medium">Collect sales tax on future {stateName} sales</p>
                  <p className="text-sm text-muted-foreground">
                    Effective: Date nexus was established
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  disabled
                  aria-label="File sales tax returns"
                />
                <div className="flex-1">
                  <p className="font-medium">File sales tax returns</p>
                  <p className="text-sm text-muted-foreground">
                    Filing frequency: Based on your volume
                  </p>
                  <p className="text-sm text-muted-foreground">
                    First filing deadline: TBD after registration
                  </p>
                  {complianceInfo.registration_info.dor_website && (
                    <a
                      href={complianceInfo.registration_info.dor_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground hover:underline"
                    >
                      → View Filing Requirements
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* State Tax Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">State Tax Information</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              <div>
                <span className="text-muted-foreground">Economic Nexus Threshold:</span>
                <span className="ml-2 font-medium">{formatThreshold()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">State Tax Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.state_rate)}
                </span>
              </div>
              {complianceInfo.tax_rates.avg_local_rate !== null && (
                <div>
                  <span className="text-muted-foreground">Average Local Rate:</span>
                  <span className="ml-2 font-medium">
                    {formatPercentage(complianceInfo.tax_rates.avg_local_rate)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Combined Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.combined_rate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Registration Fee:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(complianceInfo.registration_info.registration_fee)}
                </span>
              </div>
              {complianceInfo.registration_info.filing_frequencies.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Filing Frequencies:</span>
                  <span className="ml-2 font-medium">
                    {complianceInfo.registration_info.filing_frequencies.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Helpful Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Helpful Resources</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              {/* Official Department Links */}
              <div>
                <p className="font-medium text-foreground mb-1">Official Department</p>
                <a
                  href={complianceInfo.registration_info.dor_website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} Department of Revenue Website
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → Phone: (555) 123-4567 [Placeholder]
                </p>
                <p className="text-muted-foreground ml-2">
                  → Email: taxhelp@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Registration */}
              <div>
                <p className="font-medium text-foreground mb-1">Registration</p>
                <a
                  href={complianceInfo.registration_info.registration_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Online Registration Portal
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Registration Instructions & Requirements
                </a>
              </div>

              {/* VDA Information */}
              <div>
                <p className="font-medium text-foreground mb-1">Voluntary Disclosure Agreement</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} VDA Program Overview
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → VDA Application Process
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → VDA Contact: vda@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Reference Materials */}
              <div>
                <p className="font-medium text-foreground mb-1">Reference Materials</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Economic Nexus Statute & Regulations
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Tax Rate Lookup Tool
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Filing Requirements & Deadlines
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Supporting Case Law & Precedents
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant 2: Approaching Nexus (Yellow Status)
  if (nexusStatus === 'approaching') {
    return (
      <Card className="border-border bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning-foreground" />
            Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Banner */}
          <div className="rounded-md bg-warning/10 border border-warning/20 p-4">
            <h3 className="font-semibold text-warning-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Approaching Nexus Threshold
            </h3>
            <div className="space-y-1 text-sm text-warning-foreground">
              <p>
                <strong>Your sales:</strong> {formatCurrency(summary.totalSales)} (
                {thresholdInfo.percentage_of_threshold.toFixed(0)}% of threshold)
              </p>
              <p>
                <strong>Amount until nexus:</strong>{' '}
                {formatCurrency(thresholdInfo.amount_until_nexus)}
              </p>
              <p className="mt-2">
                You're close to triggering economic nexus in {stateName}. With just{' '}
                <strong>{formatCurrency(thresholdInfo.amount_until_nexus)}</strong> more in
                sales, you'll need to register and collect tax.
              </p>
            </div>
          </div>

          {/* Prepare for Nexus */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Prepare for Nexus</h3>
            <div className="bg-muted/50 rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-3">
                When you cross the threshold, you'll need to:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Register for {stateName} sales tax permit within 30 days</li>
                <li>Begin collecting sales tax on {stateName} sales</li>
                <li>File returns based on your sales volume</li>
              </ol>
            </div>
          </div>

          {/* State Tax Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">State Tax Information</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              <div>
                <span className="text-muted-foreground">Economic Nexus Threshold:</span>
                <span className="ml-2 font-medium">{formatThreshold()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">State Tax Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.state_rate)}
                </span>
              </div>
              {complianceInfo.tax_rates.avg_local_rate !== null && (
                <div>
                  <span className="text-muted-foreground">Average Local Rate:</span>
                  <span className="ml-2 font-medium">
                    {formatPercentage(complianceInfo.tax_rates.avg_local_rate)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Combined Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.combined_rate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Registration Fee:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(complianceInfo.registration_info.registration_fee)}
                </span>
              </div>
            </div>
          </div>

          {/* Helpful Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Helpful Resources</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              {/* Official Department Links */}
              <div>
                <p className="font-medium text-foreground mb-1">Official Department</p>
                <a
                  href={complianceInfo.registration_info.dor_website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} Department of Revenue Website
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → Phone: (555) 123-4567 [Placeholder]
                </p>
                <p className="text-muted-foreground ml-2">
                  → Email: taxhelp@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Registration */}
              <div>
                <p className="font-medium text-foreground mb-1">Registration</p>
                <a
                  href={complianceInfo.registration_info.registration_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Online Registration Portal
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Registration Instructions & Requirements
                </a>
              </div>

              {/* VDA Information */}
              <div>
                <p className="font-medium text-foreground mb-1">Voluntary Disclosure Agreement</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} VDA Program Overview
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → VDA Application Process
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → VDA Contact: vda@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Reference Materials */}
              <div>
                <p className="font-medium text-foreground mb-1">Reference Materials</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Economic Nexus Statute & Regulations
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Tax Rate Lookup Tool
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Filing Requirements & Deadlines
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Supporting Case Law & Precedents
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant 3: No Nexus (Green Status - Below 90%)
  if (nexusStatus === 'none') {
    return (
      <Card className="border-border bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success-foreground" />
            Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Banner */}
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
                <strong>Your sales:</strong> {formatCurrency(summary.totalSales)} (
                {thresholdInfo.percentage_of_threshold.toFixed(0)}% of threshold)
              </p>
              <p>
                <strong>Amount until nexus:</strong>{' '}
                {formatCurrency(thresholdInfo.amount_until_nexus)}
              </p>
              <p className="mt-2">
                You have not established economic nexus in {stateName}. No compliance
                obligations at this time.
              </p>
            </div>
          </div>

          {/* State Tax Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">State Tax Information</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              <div>
                <span className="text-muted-foreground">Economic Nexus Threshold:</span>
                <span className="ml-2 font-medium">{formatThreshold()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">State Tax Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.state_rate)}
                </span>
              </div>
              {complianceInfo.tax_rates.avg_local_rate !== null && (
                <div>
                  <span className="text-muted-foreground">Average Local Rate:</span>
                  <span className="ml-2 font-medium">
                    {formatPercentage(complianceInfo.tax_rates.avg_local_rate)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Combined Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.combined_rate)}
                </span>
              </div>
              <div className="mt-4 p-3 bg-card rounded border border-border">
                <p className="text-foreground">
                  <strong>Note:</strong> If you reach the threshold, you'll need to register
                  within 30 days and begin collecting tax.
                </p>
              </div>
            </div>
          </div>

          {/* Helpful Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Helpful Resources</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              {/* Official Department Links */}
              <div>
                <p className="font-medium text-foreground mb-1">Official Department</p>
                <a
                  href={complianceInfo.registration_info.dor_website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} Department of Revenue Website
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → Phone: (555) 123-4567 [Placeholder]
                </p>
                <p className="text-muted-foreground ml-2">
                  → Email: taxhelp@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Reference Materials */}
              <div>
                <p className="font-medium text-foreground mb-1">Reference Materials</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Economic Nexus Statute & Regulations
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Tax Rate Lookup Tool
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Filing Requirements & Deadlines
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant 4: Zero Sales (Informational)
  if (nexusStatus === 'zero_sales') {
    return (
      <Card className="border-border bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Compliance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
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

          {/* State Tax Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">State Tax Information</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              <div>
                <span className="text-muted-foreground">Economic Nexus Threshold:</span>
                <span className="ml-2 font-medium">{formatThreshold()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">State Tax Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.state_rate)}
                </span>
              </div>
              {complianceInfo.tax_rates.avg_local_rate !== null && (
                <div>
                  <span className="text-muted-foreground">Average Local Rate:</span>
                  <span className="ml-2 font-medium">
                    {formatPercentage(complianceInfo.tax_rates.avg_local_rate)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Combined Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(complianceInfo.tax_rates.combined_rate)}
                </span>
              </div>
            </div>
          </div>

          {/* Helpful Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Helpful Resources</h3>
            <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
              {/* Official Department Links */}
              <div>
                <p className="font-medium text-foreground mb-1">Official Department</p>
                <a
                  href={complianceInfo.registration_info.dor_website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:underline ml-2"
                >
                  → {stateName} Department of Revenue Website
                </a>
                <p className="text-muted-foreground ml-2 mt-1">
                  → Phone: (555) 123-4567 [Placeholder]
                </p>
                <p className="text-muted-foreground ml-2">
                  → Email: taxhelp@{stateName.toLowerCase().replace(/\s+/g, '')}.gov [Placeholder]
                </p>
              </div>

              {/* Reference Materials */}
              <div>
                <p className="font-medium text-foreground mb-1">Reference Materials</p>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Economic Nexus Statute & Regulations
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Tax Rate Lookup Tool
                </a>
                <a
                  href="#"
                  className="block text-foreground hover:underline ml-2"
                >
                  → Filing Requirements & Deadlines
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
