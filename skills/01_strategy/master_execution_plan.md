# ThermoNeural Master Execution Plan 📋

This document is the **Active Roadmap**. It breaks down every single task required to build the "Blue Ocean" features (EPA, Automations, Warranty, etc.).
**Rule:** We check these off one by one. No jumping around.

---

##  PHASE 1: The "EPA 608" Compliance Engine ⚖️
**Status:** ✅ Complete (Production Ready)
**Goal:** A simplified mobile form for techs to log refrigerant use, which feeds the "Audit Shield."

- [x] **1.1. Apply Database Migration**
    - [x] Run `supabase migration up` (Used `db push` to Remote).
    - [x] Verify RLS policies (Ensure techs only see their own tanks).
- [x] **1.2. Build "Cylinder Manager" UI**
    - [x] Create `client/pages/refrigerant/Inventory.tsx` (List View of tanks).
    - [x] Create `AddCylinderDialog.tsx` (Green '+' button to add new jug).
    - [x] **Key Feature:** Added to Sidebar as "EPA Bank".
- [x] **1.3. Build "Log Usage" UI**
    - [x] Create `LogRefrigerantDialog.tsx`.
    - [x] Inputs: `Job ID`, `Amount (lbs)`, `Type` (Charge/Recover).
    - [x] **Logic:** Client-side validation (Cannot withdraw more than available).
- [x] **1.4. The "Audit Report"**
    - [x] Create `client/pages/refrigerant/ComplianceReport.tsx`.
    - [x] Feature: "Export CSV" button (matches EPA format).

## 🎉 PHASE 1 COMPLETE!
---

## PHASE 2: The "Review Hunter" & "Invoice Chaser" (Native / n8n) 🤖
**Status:** ✅ Complete
**Goal:** Set up the backend robots to make money/reputation automatically.

- [x] **2.1. Supabase Webhooks**
    - [x] Configure Database Webhook: `ON UPDATE jobs SET status = 'completed'` (Trigger `trigger_review_hunter` fixed 2026-02-01).
    - [x] Configure Database Webhook: `ON INSERT invoices` (Created table, ready for Cron).
- [x] **2.2. "Review Hunter" Workflow (n8n)**
    - [x] Create `review_hunter.json` workflow file (`.agent/workflows/n8n/review_hunter.json`).
    - [x] **Logic:** Wait 45 mins -> Check "Happy" tag -> Send SMS (Telnyx).
- [x] **2.3. "Invoice Chaser" Workflow (n8n)**
    - [x] Create `invoice_chaser.json` workflow file (`.agent/workflows/n8n/invoice_chaser.json`).
    - [x] **Logic:** Cron Job (Daily) -> Query `unpaid` -> Send Email (SendGrid).
- [x] **2.4. Connect n8n to Prod**
    - [x] Set up n8n credentials (Supabase Service Key, Telnyx Key, SendGrid Key). Verified and active emails/SMS flowing.

---

## PHASE 3: The "Indoor Health" Report 🫁
**Status:** ✅ Complete
**Goal:** A sales tool that turns humidity readings into a PDF proposal.

- [x] **3.1. Update Psychrometric Tool**
    - [x] Add "One-Click Report" button to `AirDensityCalculator.tsx` (Integrated PDF generation).
- [x] **3.2. PDF Generation Logic**
    - [x] Install `@react-pdf/renderer`.
    - [x] Design Template: `ClientReportPDF.tsx` (Professional, clean, red/green gauges).
    - [x] **Content:** Add "Sales Copy" explaining why high humidity = mold.
- [x] **3.3. Delivery System**
    - [x] Feature: "Download Client Report" button.

---

## PHASE 4: The "Warranty Auto-Pilot" 🛡️ (Advanced)
**Status:** ✅ Complete
**Goal:** OCR Scanner to find lost warranty money.

- [x] **4.1. Camera Integration**
    - [x] Add `react-webcam` or native HTML5 camera capture (Added to `WarrantyScanner.tsx`).
- [x] **4.2. OCR & AI Data Extraction**
    - [x] Implement Vision AI via `ai-gateway` (mode: `vision`).
    - [x] Extract Brand, Model, Serial, and Symptom data from images.
- [x] **4.3. Manufacturer Lookup & Claim Drafting**
    - [x] Create `CreateWarrantyClaimDialog.tsx` for AI-assisted claim drafting.
    - [x] Integrated "Warranty" tab into Job Details.

---

## PHASE 5: The "Pre-Dispatch Triage" 🤖
**Status:** ✅ Complete
**Goal:** Public link for homeowners.

- [x] **5.1. Public Landing Page**
    - [x] Create `client/pages/public/Triage.tsx` (No Auth required).
    - [x] Form: Name, Phone, "Describe Problem".
- [x] **5.2. Media Upload**
    - [x] Configure Supabase Storage bucket `triage-uploads`.
    - [x] Allow public uploads (with RLS for safety).
- [x] **5.3. AI Vision Analysis**
    - [x] Create Edge Function `analyze-triage-media`.
    - [x] Implement AI Gateway routing for `grok-2-vision-1212`.
    - [x] Automated severity assessment and suspected issue identification.

---

## **PHASE 6: Technician Mobile Experience 📱**
**Status:** ✅ Complete
**Goal:** Ensure the key user (The Tech) has a flawless mobile experience.

- [x] **6.1. Mobile UX Audit**
    - [x] Fix Login Redirect (Technicians now go to `/tech`).
    - [x] Fix Job Board (Restored "Client Name" and added "Job Title").
    - [x] Fix Active Job Page (Crash fixed: `contact_phone` schema alignment).
    - [x] Re-enable "Call Client" button.
- [x] **6.2. Real-Time Tracking**
    - [x] Enable Supabase Realtime for `jobs` table (Migration `20260128160000_enable_realtime_jobs.sql`).
    - [x] Implement Geolocation Hook (`ActiveJob.tsx`).
    - [x] Verify Dispatch Map updates live.
- [x] **6.3. Permissions & Security (RLS)**
    - [x] Grant Techs READ access to `clients` (securely).
    - [x] Grant Techs UPDATE access to their `jobs` (Status only).
    - [x] Grant Techs INSERT access to `job_timeline`.
- [x] **6.4. QA Verification**
    - [x] Verified full flow: Login -> View Job -> Arrive -> Update Status.

---

## **PHASE 7: Deployment & Polish 🚀**
**Status:** ✅ Complete (Optimized)
**Goal:** Launch the PWA with peak performance.

- [x] **7.0. Bundle Optimization & Lazy Loading**
    - [x] Implemented code-splitting for ~50 route components.
    - [x] Reduced main bundle size from 5.5MB to 1.1MB (80% improvement).
    - [x] Unified auth session logic for faster startup.

- [x] **7.1. Environment Variables**
    - [x] Set `XAI_API_KEY` (for Triage Vision - Grok) in Supabase.
    - [x] Set `DEEPSEEK_API_KEY` (for Troubleshooting Chat) in Supabase.
    - [ ] Set n8n Webhook URLs in Supabase and Client (if applicable).
- [x] **7.2. Final Build Check**
    - [x] Run `npm run build` and ensure no errors.
    - [x] Verify bundle size and PWA manifest.
- [x] **7.3. User Acceptance Testing (UAT)**
    - [x] User verified all core flows (EPA, Warranty, Triage). Final Invoice UI validated.
- [x] **7.4. Critical Capability Gaps (Remediated)**
    - [x] **Admin Dispatch**: Updated `Jobs.tsx` to allow assigning a specific Technician.
    - [x] **Triage Dashboard**: Created Admin view to manage incoming "Pre-Dispatch" requests.
- [x] **7.5. Final Deployment**
    - [x] Deploy to Netlify (Client - Triggered via Git Push).
    - [x] Deploy Edge Functions:
        - `ai-gateway` (Router for multiple AI models)
        - `analyze-triage-media` (Grok Vision Analysis)
        - `ai-troubleshoot` (DeepSeek V3 / Groq)
- [x] **7.6. Documentation & Handover**
    - [x] Consolidate all project skills into `skills/`.
    - [x] Create `deployment_guide.md` for SaaS App.
    - [x] update Strategy docs with "Cloud-First" clarification.

---

## PHASE 8: Scaling & Commercial Analytics 📈
**Status:** 🏗️ In Progress
**Goal:** Multi-tenant growth and business intelligence dashboards.

- [ ] **8.1. Dashboard Analytics**
    - [ ] Implement "Revenue at Risk" chart (aggregation of unpaid/overdue invoices).
    - [ ] Implement "Lead Pipeline" (Triage-to-Job conversion rate).
- [ ] **8.2. Multi-Tenant Hardening**
    - [ ] Conduct dedicated RLS security audit for data isolation.
    - [ ] Optimize global `companies` metadata for white-labeling performance.

---

## 🏁 How we proceed
**Current Focus:** [Phase 8] Scaling & Commercial growth via advanced analytics and multi-tenant isolation.
