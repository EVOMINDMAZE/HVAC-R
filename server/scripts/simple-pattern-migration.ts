import { supabaseAdmin } from "../utils/supabase.js";

class SimplePatternMigration {
  async migrateHistoricalData(): Promise<void> {
    console.log("Starting simple historical data migration...");

    try {
      // Get recent calculations with symptoms or measurements
      const { data: calculations, error } = await supabaseAdmin!
        .from("calculations")
        .select("*")
        .or(
          "parameters.ilike.%symptom%,parameters.ilike.%measurements%,parameters.ilike.%diagnosis%",
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to fetch calculations: ${error.message}`);
      }

      console.log(`Found ${calculations?.length || 0} calculations to analyze`);

      let patternsCreated = 0;
      let anomaliesCreated = 0;

      for (const calculation of calculations || []) {
        const params = calculation.parameters;
        const results = calculation.results;

        // Extract symptoms
        const symptoms = this.extractSymptoms(params, results);

        // Extract measurements
        const measurements = this.extractMeasurements(params, results);

        // Extract diagnosis and outcome
        const diagnosis = results?.diagnosis || params?.diagnosis;
        const outcome = this.inferOutcome(params, results);

        if (symptoms.length > 0 && diagnosis && outcome) {
          // Create symptom pattern
          await supabaseAdmin!.from("ai_learning_patterns").insert({
            pattern_type: "symptom_outcome",
            pattern_data: {
              symptoms,
              diagnosis,
              outcome,
              timestamp: new Date().toISOString(),
            },
            company_id: await this.getCompanyId(calculation.user_id),
            equipment_model: params?.equipment_model,
            confidence_score: 60,
            occurrence_count: 1,
          });

          patternsCreated++;
        }

        // Create measurement anomalies for abnormal readings
        if (measurements) {
          for (const [param, value] of Object.entries(measurements)) {
            if (this.isAbnormalReading(param, value)) {
              await supabaseAdmin!.from("ai_learning_patterns").insert({
                pattern_type: "measurement_anomaly",
                pattern_data: {
                  parameter: param,
                  measured_value: value,
                  expected_range: this.getExpectedRange(param),
                  diagnosis: `${diagnosis} - Abnormal ${param.replace("_", " ")}`,
                  timestamp: new Date().toISOString(),
                },
                company_id: await this.getCompanyId(calculation.user_id),
                confidence_score: 50,
                occurrence_count: 1,
              });

              anomaliesCreated++;
            }
          }
        }
      }

      console.log(
        `Migration completed! Created ${patternsCreated} symptom patterns and ${anomaliesCreated} measurement anomalies`,
      );
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  private extractSymptoms(parameters: any, results: any): string[] {
    const symptoms: string[] = [];

    if (parameters?.symptom) symptoms.push(parameters.symptom);
    if (parameters?.symptoms && Array.isArray(parameters.symptoms)) {
      symptoms.push(...parameters.symptoms);
    }
    if (results?.symptoms) {
      if (Array.isArray(results.symptoms)) {
        symptoms.push(...results.symptoms);
      } else if (typeof results.symptoms === "string") {
        symptoms.push(results.symptoms);
      }
    }

    return [...new Set(symptoms.filter((s) => s && typeof s === "string"))];
  }

  private extractMeasurements(
    parameters: any,
    results: any,
  ): Record<string, number> {
    const measurements: Record<string, number> = {};

    // Common HVAC measurements to extract
    const measurementFields = [
      "suction_pressure",
      "head_pressure",
      "discharge_pressure",
      "suction_temp",
      "discharge_temp",
      "liquid_line_temp",
      "evaporator_temp",
      "condenser_temp",
      "superheat",
      "subcooling",
      "voltage",
      "current",
    ];

    measurementFields.forEach((field) => {
      let value = parameters?.measurements?.[field] || parameters?.[field];
      if (!value) value = results?.measurements?.[field] || results?.[field];
      if (typeof value === "number" && !isNaN(value)) {
        measurements[field] = value;
      }
    });

    return measurements;
  }

  private inferOutcome(parameters: any, results: any): string {
    if (results?.outcome) return results.outcome;
    if (parameters?.outcome) return parameters.outcome;
    if (results?.success_rate) {
      if (results.success_rate >= 0.8) return "success";
      if (results.success_rate >= 0.5) return "partial";
      return "failed";
    }
    return "partial"; // Default
  }

  private isAbnormalReading(parameter: string, value: number): boolean {
    const ranges: Record<string, { min: number; max: number }> = {
      suction_pressure: { min: 50, max: 85 },
      head_pressure: { min: 200, max: 400 },
      superheat: { min: 5, max: 15 },
      subcooling: { min: 5, max: 15 },
      voltage: { min: 110, max: 130 },
    };

    const range = ranges[parameter];
    return range ? value < range.min || value > range.max : false;
  }

  private getExpectedRange(parameter: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      suction_pressure: { min: 50, max: 85 },
      head_pressure: { min: 200, max: 400 },
      superheat: { min: 5, max: 15 },
      subcooling: { min: 5, max: 15 },
      voltage: { min: 110, max: 130 },
    };

    return ranges[parameter] || { min: 0, max: 100 };
  }

  private async getCompanyId(userId: string): Promise<string> {
    try {
      const { data: role } = await supabaseAdmin!
        .from("user_roles")
        .select("company_id")
        .eq("user_id", userId)
        .single();

      if (role?.company_id) return role.company_id;
    } catch {
      try {
        const { data: company } = await supabaseAdmin!
          .from("companies")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (company?.id) return company.id;
      } catch {
        return "default-company";
      }
    }
    return "default-company";
  }

  async dryRun(): Promise<void> {
    console.log(
      "Running simple migration dry run (no data will be modified)...",
    );

    const { data: calculations } = await supabaseAdmin!
      .from("calculations")
      .select("id, parameters, results")
      .ilike("parameters", "%symptom%")
      .limit(10);

    console.log(`Found ${calculations?.length || 0} calculations to sample`);

    let potentialPatterns = 0;
    let potentialAnomalies = 0;

    for (const calculation of calculations || []) {
      const symptoms = this.extractSymptoms(
        calculation.parameters,
        calculation.results,
      );
      const measurements = this.extractMeasurements(
        calculation.parameters,
        calculation.results,
      );

      if (symptoms.length > 0) potentialPatterns++;
      if (
        measurements &&
        Object.values(measurements).some((v) =>
          this.isAbnormalReading("any", v),
        )
      ) {
        potentialAnomalies++;
      }
    }

    console.log(
      `Estimated patterns to create: ${Math.round((potentialPatterns * (calculations || []).length) / 10)}`,
    );
    console.log(
      `Estimated anomalies to create: ${Math.round((potentialAnomalies * (calculations || []).length) / 10)}`,
    );
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new SimplePatternMigration();

  if (process.argv.includes("--dry-run")) {
    await migration.dryRun();
  } else {
    await migration.migrateHistoricalData();
  }

  process.exit(0);
}
