'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useOrganization } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sidebar,
  SidebarProvider,
  MobileSidebar,
  MobileSidebarTrigger,
} from './Sidebar'
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs'
import { LogOut } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '7xl' | 'full'
  breadcrumbs?: BreadcrumbItem[]
  breadcrumbsRightContent?: ReactNode
  /** Remove default padding from main content area */
  noPadding?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

function AppHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { data: organization } = useOrganization()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Get logo URL from organization settings
  const logoUrl = organization?.settings?.portal_branding?.logo_url

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <MobileSidebarTrigger />

      {/* Organization Logo */}
      {logoUrl && (
        <div className="flex items-center">
          <img
            src={logoUrl}
            alt={organization?.name || 'Logo'}
            className="h-8 w-auto max-w-[160px] object-contain"
          />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* User email */}
        <span className="text-sm text-muted-foreground hidden md:inline">
          {user?.email}
        </span>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

function AppLayoutInner({
  children,
  maxWidth = '7xl',
  breadcrumbs,
  breadcrumbsRightContent,
  noPadding = false,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <AppHeader />

        <main className={`flex-1 ${maxWidthClasses[maxWidth]} w-full mx-auto ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8 pt-4 pb-8'}`}>
          {breadcrumbs && (
            <Breadcrumbs items={breadcrumbs} rightContent={breadcrumbsRightContent} />
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AppLayout(props: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutInner {...props} />
    </SidebarProvider>
  )
}
