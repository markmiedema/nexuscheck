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

  // Load registered states on mount
  useEffect(() => {
    const controller = new AbortController()
    loadRegistrations(controller.signal)

    return () => {
      controller.abort()
    }
  }, [analysisId, clientId])

  const loadRegistrations = async (signal?: AbortSignal) => {
    if (!clientId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/clients/${clientId}`, { signal })

      // Don't update state if request was aborted
      if (signal?.aborted) return

      setRegisteredStates(response.data.registered_states || [])
    } catch (error: any) {
      // Ignore abort errors - component unmounted
      if (error?.name === 'CanceledError' || signal?.aborted) return

      console.error('Failed to load registrations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load state registrations',
        variant: 'destructive'
      })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const toggleRegistration = useCallback(async (stateCode: string) => {
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Cannot update registrations without a linked client',
        variant: 'destructive'
      })
      return
    }

    const isCurrentlyRegistered = registeredStates.includes(stateCode)
    const newRegisteredStates = isCurrentlyRegistered
      ? registeredStates.filter(s => s !== stateCode)
      : [...registeredStates, stateCode].sort()

    // Optimistic update
    setRegisteredStates(newRegisteredStates)

    try {
      setSaving(true)
      await apiClient.patch(`/api/v1/clients/${clientId}`, {
        registered_states: newRegisteredStates,
        current_registration_count: newRegisteredStates.length
      })

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
  }, [clientId, registeredStates, options])

  const setMultipleRegistrations = useCallback(async (stateCodes: string[]) => {
    if (!clientId) {
      toast({
        title: 'Error',
        description: 'Cannot update registrations without a linked client',
        variant: 'destructive'
      })
      return
    }

    const sortedStates = [...stateCodes].sort()

    // Optimistic update
    setRegisteredStates(sortedStates)

    try {
      setSaving(true)
      await apiClient.patch(`/api/v1/clients/${clientId}`, {
        registered_states: sortedStates,
        current_registration_count: sortedStates.length
      })

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
  }, [clientId, options])

  const refresh = useCallback(() => {
    loadRegistrations()
  }, [clientId])

  return {
    registeredStates,
    loading,
    saving,
    toggleRegistration,
    setMultipleRegistrations,
    refresh
  }
}
