# Implementation Plan - A2L Refrigerant Charge Calculator

## Objective
Implement a calculator to determine the maximum allowable charge limit for A2L (mildly flammable) refrigerants based on room size and installation height, complying with safety standards (simplified view of ASHRAE 15 / IEC 60335-2-40).

## User Story
As an HVAC technician, I want to calculate the maximum safe charge of A2L refrigerants for a specific room size so that I can ensure compliance with safety standards.

## Technical Implementation

### 1. Update Refrigerant Database
**File:** `client/lib/refrigerants.ts`
- Add `LFL` (Lower Flammability Limit in kg/m³) property to the `RefrigerantProperties` interface.
- Update existing A2L refrigerants (R-32, R-1234yf, R-1234ze(E)) with their LFL values.
    - R-32: 0.307 kg/m³
    - R-1234yf: 0.289 kg/m³
    - R-1234ze(E): 0.303 kg/m³
    - (Add R-454B if common: 0.303 kg/m³)

### 2. Create A2L Calculator Component
**File:** `client/pages/DIYCalculators.tsx` (or new file `client/components/calculators/A2LCalculator.tsx`)
- **Inputs:**
    - Refrigerant Selection (Filter for A2L/A3 only).
    - Charge Amount (kg/lbs) - *Optional, to check if specific charge is safe*.
    - Room Area (m²/sq ft).
    - Installation Height ($h_{inst}$):
        - Floor (0.6m)
        - Window (1.0m)
        - Wall (1.8m)
        - Ceiling (2.2m)
- **Outputs:**
    - Maximum Allowable Charge ($m_{max}$).
    - Minimum Room Area ($A_{min}$) for the input charge.
    - Safety Status (Safe, Mitigation Required, Unsafe).

### 3. Core Logic (Frontend)
Use the formula derived from IEC 60335-2-40:
$$ m_{max} = 2.5 \times LFL^{(5/4)} \times h_{inst} \times \sqrt{A} $$

Where:
- $m_{max}$ = Max charge (kg)
- $LFL$ = Lower Flammability Limit (kg/m³)
- $h_{inst}$ = Installation height (m)
- $A$ = Room area (m²)

### 4. Integration
- Add a new Tab "A2L Safety" to `DIYCalculators.tsx`.
- Import and render the `A2LCalculator` component.

## Tasks
1. [ ] Update `RefrigerantProperties` interface and data in `client/lib/refrigerants.ts`.
2. [ ] Create `A2LCalculator` component with inputs/outputs UI.
3. [ ] Implement calculation logic with unit conversion support.
4. [ ] Integrate into `DIYCalculators` page.
