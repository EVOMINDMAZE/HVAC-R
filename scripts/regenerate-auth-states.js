#!/usr/bin/env node
/**
 * Script to regenerate Playwright auth state files
 * This logs in as each test user via the Supabase Auth API and saves the session
 */

const fs = require("fs");
const path = require("path");

// Supabase credentials
const SUPABASE_URL = "https://rxqflxmzsqhqrzffcsej.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDY2MTAsImV4cCI6MjA2ODg4MjYxMH0.MpW545_SkWroAwSd2WIwZ2jp2RNaNf7YGOGLrjyoUAw";

// Test users
const USERS = [
  { email: "admin@admin.com", password: "password1", role: "admin" },
  { email: "tech@test.com", password: "Password123!", role: "technician" },
  { email: "client@test.com", password: "Password123!", role: "client" },
  { email: "student@test.com", password: "Password123!", role: "student" },
];

async function login(email, password) {
  console.log(`\nLogging in as ${email}...`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Login failed: ${data.message || response.statusText}`);
      return null;
    }

    console.log(`✅ Login successful!`);
    return data;
  } catch (error) {
    console.error(`❌ Login error: ${error.message}`);
    return null;
  }
}

async function saveAuthState(user, session, outputPath) {
  // Create Playwright-compatible storage state
  const storageState = {
    cookies: session.access_token
      ? [
          {
            name: "sb-access-token",
            value: session.access_token,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            expires: session.expires_at
              ? Math.floor(new Date(session.expires_at * 1000).getTime() / 1000)
              : -1,
          },
        ]
      : [],
    origins: [
      {
        origin: "http://localhost:3001",
        localStorage: session.access_token
          ? [
              {
                name: `${new URL(SUPABASE_URL).hostname}-auth-token`,
                value: JSON.stringify(session),
              },
            ]
          : [],
      },
    ],
  };

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(storageState, null, 2));
  console.log(`✅ Saved auth state to ${outputPath}`);
}

async function main() {
  console.log("=== Regenerating Playwright Auth States ===\n");

  const outputDir = path.join(__dirname, "playwright/.auth");

  for (const user of USERS) {
    const session = await login(user.email, user.password);

    if (session) {
      const outputPath = path.join(outputDir, `${user.role}.json`);
      await saveAuthState(user, session, outputPath);
    }
  }

  console.log("\n=== Done! ===");
  console.log("Note: Auth tokens expire. Re-run this script if tests fail.");
}

main().catch(console.error);
