import { Check } from 'lucide-react'
import { motion } from 'motion/react'

const STEPS = ['Review', 'Details', 'Payment', 'Confirm']

export default function BookingProgressBar({ current }: { current: number }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 pb-4 pt-4 backdrop-blur">
      <div className="relative flex items-center">
        {/* Full-width background track */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200" />

        {/* Filled progress track */}
        <motion.div
          className="absolute left-4 top-4 h-0.5 bg-blue-600 origin-left"
          initial={false}
          animate={{ width: `calc(${((current - 1) / (STEPS.length - 1)) * 100}% - 2rem + ${current === STEPS.length ? '2rem' : '1rem'})` }}
          transition={{ duration: 0.4 }}
        />

        {/* Step nodes — evenly spaced */}
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const completed = current > stepNum
          const active = current === stepNum
          return (
            <div
              key={label}
              className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  completed
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-300 ring-4 ring-blue-100'
                    : 'border-2 border-slate-300 bg-white text-slate-400'
                }`}
              >
                {completed ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  active ? 'text-blue-600' : completed ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
