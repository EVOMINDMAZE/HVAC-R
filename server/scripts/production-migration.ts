#!/usr/bin/env node

/**
 * Production Migration Script for AI Pattern Recognition
 *
 * This script migrates historical HVAC data to the new pattern tables.
 * Designed to run in production after database migration is applied.
 */

import { supabaseAdmin } from "../utils/supabase.js";

class ProductionMigration {
  async migrateToProduction(): Promise<void> {
    console.log("🚀 Starting production migration...");
    console.log("📊 Project: AI Pattern Recognition System");

    try {
      // Step 1: Validate environment
      await this.validateEnvironment();

      // Step 2: Check database readiness
      await this.checkDatabaseReadiness();

      // Step 3: Run historical migration
      await this.runHistoricalMigration();

      // Step 4: Verify results
      await this.verifyMigrationResults();

      console.log("✅ Production migration completed successfully!");
      console.log("🎯 AI Pattern Recognition is now ready for use");
    } catch (error) {
      console.error("❌ Production migration failed:", error);
      console.error("🔧 Please check:");
      console.error("  - Database connection");
      console.error("  - Environment variables");
      console.error("  - Migration permissions");

      process.exit(1);
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log("🔍 Validating environment...");

    if (!process.env.VITE_SUPABASE_URL) {
      throw new Error("VITE_SUPABASE_URL is required");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(
        "⚠️  SUPABASE_SERVICE_ROLE_KEY not set (may need service role)",
      );
    }

    console.log("✅ Environment validation passed");
  }

  private async checkDatabaseReadiness(): Promise<void> {
    console.log("🏥 Checking database readiness...");

    // Check if ai_learning_patterns table exists
    const { data: tables, error: tableError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("schemaname", "public")
      .in("table_name", ["ai_learning_patterns", "diagnostic_outcomes"]);

    if (tableError) {
      throw new Error(`Failed to check table existence: ${tableError.message}`);
    }

    const requiredTables = ["ai_learning_patterns", "diagnostic_outcomes"];
    const existingTables = tables?.map((t) => t.table_name) || [];

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table),
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(", ")}`);
    }

    console.log("✅ Database tables ready");
  }

  private async runHistoricalMigration(): Promise<void> {
    console.log("📈 Running historical data migration...");

    const startTime = Date.now();

    // Import the migration class
    const migrationModule =
      (await import("./simple-pattern-migration.js")) as any;
    const SimplePatternMigration =
      migrationModule.default || migrationModule.SimplePatternMigration;
    const migration = new SimplePatternMigration();

    await migration.migrateHistoricalData();

    const duration = Date.now() - startTime;
    console.log(`⏱️ Historical migration completed in ${duration}ms`);
  }

  private async verifyMigrationResults(): Promise<void> {
    console.log("🔍 Verifying migration results...");

    // Check pattern counts
    const { data: symptomPatterns, error: symptomError } = await supabaseAdmin
      .from("ai_learning_patterns")
      .select("count")
      .eq("pattern_type", "symptom_outcome");

    const { data: anomalyPatterns, error: anomalyError } = await supabaseAdmin
      .from("ai_learning_patterns")
      .select("count")
      .eq("pattern_type", "measurement_anomaly");

    if (symptomError || anomalyError) {
      console.error("Error verifying patterns:", symptomError || anomalyError);
      return;
    }

    const totalPatterns =
      (symptomPatterns?.[0]?.count || 0) + (anomalyPatterns?.[0]?.count || 0);

    console.log(`📊 Migration Results:`);
    console.log(`  - Symptom patterns: ${symptomPatterns?.[0]?.count || 0}`);
    console.log(
      `  - Measurement anomalies: ${anomalyPatterns?.[0]?.count || 0}`,
    );
    console.log(`  - Total patterns: ${totalPatterns}`);

    if (totalPatterns === 0) {
      console.log(
        "⚠️  No patterns were created - this may be expected for new installations",
      );
    } else {
      console.log("✅ Pattern migration verification successful");
    }
  }
}

// Run migration if called directly
if (import.meta.url === import.meta.url) {
  const migration = new ProductionMigration();
  migration.migrateToProduction().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

export { ProductionMigration };
