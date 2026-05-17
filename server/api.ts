// ─── VALEDESK API SERVER ────────────────────────────────────────────────
// A lightweight Express server that runs alongside the Vite dev server.
// It provides server-side API routes for Stripe and Nodemailer that cannot
// run in the browser (they require secret keys).
//
// USAGE:
//   npx tsx server/api.ts
//   (runs on port 3001 by default)
//
// The Vite dev server proxies /api/* requests to this server.
// ────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local first, then .env as fallback
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })
import express from 'express'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
// QRCode import removed — using public API URL instead for email compatibility
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json())

// ─── CORS for local dev ─────────────────────────────────────────────
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ─── Helpers ────────────────────────────────────────────────────────
function getSupabase(authHeader?: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const token = authHeader?.replace('Bearer ', '') || anonKey
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

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

// ─── POST /api/payments/create-intent ───────────────────────────────
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured in .env.local' })
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any })
    const supabase = getSupabase(req.headers.authorization)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { amount, bookingReference, roomName } = req.body

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // MYR in cents
      currency: 'myr',
      description: `Valedesk booking — ${roomName}`,
      metadata: { bookingReference, userId: user.id },
    })

    return res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('[API] create-intent error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// ─── GMAIL SMTP EMAIL SETUP GUIDE ────────────────────────────────────
// 1. Use any Gmail account as your sender
// 2. Go to https://myaccount.google.com/security
//    → Enable 2-Step Verification (required for App Passwords)
// 3. Go to https://myaccount.google.com/apppasswords
//    → App name: "Valedesk" → click Create → copy the 16-char password
// 4. In .env.local set:
//      SMTP_USER=yourname@gmail.com
//      SMTP_PASS=xxxx xxxx xxxx xxxx   ← the App Password (spaces ok)
// 5. Restart the API server: npm run api
// ─────────────────────────────────────────────────────────────────────

// ─── POST /api/bookings/send-confirmation ───────────────────────────
app.post('/api/bookings/send-confirmation', async (req, res) => {
  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    if (!smtpUser || !smtpPass) {
      console.warn('[API] SMTP_USER / SMTP_PASS not configured, skipping email')
      return res.json({ sent: 0, skipped: true })
    }

    const supabase = getSupabase(req.headers.authorization)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { bookingId, attendees: extraAttendees = [] } = req.body

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, rooms(name, floor)')
      .eq('id', bookingId)
      .single()

    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    // Build Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass.replace(/\s/g, '') },
    })

    // Merge organizer + DB attendees + any extra emails passed from frontend, deduplicate
    const dbAttendees: string[] = booking.attendees ?? []
    const recipients: string[] = Array.from(new Set([user.email!, ...dbAttendees, ...extraAttendees].filter(Boolean)))

    // Use public QR code API — data: URIs are blocked by Gmail and most email clients
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(booking.reference)}`

    const emailHtml = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
        <div style="background: #0A1628; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0;">✅ Booking Confirmed</h1>
          <p style="color: #94A3B8; margin: 8px 0 0 0;">${booking.reference}</p>
        </div>
        <div style="padding: 32px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 16px 16px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Space</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${(booking as any).rooms?.name || 'Valedesk Space'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} – ${new Date(booking.end_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Floor</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${(booking as any).rooms?.floor || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Total Paid</td>
                <td style="padding: 8px 0; font-weight: 700; color: #2563EB; font-size: 18px;">RM ${booking.total_amount}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <p style="color: #64748B; font-size: 13px; margin-bottom: 8px;">Scan this QR code at the front desk</p>
            <img src="${qrImageUrl}" alt="Booking QR Code" width="180" height="180"
                 style="display: block; margin: 0 auto 12px; border-radius: 12px; border: 4px solid #E2E8F0;" />
            <p style="font-family: monospace; font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: 2px;">${booking.reference}</p>
          </div>
          <div style="background: #F0F4FF; border-radius: 12px; padding: 16px; margin-top: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #0F172A; font-size: 14px;">🚪 How to Check In</p>
            <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
              <li>Arrive 10 minutes before your booking time</li>
              <li>Show your booking reference <strong>${booking.reference}</strong> at the front desk</li>
              <li>The room will be ready and unlocked at your start time</li>
            </ol>
          </div>
          <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px;">
            Valedesk KL · Bangsar · support@valedesk.co<br/>
            <em>Cancellations are non-refundable.</em>
          </p>
        </div>
      </div>
    `

    const emailPromises = recipients.map(email =>
      transporter.sendMail({
        from: `"Valedesk" <${smtpUser}>`,
        to: email,
        subject: `Booking Confirmed — ${(booking as any).rooms?.name || 'Valedesk'} · ${booking.reference}`,
        html: emailHtml,
      })
    )

    await Promise.allSettled(emailPromises)
    return res.json({ sent: recipients.length })
  } catch (err: any) {
    console.error('[API] send-confirmation error:', err.message)
    return res.json({ sent: 0, error: err.message })
  }
})

// ─── Start ──────────────────────────────────────────────────────────
const PORT = process.env.API_PORT || 3001
app.listen(PORT, () => {
  console.log(`[Valedesk API] Running on http://localhost:${PORT}`)
  if (!process.env.STRIPE_SECRET_KEY) console.warn('  ⚠ STRIPE_SECRET_KEY not set')
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) console.warn('  ⚠ SMTP_USER / SMTP_PASS not set — booking emails will be skipped')
})
e x p o r t   {   a p p   }  
 