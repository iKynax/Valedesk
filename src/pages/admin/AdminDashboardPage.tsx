import { useEffect, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  DollarSign, CalendarDays, Users, Building2, UserPlus, XCircle,
  TrendingUp, TrendingDown, Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

/* ── Types ──────────────────────────────────────────────── */
interface KPI { label: string; value: string | number; trend: number; icon: any; color: string }
interface LiveBooking { id: string; room: string; user: string; time: string; amount: number; status: string; created_at: string }

/* ── Custom Tooltip ─────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[#2563EB]/30 bg-[#0F1E35] px-4 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="text-sm font-bold text-[#60A5FA]">RM {Number(payload[0].value).toLocaleString()}</p>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
)

/* ── KPI Card ───────────────────────────────────────────── */
function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const Icon = kpi.icon
  const isPositive = kpi.trend >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/8 bg-[#0F1E35] p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl`} style={{ background: `${kpi.color}15` }}>
          <Icon className="h-5 w-5" style={{ color: kpi.color }} />
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(kpi.trend).toFixed(1)}%
        </div>
      </div>
      <p className="text-xs font-medium text-[#94A3B8]">{kpi.label}</p>
      <p className="mt-1 text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{kpi.value}</p>
    </motion.div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [donutData, setDonutData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<number[][]>([])
  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>([])
  const [revenueRange, setRevenueRange] = useState<'3M' | '6M' | '12M'>('12M')

  const loadData = useCallback(async () => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    try {
      // Fetch all needed data in parallel
      const [
        { data: bookingsAll },
        { count: totalUsers },
        { count: newUsersThisWeek },
        { count: newUsersPrevWeek },
        { count: totalRooms },
        { data: recentBookings }
      ] = await Promise.all([
        supabase.from('bookings').select('id, total_amount, status, payment_status, start_time, end_time, room_id, user_id, created_at, rooms(name, type)'),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()),
        supabase.from('rooms').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id, total_amount, status, start_time, user_id, created_at, rooms(name)').order('created_at', { ascending: false }).limit(10)
      ])

      const allBookings = bookingsAll || []

      // KPI calculations
      const thisMonthRevenue = allBookings.filter(b => b.payment_status === 'paid' && new Date(b.created_at) >= startOfMonth).reduce((s, b) => s + Number(b.total_amount), 0)
      const lastMonthRevenue = allBookings.filter(b => b.payment_status === 'paid' && new Date(b.created_at) >= startOfLastMonth && new Date(b.created_at) <= endOfLastMonth).reduce((s, b) => s + Number(b.total_amount), 0)
      const revenueTrend = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : thisMonthRevenue > 0 ? 100 : 0

      const bookingsToday = allBookings.filter(b => new Date(b.start_time) >= today).length
      const bookingsYesterday = allBookings.filter(b => { const d = new Date(b.start_time); return d >= yesterday && d < today }).length
      const bookingsTrend = bookingsYesterday > 0 ? ((bookingsToday - bookingsYesterday) / bookingsYesterday) * 100 : bookingsToday > 0 ? 100 : 0

      const cancelledThisMonth = allBookings.filter(b => b.status === 'cancelled' && new Date(b.created_at) >= startOfMonth).length
      const cancelledLastMonth = allBookings.filter(b => b.status === 'cancelled' && new Date(b.created_at) >= startOfLastMonth && new Date(b.created_at) <= endOfLastMonth).length
      const cancelTrend = cancelledLastMonth > 0 ? ((cancelledThisMonth - cancelledLastMonth) / cancelledLastMonth) * 100 : cancelledThisMonth > 0 ? 100 : 0

      const occupancyRate = totalRooms && totalRooms > 0 ? Math.min(100, Math.round((allBookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) >= weekAgo).length / (totalRooms * 7 * 8)) * 100)) : 0

      setKpis([
        { label: 'Total Revenue (This Month)', value: `RM ${thisMonthRevenue.toLocaleString()}`, trend: revenueTrend, icon: DollarSign, color: '#2563EB' },
        { label: 'Bookings Today', value: bookingsToday, trend: bookingsTrend, icon: CalendarDays, color: '#38BDF8' },
        { label: 'Active Users', value: totalUsers || 0, trend: 5.2, icon: Users, color: '#8B5CF6' },
        { label: 'Room Occupancy Rate', value: `${occupancyRate}%`, trend: 3.1, icon: Building2, color: '#10B981' },
        { label: 'New Sign-ups (This Week)', value: newUsersThisWeek || 0, trend: newUsersPrevWeek && newUsersPrevWeek > 0 ? (((newUsersThisWeek || 0) - newUsersPrevWeek) / newUsersPrevWeek) * 100 : 0, icon: UserPlus, color: '#F59E0B' },
        { label: 'Cancellations (This Month)', value: cancelledThisMonth, trend: -cancelTrend, icon: XCircle, color: '#EF4444' },
      ])

      // Revenue chart - last 12 months
      const monthsCount = revenueRange === '3M' ? 3 : revenueRange === '6M' ? 6 : 12
      const revChart: any[] = []
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthRev = allBookings.filter(b => b.payment_status === 'paid' && new Date(b.created_at) >= d && new Date(b.created_at) <= dEnd).reduce((s, b) => s + Number(b.total_amount), 0)
        revChart.push({ month: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }), revenue: monthRev })
      }
      setRevenueData(revChart)

      // Donut chart - bookings by room type
      const typeMap: Record<string, number> = {}
      allBookings.forEach(b => {
        const type = (b.rooms as any)?.type || 'unknown'
        typeMap[type] = (typeMap[type] || 0) + 1
      })
      const typeLabels: Record<string, string> = {
        hot_desk: 'Hot Desk', focus_pod: 'Focus Pod', meeting_room: 'Meeting Room',
        boardroom: 'Boardroom', event_space: 'Event Space', private_office: 'Private Office'
      }
      setDonutData(Object.entries(typeMap).map(([key, val]) => ({ name: typeLabels[key] || key, value: val })))

      // Heatmap - 7 days × 15 hours (07:00-22:00)
      const heatmap: number[][] = Array.from({ length: 15 }, () => Array(7).fill(0))
      const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
      allBookings.filter(b => new Date(b.start_time) >= weekStart).forEach(b => {
        const start = new Date(b.start_time)
        const day = (start.getDay() + 6) % 7 // Mon=0
        const hour = start.getHours() - 7
        if (hour >= 0 && hour < 15 && day >= 0 && day < 7) heatmap[hour][day]++
      })
      setHeatmapData(heatmap)

      // Live bookings - fetch user names separately
      const recentList = recentBookings || []
      if (recentList.length > 0) {
        const userIds = [...new Set(recentList.map((b: any) => b.user_id).filter(Boolean))]
        const { data: profiles } = await supabase.from('user_profiles').select('id, full_name').in('id', userIds)
        const profileMap: Record<string, string> = {}
        ;(profiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name || 'Guest' })
        setLiveBookings(recentList.map((b: any) => ({
          id: b.id, room: b.rooms?.name || 'Unknown', user: profileMap[b.user_id] || 'Guest',
          time: new Date(b.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(b.total_amount), status: b.status, created_at: b.created_at
        })))
      } else {
        setLiveBookings([])
      }
    } catch (err) {
      console.error('[AdminDashboard] Load error:', err)
    }
    setLoading(false)
  }, [revenueRange])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription for live feed
  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    const channel = supabase.channel('admin-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        const b = payload.new as any
        setLiveBookings(prev => [{
          id: b.id, room: 'New Booking', user: 'Loading...', time: new Date(b.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(b.total_amount), status: b.status, created_at: b.created_at
        }, ...prev].slice(0, 10))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const DONUT_COLORS = ['#2563EB', '#38BDF8', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => <KPICard key={kpi.label} kpi={kpi} index={i} />)}
      </div>

      {/* Revenue Chart + Live Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-2 rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Revenue Overview</h3>
            <div className="flex rounded-lg bg-white/5 p-0.5">
              {(['3M', '6M', '12M'] as const).map(r => (
                <button key={r} onClick={() => setRevenueRange(r)} className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${revenueRange === r ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-white'}`}>{r}</button>
              ))}
            </div>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `RM${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-[#94A3B8]">
              <p className="text-sm">No revenue data yet</p>
            </div>
          )}
        </motion.div>

        {/* Live Booking Feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Live Activity</h3>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 280 }}>
            {liveBookings.length > 0 ? liveBookings.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{b.room}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>{b.status}</span>
                </div>
                <p className="text-xs text-[#94A3B8]">{b.user} · {b.time}</p>
                <p className="text-xs font-bold text-[#60A5FA]">RM {b.amount}</p>
              </motion.div>
            )) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-[#94A3B8]">No recent bookings</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Donut Chart + Heatmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Bookings by Room Type</h3>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" isAnimationActive={true}>
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F1E35', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 12, color: '#fff' }} />
                <Legend formatter={(value) => <span className="text-xs text-[#94A3B8]">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-[#94A3B8]"><p className="text-sm">No booking data yet</p></div>
          )}
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl border border-white/8 bg-[#0F1E35] p-6">
          <h3 className="mb-4 text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>This Week's Occupancy Heatmap</h3>
          <div className="overflow-x-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
              <div />
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#94A3B8]">{d}</div>)}
              {heatmapData.map((row, hourIdx) => (
                <>
                  <div key={`h-${hourIdx}`} className="flex items-center text-[10px] text-[#94A3B8]">{String(hourIdx + 7).padStart(2, '0')}:00</div>
                  {row.map((count, dayIdx) => {
                    const intensity = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : 3
                    const colors = ['bg-[#0F1E35]', 'bg-[#1D4ED8]/40', 'bg-[#2563EB]/60', 'bg-[#38BDF8]/80']
                    return (
                      <div key={`${hourIdx}-${dayIdx}`} className={`group relative h-6 rounded ${colors[intensity]} border border-white/5 transition-all hover:scale-110 cursor-pointer`} title={`${count} booking(s)`}>
                        <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-[#0F1E35] px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">{count}</div>
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
