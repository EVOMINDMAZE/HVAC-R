import { describe, expect, it, vi } from "vitest";

import {
    buildAuthValidationSequence,
    normalizeAuthRuntimePath,
    runAuthCompatibilityGuard,
    toCompatAuthContext,
} from "../compat/authAdapter.js";

describe("auth compatibility adapter", () => {
    it("defaults unknown runtime labels to compat", () => {
        expect(normalizeAuthRuntimePath(undefined)).toBe("compat");
        expect(normalizeAuthRuntimePath("unknown")).toBe("compat");
    });

    it("uses canonical-first ordering for JWT tokens in compat mode", () => {
        expect(
            buildAuthValidationSequence({
                token: "a.b.c",
                runtimePath: "compat",
            }),
        ).toEqual(["canonical", "legacy"]);
    });

    it("uses legacy-first ordering for opaque tokens in compat mode", () => {
        expect(
            buildAuthValidationSequence({
                token: "opaque-token",
                runtimePath: "compat",
            }),
        ).toEqual(["legacy", "canonical"]);
    });

    it("respects explicit runtime override sequencing", () => {
        expect(
            buildAuthValidationSequence({
                token: "opaque-token",
                runtimePath: "canonical",
            }),
        ).toEqual(["canonical", "legacy"]);

        expect(
            buildAuthValidationSequence({
                token: "a.b.c",
                runtimePath: "legacy",
            }),
        ).toEqual(["legacy", "canonical"]);
    });

    it("falls back exactly once with deterministic telemetry metadata", async () => {
        const canonical = vi
            .fn()
            .mockResolvedValue({ ok: false, error: "Invalid token signature" });
        const legacy = vi
            .fn()
            .mockResolvedValue({ ok: true, user: { id: "u-legacy" } });

        const result = await runAuthCompatibilityGuard({
            token: "a.b.c",
            runtimePath: undefined,
            validateCanonical: canonical,
            validateLegacy: legacy,
        });

        expect(canonical).toHaveBeenCalledTimes(1);
        expect(legacy).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            ok: true,
            user: { id: "u-legacy" },
            authPath: "legacy",
            runtimePath: "compat",
            fallbackUsed: true,
            migrationTags: ["auth.path.compat", "auth.path.legacy"],
        });
    });

    it("tags compat runtime with canonical path usage when primary canonical validation succeeds", async () => {
        const canonical = vi
            .fn()
            .mockResolvedValue({ ok: true, user: { id: "u-canonical" } });
        const legacy = vi.fn();

        const result = await runAuthCompatibilityGuard({
            token: "a.b.c",
            runtimePath: "compat",
            validateCanonical: canonical,
            validateLegacy: legacy,
        });

        expect(result).toEqual({
            ok: true,
            user: { id: "u-canonical" },
            authPath: "canonical",
            runtimePath: "compat",
            fallbackUsed: false,
            migrationTags: ["auth.path.compat", "auth.path.canonical"],
        });
    });

    it("returns deterministic failure payload without duplicate validator attempts", async () => {
        const canonical = vi
            .fn()
            .mockResolvedValue({ ok: false, error: "Invalid token signature" });
        const legacy = vi
            .fn()
            .mockResolvedValue({ ok: false, error: "Authentication failed" });

        const result = await runAuthCompatibilityGuard({
            token: "a.b.c",
            runtimePath: "canonical",
            validateCanonical: canonical,
            validateLegacy: legacy,
        });

        expect(canonical).toHaveBeenCalledTimes(1);
        expect(legacy).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            ok: false,
            error: "Invalid token signature",
            authPath: "canonical",
            runtimePath: "canonical",
            fallbackUsed: true,
            migrationTags: ["auth.path.canonical"],
        });
    });

    it("normalizes auth context id and subscription defaults", () => {
        const context = toCompatAuthContext({ sub: "u1", email: "a@b.com" });

        expect(context).toMatchObject({
            id: "u1",
            email: "a@b.com",
            subscription_plan: "free",
            subscription_status: "active",
        });
    });
});
