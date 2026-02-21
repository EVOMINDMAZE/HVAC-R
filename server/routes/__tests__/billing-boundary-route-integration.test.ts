import { describe, expect, it, vi } from "vitest";
import { createGetSubscriptionHandler } from "../billing.js";

function createMockResponse() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe("billing route canonical boundary integration", () => {
    it("does not include metadata envelope when x-compat-meta header is absent", async () => {
        const service = {
            getSubscriptionRouteModel: vi.fn(async () => ({
                payload: {
                    subscription: null,
                    plan: "pro",
                    status: "active",
                },
                meta: {
                    migrationTags: ["billing.boundary.canonical_service"],
                },
            })),
        };

        const handler = createGetSubscriptionHandler(service as any);
        const req = {
            headers: {},
            runtimePath: "compat",
            user: {
                email: "owner@example.com",
                subscription_plan: "professional",
            },
        } as any;
        const res = createMockResponse();

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            subscription: null,
            plan: "pro",
            status: "active",
        });
    });

    it("delegates subscription projection to canonical boundary and preserves compat envelope shape", async () => {
        const service = {
            getSubscriptionRouteModel: vi.fn(async () => ({
                payload: {
                    subscription: null,
                    plan: "pro",
                    status: "active",
                },
                meta: {
                    migrationTags: [
                        "billing.boundary.canonical_service",
                        "billing.plan.compat.normalized",
                    ],
                },
            })),
        };

        const handler = createGetSubscriptionHandler(service as any);
        const req = {
            headers: { "x-compat-meta": "1" },
            runtimePath: "compat",
            user: {
                email: "owner@example.com",
                subscription_plan: "professional",
            },
        } as any;
        const res = createMockResponse();

        await handler(req, res);

        expect(service.getSubscriptionRouteModel).toHaveBeenCalledWith({
            user: req.user,
            priceIdToPlan: expect.any(Object),
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                plan: "pro",
                status: "active",
                _meta: expect.objectContaining({
                    runtimePath: "compat",
                    migrationTags: expect.arrayContaining([
                        "billing.boundary.canonical_service",
                    ]),
                }),
            }),
        );
    });
});
