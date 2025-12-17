'use client'

import { useState, createContext, useContext, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Scale,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'

// Navigation items configuration
const navigationItems = [
  {
    title: 'Command Center',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
    disabled: true, // Phase 2
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: Scale,
  },
]

const bottomNavigationItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

// Context for sidebar state
interface SidebarContextValue {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

const SIDEBAR_COLLAPSED_KEY = 'nexuscheck-sidebar-collapsed'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage to persist state across navigation
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      return stored === 'true'
    }
    return false
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Persist collapsed state to localStorage
  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    }
  }

  // Sync with localStorage on mount (handles SSR hydration)
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored !== null) {
      setIsCollapsedState(stored === 'true')
    }
  }, [])

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

// Navigation item component
interface NavItemProps {
  item: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }
  isCollapsed: boolean
  onClick?: () => void
}

function NavItem({ item, isCollapsed, onClick }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  if (item.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? `${item.title} (Coming Soon)` : 'Coming Soon'}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.title : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  )
}

// Desktop sidebar component
export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-card/50 transition-all duration-300 sticky top-0 h-screen',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Brand */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-border px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">NexusCheck</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Navigation - scrollable */}
      <nav className="flex-1 overflow-y-auto space-y-1 p-2">
        {navigationItems.map((item) => (
          <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Bottom Navigation - pinned at bottom */}
      <nav className="shrink-0 border-t border-border p-2 space-y-1">
        {bottomNavigationItems.map((item) => (
          <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
    </aside>
  )
}

// Mobile sidebar trigger (hamburger button)
export function MobileSidebarTrigger() {
  const { setIsMobileOpen } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={() => setIsMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
}

// Mobile sidebar (sheet/drawer)
export function MobileSidebar() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar()

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-16 flex flex-row items-center border-b border-border px-4">
          <SheetTitle className="text-xl font-bold">NexusCheck</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-4rem)]">
          {/* Main Navigation - scrollable */}
          <nav className="flex-1 overflow-y-auto space-y-1 p-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={false}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </nav>

          {/* Bottom Navigation - pinned at bottom */}
          <nav className="shrink-0 border-t border-border p-2 space-y-1">
            {bottomNavigationItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={false}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
