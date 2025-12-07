import apiClient from './api/client'

// Upload/Validation Response Types

export interface UploadResponse {
  message: string
  analysis_id: string
  auto_detected_mappings: {
    mappings: Record<string, string>
    confidence: Record<string, number>
    samples: Record<string, any[]>
    summary: {
      total_columns: number
      required_detected: number
      optional_detected: number
    }
    required_detected: Record<string, boolean>
    optional_detected: Record<string, boolean>
  }
  all_required_detected: boolean
  optional_columns_found: number
  columns_detected: string[]
  date_range_detected: {
    start: string
    end: string
    auto_populated: boolean
  } | null
}

export interface PenaltyBreakdown {
  late_filing?: number
  late_payment?: number
  negligence?: number | null
  e_filing_failure?: number | null
  fraud?: number | null
  operating_without_permit?: number | null
  late_registration?: number | null
  unregistered_business?: number | null
  cost_of_collection?: number | null
  extended_delinquency?: number | null
  total: number
}

export interface StateDetailResponse {
  state_code: string
  state_name: string
  analysis_id: string
  has_transactions: boolean
  analysis_period: {
    years_available: number[]
  }
  year_data: YearData[]
  compliance_info: ComplianceInfo
  // Aggregate totals across all years (for "All Years" view)
  // All fields below are always returned by backend (not optional)
  total_sales: number
  taxable_sales: number
  exempt_sales: number
  direct_sales: number
  marketplace_sales: number
  exposure_sales: number
  transaction_count: number
  estimated_liability: number
  base_tax: number
  interest: number
  penalties: number
  penalty_breakdown?: PenaltyBreakdown | null  // Detailed penalty breakdown
  interest_rate?: number | null  // Annual interest rate percentage
  interest_method?: string | null  // Calculation method
  days_outstanding?: number | null  // Days since obligation started
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  first_nexus_year: number | null  // Null if no nexus established
}

export interface YearData {
  year: number
  nexus_status: 'has_nexus' | 'approaching' | 'none'
  nexus_date?: string // V2: Date when nexus was established
  obligation_start_date?: string // V2: Date when tax obligation begins
  first_nexus_year?: number // V2: Year when nexus was first established (for sticky nexus)
  summary: {
    total_sales: number  // Gross sales
    transaction_count: number
    direct_sales: number
    marketplace_sales: number
    taxable_sales: number  // All taxable sales for year
    exposure_sales: number  // Taxable sales during obligation
    exempt_sales: number   // Exempt sales (informational)
    estimated_liability: number
    base_tax: number
    interest: number       // ← Fixed: Always returned (0 if none), not optional
    penalties: number      // ← Fixed: Always returned (0 if none), not optional
    penalty_breakdown?: PenaltyBreakdown | null  // Detailed penalty breakdown
    // Metadata (correctly optional - can be null)
    interest_rate?: number
    interest_method?: string
    days_outstanding?: number
    penalty_rate?: number
  }
  threshold_info: {
    revenue_threshold: number | null
    transaction_threshold: number | null
    threshold_operator: string | null
    percentage_of_threshold: number
    amount_until_nexus: number
    amount_over_nexus: number | null
    approaching: boolean
  }
  monthly_sales: {
    month: string
    sales: number
    transaction_count: number
  }[]
  transactions: {
    transaction_id: string
    transaction_date: string
    sales_amount: number
    taxable_amount: number
    exempt_amount: number
    is_taxable: boolean
    sales_channel: 'direct' | 'marketplace'
    running_total: number
  }[]
}

export interface ComplianceInfo {
  tax_rates: {
    state_rate: number
    avg_local_rate: number
    combined_rate: number
    max_local_rate: number
  }
  threshold_info: {
    revenue_threshold: number | null
    transaction_threshold: number | null
    threshold_operator: 'or' | 'and' | null
  }
  registration_info: {
    registration_required: boolean
    registration_fee: number
    filing_frequencies: string[]
    registration_url: string | null
    dor_website: string | null
    registration_threshold?: string | null
    estimated_timeline?: string | null
  }
  filing_frequency: string
  filing_method: string
  sstm_member: boolean
}

export async function getStateDetail(
  analysisId: string,
  stateCode: string
): Promise<StateDetailResponse> {
  const url = `/api/v1/analyses/${analysisId}/states/${stateCode}`

  const response = await apiClient.get<StateDetailResponse>(url)

  return response.data
}
