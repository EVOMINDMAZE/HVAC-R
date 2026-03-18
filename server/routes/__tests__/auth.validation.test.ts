import { beforeEach, describe, expect, it, vi } from "vitest";

import { signIn, signUp } from "../auth.js";

vi.mock("../../utils/supabase.js", () => ({
  supabaseAdmin: {},
  getSupabaseClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  })),
}));

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("auth route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects sign up when required fields are missing", async () => {
    const req = { body: { email: "a@b.com" } } as any;
    const res = createMockRes() as any;
    const next = vi.fn();

    await signUp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing required fields",
      details: "Email, password, first name, and last name are required",
    });
  });

  it("rejects sign up when email format is invalid", async () => {
    const req = {
      body: {
        email: "invalid",
        password: "password123",
        firstName: "A",
        lastName: "B",
      },
    } as any;
    const res = createMockRes() as any;
    const next = vi.fn();

    await signUp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid email",
      details: "Please enter a valid email address",
    });
  });

  it("rejects sign up when password is too short", async () => {
    const req = {
      body: {
        email: "valid@example.com",
        password: "short",
        firstName: "A",
        lastName: "B",
      },
    } as any;
    const res = createMockRes() as any;
    const next = vi.fn();

    await signUp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Weak password",
      details: "Password must be at least 8 characters long",
    });
  });

  it("rejects sign in when email format is invalid", async () => {
    const req = {
      body: {
        email: "not-an-email",
        password: "password123",
      },
    } as any;
    const res = createMockRes() as any;
    const next = vi.fn();

    await signIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid credentials",
      details: "Email format is invalid",
    });
  });
});
