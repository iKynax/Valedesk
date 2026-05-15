import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { format, addHours } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, CheckCircle, Calendar as CalIcon, FileDown } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { checkAvailability } from '@/lib/availability'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'
import type { AddOn, Booking, Room } from '@/types'
import { ADD_ONS } from '@/types'
import BookingProgressBar from '@/components/BookingProgressBar'
import BookingStepReview from '@/components/BookingStepReview'
import BookingStepDetails from '@/components/BookingStepDetails'

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `VD-${Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

export default function BookRoomPage() {
  const { roomId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { getRoomById } = useRooms()
  const [room, setRoom] = useState<Room | null>(null)
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(() => searchParams.get('date') || new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState(() => searchParams.get('start') || '09:00')
  const [endTime, setEndTime] = useState(() => searchParams.get('end') || '11:00')
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [attendees, setAttendees] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomId) return
    getRoomById(roomId).then(({ data, error }) => {
      setRoom(data)
      setRoomError(error?.message || '')
    })
  }, [roomId])

  const start = useMemo(() => new Date(`${date}T${startTime}:00`), [date, startTime])
  const end = useMemo(() => endTime ? new Date(`${date}T${endTime}:00`) : addHours(start, 2), [date, endTime, start])
  const durationHrs = useMemo(() => (end.getTime() - start.getTime()) / 3600000, [start, end])

  const pricing = useMemo(() => {
    const baseRate = Number(room?.price_hour || 0) * durationHrs
    const addOnTotal = addOns.reduce((s, a) => s + a.price, 0)
    const base = baseRate + addOnTotal
    const service = Math.round(base * 0.1 * 100) / 100
    return { baseRate, addOnTotal, base, service, total: Math.round((base + service) * 100) / 100 }
  }, [room, durationHrs, addOns])

  const toggleAddOn = (addOn: AddOn) => {
    setAddOns(c => c.some(a => a.id === addOn.id) ? c.filter(a => a.id !== addOn.id) : [...c, addOn])
  }

  const createBooking = async () => {
    if (!room || !user) { toast.error('Please sign in.'); return }
    if (!hasSupabaseConfig()) { toast.error('Supabase not configured.'); return }
    setSaving(true)
    try {
      const avail = await checkAvailability(room.id, start, end)
      if (!avail.available) { toast.error('Time slot no longer available.'); setStep(1); return }
      const reference = generateReference()
      const supabase = createClient()
      const { data, error } = await supabase.from('bookings').insert({
        reference, user_id: user.id, room_id: room.id,
        start_time: start.toISOString(), end_time: end.toISOString(),
        status: 'confirmed', attendees, add_ons: addOns, notes,
        base_amount: pricing.baseRate, service_fee: pricing.service,
        total_amount: pricing.total, payment_status: 'paid', qr_data: reference,
      } as any).select('*, rooms (*)').single()
      if (error) throw error
      await (supabase.from('notifications') as any).insert({
        user_id: user.id, type: 'booking_confirmed', title: 'Booking Confirmed',
        message: `Your booking for ${room.name} is confirmed.`,
        metadata: { booking_id: data!.id, reference },
      })
      setBooking(data as Booking)
      setStep(4)
      toast.success('Booking confirmed.')
    } catch (err: any) {
      toast.error(err?.message || 'Booking failed.')
    } finally { setSaving(false) }
  }

  const downloadReceipt = () => {
    if (!booking || !room) return
    const doc = new jsPDF()
    doc.setFontSize(20); doc.text('Valedesk Receipt', 20, 30)
    doc.setFontSize(12)
    doc.text(`Reference: ${booking.reference}`, 20, 50)
    doc.text(`Room: ${room.name}`, 20, 65)
    doc.text(`Date: ${format(start, 'PPP')}`, 20, 80)
    doc.text(`Time: ${format(start, 'p')} - ${format(end, 'p')}`, 20, 95)
    doc.text(`Total: RM ${Number(booking.total_amount).toFixed(2)}`, 20, 110)
    doc.save(`Valedesk-${booking.reference}.pdf`)
  }

  const addToCalendar = () => {
    if (!booking || !room) return
    const s = new Date(booking.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const e = new Date(booking.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(room.name + ' — Valedesk')}&dates=${s}/${e}&details=${encodeURIComponent('Booking ref: ' + booking.reference)}&location=Valedesk+KL,+Bangsar`, '_blank')
  }

  if (roomError) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{roomError}</div>
  if (!room) return <div className="h-96 animate-pulse rounded-2xl bg-white" />

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-sky-100 pb-6">
        <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Book Space</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{room.name}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <main className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <BookingProgressBar current={step} />

          <div className="mt-6">
            {step === 1 && (
              <BookingStepReview room={room} date={date} startTime={startTime} endTime={endTime}
                addOns={addOns} onDateChange={setDate} onStartChange={setStartTime}
                onEndChange={setEndTime} onToggleAddOn={toggleAddOn} onContinue={() => setStep(2)} />
            )}

            {step === 2 && (
              <BookingStepDetails profile={profile} email={user?.email || ''} attendees={attendees}
                notes={notes} onAttendeesChange={setAttendees} onNotesChange={setNotes}
                onContinue={() => setStep(3)} onBack={() => setStep(1)} />
            )}

            {step === 3 && (
              <div className="space-y-6">
                {/* ─── STRIPE SETUP GUIDE ─────────────────────────────────────────────── */}
                {/* 1. Go to https://dashboard.stripe.com/register and create a free account */}
                {/* 2. In the Stripe Dashboard → Developers → API Keys */}
                {/* 3. Copy your TEST publishable key (starts with pk_test_) */}
                {/*    → paste into .env.local as VITE_STRIPE_PUBLISHABLE_KEY */}
                {/* 4. Copy your TEST secret key (starts with sk_test_) */}
                {/*    → paste into .env.local as STRIPE_SECRET_KEY */}
                {/* 5. Restart your dev server: npm run dev */}
                {/* 6. Test with card: 4242 4242 4242 4242 | Expiry: 12/30 | CVC: 123 */}
                {/* ──────────────────────────────────────────────────────────────────────── */}
                <div className="rounded-xl border border-sky-100 p-6">
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">🔒 Secure Payment · Powered by Stripe</div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Payment</h2>
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    ℹ️ This is a demo environment. Your card will not be charged. Use test card: <strong>4242 4242 4242 4242</strong> · Expiry: 12/30 · CVC: 123
                  </div>
                  <p className="mt-4 text-sm text-[#061B3A]/60">
                    Payment is processed as a demo. Click below to confirm your booking.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" className="h-14 rounded-full px-8 text-xs font-black uppercase tracking-widest">Back</Button>
                  <Button disabled={saving} onClick={createBooking}
                    className="h-14 flex-1 rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">
                    {saving ? 'Processing...' : `🔒 Pay RM ${pricing.total.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && booking && (
              <div className="space-y-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
                </motion.div>
                <div>
                  <h2 className="font-[Syne] text-3xl font-bold text-[#0A1628]">BOOKING CONFIRMED!</h2>
                  <p className="mt-2 text-sm text-slate-500">Your space is reserved. Here's everything you need.</p>
                </div>

                <div className="inline-block rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <QRCodeSVG value={booking.reference} size={200} />
                </div>
                <button onClick={() => { navigator.clipboard.writeText(booking.reference); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="mx-auto flex items-center gap-2 rounded-full bg-sky-50 px-5 py-2 font-mono text-sm font-black text-[#1E90FF]">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {booking.reference}
                </button>

                {/* Booking Details */}
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">📋 Booking Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Space</span><span className="font-bold">{room.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold">{format(start, 'EEEE, d MMM yyyy')}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-bold">{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-bold">{durationHrs} hours</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Floor</span><span className="font-bold">{room.floor}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total Paid</span><span className="font-bold text-blue-600">RM {Number(booking.total_amount).toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Check-in Info */}
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">🚪 How to Check In</p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
                    <li>Arrive 10 mins early</li>
                    <li>Show QR code at front desk</li>
                    <li>Or quote your booking ref <strong>{booking.reference}</strong></li>
                    <li>Room opens at your start time automatically</li>
                  </ol>
                </div>

                {/* Confirmation Sent */}
                {(attendees.length > 0 || user?.email) && (
                  <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">📧 Confirmation Sent To</p>
                    <div className="space-y-1 text-sm">
                      {user?.email && <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />{user.email} (organiser)</p>}
                      {attendees.map(e => <p key={e} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />{e}</p>)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">QR codes emailed to all attendees</p>
                  </div>
                )}

                <div className="mx-auto flex max-w-md gap-3">
                  <Button onClick={addToCalendar} variant="outline" className="flex-1 rounded-full border-sky-200 text-xs font-black uppercase tracking-widest">
                    <CalIcon className="mr-2 h-4 w-4" /> Add to Calendar
                  </Button>
                  <Button onClick={downloadReceipt} variant="outline" className="flex-1 rounded-full border-sky-200 text-xs font-black uppercase tracking-widest">
                    <FileDown className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </div>

                <Button className="mx-auto h-12 w-full max-w-md rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]"
                  onClick={() => window.location.href = '/dashboard/bookings'}>
                  View My Bookings
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Summary */}
        <aside className="h-fit rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Summary</p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight">{room.name}</h3>
          <div className="mt-6 space-y-3 text-sm font-bold text-[#061B3A]/62">
            <div className="flex justify-between"><span>Date</span><span>{format(start, 'PPP')}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{format(start, 'p')} - {format(end, 'p')}</span></div>
            <div className="flex justify-between"><span>Base Rate</span><span>RM{pricing.baseRate.toFixed(2)}</span></div>
            {addOns.map(a => (
              <div key={a.id} className="flex items-center justify-between text-blue-600">
                <span className="flex items-center gap-1">+ {a.name}
                  <button onClick={() => toggleAddOn(a)} className="ml-1 text-xs text-slate-400 hover:text-red-500">×</button>
                </span>
                <span>RM{a.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between"><span>Service fee (10%)</span><span>RM{pricing.service.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-sky-100 pt-3 text-xl font-black text-[#061B3A]">
              <span>Total</span><span>RM{pricing.total.toFixed(2)}</span>
            </div>
          </div>
          <Link to={`/dashboard/rooms/${room.id}`} className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Back to room</Link>
        </aside>
      </div>
    </div>
  )
}
