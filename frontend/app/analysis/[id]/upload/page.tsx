'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api/client'
import DateConfirmationDialog from '@/components/analysis/DateConfirmationDialog'
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'

interface ParsedData {
  headers: string[]
  rows: any[]
  totalRows: number
}

interface DateRangeDetected {
  start: string | null
  end: string | null
  auto_populated: boolean
}

export default function UploadPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showDateDialog, setShowDateDialog] = useState(false)
  const [detectedDates, setDetectedDates] = useState<DateRangeDetected | null>(null)
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [autoDetectedMappings, setAutoDetectedMappings] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('')

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.file.size > 50 * 1024 * 1024) {
        setError(`File too large (${(rejection.file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 50 MB.`)
      } else {
        setError('Invalid file type. Please upload a CSV or Excel file.')
      }
      return
    }

    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    setParsing(true)

    // Parse CSV to preview
    Papa.parse(uploadedFile, {
      complete: (results) => {
        const headers = results.data[0] as string[]
        const dataRows = results.data.slice(1).filter((row: any) => {
          // Filter out empty rows
          return row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined)
        })

        setParsedData({
          headers,
          rows: dataRows.slice(0, 10), // First 10 rows
          totalRows: dataRows.length,
        })
        setParsing(false)
      },
      error: (error) => {
        setError(`Failed to parse file: ${error.message}`)
        setParsing(false)
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  })

  const handleUploadDifferentFile = () => {
    setFile(null)
    setParsedData(null)
    setError('')
  }

  const handleContinue = async () => {
    if (!file || !parsedData) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post(`/api/v1/analyses/${analysisId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Show success toast
      showSuccess(`File uploaded successfully: ${file.name}`)

      // Check if dates were detected
      if (response.data.date_range_detected) {
        setDetectedDates(response.data.date_range_detected)
        setShowDateDialog(true)
      } else if (response.data.all_required_detected) {
        // High confidence: all required columns detected
        setAutoDetectedMappings(response.data.auto_detected_mappings)
        setShowMappingDialog(true)
      } else {
        // Low confidence: go to full mapping page
        router.push(`/analysis/${analysisId}/mapping`)
      }
    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to upload file' })
      setError(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleDateDialogClose = () => {
    setShowDateDialog(false)

    // After closing date dialog, check if we should show mapping dialog
    if (autoDetectedMappings && autoDetectedMappings.all_required_detected) {
      setShowMappingDialog(true)
    } else {
      router.push(`/analysis/${analysisId}/mapping`)
    }
  }

  const handleMappingConfirm = async () => {
    setShowMappingDialog(false)

    try {
      // Save auto-detected mappings
      const mappingPayload = {
        column_mappings: {
          transaction_date: {
            source_column: autoDetectedMappings.mappings.transaction_date
          },
          customer_state: {
            source_column: autoDetectedMappings.mappings.customer_state
          },
          revenue_amount: {
            source_column: autoDetectedMappings.mappings.revenue_amount
          },
          sales_channel: {
            source_column: autoDetectedMappings.mappings.sales_channel
          }
        }
      }

      await apiClient.post(`/api/v1/analyses/${analysisId}/validate-and-save`, mappingPayload)

      // Navigate to results
      router.push(`/analysis/${analysisId}/results`)
    } catch (err) {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to save mappings' })
      setError(errorMsg)
    }
  }

  const handleMappingAdjust = () => {
    setShowMappingDialog(false)
    router.push(`/analysis/${analysisId}/mapping`)
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="5xl"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'New Analysis', href: '/analysis/new' },
          { label: 'Upload Data' },
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Upload Transaction Data
            </h2>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!parsedData ? (
              // Upload Zone
              <div className="space-y-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {isDragActive ? 'Drop file here' : 'Drag and drop CSV file here'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">or</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      Choose File
                    </Button>
                    <p className="mt-4 text-xs text-gray-500">
                      Accepted formats: .csv, .xlsx, .xls
                    </p>
                    <p className="text-xs text-gray-500">Maximum size: 50 MB</p>
                  </div>
                </div>

                {/* Help Section */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Required Columns:</h3>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• <strong>transaction_date</strong> (MM/DD/YYYY or YYYY-MM-DD)</li>
                        <li>• <strong>customer_state</strong> (2-letter code: CA, NY, etc.)</li>
                        <li>• <strong>revenue_amount</strong> (numeric, no $ or commas)</li>
                        <li>• <strong>sales_channel</strong> (marketplace, direct, or other)</li>
                      </ul>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        Optional: transaction_id, product_type, customer_type
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // File Preview
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        File uploaded: {file?.name}
                      </p>
                      <p className="text-sm text-green-700">
                        {parsedData.totalRows.toLocaleString()} transactions found
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUploadDifferentFile}
                    variant="ghost"
                    size="sm"
                    className="text-green-700 hover:text-green-800"
                  >
                    Upload Different File
                  </Button>
                </div>

                {/* Column Detection */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Detected Columns:</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.headers.map((header, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Preview */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Preview (first 10 rows):
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {parsedData.headers.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-50">
                            {row.map((cell: any, cellIdx: number) => (
                              <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    onClick={() => router.push(`/analysis/new`)}
                    variant="outline"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={uploading}
                    className="flex items-center"
                  >
                    {uploading ? 'Uploading...' : 'Continue to Mapping'}
                    {!uploading && (
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {parsing && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-600">Parsing file...</p>
              </div>
            )}
          </div>

        {/* Date Confirmation Dialog */}
        <DateConfirmationDialog
          isOpen={showDateDialog}
          onClose={handleDateDialogClose}
          onConfirm={handleDateDialogClose}
          detectedStart={detectedDates?.start || null}
          detectedEnd={detectedDates?.end || null}
          wasAutoPopulated={detectedDates?.auto_populated || false}
        />

        {/* Column Mapping Confirmation Dialog */}
        <ColumnMappingConfirmationDialog
          isOpen={showMappingDialog}
          onClose={() => setShowMappingDialog(false)}
          onConfirm={handleMappingConfirm}
          onAdjust={handleMappingAdjust}
          detectedMappings={autoDetectedMappings?.mappings || {}}
          samplesByColumn={autoDetectedMappings?.samples || {}}
          dataSummary={autoDetectedMappings?.summary}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
