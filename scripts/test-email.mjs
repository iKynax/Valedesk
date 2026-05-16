// Quick standalone email test — run with: node scripts/test-email.mjs
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Parse .env.local manually
const envFile = readFileSync(resolve(root, '.env.local'), 'utf8')
const env = {}
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim()
  env[key] = val
}

const smtpUser = env.SMTP_USER
const smtpPass = env.SMTP_PASS?.replace(/\s/g, '')

if (!smtpUser || !smtpPass) {
  console.error('❌  SMTP_USER or SMTP_PASS not set in .env.local')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const nodemailer = require('nodemailer')
const QRCode = require('qrcode')

const TO = 'kynax2408@gmail.com'
const REFERENCE = 'VD-TEST2408'

const mockBooking = {
  reference: REFERENCE,
  rooms: { name: 'The Boardroom', floor: 'Level 3' },
  start_time: new Date('2026-05-20T09:00:00').toISOString(),
  end_time:   new Date('2026-05-20T11:00:00').toISOString(),
  total_amount: '120.00',
}

console.log(`📧  Sending test email to ${TO} ...`)
console.log(`📮  From: ${smtpUser}`)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: smtpUser, pass: smtpPass },
})

const qrDataUrl = await QRCode.toDataURL(REFERENCE, {
  width: 200,
  margin: 2,
  color: { dark: '#0A1628', light: '#FFFFFF' },
})

const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0A1628; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: #ffffff; font-size: 28px; margin: 0;">✅ Booking Confirmed</h1>
    <p style="color: #94A3B8; margin: 8px 0 0 0;">${mockBooking.reference}</p>
  </div>
  <div style="padding: 32px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 16px 16px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Space</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${mockBooking.rooms.name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(mockBooking.start_time).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Time</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(mockBooking.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} – ${new Date(mockBooking.end_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Floor</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${mockBooking.rooms.floor}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Total Paid</td>
          <td style="padding: 8px 0; font-weight: 700; color: #2563EB; font-size: 18px;">RM ${mockBooking.total_amount}</td></tr>
    </table>
    <div style="text-align: center; margin: 24px 0;">
      <p style="color: #64748B; font-size: 13px; margin-bottom: 8px;">Scan this QR code at the front desk</p>
      <img src="${qrDataUrl}" alt="Booking QR Code" width="180" height="180"
           style="display: block; margin: 0 auto 12px; border-radius: 12px; border: 4px solid #E2E8F0;" />
      <p style="font-family: monospace; font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: 2px;">${mockBooking.reference}</p>
    </div>
    <div style="background: #F0F4FF; border-radius: 12px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #0F172A; font-size: 14px;">🚪 How to Check In</p>
      <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
        <li>Arrive 10 minutes before your booking time</li>
        <li>Show this QR code or quote <strong>${mockBooking.reference}</strong> at the front desk</li>
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

try {
  const info = await transporter.sendMail({
    from: `"Valedesk" <${smtpUser}>`,
    to: TO,
    subject: `Booking Confirmed — ${mockBooking.rooms.name} · ${REFERENCE}`,
    html: emailHtml,
  })
  console.log('✅  Email sent successfully!')
  console.log(`   Message ID: ${info.messageId}`)
  console.log(`   To: ${TO}`)
  console.log(`   Reference: ${REFERENCE}`)
} catch (err) {
  console.error('❌  Failed to send email:', err.message)
  if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted')) {
    console.error('\n💡  Fix: Make sure you used a Gmail App Password (not your regular password).')
    console.error('    Get one at: https://myaccount.google.com/apppasswords')
  }
  process.exit(1)
}
