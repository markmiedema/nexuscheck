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
import { generateAndDownloadReport, ReportType } from '@/lib/api/reports'
import { handleApiError } from '@/lib/utils/errorHandler'

interface ReportDownloadProps {
  analysisId: string
  companyName: string
  hasResults: boolean
  statesWithNexus?: string[] // For state-specific report options
}

export function ReportDownload({
  analysisId,
  companyName,
  hasResults,
  statesWithNexus = [],
}: ReportDownloadProps) {
  const [generating, setGenerating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [includeAllStates, setIncludeAllStates] = useState(true)
  const [includeStateDetails, setIncludeStateDetails] = useState(true)

  const handleGenerateReport = async (reportType: ReportType, stateCode?: string) => {
    if (!hasResults) return

    try {
      setGenerating(true)
      await generateAndDownloadReport(analysisId, companyName, {
        reportType,
        stateCode,
        includeAllStates,
        includeStateDetails,
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
    handleGenerateReport('detailed')
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
          <DropdownMenuItem onClick={() => handleGenerateReport('summary')}>
            <FileText className="h-4 w-4 mr-2" />
            Executive Summary
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowOptions(true)}>
            Custom Report Options...
          </DropdownMenuItem>
          {statesWithNexus.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                State-Specific Reports
              </div>
              {statesWithNexus.slice(0, 5).map((stateCode) => (
                <DropdownMenuItem
                  key={stateCode}
                  onClick={() => handleGenerateReport('state', stateCode)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {stateCode} Detailed Report
                </DropdownMenuItem>
              ))}
              {statesWithNexus.length > 5 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  +{statesWithNexus.length - 5} more states...
                </div>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Options Dialog */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Options</DialogTitle>
            <DialogDescription>
              Customize what to include in your PDF report.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAllStates"
                checked={includeAllStates}
                onCheckedChange={(checked) => setIncludeAllStates(checked as boolean)}
              />
              <Label htmlFor="includeAllStates" className="text-sm font-normal">
                Include complete state-by-state summary table
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeStateDetails"
                checked={includeStateDetails}
                onCheckedChange={(checked) => setIncludeStateDetails(checked as boolean)}
              />
              <Label htmlFor="includeStateDetails" className="text-sm font-normal">
                Include detailed year-by-year breakdowns for each state
              </Label>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              Note: More detailed reports will be larger and take longer to generate.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptions(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleGenerateReport('detailed')}
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
