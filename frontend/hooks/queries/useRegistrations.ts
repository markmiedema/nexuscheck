import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'
import type { Client } from '@/lib/api/clients'

interface RegistrationsData {
  registered_states: string[]
}

/**
 * Get the query key for registrations based on storage mode
 */
function getRegistrationsQueryKey(analysisId: string, clientId?: string) {
  if (clientId) {
    return queryKeys.clients.detail(clientId)
  }
  return queryKeys.analyses.registrations(analysisId)
}

/**
 * Fetch registered states for an analysis
 * Sources from client if clientId is provided, otherwise from analysis
 */
export function useRegistrationsQuery(
  analysisId: string | undefined,
  clientId?: string
) {
  const useClientStorage = !!clientId

  return useQuery({
    queryKey: getRegistrationsQueryKey(analysisId!, clientId),
    queryFn: async (): Promise<string[]> => {
      if (useClientStorage) {
        const response = await apiClient.get(`/api/v1/clients/${clientId}`)
        return (response.data as Client).registered_states || []
      }
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/registrations`)
      return response.data.registered_states || []
    },
    enabled: !!analysisId,
  })
}

interface ToggleRegistrationContext {
  previousStates: string[] | undefined
}

/**
 * Toggle a single state registration with optimistic updates
 */
export function useToggleRegistration(
  analysisId: string,
  clientId?: string,
  options?: { onUpdate?: () => void | Promise<void> }
) {
  const queryClient = useQueryClient()
  const useClientStorage = !!clientId
  const queryKey = getRegistrationsQueryKey(analysisId, clientId)

  return useMutation<void, Error, string, ToggleRegistrationContext>({
    mutationFn: async (stateCode: string) => {
      // Get current states
      let currentStates: string[] = []
      if (useClientStorage) {
        const response = await apiClient.get(`/api/v1/clients/${clientId}`)
        currentStates = (response.data as Client).registered_states || []
      } else {
        const response = await apiClient.get(`/api/v1/analyses/${analysisId}/registrations`)
        currentStates = response.data.registered_states || []
      }

      const isCurrentlyRegistered = currentStates.includes(stateCode)
      const newStates = isCurrentlyRegistered
        ? currentStates.filter((s) => s !== stateCode)
        : [...currentStates, stateCode].sort()

      if (useClientStorage) {
        await apiClient.patch(`/api/v1/clients/${clientId}`, {
          registered_states: newStates,
          current_registration_count: newStates.length,
        })
      } else {
        await apiClient.patch(`/api/v1/analyses/${analysisId}/registrations`, {
          registered_states: newStates,
        })
      }
    },
    onMutate: async (stateCode) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      let previousStates: string[] | undefined
      if (useClientStorage) {
        const client = queryClient.getQueryData<Client>(queryKey)
        previousStates = client?.registered_states
      } else {
        previousStates = queryClient.getQueryData<string[]>(queryKey)
      }

      // Optimistically update
      const currentStates = previousStates || []
      const isCurrentlyRegistered = currentStates.includes(stateCode)
      const newStates = isCurrentlyRegistered
        ? currentStates.filter((s) => s !== stateCode)
        : [...currentStates, stateCode].sort()

      if (useClientStorage) {
        queryClient.setQueryData<Client>(queryKey, (old) =>
          old ? { ...old, registered_states: newStates, current_registration_count: newStates.length } : old
        )
      } else {
        queryClient.setQueryData<string[]>(queryKey, newStates)
      }

      return { previousStates }
    },
    onError: (err, stateCode, context) => {
      // Rollback on error
      if (context?.previousStates !== undefined) {
        if (useClientStorage) {
          queryClient.setQueryData<Client>(queryKey, (old) =>
            old ? { ...old, registered_states: context.previousStates!, current_registration_count: context.previousStates!.length } : old
          )
        } else {
          queryClient.setQueryData<string[]>(queryKey, context.previousStates)
        }
      }
      toast.error('Failed to update registration')
    },
    onSuccess: async (_, stateCode) => {
      // Get the new state to determine add/remove
      let newStates: string[] = []
      if (useClientStorage) {
        const client = queryClient.getQueryData<Client>(queryKey)
        newStates = client?.registered_states || []
      } else {
        newStates = queryClient.getQueryData<string[]>(queryKey) || []
      }

      const wasAdded = newStates.includes(stateCode)
      toast.success(wasAdded ? `Added registration for ${stateCode}` : `Removed registration for ${stateCode}`)

      if (options?.onUpdate) {
        await options.onUpdate()
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

/**
 * Set multiple registrations at once
 */
export function useSetMultipleRegistrations(
  analysisId: string,
  clientId?: string,
  options?: { onUpdate?: () => void | Promise<void> }
) {
  const queryClient = useQueryClient()
  const useClientStorage = !!clientId
  const queryKey = getRegistrationsQueryKey(analysisId, clientId)

  return useMutation<void, Error, string[], ToggleRegistrationContext>({
    mutationFn: async (stateCodes: string[]) => {
      const sortedStates = [...stateCodes].sort()

      if (useClientStorage) {
        await apiClient.patch(`/api/v1/clients/${clientId}`, {
          registered_states: sortedStates,
          current_registration_count: sortedStates.length,
        })
      } else {
        await apiClient.patch(`/api/v1/analyses/${analysisId}/registrations`, {
          registered_states: sortedStates,
        })
      }
    },
    onMutate: async (stateCodes) => {
      await queryClient.cancelQueries({ queryKey })

      let previousStates: string[] | undefined
      if (useClientStorage) {
        const client = queryClient.getQueryData<Client>(queryKey)
        previousStates = client?.registered_states
      } else {
        previousStates = queryClient.getQueryData<string[]>(queryKey)
      }

      const sortedStates = [...stateCodes].sort()

      if (useClientStorage) {
        queryClient.setQueryData<Client>(queryKey, (old) =>
          old ? { ...old, registered_states: sortedStates, current_registration_count: sortedStates.length } : old
        )
      } else {
        queryClient.setQueryData<string[]>(queryKey, sortedStates)
      }

      return { previousStates }
    },
    onError: (err, _, context) => {
      if (context?.previousStates !== undefined) {
        if (useClientStorage) {
          queryClient.setQueryData<Client>(queryKey, (old) =>
            old ? { ...old, registered_states: context.previousStates!, current_registration_count: context.previousStates!.length } : old
          )
        } else {
          queryClient.setQueryData<string[]>(queryKey, context.previousStates)
        }
      }
      toast.error('Failed to update registrations')
    },
    onSuccess: async (_, stateCodes) => {
      toast.success(`Updated registrations (${stateCodes.length} states)`)
      if (options?.onUpdate) {
        await options.onUpdate()
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

/**
 * Hook that provides the same interface as the old useRegistrations hook
 * for easier migration
 */
export function useRegistrations(
  analysisId: string,
  clientId?: string,
  options?: { onUpdate?: () => void | Promise<void> }
) {
  const { data: registeredStatesData, isLoading: loading } = useRegistrationsQuery(analysisId, clientId)

  // Normalize registeredStates - the query may return a Client object (from shared cache)
  // instead of string[] when using client storage
  const registeredStates: string[] = Array.isArray(registeredStatesData)
    ? registeredStatesData
    : (registeredStatesData && typeof registeredStatesData === 'object' && 'registered_states' in registeredStatesData)
      ? ((registeredStatesData as { registered_states?: string[] }).registered_states || [])
      : []

  const toggleMutation = useToggleRegistration(analysisId, clientId, options)
  const setMultipleMutation = useSetMultipleRegistrations(analysisId, clientId, options)
  const queryClient = useQueryClient()
  const queryKey = getRegistrationsQueryKey(analysisId, clientId)

  return {
    registeredStates,
    loading,
    saving: toggleMutation.isPending || setMultipleMutation.isPending,
    toggleRegistration: toggleMutation.mutate,
    setMultipleRegistrations: setMultipleMutation.mutate,
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    isClientLinked: !!clientId,
  }
}
