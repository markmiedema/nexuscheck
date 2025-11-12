'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhysicalNexusFormData } from '@/hooks/usePhysicalNexusConfig'

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
]

interface PhysicalNexusFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PhysicalNexusFormData) => Promise<void>
  initialData?: PhysicalNexusFormData | null
  editingState?: string | null
}

export function PhysicalNexusForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  editingState,
}: PhysicalNexusFormProps) {
  const [formState, setFormState] = useState<PhysicalNexusFormData>({
    state_code: '',
    nexus_date: new Date(),
    reason: '',
    registration_date: undefined,
    permit_number: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (open && initialData) {
      setFormState(initialData)
    } else if (open && !initialData) {
      setFormState({
        state_code: '',
        nexus_date: new Date(),
        reason: '',
        registration_date: undefined,
        permit_number: '',
        notes: '',
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.state_code || !formState.nexus_date || !formState.reason) {
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(formState)
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingState ? `Edit Physical Nexus - ${editingState}` : 'Add Physical Nexus'}
            </DialogTitle>
            <DialogDescription>
              Configure physical presence information for a state. This affects nexus determination
              and tax liability calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* State Selection */}
            <div className="grid gap-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formState.state_code}
                onValueChange={(value) =>
                  setFormState({ ...formState, state_code: value })
                }
                disabled={!!editingState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingState && (
                <p className="text-xs text-muted-foreground">
                  State cannot be changed. Delete and create new to change state.
                </p>
              )}
            </div>

            {/* Nexus Date */}
            <div className="grid gap-2">
              <Label htmlFor="nexus_date">Nexus Established Date *</Label>
              <Input
                id="nexus_date"
                type="date"
                value={formatDateForInput(formState.nexus_date)}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    nexus_date: new Date(e.target.value),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                When did you establish physical presence?
              </p>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formState.reason}
                onChange={(e) =>
                  setFormState({ ...formState, reason: e.target.value })
                }
                placeholder="e.g., Office opened in Los Angeles"
                required
              />
              <p className="text-xs text-muted-foreground">
                Brief description of physical presence
              </p>
            </div>

            {/* Registration Date */}
            <div className="grid gap-2">
              <Label htmlFor="registration_date">Registration Date (Optional)</Label>
              <Input
                id="registration_date"
                type="date"
                value={formatDateForInput(formState.registration_date)}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    registration_date: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                When did you register with the state?
              </p>
            </div>

            {/* Permit Number */}
            <div className="grid gap-2">
              <Label htmlFor="permit_number">Permit Number (Optional)</Label>
              <Input
                id="permit_number"
                value={formState.permit_number}
                onChange={(e) =>
                  setFormState({ ...formState, permit_number: e.target.value })
                }
                placeholder="e.g., CA-123456"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                State tax permit or registration number
              </p>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formState.notes}
                onChange={(e) =>
                  setFormState({ ...formState, notes: e.target.value })
                }
                placeholder="Additional information about this physical nexus"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formState.notes?.length || 0} / 500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingState ? 'Update' : 'Add State'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
