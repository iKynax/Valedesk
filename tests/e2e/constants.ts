/**
 * tests/e2e/constants.ts
 * Shared test credentials and selectors for Valedesk tests.
 * Uses the seed accounts from the Codex prompt.
 */

export const TEST_USERS = {
  regular: {
    email: 'sarah.lim@testuser.com',
    password: 'TestUser123!',
    name: 'Sarah Lim',
  },
  regular2: {
    email: 'raj.kumar@testuser.com',
    password: 'TestUser123!',
    name: 'Raj Kumar',
  },
  admin: {
    email: 'admin@valedesk.co',
    password: 'AdminVale2024!',
    name: 'Valedesk Admin',
  },
}

// Where Playwright saves authenticated browser state so tests skip login
export const AUTH_STATE = {
  regular: 'playwright/.auth/regular-user.json',
  admin:   'playwright/.auth/admin-user.json',
}

// Stripe test card that always succeeds
export const STRIPE_TEST_CARD = {
  number:  '4242 4242 4242 4242',
  expiry:  '12/30',
  cvc:     '123',
  name:    'Sarah Lim',
}

// How long to wait for Supabase data to appear after navigation
export const SUPABASE_TIMEOUT = 10_000