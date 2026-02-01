# ThermoNeural Commercialization Roadmap 🚀

This roadmap takes us from our current "Prototype" state to a "100% Commercial" SaaS product (`ThermoNeural Skool`).

> [!NOTE]
> **Strategy Alignment**: This roadmap describes the **SaaS Product**, which is strictly **Cloud-First** (Supabase Cloud + Netlify). The "Member Infrastructure" (n8n Docker Nodes) described in Phase 4 is a *separate* deliverables for paid members and does **not** affect the Core App's architecture.


## Phase 1: The "Brain" (Supabase Backend) 🧠
**Goal:** Establish the source of truth for licenses and company identities.
- [x] **Database Schema**
    - [x] Create `companies` table (columns: `id`, `user_id`, `name`, `logo_url`, `primary_color`, `website`).
    - [x] Create `licenses` table (columns: `key`, `user_id`, `status`, `expires_at`, `plan_tier`).
    - [x] Set up RLS (Row Level Security) so users can only read their own data.
- [x] **Edge Functions**
    - [x] Create `verify-license` function.
        -   Input: `{ license_key }`
        -   Logic: Check if key exists AND status='active'.
        -   Output: `{ valid: true/false, plan: 'pro' }`.
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
    - [x] Create `workflow_requests` table (The "Inbox" for n8n).   
    - [x] Enable **Supabase Realtime** on this table (so React knows when n8n finishes).
    - [x] Implement React Hook `useWorkflowTrigger` for easy frontend integration.
- [x] **The Worker (n8n)**
    - [x] Create `supabase_queue_worker.json` blueprint.
        -   **Trigger:** Supabase Webhook (on INSERT).
        -   **Gatekeeper:** Calls `verify-license` Edge Function.
        -   **Action:** Executes logic (e.g., WhatsApp).
        -   **Response:** Updates Supabase row to `completed` or `failed`.
- [ ] **Deployment**
    - [ ] **Action Required:** Go to Supabase > Database > Webhooks.
    - [ ] Create Webhook: Table `workflow_requests` -> Events `INSERT` -> URL `[YOUR_N8N_WEBHOOK_URL]`.

## Phase 4: The "Digital Landlord" (Infrastructure) ☁️
**Goal:** Deliver the managed server to the customer.
- [x] **Manual Fulfillment Protocol (The "MVP")**
    - [x] Write the `server_setup.sh` script (auto-installs Docker, n8n, Traefik).
    - [ ] Document the "New Customer Checklist":
        1.  Receive Stripe webhook email.
        2.  Spin up VPS Server (Vultr High Frequency).
        3.  Run `server_setup.sh`.
        4.  Email IP + Login to customer.

## Phase 5: The "Cash Register" (Payments & Sync) 💰
**Goal:** Automate access granting.
- [ ] **Stripe Integration**
    - [ ] Configure `stripe-webhook` in Supabase.
    - [ ] On `checkout.session.completed`:
        -   Create `companies` record.
        -   Generate new `licenses` key.
        -   Send "Welcome" email with License Key.

## Phase 6: Launch & Polish 🚀
- [ ] **Final QA:** End-to-end test (Buy -> Login -> Setup Brand -> Run n8n).
- [ ] **Documentation:** Create the "Getting Started" guide for Skool.
- [ ] **Go Live:** Connect Stripe Live keys.

## Phase 7: Revenue Expansion (The Trident) 🔱
**Goal:** Multiply LTV through Hardware, Fintech, and Enterprise tiers.
*   **See Strategy:** [Revenue Expansion Plan](./revenue_expansion_plan.md)
*   **Tracks:**
    *   [x] **Fintech:** "ThermoPay" (Invoice Financing) - ✅ MVP Ready.
    *   [x] **Enterprise:** "Fleet Command" (Manager Dashboard) - ✅ Route splitting optimized.
    *   [/] **Hardware:** "ThermoKey" (Bluetooth Lock-in) - 🟡 In Research.
