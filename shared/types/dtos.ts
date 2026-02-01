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
