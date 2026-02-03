/**
 * Supabase Client for Client-Side RPC Calls
 *
 * Client RPC access (read + attendance RPCs)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client during build if variables aren't available
// The client will be properly initialized at runtime when variables are available
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a dummy client that won't be used anyway
    // since the static pages won't call Supabase methods
    return createClient("https://placeholder.supabase.co", "placeholder-key");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Client-side Supabase client
 * Uses anon key for read-only RPC operations
 */
export const supabase = getSupabaseClient();
