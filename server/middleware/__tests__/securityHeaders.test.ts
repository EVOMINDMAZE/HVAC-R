import { describe, expect, it, vi } from "vitest";

import { securityHeaders } from "../securityHeaders.js";

function createMockResponse() {
  const headers = new Map<string, string>();
  return {
    headers,
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name, value);
    }),
    removeHeader: vi.fn(),
    getHeader: vi.fn((name: string) => headers.get(name)),
  } as any;
}

describe("securityHeaders middleware", () => {
  it("includes websocket-friendly CSP connect sources", () => {
    const req = {} as any;
    const res = createMockResponse();
    const next = vi.fn();

    securityHeaders()(req, res, next);

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("wss:");
    expect(csp).toContain("ws:");
    expect(csp).toContain("ws://localhost:*");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("does not emit upgrade-insecure-requests in non-production", () => {
    const priorNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const req = {} as any;
    const res = createMockResponse();
    const next = vi.fn();

    securityHeaders()(req, res, next);

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(next).toHaveBeenCalledTimes(1);
    process.env.NODE_ENV = priorNodeEnv;
  });
});
