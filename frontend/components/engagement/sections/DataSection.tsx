'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DiscoveryProfile } from '@/components/clients/DiscoveryProfile'
import { IntakeStepper } from '@/components/clients/IntakeStepper'
import { EngagementManager } from '@/components/clients/EngagementManager'
import { cn } from '@/lib/utils'

type DataSubSection = 'profile' | 'collection' | 'engagement'

// Discovery initial data type (matches what DiscoveryProfile expects)
interface DiscoveryInitialData {
  channels: string[]
  product_types: string[]
  systems: string[]
  has_remote_employees: boolean
  remote_employee_states: string[]
  remote_employee_state_dates: Record<string, string>
  has_inventory_3pl: boolean
  inventory_3pl_states: string[]
  inventory_3pl_state_dates: Record<string, string>
  estimated_annual_revenue?: string
  transaction_volume?: string
  current_registration_count: number
  registered_states: string[]
  registered_state_dates: Record<string, string>
  discovery_completed_at?: string
  discovery_notes?: string
  erp_system?: string
  ecommerce_platform?: string
  tax_engine?: string
}

interface DataSectionProps {
  clientId: string
  clientName: string
  discoveryCompleted: boolean
  discoveryInitialData?: DiscoveryInitialData
  onRefreshClient: () => void
  onRefreshNotes?: () => void
  initialSubSection?: DataSubSection
}

// Sub-navigation items
const SUB_NAV_ITEMS: { id: DataSubSection; label: string }[] = [
  { id: 'profile', label: 'Business Profile' },
  { id: 'collection', label: 'Data Collection' },
  { id: 'engagement', label: 'Engagement' },
]

export function DataSection({
  clientId,
  clientName,
  discoveryCompleted,
  discoveryInitialData,
  onRefreshClient,
  onRefreshNotes,
  initialSubSection = 'profile',
}: DataSectionProps) {
  const [activeSubSection, setActiveSubSection] = useState<DataSubSection>(initialSubSection)

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="border-b">
        <nav className="flex gap-1" aria-label="Data sections">
          {SUB_NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveSubSection(item.id)}
              className={cn(
                'rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors',
                activeSubSection === item.id
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeSubSection === 'profile' && (
          <DiscoveryProfile
            clientId={clientId}
            initialData={discoveryInitialData}
            onUpdate={onRefreshClient}
            onComplete={() => {
              onRefreshClient()
              onRefreshNotes?.()
              // Could switch to collection sub-section
              setActiveSubSection('collection')
            }}
          />
        )}

        {activeSubSection === 'collection' && (
          <IntakeStepper
            clientId={clientId}
            onComplete={() => {
              onRefreshClient()
            }}
          />
        )}

        {activeSubSection === 'engagement' && (
          <EngagementManager
            clientId={clientId}
            clientName={clientName}
            discoveryCompleted={discoveryCompleted}
            onEngagementChange={onRefreshClient}
          />
        )}
      </div>
    </div>
  )
}

export default DataSection
