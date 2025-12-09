'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useOrganizationMembers,
  useUserRole,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Users,
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Eye,
  Mail,
  Clock,
  Loader2,
  Trash2,
  Copy,
  Link,
} from 'lucide-react'
import type { OrganizationMember } from '@/lib/api/organizations'
import { toast } from 'sonner'

// Generate signup link with email pre-filled
const getInviteLink = (email: string) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/signup?email=${encodeURIComponent(email)}`
}

const copyInviteLink = async (email: string) => {
  const link = getInviteLink(email)
  try {
    await navigator.clipboard.writeText(link)
    toast.success('Invite link copied to clipboard')
  } catch {
    toast.error('Failed to copy link')
  }
}

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: ShieldCheck, color: 'text-amber-500', description: 'Full access + billing' },
  admin: { label: 'Admin', icon: Shield, color: 'text-blue-500', description: 'Full access + team management' },
  staff: { label: 'Staff', icon: User, color: 'text-green-500', description: 'Assigned clients & projects' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-gray-500', description: 'Read-only access' },
}

function MemberCard({
  member,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onRemove,
}: {
  member: OrganizationMember
  currentUserId: string
  currentUserRole: string
  onRoleChange: (memberId: string, newRole: 'admin' | 'staff' | 'viewer') => void
  onRemove: (memberId: string) => void
}) {
  const isPending = !member.user_id
  const isCurrentUser = member.user_id === currentUserId
  const roleConfig = ROLE_CONFIG[member.role]
  const RoleIcon = roleConfig.icon

  // Determine what actions the current user can take
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'
  const canChangeRole = canManage && !isCurrentUser && member.role !== 'owner'
  const canRemove = canManage && !isCurrentUser && member.role !== 'owner'

  // Get display name - prefer member_name, then user_name, then email
  const displayName = member.member_name || member.user_name || member.user_email || member.invited_email || 'Unknown'

  // Get initials for avatar
  const getInitials = () => {
    const name = member.member_name || member.user_name
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (member.user_email || member.invited_email) {
      return (member.user_email || member.invited_email || '??')[0].toUpperCase()
    }
    return '??'
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={isPending ? 'bg-muted' : 'bg-primary/10'}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {displayName}
            </span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">
                You
              </Badge>
            )}
            {isPending && (
              <Badge variant="secondary" className="text-xs">
                Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
            <span>{roleConfig.label}</span>
            {/* Show email if different from display name */}
            {(member.user_email || member.invited_email) && displayName !== (member.user_email || member.invited_email) && (
              <>
                <span>·</span>
                <span>{member.user_email || member.invited_email}</span>
              </>
            )}
            {isPending && member.invited_at && (
              <>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>Invited {new Date(member.invited_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {(canChangeRole || canRemove || isPending) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Copy invite link for pending members */}
            {isPending && member.invited_email && (
              <>
                <DropdownMenuItem
                  onClick={() => copyInviteLink(member.invited_email!)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invite Link
                </DropdownMenuItem>
                {(canChangeRole || canRemove) && <DropdownMenuSeparator />}
              </>
            )}
            {canChangeRole && (
              <>
                <DropdownMenuItem
                  onClick={() => onRoleChange(member.id, 'admin')}
                  disabled={member.role === 'admin'}
                >
                  <Shield className="mr-2 h-4 w-4 text-blue-500" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRoleChange(member.id, 'staff')}
                  disabled={member.role === 'staff'}
                >
                  <User className="mr-2 h-4 w-4 text-green-500" />
                  Make Staff
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRoleChange(member.id, 'viewer')}
                  disabled={member.role === 'viewer'}
                >
                  <Eye className="mr-2 h-4 w-4 text-gray-500" />
                  Make Viewer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {canRemove && (
              <DropdownMenuItem
                onClick={() => onRemove(member.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from Team
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default function TeamSettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: members, isLoading: membersLoading } = useOrganizationMembers()
  const { data: roleData, isLoading: roleLoading } = useUserRole()

  const inviteMutation = useInviteMember()
  const updateRoleMutation = useUpdateMemberRole()
  const removeMutation = useRemoveMember()

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff' | 'viewer'>('staff')

  const currentUserRole = roleData?.role || 'viewer'
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
  const isLoading = membersLoading || roleLoading

  const handleInvite = () => {
    if (!inviteEmail) return

    const emailToInvite = inviteEmail // Capture before clearing

    inviteMutation.mutate(
      { email: inviteEmail, name: inviteName || undefined, role: inviteRole },
      {
        onSuccess: () => {
          // Copy invite link to clipboard automatically
          copyInviteLink(emailToInvite)
          setInviteDialogOpen(false)
          setInviteName('')
          setInviteEmail('')
          setInviteRole('staff')
        },
      }
    )
  }

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'staff' | 'viewer') => {
    updateRoleMutation.mutate({ memberId, data: { role: newRole } })
  }

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMutation.mutate(memberId)
    }
  }

  // Separate members by status
  const activeMembers = members?.filter((m) => m.user_id) || []
  const pendingMembers = members?.filter((m) => !m.user_id) || []

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Team Members</h1>
                <p className="text-muted-foreground mt-1">Manage your team and permissions</p>
              </div>
            </div>

            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Create an invitation for a team member. After inviting, you can copy the
                      signup link to share with them directly.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Name</Label>
                      <Input
                        id="invite-name"
                        type="text"
                        placeholder="John Doe"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currentUserRole === 'owner' && (
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Admin - Full access + team management
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="staff">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-green-500" />
                              Staff - Assigned clients & projects
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-500" />
                              Viewer - Read-only access
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={!inviteEmail || inviteMutation.isPending}>
                      {inviteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Active Members</CardTitle>
                    <Badge variant="secondary">{activeMembers.length}</Badge>
                  </div>
                  <CardDescription>Team members who have joined the organization</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active members yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          currentUserId={user?.id || ''}
                          currentUserRole={currentUserRole}
                          onRoleChange={handleRoleChange}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              {pendingMembers.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <CardTitle>Pending Invitations</CardTitle>
                      <Badge variant="secondary">{pendingMembers.length}</Badge>
                    </div>
                    <CardDescription>Invitations waiting to be accepted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          currentUserId={user?.id || ''}
                          currentUserRole={currentUserRole}
                          onRoleChange={handleRoleChange}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Role Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                      const Icon = config.icon
                      return (
                        <div key={role} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-sm text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
