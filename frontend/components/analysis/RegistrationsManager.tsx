'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRegistrations } from '@/hooks/useRegistrations'
import { FileCheck, Info } from 'lucide-react'
import { US_STATE_CODES } from '@/lib/constants/states'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RegistrationsManagerProps {
  analysisId: string
  clientId?: string
  onUpdate?: () => void | Promise<void>
}

export function RegistrationsManager({ analysisId, clientId, onUpdate }: RegistrationsManagerProps) {
  const {
    registeredStates,
    loading,
    saving,
    toggleRegistration
  } = useRegistrations(analysisId, clientId, { onUpdate })

  if (!clientId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                State Registrations
              </CardTitle>
              <CardDescription>
                Track states where you are registered to collect sales tax
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Link this analysis to a client to manage state registrations.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              State Registrations
            </CardTitle>
            <CardDescription>
              Track states where you are registered to collect sales tax
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="cursor-help">
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>Click on states to toggle their registration status. Registered states will appear in dark grey on the map.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* State Selection Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
              {US_STATE_CODES.map(state => (
                <Badge
                  key={state}
                  variant="outline"
                  className={`cursor-pointer text-xs transition-all ${
                    registeredStates.includes(state)
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-200 shadow-sm'
                      : 'hover:bg-muted hover:border-muted-foreground/50'
                  } ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => toggleRegistration(state)}
                >
                  {state}
                </Badge>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {registeredStates.length === 0 ? (
                  'No states registered'
                ) : (
                  <>
                    <span className="font-medium text-foreground">{registeredStates.length}</span>
                    {' '}state{registeredStates.length !== 1 ? 's' : ''} registered
                  </>
                )}
              </span>
              {registeredStates.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {registeredStates.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
