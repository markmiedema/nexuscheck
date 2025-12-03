/**
 * API functions for report generation (V2 - modular templates with auto VDA)
 */
import apiClient from './client'

export interface GenerateReportOptions {
  includeStateDetails?: boolean
  preparerName?: string
  preparerFirm?: string
}

export interface ReportPreview {
  analysis_id: string
  company_name: string
  period_start: string | null
  period_end: string | null
  has_results: boolean
  message?: string
  summary?: {
    total_states_analyzed: number
    states_with_nexus: number
    states_approaching_threshold: number
    total_estimated_liability: number
  }
  states_with_nexus?: Array<{
    state_code: string
    state_name: string
    nexus_status: string
    nexus_type: string
    total_sales: number
    estimated_liability: number
    threshold_percent: number
  }>
  states_approaching?: Array<{
    state_code: string
    state_name: string
    nexus_status: string
    nexus_type: string
    total_sales: number
    estimated_liability: number
    threshold_percent: number
  }>
  available_report_types?: Array<{
    type: string
    description: string
  }>
}

/**
 * Generate and download a PDF report (V2 with auto VDA calculation)
 */
export async function generateReport(
  analysisId: string,
  options: GenerateReportOptions = {}
): Promise<Blob> {
  const response = await apiClient.post(
    `/api/v1/analyses/${analysisId}/reports/v2/generate`,
    {
      include_state_details: options.includeStateDetails ?? true,
      preparer_name: options.preparerName,
      preparer_firm: options.preparerFirm,
    },
    {
      responseType: 'blob',
      timeout: 120000, // 2 minute timeout for PDF generation
    }
  )
  return response.data
}

/**
 * Get report preview data without generating PDF
 */
export async function getReportPreview(analysisId: string): Promise<ReportPreview> {
  const response = await apiClient.get(`/api/v1/analyses/${analysisId}/reports/preview`)
  return response.data
}

/**
 * Download a report file
 */
export function downloadReport(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Generate and download a report in one step
 */
export async function generateAndDownloadReport(
  analysisId: string,
  companyName: string,
  options: GenerateReportOptions = {}
): Promise<void> {
  const blob = await generateReport(analysisId, options)

  // Generate filename
  const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `Nexus_Report_${sanitizedName}_${timestamp}.pdf`

  downloadReport(blob, filename)
}
