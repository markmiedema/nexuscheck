import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  listEngagements,
  getEngagement,
  getActiveEngagement,
  createEngagement,
  updateEngagement,
  deleteEngagement,
  canCreateProject,
  type Engagement,
  type CreateEngagementData,
  type UpdateEngagementData,
} from '@/lib/api/engagements'
import { toast } from 'sonner'

/**
 * Fetch all engagements for a client
 */
export function useClientEngagements(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engagements.list(clientId!),
    queryFn: () => listEngagements(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Fetch a single engagement by ID
 */
export function useEngagement(engagementId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engagements.detail(engagementId!),
    queryFn: () => getEngagement(engagementId!),
    enabled: !!engagementId,
  })
}

/**
 * Fetch the active (signed) engagement for a client
 */
export function useActiveEngagement(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engagements.active(clientId!),
    queryFn: () => getActiveEngagement(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Check if a project can be created for a client
 */
export function useCanCreateProject(
  clientId: string | undefined,
  serviceType: string
) {
  return useQuery({
    queryKey: queryKeys.engagements.canCreateProject(clientId!, serviceType),
    queryFn: () => canCreateProject(clientId!, serviceType),
    enabled: !!clientId && !!serviceType,
  })
}

/**
 * Create a new engagement
 */
export function useCreateEngagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEngagementData) => createEngagement(data),
    onSuccess: (engagement) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.list(engagement.client_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.active(engagement.client_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overview(engagement.client_id),
      })
      toast.success('Engagement created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create engagement')
    },
  })
}

/**
 * Update an engagement
 */
export function useUpdateEngagement(engagementId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateEngagementData) =>
      updateEngagement(engagementId, data),
    onSuccess: (engagement) => {
      queryClient.setQueryData(
        queryKeys.engagements.detail(engagementId),
        engagement
      )
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.list(engagement.client_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.active(engagement.client_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overview(engagement.client_id),
      })
      toast.success('Engagement updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update engagement')
    },
  })
}

/**
 * Delete an engagement
 */
export function useDeleteEngagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      engagementId,
      clientId,
    }: {
      engagementId: string
      clientId: string
    }) => deleteEngagement(engagementId),
    onSuccess: (_, { engagementId, clientId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.list(clientId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagements.active(clientId),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.engagements.detail(engagementId),
      })
      toast.success('Engagement deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete engagement')
    },
  })
}

// Re-export types
export type { Engagement, CreateEngagementData, UpdateEngagementData }
