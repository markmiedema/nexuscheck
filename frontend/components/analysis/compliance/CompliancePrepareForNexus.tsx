'use client'

import { memo } from 'react'

interface CompliancePrepareForNexusProps {
  stateName: string
}

export const CompliancePrepareForNexus = memo(function CompliancePrepareForNexus({
  stateName,
}: CompliancePrepareForNexusProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Prepare for Nexus</h3>
      <div className="bg-muted/50 rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground mb-3">
          When you cross the threshold, you'll need to:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Register for {stateName} sales tax permit within 30 days</li>
          <li>Begin collecting sales tax on {stateName} sales</li>
          <li>File returns based on your sales volume</li>
        </ol>
      </div>
    </div>
  )
})
