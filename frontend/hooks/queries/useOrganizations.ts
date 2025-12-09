import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  getCurrentOrganization,
  updateOrganization,
  getCurrentUserRole,
  listOrganizationMembers,
  inviteOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  type Organization,
  type OrganizationMember,
  type UpdateOrganizationData,
  type InviteMemberData,
  type UpdateMemberRoleData,
  type UserProfile,
  type UpdateProfileData,
} from '@/lib/api/organizations'
import { toast } from 'sonner'

/**
 * Fetch the current user's organization
 */
export function useOrganization() {
  return useQuery({
    queryKey: queryKeys.organizations.current(),
    queryFn: getCurrentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutes - org data doesn't change often
  })
}

/**
 * Update the current organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateOrganizationData) => updateOrganization(data),
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(queryKeys.organizations.current(), updatedOrg)
      toast.success('Organization updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update organization')
    },
  })
}

/**
 * Fetch the current user's role in their organization
 */
export function useUserRole() {
  return useQuery({
    queryKey: queryKeys.organizations.role(),
    queryFn: getCurrentUserRole,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Check if the current user has admin permissions (owner or admin role)
 */
export function useIsAdmin() {
  const { data: roleData } = useUserRole()
  return roleData?.role === 'owner' || roleData?.role === 'admin'
}

/**
 * Fetch organization members
 */
export function useOrganizationMembers() {
  return useQuery({
    queryKey: queryKeys.organizations.members(),
    queryFn: listOrganizationMembers,
  })
}

/**
 * Invite a new member to the organization
 */
export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteMemberData) => inviteOrganizationMember(data),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() })
      toast.success(`Invitation sent to ${newMember.invited_email}`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send invitation')
    },
  })
}

/**
 * Update a member's role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateMemberRoleData }) =>
      updateMemberRole(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() })
      toast.success('Member role updated')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update member role')
    },
  })
}

/**
 * Remove a member from the organization
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => removeOrganizationMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() })
      toast.success('Member removed from organization')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove member')
    },
  })
}

/**
 * Fetch the current user's profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.organizations.profile(),
    queryFn: getCurrentUserProfile,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Update the current user's profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateCurrentUserProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.organizations.profile(), updatedProfile)
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile')
    },
  })
}
