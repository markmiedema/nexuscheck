'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { listClients, deleteClient, type Client } from '@/lib/api/clients'
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
import {
  Eye,
  Trash2,
  Search,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  AlertTriangle,
  MapPin,
  FolderOpen,
  Plus,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Building2,
  Briefcase,
  User,
  Mail,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SortConfig = {
  column: 'company_name' | 'industry' | 'created_at' | null
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadClients()
  }, [debouncedSearchTerm])

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

  // Stats calculation
  const stats = useMemo(() => {
    const filtered = clients.filter(c =>
      c.company_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
    return {
      totalClients: clients.length,
      filteredCount: filtered.length,
      recentCount: clients.filter(c => {
        const daysSince = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince <= 30
      }).length,
      withContactCount: clients.filter(c => c.contact_email || c.contact_phone).length,
    }
  }, [clients, debouncedSearchTerm])

  const displayedClients = useMemo(() => {
    let filtered = clients.filter(c =>
      c.company_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.industry?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )

    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.column!] ?? ''
        const bVal = b[sortConfig.column!] ?? ''
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        const comparison = Number(aVal) - Number(bVal)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }
    return filtered
  }, [clients, sortConfig, debouncedSearchTerm])

  // --- CLIENT CARD COMPONENT ---
  const ClientCard = ({ client }: { client: Client }) => {
    // Avatar Color Generator
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
              <span className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</span>
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
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/clients/${client.id}#notes`)
            }}
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
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Client List</h1>
              <p className="text-muted-foreground mt-1">Manage your client nexus assessments.</p>
            </div>
            <Button onClick={() => router.push('/clients/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Clients', value: stats.totalClients, icon: Building2, color: 'text-blue-600' },
              { label: 'Added (30d)', value: stats.recentCount, icon: Clock, color: 'text-emerald-600' },
              { label: 'With Contact', value: stats.withContactCount, icon: Users, color: 'text-purple-600' },
              { label: 'Shown', value: stats.filteredCount, icon: Search, color: 'text-orange-600' },
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : displayedClients.length === 0 ? (
             <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No clients found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first client.'}
              </p>
              <Button onClick={() => router.push('/clients/new')}>
                <Plus className="mr-2 h-4 w-4" /> New Client
              </Button>
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
                        <TableHead className="w-[30%]">Company</TableHead>
                        <TableHead className="w-[20%]">Contact</TableHead>
                        <TableHead className="w-[15%]">Industry</TableHead>
                        <TableHead className="w-[20%]">Email</TableHead>
                        <TableHead className="w-[10%]">Created</TableHead>
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
                            <TableCell className="text-muted-foreground">{client.contact_name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{client.industry || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">{client.contact_email || '-'}</TableCell>
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
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
