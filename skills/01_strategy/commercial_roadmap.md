---
name: ThermoNeural Commercialization Roadmap 🚀
description: This roadmap takes us from our current "Prototype" state to a "100% Commercial" SaaS product (ThermoNeural Skool).
version: 1.0
---

# ThermoNeural Commercialization Roadmap 🚀

This roadmap takes us from our current "Prototype" state to a "100% Commercial" SaaS product (`ThermoNeural Skool`).

> [!NOTE]
> **Strategy Alignment**: This roadmap describes the **SaaS Product**, which is strictly **Cloud-First** (Supabase Cloud + Netlify).

## Phase 1: The "Brain" (Supabase Backend) 🧠

**Goal:** Establish the source of truth for licenses and company identities.

- [x] **Database Schema**
  - [x] Create `companies` table (columns: `id`, `user_id`, `name`, `logo_url`, `primary_color`, `website`).
  - [x] Create `licenses` table (columns: `key`, `user_id`, `status`, `expires_at`, `plan_tier`).
  - [x] Set up RLS (Row Level Security) so users can only read their own data.
- [x] **Edge Functions**
  - [x] Create `verify-license` function.
    - Input: `{ license_key }`
    - Logic: Check if key exists AND status='active'.
    - Output: `{ valid: true/false, plan: 'pro' }`.
  - [ ] Create `sso-login` function (optional, for Skool "Magic Link").

## Phase 2: The "White-Label" Experience (Frontend) 🎨

**Goal:** Users feel like they own the software (high perceived value).

- [x] **Company Profile Settings**
  - [x] Create UI: `/settings/company`.
  - [x] File Upload: Allow uploading Logo to Supabase Storage bucket `company-assets`.
  - [x] Live Preview: Show how their branding looks on a sample certificate.
- [x] **PDF Engine Upgrade**
  - [x] Modify `pdfGenerator.ts` to fetch `currentJob.owner.company` details.
  - [x] Replace hardcoded "ThermoNeural" header with User's Logo & Color.

## Phase 3: The "Guaranteed Logic" System (Queue Architecture) 🛡️

**Goal:** Guarantee 100% execution reliability even during connection drops, and secure the execution behind a license check.
**Status**: 🟡 In Progress

- [x] **Smart Queue Infrastructure**
  - [x] Create `workflow_requests` table (The "Inbox" for automation requests).
  - [x] Enable **Supabase Realtime** on this table (so React knows when processing finishes).
  - [x] Implement React Hook `useWorkflowTrigger` for easy frontend integration.
- [x] **The Worker (Edge Functions)**
  - [x] Create `webhook-dispatcher` function.
    - **Trigger:** Supabase Webhook (on INSERT).
    - **Gatekeeper:** Calls `verify-license` logic internally.
    - **Action:** Executes logic (e.g., WhatsApp).
    - **Response:** Updates Supabase row to `completed` or `failed`.

## Phase 4: The "Digital Landlord" (Infrastructure) ☁️

**Goal:** Deliver the managed access to the customer.

- [x] **Automated Provisioning**
  - [x] Application logic handles tenant isolation via `company_id`.
  - [x] No per-client infrastructure required (Multi-tenant architecture).

## Phase 5: The "Cash Register" (Payments & Sync) 💰

**Goal:** Automate access granting.

- [x] **Stripe Integration**
  - [x] Set Environment Variables in Supabase (Telnyx, Resend).
  - [x] On `checkout.session.completed`:
    - Create `companies` record.
    - Generate new `licenses` key.
    - Send "Welcome" email with License Key.
- [x] **Invoice Management**
  - [x] **Invoices Table**: Database schema for tracking payments.
  - **The Data**: We already have Edge Functions collecting GPS and job status.
  - [x] **Invoice UI**: Create & View invoices directly in Job Details.

## Phase 6: Launch & Polish 🚀

- [ ] **Final QA:** End-to-end test (Buy -> Login -> Setup Brand -> Run Automation).
- [ ] **Documentation:** Create the "Getting Started" guide for Skool.
- [ ] **Go Live:** Connect Stripe Live keys.

## Phase 6.5: Client-Level Notification Foundation ✅ (Completed)

**Goal:** Establish granular control over SMS/Email notifications on a per-client basis.

- [x] **Telnyx Integration**
  - [x] Create shared `sms-sender.ts` module with mock mode for development.
  - [x] Implement SMS for `client_invite`, `system_alert`, `job_scheduled` workflows.
- [x] **Per-Client Preferences**
  - [x] Add `notification_preferences` JSONB column to `clients` table.
  - [x] Build `ClientNotificationSettings` component for the Client Portal.
  - [x] Implement Admin UI in `ClientDetail.tsx` for preference toggles and "Force Send" overrides.
- [x] **Unified Notification System**
  - [x] Migrate from SendGrid to Resend for emails.
  - [x] Centralized template engine for white-label branding.
  - [x] Backend enforcement logic in `webhook-dispatcher` and `review-hunter` respects client opt-outs.

> [!NOTE]
> **Related Documentation:**
>
> - [`automation_settings.md`](../03_development/features/automation_settings.md) - Feature docs
> - [`notification_system.md`](../06_automations/notification_system.md) - Architecture
> - [`native_automations.md`](../03_development/architecture/native_automations.md) - Enforcement logic

## Phase 7: Intelligence & Expansion (Q4 2026) 🔱

**Goal:** Multiply LTV through Hardware, Fintech, and Enterprise tiers.

- **AI Receptionist** *(builds on Phase 6.5 SMS foundation)*
  - Conversational SMS bot for scheduling & basic Q&A.
  - Context-aware responses (Client/Job history).
  - "Switchboard" logic to route complex query to human.
- **Advanced Analytics**
  - Predictive equipment failure models.
  - Technician performance scoring.
- **See Strategy:** [Revenue Expansion Plan](./revenue_expansion_plan.md)
- **Tracks:**
  - [x] **Fintech:** "ThermoPay" (Invoice Financing) - ✅ MVP Ready.
  - [x] **Enterprise:** "Fleet Command" (Manager Dashboard) - ✅ Route splitting optimized.
  - - [x] **Hardware:** "ThermoKey" (Bluetooth Lock-in) - 🟡 In Research.

## Phase 8: Weather-Based Intelligence & SaaS Expansion (Active) 🔱

**Goal:** Automate sales triggers and harden SaaS lifecycle.

- [x] **Automated Selling Points**
  - [x] Implementation of `analyze-selling-points` Edge Function.
  - [x] R-22 Phase-out detector logic.
  - [x] Weather-based heatwave alerting for equipment replacement.
- [ ] **Hardware:** "ThermoKey" - 🟡 In Research.
