#!/usr/bin/env tsx
import WebSocket from "ws";
import http from "http";
import fs from "fs";
import path from "path";

interface CDPMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

interface ConsoleLogEntry {
  timestamp: string;
  type: string;
  level: string;
  text: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackTrace?: string[];
}

interface NetworkRequest {
  timestamp: string;
  requestId: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  type: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  postData?: string;
  responseData?: string;
}

interface SessionInfo {
  startTime: string;
  url?: string;
}

interface CDPLogCapture {
  session: SessionInfo;
  consoleLogs: ConsoleLogEntry[];
  networkRequests: NetworkRequest[];
  errors: string[];
  warnings: string[];
  javascriptErrors: string[];
}

class ChromeDevToolsCapture {
  private ws: WebSocket | null = null;
  private messageId: number = 1;
  private pendingRequests: Map<number, (result: unknown) => void> = new Map();
  private consoleLogs: ConsoleLogEntry[] = [];
  private networkRequests: Map<string, NetworkRequest> = new Map();
  private errors: string[] = [];
  private warnings: string[] = [];
  private javascriptErrors: string[] = [];
  private captureDuration: number = 30000;
  private outputFile: string = "cdp-console-logs.json";

  async start(options: {
    port?: number;
    tab?: number;
    url?: string;
    duration?: number;
    output?: string;
    websocket?: string;
  }): Promise<void> {
    const {
      port = 9222,
      tab = 0,
      url,
      duration = 30,
      output = "cdp-console-logs.json",
      websocket,
    } = options;

    this.captureDuration = duration * 1000;
    this.outputFile = output;

    console.log("Starting Chrome DevTools Protocol capture...");
    console.log("Port: " + port);
    console.log("Tab index: " + tab);
    console.log("Duration: " + duration + "s");

    try {
      let targetWsUrl: string;

      if (websocket) {
        targetWsUrl = websocket;
      } else {
        targetWsUrl = await this.getWebSocketUrl(port, tab);
      }

      await this.connect(targetWsUrl);

      console.log("Connected to Chrome DevTools");

      if (url) {
        console.log("Navigating to: " + url);
        await this.sendCommand("Page.navigate", { url });
        await this.waitForLoad();
      }

      await this.enableAllDomains();

      console.log("Capturing CDP events for " + duration + " seconds...");
      await this.captureForDuration();

      const logData = this.getLogData();
      this.saveLogs(logData);

      console.log("CDP capture complete!");
      console.log("Output saved to: " + this.outputFile);
    } catch (error) {
      console.error("CDP capture error:", error);
      throw error;
    } finally {
      this.disconnect();
    }
  }

  private async getWebSocketUrl(
    port: number,
    tabIndex: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = http.get("http://localhost:" + port + "/json", (res) => {
        let data = "";

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const tabs = JSON.parse(data);

            if (!tabs || tabs.length === 0) {
              reject(
                new Error(
                  "No tabs found on port " +
                    port +
                    ". Start Chrome with --remote-debugging-port=" +
                    port,
                ),
              );
              return;
            }

            if (tabIndex >= tabs.length) {
              reject(
                new Error(
                  "Tab index " +
                    tabIndex +
                    " not found. Available tabs: " +
                    tabs.length,
                ),
              );
              return;
            }

            const targetTab = tabs[tabIndex];
            console.log("Target tab: " + targetTab.title);

            if (!targetTab.webSocketDebuggerUrl) {
              reject(new Error("WebSocket URL not found in tab response"));
              return;
            }

            resolve(targetTab.webSocketDebuggerUrl);
          } catch (e) {
            reject(new Error("Failed to parse /json response: " + e));
          }
        });
      });

      req.on("error", (e) => {
        reject(
          new Error(
            "Failed to connect to Chrome on port " + port + ": " + e.message,
          ),
        );
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(
          new Error("Connection to Chrome on port " + port + " timed out"),
        );
      });
    });
  }

  private connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        resolve();
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("error", (error) => {
        reject(error);
      });

      this.ws.on("close", () => {
        console.log("WebSocket connection closed");
      });
    });
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: string): void {
    try {
      const msg: CDPMessage = JSON.parse(message);

      if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
        const resolve = this.pendingRequests.get(msg.id)!;
        this.pendingRequests.delete(msg.id);
        resolve(msg.result || msg.error);
        return;
      }

      if (msg.method) {
        this.handleEvent(msg.method, msg.params);
      }
    } catch (e) {
      console.error("Failed to parse CDP message:", e);
    }
  }

  private async sendCommand(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const id = this.messageId++;
    const message: CDPMessage = { id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error("CDP command " + method + " timed out"));
      }, 10000);

      this.pendingRequests.set(id, (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      this.ws!.send(JSON.stringify(message));
    });
  }

  private handleEvent(method: string, params?: Record<string, unknown>): void {
    switch (method) {
      case "Console.messageAdded":
        this.handleConsoleMessage(params);
        break;
      case "Log.entryAdded":
        this.handleLogEntry(params);
        break;
      case "Runtime.exceptionThrown":
        this.handleException(params);
        break;
      case "Network.requestWillBeSent":
        this.handleNetworkRequest(params);
        break;
      case "Network.responseReceived":
        this.handleNetworkResponse(params);
        break;
      case "Network.loadingFinished":
        this.handleNetworkFinished(params);
        break;
    }
  }

  private handleConsoleMessage(params: unknown): void {
    const msg = (
      params as {
        message?: {
          type?: string;
          text?: string;
          url?: string;
          lineNumber?: number;
        };
      }
    )?.message;

    if (!msg) return;

    this.consoleLogs.push({
      timestamp: new Date().toISOString(),
      type: "console",
      level: msg.type || "log",
      text: msg.text || "",
      url: msg.url,
      lineNumber: msg.lineNumber,
    });

    if (msg.type === "error") {
      this.errors.push(msg.text || "");
      console.log("[CDP ERROR] " + msg.text);
    } else if (msg.type === "warning") {
      this.warnings.push(msg.text || "");
      console.log("[CDP WARN] " + msg.text);
    } else if (msg.type === "log") {
      const text = msg.text || "";
      console.log("[CDP LOG] " + text.substring(0, 150));
    }
  }

  private handleLogEntry(params: unknown): void {
    const entry = (
      params as {
        entry?: {
          timestamp?: string;
          level?: string;
          text?: string;
          url?: string;
          lineNumber?: number;
        };
      }
    )?.entry;

    if (!entry) return;

    this.consoleLogs.push({
      timestamp: entry.timestamp || new Date().toISOString(),
      type: "log",
      level: entry.level || "info",
      text: entry.text || "",
      url: entry.url,
      lineNumber: entry.lineNumber,
    });
  }

  private handleException(params: unknown): void {
    const details = (
      params as {
        exceptionDetails?: {
          text?: string;
          exception?: { description?: string };
        };
      }
    )?.exceptionDetails;

    if (details) {
      const errorText =
        details.exception?.description || details.text || "Unknown exception";
      this.javascriptErrors.push(errorText);
      console.log("[JS EXCEPTION] " + errorText);
    }
  }

  private handleNetworkRequest(params: unknown): void {
    const p = params as {
      requestId?: string;
      request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
      };
    };

    if (!p.requestId) return;

    this.networkRequests.set(p.requestId, {
      timestamp: new Date().toISOString(),
      requestId: p.requestId,
      url: p.request?.url || "",
      method: p.request?.method || "GET",
      type: "request",
      requestHeaders: p.request?.headers,
    });
  }

  private handleNetworkResponse(params: unknown): void {
    const p = params as {
      requestId?: string;
      response?: {
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
      };
    };

    if (!p.requestId) return;

    const existing = this.networkRequests.get(p.requestId);
    if (existing) {
      existing.status = p.response?.status || 0;
      existing.statusText = p.response?.statusText;
      existing.responseHeaders = p.response?.headers;
    }
  }

  private handleNetworkFinished(params: unknown): void {
    const p = params as { requestId?: string };

    if (!p.requestId) return;

    const existing = this.networkRequests.get(p.requestId);
    if (existing) {
      console.log(
        "[NETWORK] " +
          (existing.status || "pending") +
          " " +
          existing.method +
          " " +
          existing.url,
      );
    }
  }

  private async enableAllDomains(): Promise<void> {
    console.log("Enabling CDP domains...");

    await Promise.all([
      this.sendCommand("Console.enable"),
      this.sendCommand("Log.enable"),
      this.sendCommand("Runtime.enable"),
      this.sendCommand("Network.enable", {
        maxTotalBufferSize: 10000000,
        maxResourceBufferSize: 5000000,
      }),
      this.sendCommand("Page.enable"),
    ]);

    console.log("All CDP domains enabled");
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 10000);
    });
  }

  private async captureForDuration(): Promise<void> {
    const startTime = Date.now();

    const pollInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, this.captureDuration - elapsed);

      const logCount = this.consoleLogs.length + this.javascriptErrors.length;
      if (logCount > 0) {
        console.log(
          "Progress: " +
            (elapsed / 1000).toFixed(0) +
            "s / " +
            this.captureDuration / 1000 +
            "s - " +
            logCount +
            " events",
        );
      }

      if (elapsed >= this.captureDuration) {
        clearInterval(pollInterval);
      }
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, this.captureDuration));
    clearInterval(pollInterval);
  }

  private getLogData(): CDPLogCapture {
    return {
      session: {
        startTime: new Date().toISOString(),
      },
      consoleLogs: this.consoleLogs,
      networkRequests: Array.from(this.networkRequests.values()),
      errors: this.errors,
      warnings: this.warnings,
      javascriptErrors: this.javascriptErrors,
    };
  }

  private saveLogs(logData: CDPLogCapture): void {
    const outputPath = path.resolve(process.cwd(), this.outputFile);

    fs.writeFileSync(outputPath, JSON.stringify(logData, null, 2));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options: {
    port?: number;
    tab?: number;
    url?: string;
    duration?: number;
    output?: string;
    websocket?: string;
  } = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--port":
        options.port = parseInt(args[++i], 10);
        break;
      case "--tab":
        options.tab = parseInt(args[++i], 10);
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
      case "--websocket":
        options.websocket = args[++i];
        break;
    }
  }

  const capturer = new ChromeDevToolsCapture();
  await capturer.start(options);
}

main().catch(console.error);
