import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

const captureScreenshot = async (page: any, name: string) => {
    const screenshotPath = path.join(screenshotsDir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[Screenshot] Captured: ${name}.png`);
};

test.describe("9 Scenarios Live Navigation Verification", () => {
    
    test.beforeEach(async ({ page }) => {
        // Log errors
        page.on("console", (msg) => {
            if (msg.type() === "error") console.log(`[BROWSER ERROR] ${msg.text()}`);
        });
    });

    // SCENARIO 1: Multi-Company Selection Flow
    test("Scenario 1: Multi-Company Selection Flow", async ({ page }) => {
        console.log("Starting Scenario 1...");
        
        // 1. Sign In
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        
        // 2. Expected: Redirect to /select-company
        await page.waitForURL("**/select-company", { timeout: 15000 });
        await captureScreenshot(page, "s1_step1_select_company");
        
        // 3. Verify selection cards
        await expect(page.locator("text=ThermoTech HVAC")).toBeVisible();
        await expect(page.locator("text=Demo Company")).toBeVisible();
        
        // 4. Select First Company
        await page.click("text=ThermoTech HVAC");
        await page.waitForURL("**/dashboard", { timeout: 15000 });
        await captureScreenshot(page, "s1_step2_dashboard_thermo");
        
        // 5. Switch to Second Company
        // Click banner/profile menu to switch
        await page.click('[data-testid="user-menu"], .user-menu-button, #user-menu-button'); // Adjust selector as needed
        await page.click("text=Switch Company");
        await page.waitForURL("**/select-company");
        
        await page.click("text=Demo Company");
        await page.waitForURL("**/dashboard");
        await captureScreenshot(page, "s1_step3_dashboard_demo");
    });

    // SCENARIO 2: Invitation Link System
    test("Scenario 2: Invitation Link System", async ({ page, context }) => {
        console.log("Starting Scenario 2...");
        
        // 1. Login as Admin
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/select-company");
        await page.click("text=ThermoTech HVAC");
        
        // 2. Navigate to /invite-team
        await page.goto("/invite-team");
        await captureScreenshot(page, "s2_step1_invite_page");
        
        // 3. Generate New Code
        await page.click("text=Generate New Code");
        const codeElement = page.locator("div.bg-muted.font-mono.text-2xl");
        await expect(codeElement).toBeVisible();
        const inviteCode = await codeElement.textContent();
        console.log(`Generated Code: ${inviteCode}`);
        await captureScreenshot(page, "s2_step2_code_generated");
        
        // 4. Join with Invitation Link (Incognito Simulation via new context)
        const newPage = await context.newPage();
        await newPage.goto("/join-company");
        await newPage.fill('input[name="code"]', inviteCode || "");
        // Wait for validation and button to become enabled
        await newPage.waitForSelector('button:not([disabled]):has-text("INITIALIZE CONNECTION")');
        await newPage.click('button:not([disabled]):has-text("INITIALIZE CONNECTION")');
        
        // Expect success or redirect to dashboard
        await newPage.waitForURL("**/dashboard");
        await captureScreenshot(newPage, "s2_step3_joined_success");
    });

    // SCENARIO 3: RBAC
    test("Scenario 3: Role-Based Access Control", async ({ page }) => {
        console.log("Starting Scenario 3...");
        
        // 1. Admin Full Access
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/dashboard");
        
        const adminPaths = ["/dashboard", "/settings/company", "/invite-team"];
        for (const path of adminPaths) {
            await page.goto(path);
            await expect(page.locator("body")).not.toContainText("Access Denied");
        }
        
        // 2. Technician Limited Access
        await page.goto("/signin");
        await page.fill('input[type="email"]', "tech@test.com");
        await page.fill('input[type="password"]', "Password123!");
        await page.click('button[type="submit"]');
        
        // Tech should be redirected to /tech or have limited dashboard
        await page.waitForURL(url => url.pathname.includes("/tech") || url.pathname.includes("/dashboard"));
        await captureScreenshot(page, "s3_step1_tech_access");
        
        // Try to access admin-only settings
        await page.goto("/settings/company");
        // Should show error or redirect
        await captureScreenshot(page, "s3_step2_tech_restricted");
    });

    // SCENARIO 4: Company Settings Management
    test("Scenario 4: Company Settings Management", async ({ page }) => {
        console.log("Starting Scenario 4...");
        
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/select-company");
        await page.click("text=ThermoTech HVAC");
        
        await page.goto("/settings/company");
        await captureScreenshot(page, "s4_step1_settings_general");
        
        // Switch Tabs
        const tabs = ["Branding", "Notifications", "Regional", "Integrations"];
        for (const tab of tabs) {
            await page.click(`text=${tab}`);
            await captureScreenshot(page, `s4_step2_settings_${tab.toLowerCase()}`);
        }
    });

    // SCENARIO 5: Seat Limits & Subscriptions
    test("Scenario 5: Seat Limits & Subscriptions", async ({ page }) => {
        console.log("Starting Scenario 5...");
        
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/select-company");
        await page.click("text=ThermoTech HVAC");
        
        await page.goto("/settings/company");
        await expect(page.locator("text=seats used")).toBeVisible();
        await captureScreenshot(page, "s5_step1_subscription_info");
    });

    // SCENARIO 7: Cross-Company Operations
    test("Scenario 7: Cross-Company Operations", async ({ page }) => {
        console.log("Starting Scenario 7...");
        
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        
        // Select First Company
        await page.waitForURL("**/select-company");
        await page.click("text=ThermoTech HVAC");
        await expect(page.locator(".company-banner, .company-name")).toContainText("ThermoTech HVAC");
        
        // Switch to Second
        await page.click('[data-testid="user-menu"]');
        await page.click("text=Switch Company");
        await page.click("text=Demo Company");
        await expect(page.locator(".company-banner, .company-name")).toContainText("Demo Company");
        await captureScreenshot(page, "s7_step1_company_isolation");
    });

    // SCENARIO 9: Edge Cases
    test("Scenario 9: Edge Cases - Session Management", async ({ page }) => {
        console.log("Starting Scenario 9...");
        
        await page.goto("/signin");
        await page.fill('input[type="email"]', "admin@admin.com");
        await page.fill('input[type="password"]', "ThermoAdmin$2026!");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/select-company");
        
        // Logout
        await page.click('[data-testid="user-menu"]');
        await page.click("text=Sign Out");
        await page.waitForURL("**/signin");
        await captureScreenshot(page, "s9_step1_logout_success");
        
        // Try to access dashboard while logged out
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/signin/);
    });
});
