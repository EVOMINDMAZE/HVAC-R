# Automation & Workflow Architecture (n8n + Supabase) 🤖

This document defines the "Robotic Workforce" of ThermoNeural. These workflows run in the background (via **n8n**) to automate business logic, compliance, and revenue generation.

---

## 1. 💵 Revenue Generation Workflows

### A. The "Automatic Upsell" (Sales Assistant)
**Concept:** Turn physics data into immediate sales proposals.
*   **Trigger:** Tech logs `Humidity > 60%` OR `Static Pressure > 0.8` in `calculations` table.
*   **Action:**
    1.  Generate PDF: "Home Health Risk Report."
    2.  Attach Coupon: "$50 Off Dehumidifier" or "$200 Off Duct Cleaning."
    3.  Delivery: SMS the PDF link to the Technician's phone immediately.
*   **n8n Nodes:** `Supabase Trigger (Insert)` -> `IF Logic` -> `PDF Generator` -> `Twilio SMS`.

### B. The "Filter Subscription" Robot
**Concept:** Turn one-time visits into recurring revenue.
*   **Trigger:** Tech logs metadata `filter_size` (e.g., "20x20x1") on a Job.
*   **Action:**
    1.  Calculate `replacement_date` = `today + 90 days`.
    2.  Schedule Email (7 days before): "Ready for fresh air? Click to ship filters."
    3.  Integration: Stripe Payment Link -> Vendor API (Dropship).
*   **n8n Nodes:** `Supabase Trigger` -> `Date & Time` -> `Wait` -> `Gmail`.

### C. The "Winterize Me" Campaign
**Concept:** Auto-fill schedule based on Weather.
*   **Trigger:** `OpenWeatherMap API` predicts `< 32°F` in user's zip code within 7 days.
*   **Action:**
    1.  Query DB: Find clients with `last_heating_maintenance_date > 365 days`.
    2.  Broadcast: "Freeze Warning! Book your check-up now."
*   **n8n Nodes:** `Cron (Daily)` -> `HTTP Request (Weather)` -> `Postgres Query` -> `Twilio / SendGrid`.

---

## 2. ⚡ Operational Efficiency Workflows

### D. The "Review Hunter"
**Concept:** Automate social proof collection.
*   **Trigger:** Job `status` updated to `completed`.
*   **Logic:** Wait 45 minutes (Tech leaves driveway).
*   **Action:** SMS Client: "Did [Tech_Name] wear shoe covers? 👍 / 👎".
    *   If 👍 -> "Great! Leave us a google review here: [Link]"
    *   If 👎 -> "Oh no! Manager will call you." (Internal Alert).
*   **n8n Nodes:** `Supabase Trigger (Update)` -> `Wait` -> `Twilio` -> `Switch`.

### E. The "Ghost Invoice" Chaser
**Concept:** Fix cash flow.
*   **Trigger:** Invoice `status` is `unpaid` AND `due_date < today`.
*   **Action:**
    *   Day +3: Polite Email.
    *   Day +7: Firm SMS.
    *   Day +14: Alert Office Manager (Slack/Teams).
*   **n8n Nodes:** `Cron (Daily)` -> `Postgres Query` -> `Split In Batches` -> `Email/SMS`.
    
### F. The "Part Finder" Assistant
**Concept:** Find inventory without phone calls.
*   **Trigger:** Quote created with status `waiting_on_parts`.
*   **Action:** Scraper/API checks local Supply House inventory for the SKU.
*   **Result:** Text Tech: "Ferguson has 3 in stock."

---

## 3. 🛡️ Risk & Compliance

### G. The "Warranty Robot"
**Concept:** Recover lost manufacturer warranty money.
*   **Trigger:** Job Quote contains item `Compressor` OR `Coil`.
*   **Action:**
    1.  OCR Scan of Nameplate (from Job Photos).
    2.  Query Manufacturer Warranty API (Carrier/Trane).
    3.  If Valid -> Auto-fill PDF Claim Form -> Email to Office.

### H. The "EPA Watchdog"
**Concept:** Prevent fines.
*   **Trigger:** `refrigerant_logs` insert where `amount > 50 lbs`.
*   **Action:**
    1.  Calculate 30-day Repair Deadline.
    2.  Create Calendar Event: "Mandatory Leak Re-Check".
    3.  Alert Tech (T-3 days): "Verify repair at [Client] or face fine."

---

## 🛠 Integration Roadmap

**Phase 1 (Easy Wins):**
1.  **Review Hunter** (High impact / Low complexity).
2.  **Ghost Invoice Chaser** (Pure database logic).

**Phase 2 (Revenue):**
1.  **Automatic Upsell** (Requires PDF generation logic).
2.  **Filter Subscription** (Requires Stripe integration).

**Phase 3 (Advanced AI):**
1.  **Warranty Robot** (Requires OCR & external APIs).
2.  **Part Finder** (Requires difficult Supply House scraping).

