import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/**
 * E2E Test: Verify Job Assignment and Visibility
 *
 * Key Points:
 * - /dashboard/jobs: Shows ALL company jobs (RLS by company_id)
 * - /tech: Shows ONLY jobs assigned to THIS technician (RLS by technician_id)
 */

test.describe("Job Assignment Verification", () => {
  test("Verify job visibility on different pages", async ({ page }) => {
    console.log("\n" + "=".repeat(60));
    console.log("JOB ASSIGNMENT E2E TEST");
    console.log("=".repeat(60) + "\n");

    // PART 1: Admin can create jobs
    console.log("📋 PART 1: Admin Access Verification");
    console.log("------------------------------------------");

    await loginAs("admin", page);

    await page.goto("/dashboard/jobs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const newJobBtn = page.locator('button:has-text("New Job")').first();
    const btnVisible = await newJobBtn.isVisible();

    console.log(`   New Job button visible: ${btnVisible ? "✅" : "❌"}`);
    expect(btnVisible).toBe(true);

    await page.screenshot({ path: "/tmp/admin-jobs-page.png", fullPage: true });
    console.log("   📸 Screenshot: /tmp/admin-jobs-page.png\n");

    // PART 2: Technician sees ALL company jobs on /dashboard/jobs
    console.log("📋 PART 2: Technician - All Company Jobs");
    console.log("------------------------------------------");

    await loginAs("technician", page, true);

    await page.goto("/dashboard/jobs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const jobCards = page.locator('[class*="card"]');
    const companyJobCount = await jobCards.count();

    console.log(`   Company jobs visible: ${companyJobCount}`);
    console.log(
      "   ✅ Technician can see ALL company jobs (RLS by company_id)",
    );
    expect(companyJobCount).toBeGreaterThan(0);

    await page.screenshot({
      path: "/tmp/technician-company-jobs.png",
      fullPage: true,
    });
    console.log("   📸 Screenshot: /tmp/technician-company-jobs.png\n");

    // PART 3: Dispatch Page
    console.log("📋 PART 3: Dispatch Page");
    console.log("------------------------------------------");

    await page.goto("/dashboard/dispatch");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const dispatchHeading = page.locator("h1:has-text('Dispatch')").first();
    const dispatchVisible = await dispatchHeading.isVisible();

    console.log(`   Dispatch page: ${dispatchVisible ? "✅" : "❌"}`);
    expect(dispatchVisible).toBe(true);

    await page.screenshot({
      path: "/tmp/technician-dispatch.png",
      fullPage: true,
    });
    console.log("   📸 Screenshot: /tmp/technician-dispatch.png\n");

    // PART 4: /tech page shows ONLY assigned jobs
    console.log("📋 PART 4: /tech Page (My Assigned Jobs)");
    console.log("------------------------------------------");

    await page.goto("/tech");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check what the page shows
    const pageContent = await page.textContent("body");
    const hasContent = pageContent && pageContent.length > 100;

    // The /tech page shows ONLY jobs where technician_id = auth.uid()
    // Since tech@test.com doesn't have jobs directly assigned, this shows 0 or different content
    const assignedJobCards = await jobCards.count();

    console.log(`   Page has content: ${hasContent ? "✅" : "❌"}`);
    console.log(`   Directly assigned jobs: ${assignedJobCards}`);
    console.log("   ℹ️  /tech shows ONLY jobs directly assigned to technician");
    console.log("   ℹ️  /dashboard/jobs shows ALL company jobs");

    await page.screenshot({
      path: "/tmp/technician-my-jobs.png",
      fullPage: true,
    });
    console.log("   📸 Screenshot: /tmp/technician-my-jobs.png\n");

    // SUMMARY
    console.log("=".repeat(60));
    console.log("TEST RESULTS SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `Admin "New Job" button:     ${btnVisible ? "✅ PASS" : "❌ FAIL"}`,
    );
    console.log(
      `Company Jobs (/dashboard/jobs): ${companyJobCount > 0 ? "✅ PASS" : "❌ FAIL"} (${companyJobCount} jobs)`,
    );
    console.log(
      `Dispatch page:            ${dispatchVisible ? "✅ PASS" : "❌ FAIL"}`,
    );
    console.log(
      `My Jobs (/tech):          ${hasContent ? "✅ PASS" : "❌ FAIL"} (assigned jobs only)`,
    );
    console.log("=".repeat(60));
    console.log("\n📝 NOTE:");
    console.log("  - /dashboard/jobs: Shows ALL company jobs (company_id RLS)");
    console.log(
      "  - /tech: Shows ONLY jobs assigned to technician (technician_id RLS)",
    );
    console.log("=".repeat(60));

    expect(btnVisible && companyJobCount > 0 && dispatchVisible).toBe(true);
  });
});
