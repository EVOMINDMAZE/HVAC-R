# Subcooling Calculator Implementation Plan

## Objective
Implement a Subcooling Calculator for the HVAC-R PWA. This tool is essential for charging and diagnosing systems with Thermal Expansion Valves (TXV). It compares the Actual Subcooling (derived from pressure and temperature) against the Manufacturer's Target Subcooling.

## Core Formula
$$ \text{Subcooling} = \text{Saturation Temperature} (T_{sat}) - \text{Liquid Line Temperature} (T_{liquid}) $$

Where:
- $T_{sat}$ is determined from the Liquid Line Pressure using a Pressure-Temperature (PT) Chart for the selected refrigerant.
- $T_{liquid}$ is measured at the condenser outlet (liquid line).

## Features

### 1. Inputs
- **Refrigerant Selection:** Dropdown (Reuse `RefrigerantSelect` or similar logic).
- **Target Subcooling:** Number input (typically found on nameplate, e.g., 10°F).
- **Liquid Line Pressure (High Side):** Number input (PSIG).
- **Liquid Line Temperature:** Number input (°F).

### 2. Outputs
- **Saturation Temperature ($T_{sat}$):** Calculated/Looked up from PT data.
- **Actual Subcooling:** $T_{sat} - T_{liquid}$
- **Diagnosis/Status:**
  - **Match (±3°F):** "Correctly Charged" (Green)
  - **Low Subcooling (< Target - 3):** "Undercharged" (Red) -> Recommendation: Add Refrigerant
  - **High Subcooling (> Target + 3):** "Overcharged" (Red) -> Recommendation: Recover Refrigerant

### 3. UI/UX
- Consistent card design with other calculators.
- Visual status badges (Safe/Warning/Danger).
- Toggle for "Gauge Mode" is implied since this calculator *requires* gauge readings (Pressure).

## Technical Implementation

### Components
- Create `client/components/calculators/SubcoolingCalculator.tsx`.
- Update `client/pages/DIYCalculators.tsx` to include the new calculator tab.

### Data Source
- Use `client/lib/refrigerants.ts` for PT Chart lookup logic. (Need to confirm if a PT lookup helper exists or needs to be extracted from `TargetSuperheatCalculator`).

### Testing Scenarios
1. **R410A Normal:**
   - Target: 10°F
   - Pressure: 318 PSIG ($T_{sat} \approx 100^\circ F$)
   - Liquid Line Temp: 90°F
   - Result: 10°F Subcooling (Correct)

2. **Undercharged:**
   - Pressure: 318 PSIG ($T_{sat} \approx 100^\circ F$)
   - Liquid Line Temp: 98°F
   - Result: 2°F Subcooling (Low)

3. **Overcharged:**
   - Pressure: 318 PSIG ($T_{sat} \approx 100^\circ F$)
   - Liquid Line Temp: 80°F
   - Result: 20°F Subcooling (High)
