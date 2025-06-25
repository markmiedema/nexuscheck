import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // For demo purposes, create a mock user to bypass authentication
  const mockUser: User = {
    id: 'demo-user-id',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    factors: []
  };

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  const [user, setUser] = useState<User | null>(mockUser);
  const [session, setSession] = useState<Session | null>(mockSession);
  const [loading, setLoading] = useState(false); // Set to false to skip loading state

  useEffect(() => {
    // Skip actual Supabase authentication for demo
    // In production, this would handle real authentication
    console.log('Demo mode: Authentication bypassed');
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate sign in delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, always succeed with mock user
      setUser(mockUser);
      setSession(mockSession);
      
      console.log('Demo sign in successful:', email);
      return { error: null };
    } catch (error) {
      console.error('Demo sign in error:', error);
      return { error: { message: 'Demo sign in failed' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate sign up delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, always succeed with mock user
      setUser(mockUser);
      setSession(mockSession);
      
      console.log('Demo sign up successful:', email);
      return { error: null };
    } catch (error) {
      console.error('Demo sign up error:', error);
      return { error: { message: 'Demo sign up failed' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Simulate sign out delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear user state
      setUser(null);
      setSession(null);
      
      console.log('Demo sign out successful');
    } catch (error) {
      console.error('Demo sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};