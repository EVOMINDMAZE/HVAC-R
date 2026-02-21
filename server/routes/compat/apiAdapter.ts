export type RuntimePathLabel = "legacy" | "compat" | "canonical";

type CompatEnvelopeOptions = {
    runtimePath?: string | null;
    includeMeta?: boolean;
    migrationTags?: string[];
    compatContext?: Record<string, unknown>;
};

function normalizeRuntimePathLabel(
    runtimePath?: string | null,
): RuntimePathLabel {
    const normalized = String(runtimePath || "").toLowerCase();
    if (normalized === "legacy") {
        return "legacy";
    }

    if (normalized === "canonical") {
        return "canonical";
    }

    return "compat";
}

function buildMeta(options?: CompatEnvelopeOptions) {
    if (!options?.includeMeta) {
        return undefined;
    }

    const migrationTags = Array.isArray(options.migrationTags)
        ? options.migrationTags.filter((tag) => Boolean(tag))
        : [];

    return {
        runtimePath: normalizeRuntimePathLabel(options.runtimePath),
        ...(migrationTags.length > 0 ? { migrationTags } : {}),
        ...(options.compatContext ? { compat: options.compatContext } : {}),
    };
}

export function toCompatEnvelope<T extends Record<string, unknown>>(
    payload: T,
    options?: CompatEnvelopeOptions,
) {
    const meta = buildMeta(options);

    return {
        success: true,
        ...payload,
        ...(meta ? { _meta: meta } : {}),
    };
}

export function toCompatErrorEnvelope<T extends Record<string, unknown>>(
    payload: T,
    options?: CompatEnvelopeOptions,
) {
    const meta = buildMeta(options);

    return {
        success: false,
        ...payload,
        ...(meta ? { _meta: meta } : {}),
    };
}
