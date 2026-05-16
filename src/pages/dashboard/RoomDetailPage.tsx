import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { CalendarDays, Users, Star, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/env'
import { getRoomSlotsForDay } from '@/lib/availability'
import { useRooms } from '@/hooks/useRooms'
import { getRoomImage } from '@/lib/roomImages'
import type { Room } from '@/types'
import { ROOM_TYPE_LABELS } from '@/types'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns'

/* ── Month Calendar Component ──────────────────────────────────── */
function MonthCalendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: {
  selectedDate: Date | null
  onSelectDate: (d: Date) => void
  currentMonth: Date
  onMonthChange: (d: Date) => void
}) {
  const today = startOfDay(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-[Syne] text-lg font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map((dn) => (
          <div key={dn} className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {dn}
          </div>
        ))}
      </div>

      {/* Date Cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth)
          const isPast = isBefore(day, today) && !isSameDay(day, today)
          const isToday = isSameDay(day, today)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          let cellClass = 'relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all '

          if (!inMonth) {
            cellClass += 'text-slate-200'
          } else if (isPast) {
            cellClass += 'text-slate-300 cursor-not-allowed'
          } else if (isSelected) {
            cellClass += 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-200 cursor-pointer'
          } else {
            cellClass += 'text-slate-700 cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200'
          }

          return (
            <button
              key={day.toISOString()}
              disabled={!inMonth || isPast}
              onClick={() => onSelectDate(day)}
              className={cellClass}
            >
              {format(day, 'd')}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Time Slot Panel Component ─────────────────────────────────── */
function TimeSlotPanel({
  slots,
  selectedStart,
  selectedEnd,
  onSlotClick,
  selectedDate,
}: {
  slots: { time: Date; available: boolean }[]
  selectedStart: Date | null
  selectedEnd: Date | null
  onSlotClick: (slot: Date) => void
  selectedDate: Date
}) {
  const isInRange = (slotTime: Date) => {
    if (!selectedStart || !selectedEnd) return false
    return slotTime > selectedStart && slotTime < selectedEnd
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-700">
          Available Times
        </h4>
        <p className="text-xs text-blue-600 font-semibold mt-0.5">
          {format(selectedDate, 'EEEE, d MMMM yyyy')}
        </p>
        <p className="text-[10px] text-slate-400 mt-2">
          {!selectedStart
            ? '① Click a slot to set start time'
            : !selectedEnd
            ? '② Click another slot to set end time'
            : '✓ Range selected — adjust below if needed'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 overflow-y-auto flex-1">
        {slots.map((slot) => {
          const timeStr = format(slot.time, 'HH:mm')
          const isStart = selectedStart && isSameDay(slot.time, selectedStart) && slot.time.getTime() === selectedStart.getTime()
          const isEnd = selectedEnd && isSameDay(slot.time, selectedEnd) && slot.time.getTime() === selectedEnd.getTime()
          const inRange = isInRange(slot.time)

          let cls = 'rounded-xl px-1.5 py-2 text-center text-xs font-semibold transition-all '

          if (!slot.available) {
            cls += 'bg-slate-100 text-slate-300 border border-slate-200 line-through cursor-not-allowed'
          } else if (isStart) {
            cls += 'bg-[#2563EB] text-white border-2 border-blue-700 font-bold'
          } else if (isEnd) {
            cls += 'bg-[#1D4ED8] text-white border-2 border-blue-800 font-bold'
          } else if (inRange) {
            cls += 'bg-blue-100 text-blue-700 border border-blue-200'
          } else {
            cls += 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer'
          }

          return (
            <button
              key={slot.time.toISOString()}
              onClick={() => slot.available && onSlotClick(slot.time)}
              disabled={!slot.available}
              className={cls}
              title={!slot.available ? 'Slot already booked' : ''}
            >
              {timeStr}
              {isStart && <div className="mt-0.5 text-[8px] font-bold">START</div>}
              {isEnd && <div className="mt-0.5 text-[8px] font-bold">END</div>}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ── Main Room Detail Page ─────────────────────────────────────── */
export default function RoomDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getRoomById, getRooms } = useRooms()
  const [room, setRoom] = useState<Room | null>(null)
  const [slots, setSlots] = useState<{ time: Date; available: boolean }[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [error, setError] = useState('')

  // Time selection
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [rangeError, setRangeError] = useState('')

  // Similar spaces
  const [similarRooms, setSimilarRooms] = useState<Room[]>([])

  // Validation state for "Book This Space" button
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    async function loadRoom() {
      const { data, error } = await getRoomById(id)
      setRoom(data)
      setError(error?.message || '')
    }
    if (id) loadRoom()
  }, [id])

  // Load similar spaces
  useEffect(() => {
    if (!room) return
    getRooms({ type: [room.type] }).then(({ data }) => {
      const filtered = (data || []).filter((r) => r.id !== room.id).slice(0, 3)
      setSimilarRooms(filtered)
    })
  }, [room])

  // Load time slots when date is selected
  useEffect(() => {
    if (!id || !hasSupabaseConfig() || !selectedDate) return
    let active = true
    async function loadSlots() {
      const nextSlots = await getRoomSlotsForDay(id, selectedDate!)
      if (active) setSlots(nextSlots)
    }
    loadSlots()
    const supabase = createClient()
    const channel = supabase
      .channel(`room-bookings-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `room_id=eq.${id}` }, loadSlots)
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [id, selectedDate])

  const handleSlotClick = (slotTime: Date) => {
    setRangeError('')
    if (clickCount === 0) {
      setSelectedStart(slotTime)
      setSelectedEnd(null)
      setClickCount(1)
    } else if (clickCount === 1) {
      if (slotTime <= selectedStart!) {
        setRangeError('End time must be after start time')
        return
      }
      // Validate no booked slots exist between start and end
      const hasBookedSlotInRange = slots.some(
        (s) => s.time > selectedStart! && s.time < slotTime && !s.available
      )
      if (hasBookedSlotInRange) {
        setRangeError('Cannot book across already-booked time slots. Please select a continuous available range.')
        return
      }
      setSelectedEnd(slotTime)
      setClickCount(2)
    } else {
      setSelectedStart(slotTime)
      setSelectedEnd(null)
      setClickCount(1)
    }
  }

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d)
    setSelectedStart(null)
    setSelectedEnd(null)
    setClickCount(0)
    setRangeError('')
    setShowValidation(false)
  }

  // Booking summary calculations
  const bookingSummary = useMemo(() => {
    if (!selectedStart || !selectedEnd || !room || !selectedDate) return null
    const durationHrs = (selectedEnd.getTime() - selectedStart.getTime()) / 3600000
    const price = room.price_hour * durationHrs
    return {
      date: format(selectedDate, 'EEEE, d MMMM yyyy'),
      start: format(selectedStart, 'HH:mm'),
      end: format(selectedEnd, 'HH:mm'),
      duration: durationHrs,
      price,
    }
  }, [selectedStart, selectedEnd, room, selectedDate])

  const handleBookThisSpace = () => {
    if (!bookingSummary) {
      setShowValidation(true)
      // Scroll to availability section
      document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate(
      `/dashboard/book/${room!.id}?date=${format(selectedDate!, 'yyyy-MM-dd')}&start=${bookingSummary.start}&end=${bookingSummary.end}`
    )
  }

  if (error) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">{error}</div>
  if (!room) return <div className="h-96 animate-pulse rounded-2xl bg-white" />

  const primaryImage = getRoomImage(room)
  const extraImages = room.room_images?.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order).slice(1, 4) || []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Back Button ──────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Spaces
      </button>

      {/* ── Room Info Grid ───────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <img src={primaryImage} alt={room.name} className="h-[420px] w-full rounded-2xl border border-sky-100 object-cover" />
          {extraImages.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {extraImages.map((image) => (
                <img key={image.id} src={image.url} alt={image.alt_text || room.name} className="h-28 w-full rounded-xl border border-sky-100 object-cover" />
              ))}
            </div>
          )}
        </div>
        <aside className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[room.type]}</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter">{room.name}</h1>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest text-[#061B3A]/50">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {room.capacity} guests</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-[#1E90FF] text-[#1E90FF]" /> {room.rating}</span>
          </div>
          <p className="mt-6 text-sm font-medium leading-relaxed text-[#061B3A]/62">{room.description}</p>
          <div className="mt-8 rounded-2xl bg-sky-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/42">Starting from</p>
            <p className="mt-1 text-4xl font-black tracking-tighter">RM{room.price_hour}<span className="text-sm tracking-normal text-[#061B3A]/45">/hr</span></p>
          </div>

          {/* Validation hint */}
          {showValidation && !bookingSummary && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Please select a date and time slot in the Availability section below before booking.
            </div>
          )}

          <Button
            className={`mt-4 h-14 w-full rounded-full text-xs font-black uppercase tracking-widest text-white transition-all ${
              bookingSummary
                ? 'bg-[#1E90FF] hover:bg-[#0B5ED7] shadow-lg shadow-blue-200'
                : 'bg-[#1E90FF]/70 hover:bg-[#1E90FF]'
            }`}
            onClick={handleBookThisSpace}
          >
            {bookingSummary ? `Book · ${bookingSummary.start}–${bookingSummary.end} · RM${bookingSummary.price.toFixed(0)}` : 'Book This Space'}
          </Button>

          {!bookingSummary && (
            <p className="mt-2 text-center text-[10px] text-slate-400">
              ↓ Select a date &amp; time below first
            </p>
          )}
        </aside>
      </div>

      {/* ── Availability Calendar ─────────────────────────────── */}
      <section id="availability-section" className="space-y-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Availability</h2>

        {/* Side-by-side: calendar left, time slots right */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Left: Month Calendar */}
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />

          {/* Right: Time slots (or prompt) */}
          {selectedDate && slots.length > 0 ? (
            <TimeSlotPanel
              slots={slots}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onSlotClick={handleSlotClick}
              selectedDate={selectedDate}
            />
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div>
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">
                  {!selectedDate ? 'Select a date to see available times' : 'Connecting to live slot data…'}
                </p>
              </div>
            </div>
          )}
        </div>

        {rangeError && <p className="text-xs font-bold text-red-500">{rangeError}</p>}

        {/* ── Booking Summary Strip ─────────────────────────── */}
        <AnimatePresence>
          {bookingSummary && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-[#0A1628] p-5 text-white"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-bold">{room.name}</span>
                <span className="text-slate-400">·</span>
                <span>{bookingSummary.date}</span>
                <span className="text-slate-400">·</span>
                <span>{bookingSummary.start} → {bookingSummary.end}</span>
                <span className="text-slate-400">·</span>
                <span>{bookingSummary.duration} hrs</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-blue-400">RM{bookingSummary.price.toFixed(2)}</span>
              </div>
              <Button
                onClick={() =>
                  navigate(`/dashboard/book/${room.id}?date=${format(selectedDate!, 'yyyy-MM-dd')}&start=${bookingSummary.start}&end=${bookingSummary.end}`)
                }
                className="mt-4 h-12 w-full rounded-full bg-[#2563EB] text-xs font-black uppercase tracking-widest text-white hover:bg-[#1D4ED8]"
              >
                Continue to Book →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Similar Spaces ───────────────────────────────────── */}
      {similarRooms.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">You might also like</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {similarRooms.map((sim) => {
              const simImage = getRoomImage(sim)
              return (
                <Link
                  key={sim.id}
                  to={`/dashboard/rooms/${sim.id}`}
                  className="group min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_16px_44px_rgba(30,144,255,0.07)] transition-transform hover:-translate-y-1"
                >
                  <img src={simImage} alt={sim.name} className="aspect-video w-full object-cover" />
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">{ROOM_TYPE_LABELS[sim.type]}</p>
                    <h3 className="mt-1 text-xl font-black uppercase tracking-tight">{sim.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#061B3A]/50"><Users className="mr-1 inline h-3.5 w-3.5" />{sim.capacity}</span>
                      <span className="text-xs font-black text-[#1E90FF]">RM{sim.price_hour}/hr</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
