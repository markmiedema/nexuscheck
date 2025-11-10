'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { handleApiError, showSuccess, showError } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react'

interface ColumnInfo {
  name: string
  sample_values: string[]
  data_type: string
}

interface MappingConfig {
  transaction_date: string
  customer_state: string
  revenue_amount: string
  sales_channel: string
  product_type?: string
  customer_type?: string
}

interface ValueMapping {
  [key: string]: string
}

interface DataSummary {
  total_rows: number
  date_range: {
    start: string
    end: string
  }
  unique_states: number
  estimated_time: string
}

interface ValidationError {
  row: number
  column: string
  value: string
  message: string
  severity: string
}

export default function MappingPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<MappingConfig>({
    transaction_date: '',
    customer_state: '',
    revenue_amount: '',
    sales_channel: '',
  })

  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [valueMappings, setValueMappings] = useState<ValueMapping>({})

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validationStatus, setValidationStatus] = useState<'idle' | 'passed' | 'failed'>('idle')
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    fetchColumnInfo()
  }, [analysisId])

  const fetchColumnInfo = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/columns`)
      const data = response.data

      setColumns(data.columns)
      setDataSummary(data.summary)

      // Auto-detect mappings
      const autoMappings: MappingConfig = {
        transaction_date: findColumn(data.columns, ['transaction_date', 'date', 'order_date', 'sale_date']),
        customer_state: findColumn(data.columns, ['customer_state', 'state', 'buyer_state', 'ship_to_state']),
        revenue_amount: findColumn(data.columns, ['revenue_amount', 'amount', 'sales_amount', 'total', 'price']),
        sales_channel: findColumn(data.columns, ['sales_channel', 'channel', 'source', 'marketplace']),
      }

      setMappings(autoMappings)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to load column information' })
    } finally {
      setLoading(false)
    }
  }

  const findColumn = (cols: ColumnInfo[], candidates: string[]): string => {
    for (const candidate of candidates) {
      const match = cols.find(c => c.name.toLowerCase() === candidate.toLowerCase())
      if (match) return match.name
    }
    return ''
  }

  const handleMappingChange = (field: keyof MappingConfig, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }))
  }

  const getColumnSamples = (columnName: string): string[] => {
    const column = columns.find(c => c.name === columnName)
    return column?.sample_values || []
  }

  const validateMappings = (): boolean => {
    if (!mappings.transaction_date) {
      showError('Transaction Date is required')
      return false
    }
    if (!mappings.customer_state) {
      showError('Customer State is required')
      return false
    }
    if (!mappings.revenue_amount) {
      showError('Revenue Amount is required')
      return false
    }
    if (!mappings.sales_channel) {
      showError('Sales Channel is required')
      return false
    }
    return true
  }

  const handleValidateAndProcess = async () => {
    if (!validateMappings()) return

    try {
      setValidating(true)
      setValidationStatus('idle')
      setValidationErrors([])

      // Step 1: Validate data
      const validateResponse = await apiClient.post(`/api/v1/analyses/${analysisId}/validate`, {
        column_mappings: {
          transaction_date: {
            source_column: mappings.transaction_date,
            date_format: dateFormat,
          },
          customer_state: {
            source_column: mappings.customer_state,
          },
          revenue_amount: {
            source_column: mappings.revenue_amount,
          },
          sales_channel: {
            source_column: mappings.sales_channel,
            value_mappings: valueMappings,
          },
        },
      })

      const result = validateResponse.data

      if (result.status === 'passed') {
        setValidationStatus('passed')

        // Step 2: Immediately run nexus calculation
        try {
          await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)
        } catch (calcError: any) {
          console.error('Calculation failed:', calcError)
          // Continue to results page anyway - user can retry from there
        }

        // Navigate to results page
        showSuccess('Column mapping saved successfully')
        setTimeout(() => {
          router.push(`/analysis/${analysisId}/results`)
        }, 1000)
      } else {
        setValidationStatus('failed')
        setValidationErrors(result.errors || [])
        setShowErrors(true)
      }
    } catch (error) {
      handleApiError(error, { userMessage: 'Validation failed' })
    } finally {
      setValidating(false)
    }
  }

  const handleBack = () => {
    router.push(`/analysis/${analysisId}/upload`)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout
          maxWidth="4xl"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'New Analysis', href: '/analysis/new' },
            { label: 'Upload Data', href: `/analysis/${analysisId}/upload` },
            { label: 'Map Columns' },
          ]}
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading column information...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="4xl"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'New Analysis', href: '/analysis/new' },
          { label: 'Upload Data', href: `/analysis/${analysisId}/upload` },
          { label: 'Map Columns' },
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Map Your Data Columns
            </h2>
            <p className="text-gray-600 mb-8">
              Match your CSV columns to the required fields. We've auto-detected most mappings - please verify.
            </p>

            {/* Required Fields - Single Clean Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Required Column Mappings</CardTitle>
                <CardDescription>
                  We've auto-detected these mappings from your CSV. Verify they look correct.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Transaction Date Mapping */}
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
                  {/* Your Column */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Column
                    </Label>
                    <Select
                      value={mappings.transaction_date}
                      onValueChange={(val) => handleMappingChange('transaction_date', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mappings.transaction_date && (
                      <div className="flex gap-1 flex-wrap">
                        {getColumnSamples(mappings.transaction_date).slice(0, 3).map((val, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pt-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Maps To */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Maps To
                    </Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm font-medium">Transaction Date</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="w-auto text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center pt-8">
                    {mappings.transaction_date ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Customer State Mapping */}
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Column
                    </Label>
                    <Select
                      value={mappings.customer_state}
                      onValueChange={(val) => handleMappingChange('customer_state', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mappings.customer_state && (
                      <div className="flex gap-1 flex-wrap">
                        {getColumnSamples(mappings.customer_state).slice(0, 5).map((val, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center pt-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Maps To
                    </Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm font-medium">Customer State</span>
                    </div>
                  </div>

                  <div className="flex items-center pt-8">
                    {mappings.customer_state ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Revenue Amount Mapping */}
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Column
                    </Label>
                    <Select
                      value={mappings.revenue_amount}
                      onValueChange={(val) => handleMappingChange('revenue_amount', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mappings.revenue_amount && (
                      <div className="flex gap-1 flex-wrap">
                        {getColumnSamples(mappings.revenue_amount).slice(0, 3).map((val, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            ${val}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center pt-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Maps To
                    </Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm font-medium">Revenue Amount</span>
                    </div>
                  </div>

                  <div className="flex items-center pt-8">
                    {mappings.revenue_amount ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sales Channel Mapping */}
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Column
                    </Label>
                    <Select
                      value={mappings.sales_channel}
                      onValueChange={(val) => handleMappingChange('sales_channel', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mappings.sales_channel && (
                      <div className="flex gap-1 flex-wrap">
                        {getColumnSamples(mappings.sales_channel).slice(0, 4).map((val, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center pt-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Maps To
                    </Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm font-medium">Sales Channel</span>
                    </div>
                  </div>

                  <div className="flex items-center pt-8">
                    {mappings.sales_channel ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Optional Fields - Lighter Treatment */}
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>Optional Mappings</span>
                  <Badge variant="secondary" className="text-xs font-normal">Optional</Badge>
                </CardTitle>
                <CardDescription>
                  These fields provide additional insights but aren't required for nexus calculation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Product Type */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Your Column</Label>
                    <Select
                      value={mappings.product_type || ''}
                      onValueChange={(val) => handleMappingChange('product_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not mapped" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not mapped</SelectItem>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Maps To</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm">Product Type</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Customer Type */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Your Column</Label>
                    <Select
                      value={mappings.customer_type || ''}
                      onValueChange={(val) => handleMappingChange('customer_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not mapped" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not mapped</SelectItem>
                        {columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Maps To</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                      <span className="text-sm">Customer Type</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Data Summary - Clean Stats Grid */}
            {dataSummary && (
              <Card className="mb-6 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border-indigo-100 dark:from-indigo-950/20 dark:to-blue-950/20 dark:border-indigo-900">
                <CardHeader>
                  <CardTitle className="text-base">Data Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Transactions
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {dataSummary.total_rows.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        States Found
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {dataSummary.unique_states}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Date Range
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {dataSummary.date_range.start}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {dataSummary.date_range.end}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Est. Time
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {dataSummary.estimated_time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Status */}
            {validationStatus === 'passed' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium flex items-center">
                  <span className="mr-2">✓</span> Validation passed! Redirecting to results...
                </p>
              </div>
            )}

            {/* Validation Errors */}
            {validationStatus === 'failed' && showErrors && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-900 font-semibold mb-2">⚠️ Data Validation Failed</h3>
                <p className="text-red-800 text-sm mb-4">
                  Found {validationErrors.length} issues. Please review and fix:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {validationErrors.slice(0, 10).map((error, idx) => (
                    <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded border border-red-200">
                      <span className="font-medium">Row {error.row}:</span> {error.column} = "{error.value}" - {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <p className="text-sm text-red-600 italic">
                      ... and {validationErrors.length - 10} more issues
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-4">
                  <Button
                    onClick={() => setShowErrors(false)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                  >
                    Hide Errors
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                onClick={handleBack}
                variant="outline"
              >
                ← Back to Upload
              </Button>
              <Button
                onClick={handleValidateAndProcess}
                disabled={validating}
              >
                {validating ? 'Calculating Nexus...' : 'Calculate Nexus →'}
              </Button>
            </div>
          </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
