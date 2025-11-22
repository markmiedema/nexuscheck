'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Map,
  ShieldAlert,
  FileCheck,
  RefreshCw,
  ArrowRight,
  Plus,
  AlertTriangle,
  Lock,
  CheckCircle2
} from "lucide-react"
import apiClient from '@/lib/api/client'

interface Engagement {
  id: string
  title: string
  status: string
  scope_config: {
    services?: string[]
    legacy?: boolean
  } | null
}

interface NewProjectDialogProps {
  clientId: string
  clientName: string
}

export function NewProjectDialog({ clientId, clientName }: NewProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeEngagement, setActiveEngagement] = useState<Engagement | null>(null)
  const [noEngagement, setNoEngagement] = useState(false)

  // Check for active engagement when dialog opens
  useEffect(() => {
    if (open) {
      checkEngagement()
    }
  }, [open, clientId])

  const checkEngagement = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/api/v1/engagements/client/${clientId}/active`)
      if (response.data) {
        setActiveEngagement(response.data)
        setNoEngagement(false)
      } else {
        setActiveEngagement(null)
        setNoEngagement(true)
      }
    } catch (error) {
      // No active engagement found
      setActiveEngagement(null)
      setNoEngagement(true)
    } finally {
      setLoading(false)
    }
  }

  // Check if service is authorized
  const isServiceAuthorized = (serviceId: string): boolean => {
    if (!activeEngagement) return false
    if (activeEngagement.scope_config?.legacy) return true // Legacy engagements allow all
    const services = activeEngagement.scope_config?.services || []
    return services.length === 0 || services.includes(serviceId)
  }

  const projectTypes = [
    {
      id: 'nexus_study',
      title: 'Nexus Study',
      description: 'Diagnostic analysis of sales data to determine tax obligations.',
      icon: Map,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=nexus`,
      tier: 'Tier 1'
    },
    {
      id: 'vda_remediation',
      title: 'VDA / Remediation',
      description: 'Anonymous voluntary disclosure to clear past liabilities.',
      icon: ShieldAlert,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=vda`,
      tier: 'Tier 4'
    },
    {
      id: 'state_registration',
      title: 'State Registration',
      description: 'Filing forms to register for sales tax permits.',
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=registration`,
      tier: 'Tier 2'
    },
    {
      id: 'monthly_compliance',
      title: 'Monthly Compliance',
      description: 'Recurring filing setup and notice management.',
      icon: RefreshCw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=compliance`,
      tier: 'Tier 3'
    }
  ]

  const handleSelect = async (type: typeof projectTypes[0]) => {
    if (!activeEngagement) return

    // Add engagement_id to route
    const routeWithEngagement = `${type.route}&engagementId=${activeEngagement.id}`
    setOpen(false)
    router.push(routeWithEngagement)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Engagement Type</DialogTitle>
          {activeEngagement && (
            <DialogDescription className="flex items-center gap-2 pt-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Under engagement: <strong>{activeEngagement.title}</strong></span>
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : noEngagement ? (
          // No signed engagement - show gate
          <div className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Engagement Required</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You need a signed engagement letter before creating projects for this client.
                This ensures proper scope definition and authorization.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setOpen(false)
                  router.push(`/clients/${clientId}?tab=engagements`)
                }}>
                  Go to Engagements
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Has active engagement - show project options
          <div className="grid grid-cols-1 gap-3 py-4">
            {projectTypes.map((type) => {
              const authorized = isServiceAuthorized(type.id)

              return (
                <Card
                  key={type.id}
                  className={`p-4 flex items-center gap-4 transition-all ${
                    authorized
                      ? 'cursor-pointer hover:border-primary hover:shadow-md group'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => authorized && handleSelect(type)}
                >
                  <div className={`h-12 w-12 rounded-lg ${type.bgColor} flex items-center justify-center shrink-0`}>
                    {authorized ? (
                      <type.icon className={`h-6 w-6 ${type.color}`} />
                    ) : (
                      <Lock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{type.title}</h3>
                      <div className="flex items-center gap-2">
                        {!authorized && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                            Not in Scope
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {type.tier}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type.description}
                    </p>
                  </div>

                  {authorized && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
