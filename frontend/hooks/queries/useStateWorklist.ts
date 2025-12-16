import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  getStateWorklist,
  getStateAssessment,
  createStateAssessment,
  updateStateAssessment,
  deleteStateAssessment,
  createStateAction,
  updateStateAction,
  deleteStateAction,
  updateActionTask,
  importStatesFromAnalysis,
  type StateWorklistResponse,
  type StateAssessment,
  type StateAssessmentCreate,
  type StateAssessmentUpdate,
  type StateActionCreate,
  type StateActionUpdate,
  type StateAction,
  type StateActionTaskUpdate,
  type StateActionTask,
} from '@/lib/api/stateWorklist'

// --- Query Hooks ---

export function useStateWorklist(
  clientId: string,
  filters?: { nexus_status?: string; action_status?: string }
) {
  return useQuery<StateWorklistResponse>({
    queryKey: queryKeys.clients.stateWorklist(clientId),
    queryFn: () => getStateWorklist(clientId, filters),
    enabled: !!clientId,
  })
}

export function useStateAssessment(clientId: string, state: string) {
  return useQuery<StateAssessment>({
    queryKey: queryKeys.clients.stateDetail(clientId, state),
    queryFn: () => getStateAssessment(clientId, state),
    enabled: !!clientId && !!state,
  })
}

// --- Mutation Hooks ---

export function useCreateStateAssessment(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<StateAssessmentCreate, 'client_id'>) =>
      createStateAssessment(clientId, { ...data, client_id: clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      toast.success('State assessment created')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create state assessment')
    },
  })
}

export function useUpdateStateAssessment(clientId: string, state: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StateAssessmentUpdate) =>
      updateStateAssessment(clientId, state, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateDetail(clientId, state) })
      toast.success('State assessment updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update state assessment')
    },
  })
}

export function useDeleteStateAssessment(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (state: string) => deleteStateAssessment(clientId, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      toast.success('State assessment deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete state assessment')
    },
  })
}

// --- Action Mutation Hooks ---

export function useCreateStateAction(clientId: string, state: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, autoCreateTasks = true }: { data: Omit<StateActionCreate, 'state_assessment_id'>; autoCreateTasks?: boolean }) =>
      createStateAction(clientId, state, { ...data, state_assessment_id: '' }, autoCreateTasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateDetail(clientId, state) })
      toast.success('Action created')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create action')
    },
  })
}

export function useUpdateStateAction(clientId: string, state: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ actionId, data }: { actionId: string; data: StateActionUpdate }) =>
      updateStateAction(clientId, state, actionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateDetail(clientId, state) })
      toast.success('Action updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update action')
    },
  })
}

export function useDeleteStateAction(clientId: string, state: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (actionId: string) => deleteStateAction(clientId, state, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateDetail(clientId, state) })
      toast.success('Action deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete action')
    },
  })
}

// --- Task Mutation Hooks ---

export function useUpdateActionTask(clientId: string, state: string, actionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: StateActionTaskUpdate }) =>
      updateActionTask(clientId, state, actionId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateDetail(clientId, state) })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update task')
    },
  })
}

// --- Import Hook ---

export function useImportStatesFromAnalysis(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (analysisId: string) => importStatesFromAnalysis(clientId, analysisId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stateWorklist(clientId) })
      toast.success(`Imported ${result.imported} states (${result.skipped} already existed)`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to import states')
    },
  })
}

// Re-export types for convenience
export type {
  StateWorklistResponse,
  StateAssessment,
  StateAssessmentCreate,
  StateAssessmentUpdate,
  StateAction,
  StateActionCreate,
  StateActionUpdate,
  StateActionTask,
  StateActionTaskUpdate,
}
