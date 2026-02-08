#!/usr/bin/env tsx
import { chromium, Browser, Page } from "@playwright/test";
import fs from "fs";

interface ConsoleMessage {
  timestamp: string;
  type: "log" | "error" | "warning" | "info" | "debug";
  text: string;
  location?: {
    url: string;
    lineNumber?: number;
  };
}

interface NetworkRequest {
  timestamp: string;
  url: string;
  method: string;
  status: number;
  type: string;
}

interface TestResult {
  session: {
    startTime: string;
    url: string;
  };
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  errors: string[];
  warnings: string[];
  testResults: {
    loginSuccess: boolean;
    dashboardLoadSuccess: boolean;
    companySwitcherVisible: boolean;
    companiesCount: number;
  };
}

async function runAuthenticatedTest() {
  const consoleMessages: ConsoleMessage[] = [];
  const networkRequests: NetworkRequest[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const testResults = {
    loginSuccess: false,
    dashboardLoadSuccess: false,
    companySwitcherVisible: false,
    companiesCount: 0,
  };

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const type = msg.type() as ConsoleMessage["type"];
    const text = msg.text();
    consoleMessages.push({
      timestamp: new Date().toISOString(),
      type,
      text,
      location: { url: msg.location().url || "" },
    });

    if (type === "error") {
      errors.push(text);
      console.log("[ERROR] " + text);
    } else if (type === "warning") {
      warnings.push(text);
    } else if (text.includes("[CompanySwitcher]")) {
      console.log("[CompanySwitcher Log] " + text);
    } else if (text.includes("[useSupabaseAuth]")) {
      console.log("[Auth Log] " + text);
    } else if (text.includes("[Dashboard]")) {
      console.log("[Dashboard Log] " + text);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.log("[PAGE ERROR] " + error.message);
  });

  page.on("response", (response) => {
    networkRequests.push({
      timestamp: new Date().toISOString(),
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
      type: response.request().resourceType(),
    });
  });

  try {
    console.log("Step 1: Navigating to signin page...");
    await page.goto("http://localhost:8080/signin", {
      waitUntil: "networkidle",
    });
    console.log("✓ Signin page loaded");

    console.log("Step 2: Filling in credentials...");
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });
    await page.fill(
      'input[type="email"], input[name="email"]',
      "admin@admin.com",
    );
    await page.fill(
      'input[type="password"], input[name="password"]',
      "ThermoAdmin$2026!",
    );
    console.log("✓ Credentials entered");

    console.log("Step 3: Clicking sign in button...");
    const signInButton = page
      .locator('button[type="submit"], button:has-text("Sign")')
      .first();
    await signInButton.click();

    console.log("Step 4: Waiting for navigation to dashboard...");
    await page.waitForURL("**/dashboard**", { timeout: 30000 }).catch(() => {
      console.log("⚠️ Did not navigate to dashboard automatically");
    });
    console.log("✓ Current URL: " + page.url());

    console.log("Step 5: Waiting for dashboard to fully load...");
    await page.waitForTimeout(5000);

    const url = page.url();
    testResults.loginSuccess = url.includes("/dashboard");

    console.log("\n--- Checking Dashboard Elements ---");

    const pageContent = await page.content();
    testResults.companySwitcherVisible =
      pageContent.includes("company") || pageContent.includes("Select Team");
    console.log(
      "Company switcher visible: " + testResults.companySwitcherVisible,
    );

    console.log("\n--- Collecting Auth State Info ---");
    const authState = await page.evaluate(() => {
      try {
        const authElement = document.querySelector(
          '[class*="auth"], [class*="user"]',
        );
        return authElement
          ? authElement.textContent?.substring(0, 100)
          : "No auth element found";
      } catch {
        return "Error collecting auth state";
      }
    });
    console.log("Auth element: " + authState);

    testResults.dashboardLoadSuccess = url.includes("/dashboard");

    console.log("\n--- Waiting for Company Data ---");
    await page.waitForTimeout(3000);

    const companiesInfo = await page.evaluate(() => {
      try {
        const logs = window.performance.getEntriesByType("log");
        return logs.map((l: any) => l.name).join(", ");
      } catch {
        return "Cannot access performance logs";
      }
    });

    console.log("\n--- Final Summary ---");
    console.log("Login Success: " + testResults.loginSuccess);
    console.log("Dashboard Load: " + testResults.dashboardLoadSuccess);
    console.log("Current URL: " + page.url());
    console.log("Errors found: " + errors.length);
    console.log("Console logs: " + consoleMessages.length);
  } catch (error) {
    console.error("Test error:", error);
    errors.push(String(error));
  } finally {
    await browser.close();

    const result: TestResult = {
      session: {
        startTime: new Date().toISOString(),
        url: "http://localhost:8080",
      },
      consoleMessages,
      networkRequests,
      errors,
      warnings,
      testResults,
    };

    fs.writeFileSync(
      "authenticated-test-results.json",
      JSON.stringify(result, null, 2),
    );
    console.log("\n✅ Results saved to authenticated-test-results.json");

    console.log("\n=== ERRORS ===");
    errors.forEach((e, i) => console.log(i + 1 + ". " + e.substring(0, 200)));
  }
}

runAuthenticatedTest().catch(console.error);
