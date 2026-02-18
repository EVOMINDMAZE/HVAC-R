
import { RequestHandler } from "express";
import { calculateSimpleCycle } from "../utils/thermo.js";

import {
    AirflowRequest,
    DeltaTRequest,
    StandardCycleRequest
} from "@shared/types/dtos";

export const calculateAirflow: RequestHandler = (req, res) => {
    try {
        const { sensible_heat_btuh, delta_t_f }: AirflowRequest = req.body;

        if (typeof sensible_heat_btuh !== 'number' || typeof delta_t_f !== 'number' || delta_t_f === 0) {
            return res.status(400).json({ error: "Invalid inputs" });
        }

        // Formula: CFM = Q_sensible / (1.08 * DeltaT)
        // 1.08 is the standard air constant (density * specific heat * 60)
        const airflow_cfm = sensible_heat_btuh / (1.08 * delta_t_f);

        return res.json({
            success: true,
            data: {
                airflow_cfm,
                sensible_heat_btuh,
                delta_t_f
            }
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return res.status(500).json({ error: message });
    }
};

export const calculateDeltaT: RequestHandler = (req, res) => {
    try {
        const { return_temp_f, supply_temp_f }: DeltaTRequest = req.body;

        if (typeof return_temp_f !== 'number' || typeof supply_temp_f !== 'number') {
            return res.status(400).json({ error: "Invalid inputs" });
        }

        const delta_t_f = return_temp_f - supply_temp_f;

        let status = "Normal";
        if (delta_t_f < 15) status = "Low Delta T (Possible Airflow Issue or Low Charge)";
        else if (delta_t_f > 25) status = "High Delta T (Possible Airflow Restriction)";

        return res.json({
            success: true,
            data: {
                delta_t_f,
                return_temp_f,
                supply_temp_f,
                status
            }
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return res.status(500).json({ error: message });
    }
};

export const calculateStandardCycleEndpoint: RequestHandler = (req, res) => {
    try {
        const { refrigerant, evap_temp_c, cond_temp_c, superheat_c, subcooling_c }: StandardCycleRequest = req.body;

        if (!refrigerant || evap_temp_c === undefined || cond_temp_c === undefined) {
            return res.status(400).json({ error: "Missing required cycle parameters" });
        }

        // Perform calculation using simplified model
        const result = calculateSimpleCycle(
            refrigerant,
            evap_temp_c,
            cond_temp_c,
            superheat_c || 5,
            subcooling_c || 5
        );

        // Map to client expected format
        const responseData = {
            refrigerant,
            cycle_type: "standard",
            state_points: {
                "1": { // Suction
                    temp_c: result.suctionTempC,
                    pressure_kpa: result.evapPressurePa / 1000,
                    // Mock enthalpy for visualization stability if needed by UI
                    enthalpy_kj_kg: 400,
                    entropy_kj_kg_k: 1.7,
                    phase: "Vapor"
                },
                "2": { // Discharge
                    temp_c: result.dischargeTempC,
                    pressure_kpa: result.condPressurePa / 1000,
                    enthalpy_kj_kg: 450,
                    entropy_kj_kg_k: 1.75, // Entropy gain
                    phase: "Vapor"
                },
                "3": { // Condenser Outlet
                    temp_c: result.liquidTempC,
                    pressure_kpa: result.condPressurePa / 1000,
                    enthalpy_kj_kg: 250,
                    entropy_kj_kg_k: 1.1,
                    phase: "Liquid"
                },
                "4": { // Evaporator Inlet
                    temp_c: evap_temp_c,
                    pressure_kpa: result.evapPressurePa / 1000,
                    enthalpy_kj_kg: 250, // Isenthalpic expansion
                    entropy_kj_kg_k: 1.15,
                    phase: "Mixture"
                }
            },
            performance: {
                cop: result.copCooling,
                cooling_capacity_kw: 10.0, // Mock fixed capacity for MVP
                compressor_work_kw: 10.0 / result.copCooling,
                heat_rejection_kw: 10.0 + (10.0 / result.copCooling),
                pressure_ratio: result.pressureRatio,
                discharge_limit_warning: result.dischargeTempC > 135 // Generic limit check
            },
            // Empty saturation dome to prevent UI crashing on undefined, or mock generic dome
            saturation_dome: {
                ph_diagram: {
                    enthalpy_kj_kg: [200, 300, 400, 500],
                    pressure_kpa: [result.evapPressurePa / 1000, result.condPressurePa / 1000]
                },
                ts_diagram: {
                    entropy_kj_kgk: [1.0, 1.5, 2.0],
                    temperature_c: [evap_temp_c, cond_temp_c]
                },
                tv_diagram: {
                    specific_volume_m3_kg: [0.001, 0.1],
                    temperature_c: [evap_temp_c, cond_temp_c]
                }
            }
        };

        return res.json({
            success: true,
            data: responseData
        });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Calculation failed";
        console.error("Calculation error:", e);
        return res.status(500).json({ error: message });
    }
};

export const compareRefrigerantsEndpoint: RequestHandler = (req, res) => {
    try {
        const { refrigerants, cycle_params } = req.body;

        if (!Array.isArray(refrigerants) || refrigerants.length === 0 || !cycle_params) {
            return res.status(400).json({ error: "Invalid inputs for comparison" });
        }

        const results = refrigerants.map(ref => {
            // Use the simplified calculation for each
            const result = calculateSimpleCycle(
                ref,
                cycle_params.evap_temp_c,
                cycle_params.cond_temp_c,
                cycle_params.superheat_c || 5,
                cycle_params.subcooling_c || 5
            );

            return {
                refrigerant: ref,
                cop: result.copCooling,
                refrigerationEffect: 180 - (result.pressureRatio * 2), // Slight penalty for high lift
                workInput: (180 - (result.pressureRatio * 2)) / result.copCooling,
                heatRejection: (180 - (result.pressureRatio * 2)) * (1 + 1 / result.copCooling),
                volumetricCapacity: (result.evapPressurePa / 1000) * 0.95, // Rough approximation VCC ~ P_suction
                dischargePressure: result.condPressurePa / 1000,
                suctionPressure: result.evapPressurePa / 1000,
                performance: {
                    cop: result.copCooling,
                    cooling_capacity_kw: 10.0,
                    compressor_work_kw: 10.0 / result.copCooling,
                }
            };
        });

        return res.json({
            success: true,
            data: { results }
        });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Comparison failed";
        console.error("Comparison error:", e);
        return res.status(500).json({ error: message });
    }
};

export const calculateCascadeCycleEndpoint: RequestHandler = (req, res) => {
    try {
        const { lt_cycle, ht_cycle } = req.body;

        if (!lt_cycle || !ht_cycle) {
            return res.status(400).json({ error: "Missing LT or HT cycle parameters" });
        }

        // 1. Calculate LT Cycle
        const ltResult = calculateSimpleCycle(
            lt_cycle.refrigerant,
            lt_cycle.evap_temp_c,
            lt_cycle.cond_temp_c,
            lt_cycle.superheat_c || 5,
            lt_cycle.subcooling_c || 5
        );

        // 2. Calculate HT Cycle
        const htResult = calculateSimpleCycle(
            ht_cycle.refrigerant,
            ht_cycle.evap_temp_c,
            ht_cycle.cond_temp_c,
            ht_cycle.superheat_c || 5,
            ht_cycle.subcooling_c || 5
        );

        // 3. Energy Balance (Base Load = 10 kW)
        const Q_evap_LT = 10.0; // kW
        const W_LT = Q_evap_LT / ltResult.copCooling;
        const Q_cond_LT = Q_evap_LT + W_LT;

        // Cascade Hand-off
        const Q_evap_HT = Q_cond_LT;
        const W_HT = Q_evap_HT / htResult.copCooling;
        const Q_cond_HT = Q_evap_HT + W_HT;

        const W_total = W_LT + W_HT;
        const System_COP = Q_evap_LT / W_total;

        const responseData = {
            system: {
                cop: System_COP,
                cooling_capacity_kw: Q_evap_LT,
                total_work_kw: W_total,
                heat_rejection_kw: Q_cond_HT
            },
            lt_cycle: {
                refrigerant: lt_cycle.refrigerant,
                cop: ltResult.copCooling,
                capacity_kw: Q_evap_LT,
                work_kw: W_LT,
                heat_rejection_kw: Q_cond_LT,
                pressures: {
                    evap_kpa: ltResult.evapPressurePa / 1000,
                    cond_kpa: ltResult.condPressurePa / 1000
                },
                temps: {
                    discharge_c: ltResult.dischargeTempC,
                    suction_c: ltResult.suctionTempC
                }
            },
            ht_cycle: {
                refrigerant: ht_cycle.refrigerant,
                cop: htResult.copCooling,
                capacity_kw: Q_evap_HT,
                work_kw: W_HT,
                heat_rejection_kw: Q_cond_HT,
                pressures: {
                    evap_kpa: htResult.evapPressurePa / 1000,
                    cond_kpa: htResult.condPressurePa / 1000
                },
                temps: {
                    discharge_c: htResult.dischargeTempC,
                    suction_c: htResult.suctionTempC
                }
            }
        };

        return res.json({
            success: true,
            data: responseData
        });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Cascade Calculation failed";
        console.error("Cascade Calculation error:", e);
        return res.status(500).json({ error: message });
    }
};

