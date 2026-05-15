import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { getRoomSlotsForDay } from '@/lib/availability'
import { useRooms } from '@/hooks/useRooms'
import type { Room } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'

export default function RoomDetailPage() {
  const { id = '' } = useParams()
  const { getRoomById } = useRooms()
  const [room, setRoom] = useState<Room | null>(null)
  const [slots, setSlots] = useState<{ time: Date; available: boolean }[]>([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRoom() {
      const { data, error } = await getRoomById(id)
      setRoom(data)
      setError(error?.message || '')
    }
    if (id) loadRoom()
  }, [id])

  useEffect(() => {
    if (!id || !hasSupabaseConfig()) return
    let active = true
    async function loadSlots() {
      const nextSlots = await getRoomSlotsForDay(id, selectedDate)
      if (active) setSlots(nextSlots)
    }
    loadSlots()
    const supabase = createClient()
    const channel = supabase
      .channel(`room-bookings-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `room_id=eq.${id}` }, loadSlots)
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [id, selectedDate])

  if (error) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{error}</div>
  if (!room) return <div className="h-96 animate-pulse rounded-2xl bg-white" />

  const images = room.room_images?.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order) || []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <img src={images[0]?.url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'} alt={room.name} className="h-[420px] w-full rounded-2xl border border-sky-100 object-cover" />
          <div className="grid grid-cols-3 gap-4">
            {images.slice(1, 4).map((image) => <img key={image.id} src={image.url} alt={image.alt_text || room.name} className="h-28 rounded-xl border border-sky-100 object-cover" />)}
          </div>
        </div>
        <aside className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[room.type]}</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter">{room.name}</h1>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest text-[#061B3A]/50">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {room.capacity} guests</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-[#1E90FF] text-[#1E90FF]" /> {room.rating}</span>
          </div>
          <p className="mt-6 text-sm font-medium leading-relaxed text-[#061B3A]/62">{room.description}</p>
          <div className="mt-8 rounded-2xl bg-sky-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Starting from</p>
            <p className="mt-1 text-4xl font-black tracking-tighter">RM{room.price_hour}<span className="text-sm tracking-normal text-[#061B3A]/45">/hr</span></p>
          </div>
          <Button className="mt-6 h-14 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]" onClick={() => (window.location.href = `/dashboard/book/${room.id}`)}>
            Book This Space
          </Button>
        </aside>
      </div>

      <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Availability</h2>
          <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/48">
            <CalendarDays className="h-4 w-4 text-[#1E90FF]" />
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={selectedDate.toISOString().slice(0, 10)} onChange={(event) => setSelectedDate(new Date(`${event.target.value}T00:00:00`))} className="rounded-full border border-sky-100 px-4 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-10">
          {slots.length ? slots.map((slot) => (
            <span key={slot.time.toISOString()} className={`rounded-xl border px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest ${slot.available ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>
              {slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )) : <p className="col-span-full text-sm font-bold text-[#061B3A]/50">Connect Supabase to see live slots.</p>}
        </div>
        <Link to={`/dashboard/book/${room.id}`} className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Continue to booking</Link>
      </section>
    </div>
  )
}
