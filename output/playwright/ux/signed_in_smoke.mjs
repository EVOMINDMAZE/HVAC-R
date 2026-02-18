import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

const withQuery = (route, query) => {
  const separator = route.includes("?") ? "&" : "?";
  return `${route}${separator}${query}`;
};

const monitoredRoutes = [
  "/dashboard",
  "/dashboard/dispatch",
  "/dashboard/triage",
  "/dashboard/jobs",
  "/dashboard/clients",
  "/dashboard/projects",
  "/dashboard/fleet",
  "/estimate-builder",
  "/history",
  "/profile",
  "/settings/company",
  "/settings/team",
  "/troubleshooting",
  "/ai/pattern-insights",
  "/tools/iaq-wizard",
  "/tools/warranty-scanner",
  "/diy-calculators",
  "/tools/standard-cycle",
  "/tools/refrigerant-comparison",
  "/tools/cascade-cycle",
  "/tools/refrigerant-inventory",
  "/tools/leak-rate-calculator",
  "/tools/refrigerant-report",
  "/advanced-reporting",
  "/tech",
  "/portal",
  "/track-job/demo",
].map((route) => withQuery(route, "bypassAuth=1&uiFuture=1"));

const controlRoutes = [withQuery("/dashboard", "bypassAuth=1&uiFuture=0")];
const routes = [...monitoredRoutes, ...controlRoutes];

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "signed-in-smoke.json");

  const { browser } = await launchChromium({ headed });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(String(err));
  });

  const results = [];

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    let passed = true;
    let reason = "ok";

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(550);
      const finalUrl = page.url();

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const textLength = (document.body?.innerText || "").trim().length;
        const hasMain = Boolean(document.querySelector("main"));
        const hasMonitorShell = Boolean(document.querySelector("[data-monitor-shell]"));
        return {
          hasHorizontalOverflow: root.scrollWidth > window.innerWidth,
          textLength,
          hasMain,
          hasMonitorShell,
        };
      });

      if (metrics.hasHorizontalOverflow) {
        passed = false;
        reason = "horizontal_overflow";
      } else if (!metrics.hasMain && metrics.textLength < 20) {
        passed = false;
        reason = "insufficient_rendered_content";
      } else if (finalUrl.includes("uiFuture=1") && !metrics.hasMonitorShell) {
        passed = false;
        reason = "monitor_shell_missing";
      } else if (finalUrl.includes("uiFuture=0") && metrics.hasMonitorShell) {
        passed = false;
        reason = "monitor_shell_present_when_disabled";
      }

      await page.screenshot({
        path: path.join(
          outDir,
          `signedin-${route.replace(/[/?=&:]/g, "-").replace(/-+/g, "-")}.png`,
        ),
        fullPage: false,
      });

      results.push({
        route,
        url,
        finalUrl,
        passed,
        reason,
        ...metrics,
      });
    } catch (error) {
      results.push({
        route,
        url,
        passed: false,
        reason: `navigation_error:${String(error)}`,
      });
    }
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checkedRoutes: routes.length,
    results,
    consoleErrors,
    pageErrors,
    passed:
      results.every((item) => item.passed) &&
      pageErrors.length === 0,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`SIGNED_IN_SMOKE_REPORT=${reportPath}`);
  console.log(`SIGNED_IN_SMOKE_PASSED=${report.passed}`);
})();
