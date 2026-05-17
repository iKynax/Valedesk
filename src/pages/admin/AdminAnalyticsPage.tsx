import { useEffect, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { DollarSign, CalendarDays, TrendingUp, Star, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
)

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[#2563EB]/30 bg-[#0F1E35] px-4 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-white">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('Revenue') ? `RM ${p.value.toLocaleString()}` : p.value}</p>
      ))}
    </div>
  )
}

const RANGES = [
  { label: 'Last 7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: 'This Year', value: 365 },
]

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, avgValue: 0, topRoom: '', busiestDay: '' })
  const [revenueOverTime, setRevenueOverTime] = useState<any[]>([])
  const [bookingsVolume, setBookingsVolume] = useState<any[]>([])
  const [topRooms, setTopRooms] = useState<any[]>([])
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [roomTypeStats, setRoomTypeStats] = useState<any[]>([])

  const loadData = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - range)

    try {
      const [{ data: bookings }, { data: users }] = await Promise.all([
        supabase.from('bookings').select('id, total_amount, status, payment_status, start_time, end_time, created_at, room_id, rooms(name, type)').gte('created_at', rangeStart.toISOString()),
        supabase.from('user_profiles').select('id, created_at').order('created_at', { ascending: true }),
      ])

      const allBookings = bookings || []
      const paidBookings = allBookings.filter(b => b.payment_status === 'paid')
      const totalRevenue = paidBookings.reduce((s, b) => s + Number(b.total_amount), 0)
      const avgValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0

      // Top room
      const roomCounts: Record<string, number> = {}
      allBookings.forEach(b => { const name = (b.rooms as any)?.name || 'Unknown'; roomCounts[name] = (roomCounts[name] || 0) + 1 })
      const topRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]

      // Busiest day
      const dayCounts = [0, 0, 0, 0, 0, 0, 0]
      allBookings.forEach(b => { dayCounts[new Date(b.start_time).getDay()]++ })
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const busiestDayIdx = dayCounts.indexOf(Math.max(...dayCounts))

      setStats({
        totalRevenue, totalBookings: allBookings.length, avgValue,
        topRoom: topRoom ? `${topRoom[0]} (${topRoom[1]})` : 'N/A',
        busiestDay: dayNames[busiestDayIdx]
      })

      // Revenue over time - group by day/week
      const revByDate: Record<string, number> = {}
      paidBookings.forEach(b => {
        const key = new Date(b.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
        revByDate[key] = (revByDate[key] || 0) + Number(b.total_amount)
      })
      setRevenueOverTime(Object.entries(revByDate).map(([date, rev]) => ({ date, revenue: rev })))

      // Bookings volume by day
      const volByDate: Record<string, number> = {}
      allBookings.forEach(b => {
        const key = new Date(b.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
        volByDate[key] = (volByDate[key] || 0) + 1
      })
      setBookingsVolume(Object.entries(volByDate).map(([date, count]) => ({ date, bookings: count })))

      // Top rooms horizontal bar
      setTopRooms(Object.entries(roomCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })))

      // Peak hours
      const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }))
      allBookings.forEach(b => { const h = new Date(b.start_time).getHours(); hourCounts[h].count++ })
      setPeakHours(hourCounts.filter(h => h.count > 0 || (parseInt(h.hour) >= 7 && parseInt(h.hour) <= 22)))

      // Room type stats
      const typeLabels: Record<string, string> = { hot_desk: 'Hot Desk', focus_pod: 'Focus Pod', meeting_room: 'Meeting Room', boardroom: 'Boardroom', event_space: 'Event Space', private_office: 'Private Office' }
      const typeStats: Record<string, { bookings: number; revenue: number }> = {}
      allBookings.forEach(b => {
        const type = (b.rooms as any)?.type || 'unknown'
        if (!typeStats[type]) typeStats[type] = { bookings: 0, revenue: 0 }
        typeStats[type].bookings++
        if (b.payment_status === 'paid') typeStats[type].revenue += Number(b.total_amount)
      })
      setRoomTypeStats(Object.entries(typeStats).map(([key, val]) => ({ name: typeLabels[key] || key, ...val })))

      // User growth
      const usersByMonth: Record<string, number> = {}
      let cumulative = 0;
      (users || []).forEach(u => {
        const key = new Date(u.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' })
        if (!usersByMonth[key]) usersByMonth[key] = cumulative
        cumulative++
        usersByMonth[key] = cumulative
      })
      setUserGrowth(Object.entries(usersByMonth).map(([month, total]) => ({ month, users: total })))

    } catch (err) { console.error('[Analytics] Error:', err) }
    setLoading(false)
  }, [range])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      <div className="grid grid-cols-2 gap-6"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map(r => (
          <button key={r.value} onClick={() => setRange(r.value)} className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${range === r.value ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white'}`}>{r.label}</button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Total Revenue', value: `RM ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#2563EB' },
          { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarDays, color: '#38BDF8' },
          { label: 'Average Value', value: `RM ${stats.avgValue.toFixed(0)}`, icon: TrendingUp, color: '#10B981' },
          { label: 'Top Room', value: stats.topRoom, icon: Star, color: '#F59E0B' },
          { label: 'Busiest Day', value: stats.busiestDay, icon: Clock, color: '#8B5CF6' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/8 bg-[#0F1E35] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <p className="text-[10px] font-medium text-[#94A3B8]">{s.label}</p>
              <p className="mt-0.5 text-lg font-bold text-white truncate">{s.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Row 1: Revenue + Bookings Volume */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Revenue Over Time</h3>
          {revenueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueOverTime}>
                <defs><linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" fill="url(#aRevGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data for this range</div>}
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Bookings Volume</h3>
          {bookingsVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bookingsVolume}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data for this range</div>}
        </div>
      </div>

      {/* Row 2: Top Rooms + Room Type */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Most Booked Rooms</h3>
          {topRooms.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topRooms} layout="vertical">
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Bookings" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data</div>}
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Bookings by Room Type</h3>
          {roomTypeStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roomTypeStats}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data</div>}
        </div>
      </div>

      {/* Row 3: Peak Hours + User Growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Peak Booking Hours</h3>
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={peakHours}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Bookings" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data</div>}
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={userGrowth}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="users" name="Total Users" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex h-60 items-center justify-center text-sm text-[#94A3B8]">No data</div>}
        </div>
      </div>
    </div>
  )
}
