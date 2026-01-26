# Strategic Integration Plan: The "Gold Mine" Modules 🗺️

This document outlines the step-by-step roadmap to build the 4 high-value modules. It separates responsibilities between the **AI (Architecture & Code)** and **You (Business & Access)**.

---

## 🏗️ high-Level Strategy

We will build these in order of **"Lowest Friction / Highest Independence."**
1.  **Phase 1: "Indoor Health" Report** (Internal Logic only. Easy win.)
2.  **Phase 2: EPA 608 Compliance** (Database heavy. Minimal UI.)
3.  **Phase 3: AI Pre-Dispatch Triage** (Requires OpenAI Vision API.)
4.  **Phase 4: Warranty Auto-Pilot** (Hardest. Requires external Manufacturer data.)

---

## 🔹 Phase 1: The "Indoor Health" Report 🫁
**Goal:** A simplified "Audit Tool" that generates a PDF sales sheet.

*   **Step 1.1:** Database Schema (Store audit findings).
*   **Step 1.2:** UI: "Audit Wizard" (5-step simple form: Filter, Humidity, Dust).
*   **Step 1.3:** Logic: Scoring Algorithm (0-100).
*   **Step 1.4:** PDF Generation (React-PDF template).

| Task | Who? | Notes |
| :--- | :--- | :--- |
| **Code the UI & Scoring Logic** | 🤖 AI | I can build the React components and math. |
| **Design the PDF Layout** | 🤖 AI | I will create a clean, professional template. |
| **Write the Sales Copy** | 👤 You | "Why you need a UV light" (I'll put placeholders). |
| **Test on iPad/Mobile** | 👤 You | Verify it looks good in the field. |

---

## 🔹 Phase 2: EPA 608 Compliance ⚖️
**Goal:** A "Refrigerant Bank" for the user.

*   **Step 2.1:** Database Schema (`refrigerant_cylinders`, `usage_logs`).
*   **Step 2.2:** Validation Logic (Prevent logging "More used than available").
*   **Step 2.3:** "Leak Rate Calculator" (The official EPA formula).
*   **Step 2.4:** Export to CSV (The "Audit File").

| Task | Who? | Notes |
| :--- | :--- | :--- |
| **Create DB Tables & RLS** | 🤖 AI | I will write the SQL migrations. |
| **Build the "Log Usage" UI** | 🤖 AI | A fast mobile form for technicians. |
| **Implement EPA Formulas** | 🤖 AI | I have the 40 CFR Part 82 specs. |
| **Verify Compliance** | 👤 You | Double-check that my output matches your local regulations. |

---

## 🔹 Phase 3: AI Pre-Dispatch Triage 🤖
**Goal:** A public link for homeowners to upload issues.

*   **Step 3.1:** Public Route (No Login required).
*   **Step 3.2:** File Upload Widget (Photos/Video).
*   **Step 3.3:** Backend Function (`analyze-media`).
*   **Step 3.4:** Dispatcher View (See the AI's guess).

| Task | Who? | Notes |
| :--- | :--- | :--- |
| **Build Public Landing Page** | 🤖 AI | Secure, ephemeral links. |
| **Configure Storage (Buckets)** | 🤖 AI | Set up Supabase storage policies. |
| **Write AI Prompting Logic** | 🤖 AI | "Act as an HVAC expert analyzing this image..." |
| **Provide OpenAI Key** | 👤 You | Ensure your account has GPT-4o access. |

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

## 🏁 Immediate Action Plan (The "First Step")

**We will start with Phase 2 (EPA 608).**
*   **Why?** It's purely internal (no external blockers), highly valuable to Pros, and we already have the database infrastructure.
*   **First Move:** Create the `refrigerant_logs` table and a basic "Add Cylinder" screen.

**Ready to begin Phase 2?**
