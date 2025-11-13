'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ThresholdProgressBarProps {
  currentSales: number;
  threshold: number;
  status: 'safe' | 'approaching' | 'exceeded';
  firstNexusYear?: number; // Year nexus was first established (for sticky nexus)
  currentYear?: number; // Current year being viewed
}

export function ThresholdProgressBar({
  currentSales,
  threshold,
  status,
  firstNexusYear,
  currentYear,
}: ThresholdProgressBarProps) {
  // Check if this is sticky nexus (nexus from prior year)
  const isStickyNexus =
    status === 'exceeded' &&
    firstNexusYear &&
    currentYear &&
    firstNexusYear < currentYear &&
    currentSales < threshold;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentage = Math.min((currentSales / threshold) * 100, 100);
  const remaining = Math.max(threshold - currentSales, 0);
  const overage = Math.max(currentSales - threshold, 0);

  const getStatusColor = () => {
    switch (status) {
      case 'safe':
        return 'bg-success';
      case 'approaching':
        return 'bg-warning';
      case 'exceeded':
        return 'bg-destructive';
      default:
        return 'bg-success';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'safe':
        return 'text-success-foreground';
      case 'approaching':
        return 'text-warning-foreground';
      case 'exceeded':
        return 'text-destructive-foreground';
      default:
        return 'text-success-foreground';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Threshold Status</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Threshold:</span>
            <span className="font-medium">{formatCurrency(threshold)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Sales:</span>
            <span className="font-medium">
              {formatCurrency(currentSales)}{' '}
              <span className={cn('text-xs', getStatusText())}>
                ({percentage.toFixed(1)}% of threshold)
              </span>
            </span>
          </div>

          {status === 'exceeded' ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount over threshold:</span>
              <span className={cn('font-medium', getStatusText())}>
                {formatCurrency(overage)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount until nexus:</span>
              <span className="font-medium">{formatCurrency(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress
            value={percentage}
            className="h-3"
          />
          <div
            className={cn(
              'absolute inset-0 h-3 rounded-full transition-all',
              getStatusColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>{formatCurrency(threshold)}</span>
        </div>
      </div>

      {/* Status Message */}
      {status === 'approaching' && (
        <div className="rounded-md bg-warning/10 border border-warning/20 p-3">
          <p className="text-sm text-warning-foreground">
            You are approaching the nexus threshold. With just{' '}
            <span className="font-semibold">{formatCurrency(remaining)}</span>{' '}
            more in sales, you will need to register and collect tax.
          </p>
        </div>
      )}

      {status === 'exceeded' && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive-foreground">
            {isStickyNexus ? (
              <>
                Nexus continues from <span className="font-semibold">{firstNexusYear}</span>.
                Registration required for full year {currentYear}.
              </>
            ) : (
              <>
                You have exceeded the nexus threshold by{' '}
                <span className="font-semibold">{formatCurrency(overage)}</span>.
                Registration and tax collection are required.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
