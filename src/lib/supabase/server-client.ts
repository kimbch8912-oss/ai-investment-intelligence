import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required for server-only database access.');
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
