'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  /** Bumped on SIGNED_IN / INITIAL_SESSION so data pages can re-fetch */
  sessionReady: number
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<any>
  signInWithEmail: (e: string, p: string) => Promise<any>
  signUpWithEmail: (e: string, p: string, n: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ------------------------------------------------------------------ */
/*  Profile helpers                                                    */
/* ------------------------------------------------------------------ */

const buildFallbackProfile = (user: User): UserProfile => {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || null
  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  const now = new Date().toISOString()
  return {
    id: user.id,
    full_name: name,
    avatar_url: avatar,
    role: 'user',
    phone: null,
    company: null,
    job_title: null,
    persona: null,
    preferences: { space_types: [], notifications: true },
    onboarded: false,
    created_at: now,
    updated_at: now,
  }
}

const mergeProfile = (profile: UserProfile | null, user: User) => {
  const fallback = buildFallbackProfile(user)
  if (!profile) return fallback
  return {
    ...fallback,
    ...profile,
    full_name: profile.full_name ?? fallback.full_name,
    avatar_url: profile.avatar_url ?? fallback.avatar_url,
  }
}

/* ------------------------------------------------------------------ */
/*  Lightweight localStorage cache (show profile instantly on reload)  */
/* ------------------------------------------------------------------ */

const PROFILE_CACHE_KEY = 'valedesk-profile'

const readProfileCache = (userId: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as UserProfile
    return data?.id === userId ? data : null
  } catch {
    return null
  }
}

const writeProfileCache = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore — e.g. private browsing
  }
}

const clearProfileCache = () => {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {
    // Ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseConfig()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(0)

  // Track mount state to avoid setting state on unmounted component
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  /**
   * Fetch the user's profile from Supabase and merge with metadata.
   * Uses a cache-then-network strategy so the UI never stalls.
   * 
   * IMPORTANT: This function never throws — all errors are caught internally.
   * The caller does NOT need to try/catch this.
   */
  const loadProfileInBackground = useCallback((activeUser: User) => {
    // Immediate: show cached profile or build a fallback from user metadata.
    // This ensures the UI always has *something* to show right away.
    const cached = readProfileCache(activeUser.id)
    if (mountedRef.current) {
      setProfile(cached ? mergeProfile(cached, activeUser) : buildFallbackProfile(activeUser))
    }

    // Background: fetch the real profile from DB (don't block the auth flow!)
    if (!configured) return

    const supabase = createClient()
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', activeUser.id)
      .maybeSingle()
      .then(({ data: profileData, error }) => {
        if (!mountedRef.current) return
        if (error) {
          console.warn('[AuthProvider] Profile fetch error:', error.message)
          return
        }
        const merged = mergeProfile((profileData as UserProfile | null) ?? cached, activeUser)
        setProfile(merged)
        writeProfileCache(merged)
      })
      .catch((err) => {
        console.warn('[AuthProvider] Profile fetch exception:', err)
      })
  }, [configured])

  /**
   * Main auth effect — uses getSession() + onAuthStateChange for reliability.
   * 
   * The pattern is:
   * 1. Call getSession() to get the initial session synchronously
   * 2. Set up onAuthStateChange to handle ongoing auth events
   * 
   * This is more reliable than relying solely on INITIAL_SESSION which
   * can be timing-sensitive across different Supabase JS versions.
   */
  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let initialised = false

    // ---- Step 1: Get the initial session ----
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return
      if (error) {
        console.error('[AuthProvider] Initial getSession error:', error.message)
        setUser(null)
        setProfile(null)
        setLoading(false)
        initialised = true
        return
      }

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        loadProfileInBackground(currentUser)
        setSessionReady((c) => c + 1)
      } else {
        setProfile(null)
      }

      setLoading(false)
      initialised = true
    }).catch((err) => {
      console.error('[AuthProvider] Initial getSession exception:', err)
      if (mountedRef.current) {
        setLoading(false)
        initialised = true
      }
    })

    // Safety timeout — if getSession hangs, unblock the UI.
    const timeoutId = setTimeout(() => {
      if (!initialised && mountedRef.current) {
        console.warn('[AuthProvider] Auth initialisation timed out, unblocking UI')
        setLoading(false)
        initialised = true
      }
    }, 5000)

    // ---- Step 2: Listen for ongoing auth changes ----
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!mountedRef.current) return
        const nextUser = session?.user ?? null

        // Skip INITIAL_SESSION since we handle that via getSession() above
        if (event === 'INITIAL_SESSION') return

        switch (event) {
          case 'SIGNED_IN': {
            setUser(nextUser)
            if (nextUser) {
              loadProfileInBackground(nextUser)
              setSessionReady((c) => c + 1)
            }
            setLoading(false)
            break
          }

          case 'SIGNED_OUT': {
            setUser(null)
            setProfile(null)
            clearProfileCache()
            setLoading(false)
            break
          }

          case 'TOKEN_REFRESHED': {
            // Token refreshed silently — just update the user object.
            // No need to re-fetch the profile.
            if (nextUser) setUser(nextUser)
            break
          }

          case 'USER_UPDATED': {
            // User metadata changed (e.g. avatar, name via Supabase dashboard)
            setUser(nextUser)
            if (nextUser) loadProfileInBackground(nextUser)
            break
          }

          default:
            break
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [configured, loadProfileInBackground])

  /* ---------------------------------------------------------------- */
  /*  Auth actions                                                     */
  /* ---------------------------------------------------------------- */

  const signOut = useCallback(async () => {
    if (!configured) return
    try {
      const supabase = createClient()
      // Use 'local' scope — only invalidate this browser's session, not all
      // sessions across devices.
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('[AuthProvider] Sign-out error:', err)
    }
    // Always clean up and redirect, even if signOut failed
    clearProfileCache()
    setUser(null)
    setProfile(null)
    window.location.assign('/')
  }, [configured])

  const signInWithGoogle = useCallback(async () => {
    if (!configured) throw new Error('Supabase is not configured yet.')
    const supabase = createClient()
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [configured])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!configured) throw new Error('Supabase is not configured yet.')
    const supabase = createClient()
    return supabase.auth.signInWithPassword({ email, password })
  }, [configured])

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string) => {
    if (!configured) throw new Error('Supabase is not configured yet.')
    const supabase = createClient()
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
  }, [configured])

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        configured,
        sessionReady,
        signOut,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}