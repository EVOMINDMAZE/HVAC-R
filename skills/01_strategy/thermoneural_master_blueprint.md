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
*Powered by a Hybrid Architecture: TypeScript UI + Python/CoolProp on Render.*

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
    *   **Data Linking:** Every subsequent calculation is Foreign-Keyed to that `job_id`.
2.  **Automated Warranty Claims (The "Cash Finder") 🛡️:**
    *   **Scanner:** OCR scans of Nameplate -> Auto-lookup of Warranty Status.
    *   **Claim Bot:** Auto-generates the claim PDF for Manufacturer submission.
    *   **Value:** User recovers lost revenue; we take a % or charge a premium fee.
3.  **EPA 608 Compliance-as-a-Service ⚖️:**
    *   **Audit-Proof:** Automated "Leak Rate" calculation & "Recovery Log".
    *   **The Ledger:** Immutable record of every ounce of refrigerant moved.
    *   **Value:** Protects the HVAC business from $37k/day EPA fines.
4.  **"Indoor Health" & Compliance Reports 🫁:**
    *   **IAQ Score:** Generates a "Respiratory Health Score" for the home (0-100).
    *   **Risk Shield:** "Winterization Verification" reports for liability protection.
    *   **Value:** A tangible PDF the tech can sell to the homeowner ($50-$100).
5.  **Invoice Management & Billing:**
    *   **Features:** One-click invoice generation from Job context.
    *   **Reporting:** One-click "Export Compliance Log" CSV for auditors.
    *   **Automation:** Integrated "Invoice Chaser" to automate follow-ups for unpaid builds.
    *   **Value:** Direct path from "Fix" to "Cash".
7.  **Weather-Based Intelligence & Selling Points Bot:**
    *   **Alerts**: Incoming heatwave (>90°F) alerts for clients with aging or vulnerable equipment.
    *   **Proactive Sales**: Automatic identification of R-22 replacement opportunities.
    *   **Value**: Automated service lead generation based on external data.

### C. The Customer Experience Layer (AI) 🤖
*Bridging the gap between Homeowner and Technician.*

1.  **Pre-Dispatch Triage (DIY Mode):**
    *   **SMS Link:** Tech sends a "Triage Link" to the client before driving out.
    *   **AI Listen:** Client records "Weird Noise" -> AI predicts "Bad Capacitor".
    *   **Value:** Reduces "Truck Rolls" for simple fixes; prepares tech with right parts.
2.  **Web Stories (Content Feed):**
    *   **Format:** TikTok-style technical guides.
    *   **Content:** "A2L Safety", "EPA Updates", "Troubleshooting".
3.  **AI Diagnostics Assistant:**
    *   **Implementation:** LLM-driven via the **AI Gateway** (DeepSeek/Grok).
    *   **Persona:** "The Master Tech in your pocket" (Technical troubleshooting & diagnostics).

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
*   `jobs`: The core "Context" unit.
*   `user_roles`: RBAC assignments (Owner, Admin, Manager, Tech, Client).
*   `calculations`: JSONB storage of physics inputs/results.
*   `licenses`: Managing User Access tiers.
*   `integrations`: Storing OAuth tokens for Smart Home providers.
*   `telemetry_readings`: Time-series data from IoT devices.
*   `invoices`: Commercial billing and status tracking.
*   `warranty_claims`: AI-extracted equipment data and claim status.
*   `triage_submissions`: Public homeowner leads with AI visual analysis.

---

## 4.5. Multi-Tenant Security (RBAC) 🛡️

ThermoNeural uses a robust **Standardized RBAC Tier** system via PostgreSQL Row Level Security (RLS).

### Access Tiers:
- **Owner**: Full access to company billing, developer settings, and all data.
- **Admin**: Full operational access to company data (Jobs, Clients, Team).
- **Manager**: View/Manage all jobs and team members within their specific company.
- **Tech / Technician**: View assigned jobs, update job status, and perform calculations.
- **Student**: Access to training tools and calculators; no commercial job access.
- **Client**: View their own job history and asset telemetry.

### Security Helpers:
- `get_my_company_id()`: Securely resolves the company ID for the session.
- `get_my_role()`: Resolves the current user's role without RLS recursion.
- `get_my_company_metadata()`: Exposed RPC for non-owners to fetch white-labeling data securely.

---

## 5. Design Language & UX 🎨

**Theme:** "Glassmorphic Industrial" (The "Office" Standard)
*   **Visuals:** Dark Mode standard. Frosted glass panels (`backdrop-blur-xl`). Neon accent colors (Blue for Cooling, Red for Heating, Green for Efficiency).
*   **Dropdowns/Popovers:** Neutral slate highlights (`hover:bg-slate-800/50`) to avoid accent color fatigue.
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
