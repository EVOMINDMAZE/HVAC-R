/**
 * A2L Refrigerant Charge Limit Calculator
 * Based on IEC 60335-2-40 / ASHRAE 15
 */

export interface A2LCalculationParams {
    lfl: number; // Lower Flammability Limit (kg/m³)
    height: number; // Installation height (m)
    area: number; // Room area (m²)
}

/**
 * Calculates the maximum allowable charge for A2L refrigerants
 * Formula: m_max = 2.5 * (LFL)^(5/4) * h_inst * sqrt(A)
 * 
 * @param params Calculation parameters
 * @returns Maximum allowable charge in kg
 */
export function calculateA2LChargeLimit(params: A2LCalculationParams): number {
    const { lfl, height, area } = params;

    if (lfl <= 0 || height <= 0 || area < 0) {
        return 0;
    }

    // m_max = 2.5 * (LFL)^(1.25) * h * sqrt(A)
    const m_max = 2.5 * Math.pow(lfl, 1.25) * height * Math.sqrt(area);

    return m_max;
}

/**
 * Calculates the minimum required room area for a given charge
 * Derived from: A_min = (m_c / (2.5 * (LFL)^(5/4) * h_inst))^2
 * 
 * @param charge Charge amount in kg
 * @param lfl Lower Flammability Limit (kg/m³)
 * @param height Installation height (m)
 * @returns Minimum area in m²
 */
export function calculateMinAreaForA2L(charge: number, lfl: number, height: number): number {
    if (charge <= 0 || lfl <= 0 || height <= 0) {
        return 0;
    }

    const denominator = 2.5 * Math.pow(lfl, 1.25) * height;
    if (denominator === 0) return 0;

    const area = Math.pow(charge / denominator, 2);
    return area;
}
