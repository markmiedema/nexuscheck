'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StateResult } from '@/types/states'

interface StateTableSectionProps {
  title: string
  count: number
  states: StateResult[]
  defaultExpanded: boolean
  children: React.ReactNode
}

export function StateTableSection({
  title,
  count,
  states,
  defaultExpanded,
  children
}: StateTableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (count === 0) {
    return null
  }

  return (
    <div className="border border-border rounded-lg mb-4 bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {title} ({count} {count === 1 ? 'state' : 'states'})
          </h3>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
