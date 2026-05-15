import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import type { Room } from '@/types'

export function useRooms() {
  const getRooms = async (filters?: {
    type?: string[]
    capacity?: number
    amenities?: string[]
    maxPrice?: number
  }): Promise<{ data: Room[] | null; error: Error | null }> => {
    if (!hasSupabaseConfig()) return { data: null, error: new Error('Supabase is not configured yet.') }
    const supabase = createClient()
    let query = supabase
      .from('rooms')
      .select('*, room_images (id, room_id, url, alt_text, is_primary, sort_order), room_amenities (amenities (id, name, icon))')
      .eq('status', 'active')
      .order('type')

    if (filters?.type?.length) query = query.in('type', filters.type)
    if (filters?.capacity) query = query.gte('capacity', filters.capacity)
    if (filters?.maxPrice) query = query.lte('price_hour', filters.maxPrice)

    const { data, error } = await query
    return { data: (data as Room[]) ?? null, error: error as Error | null }
  }

  const getRoomById = async (id: string): Promise<{ data: Room | null; error: Error | null }> => {
    if (!hasSupabaseConfig()) return { data: null, error: new Error('Supabase is not configured yet.') }
    const supabase = createClient()
    const { data, error } = await supabase
      .from('rooms')
      .select('*, room_images (id, room_id, url, alt_text, is_primary, sort_order), room_amenities (amenities (id, name, icon))')
      .eq('id', id)
      .single()
    return { data: (data as Room) ?? null, error: error as Error | null }
  }

  return { getRooms, getRoomById }
}
