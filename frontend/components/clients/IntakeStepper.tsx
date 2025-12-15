'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  useClientIntakeItems,
  useClientIntakeStatus,
  useInitializeClientIntake,
  useUpdateClientIntakeItem,
  type IntakeItem,
} from '@/hooks/queries'
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Building2,
  Users,
  FileCheck,
  Database,
} from 'lucide-react'

// Step configuration
const STEPS = [
  { id: 'business_model', label: 'Business Model', icon: Building2, description: 'Sales channels, product types, tech stack' },
  { id: 'physical_presence', label: 'Physical Presence', icon: Users, description: 'Remote employees, inventory, offices' },
  { id: 'registrations', label: 'Registrations', icon: FileCheck, description: 'Current state registrations' },
  { id: 'data_request', label: 'Data Requests', icon: Database, description: 'Sales data, returns, certificates' },
]

// Status badge configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
  not_requested: { label: 'Not Requested', variant: 'outline', className: 'text-muted-foreground' },
  requested: { label: 'Requested', variant: 'secondary', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  received: { label: 'Received', variant: 'default', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  validated: { label: 'Validated', variant: 'default', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  not_applicable: { label: 'N/A', variant: 'outline', className: 'text-muted-foreground' },
}

interface IntakeStepperProps {
  clientId: string
  onComplete?: () => void
}

// Step Progress Indicator
function StepIndicator({ currentStep, steps, completionByCategory }: {
  currentStep: number
  steps: typeof STEPS
  completionByCategory: Record<string, { total: number; completed: number }>
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isComplete = completionByCategory[step.id]?.completed === completionByCategory[step.id]?.total && completionByCategory[step.id]?.total > 0
        const isCurrent = index === currentStep
        const isPast = index < currentStep

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  isComplete
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isPast
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center max-w-[80px] ${
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  isPast || isComplete ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Intake Item Card
function IntakeItemCard({
  item,
  onStatusChange
}: {
  item: IntakeItem
  onStatusChange: (status: string) => void
}) {
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_requested

  return (
    <Card className={`p-4 ${item.is_required ? 'border-l-4 border-l-primary' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{item.label}</span>
            {item.is_required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
          )}
          <Badge variant={statusConfig.variant} className={`text-xs ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          {item.status === 'not_requested' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('requested')}>
                <Clock className="h-3 w-3 mr-1" />
                Request
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatusChange('not_applicable')}>
                Mark N/A
              </Button>
            </>
          )}
          {item.status === 'requested' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('received')}>
                <Upload className="h-3 w-3 mr-1" />
                Received
              </Button>
            </>
          )}
          {item.status === 'received' && (
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onStatusChange('validated')}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Validate
            </Button>
          )}
          {(item.status === 'validated' || item.status === 'not_applicable') && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatusChange('not_requested')}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Show due date and notes if present */}
      {(item.due_date || item.notes) && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {item.due_date && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due: {new Date(item.due_date).toLocaleDateString()}
            </span>
          )}
          {item.notes && <p className="mt-1">{item.notes}</p>}
        </div>
      )}
    </Card>
  )
}

// Main IntakeStepper Component
export function IntakeStepper({ clientId, onComplete }: IntakeStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const { data: intakeItems = [], isLoading: itemsLoading } = useClientIntakeItems(clientId)
  const { data: intakeStatus, isLoading: statusLoading } = useClientIntakeStatus(clientId)
  const initializeMutation = useInitializeClientIntake(clientId)
  const updateItemMutation = useUpdateClientIntakeItem(clientId)

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, IntakeItem[]> = {}
    intakeItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })
    return grouped
  }, [intakeItems])

  // Calculate completion by category
  const completionByCategory = useMemo(() => {
    const result: Record<string, { total: number; completed: number }> = {}
    STEPS.forEach(step => {
      const items = itemsByCategory[step.id] || []
      result[step.id] = {
        total: items.length,
        completed: items.filter(i => ['received', 'validated', 'not_applicable'].includes(i.status)).length
      }
    })
    return result
  }, [itemsByCategory])

  // Get current step items
  const currentStepItems = itemsByCategory[STEPS[currentStep].id] || []
  const currentStepCompletion = completionByCategory[STEPS[currentStep].id]

  // Handle item status change
  const handleStatusChange = (itemId: string, newStatus: string) => {
    updateItemMutation.mutate({ itemId, data: { status: newStatus } })
  }

  // Handle initialize intake
  const handleInitialize = () => {
    initializeMutation.mutate()
  }

  // Navigation
  const canGoNext = currentStep < STEPS.length - 1
  const canGoPrev = currentStep > 0
  const isLastStep = currentStep === STEPS.length - 1

  if (itemsLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If no intake items exist, show initialize button
  if (intakeItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">No Intake Items</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Initialize the intake checklist to start tracking client data collection.
        </p>
        <Button onClick={handleInitialize} disabled={initializeMutation.isPending}>
          {initializeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize Intake Checklist'
          )}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Overall Intake Progress</span>
          <span className="text-sm font-medium">{intakeStatus?.completion_percentage || 0}%</span>
        </div>
        <Progress value={intakeStatus?.completion_percentage || 0} className="h-2" />
      </Card>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        steps={STEPS}
        completionByCategory={completionByCategory}
      />

      {/* Current Step Content */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {(() => {
            const StepIcon = STEPS[currentStep].icon
            return <StepIcon className="h-5 w-5 text-primary" />
          })()}
          <div>
            <h3 className="font-semibold">{STEPS[currentStep].label}</h3>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline">
              {currentStepCompletion.completed}/{currentStepCompletion.total} complete
            </Badge>
          </div>
        </div>

        <Separator className="mb-4" />

        {currentStepItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items for this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentStepItems.map(item => (
              <IntakeItemCard
                key={item.id}
                item={item}
                onStatusChange={(status) => handleStatusChange(item.id, status)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {isLastStep ? (
          <Button onClick={onComplete} disabled={intakeStatus?.completion_percentage !== 100}>
            {intakeStatus?.completion_percentage === 100 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete Intake
              </>
            ) : (
              'Complete all items to finish'
            )}
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canGoNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default IntakeStepper
