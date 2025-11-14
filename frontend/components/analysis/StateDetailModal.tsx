'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface StateDetailData {
  state_code: string
  state_name: string
  has_nexus: boolean
  status?: string
  nexus_date?: string
  nexus_types?: string[]
  nexus_reason?: string
  total_sales?: number
  exposure_sales?: number
  estimated_liability?: number
  base_tax?: number
  interest?: number
  penalties?: number
  tax_rate?: number
  is_registered?: boolean
  registration_info?: {
    registration_date?: string
    permit_number?: string
    notes?: string
  }
}

export interface StateDetailModalProps {
  state: StateDetailData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Reusable modal component for displaying detailed state information.
 *
 * Features:
 * - Displays nexus status and details
 * - Shows financial breakdown (sales, liability, taxes, etc.)
 * - Registration information if available
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * const [selectedState, setSelectedState] = useState<StateDetailData | null>(null)
 * const [modalOpen, setModalOpen] = useState(false)
 *
 * <StateDetailModal
 *   state={selectedState}
 *   open={modalOpen}
 *   onOpenChange={setModalOpen}
 * />
 * ```
 */
export function StateDetailModal({ state, open, onOpenChange }: StateDetailModalProps) {
  if (!state) return null

  const formatCurrency = (value?: number) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value?: number) => {
    if (!value) return '0%'
    return `${(value * 100).toFixed(2)}%`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = () => {
    if (state.has_nexus) return 'bg-destructive/10 text-destructive-foreground border-destructive/20'
    return 'bg-muted text-muted-foreground border-border'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>
              {state.state_code} - {state.state_name}
            </DialogTitle>
            <Badge className={getStatusColor()}>
              {state.has_nexus ? 'NEXUS TRIGGERED' : 'NO NEXUS'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nexus Information */}
          {state.has_nexus && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-destructive-foreground mb-3">
                Nexus Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {state.nexus_types && state.nexus_types.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Nexus Types:</span>
                    <div className="flex gap-1 mt-1">
                      {state.nexus_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {state.nexus_date && (
                  <div>
                    <span className="text-muted-foreground">Nexus Date:</span>
                    <p className="font-semibold mt-1">{formatDate(state.nexus_date)}</p>
                  </div>
                )}
                {state.nexus_reason && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="mt-1">{state.nexus_reason}</p>
                  </div>
                )}
              </div>

              {/* Registration Status */}
              {state.is_registered && state.registration_info && (
                <div className="mt-4 pt-4 border-t border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">
                      ✓ Registered
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {state.registration_info.registration_date && (
                      <div>
                        <span className="text-muted-foreground">Registration Date:</span>
                        <p className="font-semibold">{formatDate(state.registration_info.registration_date)}</p>
                      </div>
                    )}
                    {state.registration_info.permit_number && (
                      <div>
                        <span className="text-muted-foreground">Permit Number:</span>
                        <p className="font-mono text-xs font-semibold">{state.registration_info.permit_number}</p>
                      </div>
                    )}
                    {state.registration_info.notes && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-xs italic mt-1">{state.registration_info.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Total Sales:</span>
                <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(state.total_sales)}</p>
              </div>
              {state.exposure_sales !== undefined && state.exposure_sales > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Exposure Sales:</span>
                  <p className="text-2xl font-bold text-destructive-foreground mt-1">
                    {formatCurrency(state.exposure_sales)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Liability Breakdown */}
          {state.has_nexus && state.estimated_liability && state.estimated_liability > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-destructive-foreground mb-3">
                Liability Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                {state.tax_rate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Rate:</span>
                    <span className="font-semibold">{formatPercent(state.tax_rate)}</span>
                  </div>
                )}
                {state.base_tax !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Tax:</span>
                    <span className="font-semibold">{formatCurrency(state.base_tax)}</span>
                  </div>
                )}
                {state.interest !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest:</span>
                    <span className="font-semibold">{formatCurrency(state.interest)}</span>
                  </div>
                )}
                {state.penalties !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalties:</span>
                    <span className="font-semibold">{formatCurrency(state.penalties)}</span>
                  </div>
                )}
                <div className="border-t border-destructive/20 pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total Liability:</span>
                  <span className="text-lg font-bold text-destructive-foreground">
                    {formatCurrency(state.estimated_liability)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
