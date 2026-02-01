
/**
 * Formula Oracle: Centralized HVAC Physics Engine
 * Use these for all calculations to ensure consistency across UI and backend.
 */

import { calculateSaturationTemperature } from "./pt-chart";

/**
 * Calculates Superheat
 * Formula: Actual Temperature - Saturation Temperature
 */
export function calculateSuperheat(
    refrigerantId: string,
    suctionPressurePsig: number,
    lineTempF: number
): { superheat: number | null; satTemp: number | null } {
    const satTemp = calculateSaturationTemperature(refrigerantId, suctionPressurePsig);
    if (satTemp === null) return { superheat: null, satTemp: null };

    return {
        superheat: lineTempF - satTemp,
        satTemp
    };
}

/**
 * Calculates Subcooling
 * Formula: Saturation Temperature - Liquid Line Temperature
 */
export function calculateSubcooling(
    refrigerantId: string,
    liquidPressurePsig: number,
    liquidLineTempF: number
): { subcooling: number | null; satTemp: number | null } {
    const satTemp = calculateSaturationTemperature(refrigerantId, liquidPressurePsig);
    if (satTemp === null) return { subcooling: null, satTemp: null };

    return {
        subcooling: satTemp - liquidLineTempF,
        satTemp
    };
}

/**
 * Target Superheat (Standard Fixed Orifice Formula)
 * Formula: ((3 * IndoorWetBulb) - 80 - OutdoorDryBulb) / 2
 */
export function calculateTargetSuperheat(indoorWetBulb: number, outdoorDryBulb: number): number {
    return ((3 * indoorWetBulb) - 80 - outdoorDryBulb) / 2;
}
