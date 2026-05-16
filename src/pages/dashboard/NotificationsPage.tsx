import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  AlertTriangle,
  Info,
  Megaphone,
  Filter,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'

/* ── Notification type config ──────────────────────────────── */

const NOTIFICATION_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  booking_confirmed: { icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Booking Confirmed' },
  booking_cancelled: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Booking Cancelled' },
  booking_reminder: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Reminder' },
  payment_received: { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Payment' },
  system: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-50', label: 'System' },
  announcement: { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Announcement' },
}

const DEFAULT_CONFIG = { icon: Bell, color: 'text-[#1E90FF]', bg: 'bg-sky-50', label: 'Notification' }

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showFilters, setShowFilters] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user || !hasSupabaseConfig()) {
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setNotifications(data as Notification[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user || !hasSupabaseConfig()) return
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          toast.info('New notification received')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user || !hasSupabaseConfig()) return
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }, [user])

  const deleteNotification = useCallback(async (id: string) => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notification deleted')
  }, [])

  const clearAll = useCallback(async () => {
    if (!user || !hasSupabaseConfig()) return
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('user_id', user.id)
    setNotifications([])
    toast.success('All notifications cleared')
  }, [user])

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  // Group notifications by date
  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    const dateKey = format(new Date(n.created_at), 'yyyy-MM-dd')
    const label = isToday(n.created_at) ? 'Today' : isYesterday(n.created_at) ? 'Yesterday' : format(new Date(n.created_at), 'EEEE, d MMM yyyy')
    if (!acc[label]) acc[label] = []
    acc[label].push(n)
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Notifications</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You\'re all caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="h-11 rounded-full border-sky-200 px-5 text-[10px] font-black uppercase tracking-widest text-[#061B3A] hover:bg-sky-50"
            >
              <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={clearAll}
              className="h-11 rounded-full border-rose-200 px-5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f
                ? 'border-[#1E90FF] bg-[#1E90FF] text-white'
                : 'border-sky-100 bg-white text-[#061B3A]/55 hover:border-blue-200'
            }`}
          >
            {f === 'all' ? `All (${notifications.length})` : f === 'unread' ? `Unread (${unreadCount})` : `Read (${notifications.length - unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-dashed border-sky-200 bg-white/75 p-16 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50">
            <BellOff className="h-9 w-9 text-[#1E90FF]/40" />
          </div>
          <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
            {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
          </h3>
          <p className="mb-8 max-w-sm text-sm font-medium text-[#061B3A]/55">
            {filter !== 'all'
              ? 'Try switching to a different filter.'
              : 'When you make bookings or receive updates, they\'ll appear here.'}
          </p>
          {filter === 'all' && (
            <Link
              to="/dashboard/rooms"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white shadow-[0_16px_40px_rgba(30,144,255,0.35)] hover:bg-[#0B5ED7]"
            >
              Browse Spaces
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/40">{dateLabel}</p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.map((notification, i) => {
                    const config = NOTIFICATION_CONFIG[notification.type] || DEFAULT_CONFIG
                    const Icon = config.icon

                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                        transition={{ delay: i * 0.03 }}
                        className={`group relative flex items-start gap-4 rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${
                          notification.read ? 'border-sky-100' : 'border-blue-200 shadow-[0_8px_24px_rgba(30,144,255,0.08)]'
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#1E90FF]" />
                        )}

                        {/* Icon */}
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                              <h4 className={`mt-0.5 text-sm font-bold ${notification.read ? 'text-[#061B3A]/70' : 'text-[#061B3A]'}`}>
                                {notification.title}
                              </h4>
                            </div>
                            <span className="shrink-0 text-[10px] font-bold text-[#061B3A]/35">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className={`mt-1 text-xs leading-relaxed ${notification.read ? 'text-[#061B3A]/45' : 'text-[#061B3A]/60'}`}>
                            {notification.message}
                          </p>

                          {/* Action buttons */}
                          <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#1E90FF] transition-colors hover:bg-sky-100"
                              >
                                <Check className="h-3 w-3" /> Mark Read
                              </button>
                            )}
                            {notification.metadata?.booking_id && (
                              <Link
                                to={`/dashboard/bookings?highlight=${notification.metadata.booking_id}`}
                                className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#1E90FF] transition-colors hover:bg-sky-100"
                              >
                                <Calendar className="h-3 w-3" /> View Booking
                              </Link>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-rose-600 transition-colors hover:bg-rose-100"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Date helpers ──────────────────────────────────────────── */
function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function isYesterday(dateStr: string) {
  const d = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate()
}
