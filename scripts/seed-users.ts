import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { addDays, addHours, setHours, setMinutes } from 'date-fns'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before running this seed script.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser(email: string, password: string, fullName: string, avatarSeed: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}` },
  })
  if (error && !error.message.includes('already registered')) throw error
  if (data.user) return data.user

  const { data: users } = await supabase.auth.admin.listUsers()
  return (users.users as any[]).find((user) => user.email === email)
}

function makeBooking(userId: string, room: any, daysOffset: number, startHour: number, durationHours: number, status = 'confirmed') {
  const start = setMinutes(setHours(addDays(new Date(), daysOffset), startHour), 0)
  const end = addHours(start, durationHours)
  const baseAmount = Number(room.price_hour) * durationHours
  const serviceFee = Math.round(baseAmount * 0.1 * 100) / 100
  const total = Math.round((baseAmount + serviceFee) * 100) / 100
  const ref = `VD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  return {
    reference: ref,
    user_id: userId,
    room_id: room.id,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status,
    attendees: [],
    add_ons: [],
    notes: '',
    base_amount: baseAmount,
    service_fee: serviceFee,
    total_amount: total,
    payment_status: status === 'cancelled' ? 'refunded' : 'paid',
    qr_data: ref,
  }
}

async function seedUsers() {
  const sarah = await ensureUser('sarah.lim@testuser.com', 'TestUser123!', 'Sarah Lim', 'sarah')
  const raj = await ensureUser('raj.kumar@testuser.com', 'TestUser123!', 'Raj Kumar', 'raj')
  const admin = await ensureUser('admin@valedesk.co', 'AdminVale2024!', 'Valedesk Admin', 'admin')

  if (admin) {
    await supabase.from('user_profiles').update({ role: 'admin', company: 'Valedesk', job_title: 'Space Manager', onboarded: true, persona: 'team_lead' }).eq('id', admin.id)
  }
  if (sarah) {
    await supabase.from('user_profiles').update({ company: 'Grab', job_title: 'Product Lead', onboarded: true, persona: 'team_lead', phone: '+60 12-345 6789' }).eq('id', sarah.id)
  }
  if (raj) {
    await supabase.from('user_profiles').update({ company: 'Shopee', job_title: 'Senior Engineer', onboarded: true, persona: 'individual', phone: '+60 17-890 1234' }).eq('id', raj.id)
  }

  const { data: rooms } = await supabase.from('rooms').select('id, slug, price_hour, name')
  const bySlug = (slug: string) => rooms?.find((room) => room.slug === slug)
  const bookings = []

  if (sarah && bySlug('meridian-suite') && bySlug('catalyst-room') && bySlug('pinnacle-boardroom')) {
    bookings.push(
      makeBooking(sarah.id, bySlug('meridian-suite'), 1, 10, 2),
      makeBooking(sarah.id, bySlug('pinnacle-boardroom'), 3, 14, 3),
      makeBooking(sarah.id, bySlug('catalyst-room'), -2, 9, 1, 'completed'),
    )
  }
  if (raj && bySlug('sky-lounge-hot-desk') && bySlug('the-atrium') && bySlug('catalyst-room')) {
    bookings.push(
      makeBooking(raj.id, bySlug('sky-lounge-hot-desk'), 2, 8, 8),
      makeBooking(raj.id, bySlug('catalyst-room'), 5, 11, 1.5),
      makeBooking(raj.id, bySlug('the-atrium'), -1, 18, 4, 'completed'),
    )
  }

  if (bookings.length) {
    const { error } = await supabase.from('bookings').insert(bookings)
    if (error) throw error
  }

  console.log('Seed complete.')
  console.log('Regular User 1: sarah.lim@testuser.com / TestUser123!')
  console.log('Regular User 2: raj.kumar@testuser.com / TestUser123!')
  console.log('Admin:          admin@valedesk.co / AdminVale2024!')
}

seedUsers().catch((error) => {
  console.error(error)
  process.exit(1)
})
