/**
 * tests/e2e/auth.setup.ts
 *
 * This runs ONCE before all other tests.
 * It logs in as each test user and saves the browser session (cookies + localStorage)
 * to a file. All subsequent tests load from this file — no repeated logins.
 *
 * This is the correct fix for "session not persisting" — Playwright stores the
 * exact same session tokens your browser would, so if session persists here,
 * it tells you the issue is in your app code (not the test).
 */

import { test as setup, expect } from '@playwright/test'
import { TEST_USERS, AUTH_STATE } from './constants'

// ─── REGULAR USER SESSION ────────────────────────────────────────────────────
setup('authenticate as regular user', async ({ page }) => {
  console.log('\n[SETUP] Logging in as regular user...')
  await page.goto('/auth')

  // Wait for the auth form to be ready
  await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })

  // Fill sign-in form
  await page.getByLabel(/email/i).fill(TEST_USERS.regular.email)
  await page.getByLabel(/password/i).fill(TEST_USERS.regular.password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // ─── CRITICAL CHECK: Session persistence ─────────────────────────────────
  // If this fails, it means your auth flow is not redirecting after login,
  // OR the session is not being set in cookies/localStorage correctly.
  // Look at the screenshot in playwright-report/ for what the page looks like.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  console.log('[SETUP] Reached dashboard ✓')

  // Verify the page actually loaded user data (not just redirected to a blank dashboard)
  // Adjust the selector to match your actual dashboard welcome text
  await expect(
    page.getByText(/good morning|good afternoon|good evening|welcome/i)
  ).toBeVisible({ timeout: 10_000 })
  console.log('[SETUP] Dashboard data loaded ✓')

  // Save session state to file — all regular user tests load from this
  await page.context().storageState({ path: AUTH_STATE.regular })
  console.log(`[SETUP] Session saved to ${AUTH_STATE.regular}`)
})

// ─── ADMIN USER SESSION ───────────────────────────────────────────────────────
// setup('authenticate as admin', async ({ page }) => {
//   console.log('\n[SETUP] Logging in as admin...')
//   await page.goto('/auth')

//   await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })

//   await page.getByLabel(/email/i).fill(TEST_USERS.admin.email)
//   await page.getByLabel(/password/i).fill(TEST_USERS.admin.password)
//   await page.getByRole('button', { name: /sign in/i }).click()

//   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

//   await page.context().storageState({ path: AUTH_STATE.admin })
//   console.log(`[SETUP] Admin session saved to ${AUTH_STATE.admin}`)
// })
