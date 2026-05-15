# Valedesk — Dashboard & Booking Flow Improvements
### Coding Agent Prompt for Google Antigravity (Claude Opus 4.6)

---

## CONTEXT

You are improving an existing, partially functional Next.js 14 (App Router, TypeScript) web application called **Valedesk** — a premium coworking space booking platform. The UI is already built and styled with Tailwind CSS and Framer Motion. Supabase is the backend (auth, PostgreSQL, Realtime, Storage). The design language is: clean blue + white, bold Syne font headings, DM Sans body, grid background, electric blue accents (#2563EB).

**Do not break existing functionality. Make surgical improvements only to the files relevant to each section below.**

**Tech stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Supabase · Stripe · Resend · Lucide React · `qrcode.react` · `date-fns`

---

## SECTION 1 — OVERVIEW PAGE (`/dashboard`)

### 1.1 Replace Metric Cards 3 and 4

The current 4 stat cards are: Upcoming · Hours Booked · Saved Spaces · Browse (Live).

**Keep cards 1 and 2 as-is.** Replace cards 3 and 4 with:

**Card 3 — "This Month's Spend"**
- Query: sum of `total_amount` from `bookings` where `user_id = currentUser`, `payment_status = 'paid'`, and `created_at` is within the current calendar month
- Display: `RM [total]` in large bold text
- Visual: small inline sparkline bar chart (last 6 months of spend, rendered as a mini SVG or using Recharts `<Sparklines>`) in muted blue underneath the number
- On click: navigate to `/dashboard/bookings`
- If no data: show `RM 0` with an empty sparkline

**Card 4 — "Hours This Month"**
- Query: sum of `duration_hours` (calculated from `end_time - start_time`) from `bookings` where `user_id = currentUser`, `status IN ('confirmed', 'completed')`, current month
- Display: `[X] hrs` in large bold text
- Visual: circular progress ring (SVG, no library needed) showing hours used vs a soft cap of 40hrs/month. Ring stroke colour: `#2563EB`. Background ring: `#E2E8F0`. Percentage label in center of ring.
- On click: navigate to `/dashboard/bookings`
- If no data: show `0 hrs` with empty ring

Both new cards must remain visually consistent with existing cards (same white card, border, padding, icon row at top).

### 1.2 Upcoming Bookings Widget

Each booking card in the "Upcoming Bookings" section needs a **"View Booking"** button. Styling: small outlined blue pill button, right-aligned on the card. On click: navigate to `/dashboard/bookings?highlight=[bookingId]` (the My Bookings page will handle scrolling to and highlighting that booking row).

### 1.3 Recommended Spaces

Each recommended space card must show the **room's primary image** at the top of the card (pulled from `room_images` where `is_primary = true` for that room). Image: full-width, aspect-video, `rounded-xl`, `object-cover`. Room name, price, and "View Space" button appear below the image as before.

### 1.4 Promotions & Notices Ticker (NEW COMPONENT)

Add a horizontally auto-scrolling announcements ticker **between the stat cards row and the Upcoming Bookings section**.

**Data source:** `announcements` table in Supabase. Fetch all rows where `active = true` AND (`expires_at IS NULL` OR `expires_at > NOW()`).

**Visual design:**
- Full-width strip, `bg-[#0A1628]` (dark navy), `rounded-xl`, `py-3 px-0`, `overflow-hidden`
- Left edge: small blue pill label `📢 NOTICES` in white, `text-xs font-bold`, separated by a thin blue vertical divider line from the scrolling content
- Scrolling content: all active announcements joined by a `·` separator (bullet character), white text, `text-sm`, scrolls continuously left using CSS `@keyframes marquee` (linear, infinite, ~40s duration for full loop)
- Animation must be smooth — use `animation: marquee 40s linear infinite` with `will-change: transform`
- Pause scroll on hover: `hover:[animation-play-state:paused]`
- If zero active announcements: hide the ticker entirely (render nothing)
- Framer Motion entrance: fade in from top when it appears

**No new Supabase tables needed** — `announcements` table already exists from the schema.

Seed 2 sample announcements for testing:
```sql
INSERT INTO announcements (title, content, type, active) VALUES
  ('🎉 Grand Opening Special', '20% off all bookings in May 2026 — use code VALE20 at checkout', 'info', true),
  ('⚡ New Sky Lounge Now Open', 'Level 4 Sky Lounge is live — book your first session today', 'info', true)
ON CONFLICT DO NOTHING;
```

---

## SECTION 2 — BROWSE SPACES PAGE (`/dashboard/rooms`)

### 2.1 Fix the Filter

The filter button/panel currently does not filter results. Implement working client-side + Supabase filtering:

**Filter fields to implement:**
- **Space Type** — pill toggle buttons (ALL · HOT DESK · FOCUS POD · MEETING ROOM · BOARDROOM · EVENT SPACE · PRIVATE OFFICE). Already visible but non-functional. Wire up to filter the room query by `type`.
- **Capacity** — number input or slider: "Min capacity". Filters rooms where `capacity >= value`.
- **Max Price (RM/hr)** — range slider from 0 to 500. Filters where `price_hour <= value`.
- **Amenities** — multi-select checkboxes: WiFi · Whiteboard · TV Screen · Video Conferencing · Coffee Machine · Parking. Filters rooms that have ALL selected amenities via `room_amenities` join.
- **Availability Date** — date picker. When a date is selected, grey out / badge "Fully Booked" on rooms that have 0 available slots on that date (check `bookings` table for that date range).

Filter application: apply filters on change (no "Apply" button needed — reactive). Show result count: "Showing X spaces". Add a "Clear Filters" text link that resets all filters.

### 2.2 Fix Room Images

Currently all room cards show the same image. Fix the image query to pull the correct primary image per room.

In the rooms query, ensure `room_images` is joined and the primary image URL is extracted:
```typescript
const primaryImage = room.room_images?.find(img => img.is_primary)?.url
  ?? room.room_images?.[0]?.url
  ?? '/images/room-placeholder.jpg'  // fallback
```

Create a placeholder image at `public/images/room-placeholder.jpg` — a simple dark blue gradient with "Valedesk" text, generated as a static file.

Each room card image: `aspect-video`, `object-cover`, `rounded-t-xl` (top corners only), `w-full`. The image is the top portion of the card with the card content below it.

### 2.3 Fix Price Tag Overflow

The price badge (e.g. "RM180/hr") currently overflows the card boundary. Fix by:
- Making the card a `relative` positioned container
- Ensuring the price tag uses `overflow-hidden` or `truncate` if needed
- Or restructure the card header row to be `flex items-start justify-between gap-2` with `min-w-0` on the room type chip and `shrink-0` on the price tag so neither wraps or overflows

---

## SECTION 3 — ROOM DETAIL PAGE (`/dashboard/rooms/[id]`)

### 3.1 Back Button

Add a back button at the very top of the page content area (above the room image and info). Style: `← Back to Spaces` as a text link with a `ChevronLeft` Lucide icon, `text-sm text-blue-600 hover:text-blue-800`, uses `router.back()` on click.

### 3.2 Availability Calendar — Full Redesign

Replace the current flat time-slot grid with a proper interactive two-part calendar component:

**Part A — Month Calendar (top)**

Render a month grid (Mon–Sun columns, 5–6 week rows) for the current month, navigable with `<` `>` month arrows.

Visual style (adapts to light page theme but with bold elements):
- Container: white card with `border border-slate-200 rounded-2xl shadow-sm`
- Header row: month name + year in **Syne bold**, navigation arrows as `ChevronLeft` / `ChevronRight` Lucide icons in blue circle buttons
- Day name headers: `MON TUE WED THU FRI SAT SUN` in `text-xs font-bold text-slate-400 uppercase`
- Date cells:
  - Default available: white bg, `text-slate-700`, hover → `bg-blue-50 border border-blue-200 rounded-lg`
  - **Selected**: `bg-[#2563EB] text-white rounded-lg font-bold` with a subtle box shadow `shadow-blue-200 shadow-md`
  - Fully booked: `bg-slate-100 text-slate-300 line-through cursor-not-allowed` (check bookings table — if all slots for that day are taken)
  - Past dates: `text-slate-300 cursor-not-allowed`
  - Today: blue dot indicator below the date number
- On date cell click: set selected date → triggers Part B to load time slots for that date

**Part B — Time Slot Grid (below the calendar)**

Appears below the calendar after a date is selected. Header: "Available Times — [Selected Date formatted as 'Tuesday, 20 May 2026']"

Fetch slots via the existing `getRoomSlotsForDay(roomId, date)` function (generates 30-min intervals from 07:00 to 21:30).

Time slot buttons:
- Available: `bg-white border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all`
- Booked/Unavailable: `bg-slate-100 text-slate-300 rounded-xl text-sm cursor-not-allowed border border-slate-200 line-through`
- Selected Start: `bg-[#2563EB] text-white border-2 border-blue-700 rounded-xl font-bold scale-105`
- Selected End: `bg-[#1D4ED8] text-white border-2 border-blue-800 rounded-xl font-bold scale-105`
- In-range (between start and end): `bg-blue-100 text-blue-700 border border-blue-200 rounded-xl`

**Selection UX:**
- First click on a slot → sets as **Start time**. Slot shows "START" label beneath it.
- Second click on a later slot → sets as **End time**. Slots in between highlight as the range. Shows "END" label.
- Clicking a third time resets and starts over.
- If user clicks an end time that is before the start: show a small inline error "End time must be after start time" in red below the grid.
- Clicking a booked slot: no action, show a brief tooltip "This slot is already booked"

**Below the slot grid — Booking Summary Strip:**
Once both start and end are selected, show an animated summary strip (Framer Motion slide-up from bottom):
- Dark navy background (`#0A1628`), `rounded-xl`, `p-4`
- Content: room name · selected date · start → end time · duration · price calculation (`price_hour × hours = RM XX`)
- Button: **"Continue to Book →"** (blue pill, full-width) → navigates to `/dashboard/book/[roomId]` passing `date`, `startTime`, `endTime` as URL search params: `/dashboard/book/[roomId]?date=2026-05-20&start=09:00&end=11:00`

**Industry-standard addition — also add to this page:**
Add a **"Similar Spaces"** section at the bottom of the room detail page. Query: 3 rooms of the same `type` as the current room, excluding the current room, ordered by `rating DESC`. Show as horizontal scrolling cards (same card style as Browse Spaces). Heading: "You might also like". This is standard on Airbnb, Booking.com, etc.

---

## SECTION 4 — BOOKING FLOW (`/dashboard/book/[roomId]`)

### 4.1 Step Progress Bar

Replace the current tab-style REVIEW · ATTENDEES · PAYMENT · CONFIRM header with a proper numbered progress indicator:

**Design:**
- 4 steps in a horizontal row, connected by a progress line
- Each step: circle with step number (1/2/3/4), label below (Review · Details · Payment · Confirm)
- **Completed step**: filled blue circle with a white `Check` Lucide icon, connecting line fills blue
- **Current step**: filled blue circle with white number, bold label, subtle blue glow `shadow-blue-300 shadow-md`
- **Upcoming step**: white circle with grey border and grey number, grey label, connecting line is grey
- Connecting lines between circles: `h-0.5 flex-1`. Grey by default. Animates to blue (`bg-blue-600`) with a left-to-right fill animation (Framer Motion `width: 0% → 100%`, duration 0.4s) when the previous step completes
- The entire progress bar should be `sticky top-0 z-10 bg-white/95 backdrop-blur pt-4 pb-3 border-b border-slate-100` so it stays visible while scrolling

### 4.2 Step 1 (Review) — Date/Time Fields

**Auto-populate from URL params:** On mount, read `date`, `start`, `end` from `searchParams` and pre-fill the fields. These come from the room detail calendar selection.

**Field redesign:**

Replace the current date + start time + hours fields with:

- **Date field**: styled date input, `min={today}`. On change, re-validate that selected time slots are still available.
- **Start Time field**: a custom dropdown (not a native `<input type="time">`). Shows only 30-minute interval options from 07:00 to 21:30 as a scrollable listbox. Available slots shown in normal text, already-booked slots shown greyed out with a strikethrough and cannot be selected. On change: re-check availability.
- **End Time field**: same custom dropdown as Start Time, but only shows times AFTER the selected start time. Booked slots greyed out. On change: auto-calculates duration.
- **Duration field**: read-only display. Auto-calculated as `(endTime - startTime)` in hours. Format: "2 hrs 30 mins". Displayed as a styled badge, not an editable input.

**Conflict validation:**
When start or end time changes, call the availability check API. If a conflict is detected:
- Show an inline error below the time fields: red text with `AlertCircle` Lucide icon — "This time slot is no longer available. Please select a different time."
- Disable the "Continue" button until resolved
- Do NOT crash or navigate away

### 4.3 Step 1 (Review) — Additional Services Redesign

Each add-on service must have:
- A **checkbox** on the left (unchecked by default, blue check when selected)
- A **Lucide icon** in a small blue circle to the right of the checkbox:
  - Barista Coffee Service → `Coffee` icon
  - Whiteboard Equipment → `PenLine` icon
  - Microphone & PA System → `Mic` icon
  - Printing Credits → `Printer` icon
- Service name (bold) and description (muted, small) to the right of the icon
- Price on the far right (`+RM15` in blue)
- When checkbox is checked: card gets `border-blue-500 bg-blue-50` styling, checkbox shows blue tick

**Summary sidebar — add-on line items:**
When an add-on is selected, instead of adding to the base price, add a **new line item row** in the summary:
```
Base Rate          RM 360.00
+ Barista Coffee   RM  15.00   ← new row, with Coffee icon
+ Printing Credits RM  20.00   ← new row, with Printer icon
─────────────────────────────
Subtotal           RM 395.00
Service Fee (10%)  RM  39.50
─────────────────────────────
Total              RM 434.50
```
Each add-on row has a small `×` button to remove it (same as unchecking the checkbox). Animate rows in/out with Framer Motion `AnimatePresence` (slide down + fade in, slide up + fade out).

### 4.4 Step 2 — Rename to "Details" and Expand

Rename the "Attendees" tab to **"Details"**. Expand its content to:

**Organiser section:**
- Read-only display of the logged-in user's name and email (from Supabase `user_profiles`). Styled as a locked info card with a `Lock` Lucide icon and label "Booking Organiser". Not editable here — links to `/dashboard/profile` to update.

**Attendee Emails section:**
- Label: "Invite Attendees" with a tooltip (hover `Info` Lucide icon):
  > "Each email added here will receive a copy of the booking confirmation and QR code by email. They'll use this to check in at the front desk."
- Input: type an email → press Enter or comma → email appears as a pill tag with an `×` to remove
- Pill tags: `bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm flex items-center gap-1`
- Validation: only accept valid email format. Invalid email → shake animation on the input + red border momentarily
- Max 20 attendees
- Below the input: small note in grey — `📧 Confirmation QR codes will be emailed to all attendees upon booking.`

**Special Requests / Notes section:**
- Textarea with label "Special Requests" and a tooltip:
  > "Let the Valedesk team know about any specific setup, accessibility needs, or other requirements for your session."
- Placeholder: "e.g. Please set up the room in a U-shape layout, we'll need 2 extension cables..."

**Booking Policies section** (new — below notes):
- Collapsible accordion (open by default), heading: "Booking Policies" with `FileText` Lucide icon
- Content:
  - 🚫 **Cancellation Policy**: "All bookings are non-refundable. Cancellations will not be charged any additional fees but no refund will be issued."
  - ✅ **Check-in**: "Present your QR code or booking reference at the front desk. Check-in opens 10 minutes before your slot."
  - 🕐 **Late Arrival**: "Bookings are held for 15 minutes. After that, the space may be released."
  - 📵 **House Rules**: "Please keep noise to appropriate levels. No food in Focus Pods. Leave the space as you found it."
- Style: `bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2`

### 4.5 Step 3 — Real Stripe Integration

**Setup guidance to include as comments in the code:**

```typescript
// ─── STRIPE SETUP GUIDE ────────────────────────────────────────────────
// 1. Go to https://dashboard.stripe.com/register and create a free account
// 2. In the Stripe Dashboard → Developers → API Keys
// 3. Copy your TEST publishable key (starts with pk_test_) 
//    → paste into .env.local as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// 4. Copy your TEST secret key (starts with sk_test_)
//    → paste into .env.local as STRIPE_SECRET_KEY
// 5. Restart your dev server: npm run dev
// 6. Test with card: 4242 4242 4242 4242 | Expiry: 12/30 | CVC: 123
// 7. Check payments appear in Stripe Dashboard → Payments (test mode)
// ──────────────────────────────────────────────────────────────────────
```

**Replace the current "Demo Payment" placeholder with real Stripe Elements:**

Install if not present: `npm install @stripe/stripe-js @stripe/react-stripe-js stripe`

Create server route `src/app/api/payments/create-intent/route.ts`:
```typescript
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, bookingReference, roomName } = await req.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // MYR in cents
    currency: 'myr',
    description: `Valedesk booking — ${roomName}`,
    metadata: { bookingReference, userId: user.id },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

**Payment step UI:**

```
┌─────────────────────────────────────────────────┐
│  🔒 Secure Payment                               │
│  Powered by Stripe                               │
├─────────────────────────────────────────────────┤
│  Card Number                                     │
│  [ Stripe CardNumberElement              ]       │
│                                                  │
│  Expiry Date          CVC                        │
│  [ CardExpiryElement ]  [ CardCvcElement ]       │
│                                                  │
│  Name on Card                                    │
│  [ text input                            ]       │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ ℹ️  Test mode: use card 4242 4242 4242   │    │
│  │ 4242  ·  Expiry: 12/30  ·  CVC: 123     │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [  🔒  PAY RM 434.50  ]  ← full-width blue btn  │
│                                                  │
│  🔒 256-bit SSL  ·  Stripe Secured  ·  Test Mode │
└─────────────────────────────────────────────────┘
```

- "Test mode" info box: `bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700` with `Info` Lucide icon. Text: "This is a demo environment. Your card will not be charged. Use test card: 4242 4242 4242 4242"
- Stripe CardElement styling options:
```typescript
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
```
- Each Stripe field wrapped in a styled div: `border border-slate-200 rounded-xl p-3 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100`
- On Pay button click:
  1. Call `/api/payments/create-intent` to get `clientSecret`
  2. Call `stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement, billing_details: { name } } })`
  3. On success → update booking `payment_status = 'paid'`, `status = 'confirmed'` in Supabase → advance to Step 4
  4. On failure → show error message below the button in red with `XCircle` Lucide icon. Do NOT crash.
- Pay button shows loading spinner during processing

### 4.6 Step 4 — Confirmation Page Redesign

**Full redesign — from top to bottom:**

```
✅  (large animated green checkmark, Framer Motion scale from 0 to 1)

BOOKING CONFIRMED!
(Syne bold, 32px, dark navy)

Your space is reserved. Here's everything you need.
(DM Sans, muted grey)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ QR CODE — large, centred, 200×200px ]
  VD-MW7WDPQF  📋 (click to copy)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 BOOKING DETAILS
┌────────────────────────────────┐
│ Space      The Pinnacle        │
│            Boardroom           │
│ Date       Thursday, 15 May    │
│ Time       9:00 AM – 12:00 PM  │
│ Duration   3 hours             │
│ Floor      Level 4             │
│ Address    Valedesk KL,        │
│            Bangsar             │
│ Total Paid RM 660.00           │
└────────────────────────────────┘

🚪 HOW TO CHECK IN
┌────────────────────────────────┐
│ 1. Arrive 10 mins early        │
│ 2. Show QR code at front desk  │
│ 3. Or quote your booking ref   │
│    VD-MW7WDPQF                 │
│ 4. Room opens at your start    │
│    time automatically          │
└────────────────────────────────┘

📧 CONFIRMATION SENT TO
┌────────────────────────────────┐
│ ✓ you@email.com (organiser)   │
│ ✓ attendee1@company.com        │
│ ✓ attendee2@company.com        │
└────────────────────────────────┘
(grey note: "QR codes emailed to all attendees")

🗓️  [ Add to Google Calendar ]   (outlined blue button)
📄  [ Download Receipt PDF ]     (outlined button)

[ VIEW MY BOOKINGS ]  ← primary blue full-width button
```

**Styling notes:**
- Booking details and check-in sections: `bg-slate-50 rounded-2xl p-5 border border-slate-200`
- Section headings: `text-xs font-bold uppercase tracking-widest text-slate-400 mb-3`
- Attendees sent list: each row has a `CheckCircle` Lucide icon in green + email
- QR code: white background, `p-4 rounded-2xl shadow-lg border border-slate-200 inline-block`
- Animated confetti on page load: use `canvas-confetti` npm package (`npm install canvas-confetti @types/canvas-confetti`). Fire once on mount with blue/white/navy colours: `['#2563EB', '#60A5FA', '#FFFFFF', '#0A1628']`

---

## SECTION 5 — EMAIL INTEGRATION (Resend)

**Trigger:** After booking confirmed (Step 3 payment success + Supabase booking updated to `confirmed`).

**Setup guidance — include as comments:**
```typescript
// ─── RESEND EMAIL SETUP GUIDE ─────────────────────────────────────────
// 1. Go to https://resend.com and create a free account (100 emails/day free)
// 2. In Resend Dashboard → API Keys → Create API Key
//    → paste into .env.local as RESEND_API_KEY=re_xxxxxxxxxxxxx
// 3. For the sender email, Resend requires a verified domain for production.
//    For testing, you can use: onboarding@resend.dev as the from address
//    (works out of the box for testing without domain verification)
// 4. To use your own domain: Resend Dashboard → Domains → Add Domain
//    → follow DNS verification steps
// 5. Restart dev server after adding the key
// ─────────────────────────────────────────────────────────────────────
```

Create `src/app/api/bookings/send-confirmation/route.ts`:

```typescript
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'  // npm install qrcode @types/qrcode

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await req.json()

  // Fetch full booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, rooms(name, floor)')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Generate QR code as base64 PNG
  const qrDataUrl = await QRCode.toDataURL(booking.reference, {
    width: 300,
    margin: 2,
    color: { dark: '#0F172A', light: '#FFFFFF' }
  })
  const qrBase64 = qrDataUrl.split(',')[1]

  // Build recipient list: organiser + attendees
  const recipients: string[] = [user.email!, ...(booking.attendees ?? [])]

  // Send to each recipient
  const emailPromises = recipients.map(email =>
    resend.emails.send({
      from: 'Valedesk <onboarding@resend.dev>',  // change to your domain when verified
      to: email,
      subject: `Booking Confirmed — ${booking.rooms.name} · ${booking.reference}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
          <div style="background: #0A1628; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; letter-spacing: -0.5px;">✅ Booking Confirmed</h1>
            <p style="color: #94A3B8; margin: 8px 0 0 0;">${booking.reference}</p>
          </div>
          <div style="padding: 32px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Space</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${booking.rooms.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Time</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${new Date(booking.start_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} – ${new Date(booking.end_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Floor</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${booking.rooms.floor}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Total Paid</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #2563EB; font-size: 18px;">RM ${booking.total_amount}</td></tr>
            </table>
            <div style="text-align: center; margin: 24px 0;">
              <p style="color: #64748B; font-size: 13px; margin-bottom: 12px;">Your check-in QR code</p>
              <img src="data:image/png;base64,${qrBase64}" style="width: 200px; height: 200px; border-radius: 12px; border: 2px solid #E2E8F0; padding: 8px;" />
              <p style="font-family: monospace; font-size: 18px; font-weight: 700; color: #0F172A; margin: 12px 0 0 0;">${booking.reference}</p>
            </div>
            <div style="background: #F0F4FF; border-radius: 12px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #0F172A; font-size: 14px;">🚪 How to Check In</p>
              <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
                <li>Arrive 10 minutes before your booking time</li>
                <li>Show this QR code (or quote <strong>${booking.reference}</strong>) at the front desk</li>
                <li>The room will be ready and unlocked at your start time</li>
              </ol>
            </div>
            <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px;">
              Valedesk KL · Bangsar · support@valedesk.co<br/>
              <em>Cancellations are non-refundable. Contact us at least 24hrs in advance if you need to reschedule.</em>
            </p>
          </div>
        </div>
      `,
    })
  )

  await Promise.allSettled(emailPromises)  // allSettled so one failure doesn't block others

  return NextResponse.json({ sent: recipients.length })
}
```

**Call this route** from the booking confirmation step immediately after the Supabase booking is updated to `confirmed`. Handle errors silently (log but don't show the user an error if email fails — booking is still confirmed).

---

## SECTION 6 — SUPABASE — CANCELLATION POLICY UPDATE

Update the cancellation logic throughout the app:

**Policy: Cancellations are non-refundable. No refund is issued. Booking is simply cancelled.**

1. In the cancel booking API route (`/api/bookings/[id]/cancel`): remove any refund logic. Simply update `status = 'cancelled'`. Do NOT update `payment_status` to `'refunded'`. Keep it as `'paid'`.

2. In the My Bookings page cancel confirmation modal: update the warning text to:
   > "Are you sure you want to cancel this booking? **This action cannot be undone and no refund will be issued.** Your booking will be cancelled immediately."
   Button: "Cancel Booking" (red) · "Keep Booking" (outlined)

3. In the booking flow Details step policies accordion: already covered in Section 4.4 above.

---

## IMPLEMENTATION ORDER

Execute in this order to avoid dependency issues:

1. **Section 1** — Overview page improvements (metrics, ticker, upcoming bookings, recommended images)
2. **Section 2** — Browse Spaces filter fix + image fix + price overflow fix
3. **Section 3** — Room detail page (back button, calendar redesign, similar spaces)
4. **Section 4.1–4.3** — Booking step 1 (progress bar, date/time fields, add-ons)
5. **Section 4.4** — Booking step 2 renamed to Details
6. **Section 6** — Cancellation policy update (quick)
7. **Section 4.5** — Stripe real integration
8. **Section 5** — Resend email (install qrcode package, create email route, wire up)
9. **Section 4.6** — Confirmation page redesign (depends on email being wired)

---

## CONSTRAINTS

- Do NOT modify the database schema or add new tables — work with existing Supabase structure
- Do NOT change the sidebar navigation, overall layout, or landing page
- Do NOT break existing auth flow
- All new components must use TypeScript with proper typing
- Use only Lucide React for icons (already installed)
- Use Framer Motion for all animations (already installed)
- All Supabase queries must handle loading and error states — no blank/crashing UI
- Images from Supabase Storage must use `<Image>` from `next/image` with proper `fill` or `width/height`
