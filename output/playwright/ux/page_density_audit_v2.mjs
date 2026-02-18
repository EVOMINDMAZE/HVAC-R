import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

const pages = [
  { name: "landing", url: "/" },
  { name: "features", url: "/features" },
  { name: "pricing", url: "/pricing" },
];

function countWords(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "page-density-audit-v2.json");

  const { browser } = await launchChromium({ headed });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = [];
  for (const item of pages) {
    await page.goto(`${baseUrl}${item.url}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => {
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const firstSection = main?.querySelector("section") || null;

      const firstCtas = Array.from(
        firstSection?.querySelectorAll("a[href], button") || [],
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const headerTargets = Array.from(
        header?.querySelectorAll("a[href], button") || [],
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      return {
        firstSectionText: firstSection?.textContent || "",
        firstSectionTargets: firstCtas.length,
        hasPrimarySignUp: Boolean(firstSection?.querySelector("a[href='/signup'],button")),
        headerNavTargets: headerTargets.length,
      };
    });

    results.push({
      page: item.name,
      route: item.url,
      firstSectionWordCount: countWords(metrics.firstSectionText),
      firstSectionTargets: metrics.firstSectionTargets,
      headerNavTargets: metrics.headerNavTargets,
    });
  }

  await context.close();
  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    results,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`PAGE_DENSITY_REPORT=${reportPath}`);
})();
