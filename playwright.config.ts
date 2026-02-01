import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 }, // Increased for better headless stability
  fullyParallel: true,
  retries: 1, // Added 1 retry to use tracing on failure
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1400, height: 900 },
    actionTimeout: 15_000,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    ignoreHTTPSErrors: true,

    // Optimizing Headless Performance & Debuggability
    trace: 'on-first-retry',    // Record trace on failure for visual debugging
    screenshot: 'only-on-failure',   // Take screenshot on failure
    video: 'retain-on-failure', // Record video on failure

    launchOptions: {
      args: ['--enable-gpu', '--use-gl=egl'], // Hardware acceleration for faster rendering
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

