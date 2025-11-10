'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Home, LogOut } from 'lucide-react'

export default function AppNav() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleHome = () => {
    router.push('/dashboard')
  }

  return (
    <nav className="bg-white dark:bg-slate-700 shadow-card border-b-2 border-gray-300 dark:border-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Clickable to Dashboard */}
          <button
            onClick={handleHome}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold text-gray-950 dark:text-gray-50">Nexus Check</h1>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
              className="hidden sm:flex"
              aria-label="Go to dashboard"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
              {user?.email}
            </span>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
