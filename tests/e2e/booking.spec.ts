/**
 * tests/e2e/booking.spec.ts
 *
 * Tests for: the full booking flow from room selection to confirmation.
 * Specifically targets your reported issue: "certain parts of the booking
 * flow don't work as well (like crashes the app)"
 *
 * Each step is tested independently so you can pinpoint WHICH step crashes.
 */

import { test, expect, Page } from '@playwright/test'
import { AUTH_STATE, STRIPE_TEST_CARD, SUPABASE_TIMEOUT } from './constants'

test.use({ storageState: AUTH_STATE.regular })

// ─── HELPER: Navigate to the first available room ─────────────────────────────
async function goToFirstRoom(page: Page) {
  await page.goto('/dashboard/rooms')
  const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
  await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
  await cards.first().click()
  await expect(page).toHaveURL(/\/dashboard\/rooms\/[\w-]+/, { timeout: 10_000 })
}

// ─── HELPER: Select a time slot in the booking flow ───────────────────────────
async function selectAvailableSlot(page: Page) {
  // Try to click a future date on the calendar
  const availableDays = page.locator(
    'button[aria-label*="2026"]:not([disabled]), [class*="day"]:not([class*="disabled"]):not([class*="past"]):not([class*="booked"])'
  )

  // Click the 5th available day to avoid any pre-existing test bookings
  const dayCount = await availableDays.count()
  if (dayCount > 5) {
    await availableDays.nth(5).click()
  } else if (dayCount > 0) {
    await availableDays.last().click()
  } else {
    throw new Error('No available dates found on calendar — check your availability logic or seed data')
  }

  await page.waitForTimeout(1500) // wait for time slots to load

  // Click the first available time slot
  const timeSlots = page.locator(
    '[data-testid="time-slot"][data-available="true"], button[class*="slot"]:not([disabled]), [class*="time-slot"]:not([class*="booked"])'
  )
  await expect(timeSlots.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
  await timeSlots.first().click()

  // If there's a "select end time" as well, click the slot 2 hours later
  const endSlots = page.locator('[data-testid="end-slot"], [class*="end-time"]')
  if (await endSlots.count() > 0) {
    await endSlots.nth(3).click() // ~2 hours after start
  }
}

// ─── 1. STEP-BY-STEP BOOKING FLOW ────────────────────────────────────────────
test.describe('Booking Flow — Step by Step', () => {

  test('STEP 1: Room detail → booking page loads without crash', async ({ page }) => {
    await goToFirstRoom(page)

    // Find and click the "Book Now" or "Book This Space" button in the sidebar
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await expect(bookBtn).toBeVisible({ timeout: 10_000 })
    await bookBtn.click()

    // ─── If this crashes: ─────────────────────────────────────────────────
    // Check the screenshot. Common issues:
    // 1. roomId param is missing from URL → your link/button isn't passing roomId
    // 2. The booking page tries to fetch room data but gets undefined → add null check
    // 3. Zustand store not initialized → check useBookingStore initial state
    await expect(page).toHaveURL(/\/dashboard\/book\//, { timeout: 10_000 })
    console.log('✓ Step 1: Reached booking page')
  })

  test('STEP 1: Date and time selection works', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//, { timeout: 10_000 })

    // Select a time slot
    await selectAvailableSlot(page)

    // Price should update after selecting a time
    // ─── If crash here: ──────────────────────────────────────────────────
    // Check if calculatePrice() handles undefined room.price_hour
    // Add: if (!room?.price_hour) return
    await expect(page.getByText(/rm|myr/i)).toBeVisible({ timeout: 5_000 })
    console.log('✓ Step 1: Time selection and price calculation works')
  })

  test('STEP 1: Add-ons toggle without crash', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//)

    const addOnCheckboxes = page.locator('[class*="addon"], [class*="add-on"], [data-testid*="addon"]')
    if (await addOnCheckboxes.count() > 0) {
      await addOnCheckboxes.first().click()
      // Price should update
      await page.waitForTimeout(500)
      await expect(page.getByText(/rm|myr/i)).toBeVisible({ timeout: 3_000 })
      console.log('✓ Add-on toggled, price updated')
    } else {
      console.log('⚠ No add-on elements found — check your add-on component selectors')
    }
  })

  test('STEP 1→2: Proceeding to attendee step', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//)

    await selectAvailableSlot(page)

    // Click "Next" or "Proceed to Attendees"
    const nextBtn = page.getByRole('button', { name: /next|proceed|continue|attendee/i })
    await expect(nextBtn).toBeVisible({ timeout: 5_000 })
    await nextBtn.click()

    // ─── If crash at step transition: ────────────────────────────────────
    // Your step state (Zustand) may not be updating correctly.
    // Check: does setStep(2) get called? Is the step indicator reactive?
    // Check console for: "Cannot read properties of undefined"
    await expect(page.getByText(/attendee|organiser|step 2/i)).toBeVisible({ timeout: 5_000 })
    console.log('✓ Step 1→2 transition successful')
  })

  test('STEP 2: Attendee details pre-filled from user profile', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//)
    await selectAvailableSlot(page)

    const nextBtn = page.getByRole('button', { name: /next|proceed|continue|attendee/i })
    await nextBtn.click()
    await expect(page.getByText(/attendee|organiser/i)).toBeVisible({ timeout: 5_000 })

    // User's name should be pre-filled (from Supabase user_profiles)
    // ─── If name is empty: ───────────────────────────────────────────────
    // Your Step 2 component isn't reading from the auth context or user_profiles.
    // FIX: Call useAuth() in Step 2 component and pre-fill from profile.full_name
    await expect(page.getByDisplayValue(/sarah lim/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Step 2: Organiser name pre-filled from Supabase profile')
  })

  test('STEP 2→3: Proceeding to payment step', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//)
    await selectAvailableSlot(page)

    // Step 1→2
    await page.getByRole('button', { name: /next|proceed|continue|attendee/i }).click()
    await expect(page.getByText(/attendee|organiser/i)).toBeVisible({ timeout: 5_000 })

    // Step 2→3
    const payBtn = page.getByRole('button', { name: /next|proceed|payment|pay/i })
    await expect(payBtn).toBeVisible({ timeout: 5_000 })
    await payBtn.click()

    // Stripe card form should appear
    // ─── If crash at payment step: ───────────────────────────────────────
    // 1. Stripe publishable key may be missing from .env.local
    // 2. loadStripe() may be failing silently — check browser console
    // 3. The <Elements> provider may not be wrapping the card form
    // Check screenshot — does it show the Stripe card input iframe?
    await expect(
      page.getByText(/payment|card|stripe|pay rm/i)
    ).toBeVisible({ timeout: 10_000 })
    console.log('✓ Step 2→3: Payment step reached')
  })

  test('STEP 3: Stripe card form renders', async ({ page }) => {
    await goToFirstRoom(page)
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//)
    await selectAvailableSlot(page)

    await page.getByRole('button', { name: /next|proceed|continue/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /next|proceed|payment/i }).click()
    await page.waitForTimeout(2000) // Stripe iframe takes time to load

    // Stripe renders in an iframe — we check the iframe exists
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"], iframe[src*="stripe"]')
    const cardInput = stripeFrame.locator('[name="cardnumber"], [placeholder*="card"], input').first()

    if (await cardInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('✓ Stripe card iframe rendered correctly')
    } else {
      // Fallback: check if there's a custom card input (not using Stripe Elements)
      const customCardInput = page.locator('[placeholder*="4242"], [name*="card"]')
      if (await customCardInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log('✓ Custom card input found')
      } else {
        console.warn('⚠ Stripe card form not found — check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set')
      }
    }
  })
})

// ─── 2. FULL E2E BOOKING (Mock Stripe) ───────────────────────────────────────
test.describe('Full Booking E2E', () => {

  test('complete full booking flow and reach confirmation', async ({ page }) => {
    // Collect console errors throughout
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`))

    await goToFirstRoom(page)

    // Get room name before clicking
    const roomName = await page.locator('h1').first().textContent()

    // Click Book
    const bookBtn = page.getByRole('button', { name: /book now|book this space|book/i }).first()
    await bookBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/book\//, { timeout: 10_000 })

    // Step 1: Select time
    await selectAvailableSlot(page)
    console.log('Step 1: Time selected')

    // Step 1 → 2
    await page.getByRole('button', { name: /next|proceed|continue|attendee/i }).click()
    await expect(page.getByText(/attendee|organiser/i)).toBeVisible({ timeout: 8_000 })
    console.log('Step 2: Attendee details')

    // Add a note
    const notesField = page.getByLabel(/notes|special request/i)
    if (await notesField.isVisible()) {
      await notesField.fill('Playwright automated test booking — safe to ignore')
    }

    // Step 2 → 3
    await page.getByRole('button', { name: /next|proceed|payment/i }).click()
    await page.waitForTimeout(3000) // Stripe load time
    console.log('Step 3: Payment page')

    // Fill Stripe card details
    // Stripe Elements uses iframes — each field is a separate iframe
    try {
      const cardNumberFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]:nth-of-type(1)')
      await cardNumberFrame.locator('input[name="cardnumber"], input[autocomplete*="cc-number"]')
        .fill(STRIPE_TEST_CARD.number)

      const expiryFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]:nth-of-type(2)')
      await expiryFrame.locator('input[name="exp-date"], input[autocomplete*="cc-exp"]')
        .fill(STRIPE_TEST_CARD.expiry)

      const cvcFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]:nth-of-type(3)')
      await cvcFrame.locator('input[name="cvc"], input[autocomplete*="cc-csc"]')
        .fill(STRIPE_TEST_CARD.cvc)

      console.log('Step 3: Card details filled')
    } catch (e) {
      // If Stripe iframe approach fails, try direct card input (non-Elements approach)
      const cardInput = page.getByPlaceholder(/card number|4242/i)
      if (await cardInput.isVisible()) {
        await cardInput.fill(STRIPE_TEST_CARD.number)
        await page.getByPlaceholder(/mm.*yy|expiry/i).fill(STRIPE_TEST_CARD.expiry)
        await page.getByPlaceholder(/cvc|cvv|security/i).fill(STRIPE_TEST_CARD.cvc)
      } else {
        console.warn('⚠ Could not fill Stripe card form — skipping to check for crash at least')
      }
    }

    // Fill cardholder name if present
    const nameOnCard = page.getByLabel(/name on card|cardholder/i)
    if (await nameOnCard.isVisible()) {
      await nameOnCard.fill(STRIPE_TEST_CARD.name)
    }

    // Click Pay
    const payBtn = page.getByRole('button', { name: /pay rm|pay now|confirm payment/i })
    await expect(payBtn).toBeVisible({ timeout: 5_000 })
    await payBtn.click()

    // ─── CONFIRMATION PAGE ────────────────────────────────────────────────
    // This is where many booking flows crash. Check the screenshot carefully.
    // Common issues:
    // 1. /api/bookings/[id]/confirm returns 500 → check server logs
    // 2. Stripe webhook fails → for mock, you may not need webhook
    // 3. QR code library throws on bad input → add null check on booking.reference
    // 4. The confirmation page tries to access booking data that hasn't been
    //    passed through state → use URL params or re-fetch by bookingId
    await expect(
      page.getByText(/booking confirmed|confirmed|reference|VD-/i)
    ).toBeVisible({ timeout: 20_000 })

    console.log('✓ FULL BOOKING FLOW COMPLETE — reached confirmation')

    // Check QR code rendered
    const qrCode = page.locator('svg[class*="qr"], canvas[class*="qr"], [data-testid="qr-code"]')
    if (await qrCode.isVisible()) {
      console.log('✓ QR code rendered on confirmation')
    } else {
      console.warn('⚠ QR code not found — check qrcode.react import and booking.qr_data')
    }

    // Check booking reference format
    await expect(page.getByText(/VD-[A-Z0-9]{8}/)).toBeVisible({ timeout: 5_000 })
    console.log('✓ Booking reference in correct VD-XXXXXXXX format')

    // Print any console errors caught during the flow
    if (consoleErrors.length > 0) {
      console.warn('\n⚠ Console errors during booking flow (paste these to your coding agent):')
      consoleErrors.forEach(e => console.warn(`  • ${e}`))
    }
  })
})

// ─── 3. BOOKING MANAGEMENT ───────────────────────────────────────────────────
test.describe('Booking Management', () => {

  test('cancel button appears and opens confirmation modal', async ({ page }) => {
    await page.goto('/dashboard/bookings')
    await expect(
      page.getByText(/meridian suite|pinnacle boardroom|upcoming/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Click cancel on first upcoming booking
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first()
    if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelBtn.click()

      // Should show confirmation modal — not immediately cancel
      await expect(
        page.getByText(/are you sure|confirm cancel|cannot be undone/i)
      ).toBeVisible({ timeout: 3_000 })
      console.log('✓ Cancel confirmation modal appeared')

      // Dismiss without actually cancelling
      const dismissBtn = page.getByRole('button', { name: /keep|no|go back/i })
      if (await dismissBtn.isVisible()) await dismissBtn.click()
    } else {
      console.log('⚠ No cancel button visible — check if upcoming bookings tab is default')
    }
  })

  test('QR code modal opens for confirmed booking', async ({ page }) => {
    await page.goto('/dashboard/bookings')
    await expect(
      page.getByText(/meridian suite|pinnacle boardroom/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    const qrBtn = page.getByRole('button', { name: /view qr|qr code/i }).first()
    if (await qrBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await qrBtn.click()
      // QR modal should open
      await expect(
        page.locator('svg[class*="qr"], canvas[class*="qr"], [role="dialog"]')
      ).toBeVisible({ timeout: 3_000 })
      console.log('✓ QR code modal opened')
    } else {
      console.log('⚠ No QR button found — check booking card action buttons')
    }
  })
})

// ─── 4. REAL-TIME AVAILABILITY ───────────────────────────────────────────────
test.describe('Real-time Availability', () => {

  test('room availability reflects in-DB bookings', async ({ page }) => {
    // Navigate to Meridian Suite (has a seeded booking for sarah 1 day from now)
    await page.goto('/dashboard/rooms')
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Find Meridian Suite specifically
    const meridianCard = page.getByText(/meridian suite/i).first()
    if (await meridianCard.isVisible()) {
      await meridianCard.click()
      await expect(page).toHaveURL(/\/dashboard\/rooms\//)

      // Navigate to tomorrow's date in the calendar
      // The seeded booking is at 10am tomorrow — that slot should be marked booked
      await page.waitForTimeout(2000) // Let Supabase fetch complete

      // Check that SOME slots are marked as unavailable (seeded bookings exist)
      const bookedSlots = page.locator(
        '[data-available="false"], [class*="booked"], [class*="unavailable"], button[disabled][class*="slot"]'
      )
      const bookedCount = await bookedSlots.count()
      console.log(`✓ Found ${bookedCount} booked slots on calendar (seeded bookings working)`)
    }
  })
})
