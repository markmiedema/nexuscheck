import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import apiClient from '@/lib/api/client'
import { getStateDetail, type StateDetailResponse } from '@/lib/api'
import type { StateResultsResponse } from '@/types/states'

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
 * Fetch detailed state information for a specific state in an analysis
 * Uses the proper getStateDetail function from lib/api
 */
export function useStateDetail(
  analysisId: string | undefined,
  stateCode: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.analyses.stateDetail(analysisId!, stateCode!),
    queryFn: () => getStateDetail(analysisId!, stateCode!),
    enabled: !!analysisId && !!stateCode,
  })
}

// Re-export the type for convenience
export type { StateDetailResponse }

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
