'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api/client'
import { UploadCloud, CheckCircle2, FileText } from 'lucide-react'
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function ClientSetupPage() {
  const router = useRouter()
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
    formState: { errors },
  } = useForm<ClientSetupForm>({
    resolver: zodResolver(clientSetupSchema),
  })

  const handleAddState = () => {
    if (newState.stateCode && newState.registrationDate) {
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
      })

      const newAnalysisId = response.data.id
      setAnalysisId(newAnalysisId)
      setShowUploadZone(true)
      showSuccess('Analysis created! Now upload your transaction data.')
    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to create analysis' })
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
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
      <AppLayout
        maxWidth="4xl"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'New Analysis' },
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            New Nexus Analysis
          </h2>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Client Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Client Information
                </h3>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                  )}
                </div>
              </div>

              {/* Business Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Business Type <span className="text-red-500">*</span>
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="product_sales"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Product Sales (Physical goods)
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="digital_products"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Digital Products/Services
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      {...register('businessType')}
                      type="radio"
                      value="mixed"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Mixed (Products + Services)
                      </span>
                    </span>
                  </label>
                </div>

                {errors.businessType && (
                  <p className="text-sm text-red-600">{errors.businessType.message}</p>
                )}
              </div>

              {/* Known State Registrations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Known State Registrations <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                </h3>

                {stateRegistrations.length > 0 && (
                  <div className="space-y-2">
                    {stateRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div>
                          <span className="font-medium text-gray-900">{reg.stateCode}</span>
                          <span className="text-sm text-gray-600 ml-3">
                            Registration Date: {new Date(reg.registrationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveState(reg.id)}
                          className="text-sm text-red-600 hover:text-red-800"
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
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add State
                  </button>
                ) : (
                  <div className="p-4 border border-gray-300 rounded-md space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State Code
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={newState.stateCode}
                          onChange={(e) => setNewState({ ...newState, stateCode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="CA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Date
                        </label>
                        <input
                          type="date"
                          value={newState.registrationDate}
                          onChange={(e) => setNewState({ ...newState, registrationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleAddState}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddState(false)
                          setNewState({ stateCode: '', registrationDate: '' })
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            <Card className="mt-8 border-2 border-dashed">
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
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
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
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Drop your CSV file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports CSV files up to 50MB
                      </p>
                    </label>
                  </div>
                ) : uploading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Processing your file...</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
                    <p className="text-lg font-medium text-green-900 mb-2">
                      File uploaded successfully!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-800">{uploadError}</p>
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
              <div className="bg-white rounded-lg p-8 max-w-md text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calculating Nexus...
                </h3>
                <p className="text-sm text-gray-600">
                  This may take a minute. Please don't close this page.
                </p>
              </div>
            </div>
          )}
          </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
