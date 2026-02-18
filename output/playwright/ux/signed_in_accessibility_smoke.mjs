import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "signed-in-accessibility-smoke.json");

  const { browser } = await launchChromium({ headed });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/dashboard?bypassAuth=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const checks = await page.evaluate(() => {
    const focused = document.activeElement;
    const focusIsInteractive =
      focused instanceof HTMLAnchorElement ||
      focused instanceof HTMLButtonElement ||
      focused instanceof HTMLInputElement ||
      focused instanceof HTMLSelectElement ||
      focused instanceof HTMLTextAreaElement;

    const imagesMissingAlt = Array.from(document.images).filter(
      (img) => !img.alt || !img.alt.trim(),
    ).length;

    const focusable = Array.from(
      document.querySelectorAll(
        "a[href], button, input, textarea, select, [role='button'], [tabindex]:not([tabindex='-1'])",
      ),
    );

    const unnamedElements = focusable.filter((element) => {
      const label =
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.textContent ||
        "";
      return !label.trim();
    });

    const mainExists = Boolean(document.querySelector("main"));

    return {
      focusIsInteractive,
      imagesMissingAlt,
      unnamedInteractive: unnamedElements.length,
      mainExists,
    };
  });

  await browser.close();

  const reportChecks = [
    {
      check: "main_region_present",
      passed: checks.mainExists,
      details: checks.mainExists ? "present" : "missing",
    },
    {
      check: "keyboard_tab_reaches_interactive_control",
      passed: checks.focusIsInteractive,
      details: checks.focusIsInteractive ? "ok" : "focus_not_interactive",
    },
    {
      check: "images_have_alt_text",
      passed: checks.imagesMissingAlt === 0,
      details: `missing_alt=${checks.imagesMissingAlt}`,
    },
    {
      check: "interactive_controls_named",
      passed: checks.unnamedInteractive === 0,
      details: `unnamed=${checks.unnamedInteractive}`,
    },
  ];

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks: reportChecks,
    passed: reportChecks.every((item) => item.passed),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`SIGNED_IN_A11Y_REPORT=${reportPath}`);
  console.log(`SIGNED_IN_A11Y_PASSED=${report.passed}`);
})();
