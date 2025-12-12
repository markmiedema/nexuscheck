import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  getThresholds,
  getStateDetail,
  type ThresholdData,
  type StateDetailData,
} from '@/lib/api/compliance'

/**
 * Fetch all state thresholds for the compliance overview
 */
export function useComplianceThresholds() {
  return useQuery({
    queryKey: queryKeys.compliance.thresholds(),
    queryFn: async () => {
      const response = await getThresholds()
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - compliance data doesn't change often
  })
}

/**
 * Fetch detailed compliance info for a specific state
 */
export function useComplianceStateDetail(stateCode: string | null) {
  return useQuery({
    queryKey: queryKeys.compliance.stateDetail(stateCode || ''),
    queryFn: async () => {
      if (!stateCode) return null
      const response = await getStateDetail(stateCode)
      return response.data
    },
    enabled: !!stateCode,
    staleTime: 10 * 60 * 1000,
  })
}

export type { ThresholdData, StateDetailData }
