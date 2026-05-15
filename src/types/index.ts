export type UserRole = 'user' | 'admin'
export type RoomType = 'hot_desk' | 'focus_pod' | 'meeting_room' | 'boardroom' | 'event_space' | 'private_office'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'
export type RoomStatus = 'active' | 'inactive' | 'maintenance'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  company: string | null
  job_title: string | null
  persona: 'individual' | 'team_lead' | 'event_organiser' | null
  preferences: { space_types: string[]; notifications: boolean }
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface RoomImage {
  id: string
  room_id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface Amenity {
  id: string
  name: string
  icon: string
}

export interface Room {
  id: string
  name: string
  slug: string
  type: RoomType
  floor: string
  capacity: number
  description: string
  price_hour: number
  price_half: number
  price_day: number
  status: RoomStatus
  floor_x: number | null
  floor_y: number | null
  floor_w: number | null
  floor_h: number | null
  floor_level: string | null
  rating: number
  review_count: number
  room_images?: RoomImage[]
  room_amenities?: { amenities: Amenity }[]
}

export interface Booking {
  id: string
  reference: string
  user_id: string
  room_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  attendees: string[]
  add_ons: AddOn[]
  notes: string | null
  base_amount: number
  service_fee: number
  total_amount: number
  payment_status: PaymentStatus
  stripe_session: string | null
  qr_data: string
  calendar_synced: boolean
  created_at: string
  updated_at: string
  rooms?: Room
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface AddOn {
  id: string
  name: string
  description: string
  price: number
  icon: string
}

export const ADD_ONS: AddOn[] = [
  { id: 'coffee', name: 'Barista Coffee Service', description: 'Freshly brewed coffee for attendees', price: 15, icon: 'Coffee' },
  { id: 'whiteboard', name: 'Whiteboard Equipment', description: 'Premium markers and eraser set', price: 10, icon: 'PenLine' },
  { id: 'pa', name: 'Microphone & PA System', description: 'Wireless mic and speaker for presentations', price: 30, icon: 'Mic' },
  { id: 'printing', name: 'Printing Credits', description: '20 pages A4, colour or B&W', price: 20, icon: 'Printer' },
]

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  hot_desk: 'Hot Desk',
  focus_pod: 'Focus Pod',
  meeting_room: 'Meeting Room',
  boardroom: 'Boardroom',
  event_space: 'Event Space',
  private_office: 'Private Office',
}
