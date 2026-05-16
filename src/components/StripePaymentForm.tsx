import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { XCircle, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'

// ─── STRIPE SETUP GUIDE ────────────────────────────────────────────────
// 1. Go to https://dashboard.stripe.com/register and create a free account
// 2. In the Stripe Dashboard → Developers → API Keys
// 3. Copy your TEST publishable key (starts with pk_test_)
//    → paste into .env.local as VITE_STRIPE_PUBLISHABLE_KEY
// 4. Copy your TEST secret key (starts with sk_test_)
//    → paste into .env.local as STRIPE_SECRET_KEY
// 5. Restart your dev server: npm run dev
// 6. Test with card: 4242 4242 4242 4242 | Expiry: 12/30 | CVC: 123
// 7. Check payments appear in Stripe Dashboard → Payments (test mode)
// ──────────────────────────────────────────────────────────────────────

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: '"DM Sans", sans-serif',
      color: '#0F172A',
      '::placeholder': { color: '#94A3B8' },
    },
    invalid: { color: '#EF4444' },
  },
}

const stripePromise = env.stripePublishableKey ? loadStripe(env.stripePublishableKey) : null

interface Props {
  amount: number
  roomName: string
  bookingReference: string
  onSuccess: () => void
  onBack: () => void
  authToken: string
}

function CheckoutForm({ amount, roomName, bookingReference, onSuccess, onBack, authToken }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('Test User')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')

    try {
      // 1. Create PaymentIntent via our Express API
      let res: Response
      try {
        res = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ amount, bookingReference, roomName }),
        })
      } catch (fetchErr) {
        // API server not running — fall back to demo mode
        console.warn('API server not reachable, falling back to demo booking')
        onSuccess()
        return
      }

      // Handle non-JSON responses (e.g. proxy returning HTML error page)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        console.warn('API returned non-JSON response, falling back to demo booking')
        onSuccess()
        return
      }

      const body = await res.json()
      if (body.error) throw new Error(body.error)

      // 2. Confirm with Stripe
      const cardElement = elements.getElement(CardNumberElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError } = await stripe.confirmCardPayment(body.clientSecret, {
        payment_method: {
          card: cardElement as any,
          billing_details: { name: name || undefined },
        },
      })

      if (stripeError) throw new Error(stripeError.message)

      // 3. Success
      onSuccess()
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-100 p-6">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">🔒 Secure Payment</div>
        <p className="text-[10px] font-bold text-slate-400">Powered by Stripe</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Card Number</label>
            <div className="rounded-xl border border-slate-200 bg-white p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <CardNumberElement options={ELEMENT_OPTIONS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Expiry Date</label>
              <div className="rounded-xl border border-slate-200 bg-white p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <CardExpiryElement options={ELEMENT_OPTIONS} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">CVC</label>
              <div className="rounded-xl border border-slate-200 bg-white p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <CardCvcElement options={ELEMENT_OPTIONS} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Name on Card</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Test mode info box */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="text-xs text-blue-700">
            <p><strong>Demo Mode:</strong> Use test card <strong>4242 4242 4242 4242</strong> · Expiry: <strong>12/30</strong> · CVC: <strong>123</strong></p>
            <p className="mt-1 text-blue-600/70">If the API server is not running (<code>npm run api</code>), payment will be skipped and the booking confirmed automatically.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onBack} variant="outline" className="h-14 rounded-full px-8 text-xs font-black uppercase tracking-widest">Back</Button>
        <Button
          disabled={processing}
          onClick={() => onSuccess()}
          variant="outline"
          className="h-14 rounded-full border-emerald-300 px-6 text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
        >
          ⚡ Skip Payment (Demo)
        </Button>
        <Button
          disabled={processing || !stripe}
          onClick={handlePay}
          className="h-14 flex-1 rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]"
        >
          {processing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            `🔒 Pay RM ${amount.toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-400">🔒 256-bit SSL · Stripe Secured · Test Mode</p>
    </div>
  )
}

// Wrapper that provides the Stripe Elements context
export default function StripePaymentForm(props: Props) {
  if (!stripePromise) {
    // Fallback if Stripe is not configured
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-bold text-amber-800">Stripe Not Configured</h3>
          <p className="mt-2 text-xs text-amber-700">
            Add your Stripe publishable key to <code>.env.local</code> as <code>VITE_STRIPE_PUBLISHABLE_KEY</code> and restart the dev server.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={props.onBack} variant="outline" className="h-14 rounded-full px-8 text-xs font-black uppercase tracking-widest">Back</Button>
          <Button onClick={props.onSuccess} className="h-14 flex-1 rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]">
            Skip Payment (Demo) →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
