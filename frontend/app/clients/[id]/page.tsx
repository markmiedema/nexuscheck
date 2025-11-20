'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getClient, getClientNotes, createClientNote, type Client, type ClientNote } from '@/lib/api/clients'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TabsCustom } from '@/components/ui/tabs-custom'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { showSuccess, handleApiError } from '@/lib/utils/errorHandler'
import {
  Building2, Phone, Mail, Globe, MapPin,
  FileText, Plus, Loader2
} from 'lucide-react'

function ClientCRMPageContent() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    try {
      setLoading(true)
      const [clientData, notesData] = await Promise.all([
        getClient(params.id as string),
        getClientNotes(params.id as string)
      ])
      setClient(clientData)
      setNotes(notesData)
    } catch (err) {
      console.error(err)
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setIsSubmittingNote(true)
    try {
      await createClientNote(params.id as string, {
        title: 'General Note',
        content: newNote,
        note_type: 'general'
      })
      setNewNote('')
      showSuccess('Note added')
      // Refresh notes
      const updatedNotes = await getClientNotes(params.id as string)
      setNotes(updatedNotes)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading client data...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Client not found</p>
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
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{client.company_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {client.industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {client.industry}</span>}
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Active Client</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/analysis/new?clientId=${client.id}&clientName=${encodeURIComponent(client.company_name)}`)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Analysis
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COL: INFO */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="font-semibold text-foreground">Primary Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                    {client.contact_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{client.contact_name || 'No contact name'}</p>
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
                  {client.website && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                        {client.website}
                      </a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* CENTER COL: NOTES */}
          <div className="lg:col-span-2 space-y-6">
            <TabsCustom
              defaultTab="overview"
              items={[
                {
                  id: 'overview',
                  label: 'Activity & Notes',
                  content: (
                    <div className="space-y-6 pt-4">
                      {/* Note Input */}
                      <Card className="p-4 bg-muted/30 border-dashed">
                        <Textarea
                          placeholder="Log a call, meeting note, or thought..."
                          className="bg-background mb-3"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                        />
                        <div className="flex justify-end">
                           <Button size="sm" disabled={!newNote || isSubmittingNote} onClick={handleAddNote}>
                             {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Note'}
                           </Button>
                        </div>
                      </Card>

                      {/* Timeline Feed */}
                      <div className="space-y-6 pl-4 border-l border-border/50 ml-2">
                        {notes.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                        )}
                        {notes.map((note) => (
                          <div key={note.id} className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-blue-500" />
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                    {note.note_type.toUpperCase()}
                                  </span>
                                  <span className="font-medium text-sm">{note.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {note.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
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

export default function ClientCRMPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <AppLayout maxWidth="7xl">
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    }>
      <ClientCRMPageContent />
    </Suspense>
  )
}
