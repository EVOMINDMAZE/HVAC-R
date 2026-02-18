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

function normalizeWords(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "hero-density-audit-v2.json");

  const { browser } = await launchChromium({ headed });
  const results = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(450);

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector(".landing-hero");
      const leftRail = hero?.querySelector(".max-w-xl") || null;
      const rightRail = hero?.querySelector(".landing-pillars-card") || null;

      const visibleInHero = Array.from(
        hero?.querySelectorAll("a[href], button, [role='button']") || [],
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0;
      }).length;

      const heroText = hero?.textContent || "";
      const leftText = leftRail?.textContent || "";
      const rightText = rightRail?.textContent || "";

      const primaryCtaVisible = Boolean(
        hero?.querySelector("a[href='/signup']"),
      );
      const secondaryCtaVisible = Boolean(
        hero?.querySelector("a[href='/contact']"),
      );

      const rightRailTop = rightRail?.getBoundingClientRect().top ?? null;
      const rightRailBottom = rightRail?.getBoundingClientRect().bottom ?? null;

      return {
        visibleInHero,
        heroText,
        leftText,
        rightText,
        primaryCtaVisible,
        secondaryCtaVisible,
        rightRailTop,
        rightRailBottom,
        viewportHeight: window.innerHeight,
      };
    });

    const heroWordCount = normalizeWords(metrics.heroText).length;
    const leftWordCount = normalizeWords(metrics.leftText).length;
    const rightWordCount = normalizeWords(metrics.rightText).length;

    results.push({
      viewport: viewport.name,
      visibleTargetsInHero: metrics.visibleInHero,
      heroWordCount,
      leftWordCount,
      rightWordCount,
      primaryCtaVisible: metrics.primaryCtaVisible,
      secondaryCtaVisible: metrics.secondaryCtaVisible,
      rightRailMostlyAboveFold:
        typeof metrics.rightRailBottom === "number"
          ? metrics.rightRailBottom <= metrics.viewportHeight * 1.05
          : false,
    });

    await context.close();
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    results,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`HERO_DENSITY_REPORT=${reportPath}`);
})();
