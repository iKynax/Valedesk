/**
 * Curated fallback images per room type.
 * Used when Supabase room_images are missing or all the same.
 * Images are picked deterministically by room ID so each room
 * always gets the same photo across page loads.
 */

const FALLBACK_IMAGES: Record<string, string[]> = {
  hot_desk: [
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=900&auto=format&fit=crop&q=80',
  ],
  focus_pod: [
    'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542744173-05336fcc7ad4?w=900&auto=format&fit=crop&q=80',
  ],
  meeting_room: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=900&auto=format&fit=crop&q=80',
  ],
  boardroom: [
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560264280-88b68371db39?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ez637a160?w=900&auto=format&fit=crop&q=80',
  ],
  event_space: [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80',
  ],
  private_office: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600494603473-d2b2e5f1b4d3?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=900&auto=format&fit=crop&q=80',
  ],
}

/** A stable placeholder for completely unknown room types */
const GENERIC_FALLBACK =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80'

/**
 * Known shared placeholder URLs that Supabase may store for all rooms.
 * When these are detected we skip them and use the curated fallback instead,
 * so each room gets a visually unique image.
 */
const KNOWN_SHARED_PLACEHOLDERS = new Set([
  // The same image that appears across all rooms in the DB
  'https://images.unsplash.com/photo-1497366216548-37526070297c',
])

/**
 * DJB2 string hash — fast, produces well-distributed values for short strings.
 * Used to pick a deterministic-but-varied image from the pool.
 */
function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Returns a deterministic fallback image URL for a room.
 * Uses the room's Supabase image if available AND unique,
 * otherwise picks a curated photo based on room type + id hash for variety.
 */
export function getRoomImage(
  room: { id: string; name?: string; type: string; room_images?: { url: string; is_primary?: boolean }[] | null }
): string {
  const supabaseUrl =
    room.room_images?.find((i) => i.is_primary)?.url ?? room.room_images?.[0]?.url

  // If Supabase has a real image that is NOT a known shared placeholder, use it
  if (supabaseUrl) {
    const isShared = [...KNOWN_SHARED_PLACEHOLDERS].some((ph) => supabaseUrl.startsWith(ph))
    if (!isShared) return supabaseUrl
  }

  // Otherwise use curated fallback, varied by room id + name for maximum spread
  const pool = FALLBACK_IMAGES[room.type] ?? Object.values(FALLBACK_IMAGES).flat()
  const hashInput = room.id + (room.name || '')
  const hash = djb2Hash(hashInput)
  return pool[hash % pool.length] ?? GENERIC_FALLBACK
}
