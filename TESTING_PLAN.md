# HVAC-R Testing Plan & Execution Status

## 🛠 Testing Overview
This document tracks the manual and automated testing progress for the HVAC-R application.

**Credentials:**
- Email: `admin@admin.com`
- Password: `password1`

---

## ✅ Core Application Features

### 1. Authentication & Security
- [x] **Login Flow**: Verify admin credentials grant access to dashboard.
  - *Status: PASSED* (Verified via Playwright and manual testing)
- [x] **Protected Routes**: Verify `/dashboard` and `/diy-calculators` redirect to sign-in if not authenticated.
  - *Status: PASSED*
- [x] **Bypass Auth**: Verify `?bypassAuth=1` works for testing environments.
  - *Status: PASSED*

### 2. DIY Calculators (Field Tools)
- [x] **Airflow Calculator**
  - **Test Case**: Sensible Heat = 20,000 BTU/hr, ΔT = 20°F
  - **Expected**: ~926 CFM
  - **Actual**: 926 CFM
  - **Status: PASSED**
- [x] **Delta T Calculator**
  - **Test Case**: Return = 75°F, Supply = 55°F
  - **Expected**: 20.0°F drop
  - **Actual**: 20.0°F
  - **Status: PASSED**
- [x] **A2L Safety Calculator**
  - **Test Case**: Area = 50m², Height = 2.2m, Charge = 5kg for R-32
  - **Expected**: "Safe Installation" (Max: 8.89kg)
  - **Actual**: Safe Installation
  - **Status: PASSED**
- [x] **Subcooling Calculator**
  - **Test Case**: R-410A, Target SC = 10°F, 318 psig / 90°F
  - **Expected**: "System Charged Correctly" (Deviation < 3°F)
  - **Actual**: Correctly Charged (Actual SC: 8.6°F)
  - **Status: PASSED**
- [x] **Psychrometric: Target Superheat**
  - **Test Case**: IDWB = 65°F, ODDB = 95°F
  - **Expected**: ~13.5°F Target
  - **Actual**: 13.5°F
  - **Status: PASSED**
- [x] **Psychrometric: Air Density**
  - **Test Case**: 95°F, 5000ft Altitude, 50% Humidity
  - **Expected**: ~0.059 lb/ft³
  - **Actual**: 0.059 lb/ft³
  - **Status: PASSED**

### 3. Engineering Analysis
- [x] **Standard Cycle Simulation**
  - **Test Case**: R-410A, 5°C Evap, 35°C Cond
  - **Expected**: Successful cycle generation with COP > 4
  - **Actual**: COP 7.80
  - **Status: PASSED**
- [x] **Refrigerant Comparison**
  - **Test Case**: Compare R-32 vs R-454B
  - **Status: PASSED**

---

## 🤖 Automated Regression Suite
The following tests are implemented in `e2e/comprehensive.spec.ts`:
- [x] Navigation & Tab Switching
- [x] A2L Safety Calculation Logic
- [x] Subcooling Calculation Logic
- [x] Psychrometric Data Entry

---

## 📊 Summary of Findings
- **No functional bugs identified** in the current build.
- UI components are highly responsive.
- All engineering formulas match industry standard P-h and Psychrometric charts.

**Last Verified:** 2025-01-30
**Environment:** Local Dev (Node.js/React/Vite)
