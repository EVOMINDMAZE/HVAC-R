// Billing DTO Types and Normalization
// These types represent the canonical billing contract shared across client/server/supabase

/**
 * Legacy billing plan values used in route responses.
 * Canonical values (professional, enterprise) are normalized to these legacy values
 * for backward compatibility with existing API clients.
 */
export type BillingPlan = "free" | "pro" | "business";

/**
 * Valid billing status values from Stripe subscription status.
 */
export type BillingStatus = "active" | "trialing" | "past_due" | "canceled";

/**
 * Normalized billing DTO returned by billing boundary.
 * All plan values are normalized to legacy format for API compatibility.
 */
export interface BillingDto {
    plan: BillingPlan;
    status: BillingStatus;
}

/**
 * Input shape for billing DTO normalization.
 * Accepts both legacy and canonical plan values.
 */
export interface BillingDtoInput {
    plan?: string | null;
    status?: string | null;
}

/**
 * Plan alias mapping from canonical/variant names to legacy values.
 */
const BILLING_PLAN_ALIAS_MAP: Record<string, BillingPlan> = {
    // Legacy values (passthrough)
    free: "free",
    pro: "pro",
    business: "business",
    // Canonical values (normalized)
    professional: "pro",
    enterprise: "business",
    // Yearly variants (normalized)
    professional_yearly: "pro",
    enterprise_yearly: "business",
    // Common aliases
    pro_yearly: "pro",
    business_yearly: "business",
};

/**
 * Valid billing status values for validation.
 */
const VALID_BILLING_STATUSES: Set<string> = new Set([
    "active",
    "trialing",
    "past_due",
    "canceled",
]);

/**
 * Normalizes billing DTO input to canonical contract.
 *
 * - Normalizes plan aliases (professional -> pro, enterprise -> business)
 * - Defaults missing/invalid plan to "free"
 * - Defaults missing/invalid status to "active"
 * - Handles case-insensitive plan inputs
 *
 * @param input - Raw billing input with optional plan/status
 * @returns Normalized BillingDto with legacy plan values
 */
export function normalizeBillingDto(input: BillingDtoInput): BillingDto {
    const rawPlan = String(input?.plan || "").trim().toLowerCase();
    const rawStatus = String(input?.status || "").trim().toLowerCase();

    const plan: BillingPlan = BILLING_PLAN_ALIAS_MAP[rawPlan] || "free";
    const status: BillingStatus = VALID_BILLING_STATUSES.has(rawStatus)
        ? (rawStatus as BillingStatus)
        : "active";

    return { plan, status };
}

// Calculator Input Types
export interface A2LCalculatorInputs {
    refrigerantId: string;
    area: number;
    height: number;
    areaUnit: 'm2' | 'ft2';
}

export interface A2LCalculatorResult {
    maxCharge: number; // kg
    lfl: number; // kg/m3
    limitType: 'A2L' | 'A3';
}

export interface AirflowCalculatorInputs {
    sensible_heat: number; // For client compatibility (if used)
    delta_t: number;      // For client compatibility (if used)
}

export interface DeltaTCalculatorInputs {
    return_temp: number;
    supply_temp: number;
}

// Server Request DTOs
export interface SaveCalculationRequest {
    type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle' | 'A2L Safety';
    name?: string;
    notes?: string;
    parameters: any;
    results: any;
}

export interface AirflowRequest {
    sensible_heat_btuh: number;
    delta_t_f: number;
}

export interface DeltaTRequest {
    return_temp_f: number;
    supply_temp_f: number;
}

export interface StandardCycleRequest {
    refrigerant: string;
    evap_temp_c: number;
    cond_temp_c: number;
    superheat_c: number;
    subcooling_c: number;
}

export interface CascadeCycleRequest {
    lt_cycle: StandardCycleRequest;
    ht_cycle: StandardCycleRequest;
}

export interface RefrigerantComparisonRequest {
    refrigerants: string[];
    cycle_params: StandardCycleRequest;
}
