import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Download, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  AlertCircle,
  BarChart3,
  Loader2,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NexusResult {
  id: string;
  company_id: string;
  state: string;
  tax_type: string;
  trigger_date: string;
  trigger_reason: string;
  threshold_amount?: number;
  sales_amount?: number;
  transaction_count?: number;
  created_at: string;
}

type SortField = 'state' | 'tax_type' | 'trigger_date' | 'trigger_reason';
type SortDirection = 'asc' | 'desc';

// Mock data for demonstration
const mockNexusResults: NexusResult[] = [
  {
    id: '1',
    company_id: 'company-1',
    state: 'California',
    tax_type: 'Sales Tax',
    trigger_date: '2024-03-15',
    trigger_reason: 'Economic Nexus - Sales Threshold',
    threshold_amount: 500000,
    sales_amount: 525000,
    transaction_count: 1250,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    company_id: 'company-1',
    state: 'Texas',
    tax_type: 'Sales Tax',
    trigger_date: '2024-02-28',
    trigger_reason: 'Economic Nexus - Transaction Threshold',
    threshold_amount: 500000,
    sales_amount: 450000,
    transaction_count: 205,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '3',
    company_id: 'company-1',
    state: 'New York',
    tax_type: 'Sales Tax',
    trigger_date: '2024-04-10',
    trigger_reason: 'Physical Presence',
    sales_amount: 125000,
    transaction_count: 89,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '4',
    company_id: 'company-1',
    state: 'Florida',
    tax_type: 'Sales Tax',
    trigger_date: '2024-01-20',
    trigger_reason: 'Economic Nexus - Sales Threshold',
    threshold_amount: 100000,
    sales_amount: 115000,
    transaction_count: 156,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '5',
    company_id: 'company-1',
    state: 'Washington',
    tax_type: 'B&O Tax',
    trigger_date: '2024-05-01',
    trigger_reason: 'Economic Nexus - Sales Threshold',
    threshold_amount: 267000,
    sales_amount: 280000,
    transaction_count: 342,
    created_at: '2024-01-15T10:30:00Z',
  },
];

const getTaxTypeVariant = (taxType: string) => {
  switch (taxType.toLowerCase()) {
    case 'sales tax':
      return 'default';
    case 'b&o tax':
      return 'secondary';
    case 'income tax':
      return 'outline';
    default:
      return 'outline';
  }
};

const getTriggerReasonColor = (reason: string) => {
  if (reason.includes('Economic Nexus')) return 'text-blue-600';
  if (reason.includes('Physical Presence')) return 'text-green-600';
  if (reason.includes('Affiliate')) return 'text-purple-600';
  return 'text-gray-600';
};

export const NexusResults = () => {
  const { selectedCompany } = useApp();
  const [nexusResults, setNexusResults] = useState<NexusResult[]>([]);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [taxTypeFilter, setTaxTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('trigger_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  // Load nexus results for the selected company
  useEffect(() => {
    if (selectedCompany) {
      loadNexusResults();
    }
  }, [selectedCompany]);

  const loadNexusResults = async () => {
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      // Simulate API call - in real implementation, this would query nexus_results table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock data by company
      const companyResults = mockNexusResults.filter(
        result => result.company_id === selectedCompany.id
      );
      
      setNexusResults(companyResults);
    } catch (error) {
      console.error('Error loading nexus results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load nexus analysis results.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runNexusAnalysis = async () => {
    if (!selectedCompany) return;

    setIsRunningAnalysis(true);
    try {
      // Simulate calling the run_analysis Edge Function
      toast({
        title: 'Analysis Started',
        description: 'Nexus analysis is now running. This may take a few minutes.',
      });

      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh results after analysis
      await loadNexusResults();

      toast({
        title: 'Analysis Complete',
        description: 'Nexus analysis has been completed successfully.',
      });
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to run nexus analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // Get unique values for filters
  const uniqueStates = useMemo(() => {
    const states = [...new Set(nexusResults.map(result => result.state))];
    return states.sort();
  }, [nexusResults]);

  const uniqueTaxTypes = useMemo(() => {
    const taxTypes = [...new Set(nexusResults.map(result => result.tax_type))];
    return taxTypes.sort();
  }, [nexusResults]);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = nexusResults.filter(result => {
      const matchesSearch = searchTerm === '' || 
        result.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.tax_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.trigger_reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = stateFilter === 'all' || result.state === stateFilter;
      const matchesTaxType = taxTypeFilter === 'all' || result.tax_type === taxTypeFilter;

      return matchesSearch && matchesState && matchesTaxType;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === 'trigger_date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [nexusResults, searchTerm, stateFilter, taxTypeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  const exportToCSV = () => {
    if (filteredAndSortedResults.length === 0) {
      toast({
        title: 'No Data',
        description: 'No results to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['State', 'Tax Type', 'Trigger Date', 'Trigger Reason', 'Sales Amount', 'Transaction Count'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedResults.map(result => [
        `"${result.state}"`,
        `"${result.tax_type}"`,
        result.trigger_date,
        `"${result.trigger_reason}"`,
        result.sales_amount || '',
        result.transaction_count || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nexus_results_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      description: `Exported ${filteredAndSortedResults.length} results to CSV.`,
    });
  };

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nexus Analysis Results</h1>
          <p className="text-gray-600 mt-2">View and analyze tax nexus obligations</p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a company first to view nexus analysis results.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nexus Analysis Results</h1>
          <p className="text-gray-600 mt-2">
            Tax nexus obligations for <span className="font-medium text-blue-600">{selectedCompany.name}</span>
          </p>
        </div>

        <Button 
          onClick={runNexusAnalysis}
          disabled={isRunningAnalysis}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunningAnalysis ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Analysis...
            </div>
          ) : (
            <div className="flex items-center">
              <Play className="mr-2 h-4 w-4" />
              Run Nexus Analysis
            </div>
          )}
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* State Filter */}
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tax Type Filter */}
            <Select value={taxTypeFilter} onValueChange={setTaxTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Tax Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tax Types</SelectItem>
                {uniqueTaxTypes.map(taxType => (
                  <SelectItem key={taxType} value={taxType}>{taxType}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={filteredAndSortedResults.length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Nexus Obligations
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{filteredAndSortedResults.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredAndSortedResults.length === nexusResults.length ? 'total' : `of ${nexusResults.length} total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              States Affected
            </CardTitle>
            <MapPin className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(filteredAndSortedResults.map(r => r.state)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">unique states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Economic Nexus
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {filteredAndSortedResults.filter(r => r.trigger_reason.includes('Economic Nexus')).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">threshold triggers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Physical Presence
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {filteredAndSortedResults.filter(r => r.trigger_reason.includes('Physical Presence')).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">presence triggers</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nexus Analysis Results</CardTitle>
          <CardDescription>
            Showing {filteredAndSortedResults.length} of {nexusResults.length} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading results...</span>
              </div>
            </div>
          ) : filteredAndSortedResults.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                {nexusResults.length === 0 
                  ? 'Run a nexus analysis to see results here.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {nexusResults.length === 0 && (
                <Button onClick={runNexusAnalysis} disabled={isRunningAnalysis}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Your First Analysis
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('state')}
                    >
                      <div className="flex items-center">
                        State
                        {getSortIcon('state')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('tax_type')}
                    >
                      <div className="flex items-center">
                        Tax Type
                        {getSortIcon('tax_type')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('trigger_date')}
                    >
                      <div className="flex items-center">
                        Trigger Date
                        {getSortIcon('trigger_date')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('trigger_reason')}
                    >
                      <div className="flex items-center">
                        Trigger Reason
                        {getSortIcon('trigger_reason')}
                      </div>
                    </TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedResults.map((result) => (
                    <TableRow key={result.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          {result.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTaxTypeVariant(result.tax_type)}>
                          {result.tax_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          {new Date(result.trigger_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getTriggerReasonColor(result.trigger_reason)}>
                          {result.trigger_reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {result.sales_amount && (
                            <div>Sales: ${result.sales_amount.toLocaleString()}</div>
                          )}
                          {result.transaction_count && (
                            <div>Transactions: {result.transaction_count}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};