import { describe, expect, it } from "vitest";

import { BillingService } from "../billing/BillingService.js";

describe("BillingService canonical billing boundary", () => {
    it("normalizes canonical user metadata plans while preserving legacy route response compatibility", async () => {
        const service = new BillingService({
            isStripeConfigured: () => false,
            listCustomersByEmail: async () => [],
            getCustomerSubscription: async () => null,
        });

        const result = await service.getSubscriptionRouteModel({
            user: {
                email: "tech@example.com",
                subscription_plan: "professional",
            },
            priceIdToPlan: {},
        });

        expect(result.payload).toMatchObject({
            subscription: null,
            plan: "pro",
            status: "active",
        });
        expect(result.meta?.migrationTags).toContain(
            "billing.boundary.canonical_service",
        );
        expect(result.meta?.migrationTags).toContain(
            "billing.plan.compat.normalized",
        );
    });

    it("projects stripe subscription into compatibility response payload while tagging migration path", async () => {
        const service = new BillingService({
            isStripeConfigured: () => true,
            listCustomersByEmail: async () => [{ id: "cus_123" }],
            getCustomerSubscription: async () => ({
                id: "sub_123",
                status: "active",
                current_period_end: 999999999,
                items: {
                    data: [
                        {
                            price: {
                                id: "price_professional_monthly",
                                unit_amount: 4900,
                                currency: "usd",
                                recurring: { interval: "month" },
                            },
                        },
                    ],
                },
            }),
        });

        const result = await service.getSubscriptionRouteModel({
            user: {
                email: "owner@example.com",
            },
            priceIdToPlan: {
                price_professional_monthly: "pro",
            },
        });

        expect(result.payload).toMatchObject({
            plan: "pro",
            status: "active",
            subscription: {
                id: "sub_123",
                plan: "pro",
                amount: 49,
                currency: "usd",
                interval: "month",
            },
        });
        expect(result.meta?.migrationTags).toContain(
            "billing.boundary.path.stripe_subscription",
        );
    });
});

