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
