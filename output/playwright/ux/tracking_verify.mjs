import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

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

function toDestinationPattern(destination) {
  if (destination instanceof RegExp) {
    return destination;
  }

  const escaped = String(destination).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?:[/?#]|$)`, "i");
}

async function clickAndWaitForUrl(page, locator, destinationPatterns) {
  const expectedPatterns = (Array.isArray(destinationPatterns)
    ? destinationPatterns
    : [destinationPatterns]
  ).map(toDestinationPattern);

  await locator.waitFor({ state: "visible", timeout: 10000 });
  await locator.scrollIntoViewIfNeeded();

  const href = await locator.getAttribute("href");
  if (href) {
    try {
      const inferredPath = new URL(href, page.url()).pathname;
      expectedPatterns.push(toDestinationPattern(inferredPath));
    } catch {
      // Ignore malformed href values and continue with explicit expectations.
    }
  }

  const waitForAnyDestination = Promise.race(
    expectedPatterns.map((pattern) =>
      page.waitForURL(pattern, { timeout: 15000 }),
    ),
  );

  await Promise.all([
    waitForAnyDestination,
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

  const { browser } = await launchChromium({ headed });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const checks = [];

  // Landing checks
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await resetEventStore(page);
  // Re-trigger landing view tracking after reset.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(350);

  await clickAndWaitForUrl(
    page,
    page
      .locator("main")
      .getByRole("link", {
        name: /^(Start 14-Day Free Trial|Start Your Free Trial|Start Free Trial|Start Free|Start Engineering Free)$/i,
      })
      .first(),
    /\/signup/,
  );
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await clickAndWaitForUrl(
    page,
    page
      .locator("main")
      .getByRole("link", {
        name: /^(Watch 3-Min Demo|Watch Strategy Video|Book Ops Demo|Book an Ops Demo|Book Business Ops Demo)$/i,
      })
      .first(),
    [/\/demo/, /\/contact/],
  );
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page
    .locator(".core-module-item")
    .filter({ hasText: "Profit Guard" })
    .first()
    .click();
  await page.waitForTimeout(250);

  await page
    .getByRole("button", { name: /How does the AI diagnostics system work\?/i })
    .first()
    .click();
  await page.waitForTimeout(250);

  await clickAndWaitForUrl(
    page,
    page
      .locator("main")
      .getByRole("link", { name: /^Systemize Your Business$/i })
      .first(),
    /\/signup/,
  );

  // Pricing checks
  await page.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });
  await clickAndWaitForUrl(
    page,
    page.getByRole("button", { name: /^Start Free$/i }).first(),
    /\/signup/,
  );
  await page.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });

  await clickAndWaitForUrl(
    page,
    page.getByRole("button", { name: /^Book Ops Demo$/i }).first(),
    /\/contact/,
  );

  // Features checks
  await page.goto(`${baseUrl}/features`, { waitUntil: "domcontentloaded" });
  await clickAndWaitForUrl(
    page,
    page
      .locator("main section")
      .first()
      .getByRole("link", { name: /^Start Free$/i })
      .first(),
    /\/signup/,
  );
  await page.goto(`${baseUrl}/features`, { waitUntil: "domcontentloaded" });

  await clickAndWaitForUrl(
    page,
    page
      .locator("main section")
      .first()
      .getByRole("link", { name: /^Book Ops Demo$/i })
      .first(),
    /\/contact/,
  );

  // Use-cases anchor behavior
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /^Use Cases$/i }).first().click();
  await page.waitForFunction(() => window.location.hash === "#use-cases", {
    timeout: 15000,
  });
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
    "landing_view",
    "landing_hero_primary_click",
    "landing_hero_secondary_click",
    "landing_pillar_click",
    "landing_faq_expand",
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
