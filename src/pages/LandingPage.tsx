import { motion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronRight,
  MessageSquareCode,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/landing/Navbar';
import HeroWidget from '@/components/landing/HeroWidget';

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
  { name: 'Executive Suite', desc: 'Private focus suite with smart access and privacy glass.', capacity: '1-2', price: 'RM25/hr', img: 'https://images.unsplash.com/photo-1620306169992-d352bc13d50f?w=800&q=80', id: '#D-102', status: 'Available' },
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
    <div className="min-h-screen scroll-smooth bg-[#F4F8FF] font-sans text-[#061B3A]">
      <Navbar />

      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#061B3A] pt-32 text-white">
        <div className="absolute inset-0 valedesk-grid opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,144,255,0.18),transparent_36rem)]" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#F4F8FF] to-transparent" />

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
            <HeroWidget />
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-sky-100 bg-white py-7">
        <div className="flex items-center gap-6 px-6">
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-[#1E90FF]">Trust Network</p>
          <div className="flex flex-1 overflow-hidden whitespace-nowrap">
            <motion.div animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }} className="flex flex-nowrap items-center gap-16">
              {['Grab', 'Shopee', 'CIMB Bank', 'Maxis', 'Petronas', 'AirAsia', 'Maybank', 'Lazada', 'Axiata', 'TM', 'Grab', 'Shopee'].map((company, i) => (
                <span key={`${company}-${i}`} className="px-4 text-2xl font-black uppercase tracking-tighter text-[#061B3A]/18">{company}</span>
              ))}
            </motion.div>
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
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-[#1E90FF]/60">{space.id}</p>
                    <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-[#061B3A]">{space.name}</h3>
                  </div>
                  <StatusPill status={space.status} />
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
          <h2 className="mb-16 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
            Platform
            <br />
            Features
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.055] p-7 transition-all hover:border-[#1E90FF]/60 hover:bg-white/[0.075]"
                >
                  <div className="mb-8 h-1 w-12 rounded-full bg-[#1E90FF] shadow-[0_0_20px_rgba(30,144,255,0.62)] transition-all group-hover:w-20" />
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E90FF]/14 text-[#38BDF8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/58">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-sky-100 bg-[#F4F8FF] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-3">
            {['Browse by space, date, capacity, and amenities', 'Choose the slot and confirm instantly', 'Check in with QR or booking ID'].map((step, i) => (
              <div key={step} className="rounded-2xl border border-sky-100 bg-white p-8 shadow-[0_18px_55px_rgba(30,144,255,0.08)]">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#1E90FF] text-lg font-black text-white shadow-[0_12px_28px_rgba(30,144,255,0.28)]">{i + 1}</div>
                <h3 className="mb-3 text-2xl font-black uppercase tracking-tight">{['Browse', 'Book', 'Check In'][i]}</h3>
                <p className="text-sm font-medium text-[#061B3A]/60">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <h2 className="text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Simple Pricing.</h2>
            <p className="text-xs font-black uppercase tracking-widest text-[#1E90FF]">Transparent Billing</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Day Pass', '50', 'RM / Day', ['Hot desk seating', 'Hi-speed WiFi', 'Artisan coffee']],
              ['Flex Plan', '299', 'RM / Mo', ['20 hrs any space', 'Priority booking', 'Rolling credit']],
              ['Team Plan', '999', 'RM / Mo', ['80 hrs for team', 'Admin panel', 'Deep analytics']],
            ].map(([name, price, unit, features], i) => {
              const popular = i === 1;
              return (
                <div key={name as string} className={`relative rounded-2xl border p-8 ${popular ? 'border-[#1E90FF] bg-[#061B3A] text-white shadow-[0_24px_70px_rgba(30,144,255,0.22)]' : 'border-sky-100 bg-[#F4F8FF] text-[#061B3A]'}`}>
                  {popular && <span className="absolute right-5 top-5 rounded-full bg-[#1E90FF] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Popular</span>}
                  <p className={`mb-2 text-[10px] font-black uppercase tracking-widest ${popular ? 'text-sky-200/70' : 'text-[#1E90FF]'}`}>Tier 0{i + 1}</p>
                  <h3 className="mb-4 text-3xl font-black uppercase">{name}</h3>
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-6xl font-black tracking-tighter">{price}</span>
                    <span className={`text-xs font-black uppercase tracking-widest ${popular ? 'text-white/45' : 'text-[#061B3A]/45'}`}>{unit}</span>
                  </div>
                  <ul className={`mb-12 space-y-4 border-t pt-8 text-xs font-bold ${popular ? 'border-white/15 text-white/82' : 'border-sky-100 text-[#061B3A]/75'}`}>
                    {(features as string[]).map((feature) => (
                      <li key={feature} className="flex gap-3"><BadgeCheck className="h-4 w-4 shrink-0 text-[#1E90FF]" /> {feature}</li>
                    ))}
                  </ul>
                  <Button variant={popular ? 'default' : 'outline'} className={`h-12 w-full rounded-full text-xs font-black uppercase tracking-widest ${popular ? 'bg-white text-[#061B3A] hover:bg-sky-50' : 'border-sky-200 text-[#061B3A] hover:bg-sky-50'}`}>
                    {popular ? 'Subscribe' : i === 0 ? 'Purchase' : 'Contact Sales'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#0B5ED7] to-[#1E90FF] px-6 py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="mb-3 text-4xl font-black uppercase tracking-tighter md:text-6xl">Ready to elevate your workspace?</h2>
            <p className="text-base font-medium text-white/75">Join 2,000+ professionals already booking with Valedesk.</p>
          </div>
          <Link to="/auth">
            <Button className="h-14 rounded-full bg-white px-8 text-xs font-black uppercase tracking-widest text-[#0B5ED7] hover:bg-sky-50">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-[#061B3A] px-6 py-10 text-white lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1E90FF]"><span className="h-2 w-2 bg-white" /></span>
              Valedesk
            </div>
            <p className="text-sm font-medium text-white/48">Your space. Your schedule. Your flow.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-white/45">
            <a href="#spaces" className="hover:text-white">Browse Spaces</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <span>Copyright {new Date().getFullYear()} Valedesk Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
