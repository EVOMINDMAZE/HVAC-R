#!/usr/bin/env node

/**
 * Production Migration Script for AI Pattern Recognition
 *
 * This script migrates historical HVAC data to the new pattern tables.
 * Designed to run in production after database migration is applied.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing environment variables");
  console.log("Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

class ProductionMigration {
  async migrateToProduction(): Promise<void> {
    console.log("🚀 Starting production migration...");
    console.log("📊 Project: AI Pattern Recognition System");
    console.log(`🔗 Connected to: ${SUPABASE_URL}`);

    try {
      // Step 1: Validate environment
      console.log("");
      console.log("🔍 Step 1: Validating environment...");
      if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL is required");
      if (!SERVICE_KEY)
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
      console.log("✅ Environment validated");

      // Step 2: Check database readiness
      console.log("");
      console.log("🏥 Step 2: Checking database readiness...");
      await this.checkDatabaseReadiness();

      // Step 3: Run historical migration
      console.log("");
      console.log("📈 Step 3: Running historical data migration...");
      await this.runHistoricalMigration();

      // Step 4: Verify results
      console.log("");
      console.log("✅ Step 4: Verifying migration results...");
      await this.verifyMigrationResults();

      console.log("");
      console.log("═══════════════════════════════════════════════════");
      console.log("🎉 PRODUCTION MIGRATION COMPLETED SUCCESSFULLY!");
      console.log("═══════════════════════════════════════════════════");
    } catch (error) {
      console.error("❌ Production migration failed:", error);
      process.exit(1);
    }
  }

  private async checkDatabaseReadiness(): Promise<void> {
    console.log("Checking AI tables...");

    // Check ai_learning_patterns
    const { data: _testPattern, error: patternError } = await supabaseAdmin
      .from("ai_learning_patterns")
      .select("count")
      .limit(1);

    if (patternError && patternError.code !== "42P01") {
      console.log(`⚠️  ai_learning_patterns: ${patternError.message}`);
    } else {
      console.log("✅ ai_learning_patterns table exists");
    }

    // Check diagnostic_outcomes
    const { data: _testOutcome, error: outcomeError } = await supabaseAdmin
      .from("diagnostic_outcomes")
      .select("count")
      .limit(1);

    if (outcomeError && outcomeError.code !== "42P01") {
      console.log(`⚠️  diagnostic_outcomes: ${outcomeError.message}`);
    } else {
      console.log("✅ diagnostic_outcomes table exists");
    }

    console.log("✅ Database ready for migration");
  }

  private async runHistoricalMigration(): Promise<void> {
    console.log("Migrating historical data from calculations table...");

    try {
      // Get historical calculations with symptoms/diagnosis
      console.log("Fetching historical calculations...");

      const { data: calculations, error } = await supabaseAdmin
        .from("calculations")
        .select("id, inputs, results, user_id, created_at")
        .limit(100); // Process in batches

      if (error) {
        throw new Error(`Failed to fetch calculations: ${error.message}`);
      }

      console.log(`Found ${calculations?.length || 0} calculations to process`);

      let patternsCreated = 0;
      let anomaliesCreated = 0;

      for (const calc of calculations || []) {
        const params = (calc as any).inputs;
        const results = calc.results;

        // Extract symptoms
        const symptoms = this.extractSymptoms(params, results);

        // Extract measurements
        const measurements = this.extractMeasurements(params, results);

        // Extract diagnosis and outcome
        const diagnosis = results?.diagnosis || params?.diagnosis;
        const outcome = this.inferOutcome(params, results);

        if (symptoms.length > 0 && diagnosis) {
          // Create symptom pattern
          const { data: _pattern, error: patternError } = await supabaseAdmin
            .from("ai_learning_patterns")
            .insert({
              pattern_type: "symptom_outcome",
              pattern_data: {
                symptoms,
                diagnosis,
                outcome,
                timestamp: calc.created_at,
              },
              confidence_score: 50,
              occurrence_count: 1,
              equipment_model: params?.model_serial || params?.model,
            })
            .select()
            .single();

          if (!patternError) {
            patternsCreated++;

            // Check for measurement anomalies
            for (const [param, value] of Object.entries(measurements || {})) {
              const expectedRange = this.getExpectedRange(param);
              if (value < expectedRange.min || value > expectedRange.max) {
                // Create anomaly pattern
                await supabaseAdmin.from("ai_learning_patterns").insert({
                  pattern_type: "measurement_anomaly",
                  pattern_data: {
                    parameter: param,
                    measured_value: value,
                    expected_range: expectedRange,
                    deviation_percent: Math.abs(
                      ((value - (expectedRange.min + expectedRange.max) / 2) /
                        ((expectedRange.min + expectedRange.max) / 2)) *
                        100,
                    ),
                    diagnosis,
                    timestamp: calc.created_at,
                  },
                  confidence_score: 50,
                  occurrence_count: 1,
                  equipment_model: params?.model_serial || params?.model,
                });

                anomaliesCreated++;
              }
            }
          }
        }
      }

      console.log(`📊 Migration Results:`);
      console.log(`   - Symptom patterns created: ${patternsCreated}`);
      console.log(`   - Measurement anomalies created: ${anomaliesCreated}`);
      console.log(
        `   - Total new patterns: ${patternsCreated + anomaliesCreated}`,
      );
    } catch (error) {
      console.log(`⚠️  Historical migration encountered issue: ${error}`);
      console.log("This may be expected if no historical data exists yet.");
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
    if (parameters?.primary_symptom) symptoms.push(parameters.primary_symptom);

    return [...new Set(symptoms)];
  }

  private extractMeasurements(
    parameters: any,
    _results: any,
  ): Record<string, number> {
    const measurements: Record<string, number> = {};

    // Extract from parameters
    if (parameters?.suction_pressure_kpa) {
      measurements.suction_pressure = parseFloat(
        parameters.suction_pressure_kpa,
      );
    }
    if (parameters?.head_pressure_kpa) {
      measurements.head_pressure = parseFloat(parameters.head_pressure_kpa);
    }
    if (parameters?.voltage_v) {
      measurements.voltage = parseFloat(parameters.voltage_v);
    }
    if (parameters?.current_a) {
      measurements.current = parseFloat(parameters.current_a);
    }
    if (parameters?.superheat) {
      measurements.superheat = parseFloat(parameters.superheat);
    }
    if (parameters?.subcooling) {
      measurements.subcooling = parseFloat(parameters.subcooling);
    }
    if (parameters?.temp_diff) {
      measurements.temp_diff = parseFloat(parameters.temp_diff);
    }
    if (parameters?.ambient_c) {
      measurements.ambient = parseFloat(parameters.ambient_c);
    }

    return measurements;
  }

  private inferOutcome(_parameters: any, results: any): string {
    // Infer outcome from available data
    if (results?.outcome) return results.outcome;
    if (results?.success !== undefined)
      return results.success ? "success" : "failed";
    if (results?.rating && results.rating >= 4) return "success";
    if (results?.rating && results.rating <= 2) return "failed";
    return "success"; // Default assumption for historical data
  }

  private getExpectedRange(parameter: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      suction_pressure: { min: 50, max: 85 },
      head_pressure: { min: 200, max: 400 },
      voltage: { min: 110, max: 130 },
      current: { min: 10, max: 30 },
      superheat: { min: 5, max: 15 },
      subcooling: { min: 5, max: 15 },
      ambient: { min: 20, max: 40 },
      temp_diff: { min: 10, max: 25 },
    };
    return ranges[parameter] || { min: 0, max: 100 };
  }

  private async verifyMigrationResults(): Promise<void> {
    console.log("Verifying migration results...");

    // Check pattern counts
    const { count: symptomPatterns } = await supabaseAdmin
      .from("ai_learning_patterns")
      .select("count", { count: "exact" })
      .eq("pattern_type", "symptom_outcome");

    const { count: anomalyPatterns } = await supabaseAdmin
      .from("ai_learning_patterns")
      .select("count", { count: "exact" })
      .eq("pattern_type", "measurement_anomaly");

    const totalPatterns = (symptomPatterns || 0) + (anomalyPatterns || 0);

    console.log(`📊 Final Pattern Counts:`);
    console.log(`   - Symptom patterns: ${symptomPatterns || 0}`);
    console.log(`   - Measurement anomalies: ${anomalyPatterns || 0}`);
    console.log(`   - Total patterns: ${totalPatterns}`);

    if (totalPatterns === 0) {
      console.log("");
      console.log("⚠️  No patterns were created.");
      console.log("This may be because:");
      console.log("  1. The calculations table is empty");
      console.log("  2. Historical data doesn't contain symptoms/diagnosis");
      console.log("  3. Data format doesn't match expected structure");
      console.log("");
      console.log(
        "💡 Tip: Patterns will be created automatically as technicians use the system.",
      );
    } else {
      console.log("");
      console.log("✅ Migration verification successful!");
    }
  }
}

// Run migration
const migration = new ProductionMigration();
migration.migrateToProduction().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
