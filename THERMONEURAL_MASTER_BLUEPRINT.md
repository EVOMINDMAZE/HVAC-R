# ThermoNeural: The Master Blueprint 🏗️

This document serves as the **single source of truth** for the ThermoNeural platform (Version 2.0). It synthesizes the vision, technical structure, functional capabilities, strategic targeting, and design philosophy.

---

## 1. The Core Vision (The "Why") 🌟

**ThermoNeural** is the world's first **Integrated HVAC Intelligence Platform**. It bridges the gap between scientific diagnostics and business operations.

- **Philosophy:** "Physics + Business + Art."
- **The Problem:** HVAC Technicians use one app for messy diagnostics (giving them a number) and another for business (giving them an invoice). The data never connects.
- **The Solution:** A unified platform where every thermodynamic calculation is automatically tagged to a customer file, geo-stamped, and turned into a billable asset.

---

## 2. Target Architecture (Who is this for?) 🎯

| Persona | Use Case | The "Hook" | Value Proposition |
| :--- | :--- | :--- | :--- |
| **The Owner-Operator** ("Chuck in a Truck") | Running a 1-3 person business. | **"The Risk Shield"** | One $50 PDF invoice/report pays for the app. Replaces ServiceTitan ($400/mo) with a $29/mo solution. |
| **The Vocational Student** | Learning the trade. | **"The Game"** | Gamified learning where correct Superheat calculations earn "XP". Visualizing invisible concepts like Enthalpy. |
| **The Instructor** | Teaching a class. | **"The Dashboard"** | Real-time view of student performance. "Who is failing at Subcooling?" |
| **The Enterprise** | Insurance/Warranty Co. | **"The Truth"** | Geo-tagged, time-stamped proof of diagnosis to prevent fraud and verify repairs. |

---

## 3. Functional Ecosystem (The "What") 🛠️

### A. The Physics Engine (Calculators) 🌡️
*Powered by a custom TypeScript Thermodynamics Library.*

1.  **Standard Vapor Compression Cycle:**
    *   **Inputs:** Pressure (PSIG), Saturation Temp, Line Temp.
    *   **Outputs:** Real-time Superheat/Subcooling, Enthalpy Delta.
    *   **Visuals:** Dynamic, interactive P-h (Pressure-Enthalpy) Diagram.
2.  **Cascade System Analyzer:**
    *   **Specialty:** For Ultra-Low Temp (Cryogenics) & Biomedical fridges.
    *   **Logic:** Multi-stage analysis (Stage 1 determines Stage 2 load).
3.  **Psychrometric Calculator:**
    *   **Inputs:** Dry Bulb, Wet Bulb/Humidity.
    *   **Outputs:** Enthalpy, Dew Point, Grains of Moisture.
    *   **Logic:** Includes "Target Evaporator Exit Temp" auto-calculation.
4.  **A2L / A3 Safety Calculator:**
    *   **Database:** 80+ Refrigerants (R-290, R-32, R-454B).
    *   **Logic:** Calculates "Maximum Charge Limit" based on room volume (LFL/UFL standards).
    *   **Compliance:** Checks against UL 60335-2-40 standards.
5.  **Target Superheat (Fixed Orifice):**
    *   **formula:** `((3 * IndoorWB) - 80 - OutdoorDB) / 2`
    *   **Auto-Weather:** Can fetch "Outdoor Dry Bulb" from local weather APIs.

### B. The Business Engine (Operations) 💼
*Built on Supabase PostgreSQL + Edge Functions.*

1.  **Context Strategy (The "Medical Record"):**
    *   **Job System:** Technicians "Check In" to a Job (e.g., "Smith Residence").
    *   **Data Linking:** Every subsequent calculation is Foreign-Keyed to that `project_id`.
2.  **Professional Estimator:**
    *   **Builder:** Drag-and-drop line items for parts and labor.
    *   **Output:** Professional PDF Quotes with Company Branding.
3.  **Risk Shield (Compliance Reports):**
    *   **Feature:** One-click generation of "Winterization Verification" or "Commissioning Report".
    *   **Value:** A tangible PDF the tech can sell to the homeowner for $50-$100.
4.  **Customer Portal:**
    *   **View:** Homeowners can view their own equipment history via a secure link.

### C. The Content Engine (Learning) 📚
*Powered by Sanity Headless CMS.*

1.  **Web Stories:**
    *   **Format:** TikTok/Instagram-style vertical video & slide feed.
    *   **Content:** Micro-learning (e.g., "3 Steps to Check a Capacitor").
    *   **Tech:** Framer Motion animations for smooth swiping.
2.  **AI Diagnostics Assistant:**
    *   **Persona:** "The Master Tech in your pocket."
    *   **Tech:** RAG system (Retrieval Augmented Generation) looking up manual specs.

---

## 4. Technical Architecture (Under the Hood) ⚙️

### The Stack (Modern & Robust)
*   **Frontend:**
    *   **Framework:** React 18
    *   **Build Tool:** Vite (Ultra-fast HMR)
    *   **Language:** TypeScript (Strict typing for physics formulas)
    *   **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives)
    *   **Motion:** Framer Motion (Page transitions & micro-interactions)
    *   **PWA:** Service Workers for offline access to calculators.
*   **Backend (Supabase):**
    *   **Database:** PostgreSQL.
    *   **Auth:** Google OAuth, Magic Links.
    *   **Storage:** Buckets for Project Photos & Company Logos.
    *   **Edge Functions (Deno):**
        *   `stripe-webhook`: Handles subscription lifecycle.
        *   `poll-integrations`: Fetches IoT data from Honeywell/Nest.
        *   `generate-pdf`: Server-side PDF generation.
*   **Infrastructure:**
    *   **Hosting:** Netlify / Vercel (Frontend).
    *   **CMS:** Sanity.io (for Blogs & Web Stories).
    *   **Payments:** Stripe (Subscriptions & One-time Report fees).

### Key Database Tables
*   `companies`: Tenant profiles (Branding colors, logos).
*   `projects` (or `jobs`): The core "Context" unit.
*   `calculations`: JSONB storage of physics inputs/results.
*   `licenses`: Managing User Access tiers.
*   `integrations`: Storing OAuth tokens for Smart Home providers.
*   `telemetry_readings`: Time-series data from IoT devices.

---

## 5. Design Language & UX 🎨

**Theme:** "Glassmorphic Industrial"
*   **Visuals:** Dark Mode standard. Frosted glass panels (`backdrop-blur-md`). Neon accent colors (Blue for Cooling, Red for Heating, Green for Efficiency).
*   **Interaction:**
    *   **Haptic Feedback:** Sliders snap to common values.
    *   **Feedback:** Toast notifications for every "Save" (Gamification reward).
*   **Accessibility:** High contrast text (WCAG AA) for visibility in dark basements/attics.

---

## 6. Integrations (The IoT Layer) 🌐

**Goal:** Automatic Data Ingestion.
*   **Supported Providers:**
    *   **Honeywell / Resideo:** Thermostats.
    *   **Google Nest:** Smart Thermostats.
    *   **Sensibo:** Mini-split controllers.
*   **Flow:** User authenticates via OAuth -> We poll device status -> We auto-create "Assets" in the database -> We log Telemetry.

---

## 7. Monetization Strategy 💰

1.  **Freemium:**
    *   Basic Standard Cycle Calculator.
    *   Access to Web Stories.
2.  **Pro ($29/mo):**
    *   Unlimited Job History.
    *   Company Branding on PDFs.
    *   Advanced Calculators (Cascade, A2L).
    *   Offline Mode.
3.  **Enterprise ($99/mo):**
    *   Fleet Management / Multi-user teams.
    *   API Access.
    *   Integration with ServiceTitan/Jobber.

---

## 8. Current Status & Roadmap 🗺️

**Current State:** v2.0 Production Ready.
*   **Core:** Stable.
*   **Payments:** Live (Stripe).
*   **CMS:** Integrated (Sanity).

**Strategic Focus:**
1.  **Content Population:** Flooding the app with high-value Web Stories.
2.  **Report Monetization:** Perfecting the "Winterization Report" to drive immediate ROI for users.
