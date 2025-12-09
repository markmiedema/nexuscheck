'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Users,
  CreditCard,
  Download,
  ChevronRight,
  Mail,
  Calendar,
} from 'lucide-react'

interface SettingsCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  disabled?: boolean
  badge?: string
  onClick?: () => void
}

function SettingsCard({ title, description, icon, href, disabled, badge, onClick }: SettingsCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (disabled) return
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'
      }`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
    </Card>
  )
}

export default function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your agency and account settings</p>
          </div>

          {/* Account Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/account/update-password">Change Password</a>
              </Button>
            </CardContent>
          </Card>

          {/* Settings Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Agency Settings</h2>

            <div className="grid gap-4">
              <SettingsCard
                title="Agency Profile"
                description="Company name, branding, and contact information"
                icon={<Building2 className="h-5 w-5" />}
                href="/settings/agency"
              />

              <SettingsCard
                title="Team Members"
                description="Invite and manage team members"
                icon={<Users className="h-5 w-5" />}
                href="/settings/team"
              />

              <SettingsCard
                title="Billing"
                description="Manage subscription and payment methods"
                icon={<CreditCard className="h-5 w-5" />}
                href="/settings/billing"
                badge="Coming Soon"
                disabled
              />

              <SettingsCard
                title="Data Export"
                description="Export all your data in standard formats"
                icon={<Download className="h-5 w-5" />}
                href="/settings/data"
                badge="Coming Soon"
                disabled
              />
            </div>
          </div>
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
