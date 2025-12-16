'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useStateAssessment,
  useUpdateStateAssessment,
  useCreateStateAction,
  useUpdateStateAction,
  useUpdateActionTask,
  NEXUS_STATUS_LABELS,
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  type ActionType,
  type ActionStatus,
} from '@/hooks/queries'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StateDetailDrawerProps {
  clientId: string
  state: string | null
  open: boolean
  onClose: () => void
}

// Nexus Status Selector
function NexusStatusSelector({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(NEXUS_STATUS_LABELS).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            {config.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Action Type Selector
function ActionTypeSelector({
  value,
  onChange,
  disabled,
}: {
  value?: string
  onChange: (value: ActionType) => void
  disabled?: boolean
}) {
  return (
    <Select value={value || ''} onValueChange={(v) => onChange(v as ActionType)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select action type..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ACTION_TYPE_LABELS).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Action Status Selector
function ActionStatusSelector({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: ActionStatus) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ActionStatus)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ACTION_STATUS_LABELS).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            {config.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Task Checklist
function TaskChecklist({
  tasks,
  clientId,
  state,
  actionId,
}: {
  tasks: Array<{ id: string; title: string; status: string; description?: string }>
  clientId: string
  state: string
  actionId: string
}) {
  const updateTask = useUpdateActionTask(clientId, state, actionId)

  const toggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'complete' ? 'pending' : 'complete'
    updateTask.mutate({ taskId, data: { status: newStatus } })
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
            task.status === 'complete' ? 'bg-muted/50' : 'hover:bg-muted/30'
          }`}
        >
          <Checkbox
            checked={task.status === 'complete'}
            onCheckedChange={() => toggleTask(task.id, task.status)}
            disabled={updateTask.isPending}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${task.status === 'complete' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>
          {task.status === 'complete' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

// Create Action Form
function CreateActionForm({
  clientId,
  state,
  assessmentId,
  onCreated,
}: {
  clientId: string
  state: string
  assessmentId: string
  onCreated: () => void
}) {
  const [actionType, setActionType] = useState<ActionType | ''>('')
  const [notes, setNotes] = useState('')

  const createAction = useCreateStateAction(clientId, state)

  const handleCreate = () => {
    if (!actionType) return
    createAction.mutate(
      { data: { action_type: actionType, strategy_notes: notes || undefined } },
      { onSuccess: onCreated }
    )
  }

  return (
    <Card className="p-4 border-dashed">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Action
      </h4>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Action Type</Label>
          <ActionTypeSelector
            value={actionType}
            onChange={setActionType}
            disabled={createAction.isPending}
          />
        </div>
        <div>
          <Label className="text-xs">Strategy Notes (optional)</Label>
          <Textarea
            placeholder="Notes about the approach..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={createAction.isPending}
            className="h-20"
          />
        </div>
        <Button
          className="w-full"
          disabled={!actionType || createAction.isPending}
          onClick={handleCreate}
        >
          {createAction.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Create Action with Tasks
        </Button>
      </div>
    </Card>
  )
}

// Main Component
export function StateDetailDrawer({ clientId, state, open, onClose }: StateDetailDrawerProps) {
  const { data: assessment, isLoading, error } = useStateAssessment(clientId, state || '')
  const updateAssessment = useUpdateStateAssessment(clientId, state || '')
  const updateAction = useUpdateStateAction(clientId, state || '')

  const [showCreateAction, setShowCreateAction] = useState(false)

  if (!state) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {state} State Details
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !assessment ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
            <p className="text-red-600">Failed to load state details</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Nexus Assessment Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Nexus Assessment
              </h3>
              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Nexus Status</Label>
                    <NexusStatusSelector
                      value={assessment.nexus_status}
                      onChange={(value) => updateAssessment.mutate({ nexus_status: value })}
                      disabled={updateAssessment.isPending}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nexus Type</Label>
                    <Select
                      value={assessment.nexus_type || 'none'}
                      onValueChange={(v) => updateAssessment.mutate({ nexus_type: v === 'none' ? undefined : v })}
                      disabled={updateAssessment.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unknown</SelectItem>
                        <SelectItem value="economic">Economic</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Liability</p>
                      <p className="font-medium">
                        {assessment.estimated_liability
                          ? formatCurrency(assessment.estimated_liability)
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">First Exposure</p>
                      <p className="font-medium">
                        {assessment.first_exposure_date
                          ? new Date(assessment.first_exposure_date).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nexus Reasons */}
                {assessment.nexus_reasons && assessment.nexus_reasons.length > 0 && (
                  <div>
                    <Label className="text-xs">Nexus Reasons</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assessment.nexus_reasons.map((reason) => (
                        <Badge key={reason} variant="outline" className="text-xs">
                          {reason.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label className="text-xs">Assessment Notes</Label>
                  <Textarea
                    placeholder="Notes about nexus determination..."
                    value={assessment.notes || ''}
                    onChange={(e) => updateAssessment.mutate({ notes: e.target.value })}
                    disabled={updateAssessment.isPending}
                    className="h-20 mt-1"
                  />
                </div>
              </Card>
            </div>

            <Separator />

            {/* Action Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Remediation Action
              </h3>

              {assessment.current_action ? (
                <Card className="p-4 space-y-4">
                  {/* Action Header */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Action Type</Label>
                      <p className="font-medium mt-1">
                        {ACTION_TYPE_LABELS[assessment.current_action.action_type as ActionType]?.label}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      <ActionStatusSelector
                        value={assessment.current_action.action_status}
                        onChange={(value) =>
                          updateAction.mutate({
                            actionId: assessment.current_action!.id,
                            data: { action_status: value },
                          })
                        }
                        disabled={updateAction.isPending}
                      />
                    </div>
                  </div>

                  {/* Blocked Warning */}
                  {assessment.current_action.action_status === 'blocked' && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Action Blocked</p>
                        <Textarea
                          placeholder="Reason for blocking..."
                          value={assessment.current_action.blocked_reason || ''}
                          onChange={(e) =>
                            updateAction.mutate({
                              actionId: assessment.current_action!.id,
                              data: { blocked_reason: e.target.value },
                            })
                          }
                          className="mt-2 h-16 bg-white dark:bg-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Strategy Notes */}
                  <div>
                    <Label className="text-xs">Strategy Notes</Label>
                    <Textarea
                      placeholder="Notes about the remediation approach..."
                      value={assessment.current_action.strategy_notes || ''}
                      onChange={(e) =>
                        updateAction.mutate({
                          actionId: assessment.current_action!.id,
                          data: { strategy_notes: e.target.value },
                        })
                      }
                      disabled={updateAction.isPending}
                      className="h-20 mt-1"
                    />
                  </div>

                  <Separator />

                  {/* Task Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs">Task Checklist</Label>
                      <span className="text-xs text-muted-foreground">
                        {assessment.current_action.tasks.filter((t) => t.status === 'complete').length}/
                        {assessment.current_action.tasks.length} complete
                      </span>
                    </div>
                    <TaskChecklist
                      tasks={assessment.current_action.tasks}
                      clientId={clientId}
                      state={state}
                      actionId={assessment.current_action.id}
                    />
                  </div>
                </Card>
              ) : (
                <>
                  {showCreateAction ? (
                    <CreateActionForm
                      clientId={clientId}
                      state={state}
                      assessmentId={assessment.id}
                      onCreated={() => setShowCreateAction(false)}
                    />
                  ) : (
                    <Card className="p-6 text-center border-dashed">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No action has been created for this state yet.
                      </p>
                      <Button onClick={() => setShowCreateAction(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Action
                      </Button>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default StateDetailDrawer
