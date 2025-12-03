'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileDown, ChevronDown, FileText, Loader2 } from 'lucide-react'
import { generateAndDownloadReport } from '@/lib/api/reports'
import { handleApiError } from '@/lib/utils/errorHandler'
import { Input } from '@/components/ui/input'

interface ReportDownloadProps {
  analysisId: string
  companyName: string
  hasResults: boolean
}

export function ReportDownload({
  analysisId,
  companyName,
  hasResults,
}: ReportDownloadProps) {
  const [generating, setGenerating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [includeStateDetails, setIncludeStateDetails] = useState(true)
  const [preparerName, setPreparerName] = useState('')
  const [preparerFirm, setPreparerFirm] = useState('')

  const handleGenerateReport = async () => {
    if (!hasResults) return

    try {
      setGenerating(true)
      await generateAndDownloadReport(analysisId, companyName, {
        includeStateDetails,
        preparerName: preparerName || undefined,
        preparerFirm: preparerFirm || undefined,
      })
    } catch (error) {
      handleApiError(error, {
        userMessage: 'Failed to generate report. Please try again.',
      })
    } finally {
      setGenerating(false)
      setShowOptions(false)
    }
  }

  const handleQuickDownload = () => {
    handleGenerateReport()
  }

  if (!hasResults) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <FileDown className="h-4 w-4" />
        Download Report
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Download Report'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleQuickDownload}>
            <FileText className="h-4 w-4 mr-2" />
            Full Report (PDF)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowOptions(true)}>
            Customize Report...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Options Dialog */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Report</DialogTitle>
            <DialogDescription>
              Add preparer information and customize report options.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preparerName">Preparer Name (optional)</Label>
              <Input
                id="preparerName"
                placeholder="e.g., John Smith, CPA"
                value={preparerName}
                onChange={(e) => setPreparerName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preparerFirm">Firm Name (optional)</Label>
              <Input
                id="preparerFirm"
                placeholder="e.g., Smith Tax Advisory LLC"
                value={preparerFirm}
                onChange={(e) => setPreparerFirm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="includeStateDetails"
                checked={includeStateDetails}
                onCheckedChange={(checked) => setIncludeStateDetails(checked as boolean)}
              />
              <Label htmlFor="includeStateDetails" className="text-sm font-normal">
                Include detailed state-by-state pages
              </Label>
            </div>

            <div className="text-xs text-muted-foreground">
              The report includes automatic VDA savings calculations for all nexus states.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptions(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
