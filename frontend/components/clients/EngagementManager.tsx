'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText, Plus, CheckCircle2, Clock, Send, Archive,
  AlertTriangle, Calendar, DollarSign, ExternalLink, Pencil
} from 'lucide-react'
import { createClientNote } from '@/lib/api/clients'
import { useClientEngagements, useCreateEngagement, useUpdateEngagement } from '@/hooks/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEngagement as updateEngagementApi } from '@/lib/api/engagements'
import { queryKeys } from '@/lib/api/queryKeys'
import { toast } from 'sonner'

// Service types available for engagements
const SERVICE_OPTIONS = [
  { id: 'nexus_study', label: 'Nexus Study', tier: 'Tier 1' },
  { id: 'vda_remediation', label: 'VDA / Remediation', tier: 'Tier 4' },
  { id: 'state_registration', label: 'State Registration', tier: 'Tier 2' },
  { id: 'monthly_compliance', label: 'Monthly Compliance', tier: 'Tier 3' },
  { id: 'audit_defense', label: 'Audit Defense', tier: 'Advisory' },
]

// Pricing model options
const PRICING_OPTIONS = [
  { value: 'fixed_fee', label: 'Fixed Fee' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'subscription', label: 'Subscription / Retainer' },
]

// Engagement status display config
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Pencil },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send },
  signed: { label: 'Signed', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Archive },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
}

interface Engagement {
  id: string
  client_id: string
  title: string
  status: string
  scope_config: {
    services?: string[]
    tier?: string
    pricing_model?: string
    estimated_fee?: number
    retainer_monthly?: number
    legacy?: boolean
  } | null
  scope_summary: string | null
  document_url: string | null
  sent_at: string | null
  signed_at: string | null
  effective_date: string | null
  expiration_date: string | null
  created_at: string
  updated_at: string
  projects?: any[]
}

interface EngagementManagerProps {
  clientId: string
  clientName: string
  discoveryCompleted?: boolean
  onEngagementChange?: () => void
}

export function EngagementManager({
  clientId,
  clientName,
  discoveryCompleted = false,
  onEngagementChange
}: EngagementManagerProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [pricingModel, setPricingModel] = useState('')
  const [estimatedFee, setEstimatedFee] = useState('')
  const [retainerMonthly, setRetainerMonthly] = useState('')
  const [scopeSummary, setScopeSummary] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')

  // React Query hooks
  const { data: engagements = [], isLoading: loading } = useClientEngagements(clientId)
  const createEngagementMutation = useCreateEngagement()

  // Generic update mutation (allows updating any engagement)
  const updateEngagementMutation = useMutation({
    mutationFn: ({ engagementId, data }: { engagementId: string; data: any }) =>
      updateEngagementApi(engagementId, data),
    onSuccess: (engagement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engagements.list(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.engagements.active(clientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.overview(clientId) })
      onEngagementChange?.()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to update engagement')
    },
  })

  // Reset form
  const resetForm = () => {
    setTitle('')
    setSelectedServices([])
    setPricingModel('')
    setEstimatedFee('')
    setRetainerMonthly('')
    setScopeSummary('')
    setEffectiveDate('')
    setEditingEngagement(null)
  }

  // Open dialog for new engagement
  const handleNewEngagement = () => {
    resetForm()
    setDialogOpen(true)
  }

  // Open dialog for editing
  const handleEditEngagement = (engagement: Engagement) => {
    setEditingEngagement(engagement)
    setTitle(engagement.title)
    setSelectedServices(engagement.scope_config?.services || [])
    setPricingModel(engagement.scope_config?.pricing_model || '')
    setEstimatedFee(engagement.scope_config?.estimated_fee?.toString() || '')
    setRetainerMonthly(engagement.scope_config?.retainer_monthly?.toString() || '')
    setScopeSummary(engagement.scope_summary || '')
    setEffectiveDate(engagement.effective_date || '')
    setDialogOpen(true)
  }

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    )
  }

  // Save engagement
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    const payload = {
      title,
      scope_config: {
        services: selectedServices,
        pricing_model: pricingModel || null,
        estimated_fee: estimatedFee ? parseFloat(estimatedFee) : null,
        retainer_monthly: retainerMonthly ? parseFloat(retainerMonthly) : null,
      },
      scope_summary: scopeSummary || null,
      effective_date: effectiveDate || null,
    }

    if (editingEngagement) {
      updateEngagementMutation.mutate(
        { engagementId: editingEngagement.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Engagement updated')
            setDialogOpen(false)
            resetForm()
          },
        }
      )
    } else {
      createEngagementMutation.mutate(
        {
          ...payload,
          client_id: clientId,
          status: 'draft',
        },
        {
          onSuccess: async () => {
            // Log activity note for new engagement
            const serviceLabels = selectedServices.map(s => SERVICE_OPTIONS.find(o => o.id === s)?.label || s).join(', ')
            try {
              await createClientNote(clientId, {
                content: `New engagement created: "${title}"\n\nServices: ${serviceLabels || 'None specified'}`,
                note_type: 'engagement'
              })
            } catch {
              // Silent fail - note creation is not critical
            }
            setDialogOpen(false)
            resetForm()
            onEngagementChange?.()
          },
        }
      )
    }
  }

  // Update engagement status
  const updateStatus = async (engagementId: string, newStatus: string, engagementTitle?: string) => {
    updateEngagementMutation.mutate(
      { engagementId, data: { status: newStatus } },
      {
        onSuccess: async () => {
          toast.success(`Engagement marked as ${newStatus}`)

          // Log activity note for sent/signed status changes
          if (newStatus === 'sent' || newStatus === 'signed') {
            const noteContent = newStatus === 'sent'
              ? `Engagement sent to client: "${engagementTitle || 'Untitled'}"`
              : `Engagement signed: "${engagementTitle || 'Untitled'}"\n\nClient is now ready for project work.`

            try {
              await createClientNote(clientId, {
                content: noteContent,
                note_type: 'engagement'
              })
            } catch {
              // Silent fail - note creation is not critical
            }
          }
        },
      }
    )
  }

  // Check if saving
  const saving = createEngagementMutation.isPending || updateEngagementMutation.isPending

  // Get active engagement
  const activeEngagement = engagements.find(e => e.status === 'signed')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Discovery Gate Warning */}
      {!discoveryCompleted && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-300">Discovery Required</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Complete the Discovery Profile before creating an engagement.
            </p>
          </div>
        </div>
      )}

      {/* Active Engagement Banner */}
      {activeEngagement && (
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{activeEngagement.title}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Active Engagement - Signed {activeEngagement.signed_at ? new Date(activeEngagement.signed_at).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {activeEngagement.scope_config?.services?.map(service => (
                <Badge key={service} variant="outline" className="bg-emerald-100 border-emerald-300 text-emerald-700">
                  {SERVICE_OPTIONS.find(s => s.id === service)?.label || service}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Engagements</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewEngagement} disabled={!discoveryCompleted}>
              <Plus className="h-4 w-4 mr-2" />
              New Engagement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEngagement ? 'Edit Engagement' : 'Create New Engagement'}
              </DialogTitle>
              <DialogDescription>
                Define the scope of services for {clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>Engagement Title</Label>
                <Input
                  placeholder="e.g., 2024 Nexus Study & VDA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Services */}
              <div className="space-y-2">
                <Label>Services Included</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map(service => (
                    <label
                      key={service.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedServices.includes(service.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-border'
                      }`}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{service.label}</p>
                        <p className="text-xs text-muted-foreground">{service.tier}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select value={pricingModel} onValueChange={setPricingModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Fee ($)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={estimatedFee}
                    onChange={(e) => setEstimatedFee(e.target.value)}
                  />
                </div>
                {pricingModel === 'subscription' && (
                  <div className="space-y-2">
                    <Label>Monthly Retainer ($)</Label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={retainerMonthly}
                      onChange={(e) => setRetainerMonthly(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Scope Summary */}
              <div className="space-y-2">
                <Label>Scope Summary</Label>
                <Textarea
                  placeholder="Brief description of engagement scope..."
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingEngagement ? 'Update' : 'Create Engagement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Engagement List */}
      {engagements.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No engagements yet</p>
          {discoveryCompleted ? (
            <Button onClick={handleNewEngagement}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Engagement
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Complete discovery profile first</p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {engagements.map(engagement => {
            const statusConfig = STATUS_CONFIG[engagement.status] || STATUS_CONFIG.draft
            const StatusIcon = statusConfig.icon
            const isLegacy = engagement.scope_config?.legacy

            return (
              <Card key={engagement.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{engagement.title}</h4>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {isLegacy && (
                        <Badge variant="secondary" className="text-xs">Legacy</Badge>
                      )}
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {engagement.scope_config?.services?.map(service => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {SERVICE_OPTIONS.find(s => s.id === service)?.label || service}
                        </Badge>
                      ))}
                    </div>

                    {/* Dates and Pricing */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {engagement.effective_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Effective: {new Date(engagement.effective_date).toLocaleDateString()}
                        </span>
                      )}
                      {engagement.scope_config?.estimated_fee && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${engagement.scope_config.estimated_fee.toLocaleString()}
                        </span>
                      )}
                      {engagement.projects && engagement.projects.length > 0 && (
                        <span>{engagement.projects.length} project(s)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {engagement.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEngagement(engagement)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(engagement.id, 'sent', engagement.title)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Mark Sent
                        </Button>
                      </>
                    )}
                    {engagement.status === 'sent' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(engagement.id, 'signed', engagement.title)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Signed
                      </Button>
                    )}
                    {engagement.status === 'signed' && !isLegacy && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(engagement.id, 'archived', engagement.title)}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
