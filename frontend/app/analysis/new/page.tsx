'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { handleApiError, showSuccess, showError } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api/client'
import { createClientNote } from '@/lib/api/clients'
import { UploadCloud, CheckCircle2, FileText, ShieldAlert, FileCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidStateCode, isValidPastDate, isValidFileSize, formatFileSize } from '@/lib/utils/validation'

// Validation schema
const clientSetupSchema = z.object({
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  businessType: z.enum(['product_sales', 'digital_products', 'mixed'], {
    required_error: 'Please select a business type',
  }),
  notes: z.string().optional(),
})

type ClientSetupForm = z.infer<typeof clientSetupSchema>

interface StateRegistration {
  id: string
  stateCode: string
  registrationDate: string
}

// Placeholder component for engagement types not yet implemented
function ComingSoonPlaceholder({
  type,
  clientId,
  clientName
}: {
  type: string
  clientId: string | null
  clientName: string | null
}) {
  const router = useRouter()

  const typeConfig: Record<string, { title: string; icon: React.ElementType; color: string; bgColor: string; description: string }> = {
    vda: {
      title: 'VDA / Remediation',
      icon: ShieldAlert,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Anonymous voluntary disclosure agreements to clear past tax liabilities without penalties.'
    },
    registration: {
      title: 'State Registration',
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Filing forms to register for sales tax permits in states where you have nexus.'
    },
    compliance: {
      title: 'Monthly Compliance',
      icon: RefreshCw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Recurring filing setup, return preparation, and notice management services.'
    }
  }

  const config = typeConfig[type] || typeConfig.vda
  const Icon = config.icon

  const handleBack = () => {
    if (clientId) {
      router.push(`/clients/${clientId}`)
    } else {
      router.push('/clients')
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="4xl"
        breadcrumbs={
          clientId && clientName
            ? [
                { label: 'Clients', href: '/clients' },
                { label: clientName, href: `/clients/${clientId}` },
                { label: config.title },
              ]
            : [
                { label: 'Clients', href: '/clients' },
                { label: config.title },
              ]
        }
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-2">
            <div className={`h-16 w-16 rounded-xl ${config.bgColor} flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {config.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-4">
            <div className="bg-muted/50 rounded-lg p-6 border border-dashed">
              <p className="text-muted-foreground">
                This engagement type is coming soon. We're building out the workflow to support {config.title.toLowerCase()} engagements.
              </p>
            </div>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    </ProtectedRoute>
  )
}

// Component to handle search params
function AnalysisFormContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams?.get('clientId')
  const clientName = searchParams?.get('clientName')
  const type = searchParams?.get('type')
  const router = useRouter()

  // Route to appropriate wizard based on engagement type
  if (type && type !== 'nexus') {
    return <ComingSoonPlaceholder type={type} clientId={clientId} clientName={clientName} />
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stateRegistrations, setStateRegistrations] = useState<StateRegistration[]>([])
  const [showAddState, setShowAddState] = useState(false)
  const [newState, setNewState] = useState({ stateCode: '', registrationDate: '' })

  // Upload state
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadResponse, setUploadResponse] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [calculating, setCalculating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClientSetupForm>({
    resolver: zodResolver(clientSetupSchema),
    defaultValues: {
      companyName: clientName || ''
    }
  })

  // Pre-fill company name if clientName is provided
  useEffect(() => {
    if (clientName) {
      setValue('companyName', clientName)
    }
  }, [clientName, setValue])

  const handleAddState = () => {
    if (!newState.stateCode || !newState.registrationDate) {
      showError('Both state code and registration date are required')
      return
    }

    // Validate state code
    if (!isValidStateCode(newState.stateCode)) {
      showError('Invalid state code. Please enter a valid 2-letter US state code')
      return
    }

    // Validate registration date is not in the future
    if (!isValidPastDate(newState.registrationDate)) {
      showError('Registration date cannot be in the future')
      return
    }

    // Check for duplicate state
    if (stateRegistrations.some(s => s.stateCode === newState.stateCode)) {
      showError(`State ${newState.stateCode} has already been added`)
      return
    }

    setStateRegistrations([
      ...stateRegistrations,
      {
        id: Math.random().toString(36).substr(2, 9),
        stateCode: newState.stateCode,
        registrationDate: newState.registrationDate,
      },
    ])
    setNewState({ stateCode: '', registrationDate: '' })
    setShowAddState(false)
  }

  const handleRemoveState = (id: string) => {
    setStateRegistrations(stateRegistrations.filter((s) => s.id !== id))
  }

  const onSubmit = async (data: ClientSetupForm) => {
    setLoading(true)
    setError('')

    try {
      // Create analysis in backend
      const response = await apiClient.post('/api/v1/analyses', {
        company_name: data.companyName,
        // Dates will be auto-detected from CSV upload
        business_type: data.businessType,
        notes: data.notes || '',
        known_registrations: stateRegistrations.map((s) => ({
          state_code: s.stateCode,
          registration_date: s.registrationDate,
        })),
        client_id: clientId || null,  // Link to client if provided
      })

      const newAnalysisId = response.data.id
      setAnalysisId(newAnalysisId)
      setShowUploadZone(true)
      showSuccess('Analysis created! Now upload your transaction data.')

      // Log activity note if this is linked to a client
      if (clientId) {
        try {
          await createClientNote(clientId, {
            content: `Started new Nexus Study project for ${data.companyName}`,
            note_type: 'analysis'
          })
        } catch {
          // Silently fail - note creation is not critical
          console.warn('Failed to create activity note')
        }
      }
    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to create analysis' })
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Navigate back to the client page if we came from one, otherwise go to clients list
    if (clientId) {
      router.push(`/clients/${clientId}`)
    } else {
      router.push('/clients')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      handleFileUpload(file)
    }
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setUploadedFile(file)
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!analysisId) {
      setUploadError('Analysis ID not found. Please try again.')
      return
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files are supported')
      return
    }

    // Validate file size (50MB limit)
    if (!isValidFileSize(file, 50)) {
      setUploadError(`File size (${formatFileSize(file.size)}) exceeds 50MB limit`)
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post(
        `/api/v1/analyses/${analysisId}/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      setUploadResponse(response.data)

      // Show confirmation dialog if all columns detected
      if (response.data.all_required_detected) {
        setShowConfirmDialog(true)
      } else {
        // Redirect to mapping page for manual mapping
        router.push(`/analysis/${analysisId}/mapping`)
      }
    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to upload file' })
      setUploadError(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmCalculation = async () => {
    if (!analysisId || !uploadResponse) return

    try {
      setCalculating(true)
      setShowConfirmDialog(false)

      // Step 1: Save mappings
      const mappingPayload = {
        column_mappings: {
          transaction_date: {
            source_column: uploadResponse.auto_detected_mappings.mappings.transaction_date
          },
          customer_state: {
            source_column: uploadResponse.auto_detected_mappings.mappings.customer_state
          },
          revenue_amount: {
            source_column: uploadResponse.auto_detected_mappings.mappings.revenue_amount
          },
          sales_channel: {
            source_column: uploadResponse.auto_detected_mappings.mappings.sales_channel
          }
        }
      }

      await apiClient.post(
        `/api/v1/analyses/${analysisId}/validate-and-save`,
        mappingPayload
      )

      // Step 2: Trigger calculation
      await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)

      // Step 3: Poll for completion
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        const statusResponse = await apiClient.get(`/api/v1/analyses/${analysisId}`)

        if (statusResponse.data.status === 'complete') {
          // Calculation complete!
          showSuccess('Analysis complete!')

          // Log completion note with results summary if linked to a client
          if (clientId) {
            try {
              // Fetch the calculation results to get summary stats
              const resultsResponse = await apiClient.get(`/api/v1/analyses/${analysisId}/results`)
              const summary = resultsResponse.data?.summary
              if (summary) {
                const liability = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(summary.total_estimated_liability || 0)

                await createClientNote(clientId, {
                  content: `Nexus Study completed: ${summary.states_with_nexus || 0} states with nexus, ${liability} estimated liability`,
                  note_type: 'analysis'
                })
              }
            } catch {
              // Silently fail - note creation is not critical
              console.warn('Failed to create completion activity note')
            }
          }

          router.push(`/analysis/${analysisId}/results`)
          return
        }

        attempts++
      }

      // Timeout - redirect anyway with warning
      showSuccess('Calculation started - results may take a moment to appear')
      router.push(`/analysis/${analysisId}/results`)

    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to process analysis' })
      setError(errorMsg)
      setCalculating(false)
    }
  }

  const handleAdjustMappings = () => {
    setShowConfirmDialog(false)
    if (analysisId) {
      router.push(`/analysis/${analysisId}/mapping`)
    }
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout
          maxWidth="4xl"
          breadcrumbs={
            clientId && clientName
              ? [
                  { label: 'Clients', href: '/clients' },
                  { label: clientName, href: `/clients/${clientId}` },
                  { label: 'New Analysis' },
                ]
              : [
                  { label: 'Clients', href: '/clients' },
                  { label: 'New Analysis' },
                ]
          }
        >
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-3xl font-bold text-card-foreground mb-6">
            New Nexus Analysis
          </h2>

            {error && (
              <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive-foreground">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Client Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-card-foreground border-b border-border pb-2">
                  Client Information
                </h3>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-2">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Enter company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>
              </div>

              {/* Business Type */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-card-foreground border-b border-border pb-2">
                  Business Type <span className="text-destructive">*</span>
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-input rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="product_sales"
                      className="h-4 w-4 text-primary focus:ring-2 focus:ring-ring border-input transition-all"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-foreground">
                        Product Sales (Physical goods)
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center p-4 border border-input rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="digital_products"
                      className="h-4 w-4 text-primary focus:ring-2 focus:ring-ring border-input transition-all"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-foreground">
                        Digital Products/Services
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center p-4 border border-input rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="mixed"
                      className="h-4 w-4 text-primary focus:ring-2 focus:ring-ring border-input transition-all"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-foreground">
                        Mixed (Products + Services)
                      </span>
                    </span>
                  </label>
                </div>

                {errors.businessType && (
                  <p className="text-sm text-destructive">{errors.businessType.message}</p>
                )}
              </div>

              {/* Known State Registrations */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-card-foreground border-b border-border pb-2">
                  Known State Registrations <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                </h3>

                {stateRegistrations.length > 0 && (
                  <div className="space-y-2">
                    {stateRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                        <div>
                          <span className="font-medium text-foreground">{reg.stateCode}</span>
                          <span className="text-sm text-muted-foreground ml-3">
                            Registration Date: {new Date(reg.registrationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveState(reg.id)}
                          className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!showAddState ? (
                  <button
                    type="button"
                    onClick={() => setShowAddState(true)}
                    className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors font-medium inline-flex items-center gap-1"
                  >
                    + Add State
                  </button>
                ) : (
                  <div className="p-4 border border-input rounded-md space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          State Code
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={newState.stateCode}
                          onChange={(e) => setNewState({ ...newState, stateCode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          placeholder="CA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Registration Date
                        </label>
                        <input
                          type="date"
                          value={newState.registrationDate}
                          onChange={(e) => setNewState({ ...newState, registrationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleAddState}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:bg-primary/90 transition-all active:scale-95"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddState(false)
                          setNewState({ stateCode: '', registrationDate: '' })
                        }}
                        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-lg border border-border hover:bg-secondary/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                  Notes <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Add any internal notes about this analysis..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? 'Creating...' : 'Create Analysis'}
                  {!loading && (
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Button>
              </div>
            </form>

          {/* File Upload Zone - Appears after analysis creation */}
          {showUploadZone && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-xl">Upload Transaction Data</CardTitle>
                <CardDescription>
                  Upload your CSV file containing sales transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!uploadedFile ? (
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-ring hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        Drop your CSV file here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV files up to 50MB
                      </p>
                    </label>
                  </div>
                ) : uploading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Processing your file...</p>
                  </div>
                ) : (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-4" />
                    <p className="text-lg font-medium text-success-foreground mb-2">
                      File uploaded successfully!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-success-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm text-destructive-foreground">{uploadError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && uploadResponse?.auto_detected_mappings && (
            <ColumnMappingConfirmationDialog
              isOpen={showConfirmDialog}
              onClose={() => setShowConfirmDialog(false)}
              onConfirm={handleConfirmCalculation}
              onAdjust={handleAdjustMappings}
              detectedMappings={uploadResponse.auto_detected_mappings.mappings}
              samplesByColumn={uploadResponse.auto_detected_mappings.samples}
              dataSummary={uploadResponse.auto_detected_mappings.summary}
            />
          )}

          {/* Loading overlay during calculation */}
          {calculating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-8 max-w-md text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Calculating Nexus...
                </h3>
                <p className="text-sm text-muted-foreground">
                  This may take a minute. Please don't close this page.
                </p>
              </div>
            </div>
          )}
          </div>
      </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

// Main export component with Suspense boundary
export default function ClientSetupPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <AppLayout maxWidth="4xl">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    }>
      <AnalysisFormContent />
    </Suspense>
  )
}
