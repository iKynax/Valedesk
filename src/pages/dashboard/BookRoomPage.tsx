import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, addHours, setHours, setMinutes } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Mail, WalletCards } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { checkAvailability } from '@/lib/availability'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'
import type { AddOn, Booking, Room } from '@/types'
import { ADD_ONS } from '@/types'

function generateReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `VD-${Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

export default function BookRoomPage() {
  const { roomId = '' } = useParams()
  const { user, profile } = useAuth()
  const { getRoomById } = useRooms()
  const [room, setRoom] = useState<Room | null>(null)
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(2)
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [attendeeInput, setAttendeeInput] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)
  const [roomError, setRoomError] = useState('')

  useEffect(() => {
    if (!roomId) return
    getRoomById(roomId).then(({ data, error }) => {
      setRoom(data)
      setRoomError(error?.message || '')
    })
  }, [roomId])

  const start = useMemo(() => combineDateAndTime(date, startTime), [date, startTime])
  const end = useMemo(() => addHours(start, duration), [start, duration])
  const pricing = useMemo(() => {
    const base = Number(room?.price_hour || 0) * duration + addOns.reduce((sum, item) => sum + item.price, 0)
    const service = Math.round(base * 0.1 * 100) / 100
    return { base, service, total: Math.round((base + service) * 100) / 100 }
  }, [room, duration, addOns])

  const toggleAddOn = (addOn: AddOn) => {
    setAddOns((current) => (current.some((item) => item.id === addOn.id) ? current.filter((item) => item.id !== addOn.id) : [...current, addOn]))
  }

  const addAttendee = () => {
    const email = attendeeInput.trim().replace(',', '')
    if (!email) return
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid attendee email.')
      return
    }
    setAttendees((current) => Array.from(new Set([...current, email])))
    setAttendeeInput('')
  }

  const createBooking = async () => {
    if (!room || !user) {
      toast.error('Please sign in before booking.')
      return
    }
    if (!hasSupabaseConfig()) {
      toast.error('Supabase is not configured yet.')
      return
    }
    setSaving(true)
    try {
      const availability = await checkAvailability(room.id, start, end)
      if (!availability.available) {
        toast.error('That time slot is no longer available.')
        setStep(1)
        return
      }
      const reference = generateReference()
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          reference,
          user_id: user.id,
          room_id: room.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: 'confirmed',
          attendees,
          add_ons: addOns,
          notes,
          base_amount: pricing.base,
          service_fee: pricing.service,
          total_amount: pricing.total,
          payment_status: 'paid',
          qr_data: reference,
        })
        .select('*, rooms (*)')
        .single()
      if (error) throw error
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking for ${room.name} is confirmed.`,
        metadata: { booking_id: data.id, reference },
      })
      setBooking(data as Booking)
      setStep(4)
      toast.success('Booking confirmed.')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: string }).message)
            : 'Booking failed.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (roomError) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{roomError}</div>
  if (!room) return <div className="h-96 animate-pulse rounded-2xl bg-white" />

  const image = room.room_images?.find((item) => item.is_primary)?.url || room.room_images?.[0]?.url

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-sky-100 pb-6">
        <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Book Space</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{room.name}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <main className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <div className="mb-8 flex gap-2">
            {['Review', 'Attendees', 'Payment', 'Confirm'].map((label, index) => (
              <span key={label} className={`flex-1 rounded-full px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest ${step >= index + 1 ? 'bg-[#1E90FF] text-white' : 'bg-sky-50 text-[#061B3A]/35'}`}>{label}</span>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <img src={image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80'} alt={room.name} className="h-64 w-full rounded-xl object-cover" />
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Date<Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Start<Input type="time" min="07:00" max="21:30" step="1800" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
                <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Hours<Input type="number" min={1} max={8} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ADD_ONS.map((addOn) => (
                  <button key={addOn.id} onClick={() => toggleAddOn(addOn)} className={`rounded-xl border p-4 text-left ${addOns.some((item) => item.id === addOn.id) ? 'border-[#1E90FF] bg-sky-50' : 'border-sky-100'}`}>
                    <p className="text-sm font-black uppercase">{addOn.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#061B3A]/55">{addOn.description}</p>
                    <p className="mt-3 text-xs font-black text-[#1E90FF]">RM{addOn.price}</p>
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-sky-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/40">Organiser</p>
                <p className="mt-2 text-lg font-black uppercase">{profile?.full_name || user?.email}</p>
              </div>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Attendee Emails
                <div className="flex gap-2">
                  <Input value={attendeeInput} onChange={(event) => setAttendeeInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addAttendee() } }} placeholder="name@company.com" />
                  <Button type="button" onClick={addAttendee} variant="outline"><Mail className="h-4 w-4" /></Button>
                </div>
              </label>
              <div className="flex flex-wrap gap-2">{attendees.map((email) => <button key={email} onClick={() => setAttendees((current) => current.filter((item) => item !== email))} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-[#061B3A]">{email} x</button>)}</div>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-32 w-full rounded-xl border border-sky-100 p-4 text-sm normal-case tracking-normal outline-none focus:border-[#1E90FF]" /></label>
              <Button onClick={() => setStep(3)} className="h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">Continue to Payment</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-sky-100 p-6">
                <WalletCards className="mb-4 h-8 w-8 text-[#1E90FF]" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Demo Payment</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#061B3A]/60">Because this repo is Vite-only, secret Stripe PaymentIntent creation needs a backend before real card confirmation can run. This demo step records the booking as paid after the final conflict check.</p>
              </div>
              <Button disabled={saving} onClick={createBooking} className="h-14 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">{saving ? 'Processing...' : `Pay RM ${pricing.total.toFixed(2)}`}</Button>
            </div>
          )}

          {step === 4 && booking && (
            <div className="grid gap-8 text-center">
              <Check className="mx-auto h-12 w-12 rounded-full bg-emerald-50 p-3 text-emerald-600" />
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Confirmed</h2>
                <button onClick={() => navigator.clipboard.writeText(booking.reference)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-5 py-2 font-mono text-sm font-black text-[#1E90FF]"><Copy className="h-4 w-4" /> {booking.reference}</button>
              </div>
              <QRCodeSVG value={booking.reference} size={190} className="mx-auto" />
              <Button className="mx-auto h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]" onClick={() => (window.location.href = '/dashboard/bookings')}>View My Bookings</Button>
            </div>
          )}
        </main>

        <aside className="h-fit rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Summary</p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-tight">{room.name}</h3>
          <div className="mt-6 space-y-3 text-sm font-bold text-[#061B3A]/62">
            <div className="flex justify-between"><span>Date</span><span>{format(start, 'PPP')}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{format(start, 'p')} - {format(end, 'p')}</span></div>
            <div className="flex justify-between"><span>Base</span><span>RM{pricing.base.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Service fee</span><span>RM{pricing.service.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-sky-100 pt-3 text-xl font-black text-[#061B3A]"><span>Total</span><span>RM{pricing.total.toFixed(2)}</span></div>
          </div>
          <Link to={`/dashboard/rooms/${room.id}`} className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Back to room</Link>
        </aside>
      </div>
    </div>
  )
}
