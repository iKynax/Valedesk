import { Star } from 'lucide-react';

const REVIEWS = [
  { name: 'Sarah Chen', role: 'Product Manager', company: 'Grab', avatar: 'https://i.pravatar.cc/100?img=5', text: 'Valedesk made it effortless to find and book premium meeting rooms for our sprint reviews. The instant confirmation saved us hours of back-and-forth.', stars: 5 },
  { name: 'Ahmad Razak', role: 'Startup Founder', company: 'TechNode', avatar: 'https://i.pravatar.cc/100?img=11', text: 'The focus pods are a game-changer. Soundproofed, well-lit, and the booking flow is buttery smooth. Best coworking experience in KL.', stars: 5 },
  { name: 'Jessica Lim', role: 'Marketing Director', company: 'Shopee', avatar: 'https://i.pravatar.cc/100?img=9', text: 'We host monthly town halls at The Atrium. The AV setup, catering options, and spacious layout make it our go-to event space.', stars: 5 },
  { name: 'Daniel Tan', role: 'Freelance Designer', company: 'Independent', avatar: 'https://i.pravatar.cc/100?img=12', text: "As a freelancer, the hot desk flexibility is perfect. RM15/hr with great coffee and fast WiFi — can't beat that value.", stars: 4 },
  { name: 'Priya Nair', role: 'Engineering Lead', company: 'Petronas Digital', avatar: 'https://i.pravatar.cc/100?img=25', text: 'Our team books the boardroom weekly for architecture reviews. The video conferencing setup is enterprise-grade. Highly recommend.', stars: 5 },
  { name: 'Marcus Wong', role: 'VP of Sales', company: 'CIMB Bank', avatar: 'https://i.pravatar.cc/100?img=15', text: 'Client pitches at Valedesk always leave a great impression. The premium finishes and professional environment speak volumes.', stars: 5 },
  { name: 'Aisha Rahman', role: 'HR Manager', company: 'AirAsia', avatar: 'https://i.pravatar.cc/100?img=32', text: 'We use Valedesk for offsite team-building days. The variety of spaces and seamless booking process make planning a breeze.', stars: 5 },
  { name: 'Kevin Lee', role: 'Data Scientist', company: 'Axiata', avatar: 'https://i.pravatar.cc/100?img=53', text: 'The private offices are perfect for heads-down deep work. Smart access, storage, and the coffee bar downstairs is a nice perk.', stars: 4 },
];

export default function TestimonialCarousel() {
  return (
    <section id="reviews" className="overflow-hidden bg-[#F4F8FF] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <h2 className="mb-3 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">What People Say.</h2>
        <p className="mb-12 text-xs font-black uppercase tracking-widest text-[#1E90FF]">Real feedback from our community</p>
      </div>

      <div className="relative">
        <div className="marquee-track hover:[animation-play-state:paused]" style={{ animationDuration: '60s' }}>
          <div className="flex gap-5 px-6">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="review-glass-card w-[340px] shrink-0 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(30,144,255,0.18)]"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s < r.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="mb-6 text-sm font-medium leading-relaxed text-[#061B3A]/70">"{r.text}"</p>
                <div className="flex items-center gap-3 border-t border-white/15 pt-4">
                  <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full border-2 border-white/30 object-cover shadow-lg" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#061B3A]">{r.name}</p>
                    <p className="text-[10px] font-bold text-[#061B3A]/45">{r.role} · {r.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
