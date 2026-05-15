import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Heart, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { useAuth } from '@/hooks/useAuth'
import type { Booking, Room } from '@/types'

export default function DashboardHome() {
  const { profile, user, loading, configured, sessionReady } = useAuth()
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [recommended, setRecommended] = useState<Room | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only fetch when auth is fully resolved and we have a user.
    // ProtectedRoute already guarantees user != null by the time this
    // component mounts, but we check defensively.
    if (!configured || loading || !user) return

    const supabase = createClient()
    let cancelled = false

    async function load() {
      setLoadingData(true)
      setError('')

      try {
        const [{ data: bookings, error: bookingsError }, { data: rooms, error: roomsError }] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, rooms (id, name, type, floor, room_images (url, is_primary))')
            .eq('user_id', user.id)
            .in('status', ['confirmed', 'pending'])
            .gt('start_time', new Date().toISOString())
            .order('start_time')
            .limit(2),
          supabase
            .from('rooms')
            .select('*, room_images (id, room_id, url, alt_text, is_primary, sort_order)')
            .eq('status', 'active')
            .order('rating', { ascending: false })
            .limit(1),
        ])

        if (cancelled) return

        if (bookingsError || roomsError) {
          setError(bookingsError?.message || roomsError?.message || 'Unable to load dashboard data.')
        }
        setUpcoming((bookings as Booking[]) || [])
        setRecommended((rooms?.[0] as Room) || null)
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
    { label: 'Upcoming', value: loadingData ? '...' : upcoming.length.toString(), icon: Calendar },
    {
      label: 'Hours Booked',
      value: loadingData
        ? '...'
        : upcoming
            .reduce((sum, booking) => sum + (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 3600000, 0)
            .toString(),
      icon: Clock,
    },
    { label: 'Saved Spaces', value: '-', icon: Heart },
    { label: 'Browse', value: 'Live', icon: Search },
  ]

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <Icon className="mb-5 h-5 w-5 text-[#1E90FF]" />
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">{stat.label}</p>
              <p className="text-5xl font-black tracking-tighter">{stat.value}</p>
            </div>
          )
        })}
      </div>

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
            <div key={booking.id} className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
              <p className="text-xl font-black uppercase">{booking.rooms?.name}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#061B3A]/40">{new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleTimeString()}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-white/75 p-8">
              <p className="mb-5 text-sm font-bold text-[#061B3A]/60">No upcoming bookings yet.</p>
              <Link to="/dashboard/rooms" className="inline-flex h-10 items-center justify-center rounded-full bg-[#1E90FF] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">Browse Spaces</Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Recommended</h3>
          <div className="flex min-h-[230px] flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
            {loadingData ? (
              <>
                <div className="h-5 w-40 animate-pulse rounded bg-sky-50" />
                <div className="mt-4 h-4 w-32 animate-pulse rounded bg-sky-50" />
                <div className="mt-auto h-10 w-full animate-pulse rounded-full bg-sky-50" />
              </>
            ) : (
              <>
                <h4 className="text-xl font-black uppercase">{recommended?.name || 'Run seed data'}</h4>
                <p className="mb-6 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#061B3A]/40">{recommended ? `RM${recommended.price_hour}/hr / ${recommended.floor}` : 'Rooms appear here after Supabase is connected'}</p>
                <Link to={recommended ? `/dashboard/rooms/${recommended.id}` : '/dashboard/rooms'} className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-full bg-[#1E90FF] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">View Space</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
