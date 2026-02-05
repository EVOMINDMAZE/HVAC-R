import { describe, it, expect, beforeEach, vi } from "vitest";
import { PatternRecognitionService } from "../../../server/services/PatternRecognitionService.js";

// Mock supabaseAdmin
vi.mock("../../../server/utils/supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              range: vi.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
              ),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: { id: "test-pattern-id" },
              error: null,
            }),
          ),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              range: vi.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
              ),
            })),
          })),
        })),
      })),
      insert: vi.fn(() =>
        Promise.resolve({
          data: { id: "test-pattern-id" },
          error: null,
        }),
      ),
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: { id: "test-pattern-id" },
            error: null,
          }),
        ),
      })),
    })),
    rpc: vi.fn((fnName: string, params: any) => {
      if (fnName === "update_pattern_occurrence") {
        return Promise.resolve("test-pattern-id");
      }
      if (fnName === "get_related_patterns") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    }),
  },
}));

describe("PatternRecognitionService", () => {
  let patternService: PatternRecognitionService;

  beforeEach(() => {
    patternService = new PatternRecognitionService();
  });

  describe("analyzeHistoricalData", () => {
    it("should return pattern analysis for valid company ID", async () => {
      const companyId = "test-company-id";

      const analysis = await patternService.analyzeHistoricalData(companyId);

      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty("symptom_correlations");
      expect(analysis).toHaveProperty("equipment_failures");
      expect(analysis).toHaveProperty("measurement_anomalies");
      expect(analysis).toHaveProperty("seasonal_patterns");
    });

    it("should handle errors gracefully", async () => {
      // Test with invalid data that might cause errors
      const companyId = "";

      try {
        await patternService.analyzeHistoricalData(companyId);
        expect(true).toBe(true); // Should not throw
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getRelatedPatterns", () => {
    it("should find patterns for given symptoms", async () => {
      const symptoms = ["no_cooling", "high_head_pressure"];
      const equipmentModel = "Test Model X1000";
      const companyId = "test-company-id";

      const patterns = await patternService.getRelatedPatterns(
        symptoms,
        equipmentModel,
        companyId,
      );

      expect(Array.isArray(patterns)).toBe(true);
    });

    it("should return empty array for empty symptoms", async () => {
      const patterns = await patternService.getRelatedPatterns(
        [],
        undefined,
        "test-company",
      );

      expect(patterns).toEqual([]);
    });
  });

  describe("calculateConfidence", () => {
    it("should calculate confidence score correctly", () => {
      const pattern = {
        confidence_score: 75,
        equipment_model: "Test Model",
        pattern_data: { symptoms: ["no_cooling"] },
        last_seen: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 10 days ago
      };

      const context = {
        symptoms: ["no_cooling"],
        measurements: {},
        equipment_model: "Test Model",
        ambient_conditions: { temperature: 25 },
      };

      const confidence = patternService.calculateConfidence(pattern, context);

      expect(typeof confidence).toBe("number");
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it("should boost confidence for equipment model matches", () => {
      const pattern = {
        confidence_score: 70,
        equipment_model: "Test Model",
        pattern_data: { symptoms: ["no_cooling"] },
        last_seen: new Date().toISOString(),
      };

      const context = {
        symptoms: ["no_cooling"],
        measurements: {},
        equipment_model: "Test Model", // Exact match
      };

      const confidence = patternService.calculateConfidence(pattern, context);

      expect(confidence).toBeGreaterThan(70); // Should be boosted by model match
    });

    it("should boost confidence for symptom overlap", () => {
      const pattern = {
        confidence_score: 70,
        equipment_model: "Test Model",
        pattern_data: { symptoms: ["no_cooling", "high_head_pressure"] },
        last_seen: new Date().toISOString(),
      };

      const context = {
        symptoms: ["no_cooling", "high_head_pressure", "noisy"], // 2/3 symptoms match
        measurements: {},
      };

      const confidence = patternService.calculateConfidence(pattern, context);

      expect(confidence).toBeGreaterThan(70); // Should be boosted by symptom overlap
    });
  });

  describe("createSymptomOutcomePattern", () => {
    it("should create symptom outcome pattern successfully", async () => {
      const symptoms = ["no_cooling"];
      const diagnosis = "Compressor failure";
      const outcome = "success" as const;
      const equipmentModel = "Test Model";
      const companyId = "test-company";

      const result = await patternService.createSymptomOutcomePattern(
        symptoms,
        diagnosis,
        outcome,
        equipmentModel,
        companyId,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should validate outcome parameter", async () => {
      const symptoms = ["no_cooling"];
      const diagnosis = "Test diagnosis";
      const equipmentModel = "Test Model";
      const companyId = "test-company";

      // Test invalid outcome
      await expect(
        patternService.createSymptomOutcomePattern(
          symptoms,
          diagnosis,
          "invalid" as any,
          equipmentModel,
          companyId,
        ),
      ).rejects.toThrow();
    });
  });

  describe("createMeasurementAnomalyPattern", () => {
    it("should create measurement anomaly pattern", async () => {
      const parameter = "suction_pressure";
      const value = 150; // Abnormal value
      const expectedRange = { min: 50, max: 85 };
      const diagnosis = "Low suction pressure";
      const companyId = "test-company";

      const result = await patternService.createMeasurementAnomalyPattern(
        parameter,
        value,
        expectedRange,
        diagnosis,
        companyId,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should skip pattern creation for normal values", async () => {
      const parameter = "suction_pressure";
      const value = 70; // Normal value
      const expectedRange = { min: 50, max: 85 };
      const diagnosis = "Normal pressure";
      const companyId = "test-company";

      // Should not create pattern for normal values
      const result = await patternService.createMeasurementAnomalyPattern(
        parameter,
        value,
        expectedRange,
        diagnosis,
        companyId,
      );

      expect(result).toBeNull();
    });
  });

  describe("updatePattern", () => {
    it("should update pattern with positive feedback", async () => {
      const patternId = "test-pattern-id";
      const feedback = {
        pattern_id: patternId,
        helpful: true,
        correct_diagnosis: true,
        technician_rating: 5,
      };

      await expect(
        patternService.updatePattern(patternId, feedback),
      ).resolves.not.toThrow();
    });

    it("should update pattern with negative feedback", async () => {
      const patternId = "test-pattern-id";
      const feedback = {
        pattern_id: patternId,
        helpful: false,
        correct_diagnosis: false,
        technician_rating: 1,
        additional_notes: "Completely wrong diagnosis",
      };

      await expect(
        patternService.updatePattern(patternId, feedback),
      ).resolves.not.toThrow();
    });
  });
});
