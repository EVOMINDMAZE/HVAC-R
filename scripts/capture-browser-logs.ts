#!/usr/bin/env tsx
import { chromium, Browser, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

interface ConsoleMessage {
  timestamp: string;
  type: "log" | "error" | "warning" | "info" | "debug";
  text: string;
  location?: {
    url: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

interface NetworkRequest {
  timestamp: string;
  url: string;
  method: string;
  status: number;
  type: string;
  duration: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

interface LogCapture {
  session: {
    startTime: string;
    url: string;
    browser: string;
  };
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  errors: string[];
  warnings: string[];
}

class BrowserLogCapture {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleMessages: ConsoleMessage[] = [];
  private networkRequests: NetworkRequest[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  private captureDuration: number = 30000;
  private outputFile: string = "browser-console-logs.json";

  async start(options: {
    headed?: boolean;
    url?: string;
    duration?: number;
    output?: string;
    waitForSelector?: string;
  }): Promise<void> {
    const {
      headed = false,
      url = "http://localhost:8080/dashboard",
      duration = 30,
      output = "browser-console-logs.json",
      waitForSelector,
    } = options;

    this.captureDuration = duration * 1000;
    this.outputFile = output;

    console.log("Starting browser log capture...");
    console.log("URL: " + url);
    console.log("Mode: " + (headed ? "headed" : "headless"));
    console.log("Duration: " + duration + "s");

    try {
      this.browser = await chromium.launch({
        headless: !headed,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--enable-logging",
          "--v=1",
        ],
      });

      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        ignoreHTTPSErrors: true,
      });

      this.page = await context.newPage();

      await this.setupEventListeners();

      console.log("Navigating to " + url + "...");
      await this.page.goto(url, { waitUntil: "domcontentloaded" });

      if (waitForSelector) {
        console.log("Waiting for selector: " + waitForSelector);
        await this.page
          .waitForSelector(waitForSelector, { timeout: 15000 })
          .catch(() => {
            console.log(
              "Selector " + waitForSelector + " not found within 15s",
            );
          });
      }

      console.log("Capturing logs for " + duration + " seconds...");
      await this.captureForDuration();

      const logData = this.getLogData();
      this.saveLogs(logData);

      console.log("Log capture complete!");
      console.log("Output saved to: " + this.outputFile);
      console.log("- Console messages: " + logData.consoleMessages.length);
      console.log("- Network requests: " + logData.networkRequests.length);
      console.log("- Errors: " + logData.errors.length);
      console.log("- Warnings: " + logData.warnings.length);
    } catch (error) {
      console.error("Error during log capture:", error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.page) return;

    this.page.on("console", (msg) => {
      const type = msg.type() as ConsoleMessage["type"];
      const text = msg.text();
      const location = msg.location();

      this.consoleMessages.push({
        timestamp: new Date().toISOString(),
        type,
        text,
        location: {
          url: location.url || "",
          lineNumber: location.lineNumber,
          columnNumber: location.columnNumber,
        },
      });

      if (type === "error") {
        this.errors.push(text);
        console.log("[ERROR] " + text);
      } else if (type === "warning") {
        this.warnings.push(text);
        console.log("[WARN] " + text);
      } else if (type === "log") {
        const displayText =
          text.length > 200 ? text.substring(0, 200) + "..." : text;
        console.log("[LOG] " + displayText);
      }
    });

    this.page.on("pageerror", (error) => {
      this.errors.push(error.message);
      console.log("[PAGE ERROR] " + error.message);
    });

    this.page.on("requestfailed", (request) => {
      this.networkRequests.push({
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        status: 0,
        type: request.resourceType(),
        duration: 0,
      });
      console.log(
        "[REQUEST FAILED] " +
          request.url() +
          ": " +
          request.failure()?.errorText,
      );
    });

    this.page.on("response", (response) => {
      this.networkRequests.push({
        timestamp: new Date().toISOString(),
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        type: response.request().resourceType(),
        duration: 0,
      });
    });
  }

  private async captureForDuration(): Promise<void> {
    const startTime = Date.now();
    let lastLogCount = 0;

    const pollInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, this.captureDuration - elapsed);

      if (this.consoleMessages.length > lastLogCount) {
        lastLogCount = this.consoleMessages.length;
        console.log(
          "Progress: " +
            (elapsed / 1000).toFixed(0) +
            "s / " +
            this.captureDuration / 1000 +
            "s - " +
            this.consoleMessages.length +
            " logs captured",
        );
      }

      if (elapsed >= this.captureDuration) {
        clearInterval(pollInterval);
      }
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, this.captureDuration));
    clearInterval(pollInterval);
  }

  private getLogData(): LogCapture {
    return {
      session: {
        startTime: new Date().toISOString(),
        url: this.page?.url() || "",
        browser: "Chromium (Playwright)",
      },
      consoleMessages: this.consoleMessages,
      networkRequests: this.networkRequests,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private saveLogs(logData: LogCapture): void {
    const outputPath = path.resolve(process.cwd(), this.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(logData, null, 2));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options: {
    headed?: boolean;
    url?: string;
    duration?: number;
    output?: string;
    waitForSelector?: string;
  } = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--headed":
        options.headed = true;
        break;
      case "--url":
        options.url = args[++i];
        break;
      case "--duration":
        options.duration = parseInt(args[++i], 10);
        break;
      case "--output":
        options.output = args[++i];
        break;
      case "--wait-for-selector":
        options.waitForSelector = args[++i];
        break;
    }
  }

  const capturer = new BrowserLogCapture();
  await capturer.start(options);
}

main().catch(console.error);
