import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface HistoricalCalculation {
  id: string;
  user_id: string;
  type: string;
  parameters: any;
  results: any;
  created_at: string;
}

interface TroubleshootingSession {
  symptoms?: string[];
  measurements?: Record<string, number>;
  diagnosis?: string;
  outcome?: string;
  equipment_model?: string;
  success_rate?: number;
}

class SupabasePatternMigration {
  private batchSize = 100;
  private processedCount = 0;
  private errorCount = 0;

  async migrateAllHistoricalData(): Promise<void> {
    console.log("Starting Supabase historical data migration...");

    try {
      // Get all troubleshooting calculations
      const troubleshootingCalculations =
        await this.getTroubleshootingCalculations();
      console.log(
        `Found ${troubleshootingCalculations.length} troubleshooting calculations to process`,
      );

      // Process in batches
      for (
        let i = 0;
        i < troubleshootingCalculations.length;
        i += this.batchSize
      ) {
        const batch = troubleshootingCalculations.slice(i, i + this.batchSize);
        await this.processBatch(batch);

        console.log(
          `Processed batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(troubleshootingCalculations.length / this.batchSize)}`,
        );
      }

      // Get user-company associations and create patterns
      await this.migrateUserCompanyAssociations();

      console.log(
        `Migration completed successfully! Processed: ${this.processedCount}, Errors: ${this.errorCount}`,
      );
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  private async getTroubleshootingCalculations(): Promise<
    HistoricalCalculation[]
  > {
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .in("type", ["Troubleshooting", "AI Troubleshooting", "Diagnostic"])
      .order("created_at", { ascending: false })
      .range(0, 1000); // Limit for initial migration

    if (error) {
      throw new Error(
        `Failed to fetch troubleshooting calculations: ${error.message}`,
      );
    }

    return data || [];
  }

  private async processBatch(
    calculations: HistoricalCalculation[],
  ): Promise<void> {
    for (const calculation of calculations) {
      try {
        await this.processSingleCalculation(calculation);
        this.processedCount++;
      } catch (error) {
        console.error(`Error processing calculation ${calculation.id}:`, error);
        this.errorCount++;
      }
    }
  }

  private async getUserCompanyId(userId: string): Promise<string | undefined> {
    const { data, error } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    
    if (error) {
      console.warn(`Failed to get company for user ${userId}:`, error);
      return undefined;
    }
    
    return data?.[0]?.id;
  }

  private async processSingleCalculation(
    calculation: HistoricalCalculation,
  ): Promise<void> {
    const session = this.extractTroubleshootingSession(calculation);
    if (!session) {
      return; // Skip if no relevant data
    }

    const companyId = await this.getUserCompanyId(calculation.user_id);
    if (companyId === undefined) {
      console.warn(`No company found for user ${calculation.user_id}`);
      return;
    }

    // Create symptom outcome pattern if we have data
    if (session.symptoms && session.diagnosis && session.outcome) {
      await this.createSymptomOutcomePattern(
        session.symptoms,
        session.diagnosis,
        session.outcome,
        companyId,
        session.equipment_model,
      );
    }

    // Create measurement anomaly patterns for abnormal readings
    if (session.measurements) {
      await this.createMeasurementAnomalies(
        session.measurements,
        session.diagnosis || "Unknown",
        companyId,
      );
    }

    // Store diagnostic outcome if we have session context
    if (calculation.parameters?.session_context) {
      await this.storeDiagnosticOutcome(
        calculation.id,
        session,
        calculation.user_id,
        companyId,
      );
    }
  }

  private extractTroubleshootingSession(
    calculation: HistoricalCalculation,
  ): TroubleshootingSession | null {
    const parameters = calculation.parameters;
    const results = calculation.results;

    // Extract symptoms
    const symptoms = this.extractSymptoms(parameters, results);

    // Extract measurements
    const measurements = this.extractMeasurements(parameters, results);

    // Extract diagnosis and outcome
    const diagnosis = results?.diagnosis || parameters?.diagnosis;
    const outcome = this.inferOutcome(parameters, results);
    const equipment_model =
      parameters?.equipment_model || results?.equipment_model;

    if (!symptoms.length && !measurements) {
      return null;
    }

    return {
      symptoms,
      measurements,
      diagnosis,
      outcome,
      equipment_model,
      success_rate: results?.success_rate,
    };
  }

  private extractSymptoms(parameters: any, results: any): string[] {
    const symptoms: string[] = [];

    // From parameters
    if (parameters?.symptom) symptoms.push(parameters.symptom);
    if (parameters?.symptoms && Array.isArray(parameters.symptoms)) {
      symptoms.push(...parameters.symptoms);
    }

    // From results/analysis
    if (results?.symptoms) {
      if (Array.isArray(results.symptoms)) {
        symptoms.push(...results.symptoms);
      } else if (typeof results.symptoms === "string") {
        symptoms.push(results.symptoms);
      }
    }

    // From AI analysis
    if (results?.ai_analysis?.symptoms) {
      symptoms.push(...results.ai_analysis.symptoms);
    }

    // Filter and deduplicate
    return [...new Set(symptoms.filter((s) => s && typeof s === "string"))];
  }

  private extractMeasurements(
    parameters: any,
    results: any,
  ): Record<string, number> {
    const measurements: Record<string, number> = {};

    // Common HVAC measurements
    const measurementFields = [
      "suction_pressure",
      "head_pressure",
      "discharge_pressure",
      "low_side_pressure",
      "high_side_pressure",
      "evaporator_pressure",
      "condenser_pressure",
      "suction_temp",
      "discharge_temp",
      "liquid_line_temp",
      "evaporator_temp",
      "condenser_temp",
      "ambient_temp",
      "indoor_temp",
      "outdoor_temp",
      "superheat",
      "subcooling",
      "voltage",
      "current",
      "frequency",
      "airflow_cfm",
      "static_pressure",
      "delta_t",
      "pressure_drop",
    ];

    // Extract from parameters
    measurementFields.forEach((field) => {
      const value = parameters?.measurements?.[field] || parameters?.[field];
      if (typeof value === "number" && !isNaN(value)) {
        measurements[field] = value;
      }
    });

    // Extract from results
    if (results?.measurements) {
      Object.entries(results.measurements).forEach(([key, value]) => {
        if (typeof value === "number" && !isNaN(value)) {
          measurements[key] = value;
        }
      });
    }

    return measurements;
  }

  private inferOutcome(parameters: any, results: any): string {
    // Try to get explicit outcome
    if (results?.outcome) return results.outcome;
    if (parameters?.outcome) return parameters.outcome;

    // Infer from success rate or confidence
    if (results?.success_rate) {
      if (results.success_rate >= 0.8) return "success";
      if (results.success_rate >= 0.5) return "partial";
      return "failed";
    }

    if (results?.confidence) {
      if (results.confidence >= 85) return "success";
      if (results.confidence >= 60) return "partial";
      return "failed";
    }

    // Default to unknown (will be filtered out)
    return "unknown";
  }

  private normalizeOutcome(outcome: string): "success" | "partial" | "failed" {
    const normalized = outcome.toLowerCase();

    if (
      normalized.includes("success") ||
      normalized.includes("resolved") ||
      normalized.includes("fixed")
    ) {
      return "success";
    }
    if (
      normalized.includes("partial") ||
      normalized.includes("improved") ||
      normalized.includes("better")
    ) {
      return "partial";
    }
    if (
      normalized.includes("failed") ||
      normalized.includes("unresolved") ||
      normalized.includes("no improvement")
    ) {
      return "failed";
    }

    // Default to partial if unclear
    return "partial";
  }

  private async createSymptomOutcomePattern(
    symptoms: string[],
    diagnosis: string,
    outcome: string,
    companyId: string,
    equipmentModel?: string,
  ): Promise<string> {
    try {
      const patternData = {
        symptoms,
        diagnosis,
        outcome: this.normalizeOutcome(outcome),
        timestamp: new Date().toISOString(),
        equipment_model: equipmentModel,
      };

      const { data, error } = await supabase
        .from("ai_learning_patterns")
        .insert({
          pattern_type: "symptom_outcome",
          pattern_data: patternData,
          company_id: companyId,
          equipment_model: equipmentModel,
          confidence_score: 50, // Initial confidence
          occurrence_count: 1,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data?.id || "";
    } catch (error) {
      console.error("Error creating symptom outcome pattern:", error);
      throw error;
    }
  }

  private async createMeasurementAnomalies(
    measurements: Record<string, number>,
    diagnosis: string,
    companyId: string,
  ): Promise<void> {
    const expectedRanges: Record<string, { min: number; max: number }> = {
      suction_pressure: { min: 50, max: 85 }, // psi (R410A typical range)
      head_pressure: { min: 200, max: 400 }, // psi (R410A typical range)
      superheat: { min: 5, max: 15 }, // degrees F
      subcooling: { min: 5, max: 15 }, // degrees F
      voltage: { min: 110, max: 130 }, // volts (120V circuit)
      current: { min: 5, max: 50 }, // amps (varies by equipment)
    };

    for (const [parameter, value] of Object.entries(measurements)) {
      const range = expectedRanges[parameter];
      if (range && (value < range.min || value > range.max)) {
        try {
          await supabase.from("ai_learning_patterns").insert({
            pattern_type: "measurement_anomaly",
            pattern_data: {
              parameter,
              measured_value: value,
              expected_range: range,
              diagnosis: `${diagnosis} - Abnormal ${parameter.replace("_", " ")}`,
              timestamp: new Date().toISOString(),
              deviation_percent: Math.abs(
                ((value - (range.min + range.max) / 2) /
                  ((range.min + range.max) / 2)) *
                  100,
              ),
            },
            company_id: companyId,
            confidence_score: 60, // Moderate confidence for anomalies
            occurrence_count: 1,
          });
        } catch (error) {
          console.error(
            `Failed to create measurement anomaly for ${parameter}:`,
            error,
          );
        }
      }
    }
  }

  private async storeDiagnosticOutcome(
    calculationId: string,
    session: TroubleshootingSession,
    userId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const aiRecommendations = {
        diagnosis: session.diagnosis,
        symptoms: session.symptoms,
        measurements: session.measurements,
        equipment_model: session.equipment_model,
        confidence: session.success_rate ? session.success_rate * 100 : 50,
      };

      const technicianActions = {
        actions_taken: [], // Would need to extract from parameters
        notes: session.diagnosis,
        time_spent: null, // Would need to extract from parameters
      };

      const finalResolution = {
        outcome: session.outcome,
        success_rating: this.outcomeToRating(session.outcome),
        parts_replaced: [], // Would need to extract from parameters
        follow_up_required: session.outcome !== "success",
      };

      await supabase.from("diagnostic_outcomes").insert({
        troubleshooting_session_id: calculationId,
        ai_recommendations: aiRecommendations,
        technician_actions: technicianActions,
        final_resolution: finalResolution,
        success_rating: this.outcomeToRating(session.outcome),
        followup_required: session.outcome !== "success",
        notes: session.diagnosis,
        user_id: userId,
        company_id: companyId,
      });
    } catch (error) {
      console.error("Failed to store diagnostic outcome:", error);
    }
  }

  private outcomeToRating(outcome?: string): number {
    if (!outcome) return 3; // neutral rating

    switch (this.normalizeOutcome(outcome)) {
      case "success":
        return 5;
      case "partial":
        return 3;
      case "failed":
        return 1;
      default:
        return 3;
    }
  }

  private async migrateUserCompanyAssociations(): Promise<void> {
    console.log("Migrating user-company associations...");

    try {
      // Get all users and ensure they have company associations
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();

      for (const user of users) {
        try {
          // Check if user role exists
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

          if (!existingRole) {
            // Try to get company association from companies table
            const { data: company } = await supabase
              .from("companies")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (company) {
              await supabase.from("user_roles").insert({
                user_id: user.id,
                role: "admin",
                company_id: company.id,
              });
            }
          }
        } catch (error) {
          console.warn(`Could not ensure user role for ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error migrating user associations:", error);
    }
  }

  async dryRun(): Promise<void> {
    console.log("Running migration dry run (no data will be modified)...");

    const troubleshootingCalculations =
      await this.getTroubleshootingCalculations();
    console.log(
      `Found ${troubleshootingCalculations.length} troubleshooting calculations to process`,
    );

    let potentialPatterns = 0;
    let potentialAnomalies = 0;
    let potentialOutcomes = 0;

    for (const calculation of troubleshootingCalculations.slice(0, 10)) {
      // Sample first 10
      const session = this.extractTroubleshootingSession(calculation);
      if (session) {
        if (session.symptoms && session.diagnosis && session.outcome) {
          potentialPatterns++;
        }
        if (session.measurements) {
          potentialAnomalies++;
        }
        if (calculation.parameters?.session_context) {
          potentialOutcomes++;
        }
      }
    }

    console.log(
      `Estimated patterns to create: ${Math.round((potentialPatterns * troubleshootingCalculations.length) / 10)}`,
    );
    console.log(
      `Estimated anomalies to create: ${Math.round((potentialAnomalies * troubleshootingCalculations.length) / 10)}`,
    );
    console.log(
      `Estimated outcomes to store: ${Math.round((potentialOutcomes * troubleshootingCalculations.length) / 10)}`,
    );
  }
}

// Export for use in migration scripts
export { SupabasePatternMigration };

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new SupabasePatternMigration();

  if (process.argv.includes("--dry-run")) {
    await migration.dryRun();
  } else {
    await migration.migrateAllHistoricalData();
  }

  process.exit(0);
}
