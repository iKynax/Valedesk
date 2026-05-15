import { defineConfig, devices } from '@playwright/test'

/**
 * VALEDESK PLAYWRIGHT CONFIG
 * Place this file at your project root (same level as package.json)
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run all tests. On CI, fail fast after first failure.
  fullyParallel: false, // Keep false — auth state needs to be sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker so Supabase auth state is predictable

  // Reporter: generates a visual HTML report + a plain text log for AI agents
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['line'], // live output in terminal
  ],

  use: {
    baseURL: 'http://localhost:3000',

    // Captures everything on failure — paste these into your coding agent
    trace: 'on-first-retry',      // .zip trace file with full timeline
    screenshot: 'only-on-failure', // PNG screenshot at point of failure
    video: 'retain-on-failure',    // Video of the failing test run

    // Give Supabase time to respond
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // Setup project: creates authenticated session files that other tests reuse
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // Main test suite — depends on setup
    {
      name: 'valedesk',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Start your Next.js dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Don't restart if already running
    timeout: 60_000,
  },
})
