# Blue Ocean Implementation Checklist

## Phase 1: The Context Engine (The Wedge) 🏗️
- [x] **Database Setup**
    - [x] Create `projects` table in Supabase (id, name, address, status).
    - [x] Add RLS (Row Level Security) policies for `projects`.
    - [x] Add `project_id` foreign key to `calculations` table (if not exists).
- [x] **Frontend Context**
    - [x] Create `client/context/JobContext.tsx`.
    - [x] Wrap `App.tsx` with `JobProvider`.
- [x] **UI Components**
    - [x] Create `JobSelector` component (Dropdown).
    - [x] Integrate `JobSelector` into `Header.tsx`.
    - [x] Create "Create New Project" Modal.

- [x] **Geolocation**
    - [x] Create `useGeolocation` hook.
    - [x] Auto-capture coordinates on `SaveCalculation`.
- [x] **Weather Intelligence**
    - [x] Create `useWeatherAutoFill` hook (OpenMeteo API).
    - [x] Integrate into `PsychrometricCalculator` (Air Density updated).
    - [x] Integrate into `TargetSuperheatCalculator` (Target Superheat updated).
- [x] **Photo Evidence**
    - [x] Create Storage Bucket `calculation-evidence` in Supabase.
    - [x] Add Photo Upload button to `SaveCalculation` dialog.

## Phase 2: Digital Apprenticeship (Labor Ocean) 🎓
- [x] **Database Setup**
    - [x] Create `skill_definitions` table (optional, skipping for now).
    - [x] Create `skill_logs` table (user_id, skill_type, result, xp).
- [x] **Logic Layer**
    - [x] Create `useSkillTracker` hook.
    - [x] Connect `useSkillTracker` to `SaveCalculation`.
- [x] **User Experience**
    - [x] Add "XP Gained" Toast notification.
    - [x] Create `/career` (or `/logbook`) page to view verified skills.

## Phase 3: Insurance Certificates (Risk Ocean) 💰
- [x] **PDF Engine**
    - [x] Create `jsPDF` or `pdf-lib` service for generating professional PDFs.
    - [x] Templates: "Winterization", "Commissioning", "Maintenance".
- [x] **Owner Dashboard**
    - [x] Create `RiskShield` component (Dashboard Card).
    - [x] "Generate Certificate" button logic.
- [x] **Data Integration**
    - [x] Pull data from `projects` and `calculations` tables.
