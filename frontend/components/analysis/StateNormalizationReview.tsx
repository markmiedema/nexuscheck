'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

interface StateMapping {
  original: string
  normalized: string
}

interface StateNormalizationReviewProps {
  normalized: StateMapping[]
  unchanged: StateMapping[]
  unrecognized: string[]
}

export default function StateNormalizationReview({
  normalized,
  unchanged,
  unrecognized
}: StateNormalizationReviewProps) {
  if (normalized.length === 0 && unchanged.length === 0 && unrecognized.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">State Normalization Preview</CardTitle>
        <CardDescription>
          Review how your state values will be converted to standard codes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Normalized values */}
        {normalized.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Will be normalized:</p>
            <div className="flex flex-wrap gap-2">
              {normalized.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded">
                  <span>"{item.original}"</span>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="secondary">{item.normalized}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unchanged values */}
        {unchanged.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Already valid ({unchanged.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {unchanged.slice(0, 10).map((item, idx) => (
                <Badge key={idx} variant="outline">{item.normalized}</Badge>
              ))}
              {unchanged.length > 10 && (
                <Badge variant="outline">+{unchanged.length - 10} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Unrecognized values */}
        {unrecognized.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Not recognized (will be excluded):
            </p>
            <div className="flex flex-wrap gap-1">
              {unrecognized.map((value, idx) => (
                <Badge key={idx} variant="destructive">"{value}"</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
