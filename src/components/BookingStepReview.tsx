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

  const isValid = !conflict && !!date && !!startTime && !!endTime

  return (
    <div className="space-y-6">

      {/* ── Date & Time Selector ─────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_8px_24px_rgba(30,144,255,0.06)]">
        <div className="border-b border-sky-50 bg-sky-50/60 px-5 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Select Date &amp; Time</p>
        </div>
        <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-sky-100">
          {/* Date */}
          <div className="p-5 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Date</label>
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={e => onDateChange(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          {/* Start / End / Duration */}
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Start</label>
                <select value={startTime} onChange={e => onStartChange(e.target.value)}
                  className="h-11 w-full rounded-lg border border-sky-100 bg-white px-3 text-sm outline-none focus:border-[#1E90FF]">
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t} disabled={bookedSlots.has(t)}>
                      {t}{bookedSlots.has(t) ? ' ✗' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">End</label>
                <select value={endTime} onChange={e => onEndChange(e.target.value)}
                  className="h-11 w-full rounded-lg border border-sky-100 bg-white px-3 text-sm outline-none focus:border-[#1E90FF]">
                  <option value="">— select —</option>
                  {endSlots.map(t => (
                    <option key={t} value={t} disabled={bookedSlots.has(t)}>
                      {t}{bookedSlots.has(t) ? ' ✗' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {getDuration() && (
              <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/40">Duration</span>
                <span className="ml-auto text-sm font-black text-blue-600">{getDuration()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation feedback */}
      {conflict && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          This time slot is no longer available. Please select a different time.
        </div>
      )}
      {!date && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" /> Please select a date to continue.
        </p>
      )}
      {date && !endTime && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" /> Please select a start and end time.
        </p>
      )}

      {/* ── Add-ons ──────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Add-Ons</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADD_ONS.map(addOn => {
            const selected = addOns.some(a => a.id === addOn.id)
            const Icon = ICON_MAP[addOn.icon] || Coffee
            return (
              <button key={addOn.id} onClick={() => onToggleAddOn(addOn)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  selected ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100' : 'border-sky-100 hover:border-blue-200'
                }`}>
                <input type="checkbox" checked={selected} readOnly className="h-4 w-4 accent-blue-600" />
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${selected ? 'bg-blue-600' : 'bg-blue-100'}`}>
                  <Icon className={`h-4 w-4 ${selected ? 'text-white' : 'text-blue-600'}`} />
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
      </div>

      <Button
        onClick={onContinue}
        disabled={!isValid}
        className="h-13 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Details →
      </Button>
    </div>
  )
}
