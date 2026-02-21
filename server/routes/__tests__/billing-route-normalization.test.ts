import { describe, expect, it } from "vitest";
import { projectBillingPlanForRouteResponse } from "../compat/billingPlanCompat.js";

describe("billing route plan normalization projection", () => {
    it("projects canonical professional metadata while keeping legacy pro response value", () => {
        const projected = projectBillingPlanForRouteResponse("professional");

        expect(projected).toMatchObject({
            responsePlan: "pro",
            meta: {
                migrationTags: ["billing.plan.compat.normalized"],
                compatContext: {
                    billingPlan: {
                        canonicalPlan: "professional",
                        normalizedFrom: "professional",
                    },
                },
            },
        });
    });

    it("projects canonical enterprise metadata while keeping legacy business response value", () => {
        const projected = projectBillingPlanForRouteResponse("enterprise");

        expect(projected).toMatchObject({
            responsePlan: "business",
            meta: {
                migrationTags: ["billing.plan.compat.normalized"],
                compatContext: {
                    billingPlan: {
                        canonicalPlan: "enterprise",
                        normalizedFrom: "enterprise",
                    },
                },
            },
        });
    });
});

