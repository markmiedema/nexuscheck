'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Users, LogOut } from 'lucide-react' // Changed Home icon to Users icon

export default function AppNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Navigation Items Configuration
  const navItems = [
    { label: 'Clients', href: '/clients', icon: Users },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Links to Dashboard */}
          <button
            onClick={() => router.push('/clients')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold text-foreground">Nexus Check</h1>
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-1 mr-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className={isActive ? "bg-secondary" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}
            </div>

            {/* User & Theme */}
            <div className="flex items-center space-x-2 pl-4 border-l border-border/50">
              <span className="text-sm text-muted-foreground hidden md:inline mr-2">
                {user?.email}
              </span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
