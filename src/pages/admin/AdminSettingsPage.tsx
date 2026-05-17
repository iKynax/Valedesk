import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { User, Lock, Database, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const { profile, user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [platformStats, setPlatformStats] = useState({ rooms: 0, users: 0 })

  useEffect(() => {
    if (!hasSupabaseConfig()) { setDbStatus('offline'); return }
    const checkDb = async () => {
      try {
        const supabase = createClient()
        const [{ count: rooms }, { count: users }] = await Promise.all([
          supabase.from('rooms').select('id', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        ])
        setPlatformStats({ rooms: rooms || 0, users: users || 0 })
        setDbStatus('online')
      } catch { setDbStatus('offline') }
    }
    checkDb()
  }, [])

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully')
      setNewPassword(''); setConfirmPassword('')
    } catch (err: any) { toast.error(err.message || 'Failed to update password') }
    setSaving(false)
  }

  const accessCode = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'VDADM1'
  const maskedCode = accessCode.slice(0, 4) + '••'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Admin Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/15">
            <User className="h-5 w-5 text-[#2563EB]" />
          </div>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Admin Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Name</span>
            <span className="text-sm text-white">{profile?.full_name || 'Admin'}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Email</span>
            <span className="text-sm text-white">{user?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Role</span>
            <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">{profile?.role || 'admin'}</span>
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Change Password</h3>
        </div>
        <div className="space-y-3">
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
          <button onClick={handleChangePassword} disabled={saving || !newPassword} className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50">
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </motion.div>

      {/* Access Code */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Access Code</h3>
        </div>
        <div className="rounded-xl bg-white/5 px-4 py-3 mb-3">
          <span className="font-mono text-lg font-bold text-white tracking-wider">{maskedCode}</span>
        </div>
        <p className="text-xs text-[#94A3B8]">
          To change the access code, update <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#60A5FA]">VITE_ADMIN_ACCESS_CODE</code> in your <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#60A5FA]">.env.local</code> file and restart the server.
        </p>
      </motion.div>

      {/* Platform Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
            <Database className="h-5 w-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Platform Info</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Total Rooms</span>
            <span className="text-sm font-bold text-white">{platformStats.rooms}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Total Users</span>
            <span className="text-sm font-bold text-white">{platformStats.users}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">Database Status</span>
            <div className="flex items-center gap-2">
              {dbStatus === 'checking' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
              ) : dbStatus === 'online' ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Online</span></>
              ) : (
                <><XCircle className="h-4 w-4 text-red-400" /><span className="text-sm font-bold text-red-400">Offline</span></>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-xs font-bold uppercase text-[#94A3B8]">App Version</span>
            <span className="text-sm font-bold text-white">1.0.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
