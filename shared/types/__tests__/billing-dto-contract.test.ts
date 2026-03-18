import { describe, expect, it } from "vitest";

import {
    normalizeBillingDto,
    type BillingDto,
    type BillingPlan,
    type BillingStatus,
} from "../dtos";

describe("normalizeBillingDto", () => {
    it("normalizes enterprise plan to business (legacy compatibility)", () => {
        const result = normalizeBillingDto({ plan: "enterprise", status: "active" });
        expect(result).toEqual({
            plan: "business",
            status: "active",
        });
    });

    it("normalizes professional plan to pro (legacy compatibility)", () => {
        const result = normalizeBillingDto({ plan: "professional", status: "active" });
        expect(result).toEqual({
            plan: "pro",
            status: "active",
        });
    });

    it("normalizes professional_yearly plan to pro", () => {
        const result = normalizeBillingDto({ plan: "professional_yearly", status: "trialing" });
        expect(result).toEqual({
            plan: "pro",
            status: "trialing",
        });
    });

    it("normalizes enterprise_yearly plan to business", () => {
        const result = normalizeBillingDto({ plan: "enterprise_yearly", status: "active" });
        expect(result).toEqual({
            plan: "business",
            status: "active",
        });
    });

    it("preserves legacy plan values (free, pro, business)", () => {
        expect(normalizeBillingDto({ plan: "free", status: "active" })).toEqual({
            plan: "free",
            status: "active",
        });
        expect(normalizeBillingDto({ plan: "pro", status: "active" })).toEqual({
            plan: "pro",
            status: "active",
        });
        expect(normalizeBillingDto({ plan: "business", status: "active" })).toEqual({
            plan: "business",
            status: "active",
        });
    });

    it("defaults missing plan to free", () => {
        const result = normalizeBillingDto({ status: "active" });
        expect(result).toEqual({
            plan: "free",
            status: "active",
        });
    });

    it("defaults missing status to active", () => {
        const result = normalizeBillingDto({ plan: "pro" });
        expect(result).toEqual({
            plan: "pro",
            status: "active",
        });
    });

    it("defaults both missing plan and status", () => {
        const result = normalizeBillingDto({});
        expect(result).toEqual({
            plan: "free",
            status: "active",
        });
    });

    it("handles null and undefined inputs gracefully", () => {
        expect(normalizeBillingDto({ plan: null, status: null })).toEqual({
            plan: "free",
            status: "active",
        });
        expect(normalizeBillingDto({ plan: undefined, status: undefined })).toEqual({
            plan: "free",
            status: "active",
        });
    });

    it("handles case-insensitive plan inputs", () => {
        expect(normalizeBillingDto({ plan: "PROFESSIONAL", status: "active" })).toEqual({
            plan: "pro",
            status: "active",
        });
        expect(normalizeBillingDto({ plan: "Enterprise", status: "active" })).toEqual({
            plan: "business",
            status: "active",
        });
    });

    it("handles unknown plan values by defaulting to free", () => {
        const result = normalizeBillingDto({ plan: "unknown_plan", status: "active" });
        expect(result).toEqual({
            plan: "free",
            status: "active",
        });
    });

    it("returns BillingDto type with correct shape", () => {
        const result: BillingDto = normalizeBillingDto({ plan: "pro", status: "active" });
        expect(result.plan).toBe("pro");
        expect(result.status).toBe("active");
    });
});

describe("BillingPlan type", () => {
    it("should only allow free, pro, or business values", () => {
        const validPlans: BillingPlan[] = ["free", "pro", "business"];
        expect(validPlans).toHaveLength(3);
    });
});

describe("BillingStatus type", () => {
    it("should allow valid billing status values", () => {
        const validStatuses: BillingStatus[] = [
            "active",
            "trialing",
            "past_due",
            "canceled",
        ];
        expect(validStatuses).toHaveLength(4);
    });
});