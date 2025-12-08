import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'

export interface UseRegistrationsOptions {
  onUpdate?: () => void | Promise<void>
}

export function useRegistrations(
  analysisId: string,
  clientId?: string,
  options?: UseRegistrationsOptions
) {
  const [registeredStates, setRegisteredStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Determine which storage mode to use
  const useClientStorage = !!clientId

  // Load registered states on mount
  useEffect(() => {
    const controller = new AbortController()
    loadRegistrations(controller.signal)

    return () => {
      controller.abort()
    }
  }, [analysisId, clientId])

  const loadRegistrations = async (signal?: AbortSignal) => {
    try {
      setLoading(true)

      let response
      if (useClientStorage) {
        // Load from client
        response = await apiClient.get(`/api/v1/clients/${clientId}`, { signal })
        if (signal?.aborted) return
        setRegisteredStates(response.data.registered_states || [])
      } else {
        // Load from analysis
        response = await apiClient.get(`/api/v1/analyses/${analysisId}/registrations`, { signal })
        if (signal?.aborted) return
        setRegisteredStates(response.data.registered_states || [])
      }
    } catch (error: any) {
      // Ignore abort errors - component unmounted
      if (error?.name === 'CanceledError' || signal?.aborted) return

      console.error('Failed to load registrations:', error)
      // Don't show error toast for 404 (analysis might not have registrations yet)
      if (error.response?.status !== 404) {
        toast({
          title: 'Error',
          description: 'Failed to load state registrations',
          variant: 'destructive'
        })
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const toggleRegistration = useCallback(async (stateCode: string) => {
    const isCurrentlyRegistered = registeredStates.includes(stateCode)
    const newRegisteredStates = isCurrentlyRegistered
      ? registeredStates.filter(s => s !== stateCode)
      : [...registeredStates, stateCode].sort()

    // Optimistic update
    setRegisteredStates(newRegisteredStates)

    try {
      setSaving(true)

      if (useClientStorage) {
        // Save to client
        await apiClient.patch(`/api/v1/clients/${clientId}`, {
          registered_states: newRegisteredStates,
          current_registration_count: newRegisteredStates.length
        })
      } else {
        // Save to analysis
        await apiClient.patch(`/api/v1/analyses/${analysisId}/registrations`, {
          registered_states: newRegisteredStates
        })
      }

      toast({
        title: 'Success',
        description: isCurrentlyRegistered
          ? `Removed registration for ${stateCode}`
          : `Added registration for ${stateCode}`
      })

      if (options?.onUpdate) {
        await options.onUpdate()
      }
    } catch (error: any) {
      // Revert on error
      setRegisteredStates(registeredStates)
      console.error('Failed to update registration:', error)
      toast({
        title: 'Error',
        description: 'Failed to update registration',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }, [analysisId, clientId, useClientStorage, registeredStates, options])

  const setMultipleRegistrations = useCallback(async (stateCodes: string[]) => {
    const sortedStates = [...stateCodes].sort()

    // Optimistic update
    setRegisteredStates(sortedStates)

    try {
      setSaving(true)

      if (useClientStorage) {
        // Save to client
        await apiClient.patch(`/api/v1/clients/${clientId}`, {
          registered_states: sortedStates,
          current_registration_count: sortedStates.length
        })
      } else {
        // Save to analysis
        await apiClient.patch(`/api/v1/analyses/${analysisId}/registrations`, {
          registered_states: sortedStates
        })
      }

      toast({
        title: 'Success',
        description: `Updated registrations (${sortedStates.length} states)`
      })

      if (options?.onUpdate) {
        await options.onUpdate()
      }
    } catch (error: any) {
      // Reload on error
      loadRegistrations()
      console.error('Failed to update registrations:', error)
      toast({
        title: 'Error',
        description: 'Failed to update registrations',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }, [analysisId, clientId, useClientStorage, options])

  const refresh = useCallback(() => {
    loadRegistrations()
  }, [analysisId, clientId])

  return {
    registeredStates,
    loading,
    saving,
    toggleRegistration,
    setMultipleRegistrations,
    refresh,
    isClientLinked: useClientStorage
  }
}
