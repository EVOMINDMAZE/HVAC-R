# ThermoNeural Master Execution Plan 📋

This document is the **Active Roadmap**. It breaks down every single task required to build the "Blue Ocean" features (EPA, Automations, Warranty, etc.).
**Rule:** We check these off one by one. No jumping around.

---

##  PHASE 1: The "EPA 608" Compliance Engine ⚖️
**Status:** 🟡 In Progress (Database ready, UI needed)
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

## PHASE 2: The "Review Hunter" & "Invoice Chaser" (n8n) 🤖
**Status:** 🔴 Pending
**Goal:** Set up the backend robots to make money/reputation automatically.

- [x] **2.1. Supabase Webhooks**
    - [x] Configure Database Webhook: `ON UPDATE jobs SET status = 'completed'` (Via Trigger Function `trigger_review_hunter`).
    - [x] Configure Database Webhook: `ON INSERT invoices` (Created table, ready for Cron).
- [x] **2.2. "Review Hunter" Workflow (n8n)**
    - [x] Create `review_hunter.json` workflow file (`.agent/workflows/n8n/review_hunter.json`).
    - [x] **Logic:** Wait 45 mins -> Check "Happy" tag -> Send SMS (Twilio).
- [x] **2.3. "Invoice Chaser" Workflow (n8n)**
    - [x] Create `invoice_chaser.json` workflow file (`.agent/workflows/n8n/invoice_chaser.json`).
    - [x] **Logic:** Cron Job (Daily) -> Query `unpaid` -> Send Email (SendGrid).
- [ ] **2.4. Connect n8n to Prod**
    - [ ] Set up n8n credentials (Supabase Service Key, Twilio Key, SendGrid Key).

---

## PHASE 3: The "Indoor Health" Report 🫁
**Status:** 🔴 Pending
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
**Status:** 🔴 Pending
**Goal:** OCR Scanner to find lost warranty money.

- [x] **4.1. Camera Integration**
    - [x] Add `react-webcam` or native HTML5 camera capture (Added to `WarrantyScanner.tsx`).
- [x] **4.2. OCR Engine**
    - [x] Implement `tesseract.js` worker.
    - [x] Train/configure it to recognize "Model No" and "Serial No" patterns (Regex Heuristics implemented).
- [x] **4.3. Manufacturer Lookup (MVP)**
    - [x] Create a simple "Lookup" button that deep-links to Carrier/Trane warranty sites (Phase 1).
    - [x] (Future) Direct API integration.

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
    - [x] Connect to OpenAI GPT-4o Vision API (Code ready, requires API Key).

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
**Status:** 🟡 In Progress
**Goal:** Launch the PWA.

- [x] **7.1. Environment Variables**
    - [x] Set `XAI_API_KEY` (for Triage Vision - Grok) in Supabase.
    - [x] Set `DEEPSEEK_API_KEY` (for Troubleshooting Chat) in Supabase.
    - [ ] Set n8n Webhook URLs in Supabase and Client (if applicable).
- [x] **7.2. Final Build Check**
    - [x] Run `npm run build` and ensure no errors.
    - [x] Verify bundle size and PWA manifest.
- [ ] **7.3. User Acceptance Testing (UAT)**
    - [ ] User to verify all flows (EPA, Warranty, Triage).
- [x] **7.4. Critical Capability Gaps (Identified)**
    - [x] **Admin Dispatch**: Update `Jobs.tsx` to allow assigning a specific Technician (currently missing).
    - [x] **Triage Dashboard**: Create an Admin view to see incoming "Pre-Dispatch" requests (currently hidden in DB).
- [x] **7.5. Final Deployment**
    - [x] Deploy to Netlify (Client - Triggered via Git Push).
    - [x] Deploy Edge Functions:
        - `analyze-triage-media` (Grok Vision)
        - `ai-troubleshoot` (DeepSeek V3)

---

## 🏁 How we proceed
**Current Focus:** [PHASE 2 - 2.4] Connect n8n to Prod & [PHASE 7 - 7.3] UAT.

*Use this file to track our exact position. Do not deviate.*
