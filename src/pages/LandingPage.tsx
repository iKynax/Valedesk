import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronRight,
  MessageSquareCode,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import HeroWidget from '@/components/landing/HeroWidget';
import { brandLogos } from '@/components/landing/BrandLogos';
import TestimonialCarousel from '@/components/landing/TestimonialCarousel';

import ValedeskLogo from '@/components/ValedeskLogo';

type SpaceStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Limited';

const SPACE_TYPES: Array<{
  name: string;
  desc: string;
  capacity: string;
  price: string;
  img: string;
  id: string;
  status: SpaceStatus;
}> = [
  { name: 'Executive Suite', desc: 'Private focus suite with smart access and privacy glass.', capacity: '1-2', price: 'RM25/hr', img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', id: '#D-102', status: 'Available' },
  { name: 'Open Bay A', desc: 'Open-plan collaborative seating for flexible work days.', capacity: '1', price: 'RM15/hr', img: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80', id: '#D-105', status: 'Limited' },
  { name: 'Conference Room', desc: 'AV-ready meeting room for project reviews and workshops.', capacity: '12', price: 'RM60/hr', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', id: '#D-108', status: 'Occupied' },
  { name: 'Boardroom', desc: 'Premium room for leadership sessions and client pitches.', capacity: '18', price: 'RM150/hr', img: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80', id: '#D-112', status: 'Available' },
  { name: 'Event Studio', desc: 'Versatile studio for launches, training, and community talks.', capacity: '80', price: 'RM300/hr', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80', id: '#D-201', status: 'Available' },
  { name: 'Private Office', desc: 'Furnished team base with storage, access control, and coffee.', capacity: '2-8', price: 'RM200/day', img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80', id: '#D-305', status: 'Maintenance' },
];

const FEATURES = [
  { title: 'Instant Booking', desc: 'Reserve in seconds with live availability and clean confirmations.', icon: Zap },
  { title: 'Flexible Scheduling', desc: 'Book by the hour, half-day, full day, or recurring rhythm.', icon: Calendar },
  { title: 'Secure Payments', desc: 'Transparent checkout styling ready for the mock Stripe flow.', icon: ShieldCheck },
  { title: 'QR Check-In', desc: 'Every booking can surface a scan-ready check-in state.', icon: QrCode },
  { title: 'Vale AI', desc: 'A blue-glow assistant for questions, policies, and recommendations.', icon: MessageSquareCode },
  { title: 'Smart Analytics', desc: 'Admin surfaces are styled for occupancy and usage insights.', icon: BarChart3 },
];

const statusClasses: Record<SpaceStatus, string> = {
  Available: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Occupied: 'border-rose-200 bg-rose-50 text-rose-700',
  Maintenance: 'border-amber-200 bg-amber-50 text-amber-700',
  Limited: 'border-sky-200 bg-sky-50 text-[#0B5ED7]',
};

const statusDot: Record<SpaceStatus, string> = {
  Available: 'status-dot-available',
  Occupied: 'status-dot-danger',
  Maintenance: 'status-dot-warn',
  Limited: 'status-dot-blue',
};

function StatusPill({ status }: { status: SpaceStatus }) {
  return (
    <span className={`status-pill border ${statusClasses[status]}`}>
      <span className={`status-dot ${statusDot[status]}`} />
      {status}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen scroll-smooth bg-[#F4F8FF] font-sans text-[#061B3A]">
      <Navbar />

      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#061B3A] pt-32 text-white">
        <div className="absolute inset-0 valedesk-grid opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,144,255,0.18),transparent_36rem)]" />
        <div className="hero-fade absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#F4F8FF] to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-20 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-100 backdrop-blur"
            >
              <span className="status-dot status-dot-blue" />
              Premium Coworking in KL
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl lg:text-[60px] xl:text-[70px]"
            >
              Book the space
              <br />
              <span className="text-sky-200/45">your work</span>
              <br />
              deserves.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10 max-w-xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl"
            >
              Hot desks, private offices, and premium meeting rooms in one fast booking flow. Designed for teams who move between remote freedom and polished physical spaces.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/auth">
                <Button className="h-14 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white shadow-[0_16px_40px_rgba(30,144,255,0.35)] hover:bg-[#0B5ED7]">
                  Book a Space <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#spaces">
                <Button variant="outline" className="h-14 rounded-full border-sky-300/35 bg-white/5 px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-[#061B3A]">
                  Take a Tour
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-14 flex flex-wrap items-center gap-6 border-t border-white/10 pt-5"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3].map((img) => (
                  <img key={img} src={`https://i.pravatar.cc/100?img=${img}`} alt="Valedesk member" className="h-9 w-9 rounded-full border-2 border-[#061B3A] object-cover" />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Trusted by 200+ companies</p>
              <div className="flex items-center gap-1 text-sky-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Sparkles key={star} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative mt-8 lg:col-span-6 lg:mt-0">
            {/* Decorative angled images */}
            <motion.div
              initial={{ opacity: 0, rotate: -4, y: 30 }}
              animate={{ opacity: 1, rotate: -4, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ rotate: -2, scale: 1.04 }}
              className="absolute -left-16 -top-16 z-[1] hidden h-64 w-96 cursor-pointer overflow-hidden rounded-2xl glass-image-frame lg:block"
            >
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" alt="Meeting room" className="h-full w-full object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, rotate: 5, y: 40 }}
              animate={{ opacity: 1, rotate: 5, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              whileHover={{ rotate: 3, scale: 1.04 }}
              className="absolute -right-14 -top-20 z-[1] hidden h-56 w-80 cursor-pointer overflow-hidden rounded-2xl glass-image-frame lg:block"
            >
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Happy team" className="h-full w-full object-cover" />
            </motion.div>

            <div className="relative z-[2]">
              <HeroWidget />
            </div>
          </div>
        </div>
      </section>

      <section className="trust-network-bar overflow-hidden border-y border-sky-100 bg-white py-5">
        <div className="flex items-center gap-6 px-6">
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-[#1E90FF]">Trust Network</p>
          <div className="flex flex-1 overflow-hidden">
            <div className="marquee-track" style={{ animationDuration: '50s' }}>
              <div className="flex items-center gap-12 pr-12">
                {[...brandLogos, ...brandLogos].map((brand, i) => (
                  <div key={`${brand.name}-${i}`} className="flex shrink-0 items-center gap-2 opacity-70 transition-opacity hover:opacity-100">
                    {brand.svg}
                    <span className="trust-logo-text text-sm font-bold tracking-tight">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="spaces" className="valedesk-light-grid border-b border-sky-100 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <h2 className="text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
              Every kind of space.
              <br />
              All in one place.
            </h2>
            <div className="flex gap-2">
              <span className="rounded-full border border-sky-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Filter: All</span>
              <span className="rounded-full border border-sky-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Sort: Status</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SPACE_TYPES.map((space, i) => (
              <motion.div
                key={space.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.07 }}
                className={`group overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(30,144,255,0.08)] transition-all hover:-translate-y-1 hover:border-[#1E90FF]/50 hover:shadow-[0_24px_70px_rgba(30,144,255,0.16)] ${space.status === 'Maintenance' ? 'opacity-75' : ''}`}
              >
                <div className="mb-5 flex items-start justify-between gap-3 overflow-hidden">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#1E90FF]/60">{space.id}</p>
                    <h3 className="mt-1 truncate text-2xl font-black uppercase tracking-tight text-[#061B3A]">{space.name}</h3>
                  </div>
                  <div className="shrink-0"><StatusPill status={space.status} /></div>
                </div>

                <div className="mb-5 aspect-video w-full overflow-hidden rounded-xl bg-sky-50">
                  <img src={space.img} alt={space.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>

                <p className="mb-6 min-h-10 text-sm font-medium leading-snug text-[#061B3A]/62">{space.desc}</p>

                <div className="flex gap-4">
                  <div className="flex-1 border-t border-sky-100 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/35">Capacity</p>
                    <p className="font-black text-[#061B3A]">{space.capacity}</p>
                  </div>
                  <div className="flex-1 border-t border-sky-100 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/35">Price</p>
                    <p className="font-black text-[#1E90FF]">{space.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#061B3A] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-4 text-xs font-black uppercase tracking-widest text-[#1E90FF]">Why Valedesk</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
            Built for the way<br />you work.
          </motion.h2>

          {/* Stats row */}
          <div className="mb-12 grid gap-5 lg:grid-cols-3">
            {[
              { label: 'Booking Speed', sublabel: 'Average Time', stat: '< 30s', desc: 'Book Any Space, Instantly', body: 'Reserve desks, pods, and rooms in seconds with real-time availability and instant confirmations.' },
              { label: 'Spaces Available', sublabel: 'Across Bangsar South', stat: '50+', desc: 'Every Space You Need', body: 'Hot desks from RM15/hr, meeting rooms, boardrooms, event studios, and private offices — all in one place.' },
              { label: 'Uptime', sublabel: 'Platform Reliability', stat: '99.9%', desc: 'Always-On Platform', body: 'Secure Stripe payments, real-time slot management, and email confirmations you can count on.' },
            ].map((card, i) => (
              <motion.div key={card.stat} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition-all hover:border-[#1E90FF]/40 hover:bg-white/[0.07]">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/60">{card.label}</p>
                <p className="mb-4 text-[9px] font-bold text-white/30">{card.sublabel}</p>
                <div className="mb-5 flex items-end gap-3">
                  <span className="bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] bg-clip-text text-5xl font-black tracking-tighter text-transparent">{card.stat}</span>
                </div>
                <h3 className="mb-2 text-lg font-black uppercase tracking-tight">{card.desc}</h3>
                <p className="text-sm font-medium leading-relaxed text-white/50">{card.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Feature highlights row */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Zap, title: 'Instant Booking', desc: 'Live availability, one-click reservations with clean confirmations.' },
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'Transparent Stripe checkout with real-time payment processing.' },
              { icon: MessageSquareCode, title: 'Vale AI Assistant', desc: 'Built-in chatbot for questions, recommendations, and support.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide">{f.title}</p>
                    <p className="mt-1 text-xs font-medium text-white/45">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works — Horizontal Timeline ─────────────────── */}
      <section className="relative border-b border-sky-100 bg-[#061B3A] py-24 text-white overflow-hidden">
        <div className="absolute inset-0 valedesk-grid opacity-40" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-4 text-xs font-black uppercase tracking-widest text-[#1E90FF]">Simple Process</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">How It Works.</motion.h2>

          {/* Horizontal timeline */}
          <div className="relative">
            {/* Animated glow bar (hidden on mobile) */}
            <div className="absolute left-0 right-0 top-6 hidden h-0.5 md:block">
              <div className="timeline-bar-animated h-full w-full rounded-full" />
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: '01', title: 'Browse Spaces', desc: 'Filter by type, capacity, date, and amenities. See real-time availability and pricing for every room.', note: 'Pricing from RM15/hr' },
                { step: '02', title: 'Book Instantly', desc: 'Select your time slot and confirm in one click. Secure payment via Stripe with instant email confirmation.', note: 'Under 30 seconds' },
                { step: '03', title: 'Check In & Work', desc: 'Show your booking QR code or ID at the front desk. Enjoy hi-speed WiFi, coffee, and a premium workspace.', note: 'Zero friction' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative pt-14 md:pt-16"
                >
                  {/* Glowing dot */}
                  <div className="absolute left-0 top-0 md:left-1/2 md:-translate-x-1/2">
                    <div className="timeline-dot-glow flex h-12 w-12 items-center justify-center rounded-full bg-[#1E90FF] text-sm font-black text-white">
                      {item.step}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="liquid-glass-card rounded-2xl p-6">
                    <h3 className="mb-2 text-xl font-black uppercase tracking-tight">{item.title}</h3>
                    <p className="mb-4 text-sm font-medium leading-relaxed text-white/55">{item.desc}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> {item.note}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials (replaces pricing) ───────────────────────── */}
      <TestimonialCarousel />

      <section className="cta-elevate bg-gradient-to-r from-[#0B5ED7] to-[#1E90FF] px-6 py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="mb-3 text-4xl font-black uppercase tracking-tighter md:text-6xl">Ready to elevate your workspace?</h2>
            <p className="text-base font-medium text-white/75">Join 2,000+ professionals already booking with Valedesk.</p>
          </div>
          <Link to="/auth">
            <Button className="h-14 rounded-full bg-white px-8 text-xs font-black uppercase tracking-widest text-[#0B5ED7] shadow-[0_12px_32px_rgba(0,0,0,0.15)] hover:bg-sky-50 hover:scale-105 transition-transform">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-[#061B3A] px-6 py-10 text-white lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2">
              <ValedeskLogo variant="dark" className="h-12" />
            </div>
            <p className="text-sm font-medium text-white/48">Your space. Your schedule. Your flow.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-white/45">
            <a href="#spaces" className="hover:text-white">Browse Spaces</a>
            <a href="#reviews" className="hover:text-white">Reviews</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <Link to="/admin/access" className="text-slate-600 hover:text-slate-400 hover:underline">Admin Portal</Link>
            <span>Copyright {new Date().getFullYear()} Valedesk Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
