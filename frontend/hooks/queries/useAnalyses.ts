import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  listAnalyses,
  deleteAnalysis,
  markAnalysisPresented,
  unmarkAnalysisPresented,
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

export interface ColumnInfo {
  name: string
  sample_values: string[]
  data_type: string
}

export interface DataSummary {
  total_rows: number
  date_range: {
    start: string
    end: string
  }
  unique_states: number
  estimated_time: string
}

export interface ColumnsResponse {
  columns: ColumnInfo[]
  summary: DataSummary
}

/**
 * Fetch column information for an analysis (used in mapping page)
 */
export function useAnalysisColumns(analysisId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.analyses.detail(analysisId!), 'columns'] as const,
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/columns`)
      return response.data as ColumnsResponse
    },
    enabled: !!analysisId,
  })
}

export interface AnalysisResultsSummary {
  summary: {
    total_states_analyzed: number
    states_with_nexus: number
    total_estimated_liability: number
  }
  nexus_breakdown: {
    economic_nexus: number
    physical_nexus: number
    no_nexus: number
    both: number
  }
  top_states_by_liability: Array<{
    state: string
    estimated_liability: number
    nexus_type: string
    total_sales: number
  }>
  approaching_threshold: Array<{
    state: string
    total_sales: number
    threshold: number
  }>
}

/**
 * Fetch analysis results summary
 */
export function useAnalysisResultsSummary(analysisId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyses.results(analysisId!),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/results/summary`)
      return response.data as AnalysisResultsSummary
    },
    enabled: !!analysisId,
  })
}

/**
 * Trigger analysis calculation
 */
export function useCalculateAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (analysisId: string) => {
      await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)
      return analysisId
    },
    onSuccess: (analysisId) => {
      // Invalidate results and analysis detail to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.results(analysisId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.states(analysisId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.detail(analysisId) })
      toast.success('Calculation complete')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to calculate nexus')
    },
  })
}

/**
 * Mark an analysis as presented to the client
 */
export function useMarkAnalysisPresented() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (analysisId: string) => markAnalysisPresented(analysisId),
    onSuccess: (data, analysisId) => {
      // Invalidate analysis detail and lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.detail(analysisId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.lists() })
      toast.success('Analysis marked as presented')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to mark as presented')
    },
  })
}

/**
 * Unmark an analysis as presented (revert to complete)
 */
export function useUnmarkAnalysisPresented() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (analysisId: string) => unmarkAnalysisPresented(analysisId),
    onSuccess: (data, analysisId) => {
      // Invalidate analysis detail and lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.detail(analysisId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.lists() })
      toast.success('Analysis reverted to complete')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to unmark as presented')
    },
  })
}
