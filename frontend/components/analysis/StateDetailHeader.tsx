'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StateDetailHeaderProps {
  stateName: string;
  stateCode: string;
  nexusStatus: 'has_nexus' | 'approaching' | 'none';
  nexusType?: 'physical' | 'economic' | 'both' | 'none';
  totalSales: number;
  transactionCount: number;
  yearsAvailable: number[];
  selectedYear: number | 'all';
  onYearChange: (year: number | 'all') => void;
  analysisName: string;
  analysisId: string;
  analysisPeriod: {
    start_date: string;
    end_date: string;
  };
}

export function StateDetailHeader({
  stateName,
  stateCode,
  nexusStatus,
  nexusType,
  totalSales,
  transactionCount,
  yearsAvailable,
  selectedYear,
  onYearChange,
  analysisName,
  analysisId,
  analysisPeriod,
}: StateDetailHeaderProps) {
  const router = useRouter();

  // Debug logging
  console.log('StateDetailHeader props:', { stateName, nexusStatus, nexusType });

  const getBadgeClassName = () => {
    // Use nexusType if available and state has nexus (exclude 'none')
    if (nexusStatus === 'has_nexus' && nexusType && nexusType !== 'none') {
      console.log('Using nexusType for badge color:', nexusType);
      switch (nexusType) {
        case 'both':
          return 'bg-info/20 text-info-foreground border border-info/30 hover:bg-info/30';
        case 'physical':
          return 'bg-info/10 text-info-foreground border border-info/20 hover:bg-info/20';
        case 'economic':
          return 'bg-destructive/10 text-destructive-foreground border border-destructive/20 hover:bg-destructive/20';
        default:
          // Shouldn't reach here, but just in case
          console.warn('Unexpected nexusType:', nexusType);
          break;
      }
    }

    // Fallback to status-based colors
    switch (nexusStatus) {
      case 'has_nexus':
        return 'bg-destructive/10 text-destructive-foreground border border-destructive/20 hover:bg-destructive/20';
      case 'approaching':
        return 'bg-warning/10 text-warning-foreground border border-warning/20 hover:bg-warning/20';
      case 'none':
        return 'bg-success/10 text-success-foreground border border-success/20 hover:bg-success/20';
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  const getNexusBadgeText = () => {
    // Use nexusType if available and state has nexus (exclude 'none')
    if (nexusStatus === 'has_nexus' && nexusType && nexusType !== 'none') {
      switch (nexusType) {
        case 'both':
          return 'Physical + Economic';
        case 'physical':
          return 'Physical Nexus';
        case 'economic':
          return 'Economic Nexus';
        default:
          // Shouldn't reach here, but just in case
          break;
      }
    }

    // Fallback to status-based text
    switch (nexusStatus) {
      case 'has_nexus':
        return 'Has Nexus';
      case 'approaching':
        return 'Approaching';
      case 'none':
        return 'No Nexus';
      default:
        return 'No Nexus';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 border-b pb-6">
      {/* State Header with Badge and Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{stateName}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeClassName()}`}>
            {getNexusBadgeText()}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/analysis/${analysisId}/results`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total Sales:</span>
          <span className="font-semibold">{formatCurrency(totalSales)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Transactions:</span>
          <span className="font-semibold">{transactionCount}</span>
        </div>
      </div>

      {/* Year Selector */}
      {yearsAvailable.length > 0 && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="year-select" className="text-sm font-medium">
              Year:
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) =>
                value === 'all' ? onYearChange('all') : onYearChange(parseInt(value))
              }
            >
              <SelectTrigger id="year-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearsAvailable.length > 1 && (
                  <SelectItem value="all">
                    All Years ({yearsAvailable[0]}-{yearsAvailable[yearsAvailable.length - 1]})
                  </SelectItem>
                )}
                {yearsAvailable.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Analysis Period: {formatDate(analysisPeriod.start_date)} -{' '}
            {formatDate(analysisPeriod.end_date)}
          </div>
        </div>
      )}
    </div>
  );
}
