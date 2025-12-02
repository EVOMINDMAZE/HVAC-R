import { describe, it, expect } from 'vitest';
import { validateOperatingConditions, validateCycleConditions, getRefrigerantById } from './refrigerants';

describe('Refrigerant Validation Logic', () => {
    describe('validateOperatingConditions', () => {
        it('should return valid for conditions within limits', () => {
            const result = validateOperatingConditions('R134a', 25);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return error for unknown refrigerant', () => {
            const result = validateOperatingConditions('UNKNOWN', 25);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Unknown refrigerant');
        });

        it('should return error for temperature below minimum', () => {
            // R134a min temp is -103.3 C
            const result = validateOperatingConditions('R134a', -110);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('below minimum limit');
        });

        it('should return error for temperature above maximum', () => {
            // R134a max temp is 181.9 C
            const result = validateOperatingConditions('R134a', 200);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('above maximum limit');
        });

        it('should warn for CO2 above critical temp in transcritical mode', () => {
            // R744 critical temp is ~31 C
            const result = validateOperatingConditions('R744', 35, 0.5); // quality provided implies we care about phase
            expect(result.warnings[0]).toContain('transcritical mode');
        });
    });

    describe('validateCycleConditions', () => {
        const r134a = getRefrigerantById('R134a')!;
        const r744 = getRefrigerantById('R744')!;

        it('should return no warnings for normal cycle', () => {
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: 0,
                condenserTemp: 40,
                superheat: 5,
                subcooling: 5
            });
            expect(warnings).toHaveLength(0);
        });

        it('should warn if evaporator temp is too low', () => {
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: -110,
                condenserTemp: 40,
                superheat: 5,
                subcooling: 5
            });
            expect(warnings[0]).toContain('below minimum limit');
        });

        it('should warn if condenser temp is too high', () => {
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: 0,
                condenserTemp: 200,
                superheat: 5,
                subcooling: 5
            });
            expect(warnings[0]).toContain('above maximum limit');
        });

        it('should warn if condenser temp is near critical', () => {
            // R134a critical is ~101 C. 90 is within 20 degrees.
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: 0,
                condenserTemp: 90,
                superheat: 5,
                subcooling: 5
            });
            expect(warnings[0]).toContain('near critical temperature');
        });

        it('should warn for negative superheat', () => {
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: 0,
                condenserTemp: 40,
                superheat: -5,
                subcooling: 5
            });
            expect(warnings[0]).toContain('Negative superheat');
        });

        it('should warn for negative subcooling', () => {
            const warnings = validateCycleConditions(r134a, {
                evaporatorTemp: 0,
                condenserTemp: 40,
                superheat: 5,
                subcooling: -2
            });
            expect(warnings[0]).toContain('Negative subcooling');
        });

        it('should warn for CO2 transcritical operation', () => {
            const warnings = validateCycleConditions(r744, {
                evaporatorTemp: -10,
                condenserTemp: 35, // Above 31 C critical
                superheat: 5,
                subcooling: 5
            });
            expect(warnings.some(w => w.includes('transcritical mode'))).toBe(true);
        });
    });
});
