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
    const token = session?.access_token || localStorage.getItem("simulateon_token");
    if (!token) {
      throw new Error("Authentication required");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async analyzePatterns(request: PatternAnalysisRequest) {
    try {
      const response = await fetch("/api/ai/patterns/analyze", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      throw error;
    }
  }

  async getRelatedPatterns(
    request: RelatedPatternsRequest,
  ): Promise<PatternMatch[]> {
    try {
      const response = await fetch("/api/ai/patterns/related", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error getting related patterns:", error);
      throw error;
    }
  }

  async createSymptomOutcomePattern(request: SymptomOutcomePatternRequest) {
    try {
      const response = await fetch("/api/ai/patterns/symptom-outcome", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating symptom outcome pattern:", error);
      throw error;
    }
  }

  async createMeasurementAnomalyPattern(
    request: MeasurementAnomalyPatternRequest,
  ) {
    try {
      const response = await fetch("/api/ai/patterns/measurement-anomaly", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating measurement anomaly pattern:", error);
      throw error;
    }
  }

  async updatePatternFeedback(
    patternId: string,
    feedback: PatternFeedbackRequest,
  ) {
    try {
      const response = await fetch(`/api/ai/patterns/${patternId}/feedback`, {
        method: "PUT",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating pattern feedback:", error);
      throw error;
    }
  }

  async getPatternsByType(
    companyId: string,
    type: string,
    limit = 50,
    offset = 0,
  ) {
    try {
      const response = await fetch(
        `/api/ai/patterns/${companyId}/${type}?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting patterns by type:", error);
      throw error;
    }
  }

  async enhancedTroubleshoot(
    request: EnhancedTroubleshootRequest,
  ): Promise<EnhancedTroubleshootResponse> {
    try {
      const response = await fetch("/api/ai/enhanced-troubleshoot", {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error in enhanced troubleshooting:", error);
      throw error;
    }
  }

  // Utility method to automatically capture diagnostic outcomes
  async captureDiagnosticOutcome(
    _troubleshootingSessionId: string,
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
