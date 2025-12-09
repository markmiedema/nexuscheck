/**
 * Organizations API - Multi-tenancy support for team collaboration
 */
import apiClient from './client'

// --- Organization Types ---

export interface PortalBranding {
  logo_url?: string | null
  favicon_url?: string | null
  primary_color?: string
  company_name?: string | null
  tagline?: string | null
  support_email?: string | null
  support_phone?: string | null
  custom_domain?: string | null
}

export interface ReportBranding {
  logo_url?: string | null
  company_name?: string | null
  address_block?: string | null
  footer_text?: string | null
}

export interface OrganizationSettings {
  portal_branding?: PortalBranding
  report_branding?: ReportBranding
}

export interface Organization {
  id: string
  name: string
  slug?: string | null
  owner_user_id: string
  billing_email?: string | null
  subscription_tier: string
  subscription_status: string
  settings?: OrganizationSettings | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string | null
  role: 'owner' | 'admin' | 'staff' | 'viewer'
  invited_email?: string | null
  invited_by_user_id?: string | null
  invited_at?: string | null
  accepted_at?: string | null
  last_active_at?: string | null
  created_at: string
  updated_at: string
  // Joined user info
  user_email?: string | null
  user_name?: string | null
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  billing_email?: string
  settings?: OrganizationSettings
}

export interface InviteMemberData {
  email: string
  role?: 'admin' | 'staff' | 'viewer'
}

export interface UpdateMemberRoleData {
  role: 'admin' | 'staff' | 'viewer'
}

// --- API Functions ---

/**
 * Get the current user's organization
 */
export async function getCurrentOrganization(): Promise<Organization> {
  const response = await apiClient.get('/api/v1/organizations/current')
  return response.data
}

/**
 * Update the current organization
 */
export async function updateOrganization(data: UpdateOrganizationData): Promise<Organization> {
  const response = await apiClient.put('/api/v1/organizations/current', data)
  return response.data
}

/**
 * Get the current user's role in their organization
 */
export async function getCurrentUserRole(): Promise<{ role: string }> {
  const response = await apiClient.get('/api/v1/organizations/current/role')
  return response.data
}

/**
 * List all members of the current organization
 */
export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
  const response = await apiClient.get('/api/v1/organizations/current/members')
  return response.data
}

/**
 * Invite a new member to the organization
 */
export async function inviteOrganizationMember(data: InviteMemberData): Promise<OrganizationMember> {
  const response = await apiClient.post('/api/v1/organizations/current/members/invite', data)
  return response.data
}

/**
 * Update a member's role
 */
export async function updateMemberRole(memberId: string, data: UpdateMemberRoleData): Promise<OrganizationMember> {
  const response = await apiClient.put(`/api/v1/organizations/current/members/${memberId}/role`, data)
  return response.data
}

/**
 * Remove a member from the organization
 */
export async function removeOrganizationMember(memberId: string): Promise<void> {
  await apiClient.delete(`/api/v1/organizations/current/members/${memberId}`)
}
