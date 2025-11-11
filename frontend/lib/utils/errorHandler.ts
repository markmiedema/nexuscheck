import { toast } from 'sonner'

/**
 * Centralized error handler for API errors
 *
 * @param error - The error object from try-catch
 * @param options - Configuration options
 * @returns The error message string
 *
 * @example
 * try {
 *   await apiCall()
 * } catch (error) {
 *   handleApiError(error, { userMessage: 'Failed to load data' })
 * }
 */
export function handleApiError(
  error: any,
  options?: {
    userMessage?: string
    logToConsole?: boolean
    showToast?: boolean
  }
): string {
  const defaultOptions = {
    logToConsole: true,
    showToast: true,
    userMessage: 'An unexpected error occurred',
  }

  const opts = { ...defaultOptions, ...options }

  // Extract error message from various sources
  const errorMessage =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    opts.userMessage

  // Log to console in development
  if (opts.logToConsole && process.env.NODE_ENV !== 'production') {
    console.error('Error:', error)
  }

  // Show toast notification
  if (opts.showToast) {
    toast.error(errorMessage)
  }

  return errorMessage
}

/**
 * Show a success toast notification
 *
 * @param message - Success message to display
 *
 * @example
 * showSuccess('Analysis deleted successfully')
 */
export function showSuccess(message: string): void {
  toast.success(message)
}

/**
 * Show an error toast notification
 *
 * @param message - Error message to display
 *
 * @example
 * showError('Failed to delete analysis')
 */
export function showError(message: string): void {
  toast.error(message)
}

/**
 * Show an info toast notification
 *
 * @param message - Info message to display
 *
 * @example
 * showInfo('Your analysis is being processed')
 */
export function showInfo(message: string): void {
  toast.info(message)
}
