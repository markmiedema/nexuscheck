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
import { ContextRail } from '@/components/engagement/ContextRail'
import {
  LayoutDashboard,
  Database,
  Play,
  Clock,
  Search,
  Filter,
} from 'lucide-react'

// Section types - canonical ids
type WorkspaceSection = 'overview' | 'intake' | 'execution' | 'history'

// Normalize legacy section params to canonical ids
const normalizeSection = (raw: string | null): WorkspaceSection => {
  if (!raw) return 'overview'
  if (raw === 'dashboard') return 'overview'  // legacy
  if (raw === 'data') return 'intake'         // legacy
  if (raw === 'overview' || raw === 'intake' || raw === 'execution' || raw === 'history') return raw
  return 'overview'
}

// Section configuration - horizontal tabs
const SECTION_CONFIG = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'intake', label: 'Intake', icon: Database },
  { id: 'execution', label: 'Execution', icon: Play },
  { id: 'history', label: 'History', icon: Clock },
] as const

export default function ClientCRMPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const clientId = params.id as string

  // TanStack Query hooks for data fetching
  const { data: client, isLoading: loading } = useClient(clientId)

  // Initialize section from URL query param with legacy support
  const initialSection = normalizeSection(searchParams.get('section'))
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
        <AppLayout maxWidth="full" noPadding>
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading workspace...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="full">
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
      <AppLayout maxWidth="full" noPadding>
        {/* Compact Engagement Header */}
        <EngagementHeader
          clientId={clientId}
          engagementId={activeEngagementId}
          onEngagementChange={handleEngagementChange}
        />

        {/* Horizontal section tabs + filters bar */}
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between px-6">
            {/* Section tabs */}
            <nav className="flex" aria-label="Workspace sections">
              {SECTION_CONFIG.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                )
              })}
            </nav>

            {/* Right side: Search/Filters (contextual) */}
            <div className="flex items-center gap-2">
              {activeSection === 'execution' && (
                <>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filters
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Search
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main work surface - grid layout with context rail */}
        <main className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Main work surface */}
            <div className="col-span-12 xl:col-span-9 min-w-0">
              {activeSection === 'overview' && (
                <DashboardSection clientId={clientId} />
              )}

              {activeSection === 'intake' && (
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

            {/* Right context rail */}
            <aside className="hidden xl:block xl:col-span-3">
              <div className="sticky top-6 space-y-4">
                <ContextRail
                  clientId={clientId}
                  engagementId={activeEngagementId}
                  activeSection={activeSection}
                />
              </div>
            </aside>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}
