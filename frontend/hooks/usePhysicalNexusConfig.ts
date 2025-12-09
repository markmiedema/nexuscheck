import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'
import { createClientNote } from '@/lib/api/clients'

export type PhysicalNexusType = 'remote_employee' | 'inventory_3pl' | 'office' | 'other'

export interface PhysicalNexusConfig {
  state_code: string
  nexus_date: string
  reason: string
  nexus_type?: PhysicalNexusType
  registration_date?: string
  permit_number?: string
  notes?: string
  created_at?: string
}

export interface PhysicalNexusFormData {
  state_code: string
  nexus_date: Date
  reason: string
  nexus_type: PhysicalNexusType
  registration_date?: Date
  permit_number?: string
  notes?: string
}

export interface UsePhysicalNexusConfigOptions {
  onRecalculated?: () => void | Promise<void>
  clientId?: string  // If provided, activity notes will be logged to client timeline
}

export function usePhysicalNexusConfig(
  analysisId: string,
  options?: UsePhysicalNexusConfigOptions
) {
  const [configs, setConfigs] = useState<PhysicalNexusConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingState, setEditingState] = useState<string | null>(null)
  const [formData, setFormData] = useState<PhysicalNexusFormData | null>(null)

  // Load configs on mount
  useEffect(() => {
    const controller = new AbortController()
    loadConfigs(controller.signal)

    return () => {
      controller.abort()
    }
  }, [analysisId])

  const loadConfigs = async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const response = await apiClient.get(
        `/api/v1/analyses/${analysisId}/physical-nexus`,
        { signal }
      )

      // Don't update state if request was aborted
      if (signal?.aborted) return

      setConfigs(response.data)
    } catch (error: any) {
      // Ignore abort errors - component unmounted
      if (error?.name === 'CanceledError' || signal?.aborted) return

      console.error('Failed to load physical nexus configs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load physical nexus configurations',
        variant: 'destructive'
      })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const addOrUpdateNexus = async (data: PhysicalNexusFormData) => {
    try {
      const payload = {
        state_code: data.state_code,
        nexus_date: data.nexus_date.toISOString().split('T')[0],
        reason: data.reason,
        nexus_type: data.nexus_type,
        registration_date: data.registration_date
          ? data.registration_date.toISOString().split('T')[0]
          : null,
        permit_number: data.permit_number || null,
        notes: data.notes || null
      }

      const isUpdate = !!editingState
      const stateCode = isUpdate ? editingState : data.state_code

      if (isUpdate) {
        // Update existing
        await apiClient.patch(
          `/api/v1/analyses/${analysisId}/physical-nexus/${editingState}`,
          payload
        )
        toast({
          title: 'Success',
          description: `Physical nexus updated for ${editingState}`
        })
      } else {
        // Create new
        await apiClient.post(
          `/api/v1/analyses/${analysisId}/physical-nexus`,
          payload
        )
        toast({
          title: 'Success',
          description: `Physical nexus added for ${data.state_code}`
        })
      }

      await loadConfigs()
      cancelForm()

      // ENHANCEMENT: Trigger analysis recalculation
      // Physical nexus changes should update state results immediately
      await triggerRecalculation()

      // Run non-critical operations in background (don't block UI)
      const action = isUpdate ? 'Updated' : 'Added'
      Promise.all([
        syncToClientProfile(stateCode!, payload.nexus_date, isUpdate ? 'update' : 'add', data.nexus_type),
        logActivityNote(`${action} physical nexus for ${stateCode}: ${data.reason}`, true)
      ]).catch(err => console.warn('Background sync failed:', err))
    } catch (error: any) {
      console.error('Failed to save physical nexus:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save physical nexus',
        variant: 'destructive'
      })
      throw error
    }
  }

  const editNexus = (stateCode: string) => {
    const config = configs.find(c => c.state_code === stateCode)
    if (config) {
      setFormData({
        state_code: config.state_code,
        nexus_date: new Date(config.nexus_date),
        reason: config.reason,
        nexus_type: config.nexus_type || 'other',
        registration_date: config.registration_date
          ? new Date(config.registration_date)
          : undefined,
        permit_number: config.permit_number,
        notes: config.notes
      })
      setEditingState(stateCode)
      setShowForm(true)
    }
  }

  const deleteNexus = async (stateCode: string) => {
    if (!confirm(`Delete physical nexus for ${stateCode}?`)) return

    try {
      await apiClient.delete(
        `/api/v1/analyses/${analysisId}/physical-nexus/${stateCode}`
      )
      toast({
        title: 'Success',
        description: `Physical nexus deleted for ${stateCode}`
      })
      await loadConfigs()

      // ENHANCEMENT: Trigger recalculation after deletion
      await triggerRecalculation()

      // Run non-critical operations in background (don't block UI)
      Promise.all([
        syncToClientProfile(stateCode, '', 'delete'),
        logActivityNote(`Removed physical nexus for ${stateCode}`, true)
      ]).catch(err => console.warn('Background sync failed:', err))
    } catch (error: any) {
      console.error('Failed to delete physical nexus:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete physical nexus',
        variant: 'destructive'
      })
      throw error
    }
  }

  const exportConfig = async () => {
    try {
      const response = await apiClient.get(
        `/api/v1/analyses/${analysisId}/physical-nexus/export`
      )

      // Download as JSON file
      const blob = new Blob(
        [JSON.stringify(response.data, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `physical-nexus-${analysisId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Configuration exported successfully'
      })
    } catch (error: any) {
      console.error('Failed to export config:', error)
      toast({
        title: 'Error',
        description: 'Failed to export configuration',
        variant: 'destructive'
      })
      throw error
    }
  }

  const importConfig = async (file: File) => {
    try {
      const text = await file.text()
      const config = JSON.parse(text)

      const response = await apiClient.post(
        `/api/v1/analyses/${analysisId}/physical-nexus/import`,
        { configs: config }
      )

      await loadConfigs()

      toast({
        title: 'Success',
        description: `Imported ${response.data.imported_count} states, updated ${response.data.updated_count} states`
      })

      // ENHANCEMENT: Trigger recalculation after import
      await triggerRecalculation()

      // Log activity note in background (don't block UI)
      logActivityNote(`Imported physical nexus config: ${response.data.imported_count} new, ${response.data.updated_count} updated`, true)
        .catch(err => console.warn('Background note failed:', err))

      if (response.data.errors.length > 0) {
        console.error('Import errors:', response.data.errors)
        toast({
          title: 'Warning',
          description: `${response.data.errors.length} states had errors`,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Failed to import config:', error)
      toast({
        title: 'Error',
        description: 'Failed to import configuration. Check file format.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingState(null)
    setFormData(null)
  }

  // Sync physical nexus state to client's Discovery profile
  const syncToClientProfile = async (stateCode: string, nexusDate: string, action: 'add' | 'update' | 'delete', nexusType: PhysicalNexusType = 'other') => {
    if (!options?.clientId) return

    try {
      // Fetch current client data
      const clientResponse = await apiClient.get(`/api/v1/clients/${options.clientId}`)
      const client = clientResponse.data

      // Get current states and dates for each category
      let employeeStates: string[] = client.remote_employee_states || []
      let employeeStateDates: Record<string, string> = client.remote_employee_state_dates || {}
      let inventoryStates: string[] = client.inventory_3pl_states || []
      let inventoryStateDates: Record<string, string> = client.inventory_3pl_state_dates || {}
      let officeStates: string[] = client.office_states || []
      let officeStateDates: Record<string, string> = client.office_state_dates || {}

      if (action === 'delete') {
        // Remove state from all categories
        employeeStates = employeeStates.filter(s => s !== stateCode)
        delete employeeStateDates[stateCode]
        inventoryStates = inventoryStates.filter(s => s !== stateCode)
        delete inventoryStateDates[stateCode]
        officeStates = officeStates.filter(s => s !== stateCode)
        delete officeStateDates[stateCode]
      } else {
        // First remove from other categories if switching type
        employeeStates = employeeStates.filter(s => s !== stateCode)
        delete employeeStateDates[stateCode]
        inventoryStates = inventoryStates.filter(s => s !== stateCode)
        delete inventoryStateDates[stateCode]
        officeStates = officeStates.filter(s => s !== stateCode)
        delete officeStateDates[stateCode]

        // Then add to appropriate category based on explicit nexus type
        if (nexusType === 'remote_employee') {
          if (!employeeStates.includes(stateCode)) {
            employeeStates = [...employeeStates, stateCode]
          }
          employeeStateDates[stateCode] = nexusDate
        } else if (nexusType === 'inventory_3pl') {
          if (!inventoryStates.includes(stateCode)) {
            inventoryStates = [...inventoryStates, stateCode]
          }
          inventoryStateDates[stateCode] = nexusDate
        } else if (nexusType === 'office') {
          if (!officeStates.includes(stateCode)) {
            officeStates = [...officeStates, stateCode]
          }
          officeStateDates[stateCode] = nexusDate
        }
        // 'other' type doesn't sync to Discovery profile
      }

      // Update client with synced physical nexus info
      await apiClient.patch(`/api/v1/clients/${options.clientId}`, {
        has_remote_employees: employeeStates.length > 0,
        remote_employee_states: employeeStates,
        remote_employee_state_dates: employeeStateDates,
        has_inventory_3pl: inventoryStates.length > 0,
        inventory_3pl_states: inventoryStates,
        inventory_3pl_state_dates: inventoryStateDates,
        has_office: officeStates.length > 0,
        office_states: officeStates,
        office_state_dates: officeStateDates
      })

      const typeLabel = nexusType === 'remote_employee' ? 'employee' : nexusType === 'inventory_3pl' ? 'inventory' : nexusType === 'office' ? 'office' : 'other'
      console.log(`Synced physical nexus ${action} for ${stateCode} (${typeLabel}) to client Discovery profile`)
    } catch (error) {
      // Non-critical - log but don't fail the main operation
      console.warn('Failed to sync physical nexus to client profile:', error)
    }
  }

  // Log activity note to client timeline with optional results summary
  const logActivityNote = async (content: string, includeSummary: boolean = false) => {
    if (!options?.clientId) return
    try {
      let noteContent = content

      // Optionally fetch and append current analysis summary
      if (includeSummary) {
        try {
          const resultsResponse = await apiClient.get(`/api/v1/analyses/${analysisId}/results/summary`)
          const summary = resultsResponse.data?.summary
          if (summary) {
            const liability = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(summary.total_estimated_liability || 0)
            noteContent += `. Analysis now shows ${summary.states_with_nexus || 0} states with nexus, ${liability} estimated liability`
          }
        } catch {
          // Continue without summary if fetch fails
        }
      }

      await createClientNote(options.clientId, {
        content: noteContent,
        note_type: 'analysis'
      })
    } catch {
      // Silently fail - note creation is not critical
      console.warn('Failed to create activity note')
    }
  }

  // ENHANCEMENT: Trigger analysis recalculation
  // The /recalculate endpoint is synchronous - it returns after calculation completes
  const triggerRecalculation = async () => {
    try {
      await apiClient.post(`/api/v1/analyses/${analysisId}/recalculate`)
      console.log('Analysis recalculation complete')

      // Call callback immediately - no polling needed since recalculate is synchronous
      if (options?.onRecalculated) {
        await options.onRecalculated()
      }
    } catch (error: any) {
      // Non-critical - log but don't fail the operation
      console.warn('Failed to trigger recalculation:', error)
      // Optionally show toast notification
      toast({
        title: 'Note',
        description: 'Physical nexus saved. Refresh page to see updated results.',
        variant: 'default'
      })
    }
  }

  return {
    configs,
    loading,
    showForm,
    setShowForm,
    editingState,
    formData,
    addOrUpdateNexus,
    editNexus,
    deleteNexus,
    exportConfig,
    importConfig,
    cancelForm,
    triggerRecalculation  // ENHANCEMENT: Expose for manual use if needed
  }
}
