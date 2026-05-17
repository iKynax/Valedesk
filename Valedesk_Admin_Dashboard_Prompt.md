# Valedesk — Admin Dashboard Implementation
### Prompt for Google Antigravity (Claude Opus 4.6)

---

## MANDATE

Build a **production-grade, recruiter-impressive admin dashboard** for Valedesk — a premium coworking space booking platform. This is not a prototype. Every page must be polished, data-rich, and fully wired to Supabase. The standard is: if a real operations manager sat down and used this, it should feel professional, fast, and intuitive.

You have full access to the existing codebase. Read all existing files before implementing — match existing conventions (TypeScript, Tailwind, Framer Motion, Supabase SSR client pattern, existing component structure).

**Design language:** Dark admin aesthetic. Deep navy (`#050B18`) page background. Sidebar in `#0A1628`. Cards in `#0F1E35` with `border border-white/8`. Electric blue (`#2563EB`) as primary accent. Cyan (`#38BDF8`) as secondary chart accent. White text primary, `#94A3B8` muted. All charts use Recharts. All icons use Lucide React. Syne font for headings, DM Sans for body. Framer Motion for all transitions and chart entrance animations.

**Layout inspiration:** Dense, data-forward dashboard like a fintech/analytics product — sidebar navigation, top stats row, charts in responsive grid, live data feel. NOT a cookie-cutter admin template. Every section should look like it was designed specifically for a coworking operations team.

---

## PART 1 — ADMIN ACCESS ENTRY (Landing Page Footer)

### 1.1 Footer Link

In the existing landing page footer, add a discreet admin entry point:
- Bottom of the footer, far left or far right, low visual weight
- Text: `Admin Portal` in `text-xs text-slate-600 hover:text-slate-400`, no icon, no underline by default
- On hover: subtle underline appears
- On click: navigates to `/admin/access`
- Must not draw attention from regular visitors — it should look like a legal/policy link

### 1.2 Access Code Gate (`/admin/access`)

A standalone full-page gate that sits before any admin functionality. Purpose: prevent casual visitors from reaching the admin login screen.

**Page design:**
- Full viewport, dark navy background (`#050B18`), centered card
- Valedesk logo at top
- Heading: "Admin Access" in Syne bold, white
- Subtext: "Enter your access code to continue" in muted grey
- **6-character alphanumeric input** — styled as 6 individual character boxes (like an OTP input), each box: `w-12 h-14 text-center text-xl font-bold border-2 border-white/10 bg-white/5 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`. Auto-advances to next box on input.
- "Continue" button below — blue, full width of card, disabled until all 6 chars entered
- On submit: compare input against `ADMIN_ACCESS_CODE` environment variable
  - Match → redirect to `/admin/auth`
  - No match → shake animation on the input boxes (Framer Motion), show error "Invalid access code" in red, clear inputs
- Small "← Back to Valedesk" link below the card

**Environment variable to add to `.env.local`:**
```
ADMIN_ACCESS_CODE=VDADM1
```
Tell the user: "Add `ADMIN_ACCESS_CODE=VDADM1` to your `.env.local` file. You can change this to any 6-character code you prefer."

### 1.3 Admin Auth Page (`/admin/auth`)

Separate from the user `/auth` page. Only reachable after passing the access code gate (store a session flag in sessionStorage: `valedesk_admin_access=true` — check for it on `/admin/auth` load, redirect to `/admin/access` if missing).

**Page design:**
- Same dark full-page layout as the access gate
- Two tabs: "Sign In" and "Create Admin Account"
- **Sign In tab:** Email + password → `supabase.auth.signInWithPassword()` → check `user_profiles.role === 'admin'` → if yes, redirect to `/admin` → if no, show error "This account does not have admin privileges"
- **Create Admin Account tab:** Full name + email + password → `supabase.auth.signUp()` → then immediately update `user_profiles` to set `role = 'admin'` using the service role key via an API route (`/api/admin/create-admin`) → redirect to `/admin`
- After any successful admin auth, set a cookie/session marker so the middleware can verify admin status on all `/admin/*` routes

**Prompt the user:** After implementing, tell the user: "Go to `/admin/access`, enter `VDADM1`, then use the 'Create Admin Account' tab to create your admin account with any email and password you choose."

---

## PART 2 — ADMIN LAYOUT

### 2.1 Sidebar

Persistent left sidebar, `w-64`, `bg-[#0A1628]`, full viewport height, sticky.

**Top section:**
- Valedesk logo + "Admin" badge (small blue pill: `bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full`)
- Logged-in admin's name + avatar below logo

**Navigation items** (with Lucide icons):
```
📊  Overview          /admin
📈  Analytics         /admin/analytics
📅  Bookings          /admin/bookings
🏢  Rooms             /admin/rooms
👥  Users             /admin/users
📢  Promotions        /admin/promotions
⚙️  Settings          /admin/settings
```

Each nav item: icon + label, `px-4 py-3 rounded-xl mx-2`, hover: `bg-white/5`, active: `bg-blue-600/20 text-blue-400 border border-blue-500/30`.

**Bottom of sidebar:**
- "Back to Dashboard" link (goes to `/dashboard`)
- "Sign Out" button

### 2.2 Top Bar

Across all admin pages: `h-16 bg-[#0A1628]/80 backdrop-blur border-b border-white/8 sticky top-0 z-10`
- Left: current page title (Syne bold, white)
- Right: date/time display (live, updates every second) + notification bell + admin avatar

---

## PART 3 — OVERVIEW PAGE (`/admin`)

The homepage of the admin dashboard. Should feel like mission control for Valedesk operations.

### 3.1 KPI Cards Row (6 cards, responsive grid)

All values fetched from Supabase on load. Each card: dark card, icon in coloured circle top-left, metric name in muted small text, large value in Syne bold white, trend indicator (↑ or ↓ vs last period) in green or red.

| Card | Data Source | Trend comparison |
|---|---|---|
| Total Revenue (This Month) | SUM `bookings.total_amount` WHERE paid + current month | vs last month |
| Bookings Today | COUNT `bookings` WHERE `start_time` date = today | vs yesterday |
| Active Users | COUNT `user_profiles` WHERE `role = 'user'` | vs last week |
| Room Occupancy Rate | (confirmed bookings this week / total possible slots) × 100% | vs last week |
| New Sign-ups (This Week) | COUNT `user_profiles` WHERE `created_at` >= 7 days ago | vs prev 7 days |
| Cancellations (This Month) | COUNT `bookings` WHERE `status = 'cancelled'` current month | vs last month |

### 3.2 Live Booking Feed

Right side of the page (or below KPIs on mobile). Real-time feed using **Supabase Realtime** subscription on the `bookings` table.

- Each new booking that comes in slides in from the top with a Framer Motion animation
- Shows: room name, user name, time, amount, status badge
- Keep last 10 entries visible, older ones fade out
- Header: "Live Activity" with a pulsing green dot indicator
- If Realtime is unavailable, poll every 30 seconds as fallback

### 3.3 Revenue Chart

Full-width area chart (Recharts `AreaChart`) — last 12 months of revenue.
- X-axis: month labels
- Y-axis: RM amounts
- Fill: blue gradient (`#2563EB` → transparent)
- Stroke: `#2563EB`
- Tooltip: custom dark styled tooltip showing month + RM amount
- Date range selector tabs above chart: "3M · 6M · 12M"
- Animates in on mount (Recharts `isAnimationActive`)

### 3.4 Bookings by Room Type — Donut Chart

Recharts `PieChart` with inner radius (donut style).
- Each room type gets a slice: hot desk, focus pod, meeting room, boardroom, event space, private office
- Colour palette: shades of blue and cyan
- Centre label: total bookings count
- Legend below with type labels + counts
- Hover: slice expands slightly, tooltip shows count + percentage

### 3.5 Occupancy Heatmap

7-column (Mon–Sun) × operating hours (07:00–22:00 in 1-hr rows) grid.
- Each cell colour intensity = number of bookings in that time slot across the current week
- Colour scale: `#0F1E35` (empty) → `#1D4ED8` (low) → `#2563EB` (medium) → `#38BDF8` (high)
- Hover on cell: tooltip shows exact booking count
- Built as a CSS grid with div cells, no external library needed
- Title: "This Week's Occupancy Heatmap"

---

## PART 4 — ANALYTICS PAGE (`/admin/analytics`)

Deep-dive data page. Date range selector at the top (presets: Last 7 Days · 30 Days · 90 Days · This Year + custom range picker). All charts re-fetch when range changes.

**Charts to include:**

**Row 1:**
- Revenue over time: `AreaChart` (same style as overview but filterable by date range)
- Bookings volume: `BarChart` by day/week

**Row 2:**
- Most booked rooms: horizontal `BarChart`, rooms on Y-axis, booking count on X-axis, sorted descending. Top bar highlighted in blue.
- Booking by room type: `BarChart` with grouped bars (bookings vs revenue per type)

**Row 3:**
- Peak booking hours: `BarChart` (hour of day on X, booking count on Y) — shows which hours are busiest
- Add-on service popularity: horizontal bar chart showing how many times each add-on was selected (parse `bookings.add_ons` JSON array)

**Row 4:**
- User growth over time: `LineChart` — cumulative user signups by month
- Average booking duration by room type: `BarChart`

**Summary stats strip** (above the charts):
- Total revenue in range
- Total bookings in range
- Average booking value
- Most popular room (name + count)
- Busiest day of week

---

## PART 5 — BOOKINGS MANAGEMENT (`/admin/bookings`)

Full booking management interface.

### 5.1 Filters & Search Bar
- Search by booking reference, user name, or room name
- Filter by: status (All/Confirmed/Completed/Cancelled), room type, date range
- Results count: "Showing X bookings"
- Export to CSV button (top right)

### 5.2 Bookings Table

Columns: Reference · User · Room · Date & Time · Duration · Amount · Status · Created · Actions

- Sortable columns (click header to sort)
- Status badges: colour-coded pills
- Actions column: "View" (opens detail drawer) + "Cancel" (with confirmation, no refund per policy)
- Pagination: 20 rows per page with page controls

### 5.3 Booking Detail Drawer

Slide-in from right panel showing full booking info:
- All booking fields
- QR code display
- Attendees list
- Add-ons selected
- Timeline: Created → Paid → Confirmed → [Completed/Cancelled]
- Admin notes field (editable, saves to Supabase — add `admin_notes TEXT` column to `bookings` table if it doesn't exist, prompt user to run the SQL)

### 5.4 Maintenance Blackout Scheduler

Below the table or in a separate tab within this page:
- Calendar view (month) showing existing blackouts per room
- "Add Blackout" button → modal: select room, date range, reason
- Saves to `maintenance_blackouts` table
- Existing blackouts shown as red blocks on the calendar

---

## PART 6 — ROOM MANAGEMENT (`/admin/rooms`)

### 6.1 Room Cards Grid

Display all rooms (including inactive/maintenance) as cards in a 3-column grid.
Each card: room image, room name, type badge, status badge, capacity, price, quick action buttons (Edit / Toggle Status).

Filter bar above: All · Active · Inactive · Maintenance + filter by room type.

"Add New Room" button — top right, opens the room editor.

### 6.2 Room Editor (NOT a standard form)

Design this as an **inline card-based editor** — not a generic form. Think of it like editing a Notion page or a product listing on Shopify. Opens as a full-page view or large modal.

**Layout:**
- Left column (60%): editable content fields
- Right column (40%): live preview card showing how the room looks in Browse Spaces

**Fields — each styled as a clean labelled input, not a form row:**
- Room name: large inline text input, Syne font, looks like an editable heading
- Room type: styled pill selector (click to change type)
- Floor: inline text input
- Capacity: number input with +/− buttons
- Description: auto-expanding textarea, clean borderless style
- **Pricing section**: three clean number inputs side by side: Per Hour / Half Day / Full Day, each with "RM" prefix label
- Status: segmented control: Active / Inactive / Maintenance (styled like a toggle group, not a dropdown)
- Amenities: grid of pill checkboxes — click to toggle each amenity on/off
- **Images section**: drag-and-drop image upload area (react-dropzone). Shows existing images as thumbnails with delete button and "Set as primary" star button.

**Save behaviour:** "Save Changes" button — saves all fields to Supabase `rooms` table + `room_images` + `room_amenities`. Show a success toast on save.

---

## PART 7 — USER MANAGEMENT (`/admin/users`)

### 7.1 Users Table

Columns: Avatar + Name · Email · Role · Bookings (count) · Total Spent · Joined · Status · Actions

- Search bar by name or email
- Filter by role: All / User / Admin
- Sort by: Joined Date, Total Spent, Booking Count

### 7.2 Row Actions
- **View Profile** — opens drawer with: full profile info, booking history list, total stats
- **Promote to Admin** — updates `user_profiles.role = 'admin'` with confirmation dialog
- **Demote to User** — reverse of above
- **Suspend** — add a `suspended BOOLEAN DEFAULT FALSE` column to `user_profiles` if not present (prompt user to run SQL). Suspended users cannot log in.

### 7.3 User Detail Drawer

Slide-in panel showing:
- Profile photo, name, email, company, persona, joined date
- Stats: total bookings, total spent, favourite room type
- Recent bookings list (last 5)
- Account status + role controls

---

## PART 8 — PROMOTIONS MANAGEMENT (`/admin/promotions`)

Interface for managing the announcements ticker shown in the user dashboard.

### 8.1 Active Promotions List

Shows all rows from `announcements` table as cards:
- Card content: title, message preview, type badge, active/inactive status, created date, expiry (if set)
- Toggle switch per card: immediately updates `active` field in Supabase
- Delete button (with confirmation)
- Cards for inactive promotions shown with reduced opacity

### 8.2 Add New Promotion Panel

Clean slide-in panel or inline form above the list:
- **Title** input
- **Content** textarea (this is the scrolling text that appears in the ticker)
- **Type** selector: Info / Warning / Maintenance (colour-coded)
- **Expiry date** (optional — datepicker, leave blank for no expiry)
- "Publish" button — inserts to `announcements` table with `active = true`

### 8.3 Live Preview

Below the add form: a live preview strip showing exactly how the announcement will look in the user dashboard ticker as the admin types. Updates in real-time as the content field changes.

---

## PART 9 — SETTINGS PAGE (`/admin/settings`)

Clean settings page with sections:

**Admin Account:**
- Display current admin name and email (read-only)
- Change password form (calls `supabase.auth.updateUser`)
- Upload admin avatar

**Access Code:**
- Show current `ADMIN_ACCESS_CODE` value (masked: `VDADM•`)
- Instructions: "To change the access code, update `ADMIN_ACCESS_CODE` in your `.env.local` file and restart the server"

**Platform Info:**
- Total rooms count
- Total users count
- Database status indicator (ping Supabase and show green/red dot)
- App version

---

## PART 10 — TECHNICAL REQUIREMENTS

### Data & Supabase
- All data fetched from Supabase using the existing `createClient()` pattern from `@/lib/supabase/server` for server components and `@/lib/supabase/client` for client components
- Use Supabase Realtime for the live booking feed (Section 3.2)
- All mutations (room edits, user role changes, booking cancellations, announcement toggles) must update Supabase immediately and show a toast notification on success/failure
- If any new columns are needed (e.g. `admin_notes`, `suspended`), generate the SQL and tell the user to run it in Supabase SQL Editor before proceeding with that feature

### SQL to prompt the user to run if needed:
```sql
-- Add admin_notes to bookings if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add suspended to user_profiles if not exists  
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;
```

### Charts
- All charts: Recharts library (already installed)
- Animate on mount using Recharts `isAnimationActive` + Framer Motion for container entrance
- All charts must be responsive (use `ResponsiveContainer`)
- Custom tooltips: dark background `#0F1E35`, white text, blue border, rounded corners
- Empty states: if no data exists, show a clean empty state illustration + helpful message (not a blank chart)

### Loading States
- Every data-fetching section must show a skeleton loader while data is loading
- Skeleton: `animate-pulse bg-white/5 rounded-xl` blocks matching the shape of the content
- Never show a blank or crashed UI

### Error Handling
- All Supabase queries wrapped in try/catch
- Network errors show a dismissible error banner at the top of the page
- Individual section errors show inline error states, not full page crashes

### Navigation & Auth Guard
- All `/admin/*` routes protected by middleware — redirect to `/admin/access` if not authenticated as admin
- Active nav item highlighted in sidebar
- Page transitions: Framer Motion `AnimatePresence` with fade + slide-up

### Responsive
- Sidebar collapses to icon-only on screens < 1280px wide, with tooltip labels on hover
- KPI card grid: 6 cols desktop → 3 cols tablet → 2 cols mobile
- Charts stack vertically on mobile
- Tables become horizontally scrollable on mobile

---

## IMPLEMENTATION ORDER

Work through these in order:

1. Admin access gate (`/admin/access`) + admin auth page (`/admin/auth`) + footer link
2. Admin layout (sidebar + topbar) + middleware protection
3. Overview page (KPIs + live feed + revenue chart + donut chart + heatmap)
4. Promotions page (needed for user dashboard ticker to be manageable)
5. Rooms management page (room cards + editor)
6. Bookings management page (table + drawer + blackout scheduler)
7. Users management page
8. Analytics page (all charts)
9. Settings page

---

## FINAL QUALITY BAR

When complete, this admin dashboard should:
- Look indistinguishable from a commercial SaaS admin product
- Have zero blank/loading/crashed states visible to the user
- Handle all edge cases (no data, network errors, empty tables)
- Be fully navigable with real Supabase data
- Impress a recruiter who opens it during a portfolio review — every metric should be meaningful, every chart should tell a story, every interaction should feel intentional
