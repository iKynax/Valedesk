import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 flex h-[520px] w-[min(380px,calc(100vw-48px))] flex-col overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-[0_24px_70px_rgba(30,144,255,0.22)]"
          >
            <div className="flex items-center justify-between border-b border-sky-100 bg-[#061B3A] p-4 text-white">
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-blue" />
                <h3 className="text-xs font-black uppercase tracking-widest">Vale AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full border border-white/10 p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close Vale AI">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F4F8FF] p-6 valedesk-light-grid">
              <div className="flex flex-col gap-4">
                <div className="w-[85%] rounded-2xl rounded-tl-sm bg-[#061B3A] p-4 text-xs font-medium leading-relaxed text-white shadow-[0_14px_34px_rgba(6,27,58,0.14)]">
                  Hi! I'm Vale. I can help you find the perfect space, answer questions about Valedesk, or guide you through booking.
                </div>
                <div className="ml-auto w-fit rounded-full border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  <span className="mr-2 inline-block align-middle status-dot status-dot-available" />
                  Online
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-sky-100 bg-white p-4">
              <input
                type="text"
                placeholder="Ask Vale something..."
                className="flex-1 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-bold text-[#061B3A] placeholder:text-[#061B3A]/35 focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
              />
              <Button size="icon" className="rounded-full bg-[#1E90FF] text-white hover:bg-[#0B5ED7]" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1E90FF] text-white shadow-[0_16px_40px_rgba(30,144,255,0.34)] transition-all hover:-translate-y-1 hover:bg-[#0B5ED7]"
        aria-label={isOpen ? 'Close Vale AI' : 'Open Vale AI'}
      >
        <span className="absolute inset-0 rounded-full border border-sky-300/60" style={{ animation: 'valedesk-pulse-blue 1.8s ease-out infinite' }} />
        {isOpen ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </button>
    </div>
  );
}
