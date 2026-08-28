import { describe, it, expect } from "vitest";
import { diagnose, DiagnosisInput } from "./diagnosis";

// REAL R410A saturation temps (from the Antoine model): evap sat @118psig = 39.13°F,
// cond sat @260psig = 84.97°F. Superheat = suction_temp - 39.13; Subcooling = 84.97 - liquid.
// We set field temps to produce the intended superheat/subcooling envelope.

function base(over: Partial<DiagnosisInput>): DiagnosisInput {
  return {
    refrigerant: "R410A",
    suction_pressure_psig: 118,   // evap sat ~ 39.13°F
    discharge_pressure_psig: 260, // cond sat ~ 84.97°F
    suction_temp_f: 49,           // SH ~ 10°F
    liquid_line_temp_f: 77,       // SC ~ 8°F
    ambient_f: 90,
    ...over,
  };
}

describe("P1 diagnostic engine", () => {
  it("returns insufficient_data when inputs are missing (never guesses)", () => {
    const d = diagnose({ refrigerant: "R410A" } as any);
    expect(d.fault).toBe("insufficient_data");
    expect(d.severity).toBe("watch");
  });

  it("returns insufficient_data for an unsupported refrigerant", () => {
    const d = diagnose({ ...base({}), refrigerant: "R9999" });
    expect(d.fault).toBe("insufficient_data");
  });

  it("classifies a normal charge (in-range superheat + subcooling)", () => {
    const d = diagnose(base({})); // SH ~10 (in 5-20), SC ~8 (in 5-20)
    expect(d.fault).toBe("normal");
    expect(d.severity).toBe("ok");
  });

  it("classifies undercharge (high superheat + low subcooling)", () => {
    const d = diagnose(base({ suction_temp_f: 64, liquid_line_temp_f: 82 })); // SH ~25, SC ~3
    expect(d.fault).toBe("undercharge");
    expect(d.severity).toBe("critical");
  });

  it("classifies overcharge (low superheat + high subcooling)", () => {
    const d = diagnose(base({ suction_temp_f: 42, liquid_line_temp_f: 60 })); // SH ~3, SC ~25
    expect(d.fault).toBe("overcharge");
    expect(d.severity).toBe("critical");
  });

  it("classifies restricted TXV (high superheat + normal subcooling)", () => {
    const d = diagnose(base({ suction_temp_f: 64, liquid_line_temp_f: 75 })); // SH ~25, SC ~10
    expect(d.fault).toBe("restricted_txv");
  });

  it("exposes the real saturation metrics used in the diagnosis", () => {
    const d = diagnose(base({}));
    expect(d.metrics.superheat_f).toBeGreaterThan(0);
    expect(d.metrics.subcooling_f).toBeGreaterThan(0);
    expect(d.metrics.evap_sat_f).toBeCloseTo(39.13, 0);
    expect(d.metrics.cond_sat_f).toBeCloseTo(84.97, 0);
  });
});
