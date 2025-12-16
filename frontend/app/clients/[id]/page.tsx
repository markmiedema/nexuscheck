'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useClient } from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EngagementHeader } from '@/components/engagement/EngagementHeader'
import { DashboardSection } from '@/components/engagement/sections/DashboardSection'
import { DataSection } from '@/components/engagement/sections/DataSection'
import { ExecutionSection } from '@/components/engagement/sections/ExecutionSection'
import { HistorySection } from '@/components/engagement/sections/HistorySection'
import {
  LayoutDashboard,
  Database,
  Play,
  Clock,
} from 'lucide-react'

// Section types for the new 4-section navigation
type WorkspaceSection = 'dashboard' | 'data' | 'execution' | 'history'

// Section configuration
const SECTION_CONFIG: {
  id: WorkspaceSection
  label: string
  icon: typeof LayoutDashboard
  description: string
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & next actions' },
  { id: 'data', label: 'Data', icon: Database, description: 'Client profile & intake' },
  { id: 'execution', label: 'Execution', icon: Play, description: 'State actions & tasks' },
  { id: 'history', label: 'History', icon: Clock, description: 'Analyses & activity log' },
]

export default function ClientCRMPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const clientId = params.id as string

  // TanStack Query hooks for data fetching
  const { data: client, isLoading: loading } = useClient(clientId)

  // Initialize section from URL query param or default to 'dashboard'
  const initialSection = (searchParams.get('section') as WorkspaceSection) || 'dashboard'
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(initialSection)
  const [activeEngagementId, setActiveEngagementId] = useState<string | undefined>(undefined)

  // Helper to refresh client data (used by child components)
  const refreshClient = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) })
  }

  // Handle section change with URL update
  const handleSectionChange = (section: WorkspaceSection) => {
    setActiveSection(section)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.replaceState({}, '', url.toString())
  }

  // Handle engagement change from header
  const handleEngagementChange = (engagementId: string) => {
    setActiveEngagementId(engagementId)
  }

  // Memoize discovery initialData to prevent useEffect from triggering on every parent render
  const discoveryInitialData = useMemo(() => {
    if (!client) return undefined
    return {
      channels: client.channels || [],
      product_types: client.product_types || [],
      systems: client.systems || [],
      has_remote_employees: client.has_remote_employees || false,
      remote_employee_states: client.remote_employee_states || [],
      remote_employee_state_dates: client.remote_employee_state_dates || {},
      has_inventory_3pl: client.has_inventory_3pl || false,
      inventory_3pl_states: client.inventory_3pl_states || [],
      inventory_3pl_state_dates: client.inventory_3pl_state_dates || {},
      estimated_annual_revenue: client.estimated_annual_revenue,
      transaction_volume: client.transaction_volume,
      current_registration_count: client.current_registration_count || 0,
      registered_states: client.registered_states || [],
      registered_state_dates: client.registered_state_dates || {},
      discovery_completed_at: client.discovery_completed_at,
      discovery_notes: client.discovery_notes,
      erp_system: client.erp_system,
      ecommerce_platform: client.ecommerce_platform,
      tax_engine: client.tax_engine
    }
  }, [client])

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl" noPadding>
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading client workspace...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Client not found</p>
            <Button onClick={() => router.push('/clients')} className="mt-4">Back to Clients</Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl" noPadding>
        {/* Engagement Header - Sticky context bar */}
        <EngagementHeader
          clientId={clientId}
          engagementId={activeEngagementId}
          onEngagementChange={handleEngagementChange}
        />

        {/* Main workspace container */}
        <div className="flex min-h-[calc(100vh-180px)]">
          {/* Left sidebar - Section navigation */}
          <nav className="w-56 border-r bg-muted/30 flex-shrink-0">
            <div className="p-4 space-y-1">
              {SECTION_CONFIG.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{section.label}</p>
                      {!isActive && (
                        <p className="text-xs opacity-70 truncate">{section.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeSection === 'dashboard' && (
                <DashboardSection clientId={clientId} />
              )}

              {activeSection === 'data' && (
                <DataSection
                  clientId={clientId}
                  clientName={client.company_name}
                  discoveryCompleted={!!client.discovery_completed_at}
                  discoveryInitialData={discoveryInitialData}
                  onRefreshClient={refreshClient}
                />
              )}

              {activeSection === 'execution' && (
                <ExecutionSection clientId={clientId} />
              )}

              {activeSection === 'history' && (
                <HistorySection
                  clientId={clientId}
                  clientName={client.company_name}
                />
              )}
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
