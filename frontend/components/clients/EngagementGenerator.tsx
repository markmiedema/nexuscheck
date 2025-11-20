'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check } from 'lucide-react'

// Simple templates
const TEMPLATES = {
  nexus_study: `Dear {contact_name},

This letter confirms our engagement to perform a Sales Tax Nexus Study for {company_name}.

SCOPE OF SERVICES:
1. Review of sales data from {period_start} to present.
2. Determination of economic and physical nexus in all 45 states + DC.
3. Calculation of estimated historical liability.

FEE:
Our fee for this service is fixed at $X,XXX.

Sincerely,
The SALT Team`,
  vda: `Dear {contact_name},

Re: Voluntary Disclosure Agreement Services

We are pleased to assist {company_name} with VDA filings. This engagement covers anonymous negotiation, narrative drafting, and closing agreements...`
}

export function EngagementGenerator({ client }: { client: any }) {
  const [type, setType] = useState('nexus_study')
  const [copied, setCopied] = useState(false)

  const generateText = () => {
    let text = TEMPLATES[type as keyof typeof TEMPLATES]
    text = text.replace(/{contact_name}/g, client.contact_name || 'Client')
    text = text.replace(/{company_name}/g, client.company_name)
    text = text.replace(/{period_start}/g, 'Jan 1, 2021') // Example
    return text
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-medium">Engagement Letter Generator</h3>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="nexus_study">Nexus Study</SelectItem>
          <SelectItem value="vda">VDA Project</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <Textarea
          className="h-48 font-mono text-xs bg-muted/50"
          readOnly
          value={generateText()}
        />
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied' : 'Copy Text'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Copy this text to your letterhead or email to send to the client.
      </p>
    </Card>
  )
}
