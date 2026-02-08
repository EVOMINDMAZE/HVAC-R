#!/usr/bin/env node

/**
 * Historical Data Migration - Schema Discovery
 * Discovers the actual calculations table structure
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function discoverSchema() {
  console.log("🔍 Discovering calculations table schema...\n");

  // Get table info
  console.log("1. Checking calculations table structure...");
  const { data: calcs, error } = await supabase
    .from("calculations")
    .select("*")
    .limit(3);

  if (error) {
    console.log(`❌ Error accessing calculations: ${error.message}`);
    return;
  }

  if (!calcs || calcs.length === 0) {
    console.log("⚠️  Calculations table is empty");
    return;
  }

  // Show sample record
  console.log("\n2. Sample calculation record:");
  const sample = calcs[0];
  console.log(JSON.stringify(sample, null, 2));

  // Identify key columns
  console.log("\n3. Column analysis:");
  console.log("Available columns:");
  Object.keys(sample).forEach((key) => {
    const value = sample[key];
    const type = typeof value;
    console.log(
      `  - ${key}: ${type}${type === "object" ? " (" + (Array.isArray(value) ? "array" : "object") + ")" : ""}`,
    );
  });

  // Check for symptom/diagnosis data
  console.log("\n4. Looking for symptom/diagnosis data...");

  // Check for nested data in JSONB columns
  if (sample.parameters) {
    console.log("\nParameters structure:");
    console.log(JSON.stringify(sample.parameters, null, 2));
  }

  if (sample.results) {
    console.log("\nResults structure:");
    console.log(JSON.stringify(sample.results, null, 2));
  }

  console.log("\n✅ Schema discovery complete!");
  console.log("\n💡 To migrate historical data, we need to understand:");
  console.log("   - Which columns contain symptoms?");
  console.log("   - Which columns contain diagnosis?");
  console.log("   - Which columns contain measurements?");
}

discoverSchema().catch(console.error);
