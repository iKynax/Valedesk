export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  stripePublishableKey:
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  appUrl: import.meta.env.VITE_APP_URL || import.meta.env.NEXT_PUBLIC_APP_URL || window.location.origin,
  appName: import.meta.env.VITE_APP_NAME || import.meta.env.NEXT_PUBLIC_APP_NAME || 'Valedesk',
}

export function hasSupabaseConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}
