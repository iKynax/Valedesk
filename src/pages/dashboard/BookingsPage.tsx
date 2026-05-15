import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { Download, QrCode, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import type { Booking } from '@/types'

export default function BookingsPage() {
  const { user, loading, configured, sessionReady } = useAuth()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    if (!hasSupabaseConfig() || !configured || loading || !user) return
    setLoadingData(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, rooms (id, name, type, floor, room_images (url, is_primary))')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
      setBookings((data as Booking[]) || [])
      if (bookingsError) setError(bookingsError.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.')
    } finally { setLoadingData(false) }
  }

  useEffect(() => { load() }, [configured, loading, user, sessionReady])

  // Scroll to highlighted booking
  useEffect(() => {
    if (highlightId && !loadingData) {
      setTimeout(() => {
        document.getElementById(`booking-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [highlightId, loadingData])

  const visible = useMemo(() => {
    const now = Date.now()
    return bookings.filter((b) => {
      if (activeTab === 'cancelled') return b.status === 'cancelled'
      if (activeTab === 'past') return b.status === 'completed' || new Date(b.start_time).getTime() < now
      return b.status !== 'cancelled' && new Date(b.start_time).getTime() >= now
    })
  }, [activeTab, bookings])

  const downloadReceipt = (booking: Booking) => {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.text('Valedesk Receipt', 20, 30)
    doc.setFontSize(12)
    doc.text(`Booking Reference: ${booking.reference}`, 20, 50)
    doc.text(`Room: ${booking.rooms?.name || booking.room_id}`, 20, 65)
    doc.text(`Date: ${format(new Date(booking.start_time), 'PPP')}`, 20, 80)
    doc.text(`Time: ${format(new Date(booking.start_time), 'p')} - ${format(new Date(booking.end_time), 'p')}`, 20, 95)
    doc.text(`Total Paid: RM ${Number(booking.total_amount).toFixed(2)}`, 20, 110)
    doc.save(`Valedesk-${booking.reference}.pdf`)
  }

  const cancelBooking = async () => {
    if (!cancelTarget) return
    const supabase = createClient()
    // Policy: non-refundable. Simply cancel, keep payment_status as 'paid'.
    const { error } = await (supabase.from('bookings') as any).update({ status: 'cancelled' }).eq('id', cancelTarget.id)
    if (error) toast.error(error.message)
    else { toast.success('Booking cancelled.'); load() }
    setCancelTarget(null)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-sky-100 pb-6">
        <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">My Bookings</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Receipts, QR codes, and booking history</p>
      </div>

      <div className="flex gap-2">
        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'border-[#1E90FF] bg-[#1E90FF] text-white' : 'border-sky-100 bg-white text-[#061B3A]/55'}`}>{tab}</button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold uppercase tracking-widest text-amber-800">{error}</div>
      )}

      <div className="space-y-4">
        {loadingData ? (
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
            <div className="h-4 w-24 animate-pulse rounded bg-sky-50" />
            <div className="mt-3 h-6 w-48 animate-pulse rounded bg-sky-50" />
          </div>
        ) : visible.length ? visible.map((booking) => (
          <div key={booking.id} id={`booking-${booking.id}`}
            className={`grid gap-4 rounded-2xl border bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)] md:grid-cols-[1fr_auto] md:items-center ${highlightId === booking.id ? 'border-blue-400 ring-2 ring-blue-200' : 'border-sky-100'}`}>
            <div>
              <p className="font-mono text-xs font-black text-[#1E90FF]">{booking.reference}</p>
              <h3 className="mt-1 text-2xl font-black uppercase tracking-tight">{booking.rooms?.name || 'Valedesk Space'}</h3>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#061B3A]/40">{format(new Date(booking.start_time), 'PPP p')} - {format(new Date(booking.end_time), 'p')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSelected(booking)} className="rounded-full border-sky-200 text-[10px] font-black uppercase tracking-widest"><QrCode className="mr-2 h-4 w-4" />QR</Button>
              <Button variant="outline" onClick={() => downloadReceipt(booking)} className="rounded-full border-sky-200 text-[10px] font-black uppercase tracking-widest"><Download className="mr-2 h-4 w-4" />PDF</Button>
              {activeTab === 'upcoming' && <Button variant="destructive" onClick={() => setCancelTarget(booking)} className="rounded-full text-[10px] font-black uppercase tracking-widest"><XCircle className="mr-2 h-4 w-4" />Cancel</Button>}
            </div>
          </div>
        )) : <div className="rounded-2xl border border-dashed border-sky-200 bg-white/75 p-8 text-sm font-bold text-[#061B3A]/55">No {activeTab} bookings yet.</div>}
      </div>

      {/* QR Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#061B3A]/30 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <QRCodeSVG value={selected.reference} size={200} className="mx-auto" />
            <p className="mt-5 font-mono text-lg font-black text-[#1E90FF]">{selected.reference}</p>
            <p className="mt-2 text-sm font-bold text-[#061B3A]/55">{selected.rooms?.name}</p>
            <Button onClick={() => setSelected(null)} className="mt-6 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white">Close</Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#061B3A]/30 p-4 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-black uppercase">Cancel Booking?</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel this booking? <strong>This action cannot be undone and no refund will be issued.</strong> Your booking will be cancelled immediately.
            </p>
            <p className="mt-3 text-xs font-bold text-slate-400">{cancelTarget.rooms?.name} · {cancelTarget.reference}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => setCancelTarget(null)} variant="outline" className="flex-1 rounded-full text-xs font-black uppercase tracking-widest">Keep Booking</Button>
              <Button onClick={cancelBooking} variant="destructive" className="flex-1 rounded-full text-xs font-black uppercase tracking-widest">Cancel Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
