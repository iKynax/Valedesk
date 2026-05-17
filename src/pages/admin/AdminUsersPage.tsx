import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, ShieldCheck, ShieldOff, UserX, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { toast } from 'sonner'

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const perPage = 20

  const loadUsers = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    try {
      const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
      // Get booking stats for each user
      const { data: bookings } = await supabase.from('bookings').select('user_id, total_amount, payment_status')
      const bookingMap: Record<string, { count: number; spent: number }> = {}
      ;(bookings || []).forEach((b: any) => {
        if (!bookingMap[b.user_id]) bookingMap[b.user_id] = { count: 0, spent: 0 }
        bookingMap[b.user_id].count++
        if (b.payment_status === 'paid') bookingMap[b.user_id].spent += Number(b.total_amount)
      })
      setUsers((data || []).map(u => ({ ...u, bookingCount: bookingMap[u.id]?.count || 0, totalSpent: bookingMap[u.id]?.spent || 0 })))
    } catch (err) { console.error('[Users] Error:', err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search) return true
    const s = search.toLowerCase()
    return u.full_name?.toLowerCase().includes(s) || u.id?.includes(s)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const openDrawer = async (user: any) => {
    setSelectedUser(user)
    setDrawerOpen(true)
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    const { data } = await supabase.from('bookings').select('*, rooms(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    setUserBookings(data || [])
  }

  const updateRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} this user?`)) return
    try {
      const supabase = createClient()
      await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`)
      loadUsers()
      if (selectedUser?.id === userId) setSelectedUser((prev: any) => prev ? { ...prev, role: newRole } : null)
    } catch { toast.error('Failed to update role') }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or email…" className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
        </div>
        <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
          {['all', 'user', 'admin'].map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }} className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-all ${roleFilter === r ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-white'}`}>{r}</button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#94A3B8]">Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0F1E35]">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-white/8">
            {['User', 'Role', 'Bookings', 'Total Spent', 'Joined', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-xs font-bold text-[#2563EB]">{(u.full_name || '?').charAt(0).toUpperCase()}</div>
                    <div><p className="font-medium text-white">{u.full_name || 'Unnamed'}</p><p className="text-[10px] text-[#94A3B8]">{u.company || '—'}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>{u.role}</span></td>
                <td className="px-4 py-3 text-white">{u.bookingCount}</td>
                <td className="px-4 py-3 font-bold text-white">RM {u.totalSpent.toFixed(0)}</td>
                <td className="px-4 py-3 text-xs text-[#94A3B8]">{new Date(u.created_at).toLocaleDateString('en-MY')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openDrawer(u)} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-white" title="View"><Eye className="h-4 w-4" /></button>
                    {u.role === 'user' ? (
                      <button onClick={() => updateRole(u.id, 'admin')} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-purple-500/10 hover:text-purple-400" title="Promote"><ShieldCheck className="h-4 w-4" /></button>
                    ) : (
                      <button onClick={() => updateRole(u.id, 'user')} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-amber-500/10 hover:text-amber-400" title="Demote"><ShieldOff className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="flex h-40 items-center justify-center text-sm text-[#94A3B8]">No users found</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-[#94A3B8]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* User Detail Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/8 bg-[#0A1628] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/8 p-5">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>User Profile</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-[#94A3B8] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB]/20 text-2xl font-bold text-[#2563EB]">{(selectedUser.full_name || '?').charAt(0).toUpperCase()}</div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedUser.full_name || 'Unnamed'}</h4>
                    <p className="text-sm text-[#94A3B8]">{selectedUser.company || 'No company'}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedUser.role === 'admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>{selectedUser.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-3 text-center">
                    <p className="text-2xl font-bold text-white">{selectedUser.bookingCount}</p>
                    <p className="text-[10px] text-[#94A3B8]">Bookings</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-3 text-center">
                    <p className="text-2xl font-bold text-white">RM {selectedUser.totalSpent.toFixed(0)}</p>
                    <p className="text-[10px] text-[#94A3B8]">Spent</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-3 text-center">
                    <p className="text-sm font-bold text-white">{new Date(selectedUser.created_at).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-[#94A3B8]">Joined</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#94A3B8]">Profile Details</h4>
                  {[
                    { label: 'Phone', value: selectedUser.phone },
                    { label: 'Job Title', value: selectedUser.job_title },
                    { label: 'Persona', value: selectedUser.persona },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between"><span className="text-xs text-[#94A3B8]">{d.label}</span><span className="text-sm text-white">{d.value || '—'}</span></div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase text-[#94A3B8]">Recent Bookings</h4>
                  {userBookings.length > 0 ? (
                    <div className="space-y-2">
                      {userBookings.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                          <div><p className="text-sm font-medium text-white">{b.rooms?.name || 'Unknown'}</p><p className="text-[10px] text-[#94A3B8]">{new Date(b.start_time).toLocaleDateString('en-MY')}</p></div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#94A3B8]">No bookings yet</p>}
                </div>

                <div className="flex gap-2">
                  {selectedUser.role === 'user' ? (
                    <button onClick={() => updateRole(selectedUser.id, 'admin')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500/15 py-3 text-sm font-bold text-purple-400 hover:bg-purple-500/25"><ShieldCheck className="h-4 w-4" /> Promote to Admin</button>
                  ) : (
                    <button onClick={() => updateRole(selectedUser.id, 'user')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500/15 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/25"><ShieldOff className="h-4 w-4" /> Demote to User</button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
