# ThermoNeural Master Execution Plan 📋

This document is the **Active Roadmap**. It breaks down every single task required to build the "Blue Ocean" features (EPA, Automations, Warranty, etc.).
**Rule:** We check these off one by one. No jumping around.

---

##  PHASE 1: The "EPA 608" Compliance Engine ⚖️
**Status:** 🟡 In Progress (Database ready, UI needed)
**Goal:** A simplified mobile form for techs to log refrigerant use, which feeds the "Audit Shield."

- [ ] **1.1. Apply Database Migration**
    - [ ] Run `supabase migration up` to create `refrigerant_cylinders` and `refrigerant_logs`.
    - [ ] Verify RLS policies (Ensure techs only see their own tanks).
- [ ] **1.2. Build "Cylinder Manager" UI**
    - [ ] Create `client/pages/refrigerant/Inventory.tsx` (List View of tanks).
    - [ ] Create `AddCylinderDialog.tsx` (Green '+' button to add new jug).
    - [ ] **Key Feature:** "QR Scan" to find a tank (Camera integration later, text search first).
- [ ] **1.3. Build "Log Usage" UI**
    - [ ] Create `LogRefrigerantDialog.tsx`.
    - [ ] Inputs: `Job ID` (Optional), `Amount (lbs)`, `Type` (Charge/Recover).
    - [ ] **Logic:** Client-side validation (Cannot withdraw 10lbs from a 5lb tank).
- [ ] **1.4. The "Audit Report"**
    - [ ] Create `client/pages/refrigerant/ComplianceReport.tsx`.
    - [ ] Feature: "Export CSV" button (matches EPA format).

---

## PHASE 2: The "Review Hunter" & "Invoice Chaser" (n8n) 🤖
**Status:** 🔴 Pending
**Goal:** Set up the backend robots to make money/reputation automatically.

- [ ] **2.1. Supabase Webhooks**
    - [ ] Configure Database Webhook: `ON UPDATE jobs SET status = 'completed'`.
    - [ ] Configure Database Webhook: `ON INSERT invoices`.
- [ ] **2.2. "Review Hunter" Workflow (n8n)**
    - [ ] Create `review_hunter.json` workflow file.
    - [ ] **Logic:** Wait 45 mins -> Check "Happy" tag -> Send SMS (Twilio).
- [ ] **2.3. "Invoice Chaser" Workflow (n8n)**
    - [ ] Create `invoice_chaser.json` workflow file.
    - [ ] **Logic:** Cron Job (Daily) -> Query `unpaid` -> Send Email (SendGrid).
- [ ] **2.4. Connect n8n to Prod**
    - [ ] Set up n8n credentials (Supabase Service Key, Twilio Key, SendGrid Key).

---

## PHASE 3: The "Indoor Health" Report 🫁
**Status:** 🔴 Pending
**Goal:** A sales tool that turns humidity readings into a PDF proposal.

- [ ] **3.1. Update Psychrometric Tool**
    - [ ] Add "One-Click Report" button to `PsychrometricCalculator.tsx`.
- [ ] **3.2. PDF Generation Logic**
    - [ ] Install `@react-pdf/renderer`.
    - [ ] Design Template: `ClientReportPDF.tsx` (Professional, clean, red/green gauges).
    - [ ] **Content:** Add "Sales Copy" explaining why high humidity = mold.
- [ ] **3.3. Delivery System**
    - [ ] Feature: "Email to Client" or "Save to Job" button.

---

## PHASE 4: The "Warranty Auto-Pilot" 🛡️ (Advanced)
**Status:** 🔴 Pending
**Goal:** OCR Scanner to find lost warranty money.

- [ ] **4.1. Camera Integration**
    - [ ] Add `react-webcam` or native HTML5 camera capture.
- [ ] **4.2. OCR Engine**
    - [ ] Implement `tesseract.js` worker.
    - [ ] Train/configure it to recognize "Model No" and "Serial No" patterns.
- [ ] **4.3. Manufacturer Lookup (MVP)**
    - [ ] Create a simple "Lookup" button that deep-links to Carrier/Trane warranty sites (Phase 1).
    - [ ] (Future) Direct API integration.

---

## PHASE 5: The "Pre-Dispatch Triage" 🤖
**Status:** 🔴 Pending
**Goal:** Public link for homeowners.

- [ ] **5.1. Public Landing Page**
    - [ ] Create `client/pages/public/Triage.tsx`.
    - [ ] Remove Auth requirement for this specific route.
- [ ] **5.2. Media Upload**
    - [ ] Create Supabase Storage Bucket: `triage-uploads` (Public Write / Private Read).
- [ ] **5.3. AI Vision Analysis**
    - [ ] Create Edge Function: `analyze-triage-media`.
    - [ ] Connect to OpenAI GPT-4o Vision API.

---

## 🏁 How we proceed
**Current Focus:** [PHASE 1.1] Apply Database Migration.

*Use this file to track our exact position. Do not deviate.*
