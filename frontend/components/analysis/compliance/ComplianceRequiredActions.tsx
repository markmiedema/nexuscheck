'use client'

import { memo } from 'react'

interface RegistrationInfo {
  registration_url: string | null
  dor_website: string | null
}

interface ComplianceRequiredActionsProps {
  stateName: string
  registrationInfo: RegistrationInfo
}

export const ComplianceRequiredActions = memo(function ComplianceRequiredActions({
  stateName,
  registrationInfo,
}: ComplianceRequiredActionsProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Required Actions</h3>
      <div className="space-y-3 bg-muted/50 rounded-lg border border-border p-6">
        <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            disabled
            aria-label="Register for sales tax permit"
          />
          <div className="flex-1">
            <p className="font-medium">Register for {stateName} sales tax permit</p>
            <p className="text-sm text-muted-foreground">
              Register by: 30 days from nexus date
            </p>
            {registrationInfo.registration_url && (
              <a
                href={registrationInfo.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline"
              >
                → Register Online - {stateName} Portal
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            disabled
            aria-label="Collect sales tax"
          />
          <div className="flex-1">
            <p className="font-medium">Collect sales tax on future {stateName} sales</p>
            <p className="text-sm text-muted-foreground">
              Effective: Date nexus was established
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-3 bg-background dark:bg-card border rounded-md">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            disabled
            aria-label="File sales tax returns"
          />
          <div className="flex-1">
            <p className="font-medium">File sales tax returns</p>
            <p className="text-sm text-muted-foreground">
              Filing frequency: Based on your volume
            </p>
            <p className="text-sm text-muted-foreground">
              First filing deadline: TBD after registration
            </p>
            {registrationInfo.dor_website && (
              <a
                href={registrationInfo.dor_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline"
              >
                → View Filing Requirements
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
