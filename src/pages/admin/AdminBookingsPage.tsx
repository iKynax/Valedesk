import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Filter, Download, ChevronLeft, ChevronRight, X, Eye, XCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { toast } from 'sonner'
import type { Booking } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-blue-500/15 text-blue-400',
  cancelled: 'bg-red-500/15 text-red-400',
  pending: 'bg-amber-500/15 text-amber-400',
  no_show: 'bg-gray-500/15 text-gray-400',
}

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const perPage = 20

  const loadBookings = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    try {
      let query = supabase.from('bookings').select('*, rooms(name, type, floor)')
        .order(sortField, { ascending: sortDir === 'asc' })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      const { data: bookingsData } = await query

      // Fetch user profiles separately to avoid FK join issues
      if (bookingsData && bookingsData.length > 0) {
        const userIds = [...new Set(bookingsData.map(b => b.user_id).filter(Boolean))]
        const { data: profiles } = await supabase.from('user_profiles').select('id, full_name, avatar_url').in('id', userIds)
        const profileMap: Record<string, any> = {}
        ;(profiles || []).forEach(p => { profileMap[p.id] = p })
        setBookings(bookingsData.map(b => ({ ...b, user_profiles: profileMap[b.user_id] || null })))
      } else {
        setBookings(bookingsData || [])
      }
    } catch (err) { console.error('[Bookings] Error:', err) }
    setLoading(false)
  }, [sortField, sortDir, statusFilter])

  useEffect(() => { loadBookings() }, [loadBookings])

  const filtered = bookings.filter(b => {
    if (!search) return true
    const s = search.toLowerCase()
    return b.reference?.toLowerCase().includes(s) || (b.user_profiles as any)?.full_name?.toLowerCase().includes(s) || (b.rooms as any)?.name?.toLowerCase().includes(s)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking? This action cannot be undone and no refund will be issued.')) return
    try {
      const supabase = createClient()
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
      toast.success('Booking cancelled')
      loadBookings()
      if (selectedBooking?.id === bookingId) setSelectedBooking((prev: any) => prev ? { ...prev, status: 'cancelled' } : null)
    } catch { toast.error('Failed to cancel booking') }
  }

  const handleSaveNotes = async () => {
    if (!selectedBooking) return
    try {
      const supabase = createClient()
      await supabase.from('bookings').update({ admin_notes: adminNotes }).eq('id', selectedBooking.id)
      toast.success('Notes saved')
    } catch { toast.error('Failed to save notes') }
  }

  const openDrawer = (booking: any) => {
    setSelectedBooking(booking)
    setAdminNotes(booking.admin_notes || '')
    setDrawerOpen(true)
  }

  const exportCSV = () => {
    const headers = ['Reference', 'User', 'Room', 'Date', 'Duration', 'Amount', 'Status', 'Created']
    const rows = filtered.map(b => [
      b.reference, (b.user_profiles as any)?.full_name || '', (b.rooms as any)?.name || '',
      new Date(b.start_time).toLocaleDateString(), `${Math.round((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000)}h`,
      b.total_amount, b.status, new Date(b.created_at).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'valedesk-bookings.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search reference, user, or room…" className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
        </div>
        <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
          {['all', 'confirmed', 'completed', 'cancelled', 'pending'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-all ${statusFilter === s ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-white'}`}>{s}</button>
          ))}
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-[#94A3B8] hover:bg-white/10 hover:text-white">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <p className="text-xs text-[#94A3B8]">Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0F1E35]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {[
                { key: 'reference', label: 'Reference' }, { key: 'user', label: 'User' },
                { key: 'room', label: 'Room' }, { key: 'start_time', label: 'Date & Time' },
                { key: 'total_amount', label: 'Amount' }, { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Created' }, { key: 'actions', label: 'Actions' },
              ].map(col => (
                <th key={col.key} onClick={() => col.key !== 'actions' && col.key !== 'user' && col.key !== 'room' ? handleSort(col.key) : undefined} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] ${col.key !== 'actions' ? 'cursor-pointer hover:text-white' : ''}`}>
                  {col.label} {sortField === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((b, i) => (
              <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-[#60A5FA]">{b.reference}</td>
                <td className="px-4 py-3 text-white">{(b.user_profiles as any)?.full_name || '—'}</td>
                <td className="px-4 py-3 text-white">{(b.rooms as any)?.name || '—'}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{new Date(b.start_time).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })} {new Date(b.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-3 font-bold text-white">RM {Number(b.total_amount).toFixed(0)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[b.status] || 'bg-gray-500/15 text-gray-400'}`}>{b.status}</span></td>
                <td className="px-4 py-3 text-[#94A3B8] text-xs">{new Date(b.created_at).toLocaleDateString('en-MY')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openDrawer(b)} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-white"><Eye className="h-4 w-4" /></button>
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <button onClick={() => handleCancel(b.id)} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-red-500/10 hover:text-red-400"><XCircle className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="flex h-40 items-center justify-center text-sm text-[#94A3B8]">No bookings found</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-[#94A3B8]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedBooking && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/8 bg-[#0A1628] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/8 p-5">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Booking Details</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-[#94A3B8] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4 space-y-3">
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Reference</span><span className="font-mono text-sm text-[#60A5FA]">{selectedBooking.reference}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Room</span><span className="text-sm text-white">{(selectedBooking.rooms as any)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">User</span><span className="text-sm text-white">{(selectedBooking.user_profiles as any)?.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Date</span><span className="text-sm text-white">{new Date(selectedBooking.start_time).toLocaleDateString('en-MY', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Time</span><span className="text-sm text-white">{new Date(selectedBooking.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} – {new Date(selectedBooking.end_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Amount</span><span className="text-sm font-bold text-[#60A5FA]">RM {Number(selectedBooking.total_amount).toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-[#94A3B8]">Status</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[selectedBooking.status]}`}>{selectedBooking.status}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#94A3B8]">Payment</span><span className="text-sm text-white capitalize">{selectedBooking.payment_status}</span></div>
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase text-[#94A3B8]">Timeline</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Created', time: selectedBooking.created_at, icon: Clock, done: true },
                      { label: 'Paid', time: selectedBooking.payment_status === 'paid' ? selectedBooking.updated_at : null, icon: CheckCircle2, done: selectedBooking.payment_status === 'paid' },
                      { label: 'Confirmed', time: selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed' ? selectedBooking.updated_at : null, icon: CheckCircle2, done: selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed' },
                      { label: selectedBooking.status === 'cancelled' ? 'Cancelled' : 'Completed', time: selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled' ? selectedBooking.updated_at : null, icon: selectedBooking.status === 'cancelled' ? AlertTriangle : CheckCircle2, done: selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled' },
                    ].map((step, i) => {
                      const Icon = step.icon
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 shrink-0 ${step.done ? step.label === 'Cancelled' ? 'text-red-400' : 'text-emerald-400' : 'text-[#94A3B8]/30'}`} />
                          <span className={`text-sm ${step.done ? 'text-white' : 'text-[#94A3B8]/30'}`}>{step.label}</span>
                          {step.time && <span className="ml-auto text-[10px] text-[#94A3B8]">{new Date(step.time).toLocaleDateString('en-MY')}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Add-ons */}
                {selectedBooking.add_ons?.length > 0 && (
                  <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase text-[#94A3B8]">Add-ons</h4>
                    <div className="space-y-2">
                      {selectedBooking.add_ons.map((addon: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm"><span className="text-white">{addon.name}</span><span className="text-[#94A3B8]">RM {addon.price}</span></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="rounded-xl border border-white/8 bg-[#0F1E35] p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase text-[#94A3B8]">Admin Notes</h4>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" placeholder="Add notes about this booking…" />
                  <button onClick={handleSaveNotes} className="mt-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D4ED8]">Save Notes</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
