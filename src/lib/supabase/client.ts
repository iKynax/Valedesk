import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Singleton Supabase client.
 *
 * Every module in the app MUST use this function to get the client — it
 * guarantees a single GoTrueClient instance so auth state changes propagate
 * everywhere and local-storage access is never contended.
 *
 * The instance is cached on `window` so it survives Vite HMR reloads.
 */

let _serverInstance: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  // SSR / Node (unlikely in Vite SPA, but defensive)
  if (typeof window === 'undefined') {
    if (!_serverInstance) {
      _serverInstance = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'valedesk-auth',
        },
      })
    }
    return _serverInstance
  }

  // Browser — cache on window to survive HMR
  // @ts-ignore
  if (!window.__supabaseInstance) {
    // @ts-ignore
    window.__supabaseInstance = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'valedesk-auth',
        storage: localStorage,
      },
    })
  }

  // @ts-ignore
  return window.__supabaseInstance as ReturnType<typeof createSupabaseClient>
}
