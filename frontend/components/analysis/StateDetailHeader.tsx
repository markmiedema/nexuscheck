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
          return 'bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50';
        case 'physical':
          return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40';
        case 'economic':
          return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30';
        default:
          // Shouldn't reach here, but just in case
          console.warn('Unexpected nexusType:', nexusType);
          break;
      }
    }

    // Fallback to status-based colors
    switch (nexusStatus) {
      case 'has_nexus':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30';
      case 'approaching':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
      case 'none':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/30';
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
