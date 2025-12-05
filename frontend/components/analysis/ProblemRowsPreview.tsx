'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Download } from 'lucide-react'

interface ProblemRow {
  row: number
  field: string
  value: string
  message: string
}

interface ProblemRowsPreviewProps {
  validCount: number
  problems: ProblemRow[]
  onDownloadProblems?: () => void
}

const MAX_INLINE_PROBLEMS = 15

export default function ProblemRowsPreview({
  validCount,
  problems,
  onDownloadProblems
}: ProblemRowsPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasProblems = problems.length > 0
  const showDownload = problems.length > MAX_INLINE_PROBLEMS

  return (
    <Card className={hasProblems ? 'border-orange-200' : 'border-green-200'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Import Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valid rows */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm">
            <span className="font-semibold">{validCount.toLocaleString()}</span> rows valid
          </span>
        </div>

        {/* Problem rows */}
        {hasProblems && (
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between px-0 hover:bg-transparent"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-sm">
                  <span className="font-semibold">{problems.length}</span> rows with issues (will be excluded)
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isOpen && (
              <div className="mt-2">
                <div className="bg-muted/50 rounded-md p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {problems.slice(0, MAX_INLINE_PROBLEMS).map((problem, idx) => (
                    <div key={idx} className="text-sm flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">Row {problem.row}</Badge>
                      <span className="text-muted-foreground">
                        {problem.field}: "{problem.value}" - {problem.message}
                      </span>
                    </div>
                  ))}
                  {problems.length > MAX_INLINE_PROBLEMS && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      ...and {problems.length - MAX_INLINE_PROBLEMS} more issues
                    </div>
                  )}
                </div>
                {showDownload && onDownloadProblems && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={onDownloadProblems}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download all {problems.length} problem rows
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action button hint */}
        <div className="pt-2 border-t text-sm text-muted-foreground">
          {hasProblems ? (
            <span>Click "Import {validCount.toLocaleString()}" to proceed with valid rows only.</span>
          ) : (
            <span>All rows are valid and ready to import.</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
