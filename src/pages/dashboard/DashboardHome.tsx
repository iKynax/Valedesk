import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Clock, DollarSign, Timer, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import type { Booking, Room } from '@/types'
import PromoCarousel from '@/components/PromoCarousel'

/* ── Sparkline bar chart (last 6 months of spend) ──────────────── */
function SparklineChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const barW = 6
  const gap = 3
  const h = 28
  const totalW = data.length * (barW + gap) - gap
  return (
    <svg width={totalW} height={h} className="mt-2">
      {data.map((val, i) => {
        const barH = Math.max((val / max) * h, 2)
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={2}
            fill={i === data.length - 1 ? '#2563EB' : '#BFDBFE'}
          />
        )
      })}
    </svg>
  )
}

/* ── Circular progress ring ────────────────────────────────────── */
function ProgressRing({ value, max, label }: { value: number; max: number; label: string }) {
  const size = 56
  const stroke = 5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} className="mt-1">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#2563EB"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-slate-700 text-[10px] font-black">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

/* ── Announcements Ticker ──────────────────────────────────────── */
function AnnouncementsTicker() {
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([])

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    supabase
      .from('announcements')
      .select('id, title, content')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .then(({ data }) => {
        if (data?.length) setAnnouncements(data)
      })
  }, [])

  if (!announcements.length) return null

  const text = announcements.map((a) => `${a.title} — ${a.content}`).join('  ·  ')

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center overflow-hidden rounded-xl bg-[#0A1628] py-3"
    >
      <div className="flex shrink-0 items-center gap-2 border-r border-blue-500/30 px-4">
        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black text-white">📢 NOTICES</span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="marquee-track">
          <span className="whitespace-nowrap px-4 text-sm text-white">{text}  ·  {text}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main Dashboard Page ───────────────────────────────────────── */
export default function DashboardHome() {
  const { profile, user, loading, configured, sessionReady } = useAuth()
  const navigate = useNavigate()
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [recommended, setRecommended] = useState<Room[]>([])
  const [monthlySpend, setMonthlySpend] = useState(0)
  const [monthlyHours, setMonthlyHours] = useState(0)
  const [spendHistory, setSpendHistory] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configured || loading || !user) return

    const supabase = createClient()
    let cancelled = false

    async function load() {
      setLoadingData(true)
      setError('')

      try {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

        const [
          { data: bookings, error: bookingsError },
          { data: rooms, error: roomsError },
          { data: paidBookings },
          { data: confirmedBookings },
          { data: allPaidBookings },
        ] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, rooms (id, name, type, floor, room_images (url, is_primary))')
            .eq('user_id', user!.id)
            .in('status', ['confirmed', 'pending'])
            .gt('start_time', now.toISOString())
            .order('start_time')
            .limit(3),
          supabase
            .from('rooms')
            .select('*, room_images (id, room_id, url, alt_text, is_primary, sort_order)')
            .eq('status', 'active')
            .order('rating', { ascending: false })
            .limit(3),
          // This month's spend
          supabase
            .from('bookings')
            .select('total_amount')
            .eq('user_id', user!.id)
            .eq('payment_status', 'paid')
            .gte('created_at', monthStart)
            .lte('created_at', monthEnd),
          // This month's hours
          supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('user_id', user!.id)
            .in('status', ['confirmed', 'completed'])
            .gte('start_time', monthStart)
            .lte('start_time', monthEnd),
          // Last 6 months spend history
          supabase
            .from('bookings')
            .select('total_amount, created_at')
            .eq('user_id', user!.id)
            .eq('payment_status', 'paid')
            .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
            .order('created_at'),
        ])

        if (cancelled) return

        if (bookingsError || roomsError) {
          setError(bookingsError?.message || roomsError?.message || 'Unable to load dashboard data.')
        }

        setUpcoming((bookings as Booking[]) || [])
        setRecommended((rooms as Room[]) || [])

        // Monthly spend
        const spend = (paidBookings || []).reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
        setMonthlySpend(spend)

        // Monthly hours
        const hours = (confirmedBookings || []).reduce((sum, b) => {
          return sum + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000
        }, 0)
        setMonthlyHours(Math.round(hours * 10) / 10)

        // Spend history — bucket into last 6 months
        const hist = [0, 0, 0, 0, 0, 0]
        ;(allPaidBookings || []).forEach((b) => {
          const d = new Date(b.created_at)
          const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
          const idx = 5 - monthDiff
          if (idx >= 0 && idx < 6) hist[idx] += Number(b.total_amount || 0)
        })
        setSpendHistory(hist)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [configured, loading, user, sessionReady])

  const stats = [
    {
      label: 'Upcoming',
      value: loadingData ? '...' : upcoming.length.toString(),
      icon: Calendar,
      onClick: () => navigate('/dashboard/bookings'),
    },
    {
      label: 'Hours Booked',
      value: loadingData
        ? '...'
        : upcoming
            .reduce((sum, booking) => sum + (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 3600000, 0)
            .toFixed(0),
      icon: Clock,
      onClick: () => navigate('/dashboard/bookings'),
    },
  ]

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Overview</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Good day, {profile?.full_name?.split(' ')[0] || 'Valedesk member'}</p>
        </div>
        {!hasSupabaseConfig() && <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700">Supabase setup pending</span>}
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold uppercase tracking-widest text-amber-800">
          {error}
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {/* Card 1 — Upcoming */}
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} onClick={stat.onClick} className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-0.5">
              <Icon className="mb-5 h-5 w-5 text-[#1E90FF]" />
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">{stat.label}</p>
              <p className="text-5xl font-black tracking-tighter">{stat.value}</p>
            </div>
          )
        })}

        {/* Card 3 — This Month's Spend */}
        <div
          onClick={() => navigate('/dashboard/bookings')}
          className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-0.5"
        >
          <DollarSign className="mb-5 h-5 w-5 text-[#1E90FF]" />
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">This Month's Spend</p>
          <p className="text-3xl font-black tracking-tighter md:text-4xl">
            {loadingData ? '...' : `RM ${monthlySpend.toFixed(0)}`}
          </p>
          {!loadingData && <SparklineChart data={spendHistory} />}
        </div>

        {/* Card 4 — Hours This Month */}
        <div
          onClick={() => navigate('/dashboard/bookings')}
          className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-0.5"
        >
          <Timer className="mb-3 h-5 w-5 text-[#1E90FF]" />
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Hours This Month</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black tracking-tighter md:text-4xl">
              {loadingData ? '...' : `${monthlyHours} hrs`}
            </p>
            {!loadingData && <ProgressRing value={monthlyHours} max={40} label={`${monthlyHours}/40`} />}
          </div>
        </div>
      </div>

      {/* ── Promotional Carousel ─────────────────────────────────── */}
      <PromoCarousel />

      {/* ── Upcoming Bookings + Recommended ─────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Upcoming Bookings</h3>
            <Link to="/dashboard/bookings" className="border-b-2 border-[#1E90FF] pb-1 text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">View all</Link>
          </div>
          {loadingData ? (
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <div className="h-5 w-40 animate-pulse rounded bg-sky-50" />
              <div className="mt-3 h-4 w-56 animate-pulse rounded bg-sky-50" />
            </div>
          ) : upcoming.length ? upcoming.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <div>
                <p className="text-xl font-black uppercase">{booking.rooms?.name}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#061B3A]/40">{new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleTimeString()}</p>
              </div>
              <Link
                to={`/dashboard/bookings?highlight=${booking.id}`}
                className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5" />
                View Booking
              </Link>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-white/75 p-8">
              <p className="mb-5 text-sm font-bold text-[#061B3A]/60">No upcoming bookings yet.</p>
              <Link to="/dashboard/rooms" className="inline-flex h-10 items-center justify-center rounded-full bg-[#1E90FF] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">Browse Spaces</Link>
            </div>
          )}
        </div>

        {/* ── Recommended Spaces ──────────────────────────────────── */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Recommended</h3>
          {loadingData ? (
            <div className="flex min-h-[230px] flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <div className="h-5 w-40 animate-pulse rounded bg-sky-50" />
              <div className="mt-4 h-4 w-32 animate-pulse rounded bg-sky-50" />
              <div className="mt-auto h-10 w-full animate-pulse rounded-full bg-sky-50" />
            </div>
          ) : recommended.length ? recommended.map((room) => {
            const primaryImage = room.room_images?.find(img => img.is_primary)?.url
              ?? room.room_images?.[0]?.url
              ?? '/images/room-placeholder.jpg'
            return (
              <div key={room.id} className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
                <img
                  src={primaryImage}
                  alt={room.name}
                  className="aspect-video w-full rounded-t-xl object-cover"
                />
                <div className="p-5">
                  <h4 className="text-xl font-black uppercase">{room.name}</h4>
                  <p className="mb-4 mt-1 text-[10px] font-bold uppercase tracking-widest text-[#061B3A]/40">RM{room.price_hour}/hr · {room.floor}</p>
                  <Link to={`/dashboard/rooms/${room.id}`} className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#1E90FF] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">View Space</Link>
                </div>
              </div>
            )
          }) : (
            <div className="flex min-h-[230px] flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <h4 className="text-xl font-black uppercase">Run seed data</h4>
              <p className="mb-6 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#061B3A]/40">Rooms appear here after Supabase is connected</p>
              <Link to="/dashboard/rooms" className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-full bg-[#1E90FF] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">View Space</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
