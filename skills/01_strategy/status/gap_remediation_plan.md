# Gap Remediation Plan 🛠️

This plan addresses the critical capability gaps identified in Phase 7.4 of the Master Execution Plan. These features are required for end-to-end business functionality.

## 1. Upgrade Admin Dispatch (`Jobs.tsx`)
**Goal:** Enable business owners to assign a specific technician to a job during creation.
**Context:** Currently, `creates job` defaults to the current user or requires manual DB entry. We need a UI to select a tech.

### Steps:
- [x] **1.1. Fetch Technicians**
    - [x] Create a helper to fetch users where `role = 'technician'`.
    - [x] Update `useSupabaseAuth` or local fetch in `Jobs.tsx` to get this list.
- [x] **1.2. Update "New Job" Dialog**
    - [x] Add a `Select` dropdown for "Assign Technician".
    - [x] Map selection to `technician_id` state.
- [x] **1.3. Modify Insert Logic**
    - [x] Update the `supabase.from('jobs').insert(...)` payload to include `technician_id`.
    - [x] Set initial status to `assigned` if a tech is selected, matches `pending` if not.
- [ ] **1.4. Update RLS (Double Check)**
    - [ ] Ensure Admins can `INSERT` jobs with `technician_id` (Standard RLS usually allows this, verified in previous sessions).

## 2. Build Triage Command Center (`TriageDashboard.tsx`)
**Goal:** Provide a dashboard to view, analyze, and convert incoming homeowner requests.
**Context:** Homeowners submit forms via `/triage`, but data sits unseen in `triage_submissions`.

### Steps:
- [x] **2.1. Create Dashboard Page**
    - [x] Create `client/pages/admin/TriageDashboard.tsx`.
    - [x] Add to Sidebar (Admin Only).
- [x] **2.2. Fetch Submissions**
    - [x] Query `triage_submissions` ordered by `created_at` desc.
    - [x] Display Card Layout: "New", "Analyzed", "Converted".
- [x] **2.3. "Convert to Job" Workflow**
    - [x] Add "Convert" button on a submission.
    - [x] Action:
        1.  Create `client` record (if not exists) using Name/Phone.
        2.  Create `job` record linked to that client.
        3.  Update `triage_submission` status to `converted`.
        4.  Navigate to Job Board.
- [x] **2.4. Display AI Analysis**
    - [x] Show the `ai_analysis` JSON (Problem summary, urgency) if available from the Edge Function.

## Execution Order
1.  **Admin Dispatch** (Quick win, unblocks manual testing).
2.  **Triage Dashboard** (Larger feature, completes the "Blue Ocean" lead gen flow).

## 3. Warranty & Asset Persistence (`WarrantyScanner.tsx`)
**Goal:** Save the scanned warranty data (Serial, Model, Manufacturer, Photo) to the client's asset profile in Supabase.
**Context:** Currently, the scanner only performs a Google lookup. We need to "Save to Asset".

### Steps:
- [ ] **3.1. Client Selection**
    - [ ] Add a dropdown to select which `Client` this asset belongs to (or "Quick Add Client").
- [ ] **3.2. Database Schema Check**
    - [ ] Ensure `assets` table has fields for `serial_number`, `model_number`, `manufacturer`, `warranty_status`, `photo_url`.
- [ ] **3.3. "Save Asset" Logic**
    - [ ] Upload the captured image to Supabase Storage (`asset-photos`).
    - [ ] Insert a new record into `assets` linked to the selected client.
    - [ ] Toast success.

---
**Status Tracking:**
*start this plan by marking items as [x] once complete.*
