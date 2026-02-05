import {
  PatternRecognitionService,
  FeedbackData,
} from "../services/PatternRecognitionService.js";

const patternService = new PatternRecognitionService();

// Analyze historical data for patterns
export const analyzePatterns: import("express").RequestHandler = async (
  req,
  res,
) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const analysis = await patternService.analyzeHistoricalData(companyId);

    res.json({
      success: true,
      data: analysis,
      message: "Pattern analysis completed successfully",
    });
  } catch (error) {
    console.error("Error in pattern analysis:", error);
    res.status(500).json({
      error: "Failed to analyze patterns",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get patterns related to specific symptoms and equipment
export const getRelatedPatterns: import("express").RequestHandler = async (
  req,
  res,
) => {
  try {
    const { symptoms, equipmentModel, companyId } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: "Symptoms array is required" });
    }

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const patterns = await patternService.getRelatedPatterns(
      symptoms,
      equipmentModel,
      companyId,
    );

    res.json({
      success: true,
      data: patterns,
      message: `Found ${patterns.length} related patterns`,
    });
  } catch (error) {
    console.error("Error getting related patterns:", error);
    res.status(500).json({
      error: "Failed to get related patterns",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create a new symptom outcome pattern
export const createSymptomOutcomePattern: import("express").RequestHandler =
  async (req, res) => {
    try {
      const { symptoms, diagnosis, outcome, equipmentModel, companyId } =
        req.body;

      if (!symptoms || !Array.isArray(symptoms) || !diagnosis || !outcome) {
        return res.status(400).json({
          error: "Symptoms, diagnosis, and outcome are required",
        });
      }

      if (!["success", "partial", "failed"].includes(outcome)) {
        return res.status(400).json({
          error: "Outcome must be success, partial, or failed",
        });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      const patternId = await patternService.createSymptomOutcomePattern(
        symptoms,
        diagnosis,
        outcome,
        equipmentModel,
        companyId,
      );

      res.json({
        success: true,
        data: { patternId },
        message: "Symptom outcome pattern created successfully",
      });
    } catch (error) {
      console.error("Error creating symptom outcome pattern:", error);
      res.status(500).json({
        error: "Failed to create symptom outcome pattern",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

// Create a new measurement anomaly pattern
export const createMeasurementAnomalyPattern: import("express").RequestHandler =
  async (req, res) => {
    try {
      const { parameter, value, expectedRange, diagnosis, companyId } =
        req.body;

      if (!parameter || value === undefined || !expectedRange || !diagnosis) {
        return res.status(400).json({
          error: "Parameter, value, expectedRange, and diagnosis are required",
        });
      }

      if (!expectedRange.min || !expectedRange.max) {
        return res.status(400).json({
          error: "Expected range must include min and max values",
        });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      const patternId = await patternService.createMeasurementAnomalyPattern(
        parameter,
        value,
        expectedRange,
        diagnosis,
        companyId,
      );

      res.json({
        success: true,
        data: { patternId },
        message: "Measurement anomaly pattern created successfully",
      });
    } catch (error) {
      console.error("Error creating measurement anomaly pattern:", error);
      res.status(500).json({
        error: "Failed to create measurement anomaly pattern",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

// Update pattern based on feedback
export const updatePatternFeedback: import("express").RequestHandler = async (
  req,
  res,
) => {
  try {
    const { patternId } = req.params;
    const feedback: FeedbackData = req.body;

    if (!patternId) {
      return res.status(400).json({ error: "Pattern ID is required" });
    }

    if (feedback.helpful === undefined) {
      return res
        .status(400)
        .json({ error: "Feedback helpful field is required" });
    }

    if (feedback.correct_diagnosis === undefined) {
      return res
        .status(400)
        .json({ error: "Feedback correct_diagnosis field is required" });
    }

    await patternService.updatePattern(patternId, feedback);

    res.json({
      success: true,
      message: "Pattern updated successfully",
    });
  } catch (error) {
    console.error("Error updating pattern:", error);
    res.status(500).json({
      error: "Failed to update pattern",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get patterns by type for a company
export const getPatternsByType: import("express").RequestHandler = async (
  req,
  res,
) => {
  try {
    const { companyId, type } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const validTypes = [
      "symptom_outcome",
      "equipment_failure",
      "measurement_anomaly",
      "seasonal_pattern",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid pattern type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Use the supabase client directly to get patterns
    const { supabaseAdmin } = await import("../utils/supabase.js");
    const { data, error } = await supabaseAdmin!
      .from("ai_learning_patterns")
      .select("*")
      .eq("company_id", companyId)
      .eq("pattern_type", type)
      .order("last_seen", { ascending: false })
      .limit(parseInt(limit as string))
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1,
      );

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      message: `Retrieved ${data?.length || 0} patterns of type ${type}`,
    });
  } catch (error) {
    console.error("Error getting patterns by type:", error);
    res.status(500).json({
      error: "Failed to get patterns",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enhanced troubleshooting with pattern awareness
export const enhancedTroubleshoot: import("express").RequestHandler = async (
  req,
  res,
) => {
  try {
    const {
      symptoms,
      measurements,
      equipmentModel,
      companyId,
      ambientConditions,
      season,
    } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: "Symptoms array is required" });
    }

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Get related patterns first
    const patterns = await patternService.getRelatedPatterns(
      symptoms,
      equipmentModel,
      companyId,
    );

    // Calculate confidence scores for each pattern
    const context = {
      symptoms,
      measurements: measurements || {},
      equipment_model: equipmentModel,
      ambient_conditions: ambientConditions,
      season,
    };

    const enhancedPatterns = patterns.map((pattern) => ({
      ...pattern,
      confidence_score: patternService.calculateConfidence(pattern, context),
    }));

    // Sort by confidence and relevance
    enhancedPatterns.sort((a, b) => {
      const scoreA = a.confidence_score * 0.6 + a.relevance_score * 0.4;
      const scoreB = b.confidence_score * 0.6 + b.relevance_score * 0.4;
      return scoreB - scoreA;
    });

    // Generate pattern-aware recommendations
    const recommendations = generatePatternAwareRecommendations(
      enhancedPatterns,
      context,
    );

    res.json({
      success: true,
      data: {
        patterns: enhancedPatterns,
        recommendations,
        confidence_summary: {
          high_confidence: enhancedPatterns.filter(
            (p) => p.confidence_score >= 80,
          ).length,
          medium_confidence: enhancedPatterns.filter(
            (p) => p.confidence_score >= 60 && p.confidence_score < 80,
          ).length,
          low_confidence: enhancedPatterns.filter(
            (p) => p.confidence_score < 60,
          ).length,
        },
      },
      message: `Found ${enhancedPatterns.length} relevant patterns with AI enhancement`,
    });
  } catch (error) {
    console.error("Error in enhanced troubleshooting:", error);
    res.status(500).json({
      error: "Failed to perform enhanced troubleshooting",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Helper function to generate pattern-aware recommendations
function generatePatternAwareRecommendations(patterns: any[], context: any) {
  const recommendations = [];
  const topPatterns = patterns.slice(0, 3);

  for (const pattern of topPatterns) {
    if (pattern.confidence_score >= 70) {
      const patternData = pattern.pattern_data;

      switch (pattern.pattern_type) {
        case "symptom_outcome":
          recommendations.push({
            priority: pattern.confidence_score >= 85 ? "high" : "medium",
            title: `Historical Success Pattern`,
            description: `Similar symptoms resolved successfully with: ${patternData.diagnosis}`,
            confidence: pattern.confidence_score,
            success_rate:
              patternData.outcome === "success" ? "High" : "Moderate",
            recommended_actions: [
              "Verify system pressures",
              "Check for proper airflow",
              "Review maintenance history",
            ],
            pattern_id: pattern.pattern_id,
          });
          break;

        case "measurement_anomaly":
          recommendations.push({
            priority: "high",
            title: `Measurement Anomaly Detected`,
            description: `${patternData.parameter} shows abnormal pattern: ${patternData.diagnosis}`,
            confidence: pattern.confidence_score,
            parameter: patternData.parameter,
            deviation: `${patternData.deviation_percent?.toFixed(1)}%`,
            recommended_actions: [
              `Verify ${patternData.parameter} sensor calibration`,
              "Check for system restrictions",
              "Review recent service history",
            ],
            pattern_id: pattern.pattern_id,
          });
          break;

        case "equipment_failure":
          recommendations.push({
            priority: "high",
            title: `Equipment-Specific Pattern`,
            description: `${pattern.equipment_model} shows known failure mode`,
            confidence: pattern.confidence_score,
            equipment_model: pattern.equipment_model,
            recommended_actions: patternData.preventive_measures || [
              "Schedule comprehensive inspection",
              "Review manufacturer service bulletins",
              "Check for common failure points",
            ],
            pattern_id: pattern.pattern_id,
          });
          break;
      }
    }
  }

  // Add general recommendations if no strong patterns found
  if (recommendations.length === 0) {
    recommendations.push({
      priority: "medium",
      title: "General Diagnostic Approach",
      description:
        "No strong patterns found. Follow standard troubleshooting procedure.",
      confidence: 50,
      recommended_actions: [
        "Verify system operation parameters",
        "Check electrical connections and voltages",
        "Inspect for visible damage or leaks",
        "Review maintenance records",
      ],
    });
  }

  return recommendations;
}
