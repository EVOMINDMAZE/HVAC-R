import { test as setup, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "password1";
const TECH_EMAIL = "tech@test.com";
const TECH_PASSWORD = "Password123!";
const CLIENT_EMAIL = "client@test.com";
const CLIENT_PASSWORD = "Password123!";
const STUDENT_EMAIL = "student@test.com";
const STUDENT_PASSWORD = "Password123!";

setup("authenticate admin", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.context().storageState({ path: "playwright/.auth/admin.json" });
  console.log("✅ Admin auth state saved");
});

setup("authenticate technician", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[type="email"]', TECH_EMAIL);
  await page.fill('input[type="password"]', TECH_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page
    .context()
    .storageState({ path: "playwright/.auth/technician.json" });
  console.log("✅ Technician auth state saved");
});

setup("authenticate client", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[type="email"]', CLIENT_EMAIL);
  await page.fill('input[type="password"]', CLIENT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.context().storageState({ path: "playwright/.auth/client.json" });
  console.log("✅ Client auth state saved");
});

setup("authenticate student", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[type="email"]', STUDENT_EMAIL);
  await page.fill('input[type="password"]', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.context().storageState({ path: "playwright/.auth/student.json" });
  console.log("✅ Student auth state saved");
});
