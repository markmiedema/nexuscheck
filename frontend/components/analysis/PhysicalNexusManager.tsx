'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePhysicalNexusConfig } from '@/hooks/usePhysicalNexusConfig'
import { PhysicalNexusForm } from './PhysicalNexusForm'
import { Plus, Download, Upload, Edit, Trash2 } from 'lucide-react'
import { useRef } from 'react'

interface PhysicalNexusManagerProps {
  analysisId: string
  clientId?: string
  onRecalculated?: () => void | Promise<void>
}

export function PhysicalNexusManager({ analysisId, clientId, onRecalculated }: PhysicalNexusManagerProps) {
  const {
    configs,
    loading,
    showForm,
    setShowForm,
    editingState,
    formData,
    addOrUpdateNexus,
    editNexus,
    deleteNexus,
    exportConfig,
    importConfig,
    cancelForm
  } = usePhysicalNexusConfig(analysisId, { onRecalculated, clientId })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await importConfig(file)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Physical Nexus Configuration</CardTitle>
              <CardDescription>
                Manage states where you have physical presence (office, warehouse, employees)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportConfig}
                disabled={configs.length === 0 || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add State
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                No physical nexus configurations yet.
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First State
              </Button>
            </div>
          ) : (
            <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/80 border-b-2 border-border sticky top-0 z-10">
                    <TableRow className="hover:bg-muted/80">
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">State</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Nexus Date</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Reason</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Registration</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Permit Number</TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.state_code} className="hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                        <TableCell className="px-4 py-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{config.state_code}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">{formatDate(config.nexus_date)}</TableCell>
                        <TableCell className="px-4 py-4 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{config.reason}</span>
                            {config.notes?.includes('Auto-populated') && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">
                                From Discovery
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {config.registration_date ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{formatDate(config.registration_date)}</span>
                              {config.permit_number && (
                                <span className="text-xs text-muted-foreground">
                                  {config.permit_number}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not registered</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {config.permit_number || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editNexus(config.state_code)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNexus(config.state_code)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PhysicalNexusForm
        open={showForm}
        onOpenChange={(open) => !open && cancelForm()}
        onSubmit={addOrUpdateNexus}
        initialData={formData}
        editingState={editingState}
      />
    </>
  )
}
