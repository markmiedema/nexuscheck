import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Mock results data for demonstration
const mockResults = {
  summary: {
    totalSales: 1234567.89,
    totalTransactions: 5432,
    averageTransaction: 227.18,
    taxableAmount: 987654.32,
  },
  trends: [
    { month: 'Jan 2024', sales: 98765, transactions: 432 },
    { month: 'Feb 2024', sales: 87654, transactions: 387 },
    { month: 'Mar 2024', sales: 109876, transactions: 489 },
    { month: 'Apr 2024', sales: 123456, transactions: 567 },
  ],
  topProducts: [
    { product: 'Premium Widget', sales: 45678, percentage: 3.7 },
    { product: 'Standard Widget', sales: 34567, percentage: 2.8 },
    { product: 'Economy Widget', sales: 23456, percentage: 1.9 },
  ],
};

export const AnalysisResults = () => {
  const { selectedCompany, analyses, refreshAnalyses } = useApp();

  if (!selectedCompany) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a company first to view analysis results.
        </AlertDescription>
      </Alert>
    );
  }

  const companyAnalyses = analyses.filter(a => a.company_id === selectedCompany.id);
  const completedAnalyses = companyAnalyses.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
          <p className="text-muted-foreground">
            View analysis results for {selectedCompany.name}.
          </p>
        </div>
        <Button onClick={refreshAnalyses} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {companyAnalyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-gray-500 text-center">
              Upload some sales data to see analysis results here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Analysis List</TabsTrigger>
            {completedAnalyses.length > 0 && (
              <TabsTrigger value="results">Latest Results</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>
                  Track the status of your uploaded files and analyses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-gray-500" />
                            {analysis.filename}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(analysis.status)}>
                            <div className="flex items-center">
                              {getStatusIcon(analysis.status)}
                              <span className="ml-1 capitalize">{analysis.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {analysis.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              View Results
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {completedAnalyses.length > 0 && (
            <TabsContent value="results" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${mockResults.summary.totalSales.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mockResults.summary.totalTransactions.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${mockResults.summary.averageTransaction.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxable Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${mockResults.summary.taxableAmount.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Sales</TableHead>
                          <TableHead>Transactions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockResults.trends.map((trend) => (
                          <TableRow key={trend.month}>
                            <TableCell>{trend.month}</TableCell>
                            <TableCell>${trend.sales.toLocaleString()}</TableCell>
                            <TableCell>{trend.transactions}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Sales</TableHead>
                          <TableHead>% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockResults.topProducts.map((product) => (
                          <TableRow key={product.product}>
                            <TableCell>{product.product}</TableCell>
                            <TableCell>${product.sales.toLocaleString()}</TableCell>
                            <TableCell>{product.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};