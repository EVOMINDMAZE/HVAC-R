# 🗺️ Smart Integration Master Strategy (A-Z)

This document is the **Single Source of Truth** for the Smart Asset Integration strategy. It outlines exactly how we solve the problem of connecting client equipment to ThermoNeural, ensuring we never slide off track.

---

## 🎯 The Objective
To connect HVAC/R equipment data streams to our platform so we can:
1.  **Monitor Health:** See real-time temperatures and pressures.
2.  **Alert:** WhatsApp/SMS warnings when things break.
3.  **Analyze:** Use AI to predict failures.

## 🧩 The Challenge
**Clients are not tech-savvy.** We cannot ask them to configure API keys or complex settings.
**Technicians** are on-site but might not have the homeowner's Wi-Fi passwords or Cloud logins.

## 💡 The Solution Strategy
We support two strict workflows. We deliberately ignore complex "hub" setups in favor of these two simple paths.

### 1️⃣ Path A: "The Technician has the Login" (Direct Connect)
**Scenario:** The client is standing next to the technician, or the technician knows the login (e.g., a facility manager).
1.  **Technician** opens "Add Smart Asset" in the App.
2.  Selects Provider (e.g., Honeywell).
3.  Selects "I have the login".
4.  **Technician** types the Username/Password directly into a secure popup.
5.  **Target System:** Connects immediately.
6.  **Result:** Asset is linked. Data starts flowing.

### 2️⃣ Path B: "The Invite" (Remote Auth)
**Scenario:** The technician is on the roof, the owner is on vacation or busy.
1.  **Technician** opens "Add Smart Asset".
2.  Selects Provider (e.g., Tuya/Honeywell).
3.  Selects "Invite Client".
4.  **Technician** enters the Client's Email.
5.  **App** saves a "Pending Integration" record in Database.
6.  **Automation (n8n)** wakes up, sees the pending request.
7.  **n8n** sends a branded "Magic Link" email to the Client.
8.  **Client** clicks the link (at their convenience).
    *   Lands on `thermoneural.com/connect-provider`
    *   Logs in to their Honeywell/Tuya account securely.
9.  **System** receives the OAuth Tokens and saves them.
10. **Result:** Asset is linked. Data starts flowing.

---

## 🏗️ Technical Architecture

### 1. The Frontend (React)
- **Role:** Data Collection & UI.
- **Responsibility:**
    - Display the Wizard.
    - Collect `Provider`, `Email`, or `Credentials`.
    - **Never** talk to 3rd party APIs directly (security risk).
    - Write intent to Supabase (`integrations` table).

### 2. The Database (Supabase)
- **Role:** State Management.
- **Responsibility:**
    - Store the `Integration Request` (Pending/Active).
    - Trigger the Automation when a new request arrives.
    - **Table:** `integrations`
        - `status`: `pending_invite` -> `active`

### 3. The Orchestrator (n8n)
- **Role:** The "Brain" doing the heavy lifting.
- **Responsibility:**
    - **Workflow 1 (Invites):** Listen for `INSERT` on DB -> Send Email.
    - **Workflow 2 (Data Polling):** Every 5 mins, loop through ALL active integrations -> Fetch Temp/Humidity -> Save to DB (`telemetry_readings`).

---

## ✅ Implementation Checklist

### Step 1: Frontend & DB (Completed)
- [x] Create `integrations` table.
- [x] Build UI Wizard for selecting Brand & Method.
- [x] Build "Magic Link" Landing Page (`IntegrationLanding.tsx`).

### Step 2: The Invite Workflow (Current Priority)
- [x] Create Database Webhook (Supabase -> n8n).
    - **URL:** `https://automation.thermoneural.com/webhook/invite-webhook`
    - **Trigger:** INSERT on `workflow_requests`.
- [x] Configure n8n Workflow (Imported & Active).
    - [x] Receive Webhook.
    - [x] Send Gmail (SMTP Configured).
    - [x] Update DB status to `completed`.

### Step 3: Provider Integrations (Phase 2 - Real Integration)
**Goal:** Replace the "Simulation" on the landing page with real OAuth Redirects.

#### 3A. The "Triad" Strategy & Credentials 🔑
We focus on 3 core integrations that cover 80% of our market. We do not support everything.

- [ ] **1. Honeywell Home (Resideo) - Residential Standard**
    *   **Status:** ⚠️ PENDING APPROVAL (Submitted).
    *   **Action:** Wait for approval. Meanwhile, build generic backend.
    *   **URL:** [developer.honeywellhome.com](https://developer.honeywellhome.com/)
    *   **Redirect URL:** `https://thermoneural.com/callback/honeywell`

- [x] **2. Google Nest - The 'Easy Win' ($5)**
    *   **Status:** ✅ LIVE & TESTED.
    *   **Action:** Credentials configured.
    *   **Needs:** `NEST_PROJECT_ID` (Set), `NEST_CLIENT_ID` (Set).

- [ ] **3. Sensibo - The Retrofit**
    *   **Status:** 📧 EMAILING SUPPORT.
    *   **Use Case:** Critical for older mini-splits.

- [ ] **4. KE2 Therm - Commercial Refrigeration**
    *   **Status:** 🔍 USER RESEARCHING.
    *   **Use Case:** Walk-in Freezers/Coolers.

- [ ] **Dev/Fallback Options**
    *   **SmartThings:** Free. Use [developer.smartthings.com](https://developer.smartthings.com).
    *   **Tuya:** Free IoT Core. Complex but instant.

- [ ] **DEPRECATED**
    *   **Ecobee:** ❌ Developer program is CLOSED.
    *   **Mitsubishi Kumo:** ❌ No Public API. Use Sensibo.

#### 3B. Landing Page Security (The Guard) 🔓
The landing page `IntegrationLanding.tsx` is currently public but can't see the database. We need a "Public Gatekeeper".
- [x] Create Database Function `get_public_invite_info(integration_id)`.
    - **Input:** UUID (Invite ID).
    - **Returns:** `{ provider: 'Honeywell', status: 'pending', invited_email: '...' }`.
    - **Security:** `SECURITY DEFINER` (runs as admin, but only returns safe non-sensitive info).
- [x] Connect Landing Page to this function to validate the invite *before* showing the "Connect" button.

#### 3C. The OAuth Flow (The Handshake) 🤝
- [x] **Step 1 (Redirect):** Update `handleConnect` in `IntegrationLanding.tsx` to redirect user to `https://api.honeywell.com/oauth2/authorize?...`
    - *Status:* Simulation logic active. Ready to switch to production URL once Client ID is available.
- [x] **Step 2 (Callback Page):** Create new page `client/pages/Callback.tsx`.
    - Captures `?code=...` from URL.
    - Sends code to our Backend (Supabase Edge Function).
- [x] **Step 3 (Token Exchange):**
    - **Backend Engine:** Supabase Edge Function `oauth-token-exchange` created.
    - **Status:** Architecture built & tested. Waits for `HONEYWELL_CLIENT_ID` to be live.

---

## 🔜 Step 4: Commercial Refrigeration (User Action)
**Focus:** KE2 Therm Integration.
- [x] **Research:** Confirmed "Standard TCP/IP RESTful API" exists. No public docs.
- [ ] **Action:** User to contact `sales@ke2therm.com` for "SmartAccess API Integration Guide".

## 🛠️ Step 5: The "Heartbeat" (Data Polling & Refresh)
Now that we (will) have tokens, we need to use them.
- [x] **Token Refresher:** Supabase Edge Function `refresh-oauth-token` built.
    - Logic: Checks for tokens expiring in < 20 mins -> Refreshes them -> Updates DB.
    - Status: Ready (Needs Keys).
- [x] **Data Polling:** Supabase Edge Function `poll-integrations` built (Skeleton).
    - **Logic:** Loops through integrations -> FETCHES real Honeywell data (if keys exist).
    - **Status:** ⚠️ Partial. Honeywell logic is real. Sensibo/KE2 are placeholders.
    - **Critical TODO:** Implement `external_id` (Honeywell Device ID) to `asset_id` (ThermoNeural Asset ID) mapping before saving to DB. Currently it just logs the data.

---

## 🛡️ Security Rules
1.  **Never** store client passwords. Only store **OAuth Tokens** (Access/Refresh).
2.  **Row Level Security (RLS)** is enforced via Supabase. A student can only see assets they are assigned to.
3.  **Supabase Edge Functions** are the only service allowed to see the "Secrets" (API Keys).
