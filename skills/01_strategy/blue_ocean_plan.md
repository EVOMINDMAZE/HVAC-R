---
name: Blue Ocean Strategy: Master Implementation Plan (A-Z)
description: Transform ThermoNeural from a standalone "Calculator App" into an integrated Business Intelligence Platform.
version: 1.0
---

# Blue Ocean Strategy: Master Implementation Plan (A-Z)

## Goal Description

Transform ThermoNeural from a standalone "Calculator App" into an integrated **Business Intelligence Platform**.
This plan implements the three pillars of the Blue Ocean Strategy:

1. **The Wedge (Context):** Linking technical tools to specific Jobs/Projects.
2. **Labor Ocean (Apprenticeship):** verifying skills automatically as technicians work.
3. **Insurance Ocean (Risk):** Generating certifications from technical data.

---

## User Review Required
>
> [!IMPORTANT]
> **Database Changes**: This plan requires creating new tables in Supabase (`projects`, `skill_logs`, `certifications`).
> **UX Change**: Users will be prompted to "Select a Job" when opening calculators (optional but recommended for Context).

---

## Proposed Changes

### Phase 1: The Context Engine (The Wedge)

*The foundation. Allows us to tag every action to a real-world job.*

#### [NEW] `client/context/JobContext.tsx`

- Create a `JobContext` to store the *current active job* (e.g., "Smith Residence - HVAC Install").
- **State**: `currentJobId`, `jobLocation`, `jobCustomer`.

#### [NEW] `client/components/JobSelector.tsx`

- A dropdown component to switch contexts.
- injected into `Header.tsx`.

#### [NEW] Supabase Schema (`jobs`)

```sql
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  name text not null, -- e.g. "Smith House"
  address text,
  status text default 'active', -- active, archived
  created_at timestamp with time zone default now()
);
```

### Phase 1.5: Trust & Automation (The Credibility Layer) 🛡️

*Making the data "Audit-Proof" and reducing user friction.*

#### [NEW] `client/hooks/useGeolocation.ts`

- Simple hook to get high-accuracy GPS text.
- Integrated into `JobProvider` to auto-log location on check-in.

#### [NEW] `client/hooks/useWeatherAutoFill.ts`

- Connects to OpenMeteo (Free API).
- **Automation**: When user opens "Psychrometric Calc", automatically fetch current local Outdoor Dry Bulb & Humidity.
- **Trust**: Cross-reference user inputs with actual weather "Was it really 95°F today?".

#### [NEW] Photo Evidence Support

- Update `jobs` schema to support `attachments` (bucket in Storage).
- Allow users to snap a photo of the "Gauge Readings" to attach to a calculation.

### Phase 2: Verified Digital Apprenticeship (Labor Ocean)

*Turning clicks into a resume.*

#### [NEW] `client/hooks/useSkillTracker.ts`

- A hook that listens to calculator "Save" events.
- **Logic**:
  - `trackSkill(skillType, inputs, result)`
  - Checks if `currentJobId` is active.
  - Saves to `skill_logs`.

#### [MODIFY] `client/components/SaveCalculation.tsx`

- Inject `useSkillTracker`.
- When user clicks "Save", *also* fire `trackSkill`.
- **UX**: Show a mini animation "Skill Verified +10 XP".

#### [NEW] Supabase Schema (`skill_logs`)

```sql
create table skill_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  project_id uuid references projects, -- Optional, but powerful
  skill_type text, -- 'A2L_SAFETY', 'SUPERHEAT', 'AIRFLOW'
  metadata jsonb, -- Snapshot of the calc result
  verified_at timestamp default now()
);
```

### Phase 3: Insurance Certificates (Risk Ocean)

*The monetization layer.*

#### [NEW] `client/utils/pdfGenerator.ts`

- Wrapper around `pdf-lib` (**Verified Installed**).
- Function: `generateWinterizationCert(data)`.

#### [NEW] `client/components/OwnerDashboard/RiskShield.tsx`

- A view showing "Potential Insurance Savings".
- List of recent "Certifiable Events".
- Button: "Generate Certificate ($10)".

---

## Verification Plan

### Automated Tests

- We will add unit tests for `useSkillTracker` to ensure it correctly writes to Supabase.
- We will verify `JobContext` switching.

### Manual Verification

1. **The "Wedge" Test**:
    - Create a new Project "Demo House".
    - Open A2L Calculator.
    - Select "Demo House" in the new Header Dropdown (Context).
    - Save a calculation.
    - **Success Criteria**: The calculation record in Supabase has `project_id`.

2. **The "Apprentice" Test**:
    - As a user, perform a "Target Superheat" calculation.
    - Click Save.
    - **Success Criteria**: A new row appears in `skill_logs` table.
    - **Success Criteria**: A toast notification appears "Skill Verified!".

3. **The "Insurance" Test**:
    - Go to a completed calculation.
    - Click "Export Certificate".
    - **Success Criteria**: A clean, professional PDF is downloaded named "Certificate_Winterization.pdf".
