/**
 * Supabase client for authentication and database access
 */
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create Supabase client for client components
export const supabase = createClientComponentClient()

/**
 * Get current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * Refresh session
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    throw error
  }

  return data.session
}
