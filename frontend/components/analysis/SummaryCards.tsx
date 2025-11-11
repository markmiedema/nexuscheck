'use client';

import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardsProps {
  totalSales: number;
  transactionCount: number;
  directSales: number;
  marketplaceSales: number;
}

export function SummaryCards({
  totalSales,
  transactionCount,
  directSales,
  marketplaceSales,
}: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      description: 'All sales in this state',
    },
    {
      label: 'Transactions',
      value: transactionCount.toLocaleString(),
      description: 'Number of transactions',
    },
    {
      label: 'Direct Sales',
      value: formatCurrency(directSales),
      description: 'Sales channel: direct',
    },
    {
      label: 'Marketplace Sales',
      value: formatCurrency(marketplaceSales),
      description: 'Sales channel: marketplace',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
