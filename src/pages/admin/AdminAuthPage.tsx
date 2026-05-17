import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ValedeskLogo from '@/components/ValedeskLogo'

export default function AdminAuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'signin' | 'create'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Guard: require access code gate
  useEffect(() => {
    const hasAccess = sessionStorage.getItem('valedesk_admin_access')
    if (!hasAccess) {
      navigate('/admin/access', { replace: true })
    }
  }, [navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role !== 'admin') {
        setError('This account does not have admin privileges')
        await supabase.auth.signOut({ scope: 'local' })
        setLoading(false)
        return
      }

      sessionStorage.setItem('valedesk_admin_auth', 'true')
      toast.success('Welcome back, Admin!')
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Sign-in failed')
    }
    setLoading(false)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (signUpError) throw signUpError

      if (data.user) {
        // Update role to admin via direct update
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'admin', full_name: fullName })
          .eq('id', data.user.id)

        if (updateError) {
          // If user_profiles row doesn't exist yet (sometimes due to trigger timing),
          // wait a moment and retry
          await new Promise(r => setTimeout(r, 1500))
          await supabase
            .from('user_profiles')
            .update({ role: 'admin', full_name: fullName })
            .eq('id', data.user.id)
        }

        sessionStorage.setItem('valedesk_admin_auth', 'true')
        toast.success('Admin account created successfully!')
        navigate('/admin', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || 'Account creation failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B18] p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/8 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/8 bg-[#0F1E35] p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3">
              <ValedeskLogo variant="dark" className="h-9" />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Admin Authentication
            </h1>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => { setTab('signin'); setError('') }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'signin' ? 'bg-[#2563EB] text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('create'); setError('') }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'create' ? 'bg-[#2563EB] text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
            >
              Create Admin Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'signin' ? handleSignIn : handleCreateAdmin} className="space-y-4">
            {tab === 'create' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                placeholder="admin@valedesk.co"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#2563EB] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                tab === 'signin' ? 'Sign In' : 'Create Admin Account'
              )}
            </button>
          </form>
        </div>

        <Link
          to="/admin/access"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-[#94A3B8] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Access Gate
        </Link>
      </motion.div>
    </div>
  )
}
