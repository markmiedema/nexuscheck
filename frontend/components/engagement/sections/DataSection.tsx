'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IntakeHub } from './IntakeHub'
import { EngagementManager } from '@/components/clients/EngagementManager'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FileSignature } from 'lucide-react'

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
}

export function DataSection({
  clientId,
  clientName,
  discoveryCompleted,
  discoveryInitialData,
  onRefreshClient,
  onRefreshNotes: _onRefreshNotes, // reserved for later
}: DataSectionProps) {
  const [engagementDrawerOpen, setEngagementDrawerOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Engagement quick access */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEngagementDrawerOpen(true)}
        >
          <FileSignature className="h-4 w-4 mr-1.5" />
          Manage Engagement
        </Button>
      </div>

      {/* IntakeHub is now the default view */}
      <IntakeHub
        clientId={clientId}
        clientName={clientName}
        discoveryInitialData={discoveryInitialData}
        onRefreshClient={onRefreshClient}
      />

      {/* Engagement Manager Drawer */}
      <Sheet open={engagementDrawerOpen} onOpenChange={setEngagementDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Engagement Management</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <EngagementManager
              clientId={clientId}
              clientName={clientName}
              discoveryCompleted={discoveryCompleted}
              onEngagementChange={onRefreshClient}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default DataSection
