import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Power, X, Users, DollarSign, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { toast } from 'sonner'
import type { Room, RoomType, RoomStatus } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  inactive: 'bg-gray-500/15 text-gray-400',
  maintenance: 'bg-amber-500/15 text-amber-400',
}

const TYPE_COLORS: Record<string, string> = {
  hot_desk: 'bg-blue-500/15 text-blue-400',
  focus_pod: 'bg-purple-500/15 text-purple-400',
  meeting_room: 'bg-cyan-500/15 text-cyan-400',
  boardroom: 'bg-amber-500/15 text-amber-400',
  event_space: 'bg-pink-500/15 text-pink-400',
  private_office: 'bg-emerald-500/15 text-emerald-400',
}

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />

const emptyRoom = (): Partial<Room> => ({
  name: '', type: 'hot_desk', floor: '', capacity: 1, description: '',
  price_hour: 0, price_half: 0, price_day: 0, status: 'active',
})

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | RoomStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | RoomType>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Partial<Room>>(emptyRoom())
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadRooms = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    try {
      const { data } = await supabase.from('rooms').select('*, room_images(url, is_primary, sort_order)').order('name')
      setRooms((data as Room[]) || [])
    } catch (err) { console.error('[Rooms] Error:', err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  const filtered = rooms.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    return true
  })

  const openEditor = (room?: Room) => {
    if (room) { setEditRoom({ ...room }); setIsNew(false) }
    else { setEditRoom(emptyRoom()); setIsNew(true) }
    setEditorOpen(true)
  }

  const handleSave = async () => {
    if (!editRoom.name?.trim()) { toast.error('Room name is required'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: editRoom.name, type: editRoom.type, floor: editRoom.floor, capacity: editRoom.capacity,
        description: editRoom.description, price_hour: editRoom.price_hour, price_half: editRoom.price_half,
        price_day: editRoom.price_day, status: editRoom.status,
        slug: editRoom.name!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }
      if (isNew) {
        await supabase.from('rooms').insert(payload)
        toast.success('Room created successfully')
      } else {
        await supabase.from('rooms').update(payload).eq('id', editRoom.id)
        toast.success('Room updated successfully')
      }
      setEditorOpen(false)
      loadRooms()
    } catch (err: any) { toast.error(err.message || 'Failed to save room') }
    setSaving(false)
  }

  const toggleStatus = async (room: Room) => {
    const newStatus = room.status === 'active' ? 'inactive' : 'active'
    try {
      const supabase = createClient()
      await supabase.from('rooms').update({ status: newStatus }).eq('id', room.id)
      toast.success(`Room ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      loadRooms()
    } catch { toast.error('Failed to update room status') }
  }

  const getPrimaryImage = (room: Room) => {
    const images = room.room_images || []
    const primary = images.find((img: any) => img.is_primary) || images[0]
    return primary?.url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=60'
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'inactive', 'maintenance'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${filter === s ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#94A3B8] hover:text-white'}`}>{s}</button>
          ))}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#94A3B8] focus:outline-none">
            <option value="all">All Types</option>
            {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => openEditor()} className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D4ED8]">
          <Plus className="h-4 w-4" /> Add New Room
        </button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((room, i) => (
          <motion.div key={room.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group overflow-hidden rounded-2xl border border-white/8 bg-[#0F1E35] transition-all hover:border-[#2563EB]/30">
            <div className="relative h-40 overflow-hidden">
              <img src={getPrimaryImage(room)} alt={room.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E35] to-transparent" />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[room.type] || 'bg-gray-500/15 text-gray-400'}`}>{ROOM_TYPE_LABELS[room.type]}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[room.status]}`}>{room.status}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-lg font-bold text-white">{room.name}</h3>
              <p className="mb-3 line-clamp-2 text-xs text-[#94A3B8]">{room.description || 'No description'}</p>
              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <Users className="mx-auto mb-1 h-3.5 w-3.5 text-[#94A3B8]" />
                  <p className="text-xs font-bold text-white">{room.capacity}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <DollarSign className="mx-auto mb-1 h-3.5 w-3.5 text-[#94A3B8]" />
                  <p className="text-xs font-bold text-white">RM{room.price_hour}/h</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2 text-center">
                  <Building2 className="mx-auto mb-1 h-3.5 w-3.5 text-[#94A3B8]" />
                  <p className="text-xs font-bold text-white">{room.floor || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditor(room)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-bold text-[#94A3B8] hover:bg-white/10 hover:text-white">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => toggleStatus(room)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${room.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                  <Power className="h-3.5 w-3.5" /> {room.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && <div className="flex h-40 items-center justify-center rounded-2xl border border-white/8 bg-[#0F1E35] text-sm text-[#94A3B8]">No rooms found</div>}

      {/* Room Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={() => setEditorOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0A1628] shadow-2xl md:inset-x-[10%] md:inset-y-[5%]">
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{isNew ? 'Add New Room' : 'Edit Room'}</h3>
                <button onClick={() => setEditorOpen(false)} className="text-[#94A3B8] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-8 lg:grid-cols-5">
                  {/* Editor Fields */}
                  <div className="space-y-5 lg:col-span-3">
                    <div>
                      <input value={editRoom.name || ''} onChange={e => setEditRoom(r => ({ ...r, name: e.target.value }))} placeholder="Room Name" className="w-full border-0 bg-transparent text-3xl font-bold text-white placeholder-white/20 focus:outline-none" style={{ fontFamily: 'Syne, sans-serif' }} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Room Type</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => (
                          <button key={key} onClick={() => setEditRoom(r => ({ ...r, type: key as RoomType }))} className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${editRoom.type === key ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Floor</label>
                        <input value={editRoom.floor || ''} onChange={e => setEditRoom(r => ({ ...r, floor: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#2563EB] focus:outline-none" placeholder="e.g. Level 3" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Capacity</label>
                        <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
                          <button onClick={() => setEditRoom(r => ({ ...r, capacity: Math.max(1, (r.capacity || 1) - 1) }))} className="px-3 py-3 text-[#94A3B8] hover:text-white">−</button>
                          <input value={editRoom.capacity || 1} onChange={e => setEditRoom(r => ({ ...r, capacity: parseInt(e.target.value) || 1 }))} className="w-full bg-transparent px-2 py-3 text-center text-sm text-white focus:outline-none" />
                          <button onClick={() => setEditRoom(r => ({ ...r, capacity: (r.capacity || 1) + 1 }))} className="px-3 py-3 text-[#94A3B8] hover:text-white">+</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Description</label>
                      <textarea value={editRoom.description || ''} onChange={e => setEditRoom(r => ({ ...r, description: e.target.value }))} rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#2563EB] focus:outline-none" placeholder="Describe this room…" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Pricing</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[{ key: 'price_hour', label: 'Per Hour' }, { key: 'price_half', label: 'Half Day' }, { key: 'price_day', label: 'Full Day' }].map(p => (
                          <div key={p.key}>
                            <p className="mb-1 text-[10px] text-[#94A3B8]">{p.label}</p>
                            <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
                              <span className="px-3 text-xs text-[#94A3B8]">RM</span>
                              <input value={(editRoom as any)[p.key] || 0} onChange={e => setEditRoom(r => ({ ...r, [p.key]: parseFloat(e.target.value) || 0 }))} type="number" className="w-full bg-transparent px-2 py-3 text-sm text-white focus:outline-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Status</label>
                      <div className="flex gap-2">
                        {(['active', 'inactive', 'maintenance'] as const).map(s => (
                          <button key={s} onClick={() => setEditRoom(r => ({ ...r, status: s }))} className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all ${editRoom.status === s ? s === 'active' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : s === 'maintenance' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/30' : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="lg:col-span-2">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Live Preview</p>
                    <div className="rounded-2xl border border-white/8 bg-[#0F1E35] overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-[#2563EB]/20 to-[#38BDF8]/10 flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-[#2563EB]/40" />
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[editRoom.type || 'hot_desk']}`}>{ROOM_TYPE_LABELS[editRoom.type as RoomType] || 'Hot Desk'}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[editRoom.status || 'active']}`}>{editRoom.status || 'active'}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">{editRoom.name || 'Room Name'}</h4>
                        <p className="mt-1 text-xs text-[#94A3B8] line-clamp-2">{editRoom.description || 'No description'}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-[#94A3B8]">
                          <span>👥 {editRoom.capacity || 1}</span>
                          <span>📍 {editRoom.floor || '—'}</span>
                          <span className="font-bold text-[#60A5FA]">RM{editRoom.price_hour || 0}/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-white/8 px-6 py-4">
                <button onClick={() => setEditorOpen(false)} className="rounded-xl bg-white/5 px-6 py-2.5 text-sm font-bold text-[#94A3B8] hover:bg-white/10 hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
