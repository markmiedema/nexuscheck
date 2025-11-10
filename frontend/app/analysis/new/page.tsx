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
                  {loading ? 'Creating...' : 'Continue to Upload'}
                  {!loading && (
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Button>
              </div>
            </form>
          </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
