import { StateResult } from '@/types/states'

/**
 * Get Tailwind color class for nexus status icon
 */
export function getNexusColor(status: string): string {
  switch (status) {
    case 'has_nexus':
      return 'bg-red-500'
    case 'approaching':
      return 'bg-yellow-500'
    case 'no_nexus':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Get Tailwind color class for threshold percentage text
 */
export function getThresholdColor(percent: number): string {
  if (percent >= 100) {
    return 'text-red-600 font-semibold'
  } else if (percent >= 90) {
    return 'text-yellow-600 font-semibold'
  } else {
    return 'text-green-600'
  }
}

/**
 * Get display label for nexus status
 */
export function getNexusStatusLabel(status: string): string {
  switch (status) {
    case 'has_nexus':
      return 'Has Nexus'
    case 'approaching':
      return 'Approaching'
    case 'no_nexus':
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
    case 'physical':
      return 'Physical'
    case 'economic':
      return 'Economic'
    case 'both':
      return 'Physical + Economic'
    case 'none':
      return ''
    default:
      return ''
  }
}

/**
 * Get Tailwind badge classes for confidence level
 */
export function getConfidenceBadge(level: string): string {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Sort states by specified column and order
 */
export function sortStates(
  states: StateResult[],
  sortBy: string,
  order: 'asc' | 'desc'
): StateResult[] {
  const sorted = [...states].sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortBy) {
      case 'nexus_status':
        // Custom order: has_nexus > approaching > no_nexus
        const statusOrder = { has_nexus: 3, approaching: 2, no_nexus: 1 }
        aVal = statusOrder[a.nexus_status as keyof typeof statusOrder]
        bVal = statusOrder[b.nexus_status as keyof typeof statusOrder]
        // Secondary sort by liability
        if (aVal === bVal) {
          return b.estimated_liability - a.estimated_liability
        }
        break

      case 'state':
        aVal = a.state_name
        bVal = b.state_name
        break

      case 'revenue':
        aVal = a.total_sales
        bVal = b.total_sales
        break

      case 'threshold':
        aVal = a.threshold_percent
        bVal = b.threshold_percent
        break

      case 'liability':
        aVal = a.estimated_liability
        bVal = b.estimated_liability
        break

      case 'confidence':
        const confOrder = { low: 1, medium: 2, high: 3 }
        aVal = confOrder[a.confidence_level as keyof typeof confOrder]
        bVal = confOrder[b.confidence_level as keyof typeof confOrder]
        break

      default:
        return 0
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
}

/**
 * Apply filters to state list
 */
export function applyFilters(
  states: StateResult[],
  filters: {
    nexus: string
    registration: string
    confidence: string
    search: string
  }
): StateResult[] {
  let filtered = states

  // Nexus status filter
  if (filters.nexus !== 'all') {
    filtered = filtered.filter((s) => s.nexus_status === filters.nexus)
  }

  // Registration filter
  if (filters.registration !== 'all') {
    filtered = filtered.filter(
      (s) => s.registration_status === filters.registration
    )
  }

  // Confidence filter
  if (filters.confidence !== 'all') {
    filtered = filtered.filter((s) => s.confidence_level === filters.confidence)
  }

  // Search filter (state name or code)
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.state_name.toLowerCase().includes(query) ||
        s.state_code.toLowerCase().includes(query)
    )
  }

  return filtered
}
