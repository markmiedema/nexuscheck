'use client'

import { memo } from 'react'

interface RegistrationInfo {
  registration_url: string | null
  dor_website: string | null
}

interface ComplianceResourcesProps {
  stateName: string
  registrationInfo: RegistrationInfo
  showRegistrationLinks?: boolean
  showVdaLinks?: boolean
}

export const ComplianceResources = memo(function ComplianceResources({
  stateName,
  registrationInfo,
  showRegistrationLinks = true,
  showVdaLinks = true,
}: ComplianceResourcesProps) {
  const stateSlug = stateName.toLowerCase().replace(/\s+/g, '')

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Helpful Resources</h3>
      <div className="space-y-3 text-sm bg-muted/50 rounded-lg border border-border p-6">
        {/* Official Department Links */}
        <div>
          <p className="font-medium text-foreground mb-1">Official Department</p>
          <a
            href={registrationInfo.dor_website || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-foreground hover:underline ml-2"
          >
            → {stateName} Department of Revenue Website
          </a>
          <p className="text-muted-foreground ml-2 mt-1">
            → Phone: (555) 123-4567 [Placeholder]
          </p>
          <p className="text-muted-foreground ml-2">
            → Email: taxhelp@{stateSlug}.gov [Placeholder]
          </p>
        </div>

        {/* Registration */}
        {showRegistrationLinks && (
          <div>
            <p className="font-medium text-foreground mb-1">Registration</p>
            <a
              href={registrationInfo.registration_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:underline ml-2"
            >
              → Online Registration Portal
            </a>
            <a
              href="#"
              className="block text-foreground hover:underline ml-2"
            >
              → Registration Instructions & Requirements
            </a>
          </div>
        )}

        {/* VDA Information */}
        {showVdaLinks && (
          <div>
            <p className="font-medium text-foreground mb-1">Voluntary Disclosure Agreement</p>
            <a
              href="#"
              className="block text-foreground hover:underline ml-2"
            >
              → {stateName} VDA Program Overview
            </a>
            <a
              href="#"
              className="block text-foreground hover:underline ml-2"
            >
              → VDA Application Process
            </a>
            <p className="text-muted-foreground ml-2 mt-1">
              → VDA Contact: vda@{stateSlug}.gov [Placeholder]
            </p>
          </div>
        )}

        {/* Reference Materials */}
        <div>
          <p className="font-medium text-foreground mb-1">Reference Materials</p>
          <a
            href="#"
            className="block text-foreground hover:underline ml-2"
          >
            → Economic Nexus Statute & Regulations
          </a>
          <a
            href="#"
            className="block text-foreground hover:underline ml-2"
          >
            → Tax Rate Lookup Tool
          </a>
          <a
            href="#"
            className="block text-foreground hover:underline ml-2"
          >
            → Filing Requirements & Deadlines
          </a>
          {showVdaLinks && (
            <a
              href="#"
              className="block text-foreground hover:underline ml-2"
            >
              → Supporting Case Law & Precedents
            </a>
          )}
        </div>
      </div>
    </div>
  )
})
