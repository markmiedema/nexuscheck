/**
 * CRM Clients API
 */
import apiClient from './client'
import { Analysis } from './analyses'

export interface Client {
  id: string
  user_id: string
  company_name: string
  industry?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
  created_at: string
  updated_at?: string
}

export interface ClientNote {
  id: string
  client_id: string
  user_id: string
  title: string
  content: string
  note_type: 'general' | 'discovery' | 'call' | 'email' | 'internal'
  created_at: string
}

export interface ClientCreateData {
  company_name: string
  industry?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
}

export interface ClientNoteCreateData {
  title: string
  content: string
  note_type: string
}

// ============================================================================
// CLIENT ENDPOINTS
// ============================================================================

export async function createClient(data: ClientCreateData): Promise<Client> {
  const response = await apiClient.post('/api/v1/clients', data)
  return response.data
}

export async function listClients(params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<Client[]> {
  const response = await apiClient.get('/api/v1/clients', { params })
  return response.data
}

export async function getClient(clientId: string): Promise<Client> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}`)
  return response.data
}

export async function updateClient(
  clientId: string,
  data: Partial<ClientCreateData>
): Promise<Client> {
  const response = await apiClient.patch(`/api/v1/clients/${clientId}`, data)
  return response.data
}

export async function deleteClient(clientId: string): Promise<void> {
  await apiClient.delete(`/api/v1/clients/${clientId}`)
}

// ============================================================================
// CLIENT NOTES ENDPOINTS
// ============================================================================

export async function getClientNotes(clientId: string): Promise<ClientNote[]> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/notes`)
  return response.data
}

export async function createClientNote(
  clientId: string,
  data: ClientNoteCreateData
): Promise<ClientNote> {
  const response = await apiClient.post(`/api/v1/clients/${clientId}/notes`, data)
  return response.data
}

// ============================================================================
// CLIENT ANALYSES
// ============================================================================

export async function getClientAnalyses(clientId: string): Promise<Analysis[]> {
  // Filter the main analysis list by client_id
  const response = await apiClient.get(`/api/v1/analyses`, {
    params: { client_id: clientId }
  })
  return response.data.analyses || []
}
