import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

/* ── Types ──────────────────────────────────────────────────── */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/* ── System prompt ──────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are Vale AI, the friendly assistant for Valedesk — a premium coworking platform based in Kuala Lumpur, Malaysia.

About Valedesk:
- We offer hot desks, focus pods, meeting rooms, boardrooms, event spaces, and private offices
- Pricing is per-hour, ranging from RM15/hr (hot desks) to RM350/hr (event spaces)
- All spaces include hi-speed WiFi, coffee, and power outlets
- Premium rooms include AV equipment, whiteboards, video conferencing, and catering options
- We are located at Level 3 & 4, Bangsar South, Kuala Lumpur
- Operating hours: Monday to Sunday, 7:00 AM — 10:00 PM
- Bookings can be made via the platform with instant confirmation
- Payments are processed securely via Stripe
- Users receive email confirmations and can manage bookings from their dashboard

Your role:
- Answer questions about Valedesk spaces, pricing, amenities, and booking
- Help users navigate the platform (e.g. "How do I book?", "Where are my bookings?")
- Be warm, professional, and concise
- If asked about something unrelated to Valedesk or workspace/coworking topics, politely redirect: "I'm here to help with Valedesk and coworking questions! For other topics, I'd suggest checking a general search engine."
- Never share technical details, API keys, or internal system information
- Keep responses brief (2-4 sentences max) unless the user asks for detail
- Use a friendly but professional tone appropriate for business users`;

/* ── Preloaded Q&A for instant answers ──────────────────────── */

const QUICK_ANSWERS: Record<string, string> = {
  'what is valedesk': 'Valedesk is a premium coworking platform in Kuala Lumpur. We offer hot desks, meeting rooms, boardrooms, focus pods, event spaces, and private offices — all bookable by the hour with instant confirmation.',
  'how do i book': 'Easy! Head to **Browse Spaces** from the sidebar, pick a room, choose your date and time slots, then hit "Book This Space". You\'ll get instant confirmation via email.',
  'what are your prices': 'Our pricing starts at **RM15/hr** for hot desks and goes up to **RM350/hr** for event spaces. Meeting rooms are around RM60-80/hr, and boardrooms are RM120-180/hr. All prices include WiFi, coffee, and standard amenities.',
  'where are you located': 'We\'re at **Level 3 & 4, Bangsar South, Kuala Lumpur** — easily accessible by public transport (LRT Universiti station) and with ample parking nearby.',
  'what are your operating hours': 'We\'re open **Monday to Sunday, 7:00 AM to 10:00 PM**. You can book any available slot within these hours.',
  'do you have wifi': 'Yes! All our spaces come with complimentary **hi-speed WiFi** (1Gbps fiber). We also have backup connectivity to ensure you\'re never offline.',
  'can i cancel my booking': 'You can manage your bookings from the **My Bookings** tab in your dashboard. Cancellation policies may vary — we recommend cancelling at least 2 hours before your booking time.',
  'what amenities do you offer': 'All spaces include WiFi, coffee, power outlets, and air conditioning. Premium rooms add AV equipment, whiteboards, TV screens, video conferencing, and catering service options.',
  'do you have meeting rooms': 'Yes! We have several meeting rooms accommodating 4-15 people, all equipped with AV, whiteboards, and video conferencing. Browse them in the **Meeting Room** category.',
  'how do i contact support': 'You can reach us through this chat! For urgent matters, email us at hello@valedesk.com or call our front desk during operating hours.',
};

const SUGGESTED_QUESTIONS = [
  'What is Valedesk?',
  'How do I book a room?',
  'What are your prices?',
  'What amenities do you offer?',
];

/* ── Helper: try local Q&A first ────────────────────────────── */

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','do','does','did','have','has','had',
  'i','me','my','you','your','we','our','they','their','it','its','of','in',
  'on','at','to','for','with','and','or','but','not','so','if','can','will',
  'be','been','being','what','where','when','how','who','which','that','this',
]);

function tryLocalAnswer(input: string): string | null {
  const normalized = input.toLowerCase().replace(/[?!.,'"]/g, '').trim();

  // 1. Exact substring match (user's input contains the key, or key contains input)
  for (const [key, answer] of Object.entries(QUICK_ANSWERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return answer;
    }
  }

  // 2. Keyword match — only count meaningful (non-stop) words, require high overlap
  const meaningfulWords = normalized.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 2);
  if (meaningfulWords.length === 0) return null;

  for (const [key, answer] of Object.entries(QUICK_ANSWERS)) {
    const keyMeaningful = key.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 2);
    if (keyMeaningful.length === 0) continue;
    const matchCount = meaningfulWords.filter(w =>
      keyMeaningful.some(kw => kw === w || (kw.length > 4 && (kw.includes(w) || w.includes(kw))))
    ).length;
    // Require matching majority of the key's meaningful words
    if (matchCount >= Math.max(2, Math.ceil(keyMeaningful.length * 0.6))) {
      return answer;
    }
  }

  return null;
}

/* ── Smart keyword fallback (when API is unavailable) ───────── */

const KEYWORD_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  { keywords: ['refund', 'money back', 'reimburse'], response: 'For refund inquiries, please contact our support team at **hello@valedesk.com**. Refund eligibility depends on cancellation timing — we generally process refunds for cancellations made at least **24 hours** before your booking.' },
  { keywords: ['cheap', 'cheapest', 'affordable', 'budget', 'lowest price'], response: 'Our most affordable option is the **Hot Desk** at just **RM15/hr**! It includes WiFi, coffee, and power outlets. Perfect for freelancers and remote workers looking for a productive space on a budget.' },
  { keywords: ['expensive', 'premium', 'luxury', 'best room', 'vip'], response: 'Our most premium space is the **Event Space** at **RM350/hr**, perfect for large gatherings. For executive meetings, our **Boardrooms** at **RM120-180/hr** offer top-tier AV equipment and catering options.' },
  { keywords: ['event', 'party', 'gathering', 'celebration', 'conference'], response: 'Our **Event Spaces** accommodate large gatherings at **RM350/hr**. They come fully equipped with AV systems, flexible seating arrangements, and optional catering services. Book through **Browse Spaces** on your dashboard!' },
  { keywords: ['park', 'parking', 'car', 'drive'], response: 'Yes, there is **ample parking** available at our Bangsar South location. The building offers both covered and open parking at standard mall rates. We\'re also accessible via **LRT Universiti station**.' },
  { keywords: ['pet', 'dog', 'cat', 'animal'], response: 'Unfortunately, pets are **not allowed** in our coworking spaces for the comfort and safety of all members. Service animals with proper documentation are the exception.' },
  { keywords: ['food', 'eat', 'lunch', 'restaurant', 'cafe', 'catering'], response: 'We provide complimentary **coffee and tea** in all spaces. Premium rooms include **catering service options** for meetings. Our Bangsar South location also has many restaurants and cafes nearby!' },
  { keywords: ['payment', 'pay', 'stripe', 'credit card', 'debit'], response: 'Payments are processed securely via **Stripe**. We accept all major credit/debit cards. Payment is confirmed instantly at the time of booking.' },
  { keywords: ['register', 'sign up', 'create account', 'join'], response: 'Click **Get Started** on our homepage to create your free account. You can sign up with your email or social accounts. Once registered, you can browse and book spaces immediately!' },
  { keywords: ['private office', 'dedicated', 'permanent'], response: 'We offer **Private Offices** for teams needing a dedicated space. These come fully furnished with lockable doors, hi-speed WiFi, and 24/7 access options. Check **Browse Spaces** for availability and pricing!' },
  { keywords: ['focus pod', 'quiet', 'silent', 'concentrate'], response: 'Our **Focus Pods** are designed for deep work — soundproofed, private, and equipped with ergonomic seating and hi-speed WiFi. Perfect when you need zero distractions!' },
  { keywords: ['hot desk', 'open desk', 'shared desk', 'cowork'], response: 'Our **Hot Desks** start at **RM15/hr** and give you access to a shared workspace with WiFi, coffee, power outlets, and a vibrant community of professionals.' },
  { keywords: ['boardroom', 'board room', 'executive'], response: 'Our **Boardrooms** range from **RM120-180/hr** and accommodate 10-20 people. They come equipped with large displays, video conferencing, whiteboards, and optional catering.' },
  { keywords: ['thank', 'thanks', 'appreciate'], response: 'You\'re welcome! 😊 If you have any other questions about Valedesk, feel free to ask. Happy coworking!' },
  { keywords: ['hello', 'hi ', 'hey', 'good morning', 'good afternoon'], response: 'Hello! 👋 Welcome to Valedesk. How can I help you today? Feel free to ask about our spaces, pricing, booking process, or amenities!' },
];

function tryKeywordFallback(input: string): string | null {
  const lower = input.toLowerCase();
  for (const { keywords, response } of KEYWORD_RESPONSES) {
    if (keywords.some(kw => lower.includes(kw))) return response;
  }
  return null;
}

/* ── Gemini API call (with model fallback) ──────────────────── */

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callGeminiAPI(
  conversationHistory: Message[],
  apiKey: string,
): Promise<string> {
  const systemInstruction = conversationHistory.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;
  const chatMessages = conversationHistory
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Gemini requires alternating user/model turns
  const mergedMessages: typeof chatMessages = [];
  for (const msg of chatMessages) {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += '\n' + msg.parts[0].text;
    } else {
      mergedMessages.push({ ...msg, parts: [...msg.parts] });
    }
  }
  if (mergedMessages.length > 0 && mergedMessages[0].role !== 'user') {
    mergedMessages.shift();
  }

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: mergedMessages,
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
  });

  // Try each model until one works
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
      );
      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Vale AI] ${model} returned ${response.status}:`, errText);
        lastError = `${response.status}`;
        continue; // try next model
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.warn(`[Vale AI] ${model} failed:`, e);
      lastError = String(e);
    }
  }
  throw new Error(`All Gemini models failed. Last: ${lastError}`);
}

/* ── Component ──────────────────────────────────────────────── */

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError('');

    // 1. Try local Q&A first (instant, no API needed)
    const localAnswer = tryLocalAnswer(content);
    if (localAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: localAnswer }]);
      }, 400); // Small delay for natural feel
      return;
    }

    // 2. Try Gemini API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      // No API key — use built-in fallback
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I appreciate your question! I can help with common topics about Valedesk — try asking about our **spaces, pricing, amenities, booking process, or location**. For more complex questions, our team is available at hello@valedesk.com."
        }]);
      }, 500);
      return;
    }

    setLoading(true);
    try {
      // Build conversation with system prompt + user context
      const systemMsg: Message = { role: 'system', content: SYSTEM_PROMPT + (
        profile ? `\n\nCurrent user info: Name: ${profile.full_name || 'Unknown'}, Email: ${user?.email || 'Unknown'}, Role: ${profile.persona || 'member'}.` : ''
      )};

      const conversationHistory = [systemMsg, ...messages.slice(-8), userMsg];

      const reply = await callGeminiAPI(conversationHistory, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('[Vale AI] Error:', err);
      // Fallback: try keyword-based response before showing generic error
      const keywordAnswer = tryKeywordFallback(content);
      if (keywordAnswer) {
        setMessages(prev => [...prev, { role: 'assistant', content: keywordAnswer }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Great question! While I'm connecting to my AI brain, I can help with common topics — try asking about our **spaces, pricing, amenities, booking process, location, parking, refunds, or payment methods**. For detailed inquiries, reach our team at **hello@valedesk.com**."
        }]);
      }
    } finally {
      setLoading(false);
    }
  }, [messages, profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Chat panel (positioned independently) ──────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[min(400px,calc(100vw-48px))] flex-col overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-[0_24px_70px_rgba(30,144,255,0.22)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-100 bg-[#061B3A] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E90FF] shadow-[0_0_20px_rgba(30,144,255,0.5)]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Vale AI</h3>
                  <p className="text-[9px] font-bold text-sky-300/70">Powered by Gemini Free API (Rate Limited)</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full border border-white/10 p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close Vale AI">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F4F8FF] p-4 valedesk-light-grid">
              <div className="flex flex-col gap-3">
                {/* Welcome message */}
                <div className="flex gap-2">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#061B3A]">
                    <Bot className="h-3.5 w-3.5 text-[#38BDF8]" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#061B3A] px-4 py-3 text-xs font-medium leading-relaxed text-white shadow-sm">
                    Hi{profile?.full_name ? ` ${profile.full_name.split(' ')[0]}` : ''}! 👋 I'm Vale, your Valedesk assistant. I can help you find spaces, answer questions about pricing, or guide you through booking.
                  </div>
                </div>

                {/* Suggested questions — always visible at top */}
                <div className="ml-9 flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Conversation */}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#061B3A]">
                        <Bot className="h-3.5 w-3.5 text-[#38BDF8]" />
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E90FF]">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-[#1E90FF] text-white'
                        : 'rounded-tl-sm bg-[#061B3A] text-white'
                    }`}>
                      {msg.content.split('**').map((part, j) => (
                        j % 2 === 1 ? <strong key={j} className="font-black">{part}</strong> : <span key={j}>{part}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex gap-2">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#061B3A]">
                      <Bot className="h-3.5 w-3.5 text-[#38BDF8]" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-[#061B3A] px-4 py-3 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-300" />
                      <span className="text-[10px] font-bold text-sky-300/70">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-sky-100 bg-white p-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vale something..."
                disabled={loading}
                className="flex-1 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-bold text-[#061B3A] placeholder:text-[#061B3A]/35 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] disabled:opacity-50"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full bg-[#1E90FF] text-white hover:bg-[#0B5ED7] disabled:opacity-50" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating bubble (always fixed bottom-right) ────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E90FF] text-white shadow-[0_16px_40px_rgba(30,144,255,0.34)] transition-all hover:-translate-y-1 hover:bg-[#0B5ED7]"
        aria-label={isOpen ? 'Close Vale AI' : 'Open Vale AI'}
      >
        <span className="absolute inset-0 rounded-full border border-sky-300/60" style={{ animation: 'valedesk-pulse-blue 1.8s ease-out infinite' }} />
        {isOpen ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </button>
    </>
  );
}
