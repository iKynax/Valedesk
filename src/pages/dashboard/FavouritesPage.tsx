import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Users, Trash2, Search, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRooms } from '@/hooks/useRooms'
import { getRoomImage } from '@/lib/roomImages'
import type { Room } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'

const FAVOURITES_KEY = 'valedesk-favourites'

function getFavouriteIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]')
  } catch {
    return []
  }
}

function setFavouriteIds(ids: string[]) {
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(ids))
}

export function toggleFavourite(roomId: string): boolean {
  const ids = getFavouriteIds()
  const exists = ids.includes(roomId)
  const next = exists ? ids.filter((id) => id !== roomId) : [...ids, roomId]
  setFavouriteIds(next)
  return !exists
}

export function isFavourite(roomId: string): boolean {
  return getFavouriteIds().includes(roomId)
}

export default function FavouritesPage() {
  const { getRooms } = useRooms()
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [favouriteIds, setFavIds] = useState<string[]>(getFavouriteIds)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await getRooms()
      setAllRooms(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const favouriteRooms = allRooms.filter((r) => favouriteIds.includes(r.id))
  const filtered = favouriteRooms.filter((r) =>
    searchQuery ? r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase()) : true
  )

  const handleRemove = useCallback((roomId: string, roomName: string) => {
    toggleFavourite(roomId)
    setFavIds(getFavouriteIds())
    toast.success(`${roomName} removed from favourites`)
  }, [])

  const handleClearAll = useCallback(() => {
    setFavouriteIds([])
    setFavIds([])
    toast.success('All favourites cleared')
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Favourites</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">
            Your saved spaces — quick access to rooms you love
          </p>
        </div>
        {favouriteRooms.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="h-11 rounded-full border-rose-200 px-5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      {favouriteRooms.length > 2 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your favourites…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border border-sky-100 bg-white pl-11 pr-4 text-sm font-medium outline-none transition-colors focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
          />
        </div>
      )}

      {/* Stats Strip */}
      {!loading && favouriteRooms.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Saved Spaces</p>
            <p className="mt-1 text-3xl font-black tracking-tighter">{favouriteRooms.length}</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Space Types</p>
            <p className="mt-1 text-3xl font-black tracking-tighter">
              {new Set(favouriteRooms.map((r) => r.type)).size}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Best Rate</p>
            <p className="mt-1 text-3xl font-black tracking-tighter text-[#1E90FF]">
              RM{Math.min(...favouriteRooms.map((r) => r.price_hour))}
            </p>
          </div>
        </div>
      )}

      {/* Room Cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-dashed border-sky-200 bg-white/75 p-16 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50">
            <Heart className="h-9 w-9 text-[#1E90FF]/40" />
          </div>
          <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
            {searchQuery ? 'No matches found' : 'No favourites yet'}
          </h3>
          <p className="mb-8 max-w-sm text-sm font-medium text-[#061B3A]/55">
            {searchQuery
              ? 'Try a different search term.'
              : 'Browse our spaces and tap the heart icon to save rooms you love for quick access.'}
          </p>
          {!searchQuery && (
            <Link
              to="/dashboard/rooms"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white shadow-[0_16px_40px_rgba(30,144,255,0.35)] hover:bg-[#0B5ED7]"
            >
              <Search className="mr-2 h-4 w-4" /> Browse Spaces
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((room, i) => {
              const roomImage = getRoomImage(room)
              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-1"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(room.id, room.name)}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-lg backdrop-blur transition-all hover:bg-rose-50 hover:scale-110"
                    title="Remove from favourites"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>

                  <Link to={`/dashboard/rooms/${room.id}`}>
                    <img src={roomImage} alt={room.name} className="aspect-video w-full rounded-t-xl object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[room.type]}</p>
                          <h3 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight">{room.name}</h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-[#1E90FF]">RM{room.price_hour}/hr</span>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-[#061B3A]/60">{room.description}</p>
                      <div className="mt-6 flex items-center justify-between border-t border-sky-100 pt-5">
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#061B3A]/45"><Users className="h-4 w-4" /> {room.capacity}</span>
                        <span className="text-xs font-black uppercase tracking-widest text-[#1E90FF]">Book Now</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
