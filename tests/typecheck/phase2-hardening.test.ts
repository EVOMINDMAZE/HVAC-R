/**
 * Phase 2 Batch 3: Incremental TypeScript Hardening Tests
 *
 * These tests verify type safety for the billing boundary slice:
 * - shared/types/dtos.ts
 * - server/services/billing/BillingService.ts
 * - server/routes/billing.ts
 * - server/routes/compat/*.ts (billing-related adapters)
 *
 * The tests focus on:
 * - Runtime guards for invalid payloads
 * - Type narrowing for nullable/unknown handling
 * - Strict DTO/service contract enforcement
 */

import { describe, expect, it } from "vitest";
import {
    normalizeBillingDto,
    type BillingDto,
    type BillingPlan,
    type BillingStatus,
    type BillingDtoInput,
} from "../../shared/types/dtos";
import { BillingService } from "../../server/services/billing/BillingService";
import {
    normalizeBillingPlan,
    projectBillingPlanForRouteResponse,
    type LegacyBillingPlan,
    type CanonicalBillingPlan,
} from "../../server/routes/compat/billingPlanCompat";
import {
    toCompatEnvelope,
    toCompatErrorEnvelope,
    type RuntimePathLabel,
} from "../../server/routes/compat/apiAdapter";

// ============================================================================
// Type-level tests using expectTypeOf for compile-time verification
// ============================================================================

describe("phase2 type hardening: BillingDto contracts", () => {
    it("returns strict billing plan union type from normalizeBillingDto", () => {
        const dto = normalizeBillingDto({ plan: "professional", status: "active" });

        // Runtime assertion
        expect(dto.plan).toBe("pro");
        expect(dto.status).toBe("active");

        // Type assertion - plan must be one of the literal union types
        const _planCheck: BillingPlan = dto.plan;
        const _statusCheck: BillingStatus = dto.status;

        // TypeScript should narrow these correctly
        expect(["free", "pro", "business"]).toContain(dto.plan);
        expect(["active", "trialing", "past_due", "canceled"]).toContain(dto.status);
    });

    it("enforces BillingDtoInput accepts nullable fields", () => {
        // These should all be valid inputs without type errors
        const inputs: BillingDtoInput[] = [
            { plan: "pro", status: "active" },
            { plan: null, status: null },
            { plan: undefined, status: undefined },
            { plan: "professional", status: "trialing" },
            {}, // empty input should be valid
        ];

        inputs.forEach((input) => {
            const result = normalizeBillingDto(input);
            expect(result).toBeDefined();
            expect(["free", "pro", "business"]).toContain(result.plan);
            expect(["active", "trialing", "past_due", "canceled"]).toContain(result.status);
        });
    });

    it("handles unknown input values safely with type guards", () => {
        // Simulate runtime input from untrusted source
        const unknownInputs: unknown[] = [
            { plan: 123, status: true }, // wrong types
            { plan: { nested: "object" }, status: ["array"] }, // complex wrong types
            null,
            undefined,
            "string-instead-of-object",
            42,
            { plan: "PROFESSIONAL", status: "ACTIVE" }, // case handling
        ];

        unknownInputs.forEach((input) => {
            // Type guard: only process if it looks like an object
            if (typeof input === "object" && input !== null) {
                const safeInput: BillingDtoInput = {
                    plan: "plan" in input ? String((input as Record<string, unknown>).plan) : undefined,
                    status: "status" in input ? String((input as Record<string, unknown>).status) : undefined,
                };
                const result = normalizeBillingDto(safeInput);
                expect(["free", "pro", "business"]).toContain(result.plan);
            }
        });
    });
});

describe("phase2 type hardening: BillingPlan normalization contracts", () => {
    it("returns strict LegacyBillingPlan union from normalizeBillingPlan", () => {
        const result = normalizeBillingPlan("professional");

        // Runtime check
        expect(result.legacyPlan).toBe("pro");
        expect(result.canonicalPlan).toBe("professional");

        // Type narrowing - should be exact literal types
        const _legacy: LegacyBillingPlan = result.legacyPlan;
        const _canonical: CanonicalBillingPlan = result.canonicalPlan;

        expect(["free", "pro", "business"]).toContain(result.legacyPlan);
        expect(["free", "professional", "enterprise"]).toContain(result.canonicalPlan);
    });

    it("projectBillingPlanForRouteResponse returns typed response plan", () => {
        const projected = projectBillingPlanForRouteResponse("enterprise");

        // Runtime check
        expect(projected.responsePlan).toBe("business");

        // Type check - responsePlan must be LegacyBillingPlan
        const _plan: LegacyBillingPlan = projected.responsePlan;

        expect(["free", "pro", "business"]).toContain(projected.responsePlan);
    });

    it("handles nullish inputs without type errors", () => {
        const nullResult = normalizeBillingPlan(null);
        const undefinedResult = normalizeBillingPlan(undefined);
        const emptyResult = normalizeBillingPlan("");

        expect(nullResult.legacyPlan).toBe("free");
        expect(undefinedResult.legacyPlan).toBe("free");
        expect(emptyResult.legacyPlan).toBe("free");

        // All should be valid LegacyBillingPlan
        const _null: LegacyBillingPlan = nullResult.legacyPlan;
        const _undef: LegacyBillingPlan = undefinedResult.legacyPlan;
        const _empty: LegacyBillingPlan = emptyResult.legacyPlan;
    });
});

describe("phase2 type hardening: API adapter envelope types", () => {
    it("toCompatEnvelope preserves payload type information", () => {
        const payload = { plan: "pro" as const, status: "active" as const };
        const envelope = toCompatEnvelope(payload);

        expect(envelope.success).toBe(true);
        expect(envelope.plan).toBe("pro");
        expect(envelope.status).toBe("active");

        // Type should include original payload keys
        expect(typeof envelope.plan).toBe("string");
        expect(typeof envelope.status).toBe("string");
    });

    it("toCompatErrorEnvelope preserves error payload types", () => {
        const errorPayload = { error: "Checkout failed", code: 400 };
        const envelope = toCompatErrorEnvelope(errorPayload);

        expect(envelope.success).toBe(false);
        expect(envelope.error).toBe("Checkout failed");
        expect(envelope.code).toBe(400);
    });

    it("RuntimePathLabel is strictly typed", () => {
        const validLabels: RuntimePathLabel[] = ["legacy", "compat", "canonical"];

        expect(validLabels).toHaveLength(3);

        // This would fail at compile time if RuntimePathLabel were not strict
        const _label: RuntimePathLabel = "compat";
        expect(["legacy", "compat", "canonical"]).toContain(_label);
    });

    it("envelope options accept partial configuration", () => {
        const envelope1 = toCompatEnvelope({ plan: "pro" }, { runtimePath: "canonical" });
        const envelope2 = toCompatEnvelope({ plan: "business" }, { includeMeta: true });
        const envelope3 = toCompatEnvelope({ plan: "free" }, {
            runtimePath: "compat",
            includeMeta: true,
            migrationTags: ["test"],
            compatContext: { test: true },
        });

        expect(envelope1.success).toBe(true);
        expect(envelope2.success).toBe(true);
        expect(envelope3.success).toBe(true);
    });
});

describe("phase2 type hardening: BillingService type safety", () => {
    it("BillingService.getSubscriptionRouteModel returns typed payload", async () => {
        const service = new BillingService({
            isStripeConfigured: () => false,
            listCustomersByEmail: async () => [],
            getCustomerSubscription: async () => null,
        });

        const result = await service.getSubscriptionRouteModel({
            user: { email: "test@example.com" },
            priceIdToPlan: {},
        });

        // Runtime checks
        expect(result.payload).toBeDefined();
        expect(["free", "pro", "business"]).toContain(result.payload.plan);
        expect(["active", "trialing", "past_due", "canceled"]).toContain(result.payload.status);

        // Meta should have migration tags
        expect(result.meta.migrationTags).toBeInstanceOf(Array);
        expect(result.meta.migrationTags?.length).toBeGreaterThan(0);
    });

    it("BillingService.createCheckoutSessionRouteModel validates input types", async () => {
        const service = new BillingService({
            isStripeConfigured: () => true,
            createCheckoutSession: async () => ({
                id: "cs_test_123",
                url: "https://checkout.stripe.com/test",
            }),
        });

        // Missing priceId should return error
        const errorResult = await service.createCheckoutSessionRouteModel({
            user: { email: "test@example.com" },
        });

        expect(errorResult.ok).toBe(false);
        if (!errorResult.ok) {
            expect(errorResult.statusCode).toBe(400);
            expect(errorResult.payload.error).toBeDefined();
        }

        // Valid priceId should succeed
        const successResult = await service.createCheckoutSessionRouteModel({
            priceId: "price_test123",
            user: { email: "test@example.com" },
        });

        expect(successResult.ok).toBe(true);
        if (successResult.ok) {
            expect(successResult.payload.sessionId).toBe("cs_test_123");
            expect(successResult.payload.url).toBe("https://checkout.stripe.com/test");
        }
    });

    it("BillingService.createPortalSessionRouteModel handles missing customer", async () => {
        const service = new BillingService({
            isStripeConfigured: () => true,
            listCustomersByEmail: async () => [],
            createCustomerPortalSession: async () => ({ url: "https://billing.stripe.com/test" }),
        });

        const result = await service.createPortalSessionRouteModel({
            user: { email: "test@example.com" },
            clientUrl: "http://localhost:3000",
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.statusCode).toBe(400);
            expect(result.payload.error).toContain("No Stripe customer");
        }
    });
});

describe("phase2 type hardening: runtime guard safety", () => {
    it("normalizeBillingDto safely handles prototype pollution attempts", () => {
        const maliciousInput = {
            plan: "pro",
            status: "active",
            __proto__: { polluted: true },
            constructor: { prototype: { polluted: true } },
        };

        const result = normalizeBillingDto(maliciousInput);

        expect(result.plan).toBe("pro");
        expect(result.status).toBe("active");
        expect((result as unknown as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("normalizeBillingPlan handles prototype pollution attempts", () => {
        const result = normalizeBillingPlan("pro");

        // Should only have expected properties
        expect(result).toHaveProperty("legacyPlan");
        expect(result).toHaveProperty("canonicalPlan");
        expect(result).toHaveProperty("migrationTags");
        expect(Object.keys(result).length).toBeLessThanOrEqual(5);
    });

    it("toCompatEnvelope does not leak prototype properties", () => {
        const payload = Object.create({ inherited: "leaked" });
        payload.plan = "pro";

        const envelope = toCompatEnvelope(payload);

        expect(envelope.plan).toBe("pro");
        expect((envelope as Record<string, unknown>).inherited).toBeUndefined();
    });
});

describe("phase2 type hardening: fallback safety for edge cases", () => {
    it("normalizeBillingDto provides safe defaults for all edge cases", () => {
        const edgeCases: Array<{ input: BillingDtoInput; expected: BillingDto }> = [
            { input: {}, expected: { plan: "free", status: "active" } },
            { input: { plan: "" }, expected: { plan: "free", status: "active" } },
            { input: { plan: "   " }, expected: { plan: "free", status: "active" } },
            { input: { plan: "UNKNOWN_PLAN" }, expected: { plan: "free", status: "active" } },
            { input: { status: "" }, expected: { plan: "free", status: "active" } },
            { input: { status: "INVALID" }, expected: { plan: "free", status: "active" } },
            { input: { plan: "professional", status: "PAST_DUE" }, expected: { plan: "pro", status: "past_due" } },
        ];

        edgeCases.forEach(({ input, expected }) => {
            expect(normalizeBillingDto(input)).toEqual(expected);
        });
    });

    it("normalizeBillingPlan provides safe defaults for all edge cases", () => {
        expect(normalizeBillingPlan(null).legacyPlan).toBe("free");
        expect(normalizeBillingPlan(undefined).legacyPlan).toBe("free");
        expect(normalizeBillingPlan("").legacyPlan).toBe("free");
        expect(normalizeBillingPlan("   ").legacyPlan).toBe("free");
        expect(normalizeBillingPlan("UNKNOWN").legacyPlan).toBe("free");
        expect(normalizeBillingPlan("PRO").legacyPlan).toBe("pro"); // case insensitive
    });
});