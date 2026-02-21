import { describe, expect, it, vi } from "vitest";
import {
    authenticateSupabaseToken,
    createAuthenticateSupabaseToken,
} from "../supabaseAuth.js";

function createMockResponse() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe("supabase auth compatibility middleware", () => {
    it("returns 401 when token is missing", async () => {
        const req = { headers: {}, path: "/api/calculations" } as any;
        const res = createMockResponse();
        const next = vi.fn();

        await authenticateSupabaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Authentication required",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("runs canonical then legacy for JWT compat mode and sets telemetry metadata", async () => {
        const calls: string[] = [];
        const middleware = createAuthenticateSupabaseToken({
            validateCanonical: vi.fn(async () => {
                calls.push("canonical");
                return { ok: false as const, error: "Invalid token signature" };
            }),
            validateLegacy: vi.fn(async () => {
                calls.push("legacy");
                return {
                    ok: true as const,
                    user: {
                        id: "u-legacy",
                        subscription_plan: "free",
                        subscription_status: "active",
                    },
                };
            }),
        });

        const req = {
            headers: { authorization: "Bearer a.b.c" },
            path: "/api/calculations",
        } as any;
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(calls).toEqual(["canonical", "legacy"]);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject({ id: "u-legacy" });
        expect(req.runtimePath).toBe("compat");
        expect(req.authPath).toBe("legacy");
        expect(req.fallbackUsed).toBe(true);
        expect(req.authMigrationTags).toEqual([
            "auth.path.compat",
            "auth.path.legacy",
        ]);
    });

    it("fails deterministically with first-path error when both validators fail", async () => {
        const middleware = createAuthenticateSupabaseToken({
            validateCanonical: vi.fn(async () => ({
                ok: false as const,
                error: "Invalid token signature",
            })),
            validateLegacy: vi.fn(async () => ({
                ok: false as const,
                error: "Authentication failed",
            })),
        });

        const req = {
            headers: {
                authorization: "Bearer a.b.c",
                "x-runtime-path": "canonical",
            },
            path: "/api/calculations",
        } as any;
        const res = createMockResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid token signature",
        });
        expect(req.authPath).toBe("canonical");
        expect(req.runtimePath).toBe("canonical");
        expect(req.fallbackUsed).toBe(true);
        expect(req.authMigrationTags).toEqual(["auth.path.canonical"]);
    });
});
