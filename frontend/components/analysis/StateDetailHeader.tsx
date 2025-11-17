'use client';
import { memo } from 'react';
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

export const StateDetailHeader = memo(function StateDetailHeader({
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
  const getBadgeStyles = () => {
    let baseColor = '';

    // Use nexusType if available and state has nexus (exclude 'none')
    if (nexusStatus === 'has_nexus' && nexusType && nexusType !== 'none') {
      switch (nexusType) {
        case 'both':
          baseColor = '289 46% 45%'; // Purple
          break;
        case 'physical':
          baseColor = '217 32.6% 45%'; // Blue
          break;
        case 'economic':
          baseColor = '0 60% 45%'; // Red
          break;
      }
    } else {
      // Fallback to status-based colors
      switch (nexusStatus) {
        case 'has_nexus':
          baseColor = '0 60% 45%'; // Red (economic)
          break;
        case 'approaching':
          baseColor = '38 92% 50%'; // Amber
          break;
        case 'none':
          baseColor = '142 71% 40%'; // Green
          break;
      }
    }

    // Return light and dark mode CSS variables
    return {
      '--badge-bg-light': `hsl(${baseColor} / 0.1)`,
      '--badge-color-light': baseColor.startsWith('289')
        ? 'hsl(289 46% 35%)'
        : baseColor.startsWith('217')
        ? 'hsl(217 32.6% 35%)'
        : baseColor.startsWith('0')
        ? 'hsl(0 60% 40%)'
        : baseColor.startsWith('38')
        ? 'hsl(38 92% 40%)'
        : 'hsl(142 71% 30%)',
      '--badge-border-light': `hsl(${baseColor} / 0.2)`,
      '--badge-bg-dark': `hsl(${baseColor} / 0.15)`,
      '--badge-color-dark': baseColor.startsWith('289')
        ? 'hsl(289 46% 70%)'
        : baseColor.startsWith('217')
        ? 'hsl(217 32.6% 70%)'
        : baseColor.startsWith('0')
        ? 'hsl(0 60% 70%)'
        : baseColor.startsWith('38')
        ? 'hsl(38 92% 65%)'
        : 'hsl(142 71% 65%)',
      '--badge-border-dark': `hsl(${baseColor} / 0.3)`,
      backgroundColor: 'var(--badge-bg-light)',
      color: 'var(--badge-color-light)',
      borderColor: 'var(--badge-border-light)',
    } as React.CSSProperties & Record<string, string>;
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
      {/* State Header with Badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{stateName}</h1>
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
          style={getBadgeStyles()}
        >
          {getNexusBadgeText()}
        </span>
      </div>

      {/* Year Selector */}
      {yearsAvailable.length > 0 && (
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
      )}
    </div>
  );
});
