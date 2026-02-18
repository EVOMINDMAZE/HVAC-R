import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

const ROLES = [
  {
    id: "admin",
    email: process.env.ADMIN_EMAIL || "admin@admin.com",
    password: process.env.ADMIN_PASSWORD || "Hvacr!Admin#2026!R7mQ",
    landingPath: "/dashboard",
    routes: [
      "/dashboard",
      "/dashboard/dispatch",
      "/dashboard/triage",
      "/dashboard/jobs",
      "/dashboard/jobs/demo",
      "/dashboard/clients",
      "/dashboard/clients/demo",
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
    ],
  },
  {
    id: "technician",
    email: process.env.TECH_EMAIL || "tech@test.com",
    password: process.env.TECH_PASSWORD || "Password123!",
    landingPath: "/tech",
    routes: [
      "/tech",
      "/tech/jobs/demo",
      "/troubleshooting",
      "/diy-calculators",
      "/history",
      "/profile",
    ],
  },
  {
    id: "client",
    email: process.env.CLIENT_EMAIL || "client@test.com",
    password: process.env.CLIENT_PASSWORD || "Password123!",
    landingPath: "/portal",
    routes: ["/portal", "/track-job/demo", "/profile", "/history"],
  },
];

function classifyTextAnomalies(text) {
  const lowered = (text || "").toLowerCase();
  const issues = [];
  if (lowered.includes("please sign in")) issues.push("unexpected_signin_prompt");
  if (lowered.includes("error fetching")) issues.push("fetch_error_text");
  if (lowered.includes("failed to load")) issues.push("failed_load_text");
  if (lowered.includes("development mode active")) issues.push("dev_mode_banner");
  return issues;
}

async function loginWithUi(page, role) {
  await page.goto(`${baseUrl}/signin`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="email"]', { timeout: 20000 });
  await page.fill('input[type="email"]', role.email);
  await page.fill('input[type="password"]', role.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(
    (url) => !url.pathname.includes("/signin"),
    { timeout: 25000 },
  );

  const afterLoginUrl = page.url();

  if (afterLoginUrl.includes("/select-company")) {
    const chooser = page.locator("button:has-text('Select Workspace')");
    const fallbackCard = page.locator("div[role='button']").first();
    if (await chooser.count()) {
      await chooser.first().click();
    } else if (await fallbackCard.count()) {
      await fallbackCard.click();
    }
    await page.waitForTimeout(900);
    await page.waitForURL(
      (url) => !url.pathname.includes("/select-company"),
      { timeout: 20000 },
    );
  }

  return page.url();
}

async function evaluatePage(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const bodyText = document.body?.innerText || "";
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";
    const hasMain = Boolean(document.querySelector("main"));
    const hasVisiblePrimaryButton = Array.from(document.querySelectorAll("button, a"))
      .some((el) => {
        const txt = (el.textContent || "").trim().toLowerCase();
        return txt.includes("save") || txt.includes("create") || txt.includes("submit") || txt.includes("run");
      });

    return {
      hasHorizontalOverflow: root.scrollWidth > window.innerWidth,
      textLength: bodyText.trim().length,
      hasMain,
      h1,
      hasVisiblePrimaryButton,
    };
  });
}

async function waitForRenderableState(page, timeoutMs = 12000) {
  try {
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        const hasMain = Boolean(document.querySelector("main"));
        const loadingVisible = /loading\.\.\./i.test(text);
        return hasMain || (!loadingVisible && text.trim().length >= 80);
      },
      { timeout: timeoutMs },
    );
  } catch {
    // Continue with collected metrics even if hydration timeout is reached.
  }
}

async function runRoleAudit(browser, role) {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 960 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const routeResults = [];

  let activeRouteConsole = [];
  let activeRouteResponses = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const text = msg.text();
      consoleErrors.push(text);
      activeRouteConsole.push(text);
    }
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      activeRouteResponses.push({
        status,
        url: response.url(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  let loginResult = {
    success: false,
    initialUrl: "",
    finalUrl: "",
    reason: "unknown",
  };

  try {
    loginResult.initialUrl = `${baseUrl}/signin`;
    const loggedInUrl = await loginWithUi(page, role);
    loginResult.finalUrl = loggedInUrl;
    loginResult.success = true;
    loginResult.reason = "ok";
  } catch (error) {
    loginResult.success = false;
    loginResult.reason = `login_failed:${String(error)}`;
    await page.screenshot({
      path: path.join(outDir, `real-${role.id}-login-failed.png`),
      fullPage: true,
    });
    await context.close();
    return { role: role.id, login: loginResult, routeResults, consoleErrors, pageErrors };
  }

  for (const route of role.routes) {
    const url = `${baseUrl}${route}`;
    activeRouteConsole = [];
    activeRouteResponses = [];
    let passed = true;
    let reason = "ok";
    let finalUrl = "";
    let metrics = {
      hasHorizontalOverflow: false,
      textLength: 0,
      hasMain: false,
      h1: "",
      hasVisiblePrimaryButton: false,
    };
    let anomalies = [];

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForRenderableState(page);
      await page.waitForTimeout(450);
      finalUrl = page.url();
      metrics = await evaluatePage(page);

      const textContent = await page.locator("body").innerText().catch(() => "");
      anomalies = classifyTextAnomalies(textContent);

      if (metrics.hasHorizontalOverflow) {
        passed = false;
        reason = "horizontal_overflow";
      } else if (/loading\.\.\./i.test(textContent) && !metrics.hasMain) {
        passed = false;
        reason = "stuck_loading_state";
      } else if (!metrics.hasMain && metrics.textLength < 80) {
        passed = false;
        reason = "insufficient_rendered_content";
      } else if (anomalies.includes("unexpected_signin_prompt")) {
        passed = false;
        reason = "signin_prompt_visible";
      }

      await page.screenshot({
        path: path.join(
          outDir,
          `real-${role.id}-${route.replace(/[/?=&:]/g, "-").replace(/-+/g, "-")}.png`,
        ),
        fullPage: false,
      });
    } catch (error) {
      passed = false;
      reason = `navigation_error:${String(error)}`;
    }

    routeResults.push({
      role: role.id,
      route,
      url,
      finalUrl,
      passed,
      reason,
      metrics,
      anomalies,
      routeConsoleIssues: Array.from(new Set(activeRouteConsole)).slice(0, 20),
      routeHttpErrors: activeRouteResponses.slice(0, 20),
    });
  }

  await context.close();
  return { role: role.id, login: loginResult, routeResults, consoleErrors, pageErrors };
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "signed-in-real-audit.json");

  const { browser } = await launchChromium({ headed });

  const roleReports = [];
  for (const role of ROLES) {
    const report = await runRoleAudit(browser, role);
    roleReports.push(report);
  }

  await browser.close();

  const allRouteResults = roleReports.flatMap((item) => item.routeResults);
  const allConsoleErrors = roleReports.flatMap((item) => item.consoleErrors);
  const consoleIssueCounts = new Map();
  for (const message of allConsoleErrors) {
    consoleIssueCounts.set(message, (consoleIssueCounts.get(message) || 0) + 1);
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    headed,
    roles: roleReports.map((roleReport) => ({
      role: roleReport.role,
      login: roleReport.login,
      checkedRoutes: roleReport.routeResults.length,
      passedRoutes: roleReport.routeResults.filter((r) => r.passed).length,
      failedRoutes: roleReport.routeResults.filter((r) => !r.passed).length,
      consoleErrorCount: roleReport.consoleErrors.length,
      pageErrorCount: roleReport.pageErrors.length,
    })),
    routeResults: allRouteResults,
    topConsoleIssues: Array.from(consoleIssueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([message, count]) => ({ message, count })),
    passed: allRouteResults.every((result) => result.passed),
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`SIGNED_IN_REAL_AUDIT_REPORT=${reportPath}`);
  console.log(`SIGNED_IN_REAL_AUDIT_PASSED=${report.passed}`);
})();
