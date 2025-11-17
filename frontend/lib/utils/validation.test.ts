import { describe, it, expect } from 'vitest'
import {
  isValidStateCode,
  isValidEmail,
  validatePasswordStrength,
  isStrongPassword,
  getPasswordStrengthMessage,
  isValidPastDate,
  isValidFileSize,
  isValidFileType,
  formatFileSize,
  isValidCompanyName,
  hasDuplicates,
  findDuplicates,
} from './validation'

describe('State Code Validation', () => {
  it('should validate correct US state codes', () => {
    expect(isValidStateCode('CA')).toBe(true)
    expect(isValidStateCode('NY')).toBe(true)
    expect(isValidStateCode('TX')).toBe(true)
    expect(isValidStateCode('DC')).toBe(true)
  })

  it('should validate lowercase state codes', () => {
    expect(isValidStateCode('ca')).toBe(true)
    expect(isValidStateCode('ny')).toBe(true)
  })

  it('should reject invalid state codes', () => {
    expect(isValidStateCode('XX')).toBe(false)
    expect(isValidStateCode('ZZ')).toBe(false)
    expect(isValidStateCode('AB')).toBe(false)
  })

  it('should reject malformed state codes', () => {
    expect(isValidStateCode('')).toBe(false)
    expect(isValidStateCode('C')).toBe(false)
    expect(isValidStateCode('CAL')).toBe(false)
    expect(isValidStateCode('123')).toBe(false)
  })
})

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
    expect(isValidEmail('name+tag@company.org')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user@domain')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('should reject emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
    expect(isValidEmail('user@ example.com')).toBe(false)
  })
})

describe('Password Strength Validation', () => {
  describe('validatePasswordStrength', () => {
    it('should return all requirements met for strong password', () => {
      const result = validatePasswordStrength('Passw0rd')
      expect(result.minLength).toBe(true)
      expect(result.hasUppercase).toBe(true)
      expect(result.hasLowercase).toBe(true)
      expect(result.hasNumber).toBe(true)
    })

    it('should detect missing uppercase', () => {
      const result = validatePasswordStrength('passw0rd')
      expect(result.hasUppercase).toBe(false)
      expect(result.minLength).toBe(true)
      expect(result.hasLowercase).toBe(true)
      expect(result.hasNumber).toBe(true)
    })

    it('should detect missing lowercase', () => {
      const result = validatePasswordStrength('PASSW0RD')
      expect(result.hasLowercase).toBe(false)
      expect(result.hasUppercase).toBe(true)
    })

    it('should detect missing number', () => {
      const result = validatePasswordStrength('Password')
      expect(result.hasNumber).toBe(false)
    })

    it('should detect insufficient length', () => {
      const result = validatePasswordStrength('Pass1')
      expect(result.minLength).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('should return true for strong passwords', () => {
      expect(isStrongPassword('Passw0rd')).toBe(true)
      expect(isStrongPassword('MySecure123')).toBe(true)
      expect(isStrongPassword('Admin2024!')).toBe(true)
    })

    it('should return false for weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false)
      expect(isStrongPassword('12345678')).toBe(false)
      expect(isStrongPassword('PASSWORD123')).toBe(false)
      expect(isStrongPassword('Pass1')).toBe(false)
    })
  })

  describe('getPasswordStrengthMessage', () => {
    it('should return success message for strong password', () => {
      expect(getPasswordStrengthMessage('Passw0rd')).toBe('Strong password')
    })

    it('should return empty string for empty password', () => {
      expect(getPasswordStrengthMessage('')).toBe('')
    })

    it('should list missing requirements', () => {
      const message = getPasswordStrengthMessage('pass')
      expect(message).toContain('at least 8 characters')
      expect(message).toContain('one uppercase letter')
      expect(message).toContain('one number')
    })
  })
})

describe('Date Validation', () => {
  it('should validate past dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isValidPastDate(yesterday)).toBe(true)

    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    expect(isValidPastDate(lastYear)).toBe(true)
  })

  it('should validate today as a valid past date', () => {
    const today = new Date()
    expect(isValidPastDate(today)).toBe(true)
  })

  it('should reject future dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isValidPastDate(tomorrow)).toBe(false)

    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    expect(isValidPastDate(nextYear)).toBe(false)
  })

  it('should handle string dates', () => {
    expect(isValidPastDate('2020-01-01')).toBe(true)
    expect(isValidPastDate('2099-12-31')).toBe(false)
  })
})

describe('File Validation', () => {
  describe('isValidFileSize', () => {
    it('should validate files within size limit', () => {
      const file1MB = new File(['a'.repeat(1024 * 1024)], 'test.csv')
      expect(isValidFileSize(file1MB, 5)).toBe(true)
    })

    it('should reject files exceeding size limit', () => {
      const file10MB = new File(['a'.repeat(10 * 1024 * 1024)], 'large.csv')
      expect(isValidFileSize(file10MB, 5)).toBe(false)
    })

    it('should handle exact size limit', () => {
      const file5MB = new File(['a'.repeat(5 * 1024 * 1024)], 'exact.csv')
      expect(isValidFileSize(file5MB, 5)).toBe(true)
    })
  })

  describe('isValidFileType', () => {
    it('should validate allowed file extensions', () => {
      const csvFile = new File(['data'], 'test.csv')
      expect(isValidFileType(csvFile, ['.csv'])).toBe(true)

      const xlsxFile = new File(['data'], 'test.xlsx')
      expect(isValidFileType(xlsxFile, ['.csv', '.xlsx'])).toBe(true)
    })

    it('should be case insensitive', () => {
      const file = new File(['data'], 'test.CSV')
      expect(isValidFileType(file, ['.csv'])).toBe(true)
    })

    it('should reject disallowed file extensions', () => {
      const pdfFile = new File(['data'], 'test.pdf')
      expect(isValidFileType(pdfFile, ['.csv', '.xlsx'])).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })
})

describe('Company Name Validation', () => {
  it('should validate correct company names', () => {
    expect(isValidCompanyName('Acme Corp')).toBe(true)
    expect(isValidCompanyName('ABC Inc.')).toBe(true)
    expect(isValidCompanyName('A')).toBe(true)
  })

  it('should reject empty or whitespace-only names', () => {
    expect(isValidCompanyName('')).toBe(false)
    expect(isValidCompanyName('   ')).toBe(false)
    expect(isValidCompanyName('\t\n')).toBe(false)
  })

  it('should reject names exceeding 200 characters', () => {
    const longName = 'A'.repeat(201)
    expect(isValidCompanyName(longName)).toBe(false)
  })

  it('should accept names up to 200 characters', () => {
    const maxName = 'A'.repeat(200)
    expect(isValidCompanyName(maxName)).toBe(true)
  })
})

describe('Duplicate Detection', () => {
  describe('hasDuplicates', () => {
    it('should detect duplicates in array', () => {
      expect(hasDuplicates([1, 2, 3, 2])).toBe(true)
      expect(hasDuplicates(['a', 'b', 'a'])).toBe(true)
    })

    it('should return false for arrays without duplicates', () => {
      expect(hasDuplicates([1, 2, 3])).toBe(false)
      expect(hasDuplicates(['a', 'b', 'c'])).toBe(false)
    })

    it('should handle empty arrays', () => {
      expect(hasDuplicates([])).toBe(false)
    })

    it('should handle single element arrays', () => {
      expect(hasDuplicates([1])).toBe(false)
    })
  })

  describe('findDuplicates', () => {
    it('should find all duplicate values', () => {
      expect(findDuplicates([1, 2, 3, 2, 3])).toEqual([2, 3])
      expect(findDuplicates(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b'])
    })

    it('should return empty array when no duplicates', () => {
      expect(findDuplicates([1, 2, 3])).toEqual([])
      expect(findDuplicates(['a', 'b', 'c'])).toEqual([])
    })

    it('should handle empty arrays', () => {
      expect(findDuplicates([])).toEqual([])
    })

    it('should handle multiple occurrences of same value', () => {
      expect(findDuplicates([1, 1, 1, 1])).toEqual([1])
    })
  })
})
