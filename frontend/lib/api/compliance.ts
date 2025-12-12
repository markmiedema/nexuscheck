import apiClient from './client'

// Types for compliance data
export interface ThresholdData {
  state_code: string
  state_name: string
  has_sales_tax: boolean
  revenue_threshold: number | null
  transaction_threshold: number | null
  threshold_operator: string | null
  effective_date: string | null
  has_local_taxes: boolean
  has_home_rule_cities: boolean
  state_tax_rate: number | null
  avg_local_rate: number | null
  combined_rate: number | null
  has_vda_program: boolean
  notes: string | null
}

export interface StateDetailData {
  state_code: string
  state_name: string
  has_sales_tax: boolean
  economic_nexus_effective_date: string | null
  revenue_threshold: number | null
  transaction_threshold: number | null
  threshold_operator: string | null
  threshold_effective_from: string | null
  has_local_taxes: boolean
  has_home_rule_cities: boolean
  state_tax_rate: number | null
  avg_local_rate: number | null
  combined_rate: number | null
  has_vda_program: boolean
  vda_contact_email: string | null
  vda_contact_phone: string | null
  state_tax_website: string | null
  registration_url: string | null
  typical_processing_time_days: number | null
  annual_interest_rate: number | null
  interest_calculation_method: string | null
  late_filing_penalty_rate: number | null
  late_payment_penalty_rate: number | null
  notes: string | null
}

export interface ThresholdsResponse {
  success: boolean
  data: ThresholdData[]
  total_count: number
}

export interface StateDetailResponse {
  success: boolean
  data: StateDetailData
}

// API functions
export async function getThresholds(): Promise<ThresholdsResponse> {
  const response = await apiClient.get<ThresholdsResponse>('/api/v1/compliance/thresholds')
  return response.data
}

export async function getStateDetail(stateCode: string): Promise<StateDetailResponse> {
  const response = await apiClient.get<StateDetailResponse>(`/api/v1/compliance/states/${stateCode}`)
  return response.data
}
