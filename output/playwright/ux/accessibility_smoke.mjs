import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

function parseFirstDuration(value) {
  const first = String(value || "0s").split(",")[0].trim();
  const isMs = first.endsWith("ms");
  const numeric = Number.parseFloat(first.replace(/ms|s/, ""));
  if (!Number.isFinite(numeric)) return 0;
  return isMs ? numeric : numeric * 1000;
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "accessibility-smoke.json");

  const { browser } = await launchChromium({ headed });

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(450);

  // Keyboard-only entry should focus skip link first
  await desktopPage.keyboard.press("Tab");

  const desktopChecks = await desktopPage.evaluate(() => {
    const hasSkipLink = Boolean(document.querySelector("a[href='#main-content']"));

    const focused = document.activeElement;
    const focusedText = focused?.textContent?.trim() || "";
    const firstTabFocusIsSkipLink =
      focused instanceof HTMLAnchorElement && focused.getAttribute("href") === "#main-content";

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

    const unnamedInteractive = unnamedElements.length;
    const unnamedSamples = unnamedElements.slice(0, 3).map((element) => {
      const tag = element.tagName.toLowerCase();
      const role = element.getAttribute("role") || "";
      const className = element.getAttribute("class") || "";
      return `${tag}[role='${role}'][class='${className}']`;
    });

    return {
      hasSkipLink,
      firstTabFocusIsSkipLink,
      focusedText,
      imagesMissingAlt,
      unnamedInteractive,
      unnamedSamples,
    };
  });

  const reduced = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await reducedPage.waitForTimeout(350);

  const reducedChecks = await reducedPage.evaluate(() => {
    const tab = document.querySelector(".landing-snapshot-tab");
    const mobileCta = document.querySelector(".landing-mobile-cta");

    const tabTransitionDuration = tab
      ? getComputedStyle(tab).transitionDuration
      : "missing";
    const ctaTransitionDuration = mobileCta
      ? getComputedStyle(mobileCta).transitionDuration
      : "missing";

    return {
      tabTransitionDuration,
      ctaTransitionDuration,
    };
  });

  await desktop.close();
  await reduced.close();
  await browser.close();

  const tabDurationMs = parseFirstDuration(reducedChecks.tabTransitionDuration);
  const ctaDurationMs = parseFirstDuration(reducedChecks.ctaTransitionDuration);

  const checks = [
    {
      check: "skip_link_present",
      passed: desktopChecks.hasSkipLink,
      details: desktopChecks.hasSkipLink ? "present" : "missing",
    },
    {
      check: "first_tab_focus_skip_link",
      passed: desktopChecks.firstTabFocusIsSkipLink,
      details: desktopChecks.focusedText || "no focused text",
    },
    {
      check: "images_have_alt_text",
      passed: desktopChecks.imagesMissingAlt === 0,
      details: `missing_alt=${desktopChecks.imagesMissingAlt}`,
    },
    {
      check: "interactive_controls_named",
      passed: desktopChecks.unnamedInteractive === 0,
      details: `unnamed=${desktopChecks.unnamedInteractive} ${desktopChecks.unnamedSamples?.join(" | ") || ""}`,
    },
    {
      check: "reduced_motion_disables_tab_transition",
      passed: tabDurationMs === 0,
      details: `transition=${reducedChecks.tabTransitionDuration}`,
    },
    {
      check: "reduced_motion_disables_mobile_cta_transition",
      passed: ctaDurationMs === 0,
      details: `transition=${reducedChecks.ctaTransitionDuration}`,
    },
  ];

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks,
    passed: checks.every((item) => item.passed),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`ACCESSIBILITY_SMOKE_REPORT=${reportPath}`);
  console.log(`ACCESSIBILITY_SMOKE_PASSED=${report.passed}`);
})();
