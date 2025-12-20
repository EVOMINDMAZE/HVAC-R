
/**
 * Pressure-Temperature (PT) Chart Calculations for HVAC Refrigerants
 * Uses Antoine Equations and Regression Coefficients to determine Saturation Temperatures.
 * 
 * Supports varied coefficient bases (kPa/Kelvin, Bar/Log10, etc).
 */

export interface PTChartData {
    id: string;
    // Equation: [log_base](P) = A - B / (T + C)
    // where P is in 'pressureUnit' (Absolute) and T is in 'tempUnit'
    equationType?: "ln" | "log10"; // Default ln
    A: number;
    B: number;
    C: number;
    pressureUnit: "kpa" | "bar";
    tempUnit: "K" | "C";
    minTemp?: number;
    maxTemp?: number;
}

// Database of coefficients
const PT_DATABASE: PTChartData[] = [
    {
        id: "R22",
        // Stull (1947), range 232-358K (-40F to 185F)
        // log10(P_bar) = 4.36567 - 947.577 / (T_K - 14.964)
        equationType: "log10",
        A: 4.36567,
        B: 947.577,
        C: -14.964,
        pressureUnit: "bar",
        tempUnit: "K"
    },
    {
        id: "R134a",
        A: 14.41,
        B: 2094,
        C: -33.06,
        pressureUnit: "kpa",
        tempUnit: "K"
    },
    {
        id: "R290", // Propane
        A: 13.71,
        B: 1873,
        C: -25.10,
        pressureUnit: "kpa",
        tempUnit: "K"
    },
    {
        id: "R410A", // Dew Point
        A: 14.97,
        B: 2118,
        C: -17.27,
        pressureUnit: "kpa",
        tempUnit: "K"
    },
    {
        id: "R32",
        // Derived from Danfoss: ln(P_bar) = 10.271 - 2059.6 / (T_c + 252.1)
        // Validated range ~0C-50C
        A: 10.271,
        B: 2059.6,
        C: 252.1,
        pressureUnit: "bar",
        tempUnit: "C"
    },
    {
        id: "R404A",
        // Placeholder
        A: 0, B: 0, C: 0, pressureUnit: "kpa", tempUnit: "K"
    }
];

export function calculateSaturationTemperature(refrigerantId: string, pressurePsig: number, pressureInputUnit: "psig" | "kpa_g" = "psig"): number | null {
    // 1. Get Coefficients
    const data = PT_DATABASE.find(d => d.id === refrigerantId);

    // Safety check
    if (!data || (data.id === "R404A" && data.A === 0)) {
        return null;
    }

    // 2. Convert Input Pressure (Gauge) to Targe Absolute Unit

    // Get PSIA
    let psia = 0;
    if (pressureInputUnit === "psig") {
        psia = pressurePsig + 14.696;
    } else {
        // kPa gauge -> psia
        const P_abs_kpa = pressurePsig + 101.325;
        psia = P_abs_kpa * 0.145038;
    }

    if (psia <= 0) return null;

    // Convert PSIA to Equation Unit
    let P_target_abs = 0;
    if (data.pressureUnit === "kpa") {
        P_target_abs = psia * 6.89476;
    } else if (data.pressureUnit === "bar") {
        P_target_abs = psia * 0.0689476;
    }

    // 3. Solve Antoine
    // log_base(P) = A - B/(T + C)
    // T = (B / (A - log_base(P))) - C

    let logP = 0;
    if (data.equationType === "log10") {
        logP = Math.log10(P_target_abs);
    } else {
        // Default ln
        logP = Math.log(P_target_abs);
    }

    const calculated_T = (data.B / (data.A - logP)) - data.C;

    // 4. Convert calculated T back to Fahrenheit
    let final_F = 0;
    if (data.tempUnit === "K") {
        const C = calculated_T - 273.15;
        final_F = (C * 1.8) + 32;
    } else if (data.tempUnit === "C") {
        final_F = (calculated_T * 1.8) + 32;
    }

    return final_F;
}

export function isRefrigerantSupported(id: string): boolean {
    const r = PT_DATABASE.find(d => d.id === id);
    if (!r) return false;
    if (r.id === "R404A" && r.A === 0) return false;
    return true;
}
