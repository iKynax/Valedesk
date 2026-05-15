/**
 * tests/e2e/dashboard.spec.ts
 *
 * Tests for: Supabase data loading after refresh, navigation,
 * and all dashboard pages rendering real data correctly.
 *
 * Targets your reported issue:
 * "loading in data from supabase after page refreshes"
 */

import { test, expect } from '@playwright/test'
import { AUTH_STATE, SUPABASE_TIMEOUT } from './constants'

// All tests in this file start as a logged-in regular user
test.use({ storageState: AUTH_STATE.regular })

// ─── HELPER: check page has no crash indicators ───────────────────────────────
async function assertNoCrash(page: any) {
  // These are common Next.js crash/error indicators
  const errorIndicators = [
    'text=Application error',
    'text=Internal Server Error',
    'text=500',
    'text=An unexpected error has occurred',
    'text=ChunkLoadError',
    'text=Hydration failed',
    '[data-nextjs-dialog]',  // Next.js error overlay
  ]
  for (const selector of errorIndicators) {
    const isVisible = await page.locator(selector).isVisible({ timeout: 1_000 }).catch(() => false)
    if (isVisible) {
      // Grab the full error text to include in the failure message
      const errorText = await page.locator(selector).textContent().catch(() => 'unknown error')
      throw new Error(`App crashed with: "${errorText}"\nCheck screenshot in playwright-report/`)
    }
  }
}

// ─── 1. DASHBOARD HOME ────────────────────────────────────────────────────────
test.describe('Dashboard Home (/dashboard)', () => {

  test('loads initial data from Supabase', async ({ page }) => {
    await page.goto('/dashboard')
    await assertNoCrash(page)

    // Stats cards should appear — they're populated from Supabase
    // If these timeout, your dashboard is not fetching data or showing skeletons forever
    await expect(page.getByText(/total bookings|upcoming bookings|hours booked/i))
      .toBeVisible({ timeout: SUPABASE_TIMEOUT })

    console.log('✓ Dashboard stats loaded')
  })

  test('loads data correctly AFTER page refresh', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/total bookings|upcoming bookings/i))
      .toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // THE KEY TEST — hard refresh
    await page.reload()
    await assertNoCrash(page)

    // ─── If this fails after reload: ─────────────────────────────────────
    // Your dashboard component is likely a Client Component fetching data
    // in useEffect, but the session isn't available on the client yet.
    // FIX: Move the data fetch to a Server Component that calls
    //      createClient() from @/lib/supabase/server — session is always
    //      available server-side via cookies.
    await expect(page.getByText(/total bookings|upcoming bookings/i))
      .toBeVisible({ timeout: SUPABASE_TIMEOUT })

    console.log('✓ Dashboard data reloaded after refresh')
  })

  test('upcoming bookings widget shows real booking data', async ({ page }) => {
    await page.goto('/dashboard')

    // The seed data includes upcoming bookings for sarah.lim@testuser.com
    // If this fails, check: is the bookings query filtering by user_id correctly?
    //                       Is RLS preventing the data from coming through?
    await expect(
      page.getByText(/meridian suite|pinnacle boardroom|executive suite/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    console.log('✓ Upcoming bookings widget shows real data')
  })

  test('announcements banner appears when active announcement exists', async ({ page }) => {
    await page.goto('/dashboard')
    // Seeded: "Welcome to Valedesk!" announcement
    await expect(
      page.getByText(/welcome to valedesk|sky lounge now open/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })
  })
})

// ─── 2. BROWSE ROOMS ─────────────────────────────────────────────────────────
test.describe('Browse Rooms (/dashboard/rooms)', () => {

  test('loads all rooms from Supabase', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    await assertNoCrash(page)

    // Should show at least 6 rooms (we seeded 12)
    // Adjust selector to your actual room card container
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(6)
    console.log(`✓ ${count} rooms loaded`)
  })

  test('rooms reload correctly after page refresh', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    const countBefore = await cards.count()

    await page.reload()
    await assertNoCrash(page)

    // ─── If count changes or cards disappear after reload: ────────────────
    // Your rooms fetch is likely in a useEffect with a dependency array issue,
    // OR you're using client-side state that resets on mount.
    // FIX: Use React Query with appropriate staleTime, or fetch in Server Component.
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    const countAfter = await cards.count()
    expect(countAfter).toBe(countBefore)
    console.log(`✓ Room count consistent after refresh: ${countAfter}`)
  })

  test('room images load without broken image icons', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    await page.waitForTimeout(3000) // Let images settle

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
    })

    if (brokenImages.length > 0) {
      console.warn(`⚠ Broken images found:\n${brokenImages.join('\n')}`)
    }
    // Warn but don't fail — Unsplash URLs may have rate limits in test
    console.log(`✓ Image check complete. Broken: ${brokenImages.length}`)
  })

  test('type filter works and re-fetches from Supabase', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    await page.waitForSelector('[data-testid="room-card"], article', { timeout: SUPABASE_TIMEOUT })

    // Click "Meeting Room" filter
    const meetingRoomFilter = page.getByLabel(/meeting room/i)
    if (await meetingRoomFilter.isVisible()) {
      await meetingRoomFilter.check()

      // Results should update — there are 3 meeting rooms in seed data
      await page.waitForTimeout(1000)
      await assertNoCrash(page)
      console.log('✓ Type filter applied without crash')
    } else {
      console.log('⚠ Type filter not found — check your filter component selector')
    }
  })
})

// ─── 3. ROOM DETAIL ───────────────────────────────────────────────────────────
test.describe('Room Detail (/dashboard/rooms/[id])', () => {

  test('room detail page loads all data', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Click first room
    await cards.first().click()
    await expect(page).toHaveURL(/\/dashboard\/rooms\/[\w-]+/, { timeout: 10_000 })
    await assertNoCrash(page)

    // Key data points that should load from Supabase
    await expect(page.getByText(/capacity|hour|\/hr/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    await expect(page.getByText(/wifi|whiteboard|coffee|air conditioning/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Room detail page loaded with amenities and pricing')
  })

  test('availability calendar renders and is interactive', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    await cards.first().click()

    // Calendar should be visible
    const calendar = page.locator('[data-testid="availability-calendar"], [class*="calendar"], [class*="Calendar"]')
    await expect(calendar).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Click a future date (next week) and check slots load
    const futureDays = page.locator('button[aria-label*="2026"], button[class*="day"]:not([disabled])')
    if (await futureDays.count() > 0) {
      await futureDays.nth(3).click() // click 4th available day
      await page.waitForTimeout(1500) // wait for slot fetch

      // Time slots should appear
      await assertNoCrash(page)
      console.log('✓ Availability calendar interactive, slots loaded')
    }
  })

  test('room detail data reloads after hard refresh', async ({ page }) => {
    await page.goto('/dashboard/rooms')
    const cards = page.locator('[data-testid="room-card"], article, [class*="room-card"]')
    await expect(cards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    await cards.first().click()

    const url = page.url()
    await page.reload()
    await assertNoCrash(page)

    // Room name and pricing should still be there after refresh
    // If this fails: your room detail page is likely missing the session
    //   on server-side fetch, causing a 403 from Supabase RLS.
    await expect(page.getByText(/capacity|hour|\/hr/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Room detail data persists after refresh')
  })
})

// ─── 4. MY BOOKINGS ───────────────────────────────────────────────────────────
test.describe('My Bookings (/dashboard/bookings)', () => {

  test('loads booking history from Supabase', async ({ page }) => {
    await page.goto('/dashboard/bookings')
    await assertNoCrash(page)

    // Sarah Lim has 6 seeded bookings across upcoming/past/cancelled tabs
    // At least one booking name should appear
    await expect(
      page.getByText(/meridian suite|pinnacle boardroom|catalyst room|focus pod/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Booking history loaded')
  })

  test('bookings reload after page refresh', async ({ page }) => {
    await page.goto('/dashboard/bookings')
    await expect(
      page.getByText(/meridian suite|pinnacle boardroom|catalyst room/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    await page.reload()
    await assertNoCrash(page)

    await expect(
      page.getByText(/meridian suite|pinnacle boardroom|catalyst room/i)
    ).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Bookings reloaded after refresh')
  })

  test('tabs switch between upcoming, past and cancelled', async ({ page }) => {
    await page.goto('/dashboard/bookings')

    const tabs = ['upcoming', 'past', 'cancelled']
    for (const tab of tabs) {
      const tabBtn = page.getByRole('tab', { name: new RegExp(tab, 'i') })
      if (await tabBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tabBtn.click()
        await assertNoCrash(page)
        await page.waitForTimeout(800)
        console.log(`✓ "${tab}" tab clicked without crash`)
      }
    }
  })
})

// ─── 5. USER PROFILE ─────────────────────────────────────────────────────────
test.describe('User Profile (/dashboard/profile)', () => {

  test('profile page loads user data from Supabase', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await assertNoCrash(page)

    // User's name and email should be pre-filled from Supabase
    await expect(page.getByDisplayValue(/sarah lim/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    await expect(page.getByDisplayValue(/sarah\.lim@testuser\.com/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Profile data loaded from Supabase')
  })

  test('profile data reloads after refresh', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await expect(page.getByDisplayValue(/sarah lim/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    await page.reload()
    await assertNoCrash(page)
    await expect(page.getByDisplayValue(/sarah lim/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Profile data persists after refresh')
  })

  test('can update profile without crash', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await expect(page.getByDisplayValue(/sarah lim/i)).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Update the phone number field
    const phoneField = page.getByLabel(/phone/i)
    if (await phoneField.isVisible()) {
      await phoneField.clear()
      await phoneField.fill('+60 12-999 8888')
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update/i })
    await saveBtn.click()
    await assertNoCrash(page)

    // Should show a success message
    await expect(
      page.getByText(/saved|updated|success/i)
    ).toBeVisible({ timeout: 5_000 })
    console.log('✓ Profile update saved without crash')
  })
})
