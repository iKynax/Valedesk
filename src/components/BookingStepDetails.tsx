import { useState } from 'react'
import { Lock, Info, FileText, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/types'

interface Props {
  profile: UserProfile | null
  email: string
  attendees: string[]
  notes: string
  onAttendeesChange: (a: string[]) => void
  onNotesChange: (n: string) => void
  onContinue: () => void
  onBack: () => void
}

export default function BookingStepDetails({
  profile, email, attendees, notes,
  onAttendeesChange, onNotesChange, onContinue, onBack,
}: Props) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [policiesOpen, setPoliciesOpen] = useState(true)

  const addAttendee = (raw: string) => {
    const e = raw.trim().replace(',', '')
    if (!e) return
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    if (attendees.length >= 20) return
    onAttendeesChange(Array.from(new Set([...attendees, e])))
    setInput('')
  }

  return (
    <div className="space-y-6">
      {/* Organiser */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/40">
          <Lock className="h-3.5 w-3.5" /> Booking Organiser
        </div>
        <p className="text-lg font-black uppercase">{profile?.full_name || email}</p>
        <p className="mt-1 text-xs text-[#061B3A]/50">{email}</p>
      </div>

      {/* Attendees */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Invite Attendees</span>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 cursor-help text-[#061B3A]/30" />
            <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-lg group-hover:block">
              Each email added here will receive a copy of the booking confirmation and QR code by email. They'll use this to check in at the front desk.
            </div>
          </div>
        </div>
        <div className={`flex gap-2 ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addAttendee(input) } }}
            placeholder="name@company.com"
            className={`h-10 flex-1 rounded-md border px-3 text-sm outline-none ${shake ? 'border-red-400' : 'border-sky-100 focus:border-[#1E90FF]'}`}
          />
          <Button type="button" variant="outline" onClick={() => addAttendee(input)}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {attendees.map(e => (
            <span key={e} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {e}
              <button onClick={() => onAttendeesChange(attendees.filter(a => a !== e))}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400">📧 Confirmation QR codes will be emailed to all attendees upon booking.</p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Special Requests</span>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 cursor-help text-[#061B3A]/30" />
            <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-lg group-hover:block">
              Let the Valedesk team know about any specific setup, accessibility needs, or other requirements for your session.
            </div>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="e.g. Please set up the room in a U-shape layout, we'll need 2 extension cables..."
          className="min-h-28 w-full rounded-xl border border-sky-100 p-4 text-sm outline-none focus:border-[#1E90FF]"
        />
      </div>

      {/* Booking Policies */}
      <div className="rounded-xl bg-slate-50 border border-slate-200">
        <button onClick={() => setPoliciesOpen(!policiesOpen)}
          className="flex w-full items-center justify-between p-4 text-left">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText className="h-4 w-4" /> Booking Policies
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${policiesOpen ? 'rotate-180' : ''}`} />
        </button>
        {policiesOpen && (
          <div className="space-y-2 px-4 pb-4 text-sm text-slate-600">
            <p>🚫 <strong>Cancellation Policy:</strong> All bookings are non-refundable. Cancellations will not be charged any additional fees but no refund will be issued.</p>
            <p>✅ <strong>Check-in:</strong> Present your QR code or booking reference at the front desk. Check-in opens 10 minutes before your slot.</p>
            <p>🕐 <strong>Late Arrival:</strong> Bookings are held for 15 minutes. After that, the space may be released.</p>
            <p>📵 <strong>House Rules:</strong> Please keep noise to appropriate levels. No food in Focus Pods. Leave the space as you found it.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="h-12 rounded-full px-8 text-xs font-black uppercase tracking-widest">Back</Button>
        <Button onClick={onContinue} className="h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">Continue to Payment</Button>
      </div>
    </div>
  )
}
