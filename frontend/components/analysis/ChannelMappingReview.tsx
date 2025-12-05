'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ChannelMapping {
  original: string
  normalized: string
}

interface ChannelMappingReviewProps {
  recognized: ChannelMapping[]
  unrecognized: string[]
  onUnrecognizedMapped: (mappings: Record<string, string>) => void
}

export default function ChannelMappingReview({
  recognized,
  unrecognized,
  onUnrecognizedMapped
}: ChannelMappingReviewProps) {
  const [userMappings, setUserMappings] = useState<Record<string, string>>({})

  const handleMapping = (original: string, normalized: string) => {
    const updated = { ...userMappings, [original]: normalized }
    setUserMappings(updated)
    onUnrecognizedMapped(updated)
  }

  if (recognized.length === 0 && unrecognized.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Sales Channel Mapping</CardTitle>
        <CardDescription>
          Review how your sales channel values will be categorized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recognized values */}
        {recognized.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recognized values:</p>
            <div className="space-y-1">
              {recognized.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>"{item.original}"</span>
                  <span className="text-muted-foreground">-&gt;</span>
                  <Badge variant={item.normalized === 'marketplace' ? 'default' : 'secondary'}>
                    {item.normalized}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unrecognized values */}
        {unrecognized.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Please categorize these values:
            </p>
            <div className="space-y-2">
              {unrecognized.map((value, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm min-w-[120px]">"{value}"</span>
                  <span className="text-muted-foreground">-&gt;</span>
                  <Select
                    value={userMappings[value] || ''}
                    onValueChange={(val) => handleMapping(value, val)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
