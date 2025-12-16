import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listClientNotes,
  createClientNote,
  listClientAnalyses,
  getClientOverview,
  getClientIntakeItems,
  initializeClientIntake,
  updateClientIntakeItem,
  getClientIntakeStatus,
  type Client,
  type CreateClientData,
  type ClientNote,
  type CreateClientNoteData,
  type ClientAnalysis,
  type ClientOverview,
  type IntakeItem,
  type IntakeStatus,
} from '@/lib/api/clients'
import { toast } from 'sonner'

/**
 * Fetch all clients
 */
export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.lists(),
    queryFn: listClients,
  })
}

/**
 * Fetch a single client by ID
 */
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id!),
    queryFn: () => getClient(id!),
    enabled: !!id,
  })
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientData) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
      toast.success('Client created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create client')
    },
  })
}

/**
 * Update an existing client
 */
export function useUpdateClient(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<CreateClientData>) => updateClient(id, data),
    onSuccess: (updatedClient) => {
      // Update the cache with the new data
      queryClient.setQueryData(queryKeys.clients.detail(id), updatedClient)
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
      toast.success('Client updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update client')
    },
  })
}

/**
 * Delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
      queryClient.removeQueries({ queryKey: queryKeys.clients.detail(deletedId) })
      toast.success('Client deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete client')
    },
  })
}

/**
 * Fetch notes for a client
 */
export function useClientNotes(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.notes(clientId!),
    queryFn: () => listClientNotes(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Create a note for a client
 */
export function useCreateClientNote(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientNoteData) => createClientNote(clientId, data),
    onSuccess: (newNote) => {
      // Optimistically add to cache
      queryClient.setQueryData<ClientNote[]>(
        queryKeys.clients.notes(clientId),
        (old) => (old ? [newNote, ...old] : [newNote])
      )
      toast.success('Note saved successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save note')
    },
  })
}

/**
 * Fetch analyses for a client
 */
export function useClientAnalyses(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.analyses(clientId!),
    queryFn: () => listClientAnalyses(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Fetch client overview (stage, next action, deadlines, states summary)
 */
export function useClientOverview(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.overview(clientId!),
    queryFn: () => getClientOverview(clientId!),
    enabled: !!clientId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

/**
 * Fetch intake items for a client
 */
export function useClientIntakeItems(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.intake(clientId!),
    queryFn: () => getClientIntakeItems(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Fetch intake status summary for a client
 */
export function useClientIntakeStatus(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.intakeStatus(clientId!),
    queryFn: () => getClientIntakeStatus(clientId!),
    enabled: !!clientId,
  })
}

/**
 * Initialize default intake items for a client
 */
export function useInitializeClientIntake(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (engagementId?: string) => initializeClientIntake(clientId, engagementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.intake(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.intakeStatus(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.overview(clientId) })
      toast.success('Intake items initialized')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to initialize intake items')
    },
  })
}

/**
 * Update an intake item
 */
export function useUpdateClientIntakeItem(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { status?: string; due_date?: string; assigned_to?: string; notes?: string } }) =>
      updateClientIntakeItem(clientId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.intake(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.intakeStatus(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.overview(clientId) })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update intake item')
    },
  })
}
