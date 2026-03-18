export type AuthRuntimePathLabel = "legacy" | "compat" | "canonical";
export type AuthValidationPath = "legacy" | "canonical";

export type AuthValidationResult =
    | { ok: true; user: Record<string, unknown> }
    | { ok: false; error: string };

type AuthValidationFn = (token: string) => Promise<AuthValidationResult>;

type BuildSequenceInput = {
    token: string;
    runtimePath?: string | null;
};

type RunGuardInput = {
    token: string;
    runtimePath?: string | null;
    validateCanonical: AuthValidationFn;
    validateLegacy: AuthValidationFn;
};

type AuthGuardSuccess = {
    ok: true;
    user: Record<string, unknown>;
    authPath: AuthValidationPath;
    runtimePath: AuthRuntimePathLabel;
    fallbackUsed: boolean;
    migrationTags: string[];
};

type AuthGuardFailure = {
    ok: false;
    error: string;
    authPath: AuthValidationPath;
    runtimePath: AuthRuntimePathLabel;
    fallbackUsed: boolean;
    migrationTags: string[];
};

function isLikelyJwt(token: string): boolean {
    return (token.match(/\./g) || []).length >= 2;
}

export function normalizeAuthRuntimePath(
    runtimePath?: string | null,
): AuthRuntimePathLabel {
    const normalized = String(runtimePath || "").toLowerCase();
    if (normalized === "legacy") {
        return "legacy";
    }

    if (normalized === "canonical") {
        return "canonical";
    }

    return "compat";
}

export function buildAuthValidationSequence(
    input: BuildSequenceInput,
): AuthValidationPath[] {
    const runtimePath = normalizeAuthRuntimePath(input.runtimePath);

    if (runtimePath === "canonical") {
        return ["canonical", "legacy"];
    }

    if (runtimePath === "legacy") {
        return ["legacy", "canonical"];
    }

    return isLikelyJwt(input.token)
        ? ["canonical", "legacy"]
        : ["legacy", "canonical"];
}

function buildMigrationTags(
    runtimePath: AuthRuntimePathLabel,
    authPath?: AuthValidationPath,
): string[] {
    const tags = [`auth.path.${runtimePath}`];
    if (runtimePath === "compat" && authPath) {
        tags.push(`auth.path.${authPath}`);
    }

    return tags;
}

export async function runAuthCompatibilityGuard(
    input: RunGuardInput,
): Promise<AuthGuardSuccess | AuthGuardFailure> {
    const runtimePath = normalizeAuthRuntimePath(input.runtimePath);
    const sequence = buildAuthValidationSequence({
        token: input.token,
        runtimePath,
    });

    // Sequence always returns exactly 2 elements, but TypeScript needs assertion in strict mode
    const primaryPath: AuthValidationPath = sequence[0] ?? "canonical";
    const fallbackPath: AuthValidationPath = sequence[1] ?? "legacy";

    const validators: Record<AuthValidationPath, AuthValidationFn> = {
        canonical: input.validateCanonical,
        legacy: input.validateLegacy,
    };

    const primaryValidator = validators[primaryPath];
    const primaryResult = await primaryValidator(input.token);
    if (primaryResult.ok) {
        return {
            ok: true,
            user: primaryResult.user,
            authPath: primaryPath,
            runtimePath,
            fallbackUsed: false,
            migrationTags: buildMigrationTags(runtimePath, primaryPath),
        };
    }

    const primaryError =
        "error" in primaryResult ? primaryResult.error : "Authentication failed";

    const fallbackValidator = validators[fallbackPath];
    const shouldFallback = fallbackValidator !== primaryValidator;
    if (!shouldFallback) {
        return {
            ok: false,
            error: primaryError,
            authPath: primaryPath,
            runtimePath,
            fallbackUsed: false,
            migrationTags: buildMigrationTags(runtimePath, primaryPath),
        };
    }

    const fallbackResult = await fallbackValidator(input.token);
    if (fallbackResult.ok) {
        return {
            ok: true,
            user: fallbackResult.user,
            authPath: fallbackPath,
            runtimePath,
            fallbackUsed: true,
            migrationTags: buildMigrationTags(runtimePath, fallbackPath),
        };
    }

    return {
        ok: false,
        error: primaryError,
        authPath: primaryPath,
        runtimePath,
        fallbackUsed: true,
        migrationTags: buildMigrationTags(runtimePath, primaryPath),
    };
}

export function toCompatAuthContext(decoded: any) {
    const meta = decoded?.user_metadata || {};
    return {
        id: String(decoded?.sub || ""),
        email: decoded?.email || null,
        stripe_customer_id: meta.stripe_customer_id || null,
        stripe_subscription_id: meta.stripe_subscription_id || null,
        subscription_plan: meta.subscription_plan || "free",
        subscription_status: meta.subscription_status || "active",
        active_company_id: meta.active_company_id || null,
        active_role: meta.active_role || null,
        user_metadata: meta,
    };
}
