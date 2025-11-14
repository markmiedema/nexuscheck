'use client';

import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardsProps {
  totalSales: number;
  transactionCount: number;
  directSales: number;
  marketplaceSales: number;
  taxableSales?: number;
  exemptSales?: number;
}

export function SummaryCards({
  totalSales,
  transactionCount,
  directSales,
  marketplaceSales,
  taxableSales,
  exemptSales,
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
      label: 'Gross Sales',
      value: formatCurrency(totalSales),
      description: 'Total revenue (for nexus)',
    },
    {
      label: 'Taxable Sales',
      value: formatCurrency(taxableSales ?? totalSales),
      description: 'Subject to tax (for liability)',
    },
    {
      label: 'Exempt Sales',
      value: formatCurrency(exemptSales ?? 0),
      description: 'Tax-exempt portion',
    },
    {
      label: 'Transactions',
      value: transactionCount.toLocaleString(),
      description: 'Number of transactions',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="rounded-lg border border-border bg-card shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-4xl font-bold text-foreground mt-3">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
