import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

const viewports = [
  { name: "desktop-1536x960", width: 1536, height: 960 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const route = "/dashboard?bypassAuth=1&uiFuture=1";

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "signed-in-viewport-check.json");

  const { browser } = await launchChromium({ headed });
  const checks = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const main = document.querySelector("main");
      const header = document.querySelector("header");

      return {
        hasHorizontalOverflow: root.scrollWidth > window.innerWidth,
        hasMain: Boolean(main),
        hasHeader: Boolean(header),
        hasMonitorShell: Boolean(document.querySelector("[data-monitor-shell]")),
        scrollWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    await page.screenshot({
      path: path.join(outDir, `signedin-viewport-${viewport.name}.png`),
      fullPage: false,
    });

    checks.push({
      viewport: viewport.name,
      passed:
        !metrics.hasHorizontalOverflow &&
        metrics.hasMain &&
        metrics.hasHeader &&
        metrics.hasMonitorShell,
      ...metrics,
    });

    await context.close();
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    route,
    checks,
    passed: checks.every((check) => check.passed),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`SIGNED_IN_VIEWPORT_REPORT=${reportPath}`);
  console.log(`SIGNED_IN_VIEWPORT_PASSED=${report.passed}`);
})();
