/**
 * Shared formatting utilities for consistent display across the application
 */

export interface CurrencyFormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  compact?: boolean
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(
  value: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
  } = options

  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Format a number as USD currency with no decimal places (for whole dollar amounts)
 */
export function formatCurrencyWhole(value: number): string {
  return formatCurrency(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export interface NumberFormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

/**
 * Format a number with locale-aware separators
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(value)
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a number as a percentage from a decimal (0.15 -> "15%")
 */
export function formatPercentageFromDecimal(
  value: number,
  decimals: number = 0
): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a date string for display
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return new Date(date).toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format a date string with time for display
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
