'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { listClients, deleteClient, createClientNote, type Client } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TabsCustom } from '@/components/ui/tabs-custom'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Eye,
  Trash2,
  Search,
  Clock,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Building2,
  Briefcase,
  User,
  Mail,
  Users,
  FileText,
  Archive,
  Plus,
  FolderOpen,
  Target,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SortConfig = {
  column: 'company_name' | 'contact_name' | 'industry' | 'created_at' | null
  direction: 'asc' | 'desc'
}

type ViewMode = 'grid' | 'list'

export default function ClientsPage() {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' })

  // NEW: Default to 'active' tab, but options are: 'active', 'prospects', 'archived'
  const [activeTab, setActiveTab] = useState('active')

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<string>('call')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      const data = await listClients()
      setClients(data)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to load clients' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(clientId: string, clientName: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!confirm(`Delete client "${clientName}"?`)) return

    try {
      setDeleteLoading(clientId)
      await deleteClient(clientId)
      showSuccess(`Deleted client "${clientName}"`)
      await loadClients()
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to delete client' })
    } finally {
      setDeleteLoading(null)
    }
  }

  function handleOpenNoteModal(client: Client, e?: React.MouseEvent) {
    e?.stopPropagation()
    setSelectedClient(client)
    setNewNote('')
    setNoteType('call')
    setNoteModalOpen(true)
  }

  async function handleSaveNote() {
    if (!newNote.trim() || !selectedClient) return

    try {
      setSavingNote(true)
      await createClientNote(selectedClient.id, {
        content: newNote,
        note_type: noteType
      })
      showSuccess('Note saved successfully')
      setNoteModalOpen(false)
      setNewNote('')
      setSelectedClient(null)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to save note' })
    } finally {
      setSavingNote(false)
    }
  }

  // --- SORT HANDLER ---
  function handleSort(column: SortConfig['column']) {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // --- SORTABLE HEADER COMPONENT ---
  const SortableHeader = ({ column, children, className = '' }: { column: SortConfig['column'], children: React.ReactNode, className?: string }) => {
    const isActive = sortConfig.column === column
    return (
      <TableHead
        className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortConfig.direction === 'asc' ?
              <ArrowUp className="h-3 w-3 text-primary" /> :
              <ArrowDown className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
          )}
        </div>
      </TableHead>
    )
  }

  // --- FILTERING LOGIC (THE 3 BUCKETS) ---
  const { displayedClients, stats } = useMemo(() => {
    // 1. Filter by Search Term
    let filtered = clients.filter(c =>
      c.company_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.industry?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )

    // 2. Filter by Tab (Status Buckets)
    if (activeTab === 'archived') {
        // Bucket 3: Churned
        filtered = filtered.filter(c => c.status === 'churned')
    } else if (activeTab === 'prospects') {
        // Bucket 2: Prospects (prospect or null)
        filtered = filtered.filter(c => c.status === 'prospect' || !c.status)
    } else {
        // Bucket 1: Active (active or paused)
        filtered = filtered.filter(c => c.status === 'active' || c.status === 'paused')
    }

    // 3. Sort
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.column!] ?? ''
        const bVal = b[sortConfig.column!] ?? ''
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        // @ts-ignore - simple number sort for now
        const comparison = Number(aVal) - Number(bVal)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    // 4. Calculate Stats
    return {
      displayedClients: filtered,
      stats: {
        totalClients: clients.length,
        activeCount: clients.filter(c => c.status === 'active' || c.status === 'paused').length,
        prospectCount: clients.filter(c => c.status === 'prospect' || !c.status).length,
        archivedCount: clients.filter(c => c.status === 'churned').length,
      }
    }
  }, [clients, sortConfig, debouncedSearchTerm, activeTab])

  // --- HELPER: STATUS BADGE ---
  const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
        case 'active':
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">Active</Badge>
        case 'paused':
            return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Paused</Badge>
        case 'churned':
            return <Badge variant="secondary">Archived</Badge>
        default:
            return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Prospect</Badge>
    }
  }

  // --- CLIENT CARD COMPONENT ---
  const ClientCard = ({ client }: { client: Client }) => {
    const initial = client.company_name.charAt(0).toUpperCase()
    const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700']
    const avatarColor = colors[client.company_name.length % colors.length]

    return (
      <div
        onClick={() => router.push(`/clients/${client.id}`)}
        className="group relative flex flex-col bg-card hover:shadow-card border border-border/60 rounded-xl p-5 transition-all cursor-pointer hover:-translate-y-1"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor} border border-white/10 shadow-sm`}>
              {initial}
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{client.company_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</span>
                 <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(client.id, client.company_name, e as any)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3 py-4 border-t border-b border-dashed border-border/60 my-2">
          {client.industry && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{client.industry}</span>
            </div>
          )}
          {client.contact_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{client.contact_name}</span>
            </div>
          )}
          {client.contact_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{client.contact_email}</span>
            </div>
          )}
          {!client.industry && !client.contact_name && !client.contact_email && (
            <p className="text-xs text-muted-foreground italic">No additional details</p>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleOpenNoteModal(client, e)}
          >
            <FileText className="mr-1.5 h-3 w-3" />
            Log Note
          </Button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-primary flex items-center">
            View Profile &rarr;
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Client Registry</h1>
              <p className="text-muted-foreground mt-1">Manage nexus compliance and engagement lifecycles.</p>
            </div>
            <Button onClick={() => router.push('/clients/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Button>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Pipeline (Prospects)', value: stats.prospectCount, icon: Target, color: 'text-blue-600' },
              { label: 'Active Clients', value: stats.activeCount, icon: Building2, color: 'text-emerald-600' },
              { label: 'Archived', value: stats.archivedCount, icon: Archive, color: 'text-gray-500' },
              { label: 'Total', value: stats.totalClients, icon: Users, color: 'text-purple-600' },
            ].map((stat, i) => (
              <Card key={i} className="p-4 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-background ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* TABS & FILTERS */}
          <div className="space-y-4 mb-6">
             <TabsCustom
                defaultTab="active"
                onTabChange={setActiveTab}
                variant="pills"
                items={[
                    {
                        id: 'prospects',
                        label: 'Prospects & Leads',
                        content: null
                    },
                    {
                        id: 'active',
                        label: 'Active Clients',
                        content: null
                    },
                    {
                        id: 'archived',
                        label: 'Archived',
                        content: null
                    }
                ]}
             />

             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/50"
                    />
                </div>

                <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                    <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Grid View"
                    >
                    <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    title="List View"
                    >
                    <ListIcon className="h-4 w-4" />
                    </button>
                </div>
                </div>
             </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : displayedClients.length === 0 ? (
             <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* Dynamic Empty State Messaging */}
              <h3 className="text-lg font-semibold text-foreground">
                {activeTab === 'active' ? 'No active clients' :
                 activeTab === 'prospects' ? 'Pipeline is empty' :
                 'No archived records'}
              </h3>

              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                {searchTerm
                    ? 'Try adjusting your search terms.'
                    : activeTab === 'prospects'
                        ? 'Add a new lead to start scoping their nexus exposure.'
                        : activeTab === 'active'
                            ? 'Promote a prospect or add a new client to see them here.'
                            : 'Clients you delete or mark as churned will appear here.'}
              </p>

              {activeTab !== 'archived' && (
                  <Button onClick={() => router.push('/clients/new')}>
                    <Plus className="mr-2 h-4 w-4" /> New Client
                  </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                  {displayedClients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm animate-in fade-in duration-500">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <SortableHeader column="company_name" className="w-[30%]">Company</SortableHeader>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <SortableHeader column="contact_name" className="w-[20%]">Contact</SortableHeader>
                        <SortableHeader column="industry" className="w-[15%]">Industry</SortableHeader>
                        <SortableHeader column="created_at" className="w-[15%]">Created</SortableHeader>
                        <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedClients.map((client) => {
                        return (
                          <TableRow
                            key={client.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/clients/${client.id}`)}
                          >
                            <TableCell className="font-medium">{client.company_name}</TableCell>
                            <TableCell><StatusBadge status={client.status} /></TableCell>
                            <TableCell className="text-muted-foreground">{client.contact_name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{client.industry || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={(e) => handleDelete(client.id, client.company_name, e as any)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

        </AppLayout>

        {/* Log Note Modal (unchanged logic) */}
        <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Log Note for {selectedClient?.company_name}</DialogTitle>
              <DialogDescription>
                Add a quick note about your interaction with this client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Log a call, meeting note, or thought..."
                className="min-h-[120px]"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['discovery', 'call', 'email', 'meeting'].map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={`cursor-pointer capitalize ${noteType === type ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-muted'}`}
                        onClick={() => setNoteType(type)}
                      >
                        {type}
                      </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={!newNote.trim() || savingNote}>
                  {savingNote ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
