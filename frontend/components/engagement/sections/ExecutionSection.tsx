'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StateWorklist } from '@/components/clients/StateWorklist'
import { StateDetailDrawer } from '@/components/clients/StateDetailDrawer'
import { cn } from '@/lib/utils'
import { List, Calendar, LayoutGrid } from 'lucide-react'

type ExecutionView = 'priority' | 'list' | 'calendar'

interface ExecutionSectionProps {
  clientId: string
}

// View toggle options
const VIEW_OPTIONS: { id: ExecutionView; label: string; icon: typeof List }[] = [
  { id: 'priority', label: 'Priority', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
]

export function ExecutionSection({ clientId }: ExecutionSectionProps) {
  const [activeView, setActiveView] = useState<ExecutionView>('priority')
  const [selectedState, setSelectedState] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveView(option.id)}
                className={cn(
                  'h-8 px-3 text-sm',
                  activeView === option.id
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Content based on view */}
      {activeView === 'priority' && (
        <StateWorklist
          clientId={clientId}
          onSelectState={(state) => setSelectedState(state)}
        />
      )}

      {activeView === 'list' && (
        <StateWorklist
          clientId={clientId}
          onSelectState={(state) => setSelectedState(state)}
        />
      )}

      {activeView === 'calendar' && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Calendar view coming soon</p>
          <p className="text-sm mt-1">View state action deadlines and filing dates</p>
        </div>
      )}

      {/* State Detail Drawer */}
      <StateDetailDrawer
        clientId={clientId}
        state={selectedState}
        open={!!selectedState}
        onClose={() => setSelectedState(null)}
      />
    </div>
  )
}

export default ExecutionSection
