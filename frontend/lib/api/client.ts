/**
 * API client with authentication and error handling
 */
import axios, { AxiosError } from 'axios'
import { supabase } from '@/lib/supabase/client'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    // If token expired, try to refresh
    if (error.response?.status === 401 && originalRequest) {
      try {
        // Refresh the session
        const { data, error: refreshError } = await supabase.auth.refreshSession()

        if (!refreshError && data.session) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
          return apiClient.request(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    // Handle other errors
    const responseData = error.response?.data as any
    const errorMessage = responseData?.error?.message ||
                        responseData?.detail ||
                        error.message ||
                        'An unexpected error occurred'

    console.error('API Error:', errorMessage)

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data
    })
  }
)

export default apiClient
