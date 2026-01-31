# ThermoNeural Application Analysis

## 1. Executive Summary

**ThermoNeural** is a robust, modern Progressive Web Application (PWA) designed for HVAC professionals. The application is well-architected for its stage, leveraging a "Supabase-first" approach for data persistence and authentication, while retaining a Node.js/Express backend for complex engineering calculations and business logic.

The codebase demonstrates a clear understanding of modern web development practices (React, Vite, TypeScript, Tailwind), though it shows signs of rapid iteration ("move fast and break things") typical of early-stage startups. This has led to some technical debt, particularly in code duplication and component complexity.

## 2. Architecture Review

### 2.1 Hybrid Architecture
The application uses a hybrid model:
*   **Client (SPA):** A React application (`client/`) served via Vite. It communicates **directly** with Supabase for standard CRUD operations (e.g., managing Jobs, Auth).
*   **Server (API):** An Express application (`server/`) that handles specialized logic (PDF generation, thermodynamic calculations, billing).
*   **Mobile:** The `capacitor.config.ts` and `android/ios` folders indicate a "Write Once, Run Everywhere" strategy, wrapping the web app for native mobile stores.

### 2.2 Database & Data Flow
*   **Supabase Centric:** The database schema is managed via Supabase Migrations (`supabase/migrations/*.sql`), which is a best practice.
*   **Inconsistent Data Fetching:** There is a split in how data is accessed.
    *   *Direct:* `Jobs.tsx` queries Supabase directly (`supabase.from('jobs')...`).
    *   *Proxy:* Engineering calculations go through `/api/engineering`.
    *   *Risk:* This split increases cognitive load for developers ("Do I use the API or the DB client?").

## 3. Code Quality & Maintainability

### 3.1 Strengths
*   **Modern Stack:** React 18, Vite, and TypeScript provide a solid, performant foundation.
*   **UI/UX:** The use of `shadcn/ui`, `framer-motion`, and `lucide-react` results in a polished, professional interface.
*   **Planning:** The presence of detailed markdown files (`MASTER_EXECUTION_PLAN.md`, `GAP_REMEDIATION_PLAN.md`) shows excellent project management and forethought.

### 3.2 Weaknesses (Technical Debt)
*   **Type Duplication (DRY Violation):**
    *   The `Database` interface in `client/lib/supabase.ts` manually defines table structures.
    *   Components like `client/pages/Jobs.tsx` redefine these interfaces (e.g., `interface Job`).
    *   *Consequence:* Changing the DB schema requires updating code in multiple places, leading to bugs.
*   **"God Components":**
    *   `client/pages/Jobs.tsx` is responsible for fetching data, managing UI state (modals, filters), and rendering. It is becoming large and difficult to test.
    *   *Recommendation:* Extract sub-components like `<JobCard />`, `<CreateJobDialog />`, and `<JobFilters />`.
*   **State Management:**
    *   Reliance on local `useState` in pages. As the app grows, this will lead to "prop drilling."
    *   `useSupabaseAuth` is a good start for global auth state.

## 4. Security Posture

### 4.1 Row Level Security (RLS)
The application correctly leverages Postgres RLS. Migrations like `20260129160000_tech_permissions.sql` explicitly define who can read/write data. This is the gold standard for Supabase apps.

### 4.2 Authentication
*   **Dual Auth:** The server accepts both Supabase JWTs and legacy tokens (`authenticateEither` middleware). While flexible, this increases the attack surface.
*   **Environment Variables:** Sensitive keys are correctly loaded via `dotenv`, and the client code includes checks to warn developers if keys are default/missing.

## 5. Testing & Reliability

### 5.1 Test Coverage
*   **E2E:** Playwright is configured (`playwright.config.ts`) and tests exist in `e2e/`. This provides a good safety net for critical flows.
*   **Unit Tests:** There is a noticeable lack of unit tests for React components (`client/__tests__` is missing). Complex logic in components is currently verified only by manual testing or E2E.

## 6. Roadmap Alignment

Based on `MASTER_EXECUTION_PLAN.md`:
*   **Complete:** Phase 1 (EPA), Phase 5 (Triage), Phase 6 (Mobile/Tech Experience).
*   **In Progress:** Phase 2 (n8n/Automation), Phase 7 (Deployment).
*   **Pending:** Phase 3 (Indoor Health), Phase 4 (Warranty Auto-Pilot).

The codebase reflects this status accurately. The "Triage" and "EPA" modules are present in the file structure.

## 7. Recommendations

1.  **Generate Types Automatically:** Stop manually writing TypeScript interfaces for Supabase tables. Use the Supabase CLI (`supabase gen types`) to generate the `Database` type definition directly from the live DB schema.
2.  **Refactor `Jobs.tsx`:** Break this component down. Move the Supabase data fetching logic into a custom hook (e.g., `useJobs()`) to separate concern of *data loading* from *rendering*.
3.  **Standardize API Access:** Decide on a pattern. If Supabase is the "source of truth", prefer using Supabase Edge Functions for business logic over a separate Express server, or clearly document *why* the Express server exists (e.g., for libraries that don't run in Edge runtime).
4.  **Add Unit Tests:** Introduce `vitest` for testing utility functions and complex React hooks, filling the gap between "no tests" and "slow E2E tests".
