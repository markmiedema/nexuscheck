'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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

  const getNexusBadgeVariant = () => {
    switch (nexusStatus) {
      case 'has_nexus':
        return 'destructive';
      case 'approaching':
        return 'default';
      case 'none':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getNexusBadgeText = () => {
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
          <Badge variant={getNexusBadgeVariant()} className="text-sm px-3 py-1">
            {getNexusBadgeText()}
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/analysis/${analysisId}/states`)}
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
