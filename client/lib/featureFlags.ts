const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);
const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);
const PERSISTED_BOOLEAN_QUERY_KEYS = ["uiFuture", "bypassAuth"] as const;
const PERSISTED_STRING_QUERY_KEYS = ["uiFutureSkin"] as const;

export type FutureMonitorSkin = "classic" | "hud" | "infographic";

function normalizeFlagValue(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value == null) return null;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;

  if (ENABLED_VALUES.has(normalized)) return true;
  if (DISABLED_VALUES.has(normalized)) return false;

  return null;
}

function normalizeSkinValue(value: unknown): FutureMonitorSkin | null {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "hud") return "hud";
  if (normalized === "infographic") return "infographic";
  if (normalized === "classic") return "classic";
  return null;
}

export interface FutureMonitorFlagOptions {
  envValue?: unknown;
  search?: string;
}

export function resolveFutureMonitorsFlag(
  options: FutureMonitorFlagOptions = {},
): boolean {
  const envValue =
    options.envValue ?? import.meta.env.VITE_FUTURE_MONITORS_V1 ?? "true";
  const fromEnv = normalizeFlagValue(envValue) ?? true;

  const search =
    options.search ??
    (typeof window !== "undefined" ? window.location.search : "");

  if (!search) return fromEnv;

  try {
    const params = new URLSearchParams(search);
    if (!params.has("uiFuture")) return fromEnv;
    const fromQuery = normalizeFlagValue(params.get("uiFuture"));
    return fromQuery ?? fromEnv;
  } catch {
    return fromEnv;
  }
}

export function isFutureMonitorsEnabled(): boolean {
  return resolveFutureMonitorsFlag();
}

export interface FutureMonitorSkinOptions {
  envValue?: unknown;
  search?: string;
}

export function resolveFutureMonitorsSkin(
  options: FutureMonitorSkinOptions = {},
): FutureMonitorSkin {
  const envValue =
    options.envValue ?? import.meta.env.VITE_FUTURE_MONITORS_SKIN ?? "hud";
  const fromEnv = normalizeSkinValue(envValue) ?? "hud";

  const search =
    options.search ??
    (typeof window !== "undefined" ? window.location.search : "");

  if (!search) return fromEnv;

  try {
    const params = new URLSearchParams(search);
    if (!params.has("uiFutureSkin")) return fromEnv;
    const fromQuery = normalizeSkinValue(params.get("uiFutureSkin"));
    return fromQuery ?? fromEnv;
  } catch {
    return fromEnv;
  }
}

export function getFutureMonitorsSkin(): FutureMonitorSkin {
  return resolveFutureMonitorsSkin();
}

export interface PersistUiFlagOptions {
  search?: string;
}

export function withPersistedUiFlags(
  target: string,
  options: PersistUiFlagOptions = {},
): string {
  if (!target) return target;

  const search =
    options.search ??
    (typeof window !== "undefined" ? window.location.search : "");
  if (!search) return target;

  let sourceParams: URLSearchParams;
  try {
    sourceParams = new URLSearchParams(search);
  } catch {
    return target;
  }

  const [targetWithoutHash, hashFragment = ""] = target.split("#");
  const [targetPath, targetQuery = ""] = (targetWithoutHash ?? "").split("?");
  const targetParams = new URLSearchParams(targetQuery);

  for (const key of PERSISTED_BOOLEAN_QUERY_KEYS) {
    const value = sourceParams.get(key);
    if (value == null) continue;
    const normalized = normalizeFlagValue(value);
    if (normalized == null) continue;
    targetParams.set(key, normalized ? "1" : "0");
  }

  for (const key of PERSISTED_STRING_QUERY_KEYS) {
    const value = sourceParams.get(key);
    if (value == null) continue;
    const normalized = normalizeSkinValue(value);
    if (normalized == null) continue;
    targetParams.set(key, normalized);
  }

  const query = targetParams.toString();
  const hash = hashFragment ? `#${hashFragment}` : "";
  return `${targetPath}${query ? `?${query}` : ""}${hash}`;
}

export function shouldBypassAuth(): boolean {
  return shouldBypassAuthWithEnv();
}

export interface BypassAuthOptions {
  env?: { DEV?: boolean; PROD?: boolean };
  search?: string;
}

export function shouldBypassAuthWithEnv(options: BypassAuthOptions = {}): boolean {
  const env = options.env ?? import.meta.env;
  if (env.PROD) {
    return false;
  }

  try {
    const search =
      options.search ??
      (typeof window !== "undefined" ? window.location.search : "");
    if (!search) return false;

    const params = new URLSearchParams(search);
    if (params.get("bypassAuth") === "1" && env.DEV) {
      return true;
    }
  } catch {
    // ignore errors in SSR or when localStorage is blocked
  }

  return false;
}
