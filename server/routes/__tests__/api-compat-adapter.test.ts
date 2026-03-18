import { describe, expect, it } from "vitest";

import {
    toCompatEnvelope,
    toCompatErrorEnvelope,
} from "../compat/apiAdapter.js";

describe("api compatibility adapter", () => {
    it("normalizes success envelopes while preserving existing payload fields", () => {
        const body = toCompatEnvelope({ plan: "pro", status: "active" });

        expect(body).toEqual({
            success: true,
            plan: "pro",
            status: "active",
        });
        expect(body).not.toHaveProperty("_meta");
    });

    it("normalizes error envelopes while preserving legacy error fields", () => {
        const body = toCompatErrorEnvelope({ error: "Checkout failed" });

        expect(body).toEqual({
            success: false,
            error: "Checkout failed",
        });
        expect(body).not.toHaveProperty("_meta");
    });

    it("supports runtime-path metadata labels when explicitly enabled", () => {
        const body = toCompatEnvelope(
            { plan: "business" },
            { runtimePath: "legacy", includeMeta: true },
        );

        expect(body).toMatchObject({
            success: true,
            plan: "business",
            _meta: {
                runtimePath: "legacy",
            },
        });
    });

    it("defaults unknown metadata labels to compat for migration telemetry", () => {
        const body = toCompatErrorEnvelope(
            { error: "Unexpected failure" },
            { runtimePath: "unknown", includeMeta: true },
        );

        expect(body).toMatchObject({
            success: false,
            error: "Unexpected failure",
            _meta: {
                runtimePath: "compat",
            },
        });
    });

    it("emits migration tags and compat context in metadata when provided", () => {
        const body = toCompatEnvelope(
            { plan: "pro" },
            {
                runtimePath: "compat",
                includeMeta: true,
                migrationTags: ["billing.plan.compat.normalized"],
                compatContext: {
                    billingPlan: {
                        canonicalPlan: "professional",
                        normalizedFrom: "professional",
                    },
                },
            },
        );

        expect(body).toMatchObject({
            success: true,
            plan: "pro",
            _meta: {
                runtimePath: "compat",
                migrationTags: ["billing.plan.compat.normalized"],
                compat: {
                    billingPlan: {
                        canonicalPlan: "professional",
                        normalizedFrom: "professional",
                    },
                },
            },
        });
    });
});
