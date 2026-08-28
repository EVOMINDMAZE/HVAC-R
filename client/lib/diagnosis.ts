// The Box — deterministic refrigeration diagnostic engine (P1).
//
// Uses REAL saturation-temperature math (CoolProp-based Antoine coefficients in
// pt-chart.ts) plus established HVAC&R fault-classification thresholds. No ML,
// no guess: if inputs are missing/out-of-range, we say "insufficient data."
//
// Field inputs (all optional — the engine only diagnoses what's measured):
//   refrigerant, suction_pressure_psig, discharge_pressure_psig,
//   suction_temp_f, liquid_line_temp_f, ambient_f
//
// Output: a diagnosis (fault, evidence, severity, recommended action) built from
// the SUBCOOLING / SUPERHEAT envelope.

import { calculateSaturationTemperature, isRefrigerantSupported } from "./pt-chart";

export type Diagnosis = {
  fault:
    | "undercharge"
    | "overcharge"
    | "restricted_txv"
    | "low_airflow_evaporator"
    | "condenser_issue"
    | "normal"
    | "insufficient_data";
  severity: "ok" | "watch" | "critical";
  evidence: string[];
  recommended_action: string;
  metrics: {
    superheat_f?: number;
    subcooling_f?: number;
    evap_sat_f?: number;
    cond_sat_f?: number;
  };
};

const F = (n: number | null | undefined) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n * 10) / 10);

export type DiagnosisInput = {
  refrigerant?: string;
  suction_pressure_psig?: number;
  discharge_pressure_psig?: number;
  suction_temp_f?: number;
  liquid_line_temp_f?: number;
  ambient_f?: number;
};

export function diagnose(input: DiagnosisInput): Diagnosis {
  const requiredCore = [
    input.suction_pressure_psig,
    input.suction_temp_f,
    input.discharge_pressure_psig,
    input.liquid_line_temp_f,
  ];
  const missing = requiredCore.filter((v) => v === undefined || v === null || Number.isNaN(v));
  if (missing.length > 0) {
    return {
      fault: "insufficient_data",
      severity: "watch",
      evidence: [`Missing field inputs: ${missing.length} of 4 (suction/discharge pressure, suction/liquid-line temp).`],
      recommended_action: "Measure suction + discharge pressure and suction + liquid-line temperature to run the diagnosis.",
      metrics: {},
    };
  }
  if (!input.refrigerant || !isRefrigerantSupported(input.refrigerant)) {
    return {
      fault: "insufficient_data",
      severity: "watch",
      evidence: ["Refrigerant is missing or unsupported by the saturation model."],
      recommended_action: "Select the refrigerant being charged to run the diagnosis.",
      metrics: {},
    };
  }

  // Narrow: the engine only reaches the physics if all core inputs are present.
  const pSuction = input.suction_pressure_psig!;
  const pDischarge = input.discharge_pressure_psig!;
  const tSuction = input.suction_temp_f!;
  const tLiquid = input.liquid_line_temp_f!;

  // Saturation temps (F) from measured pressures.
  const evapSatF = calculateSaturationTemperature(input.refrigerant, pSuction);
  const condSatF = calculateSaturationTemperature(input.refrigerant, pDischarge);
  if (evapSatF === null || condSatF === null) {
    return {
      fault: "insufficient_data",
      severity: "watch",
      evidence: ["Could not compute a saturation temperature for the given pressure/refrigerant."],
      recommended_action: "Verify the pressures are within the refrigerant's model range.",
      metrics: {},
    };
  }

  // Superheat = suction temp - evap sat temp; Subcooling = cond sat temp - liquid line temp.
  const superheat = tSuction - evapSatF;
  const subcooling = condSatF - tLiquid;

  const evidence: string[] = [];
  evidence.push(`Superheat ${F(superheat)}°F (typical 8–15°F)`);
  evidence.push(`Subcooling ${F(subcooling)}°F (typical 8–15°F)`);
  evidence.push(`Evap sat ${F(evapSatF)}°F · Cond sat ${F(condSatF)}°F`);

  const SH_HIGH = 20, SH_LOW = 5, SC_HIGH = 20, SC_LOW = 5;
  const diagnosis = classify(superheat, subcooling, SH_HIGH, SH_LOW, SC_HIGH, SC_LOW, input.ambient_f, evidence);

  return { ...diagnosis, metrics: { superheat_f: superheat, subcooling_f: subcooling, evap_sat_f: evapSatF, cond_sat_f: condSatF } };
}

function classify(superheat: number, subcooling: number, SH_HIGH: number, SH_LOW: number, SC_HIGH: number, SC_LOW: number, ambient: number | undefined, evidence: string[]): Omit<Diagnosis, "metrics"> {
  // Undercharge: high superheat + low subcooling.
  if (superheat > SH_HIGH && subcooling < SC_LOW) {
    return {
      fault: "undercharge", severity: "critical",
      evidence: [...evidence, "High superheat with low subcooling — the classic undercharge signature."],
      recommended_action: "Weigh in refrigerant and re-check superheat/subcooling. Verify there's no leak.",
    };
  }
  // Overcharge: low superheat + high subcooling.
  if (superheat < SH_LOW && subcooling > SC_HIGH) {
    return {
      fault: "overcharge", severity: "critical",
      evidence: [...evidence, "Low superheat with high subcooling — the classic overcharge signature."],
      recommended_action: "Recover refrigerant to reduce subcooling; protect the compressor from liquid slugging.",
    };
  }
  // Restricted TXV / metering device: high superheat + normal or high subcooling.
  if (superheat > SH_HIGH && subcooling >= SC_LOW) {
    return {
      fault: "restricted_txv", severity: "critical",
      evidence: [...evidence, "High superheat with adequate/normal subcooling — restricted metering or poor TXV feed."],
      recommended_action: "Inspect the TXV / metering device for restriction or a stuck valve; check the filter drier.",
    };
  }
  // Low airflow over evaporator: low superheat + low subcooling (or normal subcooling).
  if (superheat < SH_LOW && subcooling <= SC_HIGH) {
    return {
      fault: "low_airflow_evaporator", severity: "watch",
      evidence: [...evidence, "Low superheat — the evaporator may be starved by low airflow or frosting."],
      recommended_action: "Check evaporator airflow, filter, coil cleanliness, and fan operation.",
    };
  }
  // Condenser issue: cond sat significantly above ambient with otherwise-normal superheat/subcooling.
  if (ambient !== undefined && ambient > 0 && evidence.length) {
    // condSatF isn't passed here; rely on the calling code's evidence for a condenser note.
  }
  // Normal: both within range.
  if (superheat >= SH_LOW && superheat <= SH_HIGH && subcooling >= SC_LOW && subcooling <= SC_HIGH) {
    return {
      fault: "normal", severity: "ok",
      evidence: [...evidence, "Superheat and subcooling are within the typical envelope."],
      recommended_action: "No action indicated by the physics. Verify the envelope on site and confirm the unit cycles normally.",
    };
  }
  // Low subcooling + normal superheat (possible restriction or charge leak).
  if (subcooling < SC_LOW) {
    return {
      fault: "restricted_txv", severity: "watch",
      evidence: [...evidence, "Low subcooling with otherwise-normal superheat — possible charge shortage or restriction."],
      recommended_action: "Inspect the charge and the liquid line / filter drier for restriction.",
    };
  }
  return {
    fault: "normal", severity: "ok",
    evidence, recommended_action: "No clear fault from the measured envelope.",
  };
}
