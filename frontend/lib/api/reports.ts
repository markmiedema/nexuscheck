/**
 * API functions for report generation
 */
import apiClient from './client'

export type ReportType = 'summary' | 'detailed' | 'state'

export interface GenerateReportOptions {
  reportType?: ReportType
  stateCode?: string
  includeAllStates?: boolean
  includeStateDetails?: boolean
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
 * Generate and download a PDF report
 */
export async function generateReport(
  analysisId: string,
  options: GenerateReportOptions = {}
): Promise<Blob> {
  const response = await apiClient.post(
    `/api/v1/analyses/${analysisId}/reports/generate`,
    {
      report_type: options.reportType || 'detailed',
      state_code: options.stateCode,
      include_all_states: options.includeAllStates ?? true,
      include_state_details: options.includeStateDetails ?? true,
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
  const reportType = options.reportType || 'detailed'
  const stateCode = options.stateCode ? `_${options.stateCode}` : ''
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `nexus_report_${sanitizedName}${stateCode}_${reportType}_${timestamp}.pdf`

  downloadReport(blob, filename)
}
