export interface CalculationPresetPayload {
  type: string;
  inputs: unknown;
  results?: unknown;
  sourceId?: string;
}

export const HISTORY_PRESET_STORAGE_KEY = "simulateon:preset-calculation";

export function storeCalculationPreset(preset: CalculationPresetPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(HISTORY_PRESET_STORAGE_KEY, JSON.stringify(preset));
  } catch (error) {
    console.warn("Failed to store calculation preset", error);
  }
}

export function consumeCalculationPreset(): CalculationPresetPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(HISTORY_PRESET_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(HISTORY_PRESET_STORAGE_KEY);
    return JSON.parse(raw) as CalculationPresetPayload;
  } catch (error) {
    console.warn("Failed to parse calculation preset", error);
    try {
      sessionStorage.removeItem(HISTORY_PRESET_STORAGE_KEY);
    } catch (cleanupError) {
      console.warn("Failed to cleanup preset storage", cleanupError);
    }
    return null;
  }
}
