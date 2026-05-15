import { create } from 'zustand'
import type { Room } from '@/types'

interface BookingState {
  roomId: string | null
  room: Room | null
  date: Date | null
  startTime: string | null
  endTime: string | null
  addOns: string[]
  attendees: string[]
  notes: string
  step: number
  setRoom: (room: Room) => void
  setDateTime: (date: Date, start: string, end: string) => void
  toggleAddOn: (addOnId: string) => void
  setAttendees: (emails: string[]) => void
  setNotes: (notes: string) => void
  setStep: (step: number) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  roomId: null,
  room: null,
  date: null,
  startTime: null,
  endTime: null,
  addOns: [],
  attendees: [],
  notes: '',
  step: 1,
  setRoom: (room) => set({ room, roomId: room.id }),
  setDateTime: (date, startTime, endTime) => set({ date, startTime, endTime }),
  toggleAddOn: (id) =>
    set((state) => ({ addOns: state.addOns.includes(id) ? state.addOns.filter((item) => item !== id) : [...state.addOns, id] })),
  setAttendees: (attendees) => set({ attendees }),
  setNotes: (notes) => set({ notes }),
  setStep: (step) => set({ step }),
  reset: () => set({ roomId: null, room: null, date: null, startTime: null, endTime: null, addOns: [], attendees: [], notes: '', step: 1 }),
}))
