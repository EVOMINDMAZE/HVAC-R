import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authenticateSupabaseToken } from "./supabaseAuth";
import jwt from "jsonwebtoken";

describe("authenticateSupabaseToken", () => {
  let req: any;
  let res: any;
  let next: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    req = {
      headers: {},
      path: "/api/test",
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    next = vi.fn();

    // Clear secrets
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should accept a token signed with the fallback secret in DEVELOPMENT if env var is missing", async () => {
    // In development, we allow the fallback for convenience
    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign(
      { sub: "user123", email: "test@example.com" },
      fallbackSecret,
    );

    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe("user123");
  });

  it("should FAIL with 500 in PRODUCTION if secret is missing", async () => {
    process.env.NODE_ENV = "production";

    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign(
      { sub: "user123", email: "test@example.com" },
      fallbackSecret,
    );

    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Server configuration error" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should FAIL with 500 in PRODUCTION if secret is weak/default", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "your_super_secret_jwt_key_change_in_production";

    const token = jwt.sign(
      { sub: "user123", email: "test@example.com" },
      process.env.JWT_SECRET,
    );

    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Server configuration error" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should fail with 401 if token is signed with wrong secret", async () => {
    const token = jwt.sign({ sub: "user123" }, "wrong-secret");
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Invalid token signature" }),
    );
  });
});
