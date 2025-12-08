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
import { PhysicalNexusFormData, PhysicalNexusType } from '@/hooks/usePhysicalNexusConfig'
import { US_STATES } from '@/lib/constants/states'

const NEXUS_TYPE_OPTIONS: { value: PhysicalNexusType; label: string }[] = [
  { value: 'remote_employee', label: 'Remote Employee' },
  { value: 'inventory_3pl', label: '3PL / FBA Inventory' },
  { value: 'office', label: 'Office / Physical Location' },
  { value: 'other', label: 'Other' },
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
    nexus_type: 'other',
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
        nexus_type: 'other',
        registration_date: undefined,
        permit_number: '',
        notes: '',
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.state_code || !formState.nexus_date || !formState.nexus_type) {
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
                <p className="text-xs text-muted-foreground dark:text-slate-300">
                  State cannot be changed. Delete and create new to change state.
                </p>
              )}
            </div>

            {/* Nexus Type */}
            <div className="grid gap-2">
              <Label htmlFor="nexus_type">Nexus Type *</Label>
              <Select
                value={formState.nexus_type}
                onValueChange={(value) =>
                  setFormState({ ...formState, nexus_type: value as PhysicalNexusType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nexus type" />
                </SelectTrigger>
                <SelectContent>
                  {NEXUS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground dark:text-slate-300">
                What type of physical presence creates nexus?
              </p>
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
              <p className="text-xs text-muted-foreground dark:text-slate-300">
                When did you establish physical presence?
              </p>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={formState.reason}
                onChange={(e) =>
                  setFormState({ ...formState, reason: e.target.value })
                }
                placeholder="e.g., Office opened in Los Angeles"
              />
              <p className="text-xs text-muted-foreground dark:text-slate-300">
                Brief description of physical presence
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
