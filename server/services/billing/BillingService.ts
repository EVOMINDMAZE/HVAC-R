import {
    projectBillingPlanForRouteResponse,
} from "../../routes/compat/billingPlanCompat.js";
import {
    createCheckoutSession,
    createCustomerPortalSession,
    getCustomerSubscription,
    stripe,
} from "../../utils/stripe.js";

type BillingCompatMeta = {
    migrationTags?: string[];
    compatContext?: Record<string, unknown>;
};

type BillingUserContext = {
    id?: string;
    email?: string;
    stripe_customer_id?: string | null;
    subscription_plan?: string | null;
};

type SubscriptionPrice = {
    id?: string;
    unit_amount?: number | null;
    currency?: string | null;
    recurring?: {
        interval?: string | null;
    };
};

type StripeSubscriptionLike = {
    id: string;
    status: string;
    current_period_end?: number | null;
    items: {
        data: Array<{
            price: SubscriptionPrice;
        }>;
    };
};

type PortalSessionLike = {
    url?: string | null;
};

type CheckoutSessionLike = {
    id: string;
    url?: string | null;
};

type BillingServiceDependencies = {
    isStripeConfigured: () => boolean;
    listCustomersByEmail: (email: string) => Promise<Array<{ id: string }>>;
    getCustomerSubscription: (
        customerId: string,
    ) => Promise<StripeSubscriptionLike | null>;
    createCheckoutSession: (
        priceId: string,
        stripeCustomerId?: string,
        customerEmail?: string,
        userId?: string,
    ) => Promise<CheckoutSessionLike>;
    createCustomerPortalSession: (
        customerId: string,
        returnUrl: string,
    ) => Promise<PortalSessionLike>;
};

type BillingRouteModelSuccess = {
    ok: true;
    payload: Record<string, unknown>;
    meta?: BillingCompatMeta;
};

type BillingRouteModelError = {
    ok: false;
    statusCode: number;
    payload: Record<string, unknown>;
    meta?: BillingCompatMeta;
};

const BILLING_BOUNDARY_TAG = "billing.boundary.canonical_service";

function mergeMigrationTags(...groups: Array<string[] | undefined>): string[] {
    const flattened = groups.flat().filter((tag): tag is string => Boolean(tag));
    return Array.from(new Set(flattened));
}

function toBoundaryMeta(pathTag: string, meta?: BillingCompatMeta): BillingCompatMeta {
    const migrationTags = mergeMigrationTags(
        [BILLING_BOUNDARY_TAG, pathTag],
        meta?.migrationTags,
    );

    return {
        migrationTags,
        compatContext: {
            ...(meta?.compatContext || {}),
            billingBoundary: {
                service: "BillingService",
                path: pathTag,
            },
        },
    };
}

export class BillingService {
    private readonly deps: BillingServiceDependencies;

    constructor(partialDeps: Partial<BillingServiceDependencies> = {}) {
        this.deps = {
            isStripeConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
            listCustomersByEmail: async (email: string) => {
                const customers = await stripe.customers.list({ email, limit: 1 });
                return customers.data.map((customer) => ({ id: customer.id }));
            },
            getCustomerSubscription: async (customerId: string) =>
                (await getCustomerSubscription(customerId)) as StripeSubscriptionLike | null,
            createCheckoutSession: async (
                priceId: string,
                stripeCustomerId?: string,
                customerEmail?: string,
                userId?: string,
            ) =>
                (await createCheckoutSession(
                    priceId,
                    stripeCustomerId,
                    customerEmail,
                    userId,
                )) as CheckoutSessionLike,
            createCustomerPortalSession: async (customerId: string, returnUrl: string) =>
                (await createCustomerPortalSession(customerId, returnUrl)) as PortalSessionLike,
            ...partialDeps,
        };
    }

    async createCheckoutSessionRouteModel(input: {
        priceId?: string;
        user: BillingUserContext;
    }): Promise<BillingRouteModelSuccess | BillingRouteModelError> {
        if (!input.priceId) {
            return {
                ok: false,
                statusCode: 400,
                payload: { error: "Price ID is required" },
                meta: toBoundaryMeta("billing.boundary.path.checkout_validation"),
            };
        }

        const session = await this.deps.createCheckoutSession(
            input.priceId,
            input.user.stripe_customer_id || undefined,
            input.user.email,
            input.user.id,
        );

        return {
            ok: true,
            payload: {
                sessionId: session.id,
                url: session.url,
            },
            meta: toBoundaryMeta("billing.boundary.path.checkout_session"),
        };
    }

    async createPortalSessionRouteModel(input: {
        user: BillingUserContext;
        clientUrl: string;
    }): Promise<BillingRouteModelSuccess | BillingRouteModelError> {
        let customerId = input.user.stripe_customer_id || undefined;

        if (!customerId && input.user.email) {
            const customers = await this.deps.listCustomersByEmail(input.user.email);
            const firstCustomer = customers[0];
            if (firstCustomer) {
                customerId = firstCustomer.id;
            }
        }

        if (!customerId) {
            return {
                ok: false,
                statusCode: 400,
                payload: {
                    error: "No Stripe customer found. Please make a purchase first.",
                },
                meta: toBoundaryMeta("billing.boundary.path.portal_missing_customer"),
            };
        }

        const returnUrl = `${input.clientUrl}/profile`;
        const session = await this.deps.createCustomerPortalSession(customerId, returnUrl);

        return {
            ok: true,
            payload: {
                url: session.url,
            },
            meta: toBoundaryMeta("billing.boundary.path.portal_session"),
        };
    }

    async getSubscriptionRouteModel(input: {
        user: BillingUserContext;
        priceIdToPlan: Record<string, string>;
    }): Promise<{ payload: Record<string, unknown>; meta: BillingCompatMeta }> {
        if (!this.deps.isStripeConfigured()) {
            const projectedPlan = projectBillingPlanForRouteResponse(
                input.user.subscription_plan || "free",
            );

            return {
                payload: {
                    subscription: null,
                    plan: projectedPlan.responsePlan,
                    status: "active",
                },
                meta: toBoundaryMeta("billing.boundary.path.no_stripe", projectedPlan.meta),
            };
        }

        let customerId = input.user.stripe_customer_id || undefined;

        if (!customerId && input.user.email) {
            const customers = await this.deps.listCustomersByEmail(input.user.email);
            const firstCustomer = customers[0];
            if (firstCustomer) {
                customerId = firstCustomer.id;
            }
        }

        if (!customerId) {
            return {
                payload: {
                    subscription: null,
                    plan: "free",
                    status: "active",
                },
                meta: toBoundaryMeta("billing.boundary.path.no_customer"),
            };
        }

        const subscription = await this.deps.getCustomerSubscription(customerId);
        if (!subscription) {
            return {
                payload: {
                    subscription: null,
                    plan: "free",
                    status: "active",
                },
                meta: toBoundaryMeta("billing.boundary.path.no_subscription"),
            };
        }

        const priceId = subscription.items.data[0]?.price.id;
        const rawPlanName = (priceId && input.priceIdToPlan[priceId]) || "free";
        const projectedPlan = projectBillingPlanForRouteResponse(rawPlanName);

        return {
            payload: {
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    current_period_end: subscription.current_period_end,
                    plan: projectedPlan.responsePlan,
                    amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
                    currency: subscription.items.data[0]?.price.currency,
                    interval: subscription.items.data[0]?.price.recurring?.interval,
                },
                plan: projectedPlan.responsePlan,
                status: subscription.status,
            },
            meta: toBoundaryMeta(
                "billing.boundary.path.stripe_subscription",
                projectedPlan.meta,
            ),
        };
    }
}

