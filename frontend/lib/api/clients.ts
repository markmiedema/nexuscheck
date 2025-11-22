import apiClient from './client'

// --- 1. New Data Structures ---
export interface BusinessProfile {
  is_marketplace_seller: boolean
  marketplace_channels: string[]
  percent_marketplace_revenue?: number
  sells_tpp: boolean
  sells_saas: boolean
  sells_digital_goods: boolean
  has_inventory_3pl: boolean
  uses_fba: boolean
}

export interface TechStack {
  erp_system?: string
  ecommerce_platform?: string
  billing_system?: string
  tax_engine?: string
  data_hygiene_score?: number
}

// --- 2. Updated Client Interfaces ---
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
  status: string // e.g. 'prospect', 'active', 'paused'
  lifecycle_status?: string // 'prospect', 'scoping', 'active', 'inactive', 'churned'

  // Nested Objects (Now the frontend knows these exist!)
  business_profile?: BusinessProfile
  tech_stack?: TechStack

  // Discovery Profile Fields
  channels?: string[]
  product_types?: string[]
  systems?: string[]  // Tech systems from discovery (renamed from tech_stack to avoid collision)
  has_remote_employees?: boolean
  remote_employee_states?: string[]
  has_inventory_3pl?: boolean
  inventory_3pl_states?: string[]
  estimated_annual_revenue?: string
  transaction_volume?: string
  current_registration_count?: number
  registered_states?: string[]
  discovery_completed_at?: string
  discovery_notes?: string

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
  lifecycle_status?: string
  // Note: business_profile and tech_stack removed from creation
  // Business details are captured during the Discovery meeting
}

// --- 3. API Functions (Keep these mostly the same) ---

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
