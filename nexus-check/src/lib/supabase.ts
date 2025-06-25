import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          company_id: string;
          filename: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          results: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          filename: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          results?: any;
        };
        Update: {
          id?: string;
          company_id?: string;
          filename?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          results?: any;
        };
      };
    };
  };
};