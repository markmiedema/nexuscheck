import apiClient from './client'

// --- New Interfaces for CRM Upgrade ---
export interface BusinessProfile {
  is_marketplace_seller: boolean
  marketplace_channels: string[] // e.g. ['amazon', 'shopify']
  percent_marketplace_revenue?: number
  sells_tpp: boolean
  sells_saas: boolean
  sells_digital_goods: boolean
  sells_services?: boolean
  has_inventory_3pl?: boolean
  uses_fba: boolean
}

export interface TechStack {
  erp_system?: string
  ecommerce_platform?: string
  billing_system?: string
  tax_engine?: string
  data_hygiene_score?: number
}

// --- Updated Client Interfaces ---
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
  status?: 'prospect' | 'onboarding' | 'active' | 'churned'
  fiscal_year_end?: string

  // Nested Objects
  business_profile?: BusinessProfile
  tech_stack?: TechStack

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
  status?: string

  // New Optional Fields
  business_profile?: Partial<BusinessProfile>
  tech_stack?: Partial<TechStack>
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

export interface ClientAnalysis {
  id: string
  client_company_name: string
  status: string
  created_at: string
  updated_at: string
  analysis_period_start?: string
  analysis_period_end?: string
  total_liability?: number
  states_with_nexus?: number
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

export async function listClientAnalyses(clientId: string): Promise<ClientAnalysis[]> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/analyses`)
  return response.data
}
