import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Please click the "Connect to Supabase" button in the top right corner to set up your database connection.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export a helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
};

export type Tables = Database['public']['Tables'];