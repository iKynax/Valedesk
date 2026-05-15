// /**
//  * tests/e2e/admin.spec.ts
//  * Tests for the admin dashboard — data loading and access control.
//  */

// import { test, expect } from '@playwright/test'
// import { AUTH_STATE, SUPABASE_TIMEOUT } from './constants'

// test.describe('Admin Dashboard', () => {
//   test.use({ storageState: AUTH_STATE.admin })

//   test('admin overview loads stats from Supabase', async ({ page }) => {
//     await page.goto('/admin')
//     await expect(page.getByText(/total bookings|revenue|active users|occupancy/i))
//       .toBeVisible({ timeout: SUPABASE_TIMEOUT })
//     console.log('✓ Admin stats loaded')
//   })

//   test('admin can view all rooms', async ({ page }) => {
//     await page.goto('/admin/rooms')
//     // Should see all 12 seeded rooms (including inactive ones)
//     await expect(page.getByText(/meridian suite|pinnacle boardroom/i))
//       .toBeVisible({ timeout: SUPABASE_TIMEOUT })
//   })

//   test('admin can view all bookings across all users', async ({ page }) => {
//     await page.goto('/admin/bookings')
//     // Should see bookings from both sarah and raj (seeded)
//     await expect(page.getByText(/VD-|meridian|catalyst/i))
//       .toBeVisible({ timeout: SUPABASE_TIMEOUT })
//   })

//   test('admin analytics page loads without crash', async ({ page }) => {
//     await page.goto('/admin/analytics')
//     // Charts (Recharts) should render
//     await expect(page.locator('.recharts-wrapper, [class*="chart"]'))
//       .toBeVisible({ timeout: SUPABASE_TIMEOUT })
//   })
// })
