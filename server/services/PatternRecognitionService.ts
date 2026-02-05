import { supabaseAdmin } from "../utils/supabase.js";

export interface SymptomPattern {
  symptoms: string[];
  outcomes: Array<{
    diagnosis: string;
    success_rate: number;
    confidence: number;
    recommended_actions: string[];
  }>;
  equipment_types?: string[];
  seasonal_correlation?: number;
}

export interface EquipmentFailurePattern {
  equipment_model: string;
  failure_modes: Array<{
    symptom: string;
    frequency: number;
    mean_time_to_failure: number;
    recommended_replacement: string;
    repair_cost_estimate: {
      parts: number;
      labor: number;
      total: number;
    };
  }>;
  common_causes: string[];
  preventive_measures: string[];
}

export interface MeasurementPattern {
  parameter: string;
  anomaly_type: "high" | "low" | "unstable" | "correlated";
  threshold_violations: Array<{
    condition: string;
    severity: "minor" | "major" | "critical";
    likely_causes: string[];
    confidence: number;
  }>;
  correlated_parameters?: string[];
  diagnostic_clues: string[];
}

export interface SeasonalPattern {
  season: "spring" | "summer" | "fall" | "winter";
  symptom_increase: Array<{
    symptom: string;
    increase_percentage: number;
    contributing_factors: string[];
  }>;
  preventive_maintenance: Array<{
    task: string;
    timing: string;
    priority: "low" | "medium" | "high";
  }>;
}

export interface PatternAnalysis {
  symptom_correlations: SymptomPattern[];
  equipment_failures: EquipmentFailurePattern[];
  measurement_anomalies: MeasurementPattern[];
  seasonal_patterns: SeasonalPattern[];
}

export interface DiagnosticContext {
  symptoms: string[];
  measurements: Record<string, number>;
  equipment_model?: string;
  ambient_conditions?: {
    temperature: number;
    humidity?: number;
  };
  season?: string;
}

export interface PatternMatch {
  pattern_id: string;
  pattern_type: string;
  pattern_data: any;
  confidence_score: number;
  relevance_score: number;
  occurrence_count: number;
  match_details: {
    matched_symptoms: string[];
    matching_measurements: string[];
    equipment_match: boolean;
    seasonal_relevance: number;
  };
}

export interface FeedbackData {
  pattern_id: string;
  helpful: boolean;
  correct_diagnosis: boolean;
  actual_outcome?: string;
  additional_notes?: string;
  technician_rating?: number;
}

export class PatternRecognitionService {
  private supabase = supabaseAdmin;

  async analyzeHistoricalData(companyId: string): Promise<PatternAnalysis> {
    try {
      const { data: patterns, error } = await this.supabase!.from(
        "ai_learning_patterns",
      )
        .select("*")
        .eq("company_id", companyId)
        .order("last_seen", { ascending: false })
        .limit(100);

      if (error) throw error;

      const analysis: PatternAnalysis = {
        symptom_correlations: this.extractSymptomPatterns(patterns || []),
        equipment_failures: this.extractEquipmentPatterns(patterns || []),
        measurement_anomalies: this.extractMeasurementPatterns(patterns || []),
        seasonal_patterns: this.extractSeasonalPatterns(patterns || []),
      };

      return analysis;
    } catch (error) {
      console.error("Error analyzing historical data:", error);
      throw error;
    }
  }

  async updatePattern(
    patternId: string,
    feedback: FeedbackData,
  ): Promise<void> {
    try {
      const confidenceAdjustment = feedback.helpful ? 10 : -15;
      const maxConfidence = feedback.helpful ? 95 : 80;

      const { error } = await this.supabase!.from("ai_learning_patterns")
        .update({
          confidence_score: this.supabase!.rpc("calculate_new_confidence", {
            current_confidence: this.supabase!.from("ai_learning_patterns")
              .select("confidence_score")
              .eq("id", patternId),
            adjustment: confidenceAdjustment,
            max_confidence: maxConfidence,
          }),
          last_seen: new Date().toISOString(),
        })
        .eq("id", patternId);

      if (error) throw error;

      // Store feedback for learning
      await this.supabase!.from("diagnostic_outcomes").insert({
        troubleshooting_session_id: patternId,
        ai_recommendations: { pattern_id: patternId },
        success_rating:
          feedback.technician_rating || (feedback.helpful ? 5 : 2),
        notes: feedback.additional_notes,
      });
    } catch (error) {
      console.error("Error updating pattern:", error);
      throw error;
    }
  }

  async getRelatedPatterns(
    symptoms: string[],
    measurements?: Record<string, number>,
    equipmentModel?: string,
    companyId?: string,
  ): Promise<PatternMatch[]> {
    try {
      const { data, error } = await this.supabase!.rpc("get_related_patterns", {
        p_company_id: companyId,
        p_symptoms: symptoms,
        p_equipment_model: equipmentModel,
      });

      if (error) throw error;

      return (data || []).map((pattern) => ({
        pattern_id: pattern.pattern_id,
        pattern_type: pattern.pattern_type,
        pattern_data: pattern.pattern_data,
        confidence_score: pattern.confidence_score,
        relevance_score: pattern.relevance_score,
        occurrence_count: pattern.occurrence_count,
        match_details: this.calculateMatchDetails(
          pattern,
          symptoms,
          measurements || {},
          equipmentModel,
        ),
      }));
    } catch (error) {
      console.error("Error getting related patterns:", error);
      return [];
    }
  }

  calculateConfidence(pattern: any, context: DiagnosticContext): number {
    let baseConfidence = pattern.confidence_score || 50;

    // Boost confidence for equipment model matches
    if (pattern.equipment_model === context.equipment_model) {
      baseConfidence += 15;
    }

    // Boost for symptom overlap
    if (pattern.pattern_data?.symptoms) {
      const patternSymptoms = pattern.pattern_data.symptoms as string[];
      const symptomOverlap = patternSymptoms.filter((s) =>
        context.symptoms.includes(s),
      ).length;
      const symptomBoost =
        (symptomOverlap /
          Math.max(patternSymptoms.length, context.symptoms.length)) *
        20;
      baseConfidence += symptomBoost;
    }

    // Boost for recent patterns
    const daysSinceLastSeen = pattern.last_seen
      ? Math.floor(
          (Date.now() - new Date(pattern.last_seen).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 365;
    if (daysSinceLastSeen < 30) {
      baseConfidence += 10;
    } else if (daysSinceLastSeen > 180) {
      baseConfidence -= 10;
    }

    return Math.min(100, Math.max(0, baseConfidence));
  }

  async createSymptomOutcomePattern(
    symptoms: string[],
    diagnosis: string,
    outcome: "success" | "partial" | "failed",
    equipmentModel?: string,
    companyId?: string,
  ): Promise<string> {
    try {
      // Validate input parameters
      if (!symptoms || symptoms.length === 0) {
        throw new Error("Symptoms array is required");
      }
      if (!diagnosis) {
        throw new Error("Diagnosis is required");
      }
      if (!outcome || !["success", "partial", "failed"].includes(outcome)) {
        console.log("Invalid outcome:", outcome, "Type:", typeof outcome);
        throw new Error("Outcome must be success, partial, or failed");
      }
      if (!companyId) {
        throw new Error("Company ID is required");
      }

      const patternData = {
        symptoms,
        diagnosis,
        outcome,
        timestamp: new Date().toISOString(),
        equipment_model: equipmentModel,
      };

      const { data, error } = await this.supabase!.rpc(
        "update_pattern_occurrence",
        {
          p_pattern_type: "symptom_outcome",
          p_pattern_data: patternData,
          p_company_id: companyId,
          p_equipment_model: equipmentModel,
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating symptom outcome pattern:", error);
      throw error;
    }
  }

  async createMeasurementAnomalyPattern(
    parameter: string,
    value: number,
    expectedRange: { min: number; max: number },
    diagnosis: string,
    companyId?: string,
  ): Promise<string | null> {
    try {
      // Only proceed if we have a company ID and value is truly anomalous
      if (
        !companyId ||
        (value >= expectedRange.min && value <= expectedRange.max)
      ) {
        return null;
      }

      // Validate input parameters
      if (!parameter) {
        throw new Error("Parameter is required");
      }
      if (!diagnosis) {
        throw new Error("Diagnosis is required");
      }
      if (!expectedRange || expectedRange.min >= expectedRange.max) {
        throw new Error("Valid expected range is required");
      }

      const patternData = {
        parameter,
        measured_value: value,
        expected_range: expectedRange,
        deviation_percent: Math.abs(
          ((value - (expectedRange.min + expectedRange.max) / 2) /
            ((expectedRange.min + expectedRange.max) / 2)) *
            100,
        ),
        diagnosis,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await this.supabase!.rpc(
        "update_pattern_occurrence",
        {
          p_pattern_type: "measurement_anomaly",
          p_pattern_data: patternData,
          p_company_id: companyId,
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating measurement anomaly pattern:", error);
      throw error;
    }
  }

  private extractSymptomPatterns(patterns: any[]): SymptomPattern[] {
    const symptomPatterns = patterns.filter(
      (p) => p.pattern_type === "symptom_outcome",
    );

    // Group similar symptoms and calculate success rates
    const groupedPatterns = new Map<string, any[]>();

    symptomPatterns.forEach((pattern) => {
      const symptomsKey = JSON.stringify(
        pattern.pattern_data.symptoms?.sort() || [],
      );
      if (!groupedPatterns.has(symptomsKey)) {
        groupedPatterns.set(symptomsKey, []);
      }
      groupedPatterns.get(symptomsKey)!.push(pattern);
    });

    return Array.from(groupedPatterns.entries()).map(
      ([symptomsKey, patternGroup]) => {
        const symptoms = JSON.parse(symptomsKey);
        const outcomes = patternGroup.map((p) => p.pattern_data);
        const successRate =
          outcomes.filter((o) => o.outcome === "success").length /
          outcomes.length;

        return {
          symptoms,
          outcomes: [
            {
              diagnosis: outcomes[0].diagnosis,
              success_rate: successRate,
              confidence:
                patternGroup.reduce((sum, p) => sum + p.confidence_score, 0) /
                patternGroup.length,
              recommended_actions: this.extractRecommendedActions(outcomes),
            },
          ],
          equipment_types: [
            ...new Set(outcomes.map((o) => o.equipment_model).filter(Boolean)),
          ],
          seasonal_correlation: this.calculateSeasonalCorrelation(patternGroup),
        };
      },
    );
  }

  private extractEquipmentPatterns(patterns: any[]): EquipmentFailurePattern[] {
    const equipmentPatterns = patterns.filter(
      (p) => p.pattern_type === "equipment_failure",
    );

    const groupedByModel = new Map<string, any[]>();

    equipmentPatterns.forEach((pattern) => {
      const model = pattern.equipment_model || "unknown";
      if (!groupedByModel.has(model)) {
        groupedByModel.set(model, []);
      }
      groupedByModel.get(model)!.push(pattern);
    });

    return Array.from(groupedByModel.entries()).map(
      ([model, patternGroup]) => ({
        equipment_model: model,
        failure_modes: this.extractFailureModes(patternGroup),
        common_causes: this.extractCommonCauses(patternGroup),
        preventive_measures: this.extractPreventiveMeasures(patternGroup),
      }),
    );
  }

  private extractMeasurementPatterns(patterns: any[]): MeasurementPattern[] {
    const measurementPatterns = patterns.filter(
      (p) => p.pattern_type === "measurement_anomaly",
    );

    // Group by parameter
    const groupedByParameter = new Map<string, any[]>();

    measurementPatterns.forEach((pattern) => {
      const parameter = pattern.pattern_data.parameter;
      if (!groupedByParameter.has(parameter)) {
        groupedByParameter.set(parameter, []);
      }
      groupedByParameter.get(parameter)!.push(pattern);
    });

    return Array.from(groupedByParameter.entries()).map(
      ([parameter, patternGroup]) => ({
        parameter,
        anomaly_type: this.determineAnomalyType(patternGroup),
        threshold_violations: this.extractThresholdViolations(patternGroup),
        correlated_parameters: this.findCorrelatedParameters(
          patternGroup,
          patterns,
        ),
        diagnostic_clues: this.extractDiagnosticClues(patternGroup),
      }),
    );
  }

  private extractSeasonalPatterns(patterns: any[]): SeasonalPattern[] {
    const seasons = ["spring", "summer", "fall", "winter"] as const;

    return seasons.map((season) => {
      const seasonPatterns = patterns.filter((p) => {
        const createdAt = new Date(p.created_at);
        const seasonMonth = this.getSeason(createdAt);
        return seasonMonth === season;
      });

      return {
        season,
        symptom_increase: this.calculateSymptomIncrease(seasonPatterns),
        preventive_maintenance: this.getSeasonalMaintenance(season),
      };
    });
  }

  private calculateMatchDetails(
    pattern: any,
    symptoms: string[],
    measurements: Record<string, number>,
    equipmentModel?: string,
  ) {
    const patternSymptoms = pattern.pattern_data?.symptoms || [];
    const matchedSymptoms = symptoms.filter((s) => patternSymptoms.includes(s));

    return {
      matched_symptoms: matchedSymptoms,
      matching_measurements: this.findMatchingMeasurements(
        pattern.pattern_data?.measurements || {},
        measurements,
      ),
      equipment_match: pattern.equipment_model === equipmentModel,
      seasonal_relevance: this.calculateSeasonalRelevance(
        pattern,
        symptoms,
        measurements,
      ),
    };
  }

  // Helper methods for pattern extraction
  private extractRecommendedActions(outcomes: any[]): string[] {
    // Extract common actions from successful outcomes
    const actions: Record<string, number> = {};

    for (const outcome of outcomes) {
      if (outcome.outcome === "success" && outcome.recommended_actions) {
        const outcomeActions = Array.isArray(outcome.recommended_actions)
          ? outcome.recommended_actions
          : [];

        for (const action of outcomeActions) {
          actions[action] = (actions[action] || 0) + 1;
        }
      }
    }

    // Sort by frequency and return top actions
    return Object.entries(actions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);
  }

  private calculateSeasonalCorrelation(patterns: any[]): number {
    // Calculate how seasonal this pattern is based on distribution across seasons
    const seasonalCounts = {
      spring: 0,
      summer: 0,
      fall: 0,
      winter: 0,
    };

    let totalPatterns = 0;

    for (const pattern of patterns) {
      const createdAt = new Date(pattern.created_at || pattern.last_seen);
      const season = this.getSeason(createdAt);
      seasonalCounts[season]++;
      totalPatterns++;
    }

    if (totalPatterns < 2) return 0.5; // Not enough data

    // Calculate variance from uniform distribution
    const expectedPerSeason = totalPatterns / 4;
    const variance =
      Object.values(seasonalCounts).reduce((sum, count) => {
        return sum + Math.pow(count - expectedPerSeason, 2);
      }, 0) / 4;

    // Normalize to 0-1 range (higher variance = more seasonal)
    const maxVariance = Math.pow(expectedPerSeason, 2) * 4;
    const seasonalIndex = Math.min(1.0, variance / maxVariance);

    return seasonalIndex;
  }

  private extractFailureModes(patterns: any[]) {
    // Analyze patterns to identify common failure modes
    const failureModes: Record<
      string,
      {
        symptom: string;
        frequency: number;
        occurrences: number;
        avgTimeBetweenFailures: number;
        repairCosts: number[];
      }
    > = {};

    for (const pattern of patterns) {
      const patternData = pattern.pattern_data;
      if (!patternData?.diagnosis) continue;

      const diagnosis = patternData.diagnosis;
      const symptom = patternData.symptoms
        ? patternData.symptoms[0]
        : "General failure";
      const lastSeen = new Date(pattern.last_seen);

      if (!failureModes[diagnosis]) {
        failureModes[diagnosis] = {
          symptom: diagnosis,
          frequency: 0,
          occurrences: 0,
          avgTimeBetweenFailures: 0,
          repairCosts: [],
        };
      }

      failureModes[diagnosis].occurrences++;
      failureModes[diagnosis].frequency =
        failureModes[diagnosis].occurrences / patterns.length;

      // Extract cost information if available
      if (patternData.estimated_cost) {
        failureModes[diagnosis].repairCosts.push(patternData.estimated_cost);
      }
    }

    // Convert to expected format with realistic estimates
    return Object.values(failureModes)
      .filter((mode) => mode.frequency > 0.05) // Only include significant failure modes
      .map((mode) => ({
        symptom: mode.symptom,
        frequency: mode.frequency,
        mean_time_to_failure: this.estimateMTBF(mode.symptom),
        recommended_replacement: this.getRecommendedReplacement(mode.symptom),
        repair_cost_estimate: this.estimateRepairCost(
          mode.symptom,
          mode.repairCosts,
        ),
      }))
      .slice(0, 5) // Return top 5 failure modes
      .sort((a, b) => b.frequency - a.frequency);
  }

  private extractCommonCauses(patterns: any[]): string[] {
    return ["Lack of maintenance", "Age of equipment", "Environmental factors"];
  }

  private extractPreventiveMeasures(patterns: any[]): string[] {
    return [
      "Regular filter changes",
      "Annual maintenance",
      "Monitor performance",
    ];
  }

  private determineAnomalyType(
    patterns: any[],
  ): "high" | "low" | "unstable" | "correlated" {
    if (patterns.length === 0) return "high";

    // Analyze the patterns to determine anomaly type
    const values = patterns
      .map((p) => p.pattern_data?.measured_value)
      .filter((v) => v !== undefined);
    const expectedRanges = patterns
      .map((p) => p.pattern_data?.expected_range)
      .filter((r) => r !== undefined);

    if (values.length === 0 || expectedRanges.length === 0) return "high";

    // Calculate statistics
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const midpoints = expectedRanges.map(
      (range) => (range.min + range.max) / 2,
    );
    const avgMidpoint =
      midpoints.reduce((sum, mid) => sum + mid, 0) / midpoints.length;

    // Determine if values are consistently high or low
    const highCount = values.filter((val) => {
      const expected = expectedRanges.find((r) => val > r.max);
      return expected !== undefined;
    }).length;

    const lowCount = values.filter((val) => {
      const expected = expectedRanges.find((r) => val < r.min);
      return expected !== undefined;
    }).length;

    // Check for instability (high variance)
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgValue; // Coefficient of variation

    // Determine anomaly type
    if (cv > 0.3) {
      return "unstable"; // High variability
    }

    if (highCount > lowCount * 2) {
      return "high";
    } else if (lowCount > highCount * 2) {
      return "low";
    } else {
      return "correlated"; // Mixed pattern, likely correlated with other parameters
    }
  }

  private extractThresholdViolations(patterns: any[]) {
    return [
      {
        condition: "Pressure too high",
        severity: "major" as const,
        likely_causes: ["Overcharged system", "Restriction"],
        confidence: 75,
      },
    ];
  }

  private findCorrelatedParameters(
    patterns: any[],
    allPatterns: any[],
  ): string[] {
    // Find parameters that frequently appear together with the target parameter
    if (patterns.length === 0) return [];

    const targetParameter = patterns[0].pattern_data?.parameter;
    if (!targetParameter) return [];

    // Analyze all patterns to find correlations
    const correlations: Record<
      string,
      {
        coOccurrence: number;
        targetOccurrences: number;
        correlation: number;
      }
    > = {};

    const targetOccurrences = patterns.length;

    // Group patterns by troubleshooting session if available
    const sessions = new Map<string, any[]>();
    allPatterns.forEach((pattern) => {
      const sessionId =
        pattern.troubleshooting_session_id || pattern.session_id || "unknown";
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId)!.push(pattern);
    });

    // Find co-occurring parameters
    for (const [sessionId, sessionPatterns] of sessions) {
      const sessionParams = sessionPatterns
        .map((p) => p.pattern_data?.parameter)
        .filter((p) => p);
      const hasTargetParameter = sessionParams.includes(targetParameter);

      if (hasTargetParameter) {
        // Find other parameters in the same session
        sessionParams.forEach((param) => {
          if (param !== targetParameter) {
            if (!correlations[param]) {
              correlations[param] = {
                coOccurrence: 0,
                targetOccurrences: 0,
                correlation: 0,
              };
            }
            correlations[param].coOccurrence++;
          }
        });
      }
    }

    // Calculate correlation strength
    for (const [param, data] of Object.entries(correlations)) {
      data.correlation = data.coOccurrence / targetOccurrences;
    }

    // Return parameters with correlation >= 0.3
    return Object.entries(correlations)
      .filter(([, data]) => data.correlation >= 0.3)
      .sort(([, a], [, b]) => b.correlation - a.correlation)
      .slice(0, 5)
      .map(([param]) => param);
  }

  private extractDiagnosticClues(patterns: any[]): string[] {
    return ["Check for ice formation", "Listen for unusual noises"];
  }

  private calculateSymptomIncrease(patterns: any[]) {
    return [
      {
        symptom: "High head pressure",
        increase_percentage: 25,
        contributing_factors: ["High ambient temperature", "Dirty condenser"],
      },
    ];
  }

  private getSeasonalMaintenance(season: string) {
    return [
      {
        task: "Clean condenser coils",
        timing: season === "spring" ? "Before cooling season" : "As needed",
        priority: "high" as const,
      },
    ];
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  private findMatchingMeasurements(
    patternMeasurements: any,
    currentMeasurements: Record<string, number>,
  ): string[] {
    const matching = [];
    const patternKeys = Object.keys(patternMeasurements || {});

    for (const key of patternKeys) {
      if (currentMeasurements[key] !== undefined) {
        const patternValue = patternMeasurements[key];
        const currentValue = currentMeasurements[key];

        // Check if measurements are within 10% tolerance
        const tolerance = 0.1;
        const difference = Math.abs(patternValue - currentValue);
        const expectedValue = patternValue || currentValue;
        const isWithinTolerance = difference <= expectedValue * tolerance;

        if (isWithinTolerance) {
          matching.push(key);
        }
      }
    }

    return matching;
  }

  private calculateSeasonalRelevance(
    pattern: any,
    symptoms: string[],
    measurements: Record<string, number>,
  ): number {
    // Get the current season
    const currentMonth = new Date().getMonth();
    const currentSeason = this.getSeason(new Date());

    // If pattern has seasonal data, calculate relevance
    if (pattern.pattern_data?.seasonal_patterns) {
      const seasonalData =
        pattern.pattern_data.seasonal_patterns[currentSeason];
      if (seasonalData) {
        // Boost relevance based on seasonal correlation
        return Math.min(1.0, 0.6 + (seasonalData.correlation || 0.4));
      }
    }

    // Check if symptoms have seasonal characteristics
    const seasonalSymptoms = [
      "no_cooling", // more common in summer
      "no_heating", // more common in winter
      "freeze_up", // more common in winter
      "overheating", // more common in summer
      "high_head_pressure", // more common in summer
      "low_suction_pressure", // can be seasonal
    ];

    const hasSeasonalSymptoms = symptoms.some((s) =>
      seasonalSymptoms.includes(s),
    );

    if (hasSeasonalSymptoms) {
      // Check if current season matches symptom patterns
      if (
        (currentSeason === "summer" && symptoms.includes("no_cooling")) ||
        (currentSeason === "winter" && symptoms.includes("no_heating"))
      ) {
        return 0.8; // High seasonal relevance
      }
      return 0.6; // Moderate seasonal relevance
    }

    return 0.5; // Default seasonal relevance
  }

  private estimateMTBF(failureType: string): number {
    // Estimate Mean Time Between Failures in days based on failure type
    const mtbfEstimates: Record<string, number> = {
      "Compressor failure": 3650, // ~10 years
      "Capacitor failure": 1095, // ~3 years
      "Refrigerant leak": 730, // ~2 years
      "Fan motor failure": 1825, // ~5 years
      "Thermostat failure": 1460, // ~4 years
      "Condenser coil leak": 2190, // ~6 years
      "Expansion valve failure": 1095, // ~3 years
      "Electrical failure": 1825, // ~5 years
      "Sensor failure": 730, // ~2 years
      "General failure": 1825, // ~5 years default
    };

    for (const [key, mtbf] of Object.entries(mtbfEstimates)) {
      if (failureType.toLowerCase().includes(key.toLowerCase())) {
        return mtbf;
      }
    }

    return 1825; // Default 5 years
  }

  private getRecommendedReplacement(failureType: string): string {
    const replacements: Record<string, string> = {
      "Compressor failure": "Compressor replacement",
      "Capacitor failure": "Capacitor replacement",
      "Refrigerant leak": "Refrigerant recharge and leak repair",
      "Fan motor failure": "Fan motor replacement",
      "Thermostat failure": "Thermostat replacement",
      "Condenser coil leak": "Coil replacement or repair",
      "Expansion valve failure": "Expansion valve replacement",
      "Electrical failure": "Electrical component repair/replacement",
      "Sensor failure": "Sensor replacement",
      "General failure": "System inspection and repair",
    };

    for (const [key, replacement] of Object.entries(replacements)) {
      if (failureType.toLowerCase().includes(key.toLowerCase())) {
        return replacement;
      }
    }

    return "System inspection and repair";
  }

  private estimateRepairCost(
    failureType: string,
    costs: number[],
  ): {
    parts: number;
    labor: number;
    total: number;
  } {
    // Base costs for common failure types
    const baseCosts: Record<string, { parts: number; labor: number }> = {
      "Compressor failure": { parts: 2000, labor: 800 },
      "Capacitor failure": { parts: 50, labor: 150 },
      "Refrigerant leak": { parts: 200, labor: 300 },
      "Fan motor failure": { parts: 400, labor: 200 },
      "Thermostat failure": { parts: 150, labor: 100 },
      "Condenser coil leak": { parts: 1200, labor: 500 },
      "Expansion valve failure": { parts: 300, labor: 250 },
      "Electrical failure": { parts: 200, labor: 300 },
      "Sensor failure": { parts: 100, labor: 150 },
      "General failure": { parts: 500, labor: 400 },
    };

    let cost = baseCosts["General failure"]; // Default

    for (const [key, baseCost] of Object.entries(baseCosts)) {
      if (failureType.toLowerCase().includes(key.toLowerCase())) {
        cost = baseCost;
        break;
      }
    }

    // Adjust based on actual historical costs if available
    if (costs.length > 0) {
      const avgHistoricalCost =
        costs.reduce((sum, c) => sum + c, 0) / costs.length;
      const adjustment = avgHistoricalCost / (cost.parts + cost.labor);
      cost.parts = Math.round(cost.parts * adjustment);
      cost.labor = Math.round(cost.labor * adjustment);
    }

    return {
      parts: cost.parts,
      labor: cost.labor,
      total: cost.parts + cost.labor,
    };
  }
}
