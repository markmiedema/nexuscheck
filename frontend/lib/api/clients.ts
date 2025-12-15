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
  remote_employee_state_dates?: Record<string, string>
  has_inventory_3pl?: boolean
  inventory_3pl_states?: string[]
  inventory_3pl_state_dates?: Record<string, string>
  estimated_annual_revenue?: string
  transaction_volume?: string
  current_registration_count?: number
  registered_states?: string[]
  discovery_completed_at?: string
  discovery_notes?: string

  // Tech integration fields (specific selections for integrations)
  erp_system?: string
  ecommerce_platform?: string
  tax_engine?: string

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

// --- Client Overview Types ---

export interface NextAction {
  action: string
  action_type: string
  priority: 'high' | 'medium' | 'low'
  target_url?: string
  context?: string
  due_date?: string
}

export interface Deadline {
  id?: string
  title: string
  due_date: string
  deadline_type: string
  state?: string
  days_until: number
  is_overdue: boolean
  client_name?: string
}

export interface BlockingItem {
  item: string
  category: string
  since?: string
  blocking_states: string[]
}

export interface StatesSummary {
  total_with_nexus: number
  needing_action: number
  approaching_threshold: number
  in_progress: number
  complete: number
  states_needing_action: string[]
}

export interface StageInfo {
  current_stage: string
  stage_progress: number
  stage_started_at?: string
  stages_completed: string[]
}

export interface EngagementSummary {
  id: string
  title: string
  engagement_type?: string
  stage: string
  status: string
  next_milestone_name?: string
  next_milestone_date?: string
}

export interface IntakeProgress {
  total_items: number
  completed_items: number
  completion_percentage: number
  missing_required: string[]
}

export interface ClientOverview {
  client_id: string
  company_name: string
  lifecycle_status: string
  stage_info: StageInfo
  next_action?: NextAction
  secondary_actions: NextAction[]
  upcoming_deadlines: Deadline[]
  overdue_count: number
  states_summary: StatesSummary
  blocking_items: BlockingItem[]
  is_blocked: boolean
  active_engagement?: EngagementSummary
  intake_progress?: IntakeProgress
  last_activity_at?: string
  last_analysis_at?: string
}

export interface IntakeItem {
  id: string
  client_id: string
  organization_id: string
  engagement_id?: string
  category: string
  item_key: string
  label: string
  description?: string
  is_required: boolean
  status: string
  assigned_to?: string
  due_date?: string
  requested_at?: string
  received_at?: string
  validated_at?: string
  uploaded_files: Array<{ url: string; filename: string; uploaded_at: string }>
  notes?: string
  created_at: string
  updated_at: string
}

export interface IntakeStatus {
  total_items: number
  completed_items: number
  completion_percentage: number
  by_category: Record<string, { total: number; completed: number; status: string }>
  blocking_items: IntakeItem[]
}

// --- Client Overview API Functions ---

export async function getClientOverview(clientId: string): Promise<ClientOverview> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/overview`)
  return response.data
}

export async function getClientIntakeItems(clientId: string): Promise<IntakeItem[]> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/intake`)
  return response.data
}

export async function initializeClientIntake(clientId: string, engagementId?: string): Promise<IntakeItem[]> {
  const response = await apiClient.post(`/api/v1/clients/${clientId}/intake/initialize`, null, {
    params: engagementId ? { engagement_id: engagementId } : undefined
  })
  return response.data
}

export async function updateClientIntakeItem(
  clientId: string,
  itemId: string,
  data: { status?: string; due_date?: string; assigned_to?: string; notes?: string }
): Promise<IntakeItem> {
  const response = await apiClient.patch(`/api/v1/clients/${clientId}/intake/${itemId}`, data)
  return response.data
}

export async function getClientIntakeStatus(clientId: string): Promise<IntakeStatus> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/intake/status`)
  return response.data
}
