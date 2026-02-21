export type LegacyBillingPlan = "free" | "pro" | "business";
export type CanonicalBillingPlan = "free" | "professional" | "enterprise";

export type BillingPlanNormalization = {
    legacyPlan: LegacyBillingPlan;
    canonicalPlan: CanonicalBillingPlan;
    normalizedFrom?: string;
    migrationTags: string[];
};

const LEGACY_TO_CANONICAL: Record<LegacyBillingPlan, CanonicalBillingPlan> = {
    free: "free",
    pro: "professional",
    business: "enterprise",
};

const CANONICAL_TO_LEGACY: Record<CanonicalBillingPlan, LegacyBillingPlan> = {
    free: "free",
    professional: "pro",
    enterprise: "business",
};

export function normalizeBillingPlan(input?: string | null): BillingPlanNormalization {
    const rawPlan = String(input || "").trim().toLowerCase();

    if (rawPlan === "pro" || rawPlan === "business" || rawPlan === "free") {
        return {
            legacyPlan: rawPlan,
            canonicalPlan: LEGACY_TO_CANONICAL[rawPlan],
            migrationTags: ["billing.plan.compat.passthrough"],
        };
    }

    if (
        rawPlan === "professional" ||
        rawPlan === "enterprise" ||
        rawPlan === "professional_yearly" ||
        rawPlan === "enterprise_yearly"
    ) {
        const canonicalPlan: CanonicalBillingPlan = rawPlan.startsWith("professional")
            ? "professional"
            : "enterprise";

        return {
            legacyPlan: CANONICAL_TO_LEGACY[canonicalPlan],
            canonicalPlan,
            normalizedFrom: rawPlan,
            migrationTags: ["billing.plan.compat.normalized"],
        };
    }

    return {
        legacyPlan: "free",
        canonicalPlan: "free",
        ...(rawPlan ? { normalizedFrom: rawPlan } : {}),
        migrationTags: ["billing.plan.compat.defaulted_free"],
    };
}

export function toBillingPlanCompatContext(normalized: BillingPlanNormalization) {
    return {
        billingPlan: {
            canonicalPlan: normalized.canonicalPlan,
            ...(normalized.normalizedFrom
                ? { normalizedFrom: normalized.normalizedFrom }
                : {}),
        },
    };
}

export function projectBillingPlanForRouteResponse(input?: string | null) {
    const normalized = normalizeBillingPlan(input);

    return {
        responsePlan: normalized.legacyPlan,
        meta: {
            migrationTags: normalized.migrationTags,
            compatContext: toBillingPlanCompatContext(normalized),
        },
    };
}
