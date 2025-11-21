import apiClient from './client'

export interface Client {
  id: string
  user_id: string
  company_name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  industry?: string
  website?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateClientData {
  company_name: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  industry?: string | null
  website?: string | null
  notes?: string | null
}

export interface ClientNote {
  id: string
  client_id: string
  user_id: string
  content: string
  note_type?: string
  created_at: string
  updated_at: string
}

export interface CreateClientNoteData {
  content: string
  note_type?: string
}

export async function listClients(): Promise<Client[]> {
  const response = await apiClient.get('/api/v1/clients')
  return response.data
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await apiClient.post('/api/v1/clients', data)
  return response.data
}

export async function getClient(id: string): Promise<Client> {
  const response = await apiClient.get(`/api/v1/clients/${id}`)
  return response.data
}

export async function updateClient(id: string, data: Partial<CreateClientData>): Promise<Client> {
  const response = await apiClient.patch(`/api/v1/clients/${id}`, data)
  return response.data
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/clients/${id}`)
}

export async function createClientNote(clientId: string, data: CreateClientNoteData): Promise<ClientNote> {
  const response = await apiClient.post(`/api/v1/clients/${clientId}/notes`, data)
  return response.data
}

export async function listClientNotes(clientId: string): Promise<ClientNote[]> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/notes`)
  return response.data
}
