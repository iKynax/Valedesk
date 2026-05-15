import { createClient } from '@/lib/supabase/client'

export async function checkAvailability(roomId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('bookings')
    .select('id, start_time, end_time, status')
    .eq('room_id', roomId)
    .in('status', ['confirmed', 'pending'])
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString())

  if (excludeBookingId) query = query.neq('id', excludeBookingId)

  const [{ data: conflicts }, { data: blackouts }] = await Promise.all([
    query,
    supabase
      .from('maintenance_blackouts')
      .select('id, start_time, end_time, reason')
      .eq('room_id', roomId)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString()),
  ])

  const allConflicts = [...(conflicts || []), ...(blackouts || [])]
  return { available: allConflicts.length === 0, conflicts: allConflicts }
}

export async function getRoomSlotsForDay(roomId: string, date: Date) {
  const supabase = createClient()
  const dayStart = new Date(date)
  dayStart.setHours(7, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(22, 0, 0, 0)

  const [{ data: bookings }, { data: blackouts }] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('room_id', roomId)
      .gte('start_time', dayStart.toISOString())
      .lte('end_time', dayEnd.toISOString())
      .in('status', ['confirmed', 'pending']),
    supabase
      .from('maintenance_blackouts')
      .select('start_time, end_time')
      .eq('room_id', roomId)
      .gte('start_time', dayStart.toISOString())
      .lte('end_time', dayEnd.toISOString()),
  ])

  const blocked = [...(bookings || []), ...(blackouts || [])]
  const slots: { time: Date; available: boolean }[] = []
  const current = new Date(dayStart)
  while (current < dayEnd) {
    const slotEnd = new Date(current.getTime() + 30 * 60 * 1000)
    const isBooked = blocked.some((b) => new Date(b.start_time) < slotEnd && new Date(b.end_time) > current)
    slots.push({ time: new Date(current), available: !isBooked && current > new Date() })
    current.setMinutes(current.getMinutes() + 30)
  }
  return slots
}
