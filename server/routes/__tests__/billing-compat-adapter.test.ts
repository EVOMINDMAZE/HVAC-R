import { describe, expect, it } from "vitest";
import { normalizeBillingPlan } from "../compat/billingPlanCompat.js";

describe("normalizeBillingPlan", () => {
    it("maps canonical professional to legacy pro while exposing canonical metadata", () => {
        const normalized = normalizeBillingPlan("professional");

        expect(normalized).toMatchObject({
            legacyPlan: "pro",
            canonicalPlan: "professional",
            normalizedFrom: "professional",
            migrationTags: ["billing.plan.compat.normalized"],
        });
    });

    it("maps canonical enterprise to legacy business while exposing canonical metadata", () => {
        const normalized = normalizeBillingPlan("enterprise");

        expect(normalized).toMatchObject({
            legacyPlan: "business",
            canonicalPlan: "enterprise",
            normalizedFrom: "enterprise",
            migrationTags: ["billing.plan.compat.normalized"],
        });
    });

    it("keeps legacy pro as non-breaking response output", () => {
        const normalized = normalizeBillingPlan("pro");

        expect(normalized).toMatchObject({
            legacyPlan: "pro",
            canonicalPlan: "professional",
            migrationTags: ["billing.plan.compat.passthrough"],
        });
        expect(normalized.normalizedFrom).toBeUndefined();
    });

    it("defaults unknown plans to free for safe compatibility behavior", () => {
        const normalized = normalizeBillingPlan("starter");

        expect(normalized).toMatchObject({
            legacyPlan: "free",
            canonicalPlan: "free",
            normalizedFrom: "starter",
            migrationTags: ["billing.plan.compat.defaulted_free"],
        });
    });
});

