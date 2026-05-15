import { Check } from 'lucide-react'
import { motion } from 'motion/react'

const STEPS = ['Review', 'Details', 'Payment', 'Confirm']

export default function BookingProgressBar({ current }: { current: number }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const completed = current > stepNum
          const active = current === stepNum
          return (
            <div key={label} className="flex flex-1 items-center">
              {i > 0 && (
                <div className="relative mx-1 h-0.5 flex-1 bg-slate-200 sm:mx-2">
                  {current > i && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-y-0 left-0 bg-blue-600"
                    />
                  )}
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  completed ? 'bg-blue-600 text-white' :
                  active ? 'bg-blue-600 text-white shadow-md shadow-blue-300' :
                  'border-2 border-slate-300 text-slate-400'
                }`}>
                  {completed ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
