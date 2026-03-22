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

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "hero-viewport-check.json");

  const { browser } = await launchChromium({ headed });

  const checks = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const main = document.querySelector("main");
      const hero = main?.querySelector("section") || null;
      const primaryCta = hero?.querySelector("a[href^='/signup']") || null;
      const secondaryCta =
        hero?.querySelector("a[href='/demo'], a[href='/contact']") || null;

      const hasHorizontalOverflow = root.scrollWidth > window.innerWidth + 1;
      const heroHasInternalScroll = hero
        ? hero.scrollHeight > hero.clientHeight + 1
        : true;
      const hasPrimaryCta = Boolean(primaryCta);
      const hasSecondaryCta = Boolean(secondaryCta);

      return {
        hasHorizontalOverflow,
        heroHasInternalScroll,
        hasPrimaryCta,
        hasSecondaryCta,
        scrollWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    await page.screenshot({
      path: path.join(outDir, `hero-${viewport.name}.png`),
      fullPage: false,
    });

    checks.push({
      viewport: viewport.name,
      passed:
        !metrics.hasHorizontalOverflow &&
        !metrics.heroHasInternalScroll &&
        metrics.hasPrimaryCta,
      ...metrics,
    });

    await context.close();
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks,
    passed: checks.every((item) => item.passed),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`HERO_VIEWPORT_REPORT=${reportPath}`);
  console.log(`HERO_VIEWPORT_PASSED=${report.passed}`);
})();
