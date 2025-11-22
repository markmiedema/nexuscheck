'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
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
  Plus
} from "lucide-react"

interface NewProjectDialogProps {
  clientId: string
  clientName: string
}

export function NewProjectDialog({ clientId, clientName }: NewProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const projectTypes = [
    {
      id: 'nexus',
      title: 'Nexus Study',
      description: 'Diagnostic analysis of sales data to determine tax obligations.',
      icon: Map,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=nexus`,
      tier: 'Tier 1'
    },
    {
      id: 'vda',
      title: 'VDA / Remediation',
      description: 'Anonymous voluntary disclosure to clear past liabilities.',
      icon: ShieldAlert,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=vda`,
      tier: 'Tier 4'
    },
    {
      id: 'registration',
      title: 'State Registration',
      description: 'Filing forms to register for sales tax permits.',
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=registration`,
      tier: 'Tier 2'
    },
    {
      id: 'compliance',
      title: 'Monthly Compliance',
      description: 'Recurring filing setup and notice management.',
      icon: RefreshCw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      route: `/analysis/new?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&type=compliance`,
      tier: 'Tier 3'
    }
  ]

  const handleSelect = (route: string) => {
    setOpen(false)
    router.push(route)
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
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {projectTypes.map((type) => (
            <Card
              key={type.id}
              className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group flex items-center gap-4"
              onClick={() => handleSelect(type.route)}
            >
              <div className={`h-12 w-12 rounded-lg ${type.bgColor} flex items-center justify-center shrink-0`}>
                <type.icon className={`h-6 w-6 ${type.color}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{type.title}</h3>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {type.tier}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
