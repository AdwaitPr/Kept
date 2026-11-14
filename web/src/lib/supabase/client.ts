import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Checks whether Supabase environment variables are properly configured
 * with non-empty, non-placeholder values.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  // Detect common placeholders
  if (
    url.includes('placeholder') ||
    url.includes('your-project') ||
    url.includes('example.com') ||
    anonKey.includes('placeholder') ||
    anonKey.includes('your-anon-key')
  ) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safe factory returning a singleton SupabaseClient when valid credentials are present,
 * or null in offline/mock development mode.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (error) {
    console.warn('[Kept] Supabase client initialization failed, falling back to local mode:', error);
    return null;
  }
}

/**
 * Reset cached client (primarily for unit tests and environment switches).
 */
export function resetSupabaseClient(): void {
  cachedClient = null;
}

/**
 * Direct export of the supabase client instance (or null in offline mode).
 */
export const supabase = getSupabaseClient();
