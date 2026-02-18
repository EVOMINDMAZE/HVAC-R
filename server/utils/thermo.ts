
// Simplified Thermodynamic Properties for MVP
// Note: In production, this should be replaced by CoolProp or NIST Refprop

interface RefrigerantConsts {
    name: string;
    criticalTemp: number; // K
    criticalPressure: number; // Pa
    antoine: { A: number; B: number; C: number }; // For Bar, Kelvin: log10(P) = A - B/(T+C)
}

const REFRIGERANTS: Record<string, RefrigerantConsts> = {
    'R134a': {
        name: 'R134a',
        criticalTemp: 374.2,
        criticalPressure: 4059000,
        antoine: { A: 4.06406, B: 1013.60, C: -46.6 } // Approx
    },
    'R410A': {
        name: 'R410A',
        criticalTemp: 344.5,
        criticalPressure: 4901000,
        antoine: { A: 4.2596, B: 1125.5, C: -35.2 } // Approx
    },
    'R744': {
        name: 'CO2',
        criticalTemp: 304.1,
        criticalPressure: 7377000,
        antoine: { A: 6.518, B: 1636.5, C: -5.3 } // invalid near critical, standard range only
    }
};

export const getSaturationPressure = (refrigerant: string, tempC: number): number => {
    // Return Pressure in Pascals
    const ref = REFRIGERANTS[refrigerant] ?? REFRIGERANTS['R134a']!; // Fallback to R134a 
    const tempK = tempC + 273.15;

    // Antoine Eq: log10(P_bar) = A - B / (T_K + C)
    const logP_bar = ref.antoine.A - (ref.antoine.B / (tempK + ref.antoine.C));
    const P_bar = Math.pow(10, logP_bar);

    return P_bar * 100000; // Convert Bar to Pa
};

export const calculateSimpleCycle = (
    refrigerant: string,
    evapTempC: number,
    condTempC: number,
    superheatK: number,
    subcoolingK: number
) => {
    const tempEvapK = evapTempC + 273.15;
    const tempCondK = condTempC + 273.15;

    // 1. Pressures
    const evapPressure = getSaturationPressure(refrigerant, evapTempC);
    const condPressure = getSaturationPressure(refrigerant, condTempC);
    const pressureRatio = condPressure / evapPressure;

    // 2. Ideal Carnot COP
    // COP_heating_carnot = T_high / (T_high - T_low)
    // COP_cooling_carnot = T_low / (T_high - T_low)
    const carnotCopCooling = tempEvapK / (tempCondK - tempEvapK);
    const carnotCopHeating = tempCondK / (tempCondK - tempEvapK);

    // 3. Estimated Real COP (Typical is 50-70% of Carnot)
    const efficiencyFactor = 0.60;
    const estimatedCopCooling = carnotCopCooling * efficiencyFactor;
    const estimatedCopHeating = carnotCopHeating * efficiencyFactor;

    // 4. Discharge Temperature Est (Isentropic compression approx)
    // T_disch = T_suc * (P_cond/P_evap)^((k-1)/k)
    // k approx 1.15 for vapor
    const k = 1.15;
    const k_factor = (k - 1) / k;
    const suctionTempK = tempEvapK + superheatK;
    const dischargeTempK = suctionTempK * Math.pow(pressureRatio, k_factor);

    return {
        evapPressurePa: evapPressure,
        condPressurePa: condPressure,
        pressureRatio,
        copCooling: estimatedCopCooling,
        copHeating: estimatedCopHeating,
        dischargeTempC: dischargeTempK - 273.15,
        suctionTempC: suctionTempK - 273.15,
        liquidTempC: condTempC - subcoolingK
    };
};
