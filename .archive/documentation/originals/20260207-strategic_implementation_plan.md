# Strategic Integration Plan: The "Gold Mine" Modules 🗺️

This document outlines the step-by-step roadmap to build the 4 high-value modules. It separates responsibilities between the **AI (Architecture & Code)** and **You (Business & Access)**.

---

## 🏗️ high-Level Strategy

We build according to **"Product Market Fit"** and **"Automation Efficiency"**:
1.  **Phase 1: Advanced Notifications & Manual Overrides** (✅ COMPLETED)
2.  **Phase 2: AI Pre-Dispatch Triage** (🚀 ACTIVE - `analyze-media`)
3.  **Phase 3: EPA 608 Compliance** (Database heavy.)
4.  **Phase 4: Warranty Auto-Pilot** (Manufacturer data required.)

---

## 🔹 Phase 1: Advanced Notifications (Foundation) ✅
**Goal:** Per-client preferences and admin manual overrides.

*   **Step 1.1:** Client-level preference schema (`clients.notification_preferences`).
*   **Step 1.2:** White-label email/SMS engine (`webhook-dispatcher`).
*   **Step 1.3:** Admin UI for manual notification triggers and preference bypass.

---

## 🔹 Phase 2: AI Pre-Dispatch Triage 🤖 (Active)
**Goal:** A public link for homeowners to upload issues for AI diagnostic guessing.

*   **Step 2.1:** Public Route (No Login required - `TriageLanding.tsx`).
*   **Step 2.2:** File Upload Widget (Photos/Video).
*   **Step 2.3:** Backend Function (`analyze-media` + GPT-4o Vision).
*   **Step 2.4:** Dispatcher View (AI-generated Probable Causes).

---

## 🔹 Phase 3: EPA 608 Compliance ⚖️
**Goal:** A "Refrigerant Bank" for tech tracking.

*   **Step 3.1:** Database Schema (`refrigerant_cylinders`, `usage_logs`).
*   **Step 3.2:** "Leak Rate Calculator" (The official EPA formula).

---

## 🔹 Phase 4: Automated Warranty Claims 🛡️
**Goal:** OCR Scanner -> Data Fill.

*   **Step 4.1:** Camera Integration (Barcode/Text Scan).
*   **Step 4.2:** Tesseract.js Setup (Local OCR).
*   **Step 4.3:** "The Brain" (Matching Serial # to Brand).
*   **Step 4.4:** PDF Form Filling (`pdf-lib`).

| Task | Who? | Notes |
| :--- | :--- | :--- |
| **Implement OCR Scanner** | 🤖 AI | I can hook up the camera & Tesseract. |
| **Create Manufacturer DB** | 👤 You + 🤖 | **Hardest Part.** We need to know *where* to check warranty. Manual list initially? |
| **Map PDF Fields** | 🤖 AI | I can map data to standard claim forms. |
| **Legal Review** | 👤 You | Ensure we can automate this without specific API deals. |

---

## 🏁 Immediate Action Plan (Current Status)

**The core Notification Engine is LIVE.**
*   **Next Move:** Complete the AI Vision diagnostic flow.
*   **Focus:** Perfecting the `analyze-media` Edge Function to handle technician photos.

**Proceed with AI Triage enhancements?**
