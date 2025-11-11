/**
 * Auth state management with Zustand
 */
import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { signIn, signOut, signUp, getCurrentUser, getSession } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const session = await getSession()
      const user = await getCurrentUser()

      set({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({ isLoading: false })
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { user, session } = await signIn(email, password)
      set({
        user,
        session,
        isAuthenticated: true,
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  signup: async (email: string, password: string) => {
    try {
      const { user, session } = await signUp(email, password)
      set({
        user,
        session,
        isAuthenticated: true,
      })
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  },

  logout: async () => {
    try {
      await signOut()
      set({
        user: null,
        session: null,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },

  setSession: (session) => {
    set({ session })
  },
}))
