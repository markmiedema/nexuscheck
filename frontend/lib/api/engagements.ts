import apiClient from './client'

export interface ScopeConfig {
  services?: string[]
  tier?: string
  pricing_model?: string
  estimated_fee?: number
  retainer_monthly?: number
  authorized_states?: string[]
  legacy?: boolean
}

export interface Engagement {
  id: string
  client_id: string
  user_id: string
  title: string
  status: 'draft' | 'sent' | 'signed' | 'archived' | 'cancelled'
  scope_config: ScopeConfig | null
  scope_summary: string | null
  document_url: string | null
  sent_at: string | null
  signed_at: string | null
  effective_date: string | null
  expiration_date: string | null
  created_at: string
  updated_at: string
  client_name?: string
  projects?: Array<{
    id: string
    client_company_name: string
    status: string
    created_at: string
  }>
}

export interface CreateEngagementData {
  client_id: string
  title: string
  status?: string
  scope_config?: ScopeConfig
  scope_summary?: string
  document_url?: string
  effective_date?: string
  expiration_date?: string
}

export interface UpdateEngagementData {
  title?: string
  status?: string
  scope_config?: ScopeConfig
  scope_summary?: string
  document_url?: string
  sent_at?: string
  signed_at?: string
  effective_date?: string
  expiration_date?: string
}

/**
 * List all engagements, optionally filtered by client
 */
export async function listEngagements(clientId?: string): Promise<Engagement[]> {
  const params = clientId ? `?client_id=${clientId}` : ''
  const response = await apiClient.get(`/api/v1/engagements${params}`)
  return response.data
}

/**
 * Get a single engagement by ID
 */
export async function getEngagement(engagementId: string): Promise<Engagement> {
  const response = await apiClient.get(`/api/v1/engagements/${engagementId}`)
  return response.data
}

/**
 * Get the active (signed) engagement for a client
 */
export async function getActiveEngagement(clientId: string): Promise<Engagement | null> {
  const response = await apiClient.get(`/api/v1/engagements/client/${clientId}/active`)
  return response.data
}

/**
 * Check if a project can be created for a client
 */
export async function canCreateProject(
  clientId: string,
  serviceType: string
): Promise<{
  allowed: boolean
  engagement_id: string | null
  reason: string
}> {
  const response = await apiClient.get(
    `/api/v1/engagements/client/${clientId}/can-create-project?service_type=${serviceType}`
  )
  return response.data
}

/**
 * Create a new engagement
 */
export async function createEngagement(data: CreateEngagementData): Promise<Engagement> {
  const response = await apiClient.post('/api/v1/engagements', data)
  return response.data
}

/**
 * Update an engagement
 */
export async function updateEngagement(
  engagementId: string,
  data: UpdateEngagementData
): Promise<Engagement> {
  const response = await apiClient.patch(`/api/v1/engagements/${engagementId}`, data)
  return response.data
}

/**
 * Delete an engagement (only if no linked projects)
 */
export async function deleteEngagement(engagementId: string): Promise<void> {
  await apiClient.delete(`/api/v1/engagements/${engagementId}`)
}
