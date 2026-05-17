import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Info, AlertTriangle, Wrench, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  maintenance: { icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/15' },
}

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'info' | 'warning' | 'maintenance'>('info')
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPromos = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    try {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
      setPromos(data || [])
    } catch (err) { console.error('[Promos] Error:', err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadPromos() }, [loadPromos])

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('announcements').insert({
        title, content, type, active: true,
        expiry_date: expiry || null,
      })
      toast.success('Promotion published!')
      setTitle(''); setContent(''); setType('info'); setExpiry('')
      setShowForm(false)
      loadPromos()
    } catch (err: any) { toast.error(err.message || 'Failed to publish') }
    setSaving(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const supabase = createClient()
      await supabase.from('announcements').update({ active: !current }).eq('id', id)
      toast.success(current ? 'Promotion deactivated' : 'Promotion activated')
      loadPromos()
    } catch { toast.error('Failed to toggle') }
  }

  const deletePromo = async (id: string) => {
    if (!confirm('Delete this promotion permanently?')) return
    try {
      const supabase = createClient()
      await supabase.from('announcements').delete().eq('id', id)
      toast.success('Promotion deleted')
      loadPromos()
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12" /><div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Promotions & Announcements</h2>
          <p className="text-xs text-[#94A3B8]">Manage the announcements ticker shown in the user dashboard</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D4ED8]">
          <Plus className="h-4 w-4" /> New Promotion
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6 space-y-4">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Promotion title…" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Announcement content (this is what users will see in the ticker)…" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#2563EB] focus:outline-none" />
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-[#94A3B8]">Type</label>
                  <div className="flex gap-2">
                    {(['info', 'warning', 'maintenance'] as const).map(t => {
                      const config = TYPE_CONFIG[t]
                      return (
                        <button key={t} onClick={() => setType(t)} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${type === t ? `${config.bg} ${config.color} ring-1 ring-current` : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'}`}>{t}</button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-[#94A3B8]">Expiry (optional)</label>
                  <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-[#2563EB] focus:outline-none" />
                </div>
              </div>

              {/* Live Preview */}
              {content && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase text-[#94A3B8]">Live Preview</p>
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-[#050B18] p-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      <p className="truncate text-sm text-white">{content}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-[#94A3B8] hover:bg-white/10">Cancel</button>
                <button onClick={handlePublish} disabled={saving} className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50">{saving ? 'Publishing…' : 'Publish'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotions List */}
      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((p, i) => {
          const config = TYPE_CONFIG[p.type] || TYPE_CONFIG.info
          const Icon = config.icon
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-2xl border border-white/8 bg-[#0F1E35] p-5 transition-all ${!p.active ? 'opacity-50' : ''}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}><Icon className={`h-4 w-4 ${config.color}`} /></div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>{p.type}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>{p.active ? 'Active' : 'Inactive'}</span>
              </div>
              <h4 className="mb-1 text-base font-bold text-white">{p.title}</h4>
              <p className="mb-3 text-sm text-[#94A3B8] line-clamp-2">{p.content}</p>
              <div className="mb-3 flex gap-4 text-[10px] text-[#94A3B8]">
                <span>Created: {new Date(p.created_at).toLocaleDateString('en-MY')}</span>
                {p.expiry_date && <span>Expires: {new Date(p.expiry_date).toLocaleDateString('en-MY')}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p.id, p.active)} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-[#94A3B8] hover:bg-white/10 hover:text-white">
                  {p.active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                  {p.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deletePromo(p.id)} className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {promos.length === 0 && <div className="flex h-40 items-center justify-center rounded-2xl border border-white/8 bg-[#0F1E35] text-sm text-[#94A3B8]">No promotions yet. Create one above!</div>}
    </div>
  )
}
