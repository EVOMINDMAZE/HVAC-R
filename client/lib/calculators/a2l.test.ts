import { describe, it, expect } from 'vitest';
import { calculateA2LChargeLimit, calculateMinAreaForA2L } from './a2l';

describe('A2L Calculator Logic', () => {
    // R-32 properties: LFL = 0.307 kg/m³
    const R32_LFL = 0.307;

    describe('calculateA2LChargeLimit', () => {
        it('should calculate correctly for R-32 in a standard room', () => {
            // Scenario: R-32, Wall mounted (1.8m), 20m² room
            const result = calculateA2LChargeLimit({
                lfl: R32_LFL,
                height: 1.8,
                area: 20
            });

            // Manual calc:
            // 0.307^1.25 ≈ 0.227
            // 2.5 * 0.227 * 1.8 * sqrt(20)
            // 2.5 * 0.227 * 1.8 * 4.472
            // ≈ 4.56 kg

            expect(result).toBeCloseTo(4.56, 1);
        });

        it('should return 0 for invalid inputs', () => {
            expect(calculateA2LChargeLimit({ lfl: 0, height: 1.8, area: 20 })).toBe(0);
            expect(calculateA2LChargeLimit({ lfl: R32_LFL, height: 0, area: 20 })).toBe(0);
        });

        it('should handle different installation heights', () => {
            const area = 20;
            const floor = calculateA2LChargeLimit({ lfl: R32_LFL, height: 0.6, area });
            const wall = calculateA2LChargeLimit({ lfl: R32_LFL, height: 1.8, area });

            // Wall mount allows more charge than floor mount
            expect(wall).toBeGreaterThan(floor);

            // Ratio should be exactly ratio of heights (1.8 / 0.6 = 3)
            expect(wall / floor).toBeCloseTo(3, 2);
        });
    });

    describe('calculateMinAreaForA2L', () => {
        it('should calculate minimum area correctly', () => {
            // Reverse the previous calculation
            // If we have 4.56kg of R-32 at 1.8m height, we should need ~20m²
            const charge = 4.56;
            const result = calculateMinAreaForA2L(charge, R32_LFL, 1.8);

            expect(result).toBeCloseTo(20, 0);
        });
    });
});
