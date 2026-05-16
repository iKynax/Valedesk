import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
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

function tryLocalAnswer(input: string): string | null {
  const normalized = input.toLowerCase().replace(/[?!.,]/g, '').trim();
  for (const [key, answer] of Object.entries(QUICK_ANSWERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return answer;
    }
  }
  // Check partial matches
  const words = normalized.split(/\s+/);
  for (const [key, answer] of Object.entries(QUICK_ANSWERS)) {
    const keyWords = key.split(/\s+/);
    const matchCount = words.filter(w => keyWords.some(kw => kw.includes(w) || w.includes(kw))).length;
    if (matchCount >= 2) return answer;
  }
  return null;
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

    // 2. Try OpenRouter API
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
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

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Valedesk AI',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: conversationHistory.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I'm having trouble processing that. Please try again!";

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('[Vale AI] Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm experiencing a temporary connection issue. In the meantime, I can help with common questions about Valedesk — try asking about our **spaces, pricing, or how to book**!"
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 flex h-[560px] w-[min(400px,calc(100vw-48px))] flex-col overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-[0_24px_70px_rgba(30,144,255,0.22)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-100 bg-[#061B3A] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E90FF] shadow-[0_0_20px_rgba(30,144,255,0.5)]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Vale AI</h3>
                  <p className="text-[9px] font-bold text-sky-300/70">Valedesk Assistant</p>
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

                {/* Suggested questions (show only when no messages) */}
                {messages.length === 0 && (
                  <div className="ml-9 flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

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
