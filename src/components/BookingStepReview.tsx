import React, { useState, useEffect } from 'react'
import { Coffee, PenLine, Mic, Printer, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkAvailability } from '@/lib/availability'
import { getRoomSlotsForDay } from '@/lib/availability'
import { hasSupabaseConfig } from '@/lib/env'
import type { AddOn, Room } from '@/types'
import { ADD_ONS } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = { Coffee, PenLine, Mic, Printer }

const TIME_SLOTS: string[] = []
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 21 || true) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

interface Props {
  room: Room
  date: string
  startTime: string
  endTime: string
  addOns: AddOn[]
  onDateChange: (d: string) => void
  onStartChange: (t: string) => void
  onEndChange: (t: string) => void
  onToggleAddOn: (a: AddOn) => void
  onContinue: () => void
}

export default function BookingStepReview({
  room, date, startTime, endTime, addOns,
  onDateChange, onStartChange, onEndChange, onToggleAddOn, onContinue,
}: Props) {
  const [conflict, setConflict] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const image = room.room_images?.find(i => i.is_primary)?.url || room.room_images?.[0]?.url

  // Load booked slots for selected date
  useEffect(() => {
    if (!date || !hasSupabaseConfig()) return
    getRoomSlotsForDay(room.id, new Date(`${date}T00:00:00`)).then(slots => {
      const booked = new Set<string>()
      slots.forEach(s => {
        if (!s.available) {
          const h = s.time.getHours().toString().padStart(2, '0')
          const m = s.time.getMinutes().toString().padStart(2, '0')
          booked.add(`${h}:${m}`)
        }
      })
      setBookedSlots(booked)
    })
  }, [date, room.id])

  // Conflict check
  useEffect(() => {
    if (!date || !startTime || !endTime || !hasSupabaseConfig()) return
    const start = new Date(`${date}T${startTime}:00`)
    const end = new Date(`${date}T${endTime}:00`)
    if (end <= start) return
    checkAvailability(room.id, start, end).then(r => setConflict(!r.available))
  }, [date, startTime, endTime, room.id])

  // Calculate duration display
  const getDuration = () => {
    if (!startTime || !endTime) return ''
    const s = new Date(`2000-01-01T${startTime}:00`)
    const e = new Date(`2000-01-01T${endTime}:00`)
    if (e <= s) return ''
    const mins = (e.getTime() - s.getTime()) / 60000
    const hrs = Math.floor(mins / 60)
    const rm = mins % 60
    return rm > 0 ? `${hrs} hrs ${rm} mins` : `${hrs} hrs`
  }

  const endSlots = TIME_SLOTS.filter(t => t > startTime)

  return (
    <div className="space-y-6">
      {image && <img src={image} alt={room.name} className="h-64 w-full rounded-xl object-cover" />}

      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
          Date
          <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={e => onDateChange(e.target.value)} />
        </label>

        <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
          Start Time
          <select value={startTime} onChange={e => onStartChange(e.target.value)}
            className="h-10 w-full rounded-md border border-sky-100 bg-white px-3 text-sm normal-case tracking-normal">
            {TIME_SLOTS.map(t => (
              <option key={t} value={t} disabled={bookedSlots.has(t)}>
                {t}{bookedSlots.has(t) ? ' (booked)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
          End Time
          <select value={endTime} onChange={e => onEndChange(e.target.value)}
            className="h-10 w-full rounded-md border border-sky-100 bg-white px-3 text-sm normal-case tracking-normal">
            <option value="">Select end time</option>
            {endSlots.map(t => (
              <option key={t} value={t} disabled={bookedSlots.has(t)}>
                {t}{bookedSlots.has(t) ? ' (booked)' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">
          Duration
          <div className="flex h-10 items-center rounded-md bg-sky-50 px-3 text-sm font-bold normal-case tracking-normal text-blue-700">
            {getDuration() || '—'}
          </div>
        </div>
      </div>

      {conflict && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
          <AlertCircle className="h-4 w-4" />
          This time slot is no longer available. Please select a different time.
        </div>
      )}

      {/* Add-ons */}
      <div className="grid gap-3 md:grid-cols-2">
        {ADD_ONS.map(addOn => {
          const selected = addOns.some(a => a.id === addOn.id)
          const Icon = ICON_MAP[addOn.icon] || Coffee
          return (
            <button key={addOn.id} onClick={() => onToggleAddOn(addOn)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-sky-100'}`}>
              <input type="checkbox" checked={selected} readOnly className="h-4 w-4 accent-blue-600" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{addOn.name}</p>
                <p className="text-xs text-[#061B3A]/55">{addOn.description}</p>
              </div>
              <span className="text-xs font-black text-blue-600">+RM{addOn.price}</span>
            </button>
          )
        })}
      </div>

      <Button onClick={onContinue} disabled={conflict || !endTime}
        className="h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">
        Continue
      </Button>
    </div>
  )
}
