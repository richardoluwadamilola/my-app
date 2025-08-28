// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Type for better type safety
type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Creates a Supabase client for use in browser/client components
 */
export const createBrowserClient = (): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};
