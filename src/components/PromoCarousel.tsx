import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface PromoSlide {
  id: string
  title: string
  subtitle: string
  cta: string
  link: string
  gradient: string
  accent: string
  badge?: string
  illustration: string
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'boardroom-deal',
    title: 'BOARDROOM\nSPECIAL',
    subtitle: 'Book any boardroom this week and get 20% off your first session. Premium AV included.',
    cta: 'Book a Boardroom',
    link: '/dashboard/rooms',
    gradient: 'from-[#0B5ED7] via-[#1E90FF] to-[#38BDF8]',
    accent: '#38BDF8',
    badge: '20% OFF',
    illustration: '🏢',
  },
  {
    id: 'focus-pod',
    title: 'FOCUS POD\nLAUNCH',
    subtitle: 'Our new soundproofed focus pods are live. Perfect for deep work, calls, and solo sessions.',
    cta: 'Try a Focus Pod',
    link: '/dashboard/rooms',
    gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]',
    accent: '#A78BFA',
    badge: 'NEW',
    illustration: '🎧',
  },
  {
    id: 'event-space',
    title: 'HOST YOUR\nNEXT EVENT',
    subtitle: 'The Atrium is now open for bookings — 80-pax capacity with PA, lighting, and catering options.',
    cta: 'View Event Spaces',
    link: '/dashboard/rooms',
    gradient: 'from-[#059669] via-[#10B981] to-[#34D399]',
    accent: '#34D399',
    badge: 'AVAILABLE',
    illustration: '🎤',
  },
  {
    id: 'hot-desk-pass',
    title: 'DAY PASS\nDEAL',
    subtitle: 'Full-day hot desk access for just RM35. Includes WiFi, coffee, and community perks.',
    cta: 'Get Day Pass',
    link: '/dashboard/rooms',
    gradient: 'from-[#EA580C] via-[#F97316] to-[#FB923C]',
    accent: '#FB923C',
    badge: 'RM35/DAY',
    illustration: '☕',
  },
]

export default function PromoCarousel() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }, [current])

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((c) => (c + 1) % PROMO_SLIDES.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((c) => (c - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)
  }, [])

  // Auto-advance every 5s
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next, isPaused])

  const slide = PROMO_SLIDES[current]

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -400 : 400, opacity: 0 }),
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={() => navigate(slide.link)}
          className={`relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r ${slide.gradient} p-8 md:p-10`}
        >
          {/* Decorative elements */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute right-8 top-8 text-7xl opacity-20 md:text-8xl">{slide.illustration}</div>

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              {slide.badge && (
                <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                  {slide.badge}
                </span>
              )}
              <h3 className="whitespace-pre-line text-3xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-4xl">
                {slide.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-white/80">
                {slide.subtitle}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate(slide.link) }}
              className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-xs font-black uppercase tracking-widest text-[#061B3A] shadow-lg transition-transform hover:scale-105"
            >
              {slide.cta} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); prev() }}
        className="promo-nav-arrow absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); next() }}
        className="promo-nav-arrow absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); goTo(i) }}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!isPaused && (
        <motion.div
          key={`progress-${current}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5, ease: 'linear' }}
          className="absolute bottom-0 left-0 z-20 h-0.5 w-full origin-left bg-white/50"
        />
      )}
    </div>
  )
}
