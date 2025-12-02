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
    sensible_heat: number;
    delta_t: number;
}

export interface DeltaTCalculatorInputs {
    return_temp: number;
    supply_temp: number;
}
