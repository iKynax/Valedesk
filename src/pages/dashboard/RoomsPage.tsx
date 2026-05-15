import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRooms } from '@/hooks/useRooms'
import type { Room, RoomType } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'

const filters: RoomType[] = ['hot_desk', 'focus_pod', 'meeting_room', 'boardroom', 'event_space', 'private_office']

export default function RoomsPage() {
  const { getRooms } = useRooms()
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeType, setActiveType] = useState<RoomType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await getRooms(activeType === 'all' ? undefined : { type: [activeType] })
      setRooms(data || [])
      setError(error?.message || '')
      setLoading(false)
    }
    load()
  }, [activeType])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Browse Spaces</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Live rooms, rates, and availability</p>
        </div>
        <Button variant="outline" className="h-11 rounded-full border-sky-200 px-5 text-[10px] font-black uppercase tracking-widest text-[#061B3A]">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveType('all')} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${activeType === 'all' ? 'border-[#1E90FF] bg-[#1E90FF] text-white' : 'border-sky-100 bg-white text-[#061B3A]/55'}`}>All</button>
        {filters.map((type) => (
          <button key={type} onClick={() => setActiveType(type)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${activeType === type ? 'border-[#1E90FF] bg-[#1E90FF] text-white' : 'border-sky-100 bg-white text-[#061B3A]/55'}`}>
            {ROOM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{error}</div>
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sky-200 bg-white/75 p-8 text-sm font-bold text-[#061B3A]/55">
          No rooms available yet. Seed your Supabase database or check RLS policies for the rooms table.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const image = room.room_images?.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]?.url
            return (
              <Link key={room.id} to={`/dashboard/rooms/${room.id}`} className="group overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-1">
                <img src={image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'} alt={room.name} className="h-52 w-full object-cover" />
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[room.type]}</p>
                      <h3 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight">{room.name}</h3>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-[#1E90FF]">RM{room.price_hour}/hr</span>
                  </div>
                  <p className="line-clamp-3 text-sm font-medium leading-relaxed text-[#061B3A]/60">{room.description}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-sky-100 pt-5">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#061B3A]/45"><Users className="h-4 w-4" /> {room.capacity}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-[#1E90FF]">View details</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
