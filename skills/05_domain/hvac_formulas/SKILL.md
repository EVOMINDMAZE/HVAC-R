---
name: HVAC Formulas & Calculations
description: Core physics and HVAC formulas used in the ThermoNeural application.
---

# HVAC Formulas & Calculations

This skill contains the authoritative formulas used in the application. Refer to this when implementing new calculators or verifying existing logic.

## 1. Target Superheat (Fixed Orifice)

Used for charging fixed orifice systems (pistons/capillary tubes).

**Formula:**
```javascript
Target SH = ((3 * IndoorWB) - 80 - OutdoorDB) / 2
```

**Constraints:**
- Indoor Wet Bulb (WB) must be between 32°F and 100°F.
- Outdoor Dry Bulb (DB) must be between 0°F and 130°F.
- Results are typically valid within ±5°F.

**Source:** standard industry formula (Emerson/Copeland approved method).

## 2. Air Density & Derating

Calculates the density of air at altitude to determine system capacity loss (derating).

**Key Constants:**
- Sea Level Pressure ($P_0$): 101325 Pa
- Sea Level Temp ($T_0$): 288.15 K
- Lapse Rate ($L$): 0.0065 K/m
- Gas Constant ($R$): 8.31447 J/(mol·K)
- Molar Mass ($M$): 0.0289644 kg/mol

**Steps:**
1.  **Pressure at Altitude (Barometric Formula):**
    $$ P = P_0 \cdot (1 - \frac{L \cdot h}{T_0}) ^ \frac{g \cdot M}{R \cdot L} $$

2.  **Saturation Vapor Pressure ($E_s$) (Magnus Formula):**
    $$ E_s = 6.112 \cdot e^{\frac{17.67 \cdot T_c}{T_c + 243.5}} \text{ (hPa)} $$

3.  **Density ($\rho$):**
    Derived effectively using Partial Pressure of Dry Air ($P_d$) and Vapor ($P_v$).

4.  **Derating Impact:**
    $$ \text{Impact \%} = (1 - \frac{\rho_{actual}}{1.225}) \cdot 100 $$
    (Where 1.225 kg/m³ is standard sea-level density).

## 3. Psychrometrics

**Dew Point ($T_{dp}$):**
Calculated using the Magnus formula inversion involving Natural Log of Vapor Pressure.

**Wet Bulb ($T_{wb}$):**
Uses the "Stull" formula (arctangent approximation) as it is computationally efficient for code:
```javascript
Tw = T * atan(0.151977 * sqrt(RH + 8.313659)) + ...
```

## 4. A2L Safety (IEC 60335-2-40)

For calculating max charge of mildy flammable refrigerants (e.g., R32, R454B).

**Primary Variables:**
- $LFL$: Lower Flammability Limit (kg/m³)
- $h_{inst}$: Installation height (m) (Floor=0.6, Wall=1.8, Ceiling=2.2)
- $A$: Room Area (m²)

**Logic:**
Max charge ($m_{max}$) is derived based on checking if the charge concentration would exceed safety factors of the LFL if leaked into the room volume.

*Refer to `lib/calculators/a2l.ts` for the full specific implementation of the chart lookup/formula.*
