// Netlify serverless function for creating Stripe payment intents
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any })

    const authHeader = req.headers.get('authorization') || ''
    const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
    const token = authHeader.replace('Bearer ', '') || supabaseKey
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { amount, bookingReference, roomName } = body

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'myr',
      description: `Valedesk booking — ${roomName}`,
      metadata: { bookingReference, userId: user.id },
    })

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[Netlify Fn] create-intent error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/payments/create-intent',
}
