/**
 * State result from backend API
 * Represents nexus determination, revenue, and liability for one state
 */
export interface StateResult {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'no_nexus'
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  total_sales: number
  exempt_sales: number
  taxable_sales: number
  direct_sales: number
  marketplace_sales: number
  threshold: number
  threshold_percent: number
  estimated_liability: number
  confidence_level: 'high' | 'medium' | 'low'
  registration_status: 'registered' | 'not_registered' | null
}

/**
 * API response from GET /results/states
 */
export interface StateResultsResponse {
  analysis_id: string
  total_states: number
  states: StateResult[]
}

/**
 * Filter values for state table
 */
export interface StateFilters {
  nexus: 'all' | 'has_nexus' | 'approaching' | 'no_nexus'
  registration: 'all' | 'registered' | 'not_registered'
  confidence: 'all' | 'high' | 'medium' | 'low'
}

/**
 * Sort configuration for state table
 */
export interface StateSort {
  column: 'nexus_status' | 'state' | 'revenue' | 'threshold' | 'liability' | 'confidence'
  order: 'asc' | 'desc'
}
