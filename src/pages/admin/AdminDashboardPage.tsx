import { useEffect, useState } from 'react'
import { Building2, CalendarDays, Users, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ bookingsToday: 0, revenueMonth: 0, totalUsers: 0, activeRooms: 0 })

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    async function load() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const month = new Date()
      month.setDate(1)
      month.setHours(0, 0, 0, 0)
      const [{ count: bookingsToday }, { data: revenueRows }, { count: totalUsers }, { count: activeRooms }] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('status', 'confirmed'),
        supabase.from('bookings').select('total_amount').gte('created_at', month.toISOString()).eq('payment_status', 'paid'),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setStats({
        bookingsToday: bookingsToday || 0,
        revenueMonth: revenueRows?.reduce((sum, row) => sum + Number(row.total_amount), 0) || 0,
        totalUsers: totalUsers || 0,
        activeRooms: activeRooms || 0,
      })
    }
    load()
  }, [])

  const cards = [
    { label: 'Bookings Today', value: stats.bookingsToday, icon: CalendarDays },
    { label: 'Revenue MTD', value: `RM ${stats.revenueMonth.toFixed(0)}`, icon: Wallet },
    { label: 'Users', value: stats.totalUsers, icon: Users },
    { label: 'Active Rooms', value: stats.activeRooms, icon: Building2 },
  ]

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-sky-100 pb-6">
        <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Admin Panel</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Live business pulse from Supabase</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <Icon className="mb-5 h-5 w-5 text-[#1E90FF]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">{card.label}</p>
              <p className="mt-2 text-4xl font-black tracking-tighter text-[#061B3A]">{card.value}</p>
            </div>
          )
        })}
      </div>
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
        <h3 className="mb-6 text-2xl font-black uppercase tracking-tight">Occupancy Pulse</h3>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 48 }).map((_, i) => <div key={i} className={`h-8 rounded-lg ${i % 5 === 0 ? 'bg-[#1E90FF]' : i % 3 === 0 ? 'bg-sky-200' : 'bg-sky-50'}`} />)}
        </div>
      </div>
    </div>
  )
}
