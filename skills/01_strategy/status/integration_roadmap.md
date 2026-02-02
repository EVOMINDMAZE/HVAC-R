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
6.  **Automation (Edge Function)** wakes up, sees the pending request.
7.  **Edge Function** sends a branded "Magic Link" email to the Client.
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

### 3. The Orchestrator (Native)
- **Role**: Lightweight, event-driven execution via Supabase Edge Functions.
- **Responsibility**:
    - **Workflow 1 (Invites)**: Listen for `INSERT` on DB -> Dispatch Email via Resend.
    - **Workflow 2 (Data Polling)**: Scheduled Edge Function (`poll-integrations`) -> Fetch Temp/Humidity -> Save to DB.

---

## ✅ Implementation Checklist

### Step 1: Frontend & DB (Completed)
- [x] Create `integrations` table.
- [x] Build UI Wizard for selecting Brand & Method.
- [x] Build "Magic Link" Landing Page (`IntegrationLanding.tsx`).

### Step 2: The Invite Workflow (Completed)
- [x] Create Database Webhook (Supabase -> Edge Function).
    - **Target**: `webhook-dispatcher`
    - **Trigger**: INSERT on `workflow_requests`.
- [x] Configure Resend Integration.
    - [x] API Key set in Supabase Secrets.
    - [x] Branded email templates designed in `_shared/templates`.

### Step 3: Provider Integrations (Phase 2 - Real Integration)
**Goal:** Replace simulations with production OAuth handlers.

#### 3A. The "Triad" Strategy 🔑
- [x] **2. Google Nest** (✅ LIVE & TESTED)
- [x] **3. Honeywell Home** (✅ LIVE via AI Gateway)

#### 3C. The OAuth Flow (Native Handshake) 🤝
- [x] **Step 1 (Redirect)**: React Frontend handles initial OAuth bounce.
- [x] **Step 2 (Callback)**: `Callback.tsx` captures authorization code.
- [x] **Step 3 (Exchange)**: `oauth-token-exchange` Edge Function manages secrets and token storage.

---

## 🛠️ Step 4: The Core Engine (Polling & Refresh)
- [x] **Token Refresher**: `refresh-oauth-token` (Edge Function) maintains valid access.
- [x] **Data Polling**: `poll-integrations` (Edge Function) populates `telemetry_readings`.

---

## 🛡️ Security Rules
1. **Never** store client passwords. Only store **OAuth Tokens**.
2. **Supabase Secrets** are the only storage for API Keys (Resend, Telnyx, OpenAI).
3. **RLS** ensures Technicians only see readings for their assigned clients.
