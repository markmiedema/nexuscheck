import apiClient from './client'

export interface Analysis {
  id: string
  user_id: string
  client_company_name: string
  industry?: string
  business_type: string
  analysis_period_start: string
  analysis_period_end: string
  status: 'draft' | 'processing' | 'complete' | 'error'
  total_liability?: number
  states_with_nexus?: number
  created_at: string
  updated_at: string
}

export interface AnalysesListResponse {
  total_count: number
  limit: number
  offset: number
  analyses: Analysis[]
}

export async function listAnalyses(params?: {
  limit?: number
  offset?: number
  search?: string
  status?: string
}): Promise<AnalysesListResponse> {
  const response = await apiClient.get('/api/v1/analyses', { params })
  return response.data
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  await apiClient.delete(`/api/v1/analyses/${analysisId}`)
}
