import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import apiClient from '@/lib/api/client'
import type { StateResultsResponse, StateResult } from '@/types/states'

/**
 * Fetch state results for an analysis
 */
export function useStateResults(analysisId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.states(analysisId!),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/results/states`)
      return response.data as StateResultsResponse
    },
    enabled: !!analysisId,
  })
}

/**
 * State detail response type
 */
export interface StateDetailResponse {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'no_nexus'
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  total_sales: number
  taxable_sales: number
  exempt_sales: number
  threshold: number
  threshold_percent: number
  estimated_liability: number
  confidence_level: 'high' | 'medium' | 'low'
  registration_status: 'registered' | 'not_registered' | null
  transaction_count?: number
  year_data?: Array<{
    year: number
    total_sales: number
    taxable_sales: number
    exempt_sales: number
    estimated_liability: number
  }>
  physical_nexus_reasons?: Array<{
    nexus_type: string
    description: string
    effective_date?: string
  }>
}

/**
 * Fetch detailed state information for a specific state in an analysis
 */
export function useStateDetail(
  analysisId: string | undefined,
  stateCode: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.analyses.stateDetail(analysisId!, stateCode!),
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/v1/analyses/${analysisId}/results/states/${stateCode}`
      )
      return response.data as StateDetailResponse
    },
    enabled: !!analysisId && !!stateCode,
  })
}

/**
 * Fetch state results from a client context (for client-linked analyses)
 * This fetches via the client endpoint rather than analysis endpoint
 */
export function useClientStateResults(clientId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.clients.detail(clientId!), 'states'],
    queryFn: async () => {
      // First get the latest analysis for this client
      const analysesResponse = await apiClient.get(`/api/v1/clients/${clientId}/analyses`)
      const analyses = analysesResponse.data

      if (!analyses || analyses.length === 0) {
        return null
      }

      // Get the most recent complete analysis
      const latestAnalysis = analyses.find((a: any) => a.status === 'complete') || analyses[0]

      if (!latestAnalysis || latestAnalysis.status !== 'complete') {
        return null
      }

      // Fetch state results for this analysis
      const response = await apiClient.get(`/api/v1/analyses/${latestAnalysis.id}/results/states`)
      return response.data as StateResultsResponse
    },
    enabled: !!clientId,
  })
}
