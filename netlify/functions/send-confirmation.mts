// Netlify serverless function for sending booking confirmation emails via Gmail SMTP
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, context: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    if (!smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ sent: 0, skipped: true, reason: 'SMTP not configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Auth check via Supabase
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
    const { bookingId, attendees: extraAttendees = [] } = body

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, rooms(name, floor)')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass.replace(/\s/g, '') },
    })

    // Merge organizer + DB attendees + extras, deduplicate
    const dbAttendees: string[] = booking.attendees ?? []
    const recipients = Array.from(
      new Set([user.email!, ...dbAttendees, ...extraAttendees].filter(Boolean))
    )

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
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${booking.rooms?.name || 'Valedesk Space'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} – ${new Date(booking.end_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Floor</td>
                <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${booking.rooms?.floor || '—'}</td></tr>
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

    const emailPromises = recipients.map((email: string) =>
      transporter.sendMail({
        from: `"Valedesk" <${smtpUser}>`,
        to: email,
        subject: `Booking Confirmed — ${booking.rooms?.name || 'Valedesk'} · ${booking.reference}`,
        html: emailHtml,
      })
    )

    await Promise.allSettled(emailPromises)

    return new Response(JSON.stringify({ sent: recipients.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[Netlify Fn] send-confirmation error:', err.message)
    return new Response(JSON.stringify({ sent: 0, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/bookings/send-confirmation',
}
