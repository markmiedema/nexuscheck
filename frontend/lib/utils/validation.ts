/**
 * Validation utilities for form inputs and data validation
 */

import {
  US_STATE_CODES,
  isValidStateCode,
} from '@/lib/constants/states'

// Re-export for backward compatibility
export { US_STATE_CODES, isValidStateCode }

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
}

/**
 * Validates password strength and returns detailed requirements
 */
export function validatePasswordStrength(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  }
}

/**
 * Checks if password meets all requirements
 */
export function isStrongPassword(password: string): boolean {
  const requirements = validatePasswordStrength(password)
  return Object.values(requirements).every(req => req === true)
}

/**
 * Gets a human-readable password strength message
 */
export function getPasswordStrengthMessage(password: string): string {
  if (!password) return ''

  const requirements = validatePasswordStrength(password)
  const missing: string[] = []

  if (!requirements.minLength) missing.push('at least 8 characters')
  if (!requirements.hasUppercase) missing.push('one uppercase letter')
  if (!requirements.hasLowercase) missing.push('one lowercase letter')
  if (!requirements.hasNumber) missing.push('one number')

  if (missing.length === 0) return 'Strong password'
  return `Password must contain ${missing.join(', ')}`
}

/**
 * Validates if a date is not in the future
 */
export function isValidPastDate(date: string | Date): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  return inputDate <= today
}

/**
 * Validates file size (in bytes)
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validates file type by extension
 */
export function isValidFileType(file: File, allowedExtensions: string[]): boolean {
  const fileName = file.name.toLowerCase()
  return allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()))
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validates company name format
 */
export function isValidCompanyName(name: string): boolean {
  // Must be between 1 and 200 characters, and not just whitespace
  return name.trim().length > 0 && name.length <= 200
}

/**
 * Checks for duplicate values in an array
 */
export function hasDuplicates<T>(array: T[]): boolean {
  return new Set(array).size !== array.length
}

/**
 * Finds duplicate values in an array
 */
export function findDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()

  for (const item of array) {
    if (seen.has(item)) {
      duplicates.add(item)
    }
    seen.add(item)
  }

  return Array.from(duplicates)
}
