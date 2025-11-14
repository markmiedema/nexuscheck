'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  sales: number;
  transaction_count: number;
}

interface MonthlyTrendChartProps {
  monthlyData: MonthlyData[];
  threshold: number;
  nexusCrossedMonth?: string;
}

export function MonthlyTrendChart({
  monthlyData,
  threshold,
  nexusCrossedMonth,
}: MonthlyTrendChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Transform data for chart
  const chartData = monthlyData.map((item) => ({
    month: formatMonth(item.month),
    sales: item.sales,
    transactionCount: item.transaction_count,
    fullMonth: item.month,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold mb-1">{payload[0].payload.month}</p>
          <p className="text-sm text-muted-foreground">
            Sales: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: {payload[0].payload.transactionCount}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot for nexus crossed month
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (nexusCrossedMonth && payload.fullMonth === nexusCrossedMonth) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" />;
  };

  return (
    <Card className="border-border bg-card shadow-md">
      <CardHeader>
        <CardTitle>Monthly Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg border border-border p-6">
          <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <ReferenceLine
              y={threshold}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{
                value: `Threshold: ${formatCurrency(threshold)}`,
                position: 'insideTopRight',
                fill: '#6b7280',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Monthly Sales"
              dot={<CustomDot />}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>

        {nexusCrossedMonth && (
          <div className="mt-4 rounded-md bg-warning/10 border border-warning/20 p-3">
            <p className="text-sm text-warning-foreground">
              <span className="font-semibold">Nexus Threshold Crossed:</span>{' '}
              The threshold was exceeded in{' '}
              <span className="font-semibold">
                {formatMonth(nexusCrossedMonth)}
              </span>
              . This month is marked with a red dot on the chart.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
