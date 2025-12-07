/**
 * Penalty and Interest Configuration Types
 *
 * Comprehensive schema for state-specific penalty and interest calculations.
 * Supports all variations found across US states including:
 * - Simple and compound interest methods
 * - Split-year interest rates
 * - Flat, tiered, per-period, and per-day penalties
 * - Combined penalty caps
 * - Minimum/maximum thresholds with "greater of" logic
 */

// ============================================
// INTEREST CONFIGURATION
// ============================================

/**
 * Time period for interest rates that change during the year
 * (e.g., California: 11% Jan-Jun, 10% Jul-Dec)
 */
export interface InterestPeriod {
  startDate: string // ISO date: "2025-01-01"
  endDate: string // ISO date: "2025-06-30"
  annualRate?: number // 0.11 for 11%
  monthlyRate?: number // 0.01 for 1%/month
}

/**
 * Interest calculation configuration
 * Supports single rates, monthly rates, and time-varying rates
 */
export interface InterestConfig {
  // Option 1: Single annual rate (most states)
  annualRate?: number // 0.07 for 7%

  // Option 2: Monthly rate (CT, MS, SD, WY, OK, NV, ND)
  monthlyRate?: number // 0.01 for 1%/month

  // Option 3: Time-varying rates (CA, MI, TN, WV)
  periods?: InterestPeriod[]

  // Calculation method
  method: 'simple' | 'compound_monthly' | 'compound_daily'

  // Minimum interest amount (SD: min $5)
  minimumAmount?: number
}

// ============================================
// PENALTY RULE TYPES
// ============================================

/**
 * Union type for all penalty rule structures
 */
export type PenaltyRule =
  | FlatPenalty
  | FlatFeePenalty
  | PerPeriodPenalty
  | PerDayPenalty
  | TieredPenalty
  | BasePlusPerPeriodPenalty

/**
 * Type 1: Flat Percentage Penalty
 * Examples:
 * - AL: 10%
 * - AL: 10% or $50 (greater of)
 * - FL: 10% max 50%
 * - MS: 10%, +10% after 60 days
 */
export interface FlatPenalty {
  type: 'flat'
  rate: number // 0.10 for 10%

  // Minimum handling
  minimumAmount?: number // $50
  useGreaterOf?: boolean // true = "10% OR $50, whichever greater"

  // Maximum cap (FL late payment: 10% but max 50%)
  maxRate?: number // 0.50 for max 50%

  // Additional penalty after X days (MS, MD)
  additionalAfterDays?: {
    days: number // 60
    additionalRate: number // 0.10 for +10%
  }
}

/**
 * Type 2: Flat Fee Only (no percentage)
 * Examples:
 * - TX late filing: $50
 * - WI late filing: $20
 */
export interface FlatFeePenalty {
  type: 'flat_fee'
  amount: number // 50 for $50
}

/**
 * Type 3: Per Period (Month or 30 Days) Penalty
 * Examples:
 * - AZ: 4.5%/month max 25%
 * - AR: 5%/month max 35% min $50
 * - KY: 2% per 30 days max 20% min $10
 * - NJ: 5%/month max 25% + $100
 */
export interface PerPeriodPenalty {
  type: 'per_period'
  ratePerPeriod: number // 0.045 for 4.5%
  periodType: 'month' | '30_days'

  // Caps and minimums
  maxRate?: number // 0.25 for max 25%
  minimumAmount?: number // $50
  useGreaterOf?: boolean // For min comparison

  // Additional flat fee on top (NJ: 5%/month max 25% + $100)
  additionalFlatFee?: number // 100 for +$100
}

/**
 * Type 4: Per Day Penalty
 * Examples:
 * - RI: $10/day max $500
 */
export interface PerDayPenalty {
  type: 'per_day'
  amountPerDay: number // 10 for $10
  maxAmount: number // 500 for $500
}

/**
 * Tier definition for tiered penalties
 */
export interface PenaltyTier {
  startDay: number // 1, 31, 61
  endDay: number | null // 30, 60, null (null = infinity)
  rate: number // 0.09, 0.19, 0.29
}

/**
 * Type 5: Tiered by Days Penalty
 * Examples:
 * - WA: 9% (1-30 days), 19% (31-60 days), 29% (61+ days)
 * - IL: 2% (1-30 days), 10% (31+ days)
 * - TX: 5% (1-30 days), 10% (31+ days)
 */
export interface TieredPenalty {
  type: 'tiered'
  tiers: PenaltyTier[]
}

/**
 * Escalating minimum definition for base+per-period penalties
 */
export interface EscalatingMinimum {
  afterDays: number // 60
  minimumAmount: number // 100 for $100
}

/**
 * Type 6: Base + Per Period Penalty
 * Examples:
 * - NY: 10% + 1%/month max 30%, min $50, $100 if >60 days
 * - CO: 10% + 0.5%/month max 18%
 */
export interface BasePlusPerPeriodPenalty {
  type: 'base_plus_per_period'
  baseRate: number // 0.10 for 10%
  ratePerPeriod: number // 0.01 for 1%
  periodType: 'month' | '30_days'
  maxRate?: number // 0.30 for max 30%

  // Simple minimum
  minimumAmount?: number // $50

  // Escalating minimum by days (NY: $100 if >60 days)
  escalatingMinimums?: EscalatingMinimum[]
}

// ============================================
// COMBINED PENALTY RULES
// ============================================

/**
 * Rules for combined penalty caps across penalty types
 * Examples:
 * - GA: late filing + late payment combined max 25%
 * - MS: combined max 20%
 */
export interface CombinedPenaltyRules {
  maxCombinedRate: number // 0.25 for max 25%
  appliesTo: Array<'lateFiling' | 'latePayment'>
}

// ============================================
// PENALTY APPLICATION OPTIONS
// ============================================

/**
 * Options for how penalties are calculated and applied
 */
export interface PenaltyApplicationOptions {
  // What the penalty percentage is applied to
  penaltyBase: 'tax_only' | 'tax_plus_interest'

  // For states with discretionary ranges
  discretionary?: boolean
  discretionaryNote?: string // "Up to 50% at department discretion"
}

// ============================================
// FULL STATE CONFIG
// ============================================

/**
 * Complete penalty and interest configuration for a state
 */
export interface StatePenaltyInterestConfig {
  // Interest configuration (required)
  interest: InterestConfig

  // Core penalties (null if not applicable)
  lateFiling: PenaltyRule | null
  latePayment: PenaltyRule | null

  // Combined penalty rules (GA, MS)
  combinedRules?: CombinedPenaltyRules

  // Penalty application options
  penaltyOptions?: PenaltyApplicationOptions

  // Optional additional penalties
  negligence?: PenaltyRule
  eFilingFailure?: PenaltyRule
  fraud?: PenaltyRule
  operatingWithoutPermit?: PenaltyRule
  lateRegistration?: PenaltyRule
  unregisteredBusiness?: PenaltyRule
  costOfCollection?: PenaltyRule
  extendedDelinquency?: PenaltyRule
  repeatedFailure?: PenaltyRule
  willfulDisregard?: PenaltyRule

  // Non-calculable notes (e.g., "Criminal penalties possible")
  notes?: string
}

// ============================================
// DATABASE ROW TYPE
// ============================================

/**
 * Represents a row in the state_penalty_interest_configs table
 */
export interface StatePenaltyInterestConfigRow {
  id: string
  state: string // Two-letter state code
  effective_date: string // ISO date
  annual_interest_rate: number | null // Denormalized for quick queries
  config: StatePenaltyInterestConfig
  source_url: string | null
  verified_at: string | null // ISO timestamp
  notes: string | null
  created_at: string // ISO timestamp
}

// ============================================
// CALCULATION RESULT TYPES
// ============================================

/**
 * Detailed breakdown of calculated penalties
 */
export interface PenaltyBreakdown {
  lateFiling: number
  latePayment: number
  negligence?: number
  eFilingFailure?: number
  fraud?: number
  operatingWithoutPermit?: number
  lateRegistration?: number
  unregisteredBusiness?: number
  costOfCollection?: number
  extendedDelinquency?: number
  repeatedFailure?: number
  willfulDisregard?: number
  total: number
}

/**
 * Complete calculation result with all details
 */
export interface PenaltyInterestCalculationResult {
  // Amounts
  interest: number
  penalties: PenaltyBreakdown
  totalPenalties: number
  totalLiability: number // base_tax + interest + totalPenalties

  // Calculation details
  interestRate: number // Effective annual rate used
  interestMethod: 'simple' | 'compound_monthly' | 'compound_daily'
  daysOutstanding: number
  yearsOutstanding: number

  // For display
  configUsed: {
    effectiveDate: string
    state: string
  }
}

// ============================================
// TYPE GUARDS
// ============================================

export function isFlatPenalty(rule: PenaltyRule): rule is FlatPenalty {
  return rule.type === 'flat'
}

export function isFlatFeePenalty(rule: PenaltyRule): rule is FlatFeePenalty {
  return rule.type === 'flat_fee'
}

export function isPerPeriodPenalty(rule: PenaltyRule): rule is PerPeriodPenalty {
  return rule.type === 'per_period'
}

export function isPerDayPenalty(rule: PenaltyRule): rule is PerDayPenalty {
  return rule.type === 'per_day'
}

export function isTieredPenalty(rule: PenaltyRule): rule is TieredPenalty {
  return rule.type === 'tiered'
}

export function isBasePlusPerPeriodPenalty(rule: PenaltyRule): rule is BasePlusPerPeriodPenalty {
  return rule.type === 'base_plus_per_period'
}
