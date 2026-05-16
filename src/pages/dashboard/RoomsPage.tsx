import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, SlidersHorizontal, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRooms } from '@/hooks/useRooms'
import type { Room, RoomType } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'
import { getRoomImage } from '@/lib/roomImages'
import { toggleFavourite, isFavourite } from '@/pages/dashboard/FavouritesPage'

const typeFilters: RoomType[] = ['hot_desk', 'focus_pod', 'meeting_room', 'boardroom', 'event_space', 'private_office']

const AMENITY_OPTIONS = ['WiFi', 'Whiteboard', 'TV Screen', 'Video Conferencing', 'Coffee Machine', 'Parking']

export default function RoomsPage() {
  const { getRooms } = useRooms()
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeType, setActiveType] = useState<RoomType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [minCapacity, setMinCapacity] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(500)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [favRefresh, setFavRefresh] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await getRooms(
        activeType === 'all' ? undefined : { type: [activeType] }
      )
      setRooms(data || [])
      setError(error?.message || '')
      setLoading(false)
    }
    load()
  }, [activeType])

  // Client-side filtering for capacity, price, amenities
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Capacity filter
      if (minCapacity > 0 && room.capacity < minCapacity) return false

      // Price filter
      if (maxPrice < 500 && room.price_hour > maxPrice) return false

      // Amenities filter — currently all rooms have all amenities,
      // so this filter is kept for UI completeness but does not exclude.
      // If rooms gain distinct amenities in the future, uncomment the logic below.
      // if (selectedAmenities.length > 0) {
      //   const roomAmenityNames = (room.room_amenities || []).map((ra) => ra.amenities?.name?.toLowerCase() || '')
      //   const hasAll = selectedAmenities.every((a) =>
      //     roomAmenityNames.some((name) => name.includes(a.toLowerCase()))
      //   )
      //   if (!hasAll) return false
      // }

      return true
    })
  }, [rooms, minCapacity, maxPrice, selectedAmenities])

  const hasActiveFilters = minCapacity > 0 || maxPrice < 500 || selectedAmenities.length > 0

  const clearFilters = () => {
    setMinCapacity(0)
    setMaxPrice(500)
    setSelectedAmenities([])
    setActiveType('all')
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((curr) =>
      curr.includes(amenity) ? curr.filter((a) => a !== amenity) : [...curr, amenity]
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Browse Spaces</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Live rooms, rates, and availability</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-11 rounded-full border-sky-200 px-5 text-[10px] font-black uppercase tracking-widest text-[#061B3A] ${showFilters ? 'border-blue-400 bg-blue-50' : ''}`}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters {hasActiveFilters && <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] text-white">!</span>}
        </Button>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────── */}
      {showFilters && (
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-widest text-[#061B3A]/60">Filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Min Capacity */}
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
              Min Capacity
              <input
                type="number"
                min={0}
                max={100}
                value={minCapacity || ''}
                onChange={(e) => setMinCapacity(Number(e.target.value) || 0)}
                placeholder="e.g. 4"
                className="mt-1 block h-10 w-full rounded-lg border border-sky-100 px-3 text-sm normal-case tracking-normal outline-none focus:border-blue-400"
              />
            </label>

            {/* Max Price */}
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
              Max Price (RM/hr): <span className="text-blue-600">{maxPrice >= 500 ? 'Any' : `RM${maxPrice}`}</span>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 block w-full accent-blue-600"
              />
            </label>

            {/* Amenities */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                      selectedAmenities.includes(amenity)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-sky-100 bg-white text-[#061B3A]/55'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Type Filter Pills ────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveType('all')} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${activeType === 'all' ? 'border-[#1E90FF] bg-[#1E90FF] text-white' : 'border-sky-100 bg-white text-[#061B3A]/55'}`}>All</button>
        {typeFilters.map((type) => (
          <button key={type} onClick={() => setActiveType(type)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${activeType === type ? 'border-[#1E90FF] bg-[#1E90FF] text-white' : 'border-sky-100 bg-white text-[#061B3A]/55'}`}>
            {ROOM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* ── Result Count ─────────────────────────────────────── */}
      {!loading && !error && (
        <p className="text-xs font-bold text-[#061B3A]/50">Showing {filteredRooms.length} space{filteredRooms.length !== 1 ? 's' : ''}</p>
      )}

      {/* ── Room Cards ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{error}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sky-200 bg-white/75 p-8 text-sm font-bold text-[#061B3A]/55">
          {hasActiveFilters ? 'No rooms match your current filters.' : 'No rooms available yet. Seed your Supabase database or check RLS policies for the rooms table.'}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-2 font-bold text-blue-600 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => {
            const roomImage = getRoomImage(room)
            return (
              <Link key={room.id} to={`/dashboard/rooms/${room.id}`} className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-1">
                <div className="relative">
                  <img src={roomImage} alt={room.name} className="aspect-video w-full rounded-t-xl object-cover" />
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const added = toggleFavourite(room.id)
                      setFavRefresh((c) => c + 1)
                      toast.success(added ? `${room.name} added to favourites` : `${room.name} removed from favourites`)
                    }}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition-all hover:scale-110"
                    title={isFavourite(room.id) ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Heart className={`h-4 w-4 transition-colors ${isFavourite(room.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-400'}`} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[room.type]}</p>
                      <h3 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight">{room.name}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-[#1E90FF]">RM{room.price_hour}/hr</span>
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
