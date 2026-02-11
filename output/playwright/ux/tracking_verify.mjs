import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");

async function resetEventStore(page) {
  await page.evaluate(() => {
    window.dataLayer = [];
    window.__MARKETING_EVENTS__ = [];
    sessionStorage.setItem("__MARKETING_EVENTS__", "[]");
  });
}

async function readStoredEvents(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem("__MARKETING_EVENTS__") || "[]");
    } catch {
      return [];
    }
  });
}

async function clickAndWaitForUrl(page, locator, destinationPattern) {
  await Promise.all([
    page.waitForURL(destinationPattern, { timeout: 15000 }),
    locator.click(),
  ]);
}

function countByEvent(events) {
  const byEvent = {};
  for (const entry of events) {
    const key = entry?.event || "unknown";
    byEvent[key] = (byEvent[key] || 0) + 1;
  }
  return byEvent;
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "tracking-verification.json");

  const executablePath =
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const checks = [];

  // Landing checks
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await resetEventStore(page);

  await clickAndWaitForUrl(
    page,
    page.locator("main").getByRole("link", { name: /^Start Free$/i }).first(),
    /\/signup/,
  );
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await clickAndWaitForUrl(
    page,
    page.locator("main").getByRole("link", { name: /^Book Ops Demo$/i }).first(),
    /\/contact/,
  );
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: /See full .*tool inventory/i }).first().click();
  await page.getByRole("button", { name: /See Full .*Tool List/i }).first().click();

  await page.locator("#pricing-decision a[href='/pricing']").first().click();
  await page.waitForURL(/\/pricing/, { timeout: 15000 });

  // Pricing checks
  await page.getByRole("button", { name: /^Start Free$/i }).first().click();
  await page.waitForURL(/\/signup/, { timeout: 15000 });
  await page.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: /^Book Ops Demo$/i }).first().click();
  await page.waitForURL(/\/contact/, { timeout: 15000 });

  // Features checks
  await page.goto(`${baseUrl}/features`, { waitUntil: "domcontentloaded" });
  await page
    .locator("main section")
    .first()
    .getByRole("link", { name: /^Start Free$/i })
    .first()
    .click();
  await page.waitForURL(/\/signup/, { timeout: 15000 });
  await page.goto(`${baseUrl}/features`, { waitUntil: "domcontentloaded" });

  await page
    .locator("main section")
    .first()
    .getByRole("link", { name: /^Book Ops Demo$/i })
    .first()
    .click();
  await page.waitForURL(/\/contact/, { timeout: 15000 });

  // Use-cases anchor behavior
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /^Use Cases$/i }).first().click();
  await page.waitForURL(/\/features#use-cases/, { timeout: 15000 });
  await page.waitForTimeout(700);
  const useCasesInView = await page.evaluate(() => {
    const section = document.getElementById("use-cases");
    if (!section) return false;
    const rect = section.getBoundingClientRect();
    return rect.top >= 0 && rect.top <= window.innerHeight * 0.55;
  });
  checks.push({
    check: "use_cases_anchor_navigation",
    passed: useCasesInView,
    details: useCasesInView ? "use-cases section aligned in viewport" : "section not aligned after hash nav",
  });

  const events = await readStoredEvents(page);
  const eventCounts = countByEvent(events);

  const required = [
    "landing_hero_primary_click",
    "landing_hero_secondary_click",
    "landing_view_all_tools_click",
    "landing_inventory_toggle",
    "landing_pricing_cta_click",
    "pricing_plan_cta_click",
    "features_primary_click",
    "features_secondary_click",
  ];

  for (const eventName of required) {
    checks.push({
      check: `event_${eventName}`,
      passed: Number(eventCounts[eventName] || 0) > 0,
      details: `count=${eventCounts[eventName] || 0}`,
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks,
    eventCounts,
    sampleEvents: events.slice(-20),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await browser.close();

  console.log(`TRACKING_REPORT=${reportPath}`);
  console.log(`TRACKING_PASSED=${checks.every((item) => item.passed)}`);
})();
