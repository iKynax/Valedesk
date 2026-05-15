# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as regular user
- Location: tests\e2e\auth.setup.ts:17:1

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e7]:
      - link "Valedesk" [ref=e8] [cursor=pointer]:
        - /url: /
        - text: Valedesk
      - generic [ref=e11]:
        - generic [ref=e12]: Booking access
        - heading "Your space. Your flow." [level=2] [ref=e14]:
          - text: Your
          - text: space.
          - text: Your
          - text: flow.
        - paragraph [ref=e15]: Join forward-thinking teams bridging remote freedom with premium physical spaces.
      - generic [ref=e16]:
        - generic [ref=e17]: "*****"
        - paragraph [ref=e18]: "\"The booking system is frictionless and the spaces are amazing. It transformed how our remote team collaborates.\""
        - generic [ref=e19]:
          - img "James K." [ref=e20]
          - generic [ref=e21]:
            - paragraph [ref=e22]: James K.
            - paragraph [ref=e23]: Engineering Lead
    - generic [ref=e26]:
      - tablist [ref=e27]:
        - tab "Sign In" [selected] [ref=e28]
        - tab "Sign Up" [ref=e29]
      - tabpanel "Sign In" [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]:
            - heading "Welcome Back" [level=1] [ref=e33]
            - paragraph [ref=e34]: Enter your details to access your dashboard
          - generic [ref=e35]:
            - generic [ref=e36]:
              - text: Email Address
              - textbox "you@company.com" [ref=e37]
            - generic [ref=e38]:
              - generic [ref=e39]:
                - generic [ref=e40]: Password
                - link "Forgot?" [ref=e41] [cursor=pointer]:
                  - /url: "#"
              - textbox "********" [ref=e42]
            - button "Sign In" [ref=e43]
          - generic [ref=e44]: OR CONTINUE WITH
          - button "Google" [ref=e45]
  - button "Open Vale AI" [ref=e47]:
    - img [ref=e49]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | /**
  2  |  * tests/e2e/auth.setup.ts
  3  |  *
  4  |  * This runs ONCE before all other tests.
  5  |  * It logs in as each test user and saves the browser session (cookies + localStorage)
  6  |  * to a file. All subsequent tests load from this file — no repeated logins.
  7  |  *
  8  |  * This is the correct fix for "session not persisting" — Playwright stores the
  9  |  * exact same session tokens your browser would, so if session persists here,
  10 |  * it tells you the issue is in your app code (not the test).
  11 |  */
  12 | 
  13 | import { test as setup, expect } from '@playwright/test'
  14 | import { TEST_USERS, AUTH_STATE } from './constants'
  15 | 
  16 | // ─── REGULAR USER SESSION ────────────────────────────────────────────────────
  17 | setup('authenticate as regular user', async ({ page }) => {
  18 |   console.log('\n[SETUP] Logging in as regular user...')
  19 |   await page.goto('/auth')
  20 | 
  21 |   // Wait for the auth form to be ready
  22 |   await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })
  23 | 
  24 |   // Fill sign-in form
> 25 |   await page.getByLabel(/email/i).fill(TEST_USERS.regular.email)
     |                                   ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  26 |   await page.getByLabel(/password/i).fill(TEST_USERS.regular.password)
  27 |   await page.getByRole('button', { name: /sign in/i }).click()
  28 | 
  29 |   // ─── CRITICAL CHECK: Session persistence ─────────────────────────────────
  30 |   // If this fails, it means your auth flow is not redirecting after login,
  31 |   // OR the session is not being set in cookies/localStorage correctly.
  32 |   // Look at the screenshot in playwright-report/ for what the page looks like.
  33 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  34 |   console.log('[SETUP] Reached dashboard ✓')
  35 | 
  36 |   // Verify the page actually loaded user data (not just redirected to a blank dashboard)
  37 |   // Adjust the selector to match your actual dashboard welcome text
  38 |   await expect(
  39 |     page.getByText(/good morning|good afternoon|good evening|welcome/i)
  40 |   ).toBeVisible({ timeout: 10_000 })
  41 |   console.log('[SETUP] Dashboard data loaded ✓')
  42 | 
  43 |   // Save session state to file — all regular user tests load from this
  44 |   await page.context().storageState({ path: AUTH_STATE.regular })
  45 |   console.log(`[SETUP] Session saved to ${AUTH_STATE.regular}`)
  46 | })
  47 | 
  48 | // ─── ADMIN USER SESSION ───────────────────────────────────────────────────────
  49 | // setup('authenticate as admin', async ({ page }) => {
  50 | //   console.log('\n[SETUP] Logging in as admin...')
  51 | //   await page.goto('/auth')
  52 | 
  53 | //   await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible({ timeout: 10_000 })
  54 | 
  55 | //   await page.getByLabel(/email/i).fill(TEST_USERS.admin.email)
  56 | //   await page.getByLabel(/password/i).fill(TEST_USERS.admin.password)
  57 | //   await page.getByRole('button', { name: /sign in/i }).click()
  58 | 
  59 | //   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  60 | 
  61 | //   await page.context().storageState({ path: AUTH_STATE.admin })
  62 | //   console.log(`[SETUP] Admin session saved to ${AUTH_STATE.admin}`)
  63 | // })
  64 | 
```