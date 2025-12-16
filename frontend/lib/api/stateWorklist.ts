import apiClient from './client'

// --- State Assessment Types ---

export interface StateAssessment {
  id: string
  client_id: string
  engagement_id?: string
  analysis_id?: string
  organization_id: string
  state: string
  nexus_status: 'unknown' | 'needs_data' | 'no_nexus' | 'approaching' | 'has_nexus' | 'excluded'
  nexus_type?: 'economic' | 'physical' | 'both'
  nexus_reasons: string[]
  first_exposure_date?: string
  threshold_percentage?: number
  total_sales?: number
  estimated_liability?: number
  confidence_level?: 'high' | 'medium' | 'low'
  notes?: string
  assessed_at?: string
  assessed_by?: string
  created_at: string
  updated_at: string
  current_action?: StateAction
}

export interface StateAssessmentCreate {
  client_id: string
  state: string
  engagement_id?: string
  analysis_id?: string
  nexus_status?: string
  nexus_type?: string
  nexus_reasons?: string[]
  first_exposure_date?: string
  threshold_percentage?: number
  total_sales?: number
  estimated_liability?: number
  confidence_level?: string
  notes?: string
}

export interface StateAssessmentUpdate {
  nexus_status?: string
  nexus_type?: string
  nexus_reasons?: string[]
  first_exposure_date?: string
  threshold_percentage?: number
  total_sales?: number
  estimated_liability?: number
  confidence_level?: string
  notes?: string
}

// --- State Action Types ---

export type ActionType = 'register' | 'vda' | 'file_back_returns' | 'marketplace_exception' | 'monitor' | 'no_action'
export type ActionStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete'

export interface StateAction {
  id: string
  state_assessment_id: string
  organization_id: string
  action_type: ActionType
  action_status: ActionStatus
  blocked_reason?: string
  blocked_since?: string
  assigned_to?: string
  target_date?: string
  strategy_notes?: string
  registration_effective_date?: string
  vda_submission_date?: string
  vda_approval_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  tasks: StateActionTask[]
}

export interface StateActionCreate {
  state_assessment_id: string
  action_type: ActionType
  action_status?: ActionStatus
  assigned_to?: string
  target_date?: string
  strategy_notes?: string
}

export interface StateActionUpdate {
  action_type?: ActionType
  action_status?: ActionStatus
  blocked_reason?: string
  blocked_since?: string
  assigned_to?: string
  target_date?: string
  strategy_notes?: string
  registration_effective_date?: string
  vda_submission_date?: string
  vda_approval_date?: string
}

// --- State Action Task Types ---

export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'skipped'

export interface StateActionTask {
  id: string
  state_action_id: string
  title: string
  description?: string
  status: TaskStatus
  assigned_to?: string
  due_date?: string
  completed_at?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface StateActionTaskCreate {
  state_action_id: string
  title: string
  description?: string
  status?: TaskStatus
  assigned_to?: string
  due_date?: string
  sort_order?: number
}

export interface StateActionTaskUpdate {
  title?: string
  description?: string
  status?: TaskStatus
  assigned_to?: string
  due_date?: string
  sort_order?: number
}

// --- Worklist Types ---

export interface StateWorklistItem {
  id: string
  state: string
  nexus_status: string
  nexus_type?: string
  nexus_reasons: string[]
  estimated_liability?: number
  threshold_percentage?: number
  first_exposure_date?: string
  action_id?: string
  action_type?: ActionType
  action_status?: ActionStatus
  target_date?: string
  blocked_reason?: string
  tasks_total: number
  tasks_complete: number
}

export interface StateWorklistSummary {
  total_states: number
  states_with_nexus: number
  states_approaching: number
  states_no_nexus: number
  states_unknown: number
  actions_not_started: number
  actions_in_progress: number
  actions_blocked: number
  actions_complete: number
  total_estimated_liability: number
}

export interface StateWorklistResponse {
  items: StateWorklistItem[]
  summary: StateWorklistSummary
}

// --- API Functions ---

// State Worklist
export async function getStateWorklist(
  clientId: string,
  filters?: { nexus_status?: string; action_status?: string }
): Promise<StateWorklistResponse> {
  const params = new URLSearchParams()
  if (filters?.nexus_status) params.append('nexus_status', filters.nexus_status)
  if (filters?.action_status) params.append('action_status', filters.action_status)
  const queryString = params.toString()
  const url = `/api/v1/clients/${clientId}/states${queryString ? `?${queryString}` : ''}`
  const response = await apiClient.get(url)
  return response.data
}

// State Assessments
export async function createStateAssessment(
  clientId: string,
  data: StateAssessmentCreate
): Promise<StateAssessment> {
  const response = await apiClient.post(`/api/v1/clients/${clientId}/states`, data)
  return response.data
}

export async function getStateAssessment(
  clientId: string,
  state: string
): Promise<StateAssessment> {
  const response = await apiClient.get(`/api/v1/clients/${clientId}/states/${state}`)
  return response.data
}

export async function updateStateAssessment(
  clientId: string,
  state: string,
  data: StateAssessmentUpdate
): Promise<StateAssessment> {
  const response = await apiClient.patch(`/api/v1/clients/${clientId}/states/${state}`, data)
  return response.data
}

export async function deleteStateAssessment(
  clientId: string,
  state: string
): Promise<void> {
  await apiClient.delete(`/api/v1/clients/${clientId}/states/${state}`)
}

// State Actions
export async function createStateAction(
  clientId: string,
  state: string,
  data: StateActionCreate,
  autoCreateTasks: boolean = true
): Promise<StateAction> {
  const response = await apiClient.post(
    `/api/v1/clients/${clientId}/states/${state}/actions?auto_create_tasks=${autoCreateTasks}`,
    data
  )
  return response.data
}

export async function updateStateAction(
  clientId: string,
  state: string,
  actionId: string,
  data: StateActionUpdate
): Promise<StateAction> {
  const response = await apiClient.patch(
    `/api/v1/clients/${clientId}/states/${state}/actions/${actionId}`,
    data
  )
  return response.data
}

export async function deleteStateAction(
  clientId: string,
  state: string,
  actionId: string
): Promise<void> {
  await apiClient.delete(`/api/v1/clients/${clientId}/states/${state}/actions/${actionId}`)
}

// State Action Tasks
export async function createActionTask(
  clientId: string,
  state: string,
  actionId: string,
  data: StateActionTaskCreate
): Promise<StateActionTask> {
  const response = await apiClient.post(
    `/api/v1/clients/${clientId}/states/${state}/actions/${actionId}/tasks`,
    data
  )
  return response.data
}

export async function updateActionTask(
  clientId: string,
  state: string,
  actionId: string,
  taskId: string,
  data: StateActionTaskUpdate
): Promise<StateActionTask> {
  const response = await apiClient.patch(
    `/api/v1/clients/${clientId}/states/${state}/actions/${actionId}/tasks/${taskId}`,
    data
  )
  return response.data
}

export async function deleteActionTask(
  clientId: string,
  state: string,
  actionId: string,
  taskId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/clients/${clientId}/states/${state}/actions/${actionId}/tasks/${taskId}`
  )
}

// Import from Analysis
export async function importStatesFromAnalysis(
  clientId: string,
  analysisId: string
): Promise<{ imported: number; skipped: number; total_states: number }> {
  const response = await apiClient.post(
    `/api/v1/clients/${clientId}/states/import-from-analysis?analysis_id=${analysisId}`
  )
  return response.data
}

// --- Display Helpers ---

export const NEXUS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unknown: { label: 'Unknown', color: 'gray' },
  needs_data: { label: 'Needs Data', color: 'yellow' },
  no_nexus: { label: 'No Nexus', color: 'green' },
  approaching: { label: 'Approaching', color: 'orange' },
  has_nexus: { label: 'Has Nexus', color: 'red' },
  excluded: { label: 'Excluded', color: 'gray' },
}

export const ACTION_TYPE_LABELS: Record<ActionType, { label: string; description: string }> = {
  register: { label: 'Register', description: 'Register for sales tax collection' },
  vda: { label: 'VDA', description: 'Voluntary Disclosure Agreement' },
  file_back_returns: { label: 'File Back Returns', description: 'File delinquent returns' },
  marketplace_exception: { label: 'Marketplace', description: 'Marketplace facilitator exception' },
  monitor: { label: 'Monitor', description: 'Monitor threshold progress' },
  no_action: { label: 'No Action', description: 'No action required' },
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  blocked: { label: 'Blocked', color: 'red' },
  complete: { label: 'Complete', color: 'green' },
}

export const TASK_STATUS_LABELS: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  complete: { label: 'Complete', color: 'green' },
  skipped: { label: 'Skipped', color: 'gray' },
}
