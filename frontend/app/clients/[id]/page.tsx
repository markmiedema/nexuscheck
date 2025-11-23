'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getClient, listClientNotes, createClientNote, listClientAnalyses, type Client, type ClientNote, type ClientAnalysis } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TabsCustom } from '@/components/ui/tabs-custom'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ClientValueSummary } from '@/components/clients/ClientValueSummary'
import { ClientContacts } from '@/components/clients/ClientContacts'
import { NewProjectDialog } from '@/components/clients/NewProjectDialog'
import { DiscoveryProfile } from '@/components/clients/DiscoveryProfile'
import { EngagementManager } from '@/components/clients/EngagementManager'
import {
  Building2, Phone, Mail, Globe,
  FileText, Plus, Calendar,
  Trash2, ClipboardList, FileSignature,
  Users, Warehouse
} from 'lucide-react'
import apiClient from '@/lib/api/client'

export default function ClientCRMPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [client, setClient] = useState<Client | null>(null)
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [analyses, setAnalyses] = useState<ClientAnalysis[]>([])
  // Initialize tab from URL query param or default to 'overview'
  const initialTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<string>('call')
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [deletingAnalysis, setDeletingAnalysis] = useState<string | null>(null)

  // Data Request Checklist state (in real app, save to DB)
  const [checklist, setChecklist] = useState({
    salesData: false,
    priorReturns: false,
    nexusQuestionnaire: false,
    powerOfAttorney: false
  })

  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true)
        const data = await getClient(params.id as string)
        setClient(data)

        // Load notes and analyses in parallel
        const [notesData, analysesData] = await Promise.all([
          listClientNotes(params.id as string),
          listClientAnalyses(params.id as string)
        ])
        setNotes(notesData)
        setAnalyses(analysesData)
      } catch (err) {
        handleApiError(err, { userMessage: 'Failed to load client' })
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [params.id])

  const handleSaveNote = async () => {
    if (!newNote.trim()) return

    try {
      setSavingNote(true)
      const note = await createClientNote(params.id as string, {
        content: newNote,
        note_type: noteType
      })
      setNotes([note, ...notes])
      setNewNote('')
      showSuccess('Note saved successfully')
    } catch (err) {
      handleApiError(err, { userMessage: 'Failed to save note' })
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteAnalysis = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

    try {
      setDeletingAnalysis(analysisId)
      await apiClient.delete(`/api/v1/analyses/${analysisId}`)
      setAnalyses(analyses.filter(a => a.id !== analysisId))
      showSuccess('Project deleted successfully')
    } catch (err) {
      handleApiError(err, { userMessage: 'Failed to delete project' })
    } finally {
      setDeletingAnalysis(null)
    }
  }

  // Memoize discovery initialData to prevent useEffect from triggering on every parent render
  const discoveryInitialData = useMemo(() => {
    if (!client) return undefined
    return {
      channels: client.channels || [],
      product_types: client.product_types || [],
      systems: client.systems || [],
      has_remote_employees: client.has_remote_employees || false,
      remote_employee_states: client.remote_employee_states || [],
      remote_employee_state_dates: client.remote_employee_state_dates || {},
      has_inventory_3pl: client.has_inventory_3pl || false,
      inventory_3pl_states: client.inventory_3pl_states || [],
      inventory_3pl_state_dates: client.inventory_3pl_state_dates || {},
      estimated_annual_revenue: client.estimated_annual_revenue,
      transaction_volume: client.transaction_volume,
      current_registration_count: client.current_registration_count || 0,
      registered_states: client.registered_states || [],
      discovery_completed_at: client.discovery_completed_at,
      discovery_notes: client.discovery_notes,
      erp_system: client.erp_system,
      ecommerce_platform: client.ecommerce_platform,
      tax_engine: client.tax_engine
    }
  }, [client])

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
        {/* ENHANCED HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{client.company_name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Client Since {new Date(client.created_at).getFullYear()}
                </span>
                {client.industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {client.industry}</span>}
{/* Dynamic Status Badge */}
                {client.status === 'active' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active Client</Badge>
                )}
                {(client.status === 'prospect' || !client.status) && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Prospect</Badge>
                )}
                {client.status === 'paused' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>
                )}
                {client.status === 'churned' && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/clients/${client.id}/edit`)}>Edit Profile</Button>
            <NewProjectDialog
              clientId={client.id}
              clientName={client.company_name}
            />
          </div>
        </div>

        {/* VALUE SUMMARY ("RAINMAKER" VIEW) */}
        <ClientValueSummary analyses={analyses} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COL: CONTACT & INFO */}
          <div className="space-y-6">
            {/* Team Roster (Replaces static Contact Card) */}
            <ClientContacts clientId={client.id} />

            {/* Business Profile Card - Full Discovery Summary */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Business Profile</h3>
                {client.discovery_completed_at ? (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Discovery Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    Pending Discovery
                  </Badge>
                )}
              </div>

              {/* Sales Channels */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sales Channels</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.channels?.includes('dtc') && (
                    <Badge variant="outline" className="text-xs">DTC</Badge>
                  )}
                  {client.channels?.includes('amazon_fba') && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Amazon FBA</Badge>
                  )}
                  {client.channels?.includes('amazon_fbm') && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Amazon FBM</Badge>
                  )}
                  {client.channels?.includes('wholesale') && (
                    <Badge variant="outline" className="text-xs">Wholesale</Badge>
                  )}
                  {client.channels?.includes('retail') && (
                    <Badge variant="outline" className="text-xs">Retail</Badge>
                  )}
                  {client.channels?.includes('marketplace_other') && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Marketplace</Badge>
                  )}
                  {!client.channels?.length && (
                    <span className="text-xs text-muted-foreground italic">Not set</span>
                  )}
                </div>
              </div>

              {/* Product Types */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.product_types?.includes('physical_goods') && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Tangible Goods</Badge>
                  )}
                  {client.product_types?.includes('saas') && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">SaaS</Badge>
                  )}
                  {client.product_types?.includes('digital_goods') && (
                    <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800">Digital Goods</Badge>
                  )}
                  {client.product_types?.includes('services') && (
                    <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-800">Services</Badge>
                  )}
                  {client.product_types?.includes('mixed') && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">Mixed</Badge>
                  )}
                  {!client.product_types?.length && (
                    <span className="text-xs text-muted-foreground italic">Not set</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Tech Stack */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tech Stack</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ERP</span>
                    <span className="font-medium capitalize">{client.erp_system?.replace(/_/g, ' ') || <span className="text-muted-foreground italic font-normal">Not set</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-Commerce</span>
                    <span className="font-medium capitalize">{client.ecommerce_platform?.replace(/_/g, ' ') || <span className="text-muted-foreground italic font-normal">Not set</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Engine</span>
                    <span className="font-medium capitalize">{client.tax_engine?.replace(/_/g, ' ') || <span className="text-muted-foreground italic font-normal">None</span>}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Volume */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Volume</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Revenue</span>
                    <span className="font-medium">
                      {client.estimated_annual_revenue === 'under_100k' && 'Under $100K'}
                      {client.estimated_annual_revenue === '100k_500k' && '$100K - $500K'}
                      {client.estimated_annual_revenue === '500k_1m' && '$500K - $1M'}
                      {client.estimated_annual_revenue === '1m_5m' && '$1M - $5M'}
                      {client.estimated_annual_revenue === '5m_10m' && '$5M - $10M'}
                      {client.estimated_annual_revenue === 'over_10m' && 'Over $10M'}
                      {!client.estimated_annual_revenue && <span className="text-muted-foreground italic font-normal">Not set</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Vol.</span>
                    <span className="font-medium capitalize">
                      {client.transaction_volume === 'low' && 'Low (<1K/yr)'}
                      {client.transaction_volume === 'medium' && 'Medium (1K-10K/yr)'}
                      {client.transaction_volume === 'high' && 'High (>10K/yr)'}
                      {!client.transaction_volume && <span className="text-muted-foreground italic font-normal">Not set</span>}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Physical Presence / Nexus Triggers */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Physical Presence (Nexus Triggers)</p>
                <div className="space-y-2">
                  {client.has_remote_employees && (
                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                        <Users className="h-3.5 w-3.5" />
                        Remote Employees
                      </div>
                      {(client.remote_employee_states?.length ?? 0) > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {client.remote_employee_states?.map((state: string) => (
                            <Badge key={state} variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">{state}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {client.has_inventory_3pl && (
                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                        <Warehouse className="h-3.5 w-3.5" />
                        3PL / FBA Inventory
                      </div>
                      {(client.inventory_3pl_states?.length ?? 0) > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {client.inventory_3pl_states?.map((state: string) => (
                            <Badge key={state} variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">{state}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!client.has_remote_employees && !client.has_inventory_3pl && (
                    <span className="text-xs text-muted-foreground italic">No physical presence indicators</span>
                  )}
                </div>
              </div>

              {/* Current Registrations */}
              {((client.registered_states?.length ?? 0) > 0 || (client.current_registration_count ?? 0) > 0) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Current Registrations ({client.registered_states?.length || client.current_registration_count || 0} states)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {client.registered_states?.map((state: string) => (
                        <Badge key={state} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">{state}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Discovery Notes */}
              {client.discovery_notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discovery Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.discovery_notes}</p>
                  </div>
                </>
              )}

              {/* Fallback if no Discovery data at all */}
              {!client.discovery_completed_at && !client.product_types?.length && !client.channels?.length && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">Complete Discovery to populate business profile</p>
                </div>
              )}
            </Card>
          </div>

          {/* CENTER COL: ACTIVITY & NOTES */}
          <div className="lg:col-span-2 space-y-6">
            <TabsCustom
              activeTab={activeTab}
              onTabChange={setActiveTab}
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
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'discovery'
                                   ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
                                   : 'hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20'
                               }`}
                               onClick={() => setNoteType('discovery')}
                             >
                               Discovery
                             </Badge>
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'call'
                                   ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700'
                                   : 'hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20'
                               }`}
                               onClick={() => setNoteType('call')}
                             >
                               Call
                             </Badge>
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'email'
                                   ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
                                   : 'hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20'
                               }`}
                               onClick={() => setNoteType('email')}
                             >
                               Email
                             </Badge>
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'meeting'
                                   ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700'
                                   : 'hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20'
                               }`}
                               onClick={() => setNoteType('meeting')}
                             >
                               Meeting
                             </Badge>
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'analysis'
                                   ? 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700'
                                   : 'hover:bg-teal-50 hover:border-teal-200 dark:hover:bg-teal-900/20'
                               }`}
                               onClick={() => setNoteType('analysis')}
                             >
                               Nexus Analysis
                             </Badge>
                             <Badge
                               variant="outline"
                               className={`cursor-pointer transition-all ${
                                 noteType === 'deliverable'
                                   ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-700'
                                   : 'hover:bg-pink-50 hover:border-pink-200 dark:hover:bg-pink-900/20'
                               }`}
                               onClick={() => setNoteType('deliverable')}
                             >
                               Deliverable
                             </Badge>
                           </div>
                           <Button size="sm" disabled={!newNote || savingNote} onClick={handleSaveNote}>
                             {savingNote ? 'Saving...' : 'Log Note'}
                           </Button>
                        </div>
                      </Card>

                      {/* Timeline */}
                      <div className="space-y-6 pl-4 border-l border-border/50 ml-2">
                        {notes.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No notes yet. Log your first interaction above.</p>
                          </div>
                        ) : (
                          notes.map((note) => (
                            <div key={note.id} className="relative">
                              <div className={`absolute -left-[21px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-background ${
                                note.note_type === 'discovery' ? 'bg-purple-500' :
                                note.note_type === 'discovery_update' ? 'bg-purple-400' :
                                note.note_type === 'email' ? 'bg-blue-500' :
                                note.note_type === 'meeting' ? 'bg-green-500' :
                                note.note_type === 'analysis' ? 'bg-teal-500' :
                                note.note_type === 'deliverable' ? 'bg-pink-500' :
                                'bg-orange-500'
                              }`} />
                              <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${
                                      note.note_type === 'discovery' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' :
                                      note.note_type === 'discovery_update' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' :
                                      note.note_type === 'email' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' :
                                      note.note_type === 'meeting' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' :
                                      note.note_type === 'analysis' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700' :
                                      note.note_type === 'deliverable' ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700' :
                                      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                                    }`}>
                                      {note.note_type === 'discovery_update' ? 'Discovery Update' : (note.note_type || 'note').charAt(0).toUpperCase() + (note.note_type || 'note').slice(1)}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(note.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {note.content}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                },
                {
                  id: 'projects',
                  label: 'Project History',
                  content: (
                    <div className="pt-4">
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-medium">Projects</h3>
                         <NewProjectDialog
                           clientId={client.id}
                           clientName={client.company_name}
                         />
                       </div>

                       {/* Project list - analyses */}
                       {analyses.length === 0 ? (
                         <Card className="p-8 text-center text-muted-foreground border-dashed">
                           <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                           <p>No projects yet for this client.</p>
                           <div className="mt-4">
                             <NewProjectDialog
                               clientId={client.id}
                               clientName={client.company_name}
                             />
                           </div>
                         </Card>
                       ) : (
                         <div className="space-y-3">
                           {analyses.map((analysis) => (
                             <div
                               key={analysis.id}
                               className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                               onClick={() => router.push(`/analysis/${analysis.id}/results`)}
                             >
                               <div className="flex justify-between items-start mb-2">
                                 <p className="font-medium">Nexus Study</p>
                                 <div className="flex items-center gap-2">
                                   <Badge variant={analysis.status === 'complete' ? 'default' : 'outline'} className={
                                     analysis.status === 'complete'
                                       ? ''
                                       : analysis.status === 'error'
                                       ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300'
                                       : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                                   }>
                                     {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                                   </Badge>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                     onClick={(e) => handleDeleteAnalysis(analysis.id, e)}
                                     disabled={deletingAnalysis === analysis.id}
                                   >
                                     <Trash2 className="h-3 w-3" />
                                   </Button>
                                 </div>
                               </div>
                               <p className="text-sm text-muted-foreground mb-3">
                                 {analysis.analysis_period_start && analysis.analysis_period_end
                                   ? `${new Date(analysis.analysis_period_start).toLocaleDateString()} - ${new Date(analysis.analysis_period_end).toLocaleDateString()}`
                                   : `Started ${new Date(analysis.created_at).toLocaleDateString()}`}
                               </p>
                               <Button variant="outline" size="sm" className="w-full h-8 text-sm">
                                 Open
                               </Button>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )
                },
                {
                  id: 'files',
                  label: 'Data Checklist',
                  content: (
                    <div className="pt-4 space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">Data Request Checklist</h3>
                        <p className="text-sm text-muted-foreground">Track received documents for this client.</p>
                      </div>
                      <Card className="p-0 overflow-hidden">
                        <div className="divide-y">
                          {Object.entries(checklist).map(([key, checked]) => (
                            <div key={key} className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={key}
                                checked={checked}
                                onCheckedChange={(c) => setChecklist(prev => ({...prev, [key]: !!c}))}
                              />
                              <label htmlFor={key} className="flex-1 cursor-pointer font-medium text-sm capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </label>
                              {checked && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300">
                                  Received
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )
                },
                {
                  id: 'discovery',
                  label: 'Discovery',
                  content: (
                    <div className="pt-4">
                      <DiscoveryProfile
                        clientId={client.id}
                        initialData={discoveryInitialData}
                        onUpdate={() => {
                          // Reload client data to reflect changes
                          console.log('[ClientPage] onUpdate triggered, refetching client...')
                          getClient(params.id as string).then(data => {
                            console.log('[ClientPage] Refetched client data:', data)
                            setClient(data)
                          })
                        }}
                      />
                    </div>
                  )
                },
                {
                  id: 'engagements',
                  label: 'Engagements',
                  content: (
                    <div className="pt-4">
                      <EngagementManager
                        clientId={client.id}
                        clientName={client.company_name}
                        discoveryCompleted={!!client.discovery_completed_at}
                        onEngagementChange={() => {
                          // Reload client data to reflect changes
                          getClient(params.id as string).then(setClient)
                        }}
                      />
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
