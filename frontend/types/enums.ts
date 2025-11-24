/**
 * Shared enum constants used throughout the application
 * Using const objects instead of TypeScript enums for better tree-shaking
 */

// Nexus Status - indicates whether a state has nexus obligation
export const NexusStatus = {
  HAS_NEXUS: 'has_nexus',
  APPROACHING: 'approaching',
  NO_NEXUS: 'no_nexus',
  NONE: 'none',
} as const

export type NexusStatusType = (typeof NexusStatus)[keyof typeof NexusStatus]

// Nexus Type - indicates the type of nexus (physical, economic, or both)
export const NexusType = {
  PHYSICAL: 'physical',
  ECONOMIC: 'economic',
  BOTH: 'both',
  NONE: 'none',
} as const

export type NexusTypeValue = (typeof NexusType)[keyof typeof NexusType]

// Analysis Status - indicates the current state of an analysis
export const AnalysisStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PROCESSING: 'processing',
  CALCULATING: 'calculating',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

export type AnalysisStatusType = (typeof AnalysisStatus)[keyof typeof AnalysisStatus]

// Client Status - indicates the current engagement status of a client
export const ClientStatus = {
  PROSPECT: 'prospect',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CHURNED: 'churned',
} as const

export type ClientStatusType = (typeof ClientStatus)[keyof typeof ClientStatus]

// Lifecycle Status - detailed lifecycle stage for clients
export const LifecycleStatus = {
  PROSPECT: 'prospect',
  SCOPING: 'scoping',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
} as const

export type LifecycleStatusType = (typeof LifecycleStatus)[keyof typeof LifecycleStatus]

// Helper functions for working with status values

/**
 * Check if a nexus status indicates active nexus
 */
export function hasActiveNexus(status: string): boolean {
  return status === NexusStatus.HAS_NEXUS
}

/**
 * Check if a nexus status indicates approaching threshold
 */
export function isApproachingThreshold(status: string): boolean {
  return status === NexusStatus.APPROACHING
}

/**
 * Check if an analysis is complete
 */
export function isAnalysisComplete(status: string): boolean {
  return status === AnalysisStatus.COMPLETE
}

/**
 * Check if a client is currently active (active or paused)
 */
export function isClientActive(status: string): boolean {
  return status === ClientStatus.ACTIVE || status === ClientStatus.PAUSED
}

/**
 * Get display label for nexus status
 */
export function getNexusStatusLabel(status: string): string {
  switch (status) {
    case NexusStatus.HAS_NEXUS:
      return 'Has Nexus'
    case NexusStatus.APPROACHING:
      return 'Approaching'
    case NexusStatus.NO_NEXUS:
    case NexusStatus.NONE:
      return 'No Nexus'
    default:
      return 'Unknown'
  }
}

/**
 * Get display label for nexus type
 */
export function getNexusTypeLabel(type: string): string {
  switch (type) {
    case NexusType.PHYSICAL:
      return 'Physical Nexus'
    case NexusType.ECONOMIC:
      return 'Economic Nexus'
    case NexusType.BOTH:
      return 'Physical + Economic'
    case NexusType.NONE:
      return 'No Nexus'
    default:
      return 'Unknown'
  }
}

/**
 * Get display label for client status
 */
export function getClientStatusLabel(status: string): string {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'Prospect'
    case ClientStatus.ACTIVE:
      return 'Active'
    case ClientStatus.PAUSED:
      return 'Paused'
    case ClientStatus.CHURNED:
      return 'Archived'
    default:
      return 'Prospect'
  }
}
