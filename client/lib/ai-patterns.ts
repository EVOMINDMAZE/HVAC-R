import { supabase } from "./supabase.js";

export interface PatternAnalysisRequest {
  companyId: string;
}

export interface RelatedPatternsRequest {
  symptoms: string[];
  equipmentModel?: string;
  companyId: string;
}

export interface SymptomOutcomePatternRequest {
  symptoms: string[];
  diagnosis: string;
  outcome: "success" | "partial" | "failed";
  equipmentModel?: string;
  companyId: string;
}

export interface MeasurementAnomalyPatternRequest {
  parameter: string;
  value: number;
  expectedRange: {
    min: number;
    max: number;
  };
  diagnosis: string;
  companyId: string;
}

export interface PatternFeedbackRequest {
  helpful: boolean;
  correct_diagnosis: boolean;
  actual_outcome?: string;
  additional_notes?: string;
  technician_rating?: number;
}

export interface EnhancedTroubleshootRequest {
  symptoms: string[];
  measurements?: Record<string, number>;
  equipmentModel?: string;
  companyId: string;
  ambientConditions?: {
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

export interface PatternRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  confidence: number;
  success_rate?: string;
  parameter?: string;
  deviation?: string;
  equipment_model?: string;
  recommended_actions: string[];
  pattern_id?: string;
}

export interface EnhancedTroubleshootResponse {
  patterns: PatternMatch[];
  recommendations: PatternRecommendation[];
  confidence_summary: {
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
  };
}

class AIPatternsAPI {
  private async getAuthHeaders() {
    const {
      data: { session },
    } = (await supabase?.auth.getSession()) || { data: { session: null } };
    return {
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    };
  }

  async analyzePatterns(request: PatternAnalysisRequest) {
    try {
      // Query ai_learning_patterns directly (legacy /api/ai/patterns routes were retired).
      const { data, error } = await supabase
        .from("ai_learning_patterns")
        .select("*")
        .eq("company_id", request.companyId)
        .order("confidence_score", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Error analyzing patterns:", error);
        return { success: false, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      return { success: false, data: [] };
    }
  }

  async getRelatedPatterns(
    request: RelatedPatternsRequest,
  ): Promise<PatternMatch[]> {
    const { data, error } = await supabase
      .from("ai_learning_patterns")
      .select("*")
      .eq("company_id", request.companyId)
      .order("confidence_score", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error getting related patterns:", error);
      throw new Error(`Failed to load patterns: ${error.message}`);
    }

    return buildPatternMatches(data || [], {
      symptoms: request.symptoms,
      equipmentModel: request.equipmentModel,
    });
  }

  async createSymptomOutcomePattern(request: SymptomOutcomePatternRequest) {
    // Initial heuristic confidence (0-100 scale, matching the UI thresholds):
    // recorded outcomes start mid-range and are refined by recurrence and
    // technician feedback over time.
    const initialConfidence =
      request.outcome === "success" ? 70 : request.outcome === "partial" ? 45 : 20;

    const { data, error } = await supabase
      .from("ai_learning_patterns")
      .insert({
        company_id: request.companyId,
        pattern_type: "symptom_outcome",
        equipment_model: request.equipmentModel ?? null,
        pattern_data: {
          symptoms: request.symptoms,
          diagnosis: request.diagnosis,
          outcome: request.outcome,
        },
        confidence_score: initialConfidence,
        occurrence_count: 1,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating symptom outcome pattern:", error);
      throw new Error(`Failed to save pattern: ${error.message}`);
    }

    return { success: true, data };
  }

  async createMeasurementAnomalyPattern(
    request: MeasurementAnomalyPatternRequest,
  ) {
    const { data, error } = await supabase
      .from("ai_learning_patterns")
      .insert({
        company_id: request.companyId,
        pattern_type: "measurement_anomaly",
        pattern_data: {
          parameter: request.parameter,
          value: request.value,
          expected_range: request.expectedRange,
          diagnosis: request.diagnosis,
        },
        confidence_score: 50,
        occurrence_count: 1,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating measurement anomaly pattern:", error);
      throw new Error(`Failed to save pattern: ${error.message}`);
    }

    return { success: true, data };
  }

  async updatePatternFeedback(
    patternId: string,
    feedback: PatternFeedbackRequest,
  ) {
    // Feedback lives inside pattern_data.feedback[] (the table has no feedback
    // columns). Row-level security restricts updates to company members.
    const { data: existing, error: fetchError } = await supabase
      .from("ai_learning_patterns")
      .select("pattern_data")
      .eq("id", patternId)
      .single();

    if (fetchError) {
      console.error("Error loading pattern for feedback:", fetchError);
      throw new Error(`Pattern not found: ${fetchError.message}`);
    }

    const patternData =
      existing && typeof existing.pattern_data === "object" && existing.pattern_data !== null
        ? (existing.pattern_data as Record<string, unknown>)
        : {};
    const feedbackList = Array.isArray(patternData.feedback)
      ? (patternData.feedback as unknown[])
      : [];

    const { error } = await supabase
      .from("ai_learning_patterns")
      .update({
        pattern_data: {
          ...patternData,
          feedback: [
            ...feedbackList,
            { ...feedback, submitted_at: new Date().toISOString() },
          ],
        },
      })
      .eq("id", patternId);

    if (error) {
      console.error("Error updating pattern feedback:", error);
      throw new Error(`Failed to save feedback: ${error.message}`);
    }

    return { success: true };
  }

  async getPatternsByType(
    companyId: string,
    patternType: string,
    limit = 50,
  ) {
    try {
      const { data, error } = await supabase
        .from("ai_learning_patterns")
        .select("*")
        .eq("company_id", companyId)
        .eq("pattern_type", patternType)
        .order("confidence_score", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error getting patterns by type:", error);
        return { success: false, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error getting patterns by type:", error);
      return { success: false, data: [] };
    }
  }

  async enhancedTroubleshoot(
    request: EnhancedTroubleshootRequest,
  ): Promise<EnhancedTroubleshootResponse> {
    // 1) Real pattern matches from ai_learning_patterns (RLS-scoped).
    const patterns = await this.getRelatedPatterns({
      symptoms: request.symptoms,
      equipmentModel: request.equipmentModel,
      companyId: request.companyId,
    });

    // 2) Real AI diagnosis via the deployed ai-troubleshoot edge function.
    let ai = {
      summary: null as string | null,
      probable_causes: [] as unknown[],
      steps: [] as unknown[],
      urgency: null as string | null,
      explanation: null as string | null,
      follow_up_questions: [] as unknown[],
    };
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as
        | string
        | undefined;

      if (token && supabaseUrl) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
          | string
          | undefined;
        if (anonKey) {
          headers.apikey = anonKey;
        }

        const response = await fetch(
          `${supabaseUrl.replace(/\/?$/, "")}/functions/v1/ai-troubleshoot`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              symptom: request.symptoms.join("; "),
              model: request.equipmentModel ?? null,
              measurements: request.measurements ?? null,
              ambient: request.ambientConditions
                ? {
                    temperature: request.ambientConditions.temperature,
                    humidity: request.ambientConditions.humidity ?? null,
                    season: request.season ?? null,
                  }
                : null,
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();
          if (result && result.success && result.data) {
            ai = {
              summary: result.data.summary ?? null,
              probable_causes: result.data.probable_causes ?? [],
              steps: result.data.steps ?? [],
              urgency: result.data.urgency ?? null,
              explanation: result.data.explanation ?? null,
              follow_up_questions: result.data.follow_up_questions ?? [],
            };
          }
        } else {
          console.warn(
            "ai-troubleshoot request failed:",
            response.status,
            await response.text().catch(() => ""),
          );
        }
      }
    } catch (error) {
      console.warn("AI diagnosis unavailable:", error);
    }

    // 3) Merge AI diagnosis + stored patterns into the response contract the
    // UI expects. AI is an enhancement, not a dependency: pattern-only data
    // still renders if the edge function is unreachable.
    const recommendations: PatternRecommendation[] = ai.probable_causes
      .slice(0, 5)
      .map((cause: any, index: number) => {
        const confidenceRaw =
          typeof cause?.confidence === "number"
            ? cause.confidence
            : typeof cause?.confidence === "string"
              ? parseFloat(cause.confidence)
              : NaN;
        const confidence =
          Number.isFinite(confidenceRaw) && confidenceRaw <= 1
            ? Math.round(confidenceRaw * 100)
            : Number.isFinite(confidenceRaw)
              ? Math.round(confidenceRaw)
              : 60;
        const actions = Array.isArray(cause?.diagnostic_steps)
          ? cause.diagnostic_steps
          : Array.isArray(cause?.corrective_steps)
            ? cause.corrective_steps
            : Array.isArray(cause?.steps)
              ? cause.steps
              : [];
        const stepsForCause = actions.length
          ? actions
          : ai.steps.slice(index, index + 1);
        return {
          priority:
            confidence >= 70
              ? ("high" as const)
              : confidence >= 40
                ? ("medium" as const)
                : ("low" as const),
          title:
            cause?.cause ??
            cause?.title ??
            cause?.name ??
            `Probable cause ${index + 1}`,
          description:
            cause?.reasoning ??
            cause?.description ??
            (typeof cause === "string" ? cause : "") ??
            "",
          confidence,
          recommended_actions: stepsForCause.map((s: unknown) =>
            typeof s === "string"
              ? s
              : String((s as any)?.description ?? (s as any)?.step ?? ""),
          ),
        };
      });

    return {
      patterns,
      recommendations,
      confidence_summary: {
        high_confidence: patterns.filter((p) => p.confidence_score >= 85).length,
        medium_confidence: patterns.filter(
          (p) => p.confidence_score >= 70 && p.confidence_score < 85,
        ).length,
        low_confidence: patterns.filter((p) => p.confidence_score < 70).length,
      },
    };
  }

  // Utility method to automatically capture diagnostic outcomes
  async captureDiagnosticOutcome(
    troubleshootingSessionId: string,
    symptoms: string[],
    diagnosis: string,
    outcome: "success" | "partial" | "failed",
    equipmentModel?: string,
    companyId?: string,
  ) {
    try {
      // Only proceed if we have a company ID
      if (!companyId) {
        console.warn("No company ID provided - skipping pattern capture");
        return null;
      }

      return await this.createSymptomOutcomePattern({
        symptoms,
        diagnosis,
        outcome,
        equipmentModel,
        companyId,
      });
    } catch (error) {
      console.error("Error capturing diagnostic outcome:", error);
      // Don't throw - this is a background operation
      return null;
    }
  }

  // Utility method to capture measurement anomalies automatically
  async captureMeasurementAnomaly(
    parameter: string,
    value: number,
    expectedRange: { min: number; max: number },
    diagnosis: string,
    companyId?: string,
  ) {
    try {
      // Only proceed if we have a company ID and value is truly anomalous
      if (
        !companyId ||
        (value >= expectedRange.min && value <= expectedRange.max)
      ) {
        return null;
      }

      return await this.createMeasurementAnomalyPattern({
        parameter,
        value,
        expectedRange,
        diagnosis,
        companyId,
      });
    } catch (error) {
      console.error("Error capturing measurement anomaly:", error);
      // Don't throw - this is a background operation
      return null;
    }
  }
}

export const aiPatternsAPI = new AIPatternsAPI();

/**
 * Row -> PatternMatch conversion with deterministic relevance scoring:
 * symptom overlap (0-60), equipment model match (0-30), recency (0-10).
 * Shared by getRelatedPatterns and enhancedTroubleshoot.
 */
function buildPatternMatches(
  rows: any[],
  request: { symptoms?: string[]; equipmentModel?: string },
): PatternMatch[] {
  if (!Array.isArray(rows)) return [];
  const normalize = (s: unknown) => String(s ?? "").toLowerCase().trim();
  const tokenize = (s: unknown) =>
    normalize(s)
      .split(/[\s,;]+/)
      .filter(Boolean);
  const requested = (request.symptoms ?? []).map(normalize).filter(Boolean);
  const requestedTokens = new Set(requested.flatMap(tokenize));

  const scored = rows.map((row) => {
    const pd = (row.pattern_data ?? {}) as Record<string, unknown>;
    const stored = Array.isArray(pd.symptoms)
      ? (pd.symptoms as unknown[]).map(normalize).filter(Boolean)
      : [];
    const storedTokens = new Set(stored.flatMap(tokenize));

    // Symptom overlap: token-level intersection between requested and stored.
    let matchedCount = 0;
    for (const s of requested) {
      if (
        stored.some((st) => st.includes(s) || s.includes(st)) ||
        tokenize(s).some((t) => storedTokens.has(t))
      ) {
        matchedCount += 1;
      }
    }
    const overlap = requested.length > 0 ? matchedCount / requested.length : 0;
    const symptomScore = Math.round(overlap * 60);

    // Equipment model match (0-30): token overlap on the model string.
    let equipmentMatch = false;
    let modelScore = 0;
    if (request.equipmentModel && row.equipment_model) {
      const a = tokenize(request.equipmentModel);
      const b = tokenize(row.equipment_model);
      const shared = a.filter((t) => b.includes(t));
      equipmentMatch = shared.length > 0;
      modelScore = a.length > 0 ? Math.round((shared.length / a.length) * 30) : 0;
    }

    // Recency (0-10): full score within 90 days, linear decay to zero at 1y.
    let recencyScore = 0;
    if (row.last_seen) {
      const ageDays =
        (Date.now() - new Date(row.last_seen).getTime()) / 86_400_000;
      if (Number.isFinite(ageDays) && ageDays >= 0) {
        recencyScore = ageDays <= 90 ? 10 : Math.max(0, Math.round(10 * (1 - (ageDays - 90) / 275)));
      }
    }

    const match: PatternMatch = {
      pattern_id: String(row.id ?? ""),
      pattern_type: String(row.pattern_type ?? "unknown"),
      pattern_data: pd,
      confidence_score: Number(row.confidence_score ?? 0),
      relevance_score: Math.min(100, symptomScore + modelScore + recencyScore),
      occurrence_count: Number(row.occurrence_count ?? 0),
      match_details: {
        matched_symptoms: requested.filter(
          (s) =>
            stored.some((st) => st.includes(s) || s.includes(st)) ||
            tokenize(s).some((t) => storedTokens.has(t)),
        ),
        matching_measurements: [],
        equipment_match: equipmentMatch,
        seasonal_relevance: recencyScore,
      },
    };
    return match;
  });

  return scored
    .filter((m) => m.relevance_score > 0 || m.match_details.equipment_match)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 20);
}
