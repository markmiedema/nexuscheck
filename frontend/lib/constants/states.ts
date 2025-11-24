/**
 * US State constants and mappings used throughout the application
 */

export interface USState {
  code: string
  name: string
}

/**
 * Complete list of US states and territories with their codes
 */
export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
]

/**
 * Array of just state codes for quick validation
 */
export const US_STATE_CODES: string[] = US_STATES.map((state) => state.code)

/**
 * Map state names to their codes (for use with geographic data)
 */
export const STATE_NAME_TO_CODE: Record<string, string> = US_STATES.reduce(
  (acc, state) => {
    acc[state.name] = state.code
    return acc
  },
  {} as Record<string, string>
)

// Add Puerto Rico for map compatibility (not a full state but appears in some geo data)
STATE_NAME_TO_CODE['Puerto Rico'] = 'PR'

/**
 * Map state codes to their names
 */
export const STATE_CODE_TO_NAME: Record<string, string> = US_STATES.reduce(
  (acc, state) => {
    acc[state.code] = state.name
    return acc
  },
  {} as Record<string, string>
)

/**
 * Get state name from code
 */
export function getStateName(code: string): string {
  return STATE_CODE_TO_NAME[code.toUpperCase()] || code
}

/**
 * Get state code from name
 */
export function getStateCode(name: string): string | null {
  return STATE_NAME_TO_CODE[name] || null
}

/**
 * Check if a string is a valid US state code
 */
export function isValidStateCode(code: string): boolean {
  return US_STATE_CODES.includes(code.toUpperCase())
}
