import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  listAnalyses,
  deleteAnalysis,
  type Analysis,
  type AnalysesListResponse,
} from '@/lib/api/analyses'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

interface AnalysesFilters {
  limit?: number
  offset?: number
  search?: string
  status?: string
}

/**
 * Fetch analyses with optional filters
 */
export function useAnalyses(filters?: AnalysesFilters) {
  return useQuery({
    queryKey: queryKeys.analyses.list(filters as Record<string, unknown> | undefined),
    queryFn: () => listAnalyses(filters),
  })
}

/**
 * Fetch a single analysis by ID
 */
export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/analyses/${id}`)
      return response.data as Analysis
    },
    enabled: !!id,
  })
}

/**
 * Delete an analysis
 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAnalysis(id),
    onSuccess: (_, deletedId) => {
      // Invalidate all analysis lists
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.lists() })
      // Also invalidate client analyses lists (since analyses appear there too)
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      // Remove the specific analysis from cache
      queryClient.removeQueries({ queryKey: queryKeys.analyses.detail(deletedId) })
      toast.success('Analysis deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete analysis')
    },
  })
}

interface CreateAnalysisData {
  client_company_name: string
  client_id?: string
  industry?: string
  business_type: string
  analysis_period_start?: string
  analysis_period_end?: string
}

/**
 * Create a new analysis
 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAnalysisData) => {
      const response = await apiClient.post('/api/v1/analyses', data)
      return response.data as Analysis
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.lists() })
      // Also invalidate client analyses if this was for a client
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create analysis')
    },
  })
}

/**
 * Fetch analysis with polling for status changes
 * Useful when waiting for calculations to complete
 */
export function useAnalysisWithPolling(
  id: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.analyses.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/analyses/${id}`)
      return response.data as Analysis
    },
    enabled: !!id && (options?.enabled !== false),
    // Poll every second while calculating
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'processing') {
        return 1000
      }
      return false
    },
  })
}
