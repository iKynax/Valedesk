import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'

/**
 * OAuth / magic-link callback handler.
 *
 * For code-based flows (PKCE), the URL has a `code` param to exchange.
 * For implicit/hash flows, the token is in the URL hash and the Supabase
 * client's `detectSessionInUrl` handles it automatically.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    let active = true

    async function handleCallback() {
      if (!hasSupabaseConfig()) {
        navigate('/auth?error=missing_config', { replace: true })
        return
      }

      const supabase = createClient()
      const code = params.get('code')
      const next = params.get('next') || '/dashboard'
      const errorParam = params.get('error')

      // If the OAuth provider returned an error
      if (errorParam) {
        console.error('[AuthCallback] OAuth error:', errorParam, params.get('error_description'))
        navigate(`/auth?error=${errorParam}`, { replace: true })
        return
      }

      if (code) {
        // PKCE flow: exchange the code for a session
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!active) return
          if (error) {
            console.error('[AuthCallback] Code exchange error:', error.message)
            navigate('/auth?error=oauth', { replace: true })
            return
          }
          navigate(next, { replace: true })
        } catch (err) {
          console.error('[AuthCallback] Code exchange exception:', err)
          if (active) navigate('/auth?error=oauth', { replace: true })
        }
      } else if (window.location.hash.includes('access_token')) {
        // Implicit flow — the hash contains the token.
        // Supabase's detectSessionInUrl handles parsing. Give it time to process.
        // We poll for the session to be ready.
        let attempts = 0
        const maxAttempts = 10
        const check = async (): Promise<void> => {
          if (!active) return
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            navigate(next, { replace: true })
            return
          }
          attempts++
          if (attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 300))
            return check()
          }
          // Give up — the session didn't appear
          navigate('/auth?error=session', { replace: true })
        }
        await check()
      } else {
        // No code and no hash token — check if we already have a session
        const { data } = await supabase.auth.getSession()
        if (!active) return
        if (data.session) {
          navigate(next, { replace: true })
        } else {
          navigate('/auth', { replace: true })
        }
      }
    }

    handleCallback()
    return () => { active = false }
  }, [navigate, params])

  return (
    <div className="grid min-h-screen place-items-center bg-[#F4F8FF]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E90FF] border-t-transparent" />
        <p className="text-sm font-black uppercase tracking-widest text-[#1E90FF]">Signing you in...</p>
      </div>
    </div>
  )
}
