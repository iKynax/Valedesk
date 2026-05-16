import { motion, AnimatePresence } from 'motion/react'
import { LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function LogoutModal({ open, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#061B3A]/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-sky-100 bg-white p-8 shadow-[0_32px_80px_rgba(30,144,255,0.18)]"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
                <LogOut className="h-7 w-7 text-rose-500" />
              </div>

              <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-[#061B3A]">
                Sign Out?
              </h2>
              <p className="mb-8 text-sm font-medium text-[#061B3A]/55">
                Are you sure you want to sign out of Valedesk? You'll need to log in again to access your dashboard.
              </p>

              <div className="flex w-full gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-12 flex-1 rounded-full border-sky-200 text-xs font-black uppercase tracking-widest text-[#061B3A] hover:bg-sky-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  className="h-12 flex-1 rounded-full bg-rose-500 text-xs font-black uppercase tracking-widest text-white hover:bg-rose-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
