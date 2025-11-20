'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getClient, type Client } from '@/lib/api/clients'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TabsCustom } from '@/components/ui/tabs-custom'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { EngagementGenerator } from '@/components/clients/EngagementGenerator'
import {
  Building2, Phone, Mail, Globe, MapPin,
  FileText, Plus, Calendar, Clock,
  CheckCircle2, AlertCircle, Download
} from 'lucide-react'

// Mock data for now - connect to real API in next step
const MOCK_NOTES = [
  { id: 1, type: 'discovery', title: 'Initial Discovery Call', date: '2024-03-10', content: 'Client sells primarily SaaS B2B. Concerned about NY and TX exposure. Using Stripe for billing.' },
  { id: 2, type: 'email', title: 'Data Request Sent', date: '2024-03-12', content: 'Sent standard DRL for 2021-2023 transaction data.' },
]

export default function ClientCRMPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true)
        const data = await getClient(params.id as string)
        setClient(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [params.id])

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading client profile...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Client not found</p>
            <Button onClick={() => router.push('/clients')} className="mt-4">Back to Clients</Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: client.company_name }
        ]}
      >
        {/* CRM HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{client.company_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {client.industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {client.industry}</span>}
                {client.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {client.website}</span>}
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">Active Client</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/clients/${client.id}/edit`)}>Edit Profile</Button>
            <Button>New Engagement</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COL: CONTACT & INFO */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="font-semibold text-foreground">Primary Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                    {client.contact_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{client.contact_name || 'No contact'}</p>
                    <p className="text-xs text-muted-foreground">Primary Point of Contact</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {client.contact_email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {client.contact_phone || 'N/A'}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Active Engagements</h3>
              <div className="space-y-4">
                {/* Mock Engagement Item */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">Nexus Study 2024</p>
                    <Badge className="text-[10px] h-5">Signed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Signed on Mar 1, 2024</p>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                    <FileText className="h-3 w-3 mr-2" /> View Letter
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                  <Plus className="h-3 w-3 mr-2" /> Create Engagement Letter
                </Button>
              </div>
            </Card>

            {/* Engagement Generator */}
            <EngagementGenerator client={client} />
          </div>

          {/* CENTER COL: ACTIVITY & NOTES */}
          <div className="lg:col-span-2 space-y-6">
            <TabsCustom
              defaultTab="overview"
              variant="pills"
              items={[
                {
                  id: 'overview',
                  label: 'Activity & Notes',
                  content: (
                    <div className="space-y-6 pt-4">
                      {/* Quick Note Entry */}
                      <Card className="p-4 bg-muted/30 border-dashed">
                        <Textarea
                          placeholder="Log a call, meeting note, or thought..."
                          className="bg-background mb-3 border-muted-foreground/20"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                        />
                        <div className="flex justify-between items-center">
                           <div className="flex gap-2">
                             <Badge variant="outline" className="cursor-pointer hover:bg-background">Discovery</Badge>
                             <Badge variant="outline" className="cursor-pointer hover:bg-background">Call</Badge>
                           </div>
                           <Button size="sm" disabled={!newNote}>Log Note</Button>
                        </div>
                      </Card>

                      {/* Timeline */}
                      <div className="space-y-6 pl-4 border-l border-border/50 ml-2">
                        {MOCK_NOTES.map((note) => (
                          <div key={note.id} className="relative">
                            <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background ${note.type === 'discovery' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${note.type === 'discovery' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                    {note.type.toUpperCase()}
                                  </span>
                                  <span className="font-medium text-sm">{note.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{note.date}</span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {note.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                },
                {
                  id: 'analyses',
                  label: 'Tax Analyses',
                  content: (
                    <div className="pt-4">
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-medium">Project History</h3>
                         <Button onClick={() => router.push('/analysis/new')} size="sm">
                           <Plus className="h-4 w-4 mr-2" /> New Analysis
                         </Button>
                       </div>

                       {/* This would be your Analysis List Table filtered by this client */}
                       <Card className="p-8 text-center text-muted-foreground border-dashed">
                         <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                         <p>No active analyses for this client.</p>
                         <Button onClick={() => router.push('/analysis/new')} variant="outline" size="sm" className="mt-4">
                           <Plus className="h-4 w-4 mr-2" /> Start First Analysis
                         </Button>
                       </Card>
                    </div>
                  )
                },
                {
                  id: 'files',
                  label: 'Files & Docs',
                  content: (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>File manager coming in Phase 2</p>
                    </div>
                  )
                }
              ]}
            />
          </div>

        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
