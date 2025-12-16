'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { NewProjectDialog } from '@/components/clients/NewProjectDialog'
import {
  useClientNotes,
  useCreateClientNote,
  useClientAnalyses,
  useDeleteAnalysis,
} from '@/hooks/queries'
import { type ClientNote, type ClientAnalysis } from '@/lib/api/clients'
import { cn } from '@/lib/utils'
import {
  FileText,
  Trash2,
  Loader2,
  BarChart2,
  MessageSquare,
} from 'lucide-react'

type HistorySubSection = 'analyses' | 'activity'

interface HistorySectionProps {
  clientId: string
  clientName: string
  initialSubSection?: HistorySubSection
}

// Note type configurations
const NOTE_TYPE_CONFIG: Record<string, {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
}> = {
  discovery: {
    label: 'Discovery',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-700',
    dotClass: 'bg-purple-500',
  },
  discovery_update: {
    label: 'Discovery Update',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-700',
    dotClass: 'bg-purple-400',
  },
  engagement: {
    label: 'Engagement',
    bgClass: 'bg-sky-50 dark:bg-sky-900/30',
    textClass: 'text-sky-700 dark:text-sky-300',
    borderClass: 'border-sky-200 dark:border-sky-700',
    dotClass: 'bg-sky-500',
  },
  call: {
    label: 'Call',
    bgClass: 'bg-orange-50 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-700',
    dotClass: 'bg-orange-500',
  },
  email: {
    label: 'Email',
    bgClass: 'bg-blue-50 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-700',
    dotClass: 'bg-blue-500',
  },
  meeting: {
    label: 'Meeting',
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-200 dark:border-green-700',
    dotClass: 'bg-green-500',
  },
  analysis: {
    label: 'Nexus Analysis',
    bgClass: 'bg-teal-50 dark:bg-teal-900/30',
    textClass: 'text-teal-700 dark:text-teal-300',
    borderClass: 'border-teal-200 dark:border-teal-700',
    dotClass: 'bg-teal-500',
  },
  deliverable: {
    label: 'Deliverable',
    bgClass: 'bg-pink-50 dark:bg-pink-900/30',
    textClass: 'text-pink-700 dark:text-pink-300',
    borderClass: 'border-pink-200 dark:border-pink-700',
    dotClass: 'bg-pink-500',
  },
  system: {
    label: 'System',
    bgClass: 'bg-gray-50 dark:bg-gray-900/30',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-200 dark:border-gray-700',
    dotClass: 'bg-gray-500',
  },
}

const DEFAULT_NOTE_CONFIG = NOTE_TYPE_CONFIG.call

// Sub-navigation items
const SUB_NAV_ITEMS: { id: HistorySubSection; label: string; icon: typeof FileText }[] = [
  { id: 'analyses', label: 'Analyses', icon: BarChart2 },
  { id: 'activity', label: 'Activity Log', icon: MessageSquare },
]

// Analyses Sub-section
function AnalysesSubSection({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const router = useRouter()
  const { data: analyses = [], isLoading } = useClientAnalyses(clientId)
  const deleteAnalysisMutation = useDeleteAnalysis()

  const handleDeleteAnalysis = (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return
    deleteAnalysisMutation.mutate(analysisId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Nexus Analyses ({analyses.length})
        </h3>
        <NewProjectDialog clientId={clientId} clientName={clientName} />
      </div>

      {analyses.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No analyses yet for this client.</p>
          <div className="mt-4">
            <NewProjectDialog clientId={clientId} clientName={clientName} />
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => router.push(`/analysis/${analysis.id}/results`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Nexus Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.analysis_period_start && analysis.analysis_period_end
                      ? `${new Date(analysis.analysis_period_start).toLocaleDateString()} - ${new Date(analysis.analysis_period_end).toLocaleDateString()}`
                      : `Started ${new Date(analysis.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={analysis.status === 'complete' ? 'default' : 'outline'}
                    className={
                      analysis.status === 'complete'
                        ? ''
                        : analysis.status === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }
                  >
                    {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteAnalysis(analysis.id, e)}
                    disabled={deleteAnalysisMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {analysis.status === 'complete' && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {analysis.states_with_nexus !== undefined && (
                    <span>{analysis.states_with_nexus} states with nexus</span>
                  )}
                  {analysis.total_liability !== undefined && (
                    <span>${analysis.total_liability.toLocaleString()} est. liability</span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Activity Sub-section
function ActivitySubSection({ clientId }: { clientId: string }) {
  const { data: notes = [], isLoading } = useClientNotes(clientId)
  const createNoteMutation = useCreateClientNote(clientId)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<string>('call')

  const handleSaveNote = () => {
    if (!newNote.trim()) return
    createNoteMutation.mutate(
      { content: newNote, note_type: noteType },
      { onSuccess: () => setNewNote('') }
    )
  }

  const noteTypes = ['call', 'email', 'meeting', 'discovery', 'analysis', 'deliverable']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Note Entry */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <Textarea
          placeholder="Log a note..."
          className="bg-background mb-3 border-muted-foreground/20"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5 flex-wrap">
            {noteTypes.map((type) => {
              const config = NOTE_TYPE_CONFIG[type] || DEFAULT_NOTE_CONFIG
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-all text-xs',
                    noteType === type
                      ? `${config.bgClass} ${config.textClass} ${config.borderClass}`
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setNoteType(type)}
                >
                  {config.label}
                </Badge>
              )
            })}
          </div>
          <Button
            size="sm"
            disabled={!newNote || createNoteMutation.isPending}
            onClick={handleSaveNote}
          >
            {createNoteMutation.isPending ? 'Saving...' : 'Log Note'}
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4 pl-4 border-l border-border/50 ml-2">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet. Log your first interaction above.</p>
          </div>
        ) : (
          notes.map((note) => {
            const config = NOTE_TYPE_CONFIG[note.note_type || 'call'] || DEFAULT_NOTE_CONFIG
            return (
              <div key={note.id} className="relative">
                <div
                  className={cn(
                    'absolute -left-[21px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-background',
                    config.dotClass
                  )}
                />
                <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-semibold px-2.5 py-0.5',
                        config.bgClass,
                        config.textClass,
                        config.borderClass
                      )}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {note.content}
                  </p>
                </Card>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Main History Section
export function HistorySection({
  clientId,
  clientName,
  initialSubSection = 'analyses',
}: HistorySectionProps) {
  const [activeSubSection, setActiveSubSection] = useState<HistorySubSection>(initialSubSection)

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="border-b">
        <nav className="flex gap-1" aria-label="History sections">
          {SUB_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveSubSection(item.id)}
                className={cn(
                  'rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors',
                  activeSubSection === item.id
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeSubSection === 'analyses' && (
          <AnalysesSubSection clientId={clientId} clientName={clientName} />
        )}

        {activeSubSection === 'activity' && (
          <ActivitySubSection clientId={clientId} />
        )}
      </div>
    </div>
  )
}

export default HistorySection
