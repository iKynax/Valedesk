/**
 * tests/e2e/auth.spec.ts
 *
 * Tests for: login, signup, session persistence after refresh,
 * protected route redirection, and logout.
 *
 * These tests directly target your reported issue:
 * "issues with login/signing up process with storing login tokens/session handling"
 */

import { test, expect } from '@playwright/test'
import { TEST_USERS, AUTH_STATE, SUPABASE_TIMEOUT } from './constants'

// ─── 1. EMAIL LOGIN ───────────────────────────────────────────────────────────
test.describe('Email Authentication', () => {

  test('should log in with valid email and password', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible()

    await page.getByLabel(/email/i).fill(TEST_USERS.regular.email)
    await page.getByLabel(/password/i).fill(TEST_USERS.regular.password)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard — if this fails, check:
    // 1. Is supabase.auth.signInWithPassword() being called?
    // 2. Is there a router.push('/dashboard') after successful sign-in?
    // 3. Check the screenshot for the actual error message shown
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(TEST_USERS.regular.email)
    await page.getByLabel(/password/i).fill('WrongPassword999!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should stay on /auth and show an error — NOT crash or redirect
    await expect(page).toHaveURL(/\/auth/)
    await expect(
      page.getByText(/invalid|incorrect|wrong|error/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill('doesnotexist@nowhere.com')
    await page.getByLabel(/password/i).fill('SomePassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/auth/)
    await expect(
      page.getByText(/invalid|not found|error/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('should block empty form submission', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should NOT navigate away — form validation should catch it
    await expect(page).toHaveURL(/\/auth/)
  })
})

// ─── 2. SESSION PERSISTENCE (your main reported issue) ───────────────────────
test.describe('Session Persistence', () => {
  // These tests USE the saved auth state — they start already logged in
  test.use({ storageState: AUTH_STATE.regular })

  test('session survives a full page refresh', async ({ page }) => {
    // Start on dashboard (already logged in via saved state)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    // Hard refresh — this is exactly what users experience
    await page.reload()

    // ─── This is the critical assertion ───────────────────────────────────
    // If this fails after reload, your issue is in how Supabase session
    // cookies are being read on the server side.
    // FIX: Ensure your middleware.ts calls updateSession() correctly,
    //      and that your server component reads auth via createClient() from
    //      @/lib/supabase/server (NOT the browser client).
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/auth/)
    console.log('✓ Session persisted through page refresh')
  })

  test('session survives navigation between pages', async ({ page }) => {
    await page.goto('/dashboard')
    await page.goto('/dashboard/rooms')
    await page.goto('/dashboard/bookings')
    await page.goto('/dashboard/profile')

    // Should still be authenticated throughout
    await expect(page).not.toHaveURL(/\/auth/)
    console.log('✓ Session maintained across multiple navigations')
  })

  test('Supabase data loads after navigating back from room detail', async ({ page }) => {
    // Go to browse rooms
    await page.goto('/dashboard/rooms')

    // Wait for room cards to appear (Supabase fetch)
    // Adjust selector to match your actual room card element
    const roomCards = page.locator('[data-testid="room-card"], .room-card, [class*="room-card"]')
    await expect(roomCards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })

    // Click first room
    await roomCards.first().click()
    await expect(page).toHaveURL(/\/dashboard\/rooms\//)

    // Navigate back
    await page.goBack()

    // ─── Data reload check ─────────────────────────────────────────────────
    // If this fails after back-navigation, your issue is likely that you're
    // not handling loading states correctly — data fetched on first visit
    // is not re-fetched (or cached) on return.
    // FIX: Use React Query's staleTime, or ensure useEffect re-runs on mount.
    await expect(roomCards.first()).toBeVisible({ timeout: SUPABASE_TIMEOUT })
    console.log('✓ Room data reloaded after back navigation')
  })

  test('protected dashboard is not accessible without auth', async ({ browser }) => {
    // Create a fresh context with NO saved state (logged-out user)
    const freshContext = await browser.newContext()
    const page = await freshContext.newPage()

    await page.goto('/dashboard')

    // Should redirect to /auth — middleware.ts handles this
    // If this fails, your middleware.ts is not running or has a bug
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 })
    console.log('✓ Unauthenticated user redirected from /dashboard')

    await freshContext.close()
  })

  test('protected admin is not accessible to regular user', async ({ page }) => {
    await page.goto('/admin')

    // Regular user should be redirected away from /admin
    // Should go to /dashboard (not /auth, since they ARE logged in)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
    console.log('✓ Regular user blocked from /admin')
  })
})

// ─── 3. SIGN UP ───────────────────────────────────────────────────────────────
test.describe('Sign Up Flow', () => {
  // Fresh context — no auth state
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should create a new account with email', async ({ page }) => {
    const timestamp = Date.now()
    const email = `testuser+${timestamp}@playwright.dev`

    await page.goto('/auth')

    // Switch to sign-up tab
    await page.getByRole('tab', { name: /sign up|create/i }).click()

    await page.getByLabel(/full name/i).fill('Playwright Test User')
    await page.getByLabel(/email/i).fill(email)

    // Fill password fields (there may be two — password + confirm password)
    const passwordFields = page.getByLabel(/password/i)
    await passwordFields.nth(0).fill('PlaywrightTest123!')
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill('PlaywrightTest123!')
    }

    // Accept terms if there's a checkbox
    const termsCheckbox = page.getByRole('checkbox')
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check()
    }

    await page.getByRole('button', { name: /create account|sign up/i }).click()

    // After sign-up, should either:
    // A) Redirect to /dashboard (if email confirm is disabled in Supabase)
    // B) Show a "check your email" message
    // The test passes either way — we just confirm no crash
    const isOnDashboard = await page.waitForURL(/\/dashboard/, { timeout: 10_000 }).then(() => true).catch(() => false)
    const showsConfirmMessage = await page.getByText(/check your email|confirm|verify/i).isVisible().catch(() => false)

    expect(isOnDashboard || showsConfirmMessage).toBeTruthy()
    console.log(`✓ Sign-up completed. On dashboard: ${isOnDashboard}`)
  })
})

// ─── 4. LOGOUT ────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test.use({ storageState: AUTH_STATE.regular })

  test('should log out and redirect to home page', async ({ page }) => {
    await page.goto('/dashboard')

    // Find and click logout — adjust selector to match your sidebar/nav
    // Common patterns: button with "Sign Out" text, or a logout icon in sidebar
    const logoutBtn = page.getByRole('button', { name: /sign out|logout|log out/i })
    await expect(logoutBtn).toBeVisible({ timeout: 10_000 })
    await logoutBtn.click()

    // Handle confirmation dialog if you have one
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i })
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    // Should land on home or auth page after logout
    await expect(page).toHaveURL(/^\/$|\/auth/, { timeout: 10_000 })
    console.log('✓ Logged out successfully')

    // Verify dashboard is no longer accessible
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 })
    console.log('✓ Dashboard inaccessible after logout')
  })
})
