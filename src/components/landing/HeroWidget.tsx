import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CalendarCheck2, CheckCircle2, Clock, MapPin, Sparkles, Users } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = Array.from({ length: 21 });

export default function HeroWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 10, rotateX: -5, y: 24 }}
      animate={{ opacity: 1, rotateY: -5, rotateX: 2, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[480px] mx-auto select-none"
      style={{ perspective: '1000px' }}
    >
      <div className="relative z-10 overflow-hidden rounded-[28px] border border-sky-300/35 bg-white/12 p-5 shadow-[0_28px_90px_rgba(30,144,255,0.26)] backdrop-blur-2xl transition-transform hover:-translate-y-1">
        <div className="absolute inset-0 valedesk-grid opacity-25" />
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#1E90FF]/35 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative rounded-[22px] border border-white/15 bg-[#061B3A]/88 p-5 text-white">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-200/80">
                <CalendarCheck2 className="h-3.5 w-3.5 text-[#38BDF8]" />
                Live booking grid
              </div>
              <h3 className="text-3xl font-black uppercase leading-none tracking-tighter">
                Executive<br />Suite A
              </h3>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55">
                <MapPin className="h-3.5 w-3.5 text-[#1E90FF]" />
                Level 3, Bangsar KL
              </div>
            </div>

            <span className="status-pill border border-emerald-300/30 bg-emerald-400/12 text-emerald-200">
              <span className="status-dot status-dot-available" />
              Available
            </span>
          </div>

          <div className="mb-3 grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-widest text-white/42">
            {DAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="relative mb-6 grid grid-cols-7 gap-1.5">
            {SLOTS.map((_, i) => {
              const booked = [2, 8, 9, 15, 19].includes(i);
              const selected = i === 11;

              if (selected) {
                return (
                  <div key={i} className="relative aspect-square rounded-lg border border-sky-300/20 bg-white/8">
                    <motion.div
                      initial={{ opacity: 0, y: -14, scale: 0.92 }}
                      animate={{ opacity: [0, 1, 1, 0.9], y: 0, scale: 1 }}
                      transition={{ repeat: Infinity, duration: 3.8, repeatDelay: 0.7, ease: 'easeOut' }}
                      className="absolute inset-0 z-10 rounded-lg border border-[#38BDF8] bg-[#1E90FF] shadow-[0_0_28px_rgba(30,144,255,0.62)]"
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                        <span className="text-[8px] font-black uppercase tracking-tight text-white">10 AM</span>
                      </div>
                    </motion.div>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border ${
                    booked
                      ? 'border-rose-300/20 bg-rose-400/12 text-rose-200'
                      : 'border-sky-300/12 bg-white/[0.055] text-sky-100/30'
                  } flex items-center justify-center`}
                >
                  {booked ? <span className="text-[10px] font-black">X</span> : <span className="h-1.5 w-1.5 rounded-full bg-sky-200/24" />}
                </div>
              );
            })}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-sky-300/10 to-transparent" style={{ animation: 'valedesk-scan 4.5s ease-in-out infinite' }} />
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            {[
              ['Capacity', '8 pax'],
              ['Rate', 'RM80/hr'],
              ['Next slot', '10:00'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/35">{label}</p>
                <p className="mt-1 text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <Button className="h-12 w-full rounded-full bg-[#1E90FF] text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_0_34px_rgba(30,144,255,0.45)] hover:bg-[#0B5ED7]">
            Confirm Booking
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute -right-3 -top-7 z-20 flex items-center gap-3 rounded-2xl border border-sky-200/70 bg-white/95 p-3 shadow-[0_16px_38px_rgba(30,144,255,0.20)] backdrop-blur"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#1E90FF]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]">Meeting Room 3B</p>
          <p className="text-[10px] font-bold text-[#1E90FF]">Just booked</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -22, y: 12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute -left-4 bottom-24 z-20 flex items-center rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-[0_16px_38px_rgba(30,144,255,0.18)]"
      >
        <Clock className="mr-2 h-4 w-4 text-[#1E90FF]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]">2 hrs / RM 80</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute -bottom-5 right-2 z-20 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_16px_38px_rgba(16,185,129,0.16)]"
      >
        <Users className="h-4 w-4 text-emerald-500" />
        <span className="status-dot status-dot-available" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Confirmed</span>
      </motion.div>
    </motion.div>
  );
}
