import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 }, // Increased for better headless stability
  fullyParallel: true,
  retries: 1, // Added 1 retry to use tracing on failure
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    headless: true,
    viewport: { width: 1400, height: 900 },
    actionTimeout: 15_000,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",
    ignoreHTTPSErrors: true,

    // Optimizing Headless Performance & Debuggability
    trace: "on-first-retry", // Record trace on failure for visual debugging
    screenshot: "only-on-failure", // Take screenshot on failure
    video: "retain-on-failure", // Record video on failure

    launchOptions: {
      args: ["--enable-gpu", "--use-gl=egl"], // Hardware acceleration for faster rendering
    },
  },
  projects: [
    // Default project - no authentication (for public pages)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Avoid double-running role-scoped tests which have their own projects/storageState.
      testIgnore: [
        "**/admin/**",
        "**/technician/**",
        "**/client/**",
        "**/student/**",
      ],
    },

    // Role-based projects with storageState for faster test execution
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          process.env.PLAYWRIGHT_ADMIN_STORAGE || "playwright/.auth/admin.json",
      },
      testMatch: "**/admin/**/*.spec.ts",
    },

    {
      name: "technician",
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          process.env.PLAYWRIGHT_TECHNICIAN_STORAGE ||
          "playwright/.auth/technician.json",
      },
      testMatch: "**/technician/**/*.spec.ts",
    },

    {
      name: "client",
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          process.env.PLAYWRIGHT_CLIENT_STORAGE ||
          "playwright/.auth/client.json",
      },
      testMatch: "**/client/**/*.spec.ts",
    },

    {
      name: "student",
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          process.env.PLAYWRIGHT_STUDENT_STORAGE ||
          "playwright/.auth/student.json",
      },
      testMatch: "**/student/**/*.spec.ts",
    },
  ],
});
